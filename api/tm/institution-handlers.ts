import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { crmListInstitutionHandlers } from "./_crm";

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
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
    const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as { institutionIds?: string[] };
    if (!Array.isArray(body.institutionIds)) return res.status(400).json({ error: "institutionIds[] required" });
    const handlers = await crmListInstitutionHandlers(body.institutionIds);
    return res.status(200).json({ ok: true, handlers });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Institution-handlers request failed") });
  }
}
