// Apps Script webhook integration for community registration.
// Set VITE_APPS_SCRIPT_REGISTRATION_URL in .env to enable Sheets sync.
//
// To deploy the Apps Script side:
//   1. New Apps Script project at https://script.google.com
//   2. Bind to a Google Sheet (the one you want registrations appended to)
//   3. doPost(e) handler that parses e.postData.contents and appends a row
//   4. Deploy as Web App, "Execute as: me", "Who has access: Anyone"
//   5. Copy the deployment URL into .env as VITE_APPS_SCRIPT_REGISTRATION_URL

export interface CommunityRegistrationPayload {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  current_role: string | null;
  experience_level: string | null;
  interests: string[];
  source: string; // "google-oauth" | "email-signup" | "manual" etc.
  registered_at: string; // ISO
}

const WEBHOOK_URL = import.meta.env.VITE_APPS_SCRIPT_REGISTRATION_URL as
  | string
  | undefined;

export async function postRegistrationToSheet(
  payload: CommunityRegistrationPayload,
): Promise<{ ok: boolean; error?: string }> {
  if (!WEBHOOK_URL) {
    // Soft no-op when webhook isn't configured. Don't break the flow —
    // the row is still in Supabase community_members.
    console.info(
      "[community-reg] VITE_APPS_SCRIPT_REGISTRATION_URL not set; skipping Sheets sync.",
    );
    return { ok: true };
  }

  try {
    // Apps Script Web Apps prefer text/plain to avoid CORS preflight.
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors", // Apps Script doesn't echo CORS headers; fire-and-forget.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    // With no-cors, response is opaque — we can't read status. Assume success
    // if the fetch didn't throw. Real errors surface as network exceptions.
    void res;
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.warn("[community-reg] webhook failed:", message);
    return { ok: false, error: message };
  }
}
