// AI Startup Webinar — Google Sheet sync (fire-and-forget).
// Posts to the same Apps Script web app as Career Catalyst / Masterclass
// (VITE_APPS_SCRIPT_CAREER_CATALYST_URL). The Apps Script routes
// form_type === "ai-startup-webinar" into its own "AI Startup Webinar" tab.

const SHEET_WEBHOOK_URL = import.meta.env.VITE_APPS_SCRIPT_CAREER_CATALYST_URL as string | undefined;

interface WebinarSheetPayload {
  name: string;
  phone: string;
  email: string;
  occupation?: string;
  source?: string;
}

function readUtm() {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source") || "",
    utm_medium: p.get("utm_medium") || "",
    utm_campaign: p.get("utm_campaign") || "",
  };
}

export function syncWebinarSubmissionToSheet(payload: WebinarSheetPayload): void {
  if (!SHEET_WEBHOOK_URL) {
    console.info("[webinar] VITE_APPS_SCRIPT_CAREER_CATALYST_URL not set; skipping Sheets sync.");
    return;
  }

  const body = {
    form_type: "ai-startup-webinar",
    name: payload.name,
    full_name: payload.name,
    phone: payload.phone,
    email: payload.email,
    occupation: payload.occupation || "",
    role: payload.occupation || "",
    source: payload.source || "AI Startup Webinar landing",
    campaign: "ai-startup-webinar",
    page_path: typeof window !== "undefined" ? window.location.pathname : "",
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    referrer: typeof document !== "undefined" ? document.referrer : "",
    ...readUtm(),
  };

  void fetch(SHEET_WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(body),
  }).catch((err) => {
    console.warn("[webinar] sheet webhook failed:", err);
  });
}
