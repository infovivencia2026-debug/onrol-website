import "dotenv/config";
import express from "express";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.LOCAL_API_PORT || 8787);

function getAdminSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL (or VITE_SUPABASE_URL) / SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function readBearerToken(req) {
  const value = req.headers.authorization;
  if (!value || !value.startsWith("Bearer ")) return null;
  return value.slice("Bearer ".length);
}

async function getAuthUserId(req) {
  const token = readBearerToken(req);
  if (!token) return null;
  const supabaseAdmin = getAdminSupabase();
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

function getErrorMessage(error, fallback) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function generateMeetingCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function parseSubscriptionKeys(subscription) {
  const p256dh = subscription?.keys?.p256dh || subscription?.toJSON?.()?.keys?.p256dh || null;
  const auth = subscription?.keys?.auth || subscription?.toJSON?.()?.keys?.auth || null;
  return { p256dh, auth };
}

function isMissingColumn(error, columnName) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? error.code : undefined;
  const message = "message" in error ? error.message : undefined;
  return code === "42703" || (typeof message === "string" && message.includes(columnName));
}

function ensureVapidConfigured() {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || process.env.VITE_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:info@onrol.in";
  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error("Missing VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY.");
  }
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "local-api" });
});

// SSE proxy: verify Supabase JWT, then pipe the CRM /api/messenger/stream.
// EventSource cannot set custom headers, so JWT may arrive as ?access_token=…
app.get("/api/messenger/stream", async (req, res) => {
  try {
    let userId = await getAuthUserId(req);
    if (!userId) {
      const token = typeof req.query?.access_token === "string" ? req.query.access_token : null;
      if (token) {
        try {
          const supabaseAdmin = getAdminSupabase();
          const { data, error } = await supabaseAdmin.auth.getUser(token);
          if (!error && data.user) userId = data.user.id;
        } catch {
          // fall through to 401
        }
      }
    }
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const crmUrl = process.env.CRM_EVENT_URL;
    const secret = process.env.ONROL_EVENT_SECRET;
    if (!crmUrl || !secret) {
      return res.status(503).json({ error: "CRM_EVENT_URL / ONROL_EVENT_SECRET not configured." });
    }
    let base;
    try { const u = new URL(crmUrl); base = `${u.protocol}//${u.host}`; }
    catch { return res.status(503).json({ error: "CRM_EVENT_URL is not a valid URL." }); }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const controller = new AbortController();
    const cleanup = () => { try { controller.abort(); } catch { /* ignore */ } };
    req.on("close", cleanup);
    req.on("aborted", cleanup);

    const upstream = await fetch(`${base}/api/messenger/stream?userExternalId=${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${secret}`, accept: "text/event-stream" },
      signal: controller.signal,
    });
    if (!upstream.ok || !upstream.body) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: `Upstream ${upstream.status}` })}\n\n`);
      return res.end();
    }
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) res.write(decoder.decode(value, { stream: true }));
      }
    } catch {
      // upstream closed or aborted
    } finally {
      try { res.end(); } catch { /* already ended */ }
    }
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ error: getErrorMessage(error, "stream proxy failed") });
    }
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ message: getErrorMessage(error, "stream proxy failed") })}\n\n`);
      res.end();
    } catch { /* ignore */ }
  }
});

app.post("/api/ai/automation-assistant", async (req, res) => {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const prompt = String(req.body?.prompt || "").trim();
    const context = String(req.body?.context || "").trim();
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const mistralApiKey = process.env.MISTRAL_API_KEY;
    if (!mistralApiKey) {
      return res.status(500).json({ error: "Missing MISTRAL_API_KEY in server environment." });
    }

    const model = process.env.MISTRAL_MODEL || "mistral-small-latest";
    const systemPrompt = [
      "You are ONROL Automation Copilot for an internal task-manager CRM.",
      "Return concise, practical actions admins can apply immediately.",
      "Focus only on workflow automation, task operations, meetings, and follow-up hygiene.",
      "Output plain text with short bullet points.",
    ].join(" ");
    const finalPrompt = context
      ? `Context:\n${context}\n\nUser request:\n${prompt}`
      : prompt;

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mistralApiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: finalPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const failText = await response.text();
      return res.status(502).json({ error: `Mistral API failed: ${failText || response.statusText}` });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") {
      return res.status(502).json({ error: "No assistant response returned by model." });
    }

    return res.status(200).json({ ok: true, text });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error, "Failed to generate AI suggestion") });
  }
});

