import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { crmListPresence, crmUpsertPresence } from "./_crm";

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
      const usersQ = req.query?.users;
      const users = typeof usersQ === "string"
        ? usersQ.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
      const presence = await crmListPresence(users);
      return res.status(200).json({ ok: true, presence });
    }
    if (req.method === "PUT") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
        status?: string; device?: string | null;
      };
      if (!body.status) return res.status(400).json({ error: "status required" });
      await crmUpsertPresence(userId, body.status, body.device ?? null);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Presence request failed") });
  }
}
