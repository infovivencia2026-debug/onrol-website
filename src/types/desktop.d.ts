export {};

declare global {
  interface Window {
    desktopAPI?: {
      isDesktop: () => Promise<boolean>;
      getSettings: () => Promise<Record<string, unknown>>;
      updateSettings: (patch: Record<string, unknown>) => Promise<Record<string, unknown>>;
      notify: (payload: {
        title: string;
        body?: string;
        action?: string;
        route?: string | null;
        meta?: Record<string, unknown> | null;
      }) => Promise<{ ok: boolean; reason?: string }>;
      getNotificationHistory: () => Promise<Array<Record<string, unknown>>>;
      clearNotificationHistory: () => Promise<boolean>;
      checkForUpdates: () => Promise<{ ok: boolean; message?: string }>;
      getUpdateState: () => Promise<Record<string, unknown>>;
      getHealth: () => Promise<Record<string, unknown>>;
      installUpdate: () => Promise<{ ok: boolean }>;
      openMainWindow: () => Promise<boolean>;
      setLaunchOnStartup: (enabled: boolean) => Promise<Record<string, unknown>>;
      getLaunchOnStartup: () => Promise<boolean>;
      showOpenDialog: (options?: Record<string, unknown>) => Promise<{ canceled: boolean; filePaths: string[] }>;
      openPath: (targetPath: string) => Promise<{ ok: boolean; error?: string | null }>;
      quit: () => Promise<boolean>;
      onShortcut: (callback: (payload: { action: string }) => void) => () => void;
      onRouteAction: (callback: (payload: { action: string }) => void) => () => void;
      onNotificationAction: (callback: (payload: { action: string; route?: string | null; meta?: Record<string, unknown> | null }) => void) => () => void;
      onUpdateState: (callback: (payload: Record<string, unknown>) => void) => () => void;
    };
  }
}
