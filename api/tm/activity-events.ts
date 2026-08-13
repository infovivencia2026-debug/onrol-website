import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { crmInsertActivityEvent, crmListActivityEvents } from "./_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

function stringQ(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (req.method === "GET") {
      const events = await crmListActivityEvents({
        actorUserId: stringQ(req.query?.actorUserId),
        targetUserId: stringQ(req.query?.targetUserId),
        visitTaskId: stringQ(req.query?.visitTaskId),
        eventType: stringQ(req.query?.eventType),
        since: stringQ(req.query?.since),
        limit: Number(stringQ(req.query?.limit) ?? "200"),
      });
      return res.status(200).json({ ok: true, events });
    }
    if (req.method === "POST") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as Parameters<typeof crmInsertActivityEvent>[0];
      if (!body.eventType) return res.status(400).json({ error: "eventType required" });
      if (!body.actorUserId) body.actorUserId = userId;
      const out = await crmInsertActivityEvent(body);
      return res.status(200).json({ ok: true, id: out.id });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Activity-events request failed") });
  }
}
