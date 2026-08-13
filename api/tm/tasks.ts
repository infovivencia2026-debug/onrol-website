import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { crmListTasks, crmCreateTask } from "./_crm";

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
 * GET    /api/tm/tasks?assignedTo=&status=&institutionId=&limit=
 * POST   /api/tm/tasks                   body: { title, ... }
 *
 * Browser hooks call here; we validate the Supabase JWT then forward
 * to the CRM /api/tm/tasks with the service token.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "GET") {
      const tasks = await crmListTasks({
        assignedTo: stringQ(req.query?.assignedTo),
        status: stringQ(req.query?.status),
        institutionId: stringQ(req.query?.institutionId),
        limit: Number(stringQ(req.query?.limit) ?? "500"),
      });
      return res.status(200).json({ ok: true, tasks });
    }
    if (req.method === "POST") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as Record<string, unknown>;
      const task = await crmCreateTask(body);
      return res.status(200).json({ ok: true, task });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Task request failed") });
  }
}

function stringQ(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}
