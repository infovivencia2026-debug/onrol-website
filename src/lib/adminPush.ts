/**
 * adminPush.ts
 *
 * Sends push notifications to one or more users by calling the
 * `send-push` Supabase Edge Function with the current session token.
 *
 * Only usable when the caller has a valid Supabase session (admin or service).
 */

import { supabase } from "@/lib/supabase";

export interface AdminPushPayload {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Fire-and-forget: sends push to the given user IDs.
 * Silently ignores errors so it never breaks the caller's flow.
 */
export async function sendAdminPush(payload: AdminPushPayload): Promise<void> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;

    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
    await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Push failures must never surface to the UI
  }
}
