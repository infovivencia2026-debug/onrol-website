import { getAuthUserId, getErrorMessage } from "../_utils";
import { crmLeaveMeeting, crmListParticipants, crmEndMeeting } from "../_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

/**
 * POST /api/meetings/[id]/leave
 *
 * Storage moved to the CRM in Phase 10. Auth validation stays on Supabase.
 * If the last joined participant leaves, the meeting is auto-ended.
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

    await crmLeaveMeeting(meetingId, userId);

    // If nobody is still joined, end the meeting (matches legacy behaviour).
    try {
      const participants = await crmListParticipants(meetingId);
      const remaining = participants.filter((p) => p.participant_status === "joined").length;
      if (remaining === 0) {
        await crmEndMeeting(meetingId);
      }
    } catch (e) {
      // Best-effort; don't fail the leave on auto-end errors.
      console.warn("[meetings/leave] auto-end check failed:", e instanceof Error ? e.message : e);
    }

    return res.status(200).json({ ok: true, message: "Left meeting" });
  } catch (error: unknown) {
    console.error("Error in meetings/[id]/leave:", error);
    return res.status(500).json({ error: getErrorMessage(error, "Failed to leave meeting") });
  }
}
