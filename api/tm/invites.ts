import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { crmListInvites, crmCreateInvite, crmUpdateInviteStatus } from "./_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "GET") {
      const status = typeof req.query?.status === "string" ? req.query.status : undefined;
      const invites = await crmListInvites(status);
      return res.status(200).json({ ok: true, invites });
    }
    if (req.method === "POST") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
        email?: string; fullName?: string | null; department?: string | null; role?: string;
      };
      if (!body.email) return res.status(400).json({ error: "email required" });
      const invite = await crmCreateInvite({
        email: body.email,
        fullName: body.fullName,
        department: body.department,
        role: body.role,
        invitedBy: userId,
      });
      return res.status(200).json({ ok: true, invite });
    }
    if (req.method === "PATCH") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
        id?: string; status?: "pending" | "accepted" | "revoked";
      };
      if (!body.id || !body.status) return res.status(400).json({ error: "id + status required" });
      const invite = await crmUpdateInviteStatus(body.id, body.status);
      return res.status(200).json({ ok: true, invite });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Invites request failed") });
  }
}
