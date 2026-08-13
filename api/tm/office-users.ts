import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { crmListOfficeUsers, crmUpsertOfficeUser, crmGetOfficeUserByEmail } from "./_crm";

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
      const emailQ = typeof req.query?.email === "string" ? req.query.email : undefined;
      if (emailQ) {
        const user = await crmGetOfficeUserByEmail(emailQ);
        if (!user) return res.status(404).json({ ok: false, user: null });
        return res.status(200).json({ ok: true, user });
      }
      const activeOnly = (req.query?.activeOnly === "1");
      const users = await crmListOfficeUsers({ activeOnly });
      return res.status(200).json({ ok: true, users });
    }
    if (req.method === "PUT") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
        email?: string; fullName?: string; phone?: string; role?: string; department?: string; isActive?: boolean;
        userExternalId?: string;
      };
      if (!body.email) return res.status(400).json({ error: "email required" });
      const user = await crmUpsertOfficeUser(body as Parameters<typeof crmUpsertOfficeUser>[0]);
      return res.status(200).json({ ok: true, user });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Office-users request failed") });
  }
}
