/**
 * send-push — Supabase Edge Function
 *
 * Sends FCM push notifications using the FCM HTTP V1 API (modern, OAuth2-based).
 * The legacy server-key API is disabled; this uses a Google Service Account.
 *
 * POST body (JSON):
 * {
 *   "userIds": ["uuid1", "uuid2", ...],  // required
 *   "title": "Task Assigned",            // required
 *   "body":  "You have a new task",      // required
 *   "data":  { "taskId": "..." }         // optional
 * }
 *
 * Required Supabase secrets:
 *   FCM_SERVICE_ACCOUNT_JSON — full contents of the Firebase service account JSON key file
 *   SUPABASE_URL             — auto-set by Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — auto-set by Supabase
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as encodeBase64Url } from "https://deno.land/std@0.168.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushRequest {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface TokenRow {
  token: string;
  provider: string;
}

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

// ── JWT / OAuth2 helpers for FCM V1 ─────────────────────────────────────────

function base64UrlEncode(str: string): string {
  return encodeBase64Url(new TextEncoder().encode(str));
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );

  const signingInput = `${header}.${payload}`;

  // Import the RSA private key
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );
  const sig = encodeBase64Url(new Uint8Array(signature));
  const jwt = `${signingInput}.${sig}`;

  // Exchange JWT for OAuth2 access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth2:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const tokenJson = await tokenRes.json();
  if (!tokenJson.access_token) {
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenJson)}`);
  }
  return tokenJson.access_token as string;
}

// ── Send individual FCM V1 message ──────────────────────────────────────────

async function sendFcmV1(
  token: string,
  title: string,
  body: string,
  data: Record<string, string>,
  projectId: string,
  accessToken: string,
): Promise<void> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;
  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data,
        android: { priority: "HIGH", notification: { sound: "default" } },
        apns: { headers: { "apns-priority": "10" } },
      },
    }),
  });
}

// ── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const saJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
    if (!saJson) {
      return new Response(
        JSON.stringify({ error: "FCM_SERVICE_ACCOUNT_JSON not configured. Set it with: supabase secrets set FCM_SERVICE_ACCOUNT_JSON='<json>'" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const sa = JSON.parse(saJson) as ServiceAccount;
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = (await req.json()) as PushRequest;
    const { userIds, title, body: msgBody, data = {} } = body;

    if (!userIds?.length || !title || !msgBody) {
      return new Response(
        JSON.stringify({ error: "userIds, title, body are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch FCM tokens for target users — new table (fcm_tokens) first, fall back to legacy.
    let tokens: string[] = [];
    const primary = await supabase
      .from("fcm_tokens")
      .select("token")
      .in("user_id", userIds);
    if (!primary.error && primary.data?.length) {
      tokens = (primary.data as { token: string }[]).map((r) => r.token);
    } else {
      const legacy = await supabase
        .from("user_push_tokens")
        .select("token, provider")
        .in("user_id", userIds)
        .eq("provider", "fcm");
      if (legacy.error) throw legacy.error;
      tokens = ((legacy.data ?? []) as TokenRow[]).map((r) => r.token);
    }

    if (!tokens.length) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No FCM tokens found for these users" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Get OAuth2 access token once and reuse for all sends
    const accessToken = await getAccessToken(sa);

    // FCM V1 sends one message per token (no batch endpoint in V1)
    const stringData: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      stringData[k] = String(v);
    }

    // Collect results so we can prune tokens that FCM rejects as UNREGISTERED / INVALID.
    const results = await Promise.allSettled(
      tokens.map(async (token) => {
        const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
        const fcmRes = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title, body: msgBody },
              data: stringData,
              android: { priority: "HIGH", notification: { sound: "default", channel_id: "onrol_high" } },
              apns: { headers: { "apns-priority": "10" } },
            },
          }),
        });
        const json = await fcmRes.json().catch(() => ({}));
        const errStatus = json?.error?.status as string | undefined;
        if (errStatus === "UNREGISTERED" || errStatus === "INVALID_ARGUMENT" || errStatus === "NOT_FOUND") {
          // Stale token — remove it so we don't keep hammering it.
          await supabase.from("fcm_tokens").delete().eq("token", token);
        }
        return { token, ok: fcmRes.ok, status: errStatus ?? null };
      }),
    );

    const sent = results.filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<{ ok: boolean }>).value.ok).length;

    return new Response(
      JSON.stringify({ sent, total: tokens.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