app.post("/api/meetings/create", async (req, res) => {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const payload = req.body || {};
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const meetingType = payload.meeting_type;

    if (!title) return res.status(400).json({ error: "Meeting title is required" });
    if (!["instant", "scheduled"].includes(meetingType)) {
      return res.status(400).json({ error: "Invalid meeting type" });
    }

    if (meetingType === "scheduled") {
      if (!payload.scheduled_start || !payload.scheduled_end) {
        return res.status(400).json({ error: "Scheduled start and end are required" });
      }
      const start = new Date(payload.scheduled_start).getTime();
      const end = new Date(payload.scheduled_end).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return res.status(400).json({ error: "Scheduled end must be after scheduled start" });
      }
    }

    const supabaseAdmin = getAdminSupabase();
    let meeting = null;
    let meetingError = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateMeetingCode();
      const result = await supabaseAdmin
        .from("meetings")
        .insert({
          code,
          title,
          description: typeof payload.description === "string" ? payload.description.trim() || null : null,
          host_id: userId,
          meeting_type: meetingType,
          scheduled_start: meetingType === "scheduled" ? payload.scheduled_start : null,
          scheduled_end: meetingType === "scheduled" ? payload.scheduled_end : null,
          status: meetingType === "instant" ? "ongoing" : "scheduled",
          max_participants: Number(payload.max_participants) > 0 ? Number(payload.max_participants) : 100,
          actual_start: meetingType === "instant" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (!result.error && result.data) {
        meeting = result.data;
        meetingError = null;
        break;
      }
      meetingError = result.error;
    }

    if (!meeting) {
      const detail = getErrorMessage(meetingError, "Failed to create meeting");
      return res.status(500).json({ error: detail });
    }

    if (meetingType === "instant") {
      await supabaseAdmin.from("meeting_participants").insert({
        meeting_id: meeting.id,
        user_id: userId,
        joined_at: new Date().toISOString(),
        participant_status: "joined",
        is_presenter: true,
      });
    }

    const participantIds = Array.isArray(payload.participant_ids) ? payload.participant_ids : [];
    if (participantIds.length > 0) {
      const uniqueIds = Array.from(new Set(participantIds.filter((id) => id && id !== userId)));
      let resolvedParticipantIds = [...uniqueIds];
      if (uniqueIds.length > 0) {
        try {
          const { data: officeRows } = await supabaseAdmin
            .from("office_users")
            .select("id,email")
            .in("id", uniqueIds);
          const candidateEmails = (officeRows || []).map((row) => row.email).filter(Boolean);
          const [authById, authByEmail] = await Promise.all([
            supabaseAdmin.schema("auth").from("users").select("id").in("id", uniqueIds),
            candidateEmails.length
              ? supabaseAdmin.schema("auth").from("users").select("id").in("email", candidateEmails)
              : Promise.resolve({ data: [], error: null }),
          ]);
          const authIds = new Set([
            ...((authById.data || []).map((row) => row.id)),
            ...((authByEmail.data || []).map((row) => row.id)),
          ]);
          if (authIds.size > 0) {
            resolvedParticipantIds = Array.from(authIds).filter((id) => id !== userId);
          }
        } catch (resolveError) {
          console.warn("Unable to resolve meeting invite participant IDs:", resolveError);
        }
      }
      if (resolvedParticipantIds.length > 0) {
        const participantRows = resolvedParticipantIds.map((participantId) => ({
          meeting_id: meeting.id,
          user_id: participantId,
          joined_at: new Date().toISOString(),
          participant_status: "invited",
        }));
        await supabaseAdmin.from("meeting_participants").insert(participantRows);
        await supabaseAdmin.from("meeting_invites").upsert(
          resolvedParticipantIds.map((participantId) => ({
            meeting_id: meeting.id,
            invited_by_id: userId,
            invited_user_id: participantId,
            invite_status: "pending",
          })),
          { onConflict: "meeting_id,invited_user_id" },
        );
        await supabaseAdmin.from("notifications").insert(
          resolvedParticipantIds.map((participantId) => ({
            user_id: participantId,
            type: "meeting_invite",
            title: `Meeting invite: ${meeting.title}`,
            message: `${meeting.title} • Code ${meeting.code}`,
            severity: "medium",
            action_url: `/meeting/join/${meeting.code}`,
            metadata: {
              meeting_id: meeting.id,
              meeting_code: meeting.code,
              invited_by: userId,
            },
          })),
        );
      }
    }

    return res.status(201).json(meeting);
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error, "Failed to create meeting") });
  }
});

