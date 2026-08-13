// /win convocation form — three-target submit (same pattern as Career
// Catalyst): CRM intake gateway (own Postgres) + Google Apps Script
// Sheet + caller-driven redirect. The /win page is invite-only — no nav
// links, not in sitemap, not prerendered, robots-disallowed.

import { submitWinIntake } from "@/lib/intake";

export interface WinRegistrationPayload {
  first_name: string;
  last_name: string;
  father_name: string;
  mobile: string;
  email: string;
  occupation: string;
  source?: string;
}

// Reuse the Career Catalyst Apps Script webhook so we don't need a second
// Apps Script deployment. The `source` field on each row distinguishes
// /win submissions from /career-catalyst submissions in the same sheet
// (or filter by source to split them downstream).
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
    console.info("[win] VITE_APPS_SCRIPT_CAREER_CATALYST_URL not set; skipping Sheets sync.");
    return Promise.resolve();
  }
  return fetch(SHEET_WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  }).catch((err) => {
    console.warn("[win] sheet webhook failed:", err);
  });
}

async function postToCrm(p: WinRegistrationPayload): Promise<void> {
  // Single retry on transient network blips. /api/intake → CRM Postgres
  // via the federation service token (set on the onrol.in deploy).
  const fullName = `${p.first_name} ${p.last_name}`.trim();
  const attempt = () => submitWinIntake({
    fullName,
    email: p.email,
    phone: p.mobile,
    role: p.occupation,
    source: p.source || "win-convocation",
    metadata: { win_father_name: p.father_name },
  });

  try {
    await attempt();
  } catch (err) {
    const msg = ((err as Error)?.message || "").toLowerCase();
    const transient = msg.includes("fetch") || msg.includes("network") || msg.includes("timeout");
    if (!transient) throw err;
    console.warn("[win] intake transient error, retrying:", (err as Error)?.message);
    await new Promise((r) => setTimeout(r, 250));
    await attempt();
  }
}

export async function submitWinRegistration(p: WinRegistrationPayload): Promise<void> {
  const utm = readUtm();
  // Sheet write stays fire-and-forget (Apps Script uses no-cors so we
  // can't read the response anyway). Postgres write IS awaited so we
  // know the row landed before redirecting the user to the thank-you page.
  const sheetBody = {
    full_name:    `${p.first_name} ${p.last_name}`.trim(),
    phone:        p.mobile,
    email:        p.email,
    current_role: p.occupation,
    source:       p.source || "win-convocation",
    user_agent:   typeof navigator !== "undefined" ? navigator.userAgent : "",
    referrer:     typeof document !== "undefined" ? document.referrer : "",
    win_father_name: p.father_name,
    ...utm,
  };

  void postToSheet(sheetBody);
  await postToCrm(p);
}
