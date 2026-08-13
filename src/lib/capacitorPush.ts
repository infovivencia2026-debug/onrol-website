/**
 * Capacitor native push (Android FCM / iOS APNs) registration.
 *
 * Called on every app boot after auth — silent if already registered.
 * Uses dynamic imports so web builds don't pull in Capacitor plugins.
 *
 * Token storage moved off Supabase: the browser POSTs the token to
 * onrol.in's `/api/fcm/register`, which validates the Supabase JWT and
 * forwards to the CRM's `/api/fcm/register` for storage in own Postgres.
 * Supabase Auth stays as the IDP.
 */

import { supabase } from "@/lib/supabase";

type CapacitorGlobal = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

function getCapacitor(): CapacitorGlobal | null {
  if (typeof window === "undefined") return null;
  const g = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  return g && typeof g.isNativePlatform === "function" ? g : null;
}

export function isNativeApp(): boolean {
  const cap = getCapacitor();
  return Boolean(cap?.isNativePlatform?.());
}

export function nativePlatform(): "android" | "ios" | "web-native" | null {
  const cap = getCapacitor();
  if (!cap?.isNativePlatform?.()) return null;
  const p = cap.getPlatform?.();
  if (p === "android") return "android";
  if (p === "ios") return "ios";
  return "web-native";
}

let registrationInFlight: Promise<"registered" | "denied" | "unsupported" | "error"> | null = null;

export async function ensureCapacitorPushRegistered(): Promise<"registered" | "denied" | "unsupported" | "error"> {
  if (!isNativeApp()) return "unsupported";
  if (registrationInFlight) return registrationInFlight;

  registrationInFlight = (async () => {
    try {
      // Dynamic import so web bundles don't include the plugin.
      const mod = await import("@capacitor/push-notifications");
      const PushNotifications = mod.PushNotifications;

      // On Android 13+ POST_NOTIFICATIONS must be granted at runtime.
      const permStatus = await PushNotifications.checkPermissions();
      let perm = permStatus.receive;
      if (perm === "prompt" || perm === "prompt-with-rationale") {
        const req = await PushNotifications.requestPermissions();
        perm = req.receive;
      }
      if (perm !== "granted") {
        return perm === "denied" ? "denied" : "unsupported";
      }

      // One-shot promise that resolves on the first `registration` / `registrationError` event.
      const tokenPromise = new Promise<string>((resolve, reject) => {
        let settled = false;
        const regHandle = PushNotifications.addListener("registration", (info: { value: string }) => {
          if (settled) return;
          settled = true;
          resolve(info.value);
          regHandle.then((h) => h.remove()).catch(() => {});
        });
        const errHandle = PushNotifications.addListener("registrationError", (err) => {
          if (settled) return;
          settled = true;
          reject(new Error(JSON.stringify(err)));
          errHandle.then((h) => h.remove()).catch(() => {});
        });
        // Safety timeout — if FCM is misconfigured we don't want to hang forever.
        setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error("FCM registration timed out"));
          }
        }, 15_000);
      });

      await PushNotifications.register();
      const token = await tokenPromise;

      // Upsert the token under the logged-in user. If no session, bail — we'll retry on next login.
      const { data } = await supabase.auth.getSession();
      if (!data.session) return "error";

      const platformRaw = nativePlatform() || "web-native";
      // CRM stores platform as android / ios / web only — fold web-native → web.
      const platform: "android" | "ios" | "web" =
        platformRaw === "android" ? "android" : platformRaw === "ios" ? "ios" : "web";
      const deviceId =
        (typeof window !== "undefined" && (window as unknown as { __DEVICE_ID__?: string }).__DEVICE_ID__) || undefined;

      // POST to onrol.in's own server handler, which validates the
      // Supabase JWT and forwards to the CRM.
      const response = await fetch("/api/fcm/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ token, platform, deviceId }),
      });
      if (!response.ok) {
        console.warn(`[fcm] register failed (${response.status})`);
        return "error";
      }

      // Wire foreground + tap listeners once, so push-while-open shows a toast
      // and tapping a notification deep-links the app.
      wireForegroundListeners(PushNotifications);

      return "registered";
    } catch {
      return "error";
    }
  })();

  return registrationInFlight;
}

let listenersWired = false;
function wireForegroundListeners(PushNotifications: typeof import("@capacitor/push-notifications").PushNotifications) {
  if (listenersWired) return;
  listenersWired = true;

  // Notification received while app is in the foreground — Android doesn't show a
  // system banner automatically in this case, so we dispatch a custom event that the
  // app can listen to and render an in-app toast.
  PushNotifications.addListener("pushNotificationReceived", (notif) => {
    const detail = {
      title: notif.title ?? "ONROL",
      body: notif.body ?? "",
      data: notif.data ?? {},
    };
    window.dispatchEvent(new CustomEvent("onrol:push", { detail }));
  }).catch(() => {});

  // User tapped the system notification (app was backgrounded / closed when it arrived).
  // Custom event again so routing logic lives with the rest of the app.
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const data = action.notification.data as Record<string, string> | undefined;
    const url = data?.url || "/task/app";
    window.dispatchEvent(new CustomEvent("onrol:push-tap", { detail: { url, data } }));
  }).catch(() => {});
}
