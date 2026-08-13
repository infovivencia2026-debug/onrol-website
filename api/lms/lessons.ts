import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { getOfficeRole, isMentorOrAdmin } from "./_utils";
import { crmGetLesson, crmCreateLesson, crmUpdateLesson, crmDeleteLesson, crmReorderLessons } from "./_crm";

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
      const id = stringQ(req.query?.id);
      if (!id) return res.status(400).json({ error: "id required" });
      const lesson = await crmGetLesson(id);
      if (!lesson) return res.status(404).json({ error: "Lesson not found" });
      return res.status(200).json({ ok: true, lesson });
    }

    const role = await getOfficeRole(userId);
    if (!isMentorOrAdmin(role)) return res.status(403).json({ error: "Admins or mentors only" });
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as Record<string, unknown> & {
      action?: string;
      id?: string;
      moduleId?: string;
      patch?: Record<string, unknown>;
      orderedIds?: string[];
    };
    if (body.action === "reorder") {
      if (!body.moduleId || !Array.isArray(body.orderedIds)) {
        return res.status(400).json({ error: "moduleId + orderedIds[] required" });
      }
      return res.status(200).json(await crmReorderLessons(body.moduleId, body.orderedIds));
    }
    if (body.action === "update" && body.id && body.patch) {
      const lesson = await crmUpdateLesson(body.id, body.patch);
      return res.status(200).json({ ok: true, lesson });
    }
    if (body.action === "delete" && body.id) {
      return res.status(200).json(await crmDeleteLesson(body.id));
    }
    const lesson = await crmCreateLesson(body);
    return res.status(200).json({ ok: true, lesson });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Lessons request failed") });
  }
}
