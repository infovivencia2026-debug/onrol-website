import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { getOfficeRole, isAdmin } from "./_utils";

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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    if (req.method === "GET") {
      const params = new URLSearchParams();
      if (req.query?.activeOnly === "1") params.set("activeOnly", "1");
      const lookupId = typeof req.query?.userExternalId === "string" ? req.query.userExternalId : undefined;
      if (lookupId) params.set("userExternalId", lookupId);
      const r = await crmFetch(`/api/lms/mentors?${params.toString()}`, { method: "GET" });
      if (r.status === 404) return res.status(404).json({ error: "Not found" });
      const body = await r.json();
      return res.status(200).json(body);
    }

    if (req.method === "PUT") {
      const role = await getOfficeRole(userId);
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
        userExternalId?: string;
        bio?: string | null;
        headline?: string | null;
        specialization?: string[];
        hourlyRateInr?: number | null;
        isActive?: boolean;
      };
      const target = body.userExternalId ?? userId;
      // Anyone can edit their own mentor profile; only admins can edit others.
      if (target !== userId && !isAdmin(role)) {
        return res.status(403).json({ error: "Admins only" });
      }
      const r = await crmFetch("/api/lms/mentors", {
        method: "PUT",
        body: JSON.stringify({ ...body, userExternalId: target }),
      });
      const out = await r.json();
      return res.status(r.status).json(out);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Mentors request failed") });
  }
}
