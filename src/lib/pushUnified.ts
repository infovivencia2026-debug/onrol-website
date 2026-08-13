/**
 * pushUnified.ts
 *
 * Single import for push notifications across web and Android.
 * - Android native app → FCM via @capacitor/push-notifications
 * - Web / PWA → VAPID via service worker (existing pushNotifications.ts)
 */

import { supabase } from "@/lib/supabase";
import { isNative, registerNativePush } from "@/lib/capacitorNative";
import { enableWebPush } from "@/lib/pushNotifications";

async function saveFcmToken(token: string) {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;

  // Store FCM token against the user so the backend can send targeted pushes
  await supabase
    .from("user_push_tokens")
    .upsert({ user_id: userId, token, provider: "fcm", updated_at: new Date().toISOString() });
}

/**
 * Enable push notifications.
 * Automatically selects native FCM on Android, falls back to VAPID on web.
 *
 * @param onNotification  Callback fired when a foreground notification arrives
 *                        (native only — web shows via service worker)
 */
export async function enablePush(
  onNotification?: (title: string, body: string, data?: Record<string, string>) => void,
): Promise<{ provider: "fcm" | "web" }> {
  if (isNative()) {
    const result = await registerNativePush(onNotification ?? (() => {}));
    await saveFcmToken(result.token);
    return { provider: "fcm" };
  }

  await enableWebPush();
  return { provider: "web" };
}
