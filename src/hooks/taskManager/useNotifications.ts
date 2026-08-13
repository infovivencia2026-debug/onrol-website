import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  msgListNotifications,
  msgInsertNotification,
  msgMarkNotificationsRead,
  msgMarkAllNotificationsRead,
  msgDeleteAllNotifications,
  msgOpenStream,
  type MsgStreamHandle,
} from "@/lib/messengerClient";
import { tmListOfficeUsers, tmUpsertNotificationPrefs } from "@/lib/tmClient";
import type {
  NotificationItem,
  NotificationPrefs,
  NotificationSeverity,
  NotificationType,
  AutomationSettings,
  OfficeUser,
} from "@/types/taskManager";
import {
  defaultNotificationPrefs,
  defaultAutomationSettings,
} from "@/types/taskManager";
import { getErrorMessage } from "@/utils/taskManager";
import { desktopNotify, isDesktopRuntime } from "@/lib/desktopBridge";
import { playOverdueTone as playOverdueToneFx, playTaskReminderTone as playTaskReminderToneFx } from "@/lib/soundNotifications";

const DND_KEY = "task-notification-dnd-until";
const QUIET_HOURS_ENABLED_KEY = "task-notification-quiet-hours-enabled";
const QUIET_HOURS_START_KEY = "task-notification-quiet-hours-start";
const QUIET_HOURS_END_KEY = "task-notification-quiet-hours-end";
const CHANNEL_MESSAGES_KEY = "task-notification-channel-messages";
const CHANNEL_TASKS_KEY = "task-notification-channel-tasks";
const CHANNEL_MEETINGS_KEY = "task-notification-channel-meetings";
const CHANNEL_ADMIN_KEY = "task-notification-channel-admin";

function isWithinQuietHours(start: string, end: string, date = new Date()) {
  const [startHour, startMin] = String(start).split(":").map((v) => Number(v));
  const [endHour, endMin] = String(end).split(":").map((v) => Number(v));
  if (!Number.isFinite(startHour) || !Number.isFinite(startMin) || !Number.isFinite(endHour) || !Number.isFinite(endMin)) return false;
  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
}

function shouldSuppressActiveAlerts() {
  if (typeof window === "undefined") return false;
  const dndUntil = window.localStorage.getItem(DND_KEY);
  if (dndUntil) {
    const dndDate = new Date(dndUntil);
    if (!Number.isNaN(dndDate.getTime()) && dndDate.getTime() > Date.now()) return true;
  }
  const quietEnabled = window.localStorage.getItem(QUIET_HOURS_ENABLED_KEY) === "1";
  if (!quietEnabled) return false;
  const quietStart = window.localStorage.getItem(QUIET_HOURS_START_KEY) || "22:00";
  const quietEnd = window.localStorage.getItem(QUIET_HOURS_END_KEY) || "07:00";
  return isWithinQuietHours(quietStart, quietEnd);
}

function isChannelEnabledForType(typeValue: string) {
  if (typeof window === "undefined") return true;
  const type = String(typeValue || "").toLowerCase();
  const readEnabled = (key: string) => {
    const value = window.localStorage.getItem(key);
    return value === null ? true : value === "1";
  };
  if (type.includes("message") || type.includes("chat") || type.includes("mention")) {
    return readEnabled(CHANNEL_MESSAGES_KEY);
  }
  if (type.includes("meeting")) {
    return readEnabled(CHANNEL_MEETINGS_KEY);
  }
  if (type.includes("admin")) {
    return readEnabled(CHANNEL_ADMIN_KEY);
  }
  return readEnabled(CHANNEL_TASKS_KEY);
}

export interface UseNotificationsReturn {
  // Notification state
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  notificationsBusy: boolean;
  setNotificationsBusy: React.Dispatch<React.SetStateAction<boolean>>;
  notificationsError: string | null;
  setNotificationsError: React.Dispatch<React.SetStateAction<string | null>>;

