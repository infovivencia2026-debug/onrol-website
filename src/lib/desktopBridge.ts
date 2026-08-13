export type DesktopRouteAction =
  | "open-dashboard"
  | "open-tasks"
  | "open-chat"
  | "open-meeting"
  | "new-task";

export type DesktopShortcutAction =
  | "open-app"
  | "open-command-palette";

export type DesktopDeepLink = {
  route: string;
  host: string;
  id: string | null;
  raw: string;
};

export type DesktopUpdateState = {
  status: "idle" | "checking" | "available" | "downloading" | "ready" | "up-to-date" | "error";
  message: string;
  available: boolean;
  progress?: number;
  bytesPerSecond?: number;
  transferred?: number;
  total?: number;
  info?: Record<string, unknown>;
};

export type DesktopZoomState = {
  zoomFactor: number;
};

// Window-level API exposed by preload.cjs
declare global {
  interface Window {
    desktopAPI?: {
      // Core
      isDesktop: () => Promise<boolean>;
      getSettings: () => Promise<Record<string, unknown>>;
      updateSettings: (patch: Record<string, unknown>) => Promise<Record<string, unknown>>;

      // Notifications
      notify: (payload: {
        title: string;
        body?: string;
        action?: string;
        route?: string | null;
        meta?: Record<string, unknown> | null;
      }) => Promise<{ ok: boolean; reason?: string }>;
      getNotificationHistory: () => Promise<Array<Record<string, unknown>>>;
      clearNotificationHistory: () => Promise<boolean>;

      // Badge
      setBadgeCount: (count: number) => Promise<{ ok: boolean; count: number }>;
      getBadgeCount: () => Promise<number>;

      // Zoom
      setZoomLevel: (factor: number) => Promise<{ ok: boolean; zoomFactor: number }>;
      getZoomLevel: () => Promise<number>;
      zoomIn: () => Promise<{ ok: boolean; zoomFactor: number }>;
      zoomOut: () => Promise<{ ok: boolean; zoomFactor: number }>;
      zoomReset: () => Promise<{ ok: boolean; zoomFactor: number }>;

      // Flash
      flashFrame: (flag: boolean) => Promise<{ ok: boolean }>;

      // Updates
      checkForUpdates: () => Promise<{ ok: boolean; message?: string }>;
      getUpdateState: () => Promise<DesktopUpdateState>;
      installUpdate: () => Promise<{ ok: boolean }>;

      // Health
      getHealth: () => Promise<Record<string, unknown>>;

      // Window
      openMainWindow: () => Promise<boolean>;
      quit: () => Promise<boolean>;

      // Launch
      setLaunchOnStartup: (enabled: boolean) => Promise<Record<string, unknown>>;
      getLaunchOnStartup: () => Promise<boolean>;

      // File system
      showOpenDialog: (options?: {
        properties?: string[];
        filters?: Array<{ name: string; extensions: string[] }>;
        title?: string;
      }) => Promise<{ canceled: boolean; filePaths: string[] }>;
      openPath: (targetPath: string) => Promise<{ ok: boolean; error?: string | null }>;
      openExternal: (url: string) => Promise<{ ok: boolean; reason?: string }>;

      // Event subscriptions (return unsubscribe fn)
      onShortcut: (cb: (payload: { action: DesktopShortcutAction }) => void) => () => void;
      onRouteAction: (cb: (payload: { action: DesktopRouteAction }) => void) => () => void;
      onNotificationAction: (cb: (payload: { action: string; route: string | null; meta: Record<string, unknown> | null }) => void) => () => void;
      onUpdateState: (cb: (state: DesktopUpdateState) => void) => () => void;
      onDeepLink: (cb: (link: DesktopDeepLink) => void) => () => void;
      onZoomChanged: (cb: (state: DesktopZoomState) => void) => () => void;
    };
  }
}

export function isDesktopRuntime(): boolean {
  return typeof window !== "undefined" && Boolean(window.desktopAPI);
}

export async function desktopNotify(payload: {
  title: string;
  body?: string;
  action?: string;
  route?: string | null;
  meta?: Record<string, unknown> | null;
}) {
  if (!isDesktopRuntime()) return { ok: false, reason: "not-desktop" };
  return window.desktopAPI!.notify(payload);
}

export async function getDesktopSettings() {
  if (!isDesktopRuntime()) return null;
  return window.desktopAPI!.getSettings();
}

export async function setDesktopBadge(count: number) {
  if (!isDesktopRuntime()) return;
  return window.desktopAPI!.setBadgeCount(count);
}

/**
 * Open a URL in the user's default system browser (from inside the Electron app).
 * Falls back to window.open when called from the web runtime.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (isDesktopRuntime() && window.desktopAPI?.openExternal) {
    await window.desktopAPI.openExternal(url).catch(() => {});
    return;
  }
  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
