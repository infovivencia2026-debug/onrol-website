const { contextBridge, ipcRenderer } = require("electron");

function on(channel, callback) {
  const handler = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

function wireRendererCrashLogging() {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (event) => {
    ipcRenderer.send("desktop:renderer-error", {
      kind: "window-error",
      message: event?.message || "Unhandled window error",
      filename: event?.filename || null,
      lineno: event?.lineno || null,
      colno: event?.colno || null,
      stack: event?.error?.stack || null,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason =
      typeof event?.reason === "string"
        ? event.reason
        : event?.reason?.message || "Unhandled promise rejection";
    ipcRenderer.send("desktop:renderer-error", {
      kind: "unhandled-rejection",
      message: reason,
      stack: event?.reason?.stack || null,
    });
  });
}

wireRendererCrashLogging();

contextBridge.exposeInMainWorld("desktopAPI", {
  // Core
  isDesktop: () => ipcRenderer.invoke("desktop:is-desktop"),
  getSettings: () => ipcRenderer.invoke("desktop:get-settings"),
  updateSettings: (patch) => ipcRenderer.invoke("desktop:update-settings", patch),

  // Notifications
  notify: (payload) => ipcRenderer.invoke("desktop:notify", payload),
  getNotificationHistory: () => ipcRenderer.invoke("desktop:get-notification-history"),
  clearNotificationHistory: () => ipcRenderer.invoke("desktop:clear-notification-history"),

  // Badge count (tray + taskbar overlay)
  setBadgeCount: (count) => ipcRenderer.invoke("desktop:set-badge-count", count),
  getBadgeCount: () => ipcRenderer.invoke("desktop:get-badge-count"),

  // Zoom / display scale
  setZoomLevel: (factor) => ipcRenderer.invoke("desktop:set-zoom", factor),
  getZoomLevel: () => ipcRenderer.invoke("desktop:get-zoom"),
  zoomIn: () => ipcRenderer.invoke("desktop:zoom-in"),
  zoomOut: () => ipcRenderer.invoke("desktop:zoom-out"),
  zoomReset: () => ipcRenderer.invoke("desktop:zoom-reset"),

  // Taskbar flash
  flashFrame: (flag) => ipcRenderer.invoke("desktop:flash-frame", flag),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke("desktop:check-for-updates"),
  getUpdateState: () => ipcRenderer.invoke("desktop:get-update-state"),
  installUpdate: () => ipcRenderer.invoke("desktop:install-update"),

  // Health / diagnostics
  getHealth: () => ipcRenderer.invoke("desktop:get-health"),

  // Window management
  openMainWindow: () => ipcRenderer.invoke("desktop:open-main-window"),
  quit: () => ipcRenderer.invoke("desktop:quit"),

  // Auto-launch
  setLaunchOnStartup: (enabled) => ipcRenderer.invoke("desktop:set-launch-on-startup", enabled),
  getLaunchOnStartup: () => ipcRenderer.invoke("desktop:get-launch-on-startup"),

  // File system
  showOpenDialog: (options) => ipcRenderer.invoke("desktop:show-open-dialog", options),
  openPath: (targetPath) => ipcRenderer.invoke("desktop:open-path", targetPath),

  // Open a URL in the user's default system browser. Used so desktop users can enable
  // browser-based push notifications (Option A) — those pings keep arriving even when
  // the Electron app is fully closed.
  openExternal: (url) => ipcRenderer.invoke("desktop:open-external", url),

  // Event listeners
  onShortcut: (callback) => on("desktop:shortcut", callback),
  onRouteAction: (callback) => on("desktop:route-action", callback),
  onNotificationAction: (callback) => on("desktop:notification-action", callback),
  onUpdateState: (callback) => on("desktop:update-state", callback),
  onDeepLink: (callback) => on("desktop:deep-link", callback),
  onZoomChanged: (callback) => on("desktop:zoom-changed", callback),
});
