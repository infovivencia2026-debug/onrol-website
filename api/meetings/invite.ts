import { getAuthUserId, getErrorMessage } from "./_utils";
import { crmGetMeetingByCode, crmBulkCreateInvites } from "./_crm";
import { crmInsertNotification } from "../messenger/_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

/**
 * POST /api/meetings/invite — fan-out invites to a list of internal
 * users.
 *
 * Body: { meetingCode, inviteeIds, hostName, roomName, meetingLink }
 *
 * For each invitee, this creates a meeting_invite row in the CRM and a
 * messenger notification so the recipient's bell shows the invite. We
 * resolve `meetingCode` → meeting id server-side to avoid leaking
 * internal ids to the browser.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
      meetingCode?: string;
      inviteeIds?: string[];
      hostName?: string;
      roomName?: string;
      meetingLink?: string;
    };
    if (!body.meetingCode || !Array.isArray(body.inviteeIds) || body.inviteeIds.length === 0) {
      return res.status(400).json({ error: "meetingCode + inviteeIds[] required" });
    }
    const meeting = await crmGetMeetingByCode(body.meetingCode);
    if (!meeting) return res.status(404).json({ error: "Meeting not found" });

    const meetingId = String((meeting as { id?: unknown }).id ?? "");
    const inviteCount = await crmBulkCreateInvites(
      meetingId,
      body.inviteeIds.map((invitedUserId) => ({
        invitedUserId,
        invitedBy: userId,
      })),
    );

    const hostName = body.hostName || "A teammate";
    const roomName = body.roomName || "Team Meeting";
    const meetingLink = body.meetingLink || `/meeting/join/${body.meetingCode}`;
    const invitedAt = new Date().toISOString();
    await Promise.allSettled(
      body.inviteeIds.map((invitedUserId) =>
        crmInsertNotification({
          userExternalId: invitedUserId,
          type: "meeting_invite",
          title: `${hostName} invited you to a meeting`,
          message: `${roomName} • Code ${body.meetingCode}`,
          severity: "medium",
          actionUrl: meetingLink,
          metadata: {
            room_code: body.meetingCode,
            room_name: roomName,
            host_id: userId,
            host_name: hostName,
            meeting_link: meetingLink,
            invited_at: invitedAt,
          },
        }).catch(() => undefined),
      ),
    );

    return res.status(200).json({ ok: true, inviteCount });
  } catch (error: unknown) {
    console.error("Error in meetings/invite:", error);
    return res.status(500).json({ error: getErrorMessage(error, "Failed to send invites") });
  }
}
