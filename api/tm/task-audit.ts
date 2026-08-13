import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { crmListTaskAudit } from "./_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
    const audit = await crmListTaskAudit({
      taskId: typeof req.query?.taskId === "string" ? req.query.taskId : undefined,
      limit: typeof req.query?.limit === "string" ? Number(req.query.limit) : 200,
    });
    return res.status(200).json({ ok: true, audit });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Task-audit request failed") });
  }
}
