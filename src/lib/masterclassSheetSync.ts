const SHEET_WEBHOOK_URL = import.meta.env
  .VITE_APPS_SCRIPT_CAREER_CATALYST_URL as string | undefined;

interface MasterclassSheetPayload {
  full_name: string;
  phone: string;
  email: string;
  current_role?: string;
  city?: string;
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

export function syncMasterclassSubmissionToSheet(payload: MasterclassSheetPayload): void {
  if (!SHEET_WEBHOOK_URL) {
    console.info("[masterclass] VITE_APPS_SCRIPT_CAREER_CATALYST_URL not set; skipping Sheets sync.");
    return;
  }

  const body = {
    form_type: "masterclass",
    full_name: payload.full_name,
    phone: payload.phone,
    email: payload.email,
    current_role: payload.current_role || "",
    city: payload.city || "",
    source: payload.source || "hero-masterclass-popup",
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
    console.warn("[masterclass] sheet webhook failed:", err);
  });
}
