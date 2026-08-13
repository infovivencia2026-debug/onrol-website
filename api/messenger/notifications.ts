import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import {
  crmListNotifications, crmInsertNotification, crmBulkInsertNotifications,
  crmMarkNotificationsRead, crmMarkAllNotificationsRead, crmDeleteAllNotificationsForUser,
} from "./_crm";

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
      const rows = await crmListNotifications(userId, {
        unreadOnly: req.query?.unreadOnly === "1",
        severity: stringQ(req.query?.severity),
        limit: Number(stringQ(req.query?.limit) ?? "50"),
      });
      return res.status(200).json({ ok: true, notifications: rows });
    }
    if (req.method === "POST") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as Record<string, unknown> & {
        action?: string;
        rows?: Array<Record<string, unknown>>;
        ids?: string[];
      };
      switch (body.action) {
        case "bulkInsert":
          return res.status(200).json(await crmBulkInsertNotifications(body.rows ?? []));
        case "markRead":
          return res.status(200).json(await crmMarkNotificationsRead(userId, body.ids ?? []));
        case "markAllRead":
          return res.status(200).json(await crmMarkAllNotificationsRead(userId));
        case "deleteAllForUser":
          return res.status(200).json(await crmDeleteAllNotificationsForUser(userId));
        default: {
          if (!body.type || !body.title) return res.status(400).json({ error: "type + title required" });
          // Default the target user to the authed user if not specified.
          const payload = { userExternalId: body.userExternalId ?? userId, ...body };
          return res.status(200).json(await crmInsertNotification(payload as Record<string, unknown>));
        }
      }
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Notifications request failed") });
  }
}

function stringQ(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}
