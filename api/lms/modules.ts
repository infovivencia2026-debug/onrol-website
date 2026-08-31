import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { getOfficeRole, isMentorOrAdmin } from "./_utils";
import { crmCreateModule, crmUpdateModule, crmDeleteModule, crmReorderModules } from "./_crm";

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
    const role = await getOfficeRole(userId);
    if (!isMentorOrAdmin(role)) return res.status(403).json({ error: "Admins or mentors only" });
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
      action?: string;
      courseId?: string;
      id?: string;
      title?: string;
      summary?: string | null;
      position?: number;
      patch?: { title?: string; summary?: string | null; position?: number };
      orderedIds?: string[];
    };
    if (body.action === "reorder") {
      if (!body.courseId || !Array.isArray(body.orderedIds)) {
        return res.status(400).json({ error: "courseId + orderedIds[] required" });
      }
      return res.status(200).json(await crmReorderModules(body.courseId, body.orderedIds));
    }
    if (body.action === "update" && body.id && body.patch) {
      const mod = await crmUpdateModule(body.id, body.patch);
      return res.status(200).json({ ok: true, module: mod });
    }
    if (body.action === "delete" && body.id) {
      return res.status(200).json(await crmDeleteModule(body.id));
    }
    if (!body.courseId || !body.title) return res.status(400).json({ error: "courseId + title required" });
    const mod = await crmCreateModule({
      courseId: body.courseId,
      title: body.title,
      position: body.position,
      summary: body.summary ?? null,
    });
    return res.status(200).json({ ok: true, module: mod });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Modules request failed") });
  }
}
