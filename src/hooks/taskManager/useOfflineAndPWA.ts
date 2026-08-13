import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  enqueueOfflineAction,
  getOfflineQueueItems,
  nextRetryAtIso,
  removeQueueItem,
  updateQueueItem,
  type OfflineQueueItem,
} from "@/lib/offlineQueue";
import { isStandaloneMode, type BeforeInstallPromptEvent } from "@/lib/pwa";
import { getErrorMessage } from "@/utils/taskManager";

export interface UseOfflineAndPWAReturn {
  isOffline: boolean;
  queueItems: OfflineQueueItem[];
  syncingQueue: boolean;
  installPromptEvent: BeforeInstallPromptEvent | null;
  setInstallPromptEvent: Dispatch<SetStateAction<BeforeInstallPromptEvent | null>>;
  showInstallBanner: boolean;
  setShowInstallBanner: Dispatch<SetStateAction<boolean>>;
  showPwaOnboarding: boolean;
  setShowPwaOnboarding: Dispatch<SetStateAction<boolean>>;
  isStandalone: boolean;
  setIsStandalone: Dispatch<SetStateAction<boolean>>;
  queueSummary: { pending: number; failed: number; total: number };
  loadQueueItems: () => Promise<void>;
  processOfflineQueue: () => Promise<void>;
  handleInstallPWA: () => Promise<void>;
  dismissInstallBanner: () => void;
  dismissPwaOnboarding: () => void;
}

export function useOfflineAndPWA(
  officeUser: { id: string } | null,
  refreshTasks: () => Promise<void>,
  logActivityEvent: (event: {
    eventType: string;
    summary: string;
    visitTaskId?: string | null;
    metadata?: Record<string, unknown>;
  }) => Promise<void>,
): UseOfflineAndPWAReturn {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [queueItems, setQueueItems] = useState<OfflineQueueItem[]>([]);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showPwaOnboarding, setShowPwaOnboarding] = useState(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(isStandaloneMode());

  const queueSyncInFlight = useRef(false);

  const queueSummary = useMemo(() => {
    const pending = queueItems.filter((item) => item.status === "pending").length;
    const failed = queueItems.filter((item) => item.status === "failed").length;
    return { pending, failed, total: queueItems.length };
  }, [queueItems]);

  const loadQueueItems = useCallback(async () => {
    try {
      const rows = await getOfflineQueueItems();
      setQueueItems(rows);
    } catch {
      // Queue is optional; continue without blocking main task flow.
    }
  }, []);

  const executeQueueItem = useCallback(
    async (item: OfflineQueueItem) => {
      if (item.actionType === "create_task") {
        const { error } = await supabase.from("office_tasks").insert(item.payload);
        if (error) throw error;
        return;
      }
      if (item.actionType === "update_task") {
        const targetId = item.entityId;
        if (!targetId) throw new Error("Missing queue entityId for update action.");
        const { error } = await supabase
          .from("office_tasks")
          .update(item.payload)
          .eq("id", targetId);
        if (error) throw error;
      }
    },
    [],
  );

  const processOfflineQueue = useCallback(async () => {
    if (queueSyncInFlight.current || !navigator.onLine) return;
    queueSyncInFlight.current = true;
    setSyncingQueue(true);
    try {
      const rows = await getOfflineQueueItems();
      const now = Date.now();
      for (const item of rows) {
        if (item.status === "synced") {
          await removeQueueItem(item.id);
          continue;
        }
        if (item.nextRetryAt && new Date(item.nextRetryAt).getTime() > now) continue;
        try {
          await executeQueueItem(item);
          await removeQueueItem(item.id);
          await logActivityEvent({
            eventType: "offline_action_synced",
            summary: `Offline action synced: ${item.actionType}`,
            visitTaskId: item.entityId ?? null,
            metadata: { queue_id: item.id, action_type: item.actionType },
          });
        } catch (error: unknown) {
          const retries = (item.retries || 0) + 1;
          await updateQueueItem({
            ...item,
            status: "failed",
            retries,
            updatedAt: new Date().toISOString(),
            nextRetryAt: nextRetryAtIso(retries),
            lastError: getErrorMessage(error, "sync_failed"),
          });
        }
      }
      await loadQueueItems();
      if (officeUser) {
        await refreshTasks();
      }
    } finally {
      queueSyncInFlight.current = false;
      setSyncingQueue(false);
    }
  }, [executeQueueItem, loadQueueItems, officeUser, refreshTasks, logActivityEvent]);

  // Online/offline event listeners
  useEffect(() => {
    void loadQueueItems();
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Back online. Syncing pending updates.");
      void processOfflineQueue();
    };
    const handleOffline = () => {
      setIsOffline(true);
      toast.message("Offline mode enabled. Changes will sync automatically.");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [loadQueueItems, processOfflineQueue]);

  // PWA install prompt and display mode detection
  useEffect(() => {
    const dismissedInstall =
      localStorage.getItem("task-pwa-install-dismissed") === "1";
    const dismissedOnboarding =
      localStorage.getItem("task-pwa-onboarding-dismissed") === "1";
    setShowPwaOnboarding(!dismissedOnboarding);
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPromptEvent(event as BeforeInstallPromptEvent);
      if (!dismissedInstall) setShowInstallBanner(true);
    };
    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => setIsStandalone(isStandaloneMode());
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onDisplayModeChange);
    } else if (typeof media.addListener === "function") {
      media.addListener(onDisplayModeChange);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", onDisplayModeChange);
      } else if (typeof media.removeListener === "function") {
        media.removeListener(onDisplayModeChange);
      }
    };
  }, []);

  const handleInstallPWA = useCallback(async () => {
    if (!installPromptEvent) {
      toast.error("Install prompt is not available right now.");
      return;
    }
    try {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      if (choice.outcome === "accepted") {
        toast.success("App install started.");
        setShowInstallBanner(false);
      }
    } catch {
      toast.error("Install prompt unavailable right now.");
    }
  }, [installPromptEvent]);

  const dismissInstallBanner = useCallback(() => {
    setShowInstallBanner(false);
    localStorage.setItem("task-pwa-install-dismissed", "1");
  }, []);

  const dismissPwaOnboarding = useCallback(() => {
    setShowPwaOnboarding(false);
    localStorage.setItem("task-pwa-onboarding-dismissed", "1");
  }, []);

  return {
    isOffline,
    queueItems,
    syncingQueue,
    installPromptEvent,
    setInstallPromptEvent,
    showInstallBanner,
    setShowInstallBanner,
    showPwaOnboarding,
    setShowPwaOnboarding,
    isStandalone,
    setIsStandalone,
    queueSummary,
    loadQueueItems,
    processOfflineQueue,
    handleInstallPWA,
    dismissInstallBanner,
    dismissPwaOnboarding,
  };
}

export default useOfflineAndPWA;