app.get("/api/meetings/list", async (req, res) => {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const supabaseAdmin = getAdminSupabase();
    let publicTeamOngoingEnabled = false;
    try {
      const { data: visibilityRow } = await supabaseAdmin
        .from("automation_settings")
        .select("value")
        .eq("key", "meeting_visibility")
        .maybeSingle();
      const value = visibilityRow?.value;
      publicTeamOngoingEnabled = Boolean(value && typeof value === "object" && value.public_team_ongoing_meetings);
    } catch {
      publicTeamOngoingEnabled = false;
    }

    const [hostedRes, participantRes, inviteRes, publicOngoingRes] = await Promise.all([
      supabaseAdmin.from("meetings").select("*").eq("host_id", userId).limit(200),
      supabaseAdmin.from("meeting_participants").select("meeting_id").eq("user_id", userId).limit(500),
      supabaseAdmin.from("meeting_invites").select("meeting_id").eq("invited_user_id", userId).limit(500),
      publicTeamOngoingEnabled
        ? supabaseAdmin.from("meetings").select("id").eq("status", "ongoing").limit(500)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (hostedRes.error) return res.status(500).json({ error: hostedRes.error.message });
    if (participantRes.error) return res.status(500).json({ error: participantRes.error.message });
    if (inviteRes.error) return res.status(500).json({ error: inviteRes.error.message });
    if (publicOngoingRes.error) return res.status(500).json({ error: publicOngoingRes.error.message });

    const meetingIds = new Set();
    (hostedRes.data || []).forEach((meeting) => {
      if (meeting?.id) meetingIds.add(String(meeting.id));
    });
    (participantRes.data || []).forEach((row) => {
      if (row?.meeting_id) meetingIds.add(String(row.meeting_id));
    });
    (inviteRes.data || []).forEach((row) => {
      if (row?.meeting_id) meetingIds.add(String(row.meeting_id));
    });
    (publicOngoingRes.data || []).forEach((row) => {
      if (row?.id) meetingIds.add(String(row.id));
    });

    if (meetingIds.size === 0) return res.status(200).json([]);

    const { data: unionMeetings, error: unionError } = await supabaseAdmin
      .from("meetings")
      .select("*")
      .in("id", Array.from(meetingIds))
      .limit(500);
    if (unionError) return res.status(500).json({ error: unionError.message });

    const meetings = (unionMeetings || []).sort((a, b) => {
      const aTime = new Date(a?.scheduled_start || a?.actual_start || a?.created_at || 0).getTime();
      const bTime = new Date(b?.scheduled_start || b?.actual_start || b?.created_at || 0).getTime();
      return bTime - aTime;
    });

    return res.status(200).json(meetings);
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error, "Failed to fetch meetings") });
  }
});

app.post("/api/meetings/:id/join", async (req, res) => {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const meetingId = req.params.id;
    if (!meetingId) return res.status(400).json({ error: "Meeting ID is required" });

    const supabaseAdmin = getAdminSupabase();
    const { data: meeting, error: meetingError } = await supabaseAdmin
      .from("meetings")
      .select("id,status,is_locked,max_participants")
      .eq("id", meetingId)
      .single();

    if (meetingError || !meeting) return res.status(404).json({ error: "Meeting not found" });
    if (meeting.is_locked) return res.status(403).json({ error: "Meeting is locked" });

    const { count } = await supabaseAdmin
      .from("meeting_participants")
      .select("*", { count: "exact", head: true })
      .eq("meeting_id", meetingId)
      .eq("participant_status", "joined");
    if (count && count >= meeting.max_participants) {
      return res.status(429).json({ error: "Meeting is full" });
    }

    const { data: existing } = await supabaseAdmin
      .from("meeting_participants")
      .select("id,participant_status")
      .eq("meeting_id", meetingId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing?.id) {
      if (existing.participant_status !== "joined") {
        const { error: updateError } = await supabaseAdmin
          .from("meeting_participants")
          .update({ participant_status: "joined", joined_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updateError) return res.status(500).json({ error: updateError.message });
      }
    } else {
      const { error: insertError } = await supabaseAdmin.from("meeting_participants").insert({
        meeting_id: meetingId,
        user_id: userId,
        joined_at: new Date().toISOString(),
        participant_status: "joined",
      });
      if (insertError) return res.status(500).json({ error: insertError.message });
    }

    if (meeting.status === "scheduled") {
      await supabaseAdmin
        .from("meetings")
        .update({ status: "ongoing", actual_start: new Date().toISOString() })
        .eq("id", meetingId);
    }

    await supabaseAdmin
      .from("meeting_invites")
      .update({ invite_status: "accepted", response_at: new Date().toISOString() })
      .eq("meeting_id", meetingId)
      .eq("invited_user_id", userId);

    return res.status(200).json({ ok: true, message: "Joined meeting" });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error, "Failed to join meeting") });
  }
});

