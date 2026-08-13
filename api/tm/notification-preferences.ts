import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { crmGetNotificationPrefs, crmUpsertNotificationPrefs } from "./_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
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
      const prefs = await crmGetNotificationPrefs(userId);
      return res.status(200).json({ ok: true, prefs });
    }
    if (req.method === "PUT") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as Record<string, unknown>;
      const prefs = await crmUpsertNotificationPrefs(userId, body);
      return res.status(200).json({ ok: true, prefs });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Notification-preferences request failed") });
  }
}
