import { getErrorMessage } from "./push/_utils";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: {
    formType?: "contact" | "brochure" | "webinar" | "win" | "page_visit";
    pagePath?: string;
    fullName?: string;
    email?: string;
    phone?: string | null;
    role?: string | null;
    city?: string | null;
    interest?: string | null;
    message?: string | null;
    source?: string | null;
    referrer?: string | null;
    metadata?: Record<string, unknown> | null;
  };
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

/**
 * POST /api/intake — public-form gateway.
 *
 * Browser POSTs raw form data here. This handler:
 *   1. Sanity-checks payload (no Supabase JWT — the forms are public).
 *   2. Adds the user agent on the server side (more trustworthy than client).
 *   3. Forwards to the CRM's `/api/intake` over the shared service secret.
 *
 * Five form types are accepted:
 *   contact, brochure, webinar, win → become CRM leads
 *   page_visit                       → bumps the visit counter table
 *
 * No auth — but only `*.onrol.in` origins are accepted via CORS, and the
 * server-side proxy strips any client-supplied source string that doesn't
 * fit the known form types.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body ?? {};
  const formType = body.formType;
  if (!formType) {
    return res.status(400).json({ error: "formType required" });
  }

  const crmUrl = process.env.CRM_EVENT_URL;
  const secret = process.env.ONROL_EVENT_SECRET;
  if (!crmUrl || !secret) {
    return res.status(503).json({ error: "Intake gateway not configured." });
  }

  let base: string;
  try {
    const u = new URL(crmUrl);
    base = `${u.protocol}//${u.host}`;
  } catch {
    return res.status(503).json({ error: "Invalid CRM_EVENT_URL." });
  }

  const userAgentRaw = req.headers?.["user-agent"];
  const userAgent = Array.isArray(userAgentRaw) ? userAgentRaw[0] : userAgentRaw ?? null;

  try {
    const upstream = await fetch(`${base}/api/intake`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ ...body, userAgent }),
    });
    const text = await upstream.text();
    let parsed: unknown = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { /* leave null */ }
    if (!upstream.ok) {
      return res.status(upstream.status).json(parsed ?? { error: "CRM intake failed." });
    }
    return res.status(200).json(parsed ?? { ok: true });
  } catch (error: unknown) {
    return res.status(500).json({ error: getErrorMessage(error, "Intake forward failed") });
  }
}