app.post("/api/meetings/:id/leave", async (req, res) => {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const meetingId = req.params.id;
    if (!meetingId) return res.status(400).json({ error: "Meeting ID is required" });

    const supabaseAdmin = getAdminSupabase();
    const { error: leaveError } = await supabaseAdmin
      .from("meeting_participants")
      .update({ participant_status: "left", left_at: new Date().toISOString() })
      .eq("meeting_id", meetingId)
      .eq("user_id", userId);

    if (leaveError) return res.status(500).json({ error: leaveError.message });
    return res.status(200).json({ ok: true, message: "Left meeting" });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error, "Failed to leave meeting") });
  }
});

app.post("/api/push/subscribe", async (req, res) => {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const subscription = req.body?.subscription;
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: "Invalid subscription payload" });
    }

    const { p256dh, auth } = parseSubscriptionKeys(subscription);
    const supabaseAdmin = getAdminSupabase();
    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        expiration_time: subscription.expirationTime ?? null,
        user_agent: req.headers["user-agent"] ?? null,
        updated_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error, "Subscription save failed") });
  }
});

app.post("/api/push/send-test", async (req, res) => {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    ensureVapidConfigured();
    const supabaseAdmin = getAdminSupabase();
    const { data, error } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", userId);
    if (error) return res.status(500).json({ error: error.message });

    const subscriptions = data || [];
    if (!subscriptions.length) {
      return res.status(400).json({ error: "No push subscription found for this user. Enable notifications first." });
    }

    const payload = JSON.stringify({
      title: "ONROL Task Manager",
      body: "Test notification delivered successfully.",
      url: "/task/app",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    });

    let delivered = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        delivered += 1;
      } catch (pushErr) {
        const statusCode = pushErr?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    return res.status(200).json({ ok: true, delivered, total: subscriptions.length });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error, "Failed to send test notification") });
  }
});

app.post("/api/push/send-reminders", async (req, res) => {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    ensureVapidConfigured();
    const supabaseAdmin = getAdminSupabase();
    const loadPendingNotifications = async () => {
      const primary = await supabaseAdmin
        .from("notifications")
        .select("id,user_id,related_visit_task_id,related_institution_id,type,title,message,action_url")
        .eq("user_id", userId)
        .eq("is_push_sent", false)
        .eq("is_read", false)
        .eq("severity", "high")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!primary.error) return primary;
      if (!isMissingColumn(primary.error, "user_id")) return primary;

      return supabaseAdmin
        .from("notifications")
        .select("id,related_visit_task_id,related_institution_id,type,title,message,action_url")
        .eq("recipient_id", userId)
        .eq("is_push_sent", false)
        .eq("is_read", false)
        .eq("severity", "high")
        .order("created_at", { ascending: false })
        .limit(5);
    };

    const [subscriptionsResult, notificationsResult, preferenceResult] = await Promise.all([
      supabaseAdmin.from("push_subscriptions").select("id,endpoint,p256dh,auth").eq("user_id", userId),
      loadPendingNotifications(),
      supabaseAdmin.from("user_notification_preferences").select("push_enabled").eq("user_id", userId).maybeSingle(),
    ]);

    if (subscriptionsResult.error) return res.status(500).json({ error: subscriptionsResult.error.message });
    if (notificationsResult.error) return res.status(500).json({ error: notificationsResult.error.message });

    const pushEnabled = preferenceResult.data?.push_enabled ?? false;
    const subscriptions = subscriptionsResult.data || [];
    const notifications = notificationsResult.data || [];
    if (!pushEnabled) return res.status(200).json({ ok: true, delivered: 0, total: 0, skipped: "push_disabled" });
    if (!subscriptions.length) return res.status(400).json({ error: "No push subscription found for this user." });
    if (!notifications.length) return res.status(200).json({ ok: true, delivered: 0, total: 0 });

    let delivered = 0;
    for (const notification of notifications) {
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message,
        url: notification.action_url || "/task/app",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
      });

      let anySent = false;
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          );
          delivered += 1;
          anySent = true;
        } catch (pushErr) {
          const statusCode = pushErr?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }

      if (anySent) {
        await supabaseAdmin
          .from("notifications")
          .update({ is_push_sent: true, push_sent_at: new Date().toISOString() })
          .eq("id", notification.id);
      }
    }

    return res.status(200).json({ ok: true, delivered, total: notifications.length });
  } catch (error) {
    return res.status(500).json({ error: getErrorMessage(error, "Failed to send reminder notifications") });
  }
});

app.listen(PORT, () => {
  console.log(`[local-api] running on http://127.0.0.1:${PORT}`);
});
