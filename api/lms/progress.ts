import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { crmUpsertProgress, crmListProgress } from "./_crm";

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
      const rows = await crmListProgress(userId, stringQ(req.query?.courseId));
      return res.status(200).json({ ok: true, progress: rows });
    }
    if (req.method === "POST") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
        lessonId?: string;
        courseId?: string;
        watchedSec?: number;
        lastPositionSec?: number;
        completed?: boolean;
      };
      if (!body.lessonId || !body.courseId) {
        return res.status(400).json({ error: "lessonId + courseId required" });
      }
      return res.status(200).json(await crmUpsertProgress({
        userExternalId: userId,
        lessonId: body.lessonId,
        courseId: body.courseId,
        watchedSec: body.watchedSec,
        lastPositionSec: body.lastPositionSec,
        completed: body.completed,
      }));
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Progress request failed") });
  }
}