  // Panel state
  notifPanelOpen: boolean;
  setNotifPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  quickActionsOpen: boolean;
  setQuickActionsOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Preferences & automation
  notificationPrefs: NotificationPrefs;
  setNotificationPrefs: React.Dispatch<React.SetStateAction<NotificationPrefs>>;
  automationSettings: AutomationSettings;
  setAutomationSettings: React.Dispatch<React.SetStateAction<AutomationSettings>>;
  runningAutomation: boolean;
  setRunningAutomation: React.Dispatch<React.SetStateAction<boolean>>;

  // Push notification state
  pushBusy: boolean;
  setPushBusy: React.Dispatch<React.SetStateAction<boolean>>;
  pushAction: "enable" | "test" | "reminder" | null;
  setPushAction: React.Dispatch<React.SetStateAction<"enable" | "test" | "reminder" | null>>;
  pushStatus: "idle" | "enabled" | "error";
  setPushStatus: React.Dispatch<React.SetStateAction<"idle" | "enabled" | "error">>;
  pushMessage: string;
  setPushMessage: React.Dispatch<React.SetStateAction<string>>;

  // Notification settings (local)
  notifSettings: {
    dailyDigest: boolean;
    dueTodayAlert: boolean;
    overdueAlert: boolean;
    commentMentions: boolean;
    sound_enabled: boolean;
  };
  setNotifSettings: React.Dispatch<
    React.SetStateAction<{
      dailyDigest: boolean;
      dueTodayAlert: boolean;
      overdueAlert: boolean;
      commentMentions: boolean;
      sound_enabled: boolean;
    }>
  >;

  // Refs
  notifPanelRef: React.RefObject<HTMLDivElement>;
  notifBellRef: React.RefObject<HTMLButtonElement>;
  quickActionsRef: React.RefObject<HTMLDivElement>;
  quickActionsButtonRef: React.RefObject<HTMLButtonElement>;
  seenNotificationIdsRef: React.MutableRefObject<Set<string>>;
  browserNotifPermissionAskedRef: React.MutableRefObject<boolean>;
  notificationWatchPrimedRef: React.MutableRefObject<boolean>;

  // Computed
  unreadNotificationCount: number;

  // Functions
  normalizeNotificationRecord: (row: Record<string, unknown>) => NotificationItem;
  loadNotificationsForUser: (userId: string) => Promise<{ items: NotificationItem[]; error: string | null }>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  createInAppNotification: (input: {
    userId: string;
    type: NotificationType | string;
    title: string;
    message: string;
    severity?: NotificationSeverity;
    actionUrl?: string | null;
    relatedVisitTaskId?: string | null;
    relatedInstitutionId?: string | null;
    dedupeFingerprint?: string | null;
    cooldownHours?: number;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  playNotificationTone: () => void;
  playMessageTone: () => void;
  showBrowserNotification: (item: NotificationItem) => void;
  notifyAdminsForVisitEvent: (
    sourceTask: import("@/types/taskManager").OfficeTask,
    title: string,
    message: string,
    severity?: NotificationSeverity,
  ) => Promise<void>;
  logNotificationDelivery: (payload: {
    notificationId?: string | null;
    userId: string;
    channel: "in_app" | "push";
    status: "queued" | "sent" | "failed" | "skipped";
    error?: string | null;
  }) => Promise<void>;
  withUiTimeout: <T,>(promise: PromiseLike<T>, timeoutMs: number, timeoutLabel: string) => Promise<T>;
  enablePushNotifications: () => Promise<void>;
  sendTestPushNotification: () => Promise<void>;
  sendReminderPushNotifications: () => Promise<void>;
}

export default function useNotifications(officeUser: OfficeUser | null): UseNotificationsReturn {
  const navigate = useNavigate();

  // --- State: notifications ---
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsBusy, setNotificationsBusy] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);

