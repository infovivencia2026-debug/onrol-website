import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { getOfficeRole, isAdmin, isMentorOrAdmin } from "./_utils";

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

    if (req.method === "GET") {
      const role = await getOfficeRole(userId);
      const params = new URLSearchParams();
      // Default scope: a learner sees their own cohorts; mentor/admin can pass
      // mentorExternalId or courseId to filter.
      const courseId = stringQ(req.query?.courseId);
      const mentorExternalId = stringQ(req.query?.mentorExternalId);
      const mine = req.query?.mine === "1" || (!courseId && !mentorExternalId && !isMentorOrAdmin(role));
      if (mine) {
        params.set("userExternalId", userId);
      } else {
        if (!isMentorOrAdmin(role)) return res.status(403).json({ error: "Admins or mentors only" });
        if (courseId) params.set("courseId", courseId);
        if (mentorExternalId) params.set("mentorExternalId", mentorExternalId);
        const status = stringQ(req.query?.status);
        if (status) params.set("status", status);
      }
      const r = await crmFetch(`/api/lms/cohorts?${params.toString()}`, { method: "GET" });
      const body = await r.json() as { ok: boolean; cohorts: Array<Record<string, unknown>> };
      return res.status(200).json(body);
    }

    if (req.method === "POST") {
      const role = await getOfficeRole(userId);
      if (!isAdmin(role)) return res.status(403).json({ error: "Admins only" });
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as Record<string, unknown>;
      body.createdBy = userId;
      const r = await crmFetch("/api/lms/cohorts", { method: "POST", body: JSON.stringify(body) });
      const out = await r.json();
      return res.status(r.status).json(out);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Cohorts request failed") });
  }
}
