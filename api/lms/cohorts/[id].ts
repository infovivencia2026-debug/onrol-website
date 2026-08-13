import { getAuthUserId, getErrorMessage } from "../../meetings/_utils";
import { getOfficeRole, isAdmin, isMentorOrAdmin } from "../_utils";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

function getCrmBase(): { base: string; secret: string } | null {
  const url = process.env.CRM_EVENT_URL;
  const secret = process.env.ONROL_EVENT_SECRET;
  if (!url || !secret) return null;
  try {
    const u = new URL(url);
    return { base: `${u.protocol}//${u.host}`, secret };
  } catch {
    return null;
  }
}

async function crmFetch(path: string, init: RequestInit): Promise<Response> {
  const cfg = getCrmBase();
  if (!cfg) throw new Error("CRM_EVENT_URL / ONROL_EVENT_SECRET not configured.");
  return fetch(`${cfg.base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.secret}`,
      ...(init.headers ?? {}),
    },
  });
}

function stringQ(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
    if (!id) return res.status(400).json({ error: "id required" });
    const role = await getOfficeRole(userId);

    if (req.method === "GET") {
      // Mentor/admin can see members + progress; learners only see basic info.
      const include = stringQ(req.query?.include) ?? "";
      const params = new URLSearchParams();
      if (isMentorOrAdmin(role) && include) params.set("include", include);
      const r = await crmFetch(`/api/lms/cohorts/${encodeURIComponent(id)}?${params.toString()}`, { method: "GET" });
      if (r.status === 404) return res.status(404).json({ error: "Cohort not found" });
      const body = await r.json();
      return res.status(200).json(body);
    }

    if (req.method === "PATCH") {
      if (!isMentorOrAdmin(role)) return res.status(403).json({ error: "Admins or mentors only" });
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as Record<string, unknown>;
      // addMembers/removeMember restricted to admin + cohort mentor (server enforces by role).
      const r = await crmFetch(`/api/lms/cohorts/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const out = await r.json();
      return res.status(r.status).json(out);
    }

    if (req.method === "DELETE") {
      if (!isAdmin(role)) return res.status(403).json({ error: "Admins only" });
      const r = await crmFetch(`/api/lms/cohorts/${encodeURIComponent(id)}`, { method: "DELETE" });
      const out = await r.json();
      return res.status(r.status).json(out);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Cohort request failed") });
  }
}
