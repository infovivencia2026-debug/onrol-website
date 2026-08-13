import type { Meeting } from "@/types/meeting";
import { getAuthUserId, getErrorMessage } from "./_utils";
import { crmListMeetingsForUser, crmListMeetingsAndInvitesForUser } from "./_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

/**
 * GET /api/meetings/list — union of meetings the caller hosts /
 * participates in / was invited to. When `?withInvites=1` is set, also
 * returns the caller's invite-row metadata so the UI can render invite
 * status + inviter name without a second round-trip.
 *
 * The legacy automation_settings.meeting_visibility config that used to
 * gate "public ongoing meetings" hasn't migrated yet. For now the flag
 * is read from an env var (PUBLIC_TEAM_ONGOING_MEETINGS=1) so the
 * behaviour stays togglable.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const includePublicOngoing = process.env.PUBLIC_TEAM_ONGOING_MEETINGS === "1";
    const withInvites = req.query?.withInvites === "1";
    if (withInvites) {
      const { meetings, invites } = await crmListMeetingsAndInvitesForUser(userId, includePublicOngoing);
      return res.status(200).json({ meetings: meetings as Meeting[], invites });
    }
    const rows = await crmListMeetingsForUser(userId, includePublicOngoing);
    return res.status(200).json(rows as Meeting[]);
  } catch (error: unknown) {
    console.error("Error in meetings/list:", error);
    return res.status(500).json({ error: getErrorMessage(error, "Failed to fetch meetings") });
  }
}
