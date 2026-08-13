const path = require("path");
const fs = require("fs");
const {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
  Menu,
  Tray,
  nativeImage,
  shell,
  dialog,
  globalShortcut,
  session,
} = require("electron");
const StoreModule = require("electron-store");
const Store = StoreModule.default || StoreModule;

let autoUpdater = null;
try {
  ({ autoUpdater } = require("electron-updater"));
} catch {
  autoUpdater = null;
}

const isDev = !app.isPackaged;
const devServerUrl = process.env.DEV_SERVER_URL || "http://127.0.0.1:5173";
const rendererIndexPath = path.join(__dirname, "..", "dist", "index.html");
const iconPath = path.join(__dirname, "..", "public", "favicon.png");
const desktopEntryHash = "/task";

// ── Single-instance lock ───────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

// ── Protocol handler for deep links (onrol://) ────────────────────────────
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("onrol", process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient("onrol");
}

const store = new Store({
  name: "desktop-settings",
  defaults: {
    windowBounds: { width: 1440, height: 900, maximized: false },
    desktopSettings: {
      runInBackground: true,
      notificationsEnabled: true,
      notificationSound: true,
      launchOnStartup: false,
      globalHotkeysEnabled: true,
      dndUntil: null,
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      desktopThemeDensity: "comfortable",
      zoomFactor: 1.0,
    },
    notificationHistory: [],
    updateState: { status: "idle", message: "", available: false },
  },
});

let mainWindow = null;
let tray = null;
let quitting = false;
let currentBadgeCount = 0;
const fallbackTaskUrl = "https://onrol.in/task";
const desktopLogPath = path.join(app.getPath("userData"), "desktop-runtime.log");

function isWithinQuietHours(start, end, date = new Date()) {
  if (!start || !end) return false;
  const [startHour, startMin] = String(start).split(":").map((v) => Number(v));
  const [endHour, endMin] = String(end).split(":").map((v) => Number(v));
  if (!Number.isFinite(startHour) || !Number.isFinite(startMin) || !Number.isFinite(endHour) || !Number.isFinite(endMin)) {
    return false;
  }
  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

function isDndActive(isoValue) {
  if (!isoValue) return false;
  const target = new Date(String(isoValue));
  if (Number.isNaN(target.getTime())) return false;
  return target.getTime() > Date.now();
}

function appendDesktopLog(type, message, meta = null) {
  const payload = {
    timestamp: new Date().toISOString(),
    type,
    message,
    meta,
  };
  try {
    // Rotate log if > 5 MB — keep last archive only
    if (fs.existsSync(desktopLogPath) && fs.statSync(desktopLogPath).size > 5 * 1024 * 1024) {
      const archivePath = desktopLogPath.replace(/\.log$/, ".old.log");
      try { if (fs.existsSync(archivePath)) fs.unlinkSync(archivePath); } catch { /* ignore */ }
      try { fs.renameSync(desktopLogPath, archivePath); } catch { /* ignore */ }
    }
    fs.appendFileSync(desktopLogPath, `${JSON.stringify(payload)}\n`, "utf8");
  } catch {
    // Ignore file system logging errors.
  }
}

function sendToRenderer(channel, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send(channel, payload);
}

// ── Badge count (macOS native + Windows overlay) ──────────────────────────
function applyBadgeCount(count) {
  currentBadgeCount = Math.max(0, count);
  // macOS / Unity-launcher badge
  try { app.setBadgeCount(currentBadgeCount); } catch { /* not all platforms */ }
  // Windows taskbar overlay icon
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (currentBadgeCount === 0) {
      try { mainWindow.setOverlayIcon(null, ""); } catch { /* ignore */ }
    } else {
      try {
        // Draw a small red circle with count text as a data URL and use it as overlay
        const size = 20;
        // nativeImage from dataURL requires base64 — generate it with a canvas-like approach
        // For Electron we can use nativeImage.createEmpty() if no canvas is available
        // Simple approach: use a pre-built icon path if exists, else skip overlay
        const overlayIconPath = path.join(__dirname, "..", "public", "badge-overlay.png");
        if (fs.existsSync(overlayIconPath)) {
          const overlayIcon = nativeImage.createFromPath(overlayIconPath).resize({ width: size, height: size });
          mainWindow.setOverlayIcon(overlayIcon, `${currentBadgeCount} unread`);
        }
      } catch { /* ignore */ }
    }
    // Flash taskbar (Windows / Linux) when new unread arrives
    if (currentBadgeCount > 0) {
      try { mainWindow.flashFrame(true); } catch { /* ignore */ }
    }
  }
  // Update tray tooltip with count
  if (tray) {
    const label = currentBadgeCount > 0 ? `ONROL Desktop • ${currentBadgeCount} unread` : "ONROL Desktop";
    try { tray.setToolTip(label); } catch { /* ignore */ }
  }
}

