/**
 * capacitorNative.ts
 *
 * Thin wrappers around Capacitor native plugins.
 * Every function checks `isNative()` first — safe to call on web too (falls back gracefully).
 */

import { Capacitor } from "@capacitor/core";

// ─── Platform ───────────────────────────────────────────────────────────────

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform(); // "android" | "ios" | "web"

// ─── Push Notifications (FCM) ────────────────────────────────────────────────

export interface PushSetupResult {
  token: string;
  provider: "fcm" | "web";
}

/**
 * Request permission + get FCM token on Android.
 * On web, throws so callers can fall back to VAPID/web-push.
 */
export async function registerNativePush(
  onNotification: (title: string, body: string, data?: Record<string, string>) => void,
): Promise<PushSetupResult> {
  if (!isNative()) {
    throw new Error("not-native");
  }

  const { PushNotifications } = await import("@capacitor/push-notifications");

  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== "granted") {
    throw new Error("Push notification permission denied.");
  }

  await PushNotifications.register();

  return new Promise((resolve, reject) => {
    // Called once after register() succeeds
    PushNotifications.addListener("registration", (token) => {
      resolve({ token: token.value, provider: "fcm" });
    });

    PushNotifications.addListener("registrationError", (err) => {
      reject(new Error(`FCM registration failed: ${err.error}`));
    });

    // Foreground notification received
    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      onNotification(
        notification.title ?? "ONROL",
        notification.body ?? "",
        notification.data as Record<string, string>,
      );
    });

    // User tapped a notification (background/killed state)
    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const { title, body, data } = action.notification;
      onNotification(title ?? "ONROL", body ?? "", data as Record<string, string>);
    });
  });
}

// ─── Geolocation ─────────────────────────────────────────────────────────────

export interface NativePosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

/**
 * Get current GPS position using native Android APIs.
 * Falls back to browser Geolocation API when not running as native app.
 */
export async function getNativePosition(): Promise<NativePosition> {
  if (isNative()) {
    const { Geolocation } = await import("@capacitor/geolocation");
    await Geolocation.requestPermissions();
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    };
  }

  // Web fallback
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(new Error(err.message)),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });
}

// ─── Share ───────────────────────────────────────────────────────────────────

export interface SharePayload {
  title: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

/**
 * Open native Android share sheet.
 * Falls back to Web Share API, then clipboard copy on unsupported browsers.
 */
export async function nativeShare(payload: SharePayload): Promise<void> {
  if (isNative()) {
    const { Share } = await import("@capacitor/share");
    await Share.share({
      title: payload.title,
      text: payload.text,
      url: payload.url,
      dialogTitle: payload.dialogTitle ?? "Share via",
    });
    return;
  }

  // Web Share API (Chrome Android, Safari)
  if (navigator.share) {
    await navigator.share({
      title: payload.title,
      text: payload.text,
      url: payload.url,
    });
    return;
  }

  // Clipboard fallback
  const content = [payload.title, payload.text, payload.url].filter(Boolean).join("\n");
  await navigator.clipboard.writeText(content);
}

// ─── Camera ──────────────────────────────────────────────────────────────────

/**
 * Open camera or photo library. Returns a base64 JPEG data URL.
 * Web falls back to <input type="file"> — call from a user-gesture context.
 */
export async function capturePhoto(source: "camera" | "gallery" = "camera"): Promise<string> {
  if (isNative()) {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: source === "camera" ? CameraSource.Camera : CameraSource.Photos,
      quality: 80,
    });
    return photo.dataUrl ?? "";
  }

  // Web: trigger file picker
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (source === "camera") input.capture = "environment";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("No file selected"));
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

// ─── In-App Update Check (Android) ───────────────────────────────────────────

export interface AndroidUpdateInfo {
  available: boolean;
  latestVersion: string;
  currentVersion: string;
  apkUrl: string;
}

/**
 * Check if a newer APK version is available on the server.
 * Fetches https://onrol.in/version.json, compares with installed App version.
 * Returns { available: false } gracefully on any error.
 */
export async function checkAndroidUpdate(): Promise<AndroidUpdateInfo> {
  const apkUrl = "https://onrol.in/downloads/onrol.apk";
  const fallback: AndroidUpdateInfo = { available: false, latestVersion: "", currentVersion: "", apkUrl };

  if (!isNative()) return fallback;

  try {
    const { App } = await import("@capacitor/app");
    const info = await App.getInfo();
    const currentVersion = info.version;

    const res = await fetch("https://onrol.in/version.json?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { version?: string; apk?: string };
    const latestVersion = data.version ?? "";
    const serverApkUrl = data.apk ?? apkUrl;

    const isNewer = compareVersions(latestVersion, currentVersion) > 0;
    return { available: isNewer, latestVersion, currentVersion, apkUrl: serverApkUrl };
  } catch {
    return fallback;
  }
}

/** Compare semver strings. Returns positive if a > b, negative if a < b, 0 if equal. */
function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// ─── App URL / Deep Link ──────────────────────────────────────────────────────

/**
 * Register a handler for onrol:// deep-links when the app is opened via a URL.
 * Safe no-op on web.
 */
export async function registerDeepLinkHandler(
  handler: (path: string) => void,
): Promise<void> {
  if (!isNative()) return;
  const { App } = await import("@capacitor/app");
  App.addListener("appUrlOpen", (event) => {
    // e.g. onrol://app/task/123  →  path = "/task/123"
    try {
      const url = new URL(event.url);
      handler(url.pathname + url.search);
    } catch {
      handler(event.url);
    }
  });
}
