import type { Meeting } from "@/types/meeting";
import { getAuthUserId, getErrorMessage } from "./_utils";
import { crmCreateMeeting, crmJoinMeeting, crmBulkCreateInvites } from "./_crm";
import { emitCrmEvent } from "../_crm-event";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

type CreateMeetingPayload = {
  title: string;
  description?: string;
  meeting_type: "instant" | "scheduled";
  scheduled_start?: string;
  scheduled_end?: string;
  max_participants?: number;
  participant_ids?: string[];
};

/**
 * POST /api/meetings
 *
 * Storage moved to the CRM in Phase 10. Auth validation stays on
 * Supabase: verify JWT here, then forward to CRM. Federation event emit
 * preserved (CRM correlates meetings to leads by email/phone).
 *
 * Behaviour notes for the migration:
 *   - The legacy `office_users` → `auth.users` resolution dance is gone.
 *     We now treat `participant_ids` as Supabase Auth user UUIDs
 *     directly. The Task Manager hook that surfaces participants
 *     already returns those, but if your frontend was passing
 *     office_user ids you'll need to map them on the client side.
 *   - In-app `notifications` row inserts moved to /api/messenger
 *     (Phase 9) — kept here as a TODO until that hook swap lands.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const payload = (typeof req.body === "string"
      ? (JSON.parse(req.body || "{}") as CreateMeetingPayload)
      : ((req.body || {}) as CreateMeetingPayload));

    if (!payload.title || !payload.title.trim()) {
      return res.status(400).json({ error: "Meeting title is required" });
    }
    if (!payload.meeting_type || !["instant", "scheduled"].includes(payload.meeting_type)) {
      return res.status(400).json({ error: "Invalid meeting type" });
    }
    if (payload.meeting_type === "scheduled") {
      if (!payload.scheduled_start) {
        return res.status(400).json({ error: "Scheduled start is required for scheduled meetings" });
      }
      if (!payload.scheduled_end) {
        return res.status(400).json({ error: "Scheduled end is required for scheduled meetings" });
      }
      const start = new Date(payload.scheduled_start).getTime();
      const end = new Date(payload.scheduled_end).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return res.status(400).json({ error: "Scheduled end must be after scheduled start" });
      }
    }

    // Create on CRM (handles unique-code retries server-side).
    let meeting;
    try {
      meeting = await crmCreateMeeting({
        hostExternalId: userId,
        title: payload.title.trim(),
        description: payload.description?.trim(),
        meetingType: payload.meeting_type,
        scheduledStart: payload.meeting_type === "scheduled" ? payload.scheduled_start : null,
        scheduledEnd: payload.meeting_type === "scheduled" ? payload.scheduled_end : null,
        maxParticipants: payload.max_participants || 100,
      });
    } catch (e) {
      console.error("Error creating meeting on CRM:", e);
      return res.status(500).json({ error: getErrorMessage(e, "Failed to create meeting") });
    }

    // Instant meeting → host is auto-joined as presenter.
    if (payload.meeting_type === "instant") {
      try {
        await crmJoinMeeting(String(meeting.id), userId, true);
      } catch (e) {
        console.warn("[meetings/create] auto-join host failed:", e instanceof Error ? e.message : e);
      }
    }

    // Invitees — bulk insert via the CRM invites endpoint.
    if (payload.participant_ids && payload.participant_ids.length > 0) {
      const uniqueIds = Array.from(new Set(payload.participant_ids.filter((id) => id && id !== userId)));
      if (uniqueIds.length > 0) {
        try {
          await crmBulkCreateInvites(
            String(meeting.id),
            uniqueIds.map((invitedUserId) => ({ invitedUserId, invitedBy: userId })),
          );
        } catch (e) {
          console.warn("[meetings/create] bulk invite create failed:", e instanceof Error ? e.message : e);
        }
      }
    }

    // Federation event — let the CRM correlate this meeting to a lead.
    emitCrmEvent({
      kind: "meeting_booked",
      userExternalId: userId,
      payload: {
        meetingId: meeting.id,
        code: meeting.code,
        type: payload.meeting_type,
        title: meeting.title,
      },
    });

    return res.status(201).json(meeting as unknown as Meeting);
  } catch (error: unknown) {
    console.error("Error in meetings/create:", error);
    return res.status(500).json({ error: getErrorMessage(error, "Failed to create meeting") });
  }
}