  // --- State: panel open ---
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  // --- State: preferences & automation ---
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs);
  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>(defaultAutomationSettings);
  const [runningAutomation, setRunningAutomation] = useState(false);

  // --- State: push ---
  const [pushBusy, setPushBusy] = useState(false);
  const [pushAction, setPushAction] = useState<"enable" | "test" | "reminder" | null>(null);
  const [pushStatus, setPushStatus] = useState<"idle" | "enabled" | "error">("idle");
  const [pushMessage, setPushMessage] = useState("");

  // --- State: notifSettings ---
  const [notifSettings, setNotifSettings] = useState({
    dailyDigest: true,
    dueTodayAlert: true,
    overdueAlert: true,
    commentMentions: true,
    sound_enabled: true,
  });

  // --- Refs ---
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const notifBellRef = useRef<HTMLButtonElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const quickActionsButtonRef = useRef<HTMLButtonElement>(null);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const browserNotifPermissionAskedRef = useRef(false);
  const notificationWatchPrimedRef = useRef(false);

  const webPushConfigured = Boolean((import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim());

  // --- normalizeNotificationRecord ---
  const normalizeNotificationRecord = useCallback((row: Record<string, unknown>): NotificationItem => {
    const metadata = (row.metadata as Record<string, unknown> | null) || null;
    return {
      id: String(row.id || ""),
      user_id: String(row.user_id || row.user_external_id || row.recipient_id || ""),
      type: String(row.type || row.notification_type || "system"),
      title: String(row.title || "Notification"),
      message: String(row.message || ""),
      severity: (String(row.severity || "medium") as NotificationSeverity),
      action_url: (row.action_url as string | null) || null,
      related_visit_task_id: (row.related_visit_task_id as string | null) || null,
      related_institution_id: (row.related_institution_id as string | null) || null,
      metadata,
      dedupe_fingerprint:
        (row.dedupe_fingerprint as string | null) ||
        (metadata && typeof metadata.dedupeFingerprint === "string" ? metadata.dedupeFingerprint : null),
      is_read: Boolean(row.is_read),
      is_push_sent: Boolean(row.is_push_sent),
      push_sent_at: (row.push_sent_at as string | null) || null,
      created_at: String(row.created_at || new Date().toISOString()),
      read_at: (row.read_at as string | null) || null,
    };
  }, []);

  // --- loadNotificationsForUser ---
  const loadNotificationsForUser = useCallback(
    async (userId: string) => {
      try {
        const rows = await msgListNotifications({ limit: 120 });
        const clearedAt = localStorage.getItem(`notif-cleared-${userId}`);
        const applyFilter = (items: NotificationItem[]) =>
          clearedAt ? items.filter((n) => new Date(n.created_at) > new Date(clearedAt)) : items;
        return {
          items: applyFilter(rows.map(normalizeNotificationRecord)),
          error: null as string | null,
        };
      } catch (error: unknown) {
        return {
          items: [] as NotificationItem[],
          error: getErrorMessage(error, "Failed to load notifications"),
        };
      }
    },
    [normalizeNotificationRecord],
  );

  // --- logNotificationDelivery ---
  // Server-side delivery logging is owned by the CRM; the client no
  // longer writes to notification_delivery_log directly. Kept as a no-op
  // to preserve the interface for callers.
  const logNotificationDelivery = useCallback(
    async (_payload: {
      notificationId?: string | null;
      userId: string;
      channel: "in_app" | "push";
      status: "queued" | "sent" | "failed" | "skipped";
      error?: string | null;
    }) => {
      void _payload;
    },
    [],
  );

  // --- withUiTimeout ---
  const withUiTimeout = useCallback(
    async <T,>(promise: PromiseLike<T>, timeoutMs: number, timeoutLabel: string): Promise<T> => {
      let timer: ReturnType<typeof setTimeout> | null = null;
      try {
        return await Promise.race([
          promise,
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error(timeoutLabel)), timeoutMs);
          }),
        ]);
      } finally {
        if (timer) clearTimeout(timer);
      }
    },
    [],
  );

  // --- markNotificationRead ---
  const markNotificationRead = useCallback(
    async (id: string) => {
      try {
        setNotificationsBusy(true);
        await withUiTimeout(
          msgMarkNotificationsRead([id]),
          12000,
          "Notification update timed out. Please retry.",
        );
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item)),
        );
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to mark notification as read."));
      } finally {
        setNotificationsBusy(false);
      }
    },
    [withUiTimeout],
  );

  // --- markAllNotificationsRead ---
  const markAllNotificationsRead = useCallback(async () => {
    if (!officeUser) return;
    const unreadIds = notifications.filter((item) => !item.is_read).map((item) => item.id);
    if (!unreadIds.length) return;
    try {
      setNotificationsBusy(true);
      await withUiTimeout(
        msgMarkAllNotificationsRead(),
        12000,
        "Mark-all request timed out. Please retry.",
      );
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true, read_at: item.read_at || new Date().toISOString() })));
      toast.success(`Marked ${unreadIds.length} notifications as read.`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to mark all notifications read."));
    } finally {
      setNotificationsBusy(false);
    }
  }, [officeUser, notifications, withUiTimeout]);

  // --- clearAllNotifications ---
  const clearAllNotifications = useCallback(async () => {
    if (!officeUser) return;
    try {
      setNotificationsBusy(true);
      await withUiTimeout(
        msgDeleteAllNotifications(),
        12000,
        "Delete timed out.",
      ).catch(() => undefined);
      // Keep the "cleared at" timestamp as a belt-and-braces filter for any
      // rows that may have raced in between the SSE stream and the delete.
      localStorage.setItem(`notif-cleared-${officeUser.id}`, new Date().toISOString());
      setNotifications([]);
      toast.success("All notifications cleared.");
    } finally {
      setNotificationsBusy(false);
    }
  }, [officeUser, withUiTimeout]);

  // --- createInAppNotification ---
  const createInAppNotification = useCallback(
    async (input: {
      userId: string;
      type: NotificationType | string;
      title: string;
      message: string;
      severity?: NotificationSeverity;
      actionUrl?: string | null;
      relatedVisitTaskId?: string | null;
      relatedInstitutionId?: string | null;
      dedupeFingerprint?: string | null;
      cooldownHours?: number;
      metadata?: Record<string, unknown>;
    }) => {
      try {
        const cooldownHours = input.cooldownHours ?? 12;
        if (input.dedupeFingerprint) {
          const cutoff = Date.now() - cooldownHours * 60 * 60 * 1000;
          const recent = await msgListNotifications({ limit: 80 }).catch(() => []);
          const isDup = recent.some((row) => {
            const md = (row.metadata as Record<string, unknown> | null) || null;
            const fp = (row.dedupe_fingerprint as string | null)
              ?? (md && typeof md.dedupeFingerprint === "string" ? md.dedupeFingerprint : null);
            if (fp !== input.dedupeFingerprint) return false;
            const createdAt = typeof row.created_at === "string" ? Date.parse(row.created_at) : NaN;
            return Number.isFinite(createdAt) && createdAt >= cutoff;
          });
          if (isDup) return;
        }
        await msgInsertNotification({
          userExternalId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          severity: input.severity || "medium",
          actionUrl: input.actionUrl || null,
          relatedVisitTaskId: input.relatedVisitTaskId || null,
          relatedInstitutionId: input.relatedInstitutionId || null,
          metadata: {
            ...(input.metadata || {}),
            ...(input.dedupeFingerprint ? { dedupeFingerprint: input.dedupeFingerprint } : {}),
          },
        });
      } catch {
        // Notification insert is best-effort; UI continues regardless.
      }
    },
    [],
  );

  // --- playNotificationTone: rich bell chime for task/system notifications ---
  const playNotificationTone = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!notifSettings.sound_enabled) return;
    try {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      const ctx = new AudioContextCtor();
      const schedule = () => {
        const now = ctx.currentTime;
        const addBellPartial = (freq: number, peakGain: number, decayEnd: number) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(peakGain, now + 0.004);
          g.gain.exponentialRampToValueAtTime(0.0001, now + decayEnd);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + decayEnd + 0.02);
        };
        addBellPartial(1046.5, 0.22, 0.55);
        addBellPartial(2093.0, 0.10, 0.30);
        addBellPartial(3136.0, 0.05, 0.18);
        window.setTimeout(() => {
          const now2 = ctx.currentTime;
          const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.0001, now2);
          const addPartial2 = (freq: number, peak: number, decay: number) => {
            const osc = ctx.createOscillator(); const g = ctx.createGain();
            osc.type = "sine"; osc.frequency.setValueAtTime(freq, now2);
            g.gain.setValueAtTime(0.0001, now2); g.gain.exponentialRampToValueAtTime(peak, now2 + 0.004);
            g.gain.exponentialRampToValueAtTime(0.0001, now2 + decay);
            osc.connect(g); g.connect(ctx.destination); osc.start(now2); osc.stop(now2 + decay + 0.02);
          };
          addPartial2(1568.0, 0.16, 0.45);
          addPartial2(3136.0, 0.06, 0.20);
        }, 180);
        window.setTimeout(() => { void ctx.close().catch(() => undefined); }, 900);
      };
      if (ctx.state === "suspended") {
        void ctx.resume().then(schedule).catch(() => undefined);
      } else {
        schedule();
      }
    } catch {
      // no-op: audio is best effort only
    }
  }, [notifSettings.sound_enabled]);

  // --- playMessageTone: clean two-note pop for incoming chat messages ---
  const playMessageTone = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!notifSettings.sound_enabled) return;
    try {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      const ctx = new AudioContextCtor();
      const schedule = () => {
        const now = ctx.currentTime;
        const playPop = (startTime: number, freq: number, peakGain: number, duration: number) => {
          const osc = ctx.createOscillator();
          const harm = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, startTime);
          harm.type = "sine";
          harm.frequency.setValueAtTime(freq * 2, startTime);
          const harmGain = ctx.createGain();
          harmGain.gain.setValueAtTime(peakGain * 0.3, startTime);
          g.gain.setValueAtTime(0.0001, startTime);
          g.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.006);
          g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
          osc.connect(g);
          harm.connect(harmGain);
          harmGain.connect(ctx.destination);
          g.connect(ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + duration + 0.01);
          harm.start(startTime);
          harm.stop(startTime + duration * 0.5);
        };
        playPop(now, 659.3, 0.13, 0.12);
        playPop(now + 0.14, 1046.5, 0.11, 0.16);
        window.setTimeout(() => { void ctx.close().catch(() => undefined); }, 500);
      };
      if (ctx.state === "suspended") {
        void ctx.resume().then(schedule).catch(() => undefined);
      } else {
        schedule();
      }
    } catch {
      // no-op: audio is best effort only
    }
  }, [notifSettings.sound_enabled]);

  // --- showBrowserNotification ---
  const showBrowserNotification = useCallback(
    (item: NotificationItem) => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (document.visibilityState === "visible") return;
      if (Notification.permission !== "granted") return;
      try {
        const notification = new Notification(item.title, {
          body: item.message || "You have a new update.",
          tag: `task-${item.id}`,
        });
        notification.onclick = () => {
          window.focus();
          if (item.action_url) navigate(item.action_url);
        };
      } catch {
        // no-op: browser notifications are best effort only
      }
    },
    [navigate],
  );

  // --- notifyAdminsForVisitEvent ---
  const notifyAdminsForVisitEvent = useCallback(
    async (
      sourceTask: import("@/types/taskManager").OfficeTask,
      title: string,
      message: string,
      severity: NotificationSeverity = "medium",
    ) => {
      // Note: teamMembers is not available in this hook; this function is a stub
      // that can be extended if teamMembers is passed in or fetched separately.
      try {
        const users = await tmListOfficeUsers(true).catch(() => []);
        const adminIds = users
          .filter((row) => String((row as { role?: unknown }).role || "").toLowerCase() === "admin")
          .map((row) => String((row as { user_external_id?: unknown; id?: unknown }).user_external_id || (row as { id?: unknown }).id || ""))
          .filter(Boolean);
        if (!adminIds.length) return;
        await Promise.all(
          adminIds.map((adminId: string) =>
            createInAppNotification({
              userId: adminId,
              type: "admin_alert",
              title,
              message,
              severity,
              actionUrl: "/admin/dashboard",
              relatedVisitTaskId: sourceTask.id,
              relatedInstitutionId: sourceTask.institution_id ?? null,
              dedupeFingerprint: `visit_admin_${sourceTask.id}_${title.replace(/\s+/g, "_").toLowerCase()}`,
              cooldownHours: 1,
            }),
          ),
        );
      } catch {
        // Admin notification failures should not crash the caller.
      }
    },
    [createInAppNotification],
  );

  // --- unreadNotificationCount ---
  const unreadNotificationCount = useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  // --- useEffect: notif panel outside click/close ---
  useEffect(() => {
    if (!notifPanelOpen) return undefined;
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (notifPanelRef.current?.contains(target)) return;
      if (notifBellRef.current?.contains(target)) return;
      setNotifPanelOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotifPanelOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notifPanelOpen]);

  // --- useEffect: quick actions outside click/close ---
  useEffect(() => {
    if (!quickActionsOpen) return undefined;
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (quickActionsRef.current?.contains(target)) return;
      if (quickActionsButtonRef.current?.contains(target)) return;
      setQuickActionsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setQuickActionsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [quickActionsOpen]);

  // --- useEffect: saving notification preferences to CRM ---
  useEffect(() => {
    if (!officeUser) return;
    const save = async () => {
      try {
        await tmUpsertNotificationPrefs(notificationPrefs as Record<string, unknown>);
      } catch {
        // Non-fatal; preferences will retry on next change.
      }
    };
    void save();
  }, [officeUser, notificationPrefs]);

  // --- useEffect: SSE stream + safety-net poll for notifications ---
  useEffect(() => {
    if (!officeUser) return undefined;
    let pollInFlight = false;
    const refresh = () => {
      if (pollInFlight) return;
      pollInFlight = true;
      void loadNotificationsForUser(officeUser.id).then((result) => {
        if (!result.error) setNotifications(result.items);
      }).finally(() => { pollInFlight = false; });
    };

    // Initial load.
    refresh();

    // Live SSE: refresh on every server-side notification insert.
    let stream: MsgStreamHandle | null = null;
    try {
      stream = msgOpenStream((event) => {
        if (event.type === "notification") refresh();
      });
    } catch {
      // EventSource may be unavailable; fall back to polling only.
    }

    // Safety-net poll every 30s in case the stream drops without a
    // reconnect notification reaching us.
    const poller = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      refresh();
    }, 30_000);

    return () => {
      window.clearInterval(poller);
      stream?.close();
    };
  }, [loadNotificationsForUser, officeUser]);

  // --- useEffect: browser notification permission request (proactive, no push_enabled gate) ---
  useEffect(() => {
    if (typeof window === "undefined" || !officeUser || !("Notification" in window)) return;
    if (browserNotifPermissionAskedRef.current) return;
    if (Notification.permission !== "default") return;
    browserNotifPermissionAskedRef.current = true;
    // Request on first user interaction to satisfy browser gesture requirement
    const requestOnInteraction = () => {
      void Notification.requestPermission().catch(() => undefined);
      window.removeEventListener("click", requestOnInteraction);
      window.removeEventListener("keydown", requestOnInteraction);
    };
    window.addEventListener("click", requestOnInteraction, { once: true });
    window.addEventListener("keydown", requestOnInteraction, { once: true });
    return () => {
      window.removeEventListener("click", requestOnInteraction);
      window.removeEventListener("keydown", requestOnInteraction);
    };
  }, [officeUser]);

  // --- useEffect: new notification alerts (tone + browser notification) ---
  useEffect(() => {
    if (!officeUser || !notifications.length || !notificationPrefs.in_app_enabled) return;
    if (!notificationWatchPrimedRef.current) {
      notifications.forEach((item) => seenNotificationIdsRef.current.add(item.id));
      notificationWatchPrimedRef.current = true;
      return;
    }
    const newUnread = notifications.filter((item) => !item.is_read && !seenNotificationIdsRef.current.has(item.id));
    if (!newUnread.length) return;
    const suppressActiveAlerts = shouldSuppressActiveAlerts();
    newUnread.forEach((item) => {
      seenNotificationIdsRef.current.add(item.id);
      const normalizedType = String(item.type || "").toLowerCase();
      if (!isChannelEnabledForType(normalizedType)) return;
      if (!suppressActiveAlerts && notifSettings.sound_enabled) {
        if (normalizedType.includes("message")) {
          playMessageTone();
        } else if (normalizedType.includes("follow_up") || normalizedType.includes("reminder")) {
          playTaskReminderToneFx();
        } else if (item.severity === "high") {
          playOverdueToneFx();
        } else {
          playNotificationTone();
        }
      }

      const typeLabel = String(item.type || "notification").replace(/_/g, " ").toUpperCase();
      const toastMsg = `${typeLabel}: ${item.title || "New update"}`;
      if (!suppressActiveAlerts) {
        if (item.severity === "high") toast.error(toastMsg, { description: item.message || "" });
        else if (item.severity === "medium") toast.warning(toastMsg, { description: item.message || "" });
        else toast.info(toastMsg, { description: item.message || "" });
      }

      if (!suppressActiveAlerts && isDesktopRuntime()) {
        void desktopNotify({
          title: item.title || "ONROL",
          body: item.message || "You have a new update.",
          route: item.action_url || "/task/overview",
          action: "open-route",
          meta: {
            type: item.type,
            severity: item.severity,
            notificationId: item.id,
          },
        });
      }
      // Show browser notification when tab is not focused — works regardless of push_enabled setting
      if (!suppressActiveAlerts && document.visibilityState !== "visible" && Notification.permission === "granted") {
        showBrowserNotification(item);
      } else if (!suppressActiveAlerts && notificationPrefs.push_enabled) {
        showBrowserNotification(item);
      }
    });
  }, [notificationPrefs.in_app_enabled, notificationPrefs.push_enabled, notifications, officeUser, playMessageTone, playNotificationTone, notifSettings.sound_enabled, showBrowserNotification]);

  // --- useEffect: local storage of notifSettings ---
  useEffect(() => {
    if (!officeUser) return;
    localStorage.setItem(`task-settings-${officeUser.id}`, JSON.stringify(notifSettings));
  }, [notifSettings, officeUser]);

  // --- useEffect: reset seen notification refs on user change ---
  useEffect(() => {
    seenNotificationIdsRef.current = new Set();
    browserNotifPermissionAskedRef.current = false;
    notificationWatchPrimedRef.current = false;
  }, [officeUser?.id]);

  // --- enablePushNotifications ---
  const enablePushNotifications = useCallback(async () => {
    const { enableWebPush } = await import("@/lib/pushNotifications");
    if (!webPushConfigured) {
      const message = "Web Push is not configured. Add VITE_VAPID_PUBLIC_KEY in your frontend env and redeploy.";
      setPushStatus("error");
      setPushMessage(message);
      toast.error(message);
      return;
    }
    try {
      setPushBusy(true);
      setPushAction("enable");
      await enableWebPush();
      setPushStatus("enabled");
      setPushMessage("Notifications are enabled for this device.");
      toast.success("Notifications enabled");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Unable to enable notifications.");
      setPushStatus("error");
      setPushMessage(message);
      toast.error(message);
    } finally {
      setPushBusy(false);
      setPushAction(null);
    }
  }, [webPushConfigured]);

  // --- sendTestPushNotification ---
  const sendTestPushNotification = useCallback(async () => {
    const { sendTestNotification } = await import("@/lib/pushNotifications");
    if (!webPushConfigured) {
      const message = "Web Push is not configured. Add VITE_VAPID_PUBLIC_KEY in your frontend env and redeploy.";
      setPushStatus("error");
      setPushMessage(message);
      toast.error(message);
      return;
    }
    try {
      setPushBusy(true);
      setPushAction("test");
      const result = await sendTestNotification();
      setPushStatus("enabled");
      setPushMessage(`Test sent (${result?.delivered ?? 0}/${result?.total ?? 0} delivered).`);
      toast.success("Test notification sent");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Unable to send test notification.");
      setPushStatus("error");
      setPushMessage(message);
      toast.error(message);
    } finally {
      setPushBusy(false);
      setPushAction(null);
    }
  }, [webPushConfigured]);

  // --- sendReminderPushNotifications ---
  const sendReminderPushNotifications = useCallback(async () => {
    const { sendReminderNotifications } = await import("@/lib/pushNotifications");
    if (!webPushConfigured) {
      const message = "Web Push is not configured. Add VITE_VAPID_PUBLIC_KEY in your frontend env and redeploy.";
      setPushStatus("error");
      setPushMessage(message);
      toast.error(message);
      return;
    }
    try {
      setPushBusy(true);
      setPushAction("reminder");
      const result = await sendReminderNotifications();
      setPushStatus("enabled");
      setPushMessage(`Reminder push sent (${result?.delivered ?? 0}/${result?.total ?? 0}).`);
      toast.success("Reminder push dispatch complete");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Unable to send reminder push notifications.");
      setPushStatus("error");
      setPushMessage(message);
      toast.error(message);
    } finally {
      setPushBusy(false);
      setPushAction(null);
    }
  }, [webPushConfigured]);

  return {
    // Notification state
    notifications,
    setNotifications,
    notificationsBusy,
    setNotificationsBusy,
    notificationsError,
    setNotificationsError,
    // Panel state
    notifPanelOpen,
    setNotifPanelOpen,
    quickActionsOpen,
    setQuickActionsOpen,
    // Preferences & automation
    notificationPrefs,
    setNotificationPrefs,
    automationSettings,
    setAutomationSettings,
    runningAutomation,
    setRunningAutomation,
    // Push state
    pushBusy,
    setPushBusy,
    pushAction,
    setPushAction,
    pushStatus,
    setPushStatus,
    pushMessage,
    setPushMessage,
    // Notif settings
    notifSettings,
    setNotifSettings,
    // Refs
    notifPanelRef,
    notifBellRef,
    quickActionsRef,
    quickActionsButtonRef,
    seenNotificationIdsRef,
    browserNotifPermissionAskedRef,
    notificationWatchPrimedRef,
    // Computed
    unreadNotificationCount,
    // Functions
    normalizeNotificationRecord,
    loadNotificationsForUser,
    markNotificationRead,
    markAllNotificationsRead,
    clearAllNotifications,
    createInAppNotification,
    playNotificationTone,
    playMessageTone,
    showBrowserNotification,
    notifyAdminsForVisitEvent,
    logNotificationDelivery,
    withUiTimeout,
    enablePushNotifications,
    sendTestPushNotification,
    sendReminderPushNotifications,
  };
}
