import { getAuthUserId, getErrorMessage } from "../../meetings/_utils";
import { getOfficeRole, isAdmin, isMentorOrAdmin } from "../_utils";
import { crmUpdateCourse, crmPublishCourse, crmDeleteCourse } from "../_crm";

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
    const role = await getOfficeRole(userId);
    if (!isMentorOrAdmin(role)) return res.status(403).json({ error: "Admins or mentors only" });
    const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
    if (!id) return res.status(400).json({ error: "id required" });

    if (req.method === "PATCH") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
        action?: string;
        patch?: Record<string, unknown>;
        publish?: boolean;
      };
      if (body.action === "publish") {
        const out = await crmPublishCourse(id, !!body.publish);
        return res.status(200).json(out);
      }
      if (body.patch) {
        const course = await crmUpdateCourse(id, body.patch);
        return res.status(200).json({ ok: true, course });
      }
      return res.status(400).json({ error: "Unknown action" });
    }
    if (req.method === "DELETE") {
      if (!isAdmin(role)) return res.status(403).json({ error: "Admins only" });
      return res.status(200).json(await crmDeleteCourse(id));
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Course request failed") });
  }
}
