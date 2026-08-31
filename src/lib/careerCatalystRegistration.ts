// Career Catalyst webinar registration — three-target submit.
//
// On form submit we fan out to:
//   1. Community Supabase (`webinar_registrations` table) — primary record.
//   2. Google Apps Script webhook — appends the row to the public sheet
//      ID 1NtdaXwTeXIxM86eXXrTpK51_BgjS8DcrBDs7SaHOgKg (the team uses
//      this sheet for follow-ups + WhatsApp broadcast lists).
//   3. Caller redirects the user to the WhatsApp Community link.
//
// All three are best-effort and fire in parallel; we never block the
// WhatsApp redirect on a sheet hiccup.

import { submitWebinarIntake } from "@/lib/intake";

export interface CareerCatalystPayload {
  full_name: string;
  phone: string;
  email: string;
  current_role: string;
  source?: string;
}

const SHEET_WEBHOOK_URL = import.meta.env
  .VITE_APPS_SCRIPT_CAREER_CATALYST_URL as string | undefined;

function readUtm() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source") || "",
    utm_medium: p.get("utm_medium") || "",
    utm_campaign: p.get("utm_campaign") || "",
  };
}

function postToSheet(body: Record<string, unknown>) {
  if (!SHEET_WEBHOOK_URL) {
    console.info(
      "[career-catalyst] VITE_APPS_SCRIPT_CAREER_CATALYST_URL not set; skipping Sheets sync.",
    );
    return Promise.resolve();
  }
  // text/plain to dodge CORS preflight; Apps Script accepts JSON in body.
  return fetch(SHEET_WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  }).catch((err) => {
    console.warn("[career-catalyst] sheet webhook failed:", err);
  });
}

async function postToCrm(p: CareerCatalystPayload) {
  // POST to /api/intake → CRM Postgres via federation service token.
  // Best-effort: a CRM hiccup must never block the WhatsApp redirect.
  try {
    await submitWebinarIntake({
      fullName: p.full_name,
      phone: p.phone,
      email: p.email,
      role: p.current_role,
      source: p.source || "career-catalyst-landing",
    });
  } catch (err) {
    console.warn("[career-catalyst] intake failed:", (err as Error)?.message ?? err);
  }
}

export function submitCareerCatalystRegistration(p: CareerCatalystPayload) {
  const utm = readUtm();
  const sheetBody = {
    full_name: p.full_name,
    phone: p.phone,
    email: p.email,
    current_role: p.current_role,
    source: p.source || "career-catalyst-landing",
    user_agent:
      typeof navigator !== "undefined" ? navigator.userAgent : "",
    referrer: typeof document !== "undefined" ? document.referrer : "",
    ...utm,
  };

  // Fire-and-forget — caller does the WhatsApp redirect immediately
  // after this returns.
  void postToCrm(p);
  void postToSheet(sheetBody);
}
