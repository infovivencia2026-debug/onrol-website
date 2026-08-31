// Browser-side client for the unified intake gateway at /api/intake.
//
// Replaces direct `supabase.from("inquiries").insert(...)` calls and the
// `communitySupabase.rpc("register_for_webinar", ...)` etc. — all five
// public form types and the page-visit counter go through one endpoint.

const FIRED_VISITS = new Set<string>();

interface BaseIntakeFields {
  fullName: string;
  email: string;
  phone?: string;
  role?: string;
  city?: string;
  interest?: string;
  message?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

function readClientContext(): { pagePath: string; referrer: string | null; utm: Record<string, string>; ref: string | null } {
  if (typeof window === "undefined") return { pagePath: "", referrer: null, utm: {}, ref: null };
  const p = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = p.get(k);
    if (v) utm[k] = v;
  }
  return {
    pagePath: window.location.pathname,
    referrer: document.referrer || null,
    utm,
    ref: p.get("ref") || null,
  };
}

// Public CRM lead-capture endpoint on go.onrol.in. Replaces the old
// onrol.in/api/intake Kong route, which started returning 401 Basic-auth
// (WWW-Authenticate: Basic realm="service") and made the browser pop a native
// "Sign in" dialog on every form submit. This endpoint is open and returns 201.
const LEADS_ENDPOINT = "https://go.onrol.in/api/public/leads";
const VISIT_ENDPOINT = "https://go.onrol.in/api/public/track/visit";

async function submitForm(
  formType: "contact" | "brochure" | "webinar" | "win",
  fields: BaseIntakeFields,
): Promise<{ ok: true; leadId?: string }> {
  if (!fields.fullName?.trim() || !fields.email?.trim()) {
    throw new Error("Name and email are required.");
  }
  const ctx = readClientContext();

  // Fold the extra context into a single notes string the CRM can display.
  const noteParts: string[] = [];
  if (fields.role?.trim()) noteParts.push(`role: ${fields.role.trim()}`);
  if (fields.city?.trim()) noteParts.push(`city: ${fields.city.trim()}`);
  if (fields.interest?.trim()) noteParts.push(`interest: ${fields.interest.trim()}`);
  if (fields.message?.trim()) noteParts.push(fields.message.trim());
  if (ctx.pagePath) noteParts.push(`page: ${ctx.pagePath}`);

  const response = await fetch(LEADS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      name: fields.fullName.trim(),
      email: fields.email.trim().toLowerCase(),
      phone: fields.phone?.trim() || "",
      tag: "bulk",
      source: fields.source || `onrol.in ${formType} form`,
      campaign: formType,
      notes: noteParts.join(" · "),
      // Affiliate attribution — the ?ref= code from the affiliate link. The CRM's
      // /api/public/leads resolves it to referrer_user_id so the referred user
      // shows up under that affiliate in both their portal and the CRM.
      ...(ctx.ref ? { ref: ctx.ref } : {}),
      metadata: { ...ctx.utm, referrer: ctx.referrer, formType, ...(fields.metadata ?? {}) },
    }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error((detail as { error?: string })?.error || "Could not save right now — please retry.");
  }
  return (await response.json().catch(() => ({ ok: true }))) as { ok: true; leadId?: string };
}

export const submitContactInquiry  = (f: BaseIntakeFields) => submitForm("contact",  f);
export const submitBrochureRequest = (f: BaseIntakeFields) => submitForm("brochure", f);

// Webinar + win flows have additional Apps Script + redirect work — they
// live in their own files (careerCatalystRegistration.ts / winRegistration.ts)
// and use submitWebinarIntake / submitWinIntake under the hood.
export const submitWebinarIntake = (f: BaseIntakeFields) => submitForm("webinar", f);
export const submitWinIntake     = (f: BaseIntakeFields) => submitForm("win", f);

/**
 * Fire-and-forget page-visit counter. De-duped within the same tab so
 * SPA route changes don't double-count and React StrictMode in dev
 * doesn't either.
 */
export function trackLandingVisit(pagePath: string): void {
  if (FIRED_VISITS.has(pagePath)) return;
  FIRED_VISITS.add(pagePath);
  // GET beacon to the open visit endpoint (the old /api/intake Kong route now
  // 401s with Basic auth, which popped a browser login dialog).
  void fetch(`${VISIT_ENDPOINT}?path=${encodeURIComponent(pagePath)}`, {
    method: "GET",
    keepalive: true,
    mode: "no-cors",
  }).catch(() => {
    // Analytics must never break the page.
  });
}
