import { getAuthUserId, getErrorMessage } from "../_utils";
import { crmGetMeeting, crmJoinMeeting, crmListParticipants } from "../_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

/**
 * POST /api/meetings/[id]/join
 *
 * Storage moved to the CRM in Phase 10. Auth validation stays on
 * Supabase: we verify the JWT here, then call the CRM. Lock + capacity
 * checks happen against the CRM's view of the meeting.
 *
 * NOTE: `is_locked` and `invite_status="accepted"` propagation from the
 * legacy schema aren't yet first-class fields on the CRM `meetings`
 * table. For now, the lock check is skipped (CRM treats every meeting
 * as joinable while its `status` is scheduled/ongoing). Lock support
 * lands when we add the `is_locked` column to migration 0084.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const meetingId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
    if (!meetingId) return res.status(400).json({ error: "Meeting ID is required" });

    const meeting = await crmGetMeeting(meetingId);
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });
    if (meeting.status === "ended" || meeting.status === "cancelled") {
      return res.status(403).json({ error: `Meeting is ${meeting.status}` });
    }

    // Soft capacity check.
    const maxParticipants = Number(meeting.max_participants) || 100;
    if (maxParticipants > 0) {
      const participants = await crmListParticipants(meetingId);
      const joined = participants.filter((p) => p.participant_status === "joined").length;
      if (joined >= maxParticipants) {
        return res.status(429).json({ error: "Meeting is full" });
      }
    }

    await crmJoinMeeting(meetingId, userId);
    return res.status(200).json({ ok: true, message: "Joined meeting" });
  } catch (error: unknown) {
    console.error("Error in meetings/[id]/join:", error);
    return res.status(500).json({ error: getErrorMessage(error, "Failed to join meeting") });
  }
}
