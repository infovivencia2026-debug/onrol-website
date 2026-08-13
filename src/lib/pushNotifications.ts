import { supabase } from "@/lib/supabase";

const PUSH_TIMEOUT_MS = 15000;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

function timeoutMessage(label: string, timeoutMs = PUSH_TIMEOUT_MS) {
  return `${label} timed out after ${Math.round(timeoutMs / 1000)}s. Please check connection and try again.`;
}

async function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = PUSH_TIMEOUT_MS): Promise<T> {
  let timeoutId: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(timeoutMessage(label, timeoutMs))), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
    }
  }
}

async function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit, label: string, timeoutMs = PUSH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(timeoutMessage(label, timeoutMs));
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function getServiceWorkerRegistration() {
  const existing = await withTimeout(
    navigator.serviceWorker.getRegistration(),
    "Service worker initialization",
  );
  if (existing) {
    return existing;
  }
  const registered = await withTimeout(
    navigator.serviceWorker.register("/sw.js"),
    "Service worker registration",
  );
  await withTimeout(navigator.serviceWorker.ready, "Service worker activation");
  return registered;
}

/**
 * Silently refresh the web-push subscription if the user has already granted permission.
 * Safe to call on every app boot after auth — does nothing if permission is "default"
 * (not yet asked) or "denied".
 *
 * Use this from post-login code so returning users stay subscribed on new devices.
 */
export async function ensureWebPushRegistered(): Promise<"registered" | "denied" | "unsupported" | "no-permission" | "not-configured"> {
  if (typeof window === "undefined") return "unsupported";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission !== "granted") return "no-permission";
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidPublicKey) return "not-configured";

  try {
    const registration = await getServiceWorkerRegistration();
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }
    // Upsert the subscription (server uses endpoint as unique key). Failures are silent —
    // this is a background best-effort call; the explicit enableWebPush() path surfaces errors.
    const token = await getAuthToken();
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ subscription }),
    }).catch(() => {});
    return "registered";
  } catch {
    return "unsupported";
  }
}

export async function enableWebPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Push notifications are not supported on this browser.");
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidPublicKey) {
    throw new Error("Missing VITE_VAPID_PUBLIC_KEY.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied.");
  }

  const registration = await getServiceWorkerRegistration();
  let subscription = await withTimeout(
    registration.pushManager.getSubscription(),
    "Push subscription lookup",
  );

  if (!subscription) {
    subscription = await withTimeout(
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      }),
      "Push subscription",
    );
  }

  const token = await getAuthToken();
  const response = await fetchWithTimeout("/api/push/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ subscription }),
  }, "Saving push subscription");

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Push API endpoint not found (/api/push/subscribe). Start backend API server or deploy serverless functions.");
    }
    throw new Error(result?.error || "Failed to save push subscription.");
  }

  return { subscribed: true };
}

export async function sendTestNotification() {
  const token = await getAuthToken();
  const response = await fetchWithTimeout("/api/push/send-test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({}),
  }, "Sending test notification");
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Push API endpoint not found (/api/push/send-test). Start backend API server or deploy serverless functions.");
    }
    throw new Error(result?.error || "Failed to send test notification.");
  }
  return result;
}

export async function sendReminderNotifications() {
  const token = await getAuthToken();
  const response = await fetchWithTimeout("/api/push/send-reminders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({}),
  }, "Sending reminder notifications");
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Push API endpoint not found (/api/push/send-reminders). Start backend API server or deploy serverless functions.");
    }
    throw new Error(result?.error || "Failed to send reminder notifications.");
  }
  return result;
}