// ── Deep link URL parser ───────────────────────────────────────────────────
const VALID_DEEP_LINK_HOSTS = new Set(["task", "institution", "meeting", "dashboard", "chat", "journey"]);

function handleDeepLink(url) {
  if (!url) return;
  try {
    // onrol://task/ID  →  open task editor
    // onrol://institution/ID  →  open institution in CRM
    // onrol://meeting  →  open meeting room
    // onrol://dashboard  →  open dashboard
    const parsed = new URL(url);
    const host = parsed.hostname; // e.g. "task"
    // Whitelist validation — reject unknown deep link hosts
    if (!VALID_DEEP_LINK_HOSTS.has(host)) {
      appendDesktopLog("deep-link-blocked", `Blocked unknown deep link host: "${host}"`, { url });
      return;
    }
    const id = parsed.pathname.replace(/^\//, ""); // e.g. "uuid-123"
    // ID must be alphanumeric/hyphens only (UUID-safe)
    const safeId = /^[a-zA-Z0-9_-]*$/.test(id) ? id : "";
    const route = safeId ? `${host}/${safeId}` : host;
    showMainWindow();
    sendToRenderer("desktop:deep-link", { route, host, id: safeId || null, raw: url });
    appendDesktopLog("deep-link", `Handled deep link: ${url}`, { host, id: safeId });
  } catch (err) {
    appendDesktopLog("deep-link-error", `Failed to parse deep link: ${url}`, { error: err?.message });
  }
}

function createMainWindow() {
  const bounds = store.get("windowBounds");
  let fallbackTriggered = false;
  let readyToShowFired = false;
  let startupLoadGuard = null;

  const clearStartupLoadGuard = () => {
    if (!startupLoadGuard) return;
    clearTimeout(startupLoadGuard);
    startupLoadGuard = null;
  };

  const loadRemoteFallback = (reason, meta = null) => {
    if (!mainWindow || mainWindow.isDestroyed() || fallbackTriggered) return;
    fallbackTriggered = true;
    clearStartupLoadGuard();
    appendDesktopLog("fallback", "Switching renderer to remote task URL", {
      reason,
      meta,
      currentURL: mainWindow.webContents.getURL(),
    });
    mainWindow
      .loadURL(fallbackTaskUrl)
      .catch((error) => appendDesktopLog("fallback-error", error?.message || "Unknown fallback load error"));
  };

  const zoomFactor = store.get("desktopSettings.zoomFactor") || 1.0;

  mainWindow = new BrowserWindow({
    width: bounds.width || 1440,
    height: bounds.height || 900,
    x: bounds.x,
    y: bounds.y,
    minWidth: 800,
    minHeight: 600,
    title: "ONROL Desktop",
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    backgroundColor: "#0f172a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
      zoomFactor: Number(zoomFactor) || 1.0,
      backgroundThrottling: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL(`${devServerUrl}/#${desktopEntryHash}`);
  } else {
    mainWindow.loadFile(rendererIndexPath, { hash: desktopEntryHash });
  }

  startupLoadGuard = setTimeout(() => {
    if (!readyToShowFired) {
      loadRemoteFallback("ready-to-show-timeout", { timeoutMs: 15000 });
    }
  }, 15000);

  mainWindow.once("ready-to-show", () => {
    readyToShowFired = true;
    clearStartupLoadGuard();
    appendDesktopLog("ready", "Main window renderer ready-to-show", {
      url: mainWindow?.webContents.getURL(),
    });
    // Restore maximized state
    if (bounds.maximized) {
      mainWindow?.maximize();
    }
    mainWindow?.show();
    // Apply saved zoom
    try {
      mainWindow?.webContents.setZoomFactor(Number(zoomFactor) || 1.0);
    } catch { /* ignore */ }
  });

  mainWindow.on("close", (event) => {
    const desktopSettings = store.get("desktopSettings");
    if (!quitting && desktopSettings.runInBackground) {
      event.preventDefault();
      mainWindow?.hide();
      return;
    }
    const currentBounds = mainWindow?.getBounds();
    if (currentBounds) {
      store.set("windowBounds", {
        ...currentBounds,
        maximized: mainWindow?.isMaximized() ?? false,
      });
    }
  });

  const saveBounds = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    // Don't save bounds while maximized — save pre-maximize bounds instead
    if (mainWindow.isMaximized()) {
      store.set("windowBounds.maximized", true);
      return;
    }
    const currentBounds = mainWindow.getBounds();
    store.set("windowBounds", { ...currentBounds, maximized: false });
  };

  mainWindow.on("resized", saveBounds);
  mainWindow.on("moved", saveBounds);
  mainWindow.on("maximize", () => { store.set("windowBounds.maximized", true); });
  mainWindow.on("unmaximize", () => { store.set("windowBounds.maximized", false); });

  // Stop flashing when window is focused
  mainWindow.on("focus", () => {
    try { mainWindow?.flashFrame(false); } catch { /* ignore */ }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("did-start-loading", () => {
    appendDesktopLog("nav-start", "Renderer started loading", {
      url: mainWindow?.webContents.getURL(),
    });
  });

  mainWindow.webContents.on("did-finish-load", () => {
    appendDesktopLog("nav-finish", "Renderer finished loading", {
      url: mainWindow?.webContents.getURL(),
    });
  });

  mainWindow.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    appendDesktopLog("did-fail-load", errorDescription || "Unknown load error", {
      errorCode,
      validatedURL,
      isMainFrame,
    });
    if (isMainFrame) {
      loadRemoteFallback("did-fail-load", { errorCode, errorDescription, validatedURL });
    }
  });

  mainWindow.webContents.on("render-process-gone", (_event, details) => {
    appendDesktopLog("render-process-gone", "Renderer process exited unexpectedly", details || null);
    loadRemoteFallback("render-process-gone", details || null);
  });

  mainWindow.webContents.on("unresponsive", () => {
    appendDesktopLog("renderer-unresponsive", "Renderer became unresponsive");
    loadRemoteFallback("renderer-unresponsive");
  });

  mainWindow.webContents.on("context-menu", (_event, params) => {
    const menu = Menu.buildFromTemplate([
      ...(params.selectionText ? [{ label: "Copy", role: "copy" }] : []),
      ...(params.isEditable ? [{ label: "Paste", role: "paste" }] : []),
      ...(params.isEditable ? [{ label: "Cut", role: "cut" }] : []),
      { type: "separator" },
      {
        label: "Zoom",
        submenu: [
          { label: "Zoom In (Ctrl +=)", click: () => adjustZoom(0.1) },
          { label: "Zoom Out (Ctrl +-)", click: () => adjustZoom(-0.1) },
          { label: "Reset Zoom (Ctrl+0)", click: () => setZoomFactor(1.0) },
        ],
      },
      {
        label: "Quick Actions",
        submenu: [
          { label: "New Task", click: () => sendToRenderer("desktop:route-action", { action: "new-task" }) },
          { label: "Open Chat", click: () => sendToRenderer("desktop:route-action", { action: "open-chat" }) },
          { label: "Open Meetings", click: () => sendToRenderer("desktop:route-action", { action: "open-meeting" }) },
          { label: "Open Command Palette", click: () => sendToRenderer("desktop:shortcut", { action: "open-command-palette" }) },
        ],
      },
      { type: "separator" },
      { label: "Reload", role: "reload" },
      ...(isDev ? [{ label: "Toggle DevTools", role: "toggleDevTools" }] : []),
    ]);
    menu.popup({ window: mainWindow });
  });
}

function showMainWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

// ── Zoom control helpers ───────────────────────────────────────────────────
function setZoomFactor(factor) {
  const clamped = Math.max(0.5, Math.min(2.0, Number(factor) || 1.0));
  try {
    mainWindow?.webContents.setZoomFactor(clamped);
  } catch { /* ignore */ }
  // Persist
  const current = store.get("desktopSettings");
  store.set("desktopSettings", { ...current, zoomFactor: clamped });
  sendToRenderer("desktop:zoom-changed", { zoomFactor: clamped });
  return clamped;
}

function adjustZoom(delta) {
  try {
    const current = mainWindow?.webContents.getZoomFactor() ?? 1.0;
    return setZoomFactor(current + delta);
  } catch {
    return setZoomFactor(1.0);
  }
}

function buildTray() {
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });
  tray = new Tray(icon);
  tray.setToolTip("ONROL Desktop");
  const contextMenu = Menu.buildFromTemplate([
    { label: "Open ONROL", click: () => showMainWindow() },
    { type: "separator" },
    { label: "New Task", click: () => { showMainWindow(); sendToRenderer("desktop:route-action", { action: "new-task" }); } },
    { label: "Open Chat", click: () => { showMainWindow(); sendToRenderer("desktop:route-action", { action: "open-chat" }); } },
    { label: "Open Meeting", click: () => { showMainWindow(); sendToRenderer("desktop:route-action", { action: "open-meeting" }); } },
    { label: "Open Dashboard", click: () => { showMainWindow(); sendToRenderer("desktop:route-action", { action: "open-dashboard" }); } },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        quitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
  tray.on("double-click", showMainWindow);
  tray.on("click", showMainWindow);
}

function appendNotificationHistory(item) {
  const current = store.get("notificationHistory");
  const next = [
    {
      id: item.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      ...item,
    },
    ...current,
  ].slice(0, 250);
  store.set("notificationHistory", next);
}

function registerGlobalShortcuts() {
  globalShortcut.unregisterAll();
  const desktopSettings = store.get("desktopSettings");
  if (!desktopSettings.globalHotkeysEnabled) return;

  const tryRegister = (accelerator, fn) => {
    try { globalShortcut.register(accelerator, fn); } catch { /* skip if already registered */ }
  };

  tryRegister("CommandOrControl+Shift+Space", () => {
    showMainWindow();
    sendToRenderer("desktop:shortcut", { action: "open-app" });
  });
  tryRegister("CommandOrControl+Shift+N", () => {
    showMainWindow();
    sendToRenderer("desktop:route-action", { action: "new-task" });
  });
  tryRegister("CommandOrControl+K", () => {
    showMainWindow();
    sendToRenderer("desktop:shortcut", { action: "open-command-palette" });
  });
  tryRegister("CommandOrControl+1", () => {
    showMainWindow();
    sendToRenderer("desktop:route-action", { action: "open-dashboard" });
  });
  tryRegister("CommandOrControl+2", () => {
    showMainWindow();
    sendToRenderer("desktop:route-action", { action: "open-tasks" });
  });
  tryRegister("CommandOrControl+3", () => {
    showMainWindow();
    sendToRenderer("desktop:route-action", { action: "open-chat" });
  });
  // Zoom shortcuts
  tryRegister("CommandOrControl+=", () => adjustZoom(0.1));
  tryRegister("CommandOrControl+Plus", () => adjustZoom(0.1));
  tryRegister("CommandOrControl+-", () => adjustZoom(-0.1));
  tryRegister("CommandOrControl+0", () => setZoomFactor(1.0));
}

function configureAutoLaunch(enabled) {
  app.setLoginItemSettings({
    openAtLogin: Boolean(enabled),
    path: process.execPath,
  });
}

function setupAutoUpdater() {
  if (!autoUpdater) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  // Point to ONROL update server — serves latest.yml + delta packages
  try {
    autoUpdater.setFeedURL({
      provider: "generic",
      url: process.env.ELECTRON_UPDATE_URL || "https://onrol.in/updates/",
    });
  } catch { /* ignore — some builds don't support setFeedURL */ }

  autoUpdater.on("checking-for-update", () => {
    const state = { status: "checking", message: "Checking for updates...", available: false, progress: 0 };
    store.set("updateState", state);
    sendToRenderer("desktop:update-state", state);
  });
  autoUpdater.on("update-available", (info) => {
    const state = { status: "available", message: `Update ${info.version} available. Downloading...`, available: true, info, progress: 0 };
    store.set("updateState", state);
    sendToRenderer("desktop:update-state", state);
    // Notify the user
    applyBadgeCount(currentBadgeCount); // Refresh badge/tray
  });
  autoUpdater.on("update-not-available", () => {
    const state = { status: "up-to-date", message: "App is up to date", available: false, progress: 0 };
    store.set("updateState", state);
    sendToRenderer("desktop:update-state", state);
  });
  autoUpdater.on("download-progress", (progress) => {
    const state = {
      status: "downloading",
      message: `Downloading update… ${Math.round(progress.percent)}%`,
      available: true,
      progress: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    };
    store.set("updateState", state);
    sendToRenderer("desktop:update-state", state);
  });
  autoUpdater.on("update-downloaded", (info) => {
    const state = { status: "ready", message: `v${info.version} ready — restart to install.`, available: true, progress: 100 };
    store.set("updateState", state);
    sendToRenderer("desktop:update-state", state);
    // Show native notification
    try {
      const n = new Notification({
        title: "ONROL Update Ready",
        body: `Version ${info.version} has been downloaded. Restart to install.`,
      });
      n.on("click", () => { autoUpdater.quitAndInstall(); });
      n.show();
    } catch { /* ignore */ }
  });
  autoUpdater.on("error", (error) => {
    const state = { status: "error", message: error?.message || "Update check failed", available: false, progress: 0 };
    store.set("updateState", state);
    sendToRenderer("desktop:update-state", state);
  });
}

function registerIpc() {
  ipcMain.handle("desktop:is-desktop", () => true);
  ipcMain.handle("desktop:open-external", async (_event, url) => {
    if (typeof url !== "string") return { ok: false, reason: "invalid-url" };
    // Whitelist protocols so we never open file:// or arbitrary exe paths.
    if (!/^https?:\/\//i.test(url) && !url.startsWith("mailto:")) {
      return { ok: false, reason: "unsupported-protocol" };
    }
    try {
      await shell.openExternal(url);
      return { ok: true };
    } catch (err) {
      return { ok: false, reason: err?.message || "open-failed" };
    }
  });
  ipcMain.handle("desktop:get-settings", () => store.get("desktopSettings"));
  ipcMain.handle("desktop:update-settings", (_event, patch) => {
    const current = store.get("desktopSettings");
    const next = { ...current, ...patch };
    store.set("desktopSettings", next);
    configureAutoLaunch(next.launchOnStartup);
    registerGlobalShortcuts();
    // Apply zoom if changed
    if (patch.zoomFactor !== undefined) {
      setZoomFactor(Number(patch.zoomFactor));
    }
    return next;
  });
  ipcMain.handle("desktop:get-update-state", () => store.get("updateState"));
  ipcMain.handle("desktop:check-for-updates", async () => {
    if (!autoUpdater) {
      return { ok: false, message: "Auto-updater not available" };
    }
    try {
      await autoUpdater.checkForUpdatesAndNotify();
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error?.message || "Failed to check updates" };
    }
  });
  ipcMain.handle("desktop:install-update", () => {
    if (!autoUpdater) return { ok: false };
    autoUpdater.quitAndInstall();
    return { ok: true };
  });
  ipcMain.handle("desktop:get-notification-history", () => store.get("notificationHistory"));
  ipcMain.handle("desktop:clear-notification-history", () => {
    store.set("notificationHistory", []);
    return true;
  });
  ipcMain.handle("desktop:notify", (_event, payload) => {
    const settings = store.get("desktopSettings");
    if (!settings.notificationsEnabled) return { ok: false, reason: "disabled" };
    if (isDndActive(settings.dndUntil)) return { ok: false, reason: "dnd-active" };
    if (settings.quietHoursEnabled && isWithinQuietHours(settings.quietHoursStart, settings.quietHoursEnd)) return { ok: false, reason: "quiet-hours" };
    appendNotificationHistory(payload);
    if (!Notification.isSupported()) return { ok: false, reason: "unsupported" };
    if (settings.notificationSound) {
      const type = String(payload?.meta?.type || "").toLowerCase();
      const severity = String(payload?.meta?.severity || "").toLowerCase();
      try {
        if (type.includes("message")) {
          app.beep();
        } else if (severity === "high") {
          app.beep();
          setTimeout(() => app.beep(), 180);
        } else {
          app.beep();
        }
      } catch {
        // best-effort
      }
    }
    const notification = new Notification({
      title: payload.title || "ONROL",
      body: payload.body || "",
      silent: !settings.notificationSound,
    });
    notification.on("click", () => {
      showMainWindow();
      sendToRenderer("desktop:notification-action", {
        action: payload.action || "open",
        route: payload.route || null,
        meta: payload.meta || null,
      });
    });
    notification.show();
    return { ok: true };
  });

  // ── Badge count ────────────────────────────────────────────────────────
  ipcMain.handle("desktop:set-badge-count", (_event, count) => {
    applyBadgeCount(Number(count) || 0);
    return { ok: true, count: currentBadgeCount };
  });
  ipcMain.handle("desktop:get-badge-count", () => currentBadgeCount);

  // ── Zoom ──────────────────────────────────────────────────────────────
  ipcMain.handle("desktop:set-zoom", (_event, factor) => {
    const result = setZoomFactor(Number(factor));
    return { ok: true, zoomFactor: result };
  });
  ipcMain.handle("desktop:get-zoom", () => {
    try { return mainWindow?.webContents.getZoomFactor() ?? 1.0; } catch { return 1.0; }
  });
  ipcMain.handle("desktop:zoom-in",  () => ({ ok: true, zoomFactor: adjustZoom(0.1) }));
  ipcMain.handle("desktop:zoom-out", () => ({ ok: true, zoomFactor: adjustZoom(-0.1) }));
  ipcMain.handle("desktop:zoom-reset", () => ({ ok: true, zoomFactor: setZoomFactor(1.0) }));

  // ── Flash frame ────────────────────────────────────────────────────────
  ipcMain.handle("desktop:flash-frame", (_event, flag) => {
    try { mainWindow?.flashFrame(Boolean(flag)); } catch { /* ignore */ }
    return { ok: true };
  });

  ipcMain.handle("desktop:get-health", () => {
    const settings = store.get("desktopSettings");
    return {
      trayReady: Boolean(tray),
      windowReady: Boolean(mainWindow && !mainWindow.isDestroyed()),
      backgroundEnabled: Boolean(settings.runInBackground),
      startupEnabled: Boolean(app.getLoginItemSettings().openAtLogin),
      notificationsEnabled: Boolean(settings.notificationsEnabled),
      notificationSupported: Notification.isSupported(),
      notificationPermission: "system-managed",
      dndActive: isDndActive(settings.dndUntil),
      quietHoursEnabled: Boolean(settings.quietHoursEnabled),
      quietHoursActive: Boolean(settings.quietHoursEnabled) && isWithinQuietHours(settings.quietHoursStart, settings.quietHoursEnd),
      userDataPath: app.getPath("userData"),
      logPath: desktopLogPath,
      zoomFactor: settings.zoomFactor ?? 1.0,
      badgeCount: currentBadgeCount,
      version: app.getVersion(),
      platform: process.platform,
    };
  });
  ipcMain.handle("desktop:open-main-window", () => {
    showMainWindow();
    return true;
  });
  ipcMain.handle("desktop:set-launch-on-startup", (_event, enabled) => {
    configureAutoLaunch(Boolean(enabled));
    const current = store.get("desktopSettings");
    const next = { ...current, launchOnStartup: Boolean(enabled) };
    store.set("desktopSettings", next);
    return next;
  });
  ipcMain.handle("desktop:get-launch-on-startup", () => app.getLoginItemSettings().openAtLogin);
  ipcMain.handle("desktop:quit", () => {
    quitting = true;
    app.quit();
    return true;
  });
  ipcMain.handle("desktop:show-open-dialog", async (_event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: options?.properties || ["openFile"],
      filters: options?.filters || [],
      title: options?.title || "Select files",
    });
    return result;
  });
  ipcMain.handle("desktop:open-path", async (_event, targetPath) => {
    if (!targetPath) return { ok: false };
    const err = await shell.openPath(targetPath);
    return { ok: !err, error: err || null };
  });
  ipcMain.on("desktop:renderer-error", (_event, payload) => {
    appendDesktopLog("renderer-error", payload?.message || "Renderer error", payload || null);
  });
}

