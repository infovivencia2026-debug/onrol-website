import { getAuthUserId, getErrorMessage } from "../../meetings/_utils";
import { crmUpdateTask, crmDeleteTask } from "../_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

/**
 * PATCH  /api/tm/tasks/[id]   body: { ...fields }
 * DELETE /api/tm/tasks/[id]
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
    if (!id) return res.status(400).json({ error: "id required" });

    if (req.method === "PATCH") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as Record<string, unknown>;
      const task = await crmUpdateTask(id, body);
      return res.status(200).json({ ok: true, task });
    }
    if (req.method === "DELETE") {
      await crmDeleteTask(id);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Task request failed") });
  }
}
