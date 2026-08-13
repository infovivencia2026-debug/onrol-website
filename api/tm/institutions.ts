import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { crmListInstitutions, crmCreateInstitution, crmBulkUpsertInstitutions, crmUpdateInstitution } from "./_crm";

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
      const limit = Number(stringQ(req.query?.limit) ?? "500");
      const institutions = await crmListInstitutions(limit);
      return res.status(200).json({ ok: true, institutions });
    }
    if (req.method === "POST") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as Record<string, unknown> & { action?: string; rows?: Array<Record<string, unknown>> };
      if (body.action === "bulkUpsert") {
        const out = await crmBulkUpsertInstitutions(body.rows ?? []);
        return res.status(200).json({ ok: true, inserted: out.inserted });
      }
      if (!body.name) return res.status(400).json({ error: "name required" });
      const inst = await crmCreateInstitution(body);
      return res.status(200).json({ ok: true, institution: inst });
    }
    if (req.method === "PATCH") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
        id?: string; patch?: Record<string, unknown>;
      };
      if (!body.id || !body.patch) return res.status(400).json({ error: "id + patch required" });
      const institution = await crmUpdateInstitution(body.id, body.patch);
      return res.status(200).json({ ok: true, institution });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Institutions request failed") });
  }
}

function stringQ(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}