// ── Second-instance → show window + handle deep link ─────────────────────
app.on("second-instance", (_event, argv) => {
  showMainWindow();
  // On Windows/Linux, deep link URL is passed as argv
  const deepLink = argv.find((arg) => arg.startsWith("onrol://"));
  if (deepLink) handleDeepLink(deepLink);
});

// ── macOS deep link via open-url event ────────────────────────────────────
app.on("open-url", (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

app.whenReady().then(() => {
  // ── Content Security Policy ────────────────────────────────────────────────
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;" +
          " connect-src 'self' https://*.supabase.co wss://*.supabase.co" +
          " https://fcm.googleapis.com https://oauth2.googleapis.com" +
          " https://onrol.in https://api.onrol.in;" +
          " img-src 'self' data: blob: https:;" +
          " font-src 'self' data: https://fonts.gstatic.com;" +
          " style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;" +
          " media-src 'self' blob:;" +
          " worker-src 'self' blob:;" +
          " frame-src 'none';" +
          " object-src 'none';",
        ],
        "X-Content-Type-Options": ["nosniff"],
        "X-Frame-Options": ["DENY"],
      },
    });
  });

  createMainWindow();
  buildTray();
  registerIpc();
  setupAutoUpdater();
  configureAutoLaunch(store.get("desktopSettings").launchOnStartup);
  registerGlobalShortcuts();

  // Check for deep link in initial argv (Windows/Linux)
  const deepLink = process.argv.find((arg) => arg.startsWith("onrol://"));
  if (deepLink) {
    mainWindow?.once("ready-to-show", () => handleDeepLink(deepLink));
  }

  app.on("activate", () => {
    if (!BrowserWindow.getAllWindows().length) createMainWindow();
    else showMainWindow();
  });
});

app.on("before-quit", () => {
  quitting = true;
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
