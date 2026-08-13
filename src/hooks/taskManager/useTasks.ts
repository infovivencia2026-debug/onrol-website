import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  tmCreateTask, tmUpdateTask, tmInsertActivityEvent,
  tmListTasks, tmListOfficeUsers, tmListTaskAudit, tmListActivityEvents,
} from "@/lib/tmClient";
import {
  enqueueOfflineAction,
  getOfflineQueueItems,
  nextRetryAtIso,
  removeQueueItem,
  updateQueueItem,
  type OfflineQueueItem,
} from "@/lib/offlineQueue";
import type {
  OfficeTask,
  OfficeUser,
  TaskStatusAudit,
  ActivityEvent,
  TaskDraft,
  Priority,
  Status,
  TaskType,
  TaskCategory,
  VisitBrand,
  VisitOutcome,
  FollowUpStatus,
  InterestLevel,
} from "@/types/taskManager";
import { initialDraft } from "@/types/taskManager";
import { raceWithTimeout, getErrorMessage } from "@/utils/taskManager";
import { toast } from "sonner";

export interface UseTasksReturn {
  // Core data
  tasks: OfficeTask[];
  setTasks: React.Dispatch<React.SetStateAction<OfficeTask[]>>;
  teamMembers: OfficeUser[];
  setTeamMembers: React.Dispatch<React.SetStateAction<OfficeUser[]>>;
  auditLogs: TaskStatusAudit[];
  setAuditLogs: React.Dispatch<React.SetStateAction<TaskStatusAudit[]>>;
  activityEvents: ActivityEvent[];
  setActivityEvents: React.Dispatch<React.SetStateAction<ActivityEvent[]>>;

  // Form state
  showForm: boolean;
  setShowForm: React.Dispatch<React.SetStateAction<boolean>>;
  editingTaskId: string | null;
  setEditingTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  taskDraft: TaskDraft;
  setTaskDraft: React.Dispatch<React.SetStateAction<TaskDraft>>;

  // Quick add
  taskScope: "my" | "team";
  setTaskScope: React.Dispatch<React.SetStateAction<"my" | "team">>;
  showQuickAdd: boolean;
  setShowQuickAdd: React.Dispatch<React.SetStateAction<boolean>>;
  quickTitle: string;
  setQuickTitle: React.Dispatch<React.SetStateAction<string>>;
  quickPriority: Priority;
  setQuickPriority: React.Dispatch<React.SetStateAction<Priority>>;
  quickDueDate: string;
  setQuickDueDate: React.Dispatch<React.SetStateAction<string>>;

  // Admin filters
  adminEmployeeFilter: string;
  setAdminEmployeeFilter: React.Dispatch<React.SetStateAction<string>>;
  adminStatusFilter: Status | "all";
  setAdminStatusFilter: React.Dispatch<React.SetStateAction<Status | "all">>;
  adminTypeFilter: TaskType | "all";
  setAdminTypeFilter: React.Dispatch<React.SetStateAction<TaskType | "all">>;
  adminTaskCategoryFilter: TaskCategory | "all";
  setAdminTaskCategoryFilter: React.Dispatch<React.SetStateAction<TaskCategory | "all">>;
  adminPriorityFilter: Priority | "all";
  setAdminPriorityFilter: React.Dispatch<React.SetStateAction<Priority | "all">>;
  adminDateFilter: string;
  setAdminDateFilter: React.Dispatch<React.SetStateAction<string>>;
  adminBrandFilter: VisitBrand | "all";
  setAdminBrandFilter: React.Dispatch<React.SetStateAction<VisitBrand | "all">>;
  adminOutcomeFilter: VisitOutcome | "all";
  setAdminOutcomeFilter: React.Dispatch<React.SetStateAction<VisitOutcome | "all">>;
  adminFollowUpStatusFilter: FollowUpStatus | "all";
  setAdminFollowUpStatusFilter: React.Dispatch<React.SetStateAction<FollowUpStatus | "all">>;
  adminFollowUpDateFilter: string;
  setAdminFollowUpDateFilter: React.Dispatch<React.SetStateAction<string>>;
  adminProgramInterestFilter: string | "all";
  setAdminProgramInterestFilter: React.Dispatch<React.SetStateAction<string | "all">>;
  adminInterestLevelFilter: InterestLevel | "all";
  setAdminInterestLevelFilter: React.Dispatch<React.SetStateAction<InterestLevel | "all">>;
  adminDiscussionStageFilter: string | "all";
  setAdminDiscussionStageFilter: React.Dispatch<React.SetStateAction<string | "all">>;
  showAdminAdvancedFilters: boolean;
  setShowAdminAdvancedFilters: React.Dispatch<React.SetStateAction<boolean>>;

  // Derived
  visibleTasks: OfficeTask[];

  // Core functions
  loadTaskData: (profile: OfficeUser, options?: { showLoading?: boolean }) => Promise<void>;
  refreshTasks: (options?: { showLoading?: boolean }) => Promise<void>;
  logActivityEvent: (payload: {
    eventType: string;
    summary: string;
    visitTaskId?: string | null;
    institutionId?: string | null;
    targetUserId?: string | null;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  queueOrRunTaskMutation: (args: {
    actionType: "create_task" | "update_task";
    entityId?: string | null;
    localEntityId?: string | null;
    payload: Record<string, unknown>;
    successMessage?: string;
    queuedMessage?: string;
  }) => Promise<{ queued: boolean; id: string | null }>;
  executeQueueItem: (item: OfflineQueueItem) => Promise<void>;

  // Offline state
  isOffline: boolean;
  queueItems: OfflineQueueItem[];
  syncingQueue: boolean;
  processOfflineQueue: () => Promise<void>;
  loadQueueItems: () => Promise<void>;
}

export default function useTasks(
  officeUser: OfficeUser | null,
  extraDeps?: {
    setBootStep?: (step: string) => void;
    setPageLoading?: (loading: boolean) => void;
    setAuthBootError?: (error: string | null) => void;
    loadNotificationsForUser?: (userId: string) => Promise<{ items: unknown[]; error: string | null }>;
  },
): UseTasksReturn {
  const {
    setBootStep,
    setPageLoading,
    setAuthBootError,
    loadNotificationsForUser,
  } = extraDeps || {};

  const hasLoadedInitialDataRef = useRef(false);
  const queueSyncInFlight = useRef(false);

  // Core data state
  const [tasks, setTasks] = useState<OfficeTask[]>([]);
  const [teamMembers, setTeamMembers] = useState<OfficeUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<TaskStatusAudit[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(initialDraft);

  // Quick add state
  const [taskScope, setTaskScope] = useState<"my" | "team">("team");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");
  const [quickPriority, setQuickPriority] = useState<Priority>("medium");
  const [quickDueDate, setQuickDueDate] = useState("");

  // Admin filter states
  const [adminEmployeeFilter, setAdminEmployeeFilter] = useState("all");
  const [adminStatusFilter, setAdminStatusFilter] = useState<Status | "all">("all");
  const [adminTypeFilter, setAdminTypeFilter] = useState<TaskType | "all">("all");
  const [adminTaskCategoryFilter, setAdminTaskCategoryFilter] = useState<TaskCategory | "all">("all");
  const [adminPriorityFilter, setAdminPriorityFilter] = useState<Priority | "all">("all");
  const [adminDateFilter, setAdminDateFilter] = useState("");
  const [adminBrandFilter, setAdminBrandFilter] = useState<VisitBrand | "all">("all");
  const [adminOutcomeFilter, setAdminOutcomeFilter] = useState<VisitOutcome | "all">("all");
  const [adminFollowUpStatusFilter, setAdminFollowUpStatusFilter] = useState<FollowUpStatus | "all">("all");
  const [adminFollowUpDateFilter, setAdminFollowUpDateFilter] = useState("");
  const [adminProgramInterestFilter, setAdminProgramInterestFilter] = useState<string | "all">("all");
  const [adminInterestLevelFilter, setAdminInterestLevelFilter] = useState<InterestLevel | "all">("all");
  const [adminDiscussionStageFilter, setAdminDiscussionStageFilter] = useState<string | "all">("all");
  const [showAdminAdvancedFilters, setShowAdminAdvancedFilters] = useState(false);

  // Offline state
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== "undefined" ? !navigator.onLine : false);
  const [queueItems, setQueueItems] = useState<OfflineQueueItem[]>([]);
  const [syncingQueue, setSyncingQueue] = useState(false);

  // Load task data
  const loadTaskData = useCallback(
    async (profile: OfficeUser, options?: { showLoading?: boolean }) => {
      const shouldShowLoading = options?.showLoading ?? !hasLoadedInitialDataRef.current;
      setBootStep?.("tasks");
      if (shouldShowLoading) setPageLoading?.(true);
      try {
        const ADMIN_TASK_FETCH_LIMIT = 2000;
        const [taskRows, memberRows] = await raceWithTimeout(
          Promise.all([
            tmListTasks(profile.role === "admin"
              ? { limit: ADMIN_TASK_FETCH_LIMIT }
              : { assignedTo: profile.id, limit: ADMIN_TASK_FETCH_LIMIT }),
            profile.role === "admin"
              ? tmListOfficeUsers(false)
              : Promise.resolve([profile as unknown as Record<string, unknown>]),
          ]),
          12000,
          "Workspace query timed out.",
        );

        setTasks((taskRows ?? []) as unknown as OfficeTask[]);
        setTeamMembers((memberRows ?? [profile]) as unknown as OfficeUser[]);
        hasLoadedInitialDataRef.current = true;
        setAuthBootError?.(null);
        setBootStep?.("ready");

        // Phase 2 (non-blocking): hydrate secondary data after first paint.
        void (async () => {
          const [auditRows, activityRows] = await Promise.all([
            tmListTaskAudit({ limit: 200 }).catch(() => [] as Array<Record<string, unknown>>),
            profile.role === "admin"
              ? tmListActivityEvents({ limit: 200 }).catch(() => [] as Array<Record<string, unknown>>)
              : Promise.resolve([] as Array<Record<string, unknown>>),
          ]);

          setAuditLogs(auditRows as unknown as TaskStatusAudit[]);
          setActivityEvents(activityRows as unknown as ActivityEvent[]);

          if (loadNotificationsForUser) {
            try {
              await raceWithTimeout(
                loadNotificationsForUser(profile.id),
                10000,
                "Notification fetch timed out.",
              );
            } catch {
              // Timeout - ignore
            }
          }
        })();
      } finally {
        if (shouldShowLoading) setPageLoading?.(false);
      }
    },
    [setBootStep, setPageLoading, setAuthBootError, loadNotificationsForUser],
  );

  // Load task data when officeUser is available
  useEffect(() => {
    if (!officeUser) return;
    void loadTaskData(officeUser).catch((error: unknown) => {
      setAuthBootError?.(getErrorMessage(error, "Unable to load workspace data."));
    });
  }, [officeUser, loadTaskData, setAuthBootError]);

  // Handle auth state changes for data refresh/clear
  useEffect(() => {
    if (!officeUser) {
      hasLoadedInitialDataRef.current = false;
      setTasks([]);
      setTeamMembers([]);
      setAuditLogs([]);
      setActivityEvents([]);
      return;
    }
    void refreshTasksFn().catch((error: unknown) => {
      setAuthBootError?.(getErrorMessage(error, "Unable to refresh workspace data."));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officeUser?.id]);

  // Task realtime is handled by the periodic refreshTasksFn poll triggered
  // by other state changes (and the offline-queue replay path). The CRM
  // does not yet broadcast office_tasks INSERT/UPDATE/DELETE over the
  // /api/messenger/stream SSE — when that lands, replace this comment with
  // an msgOpenStream subscription scoped to task events.

  const refreshTasksFn = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!officeUser) return;
      await loadTaskData(officeUser, options);
    },
    [officeUser, loadTaskData],
  );

  const logActivityEvent = useCallback(
    async (payload: {
      eventType: string;
      summary: string;
      visitTaskId?: string | null;
      institutionId?: string | null;
      targetUserId?: string | null;
      metadata?: Record<string, unknown>;
    }) => {
      if (!officeUser) return;
      const row = {
        actor_user_id: officeUser.id,
        institution_id: payload.institutionId ?? null,
        visit_task_id: payload.visitTaskId ?? null,
        target_user_id: payload.targetUserId ?? null,
        event_type: payload.eventType,
        event_summary: payload.summary,
        metadata: payload.metadata ?? {},
      };
      if (!navigator.onLine) {
        // Queue activity log for sync when back online
        try { await enqueueOfflineAction({ actionType: "log_activity", payload: row }); } catch { /* ignore */ }
        return;
      }
      try {
        await tmInsertActivityEvent({
          actorUserId: row.actor_user_id,
          institutionId: row.institution_id,
          visitTaskId: row.visit_task_id,
          targetUserId: row.target_user_id,
          eventType: row.event_type,
          eventSummary: row.event_summary,
          metadata: row.metadata,
        });
      } catch {
        // Best-effort — keep primary workflow uninterrupted if CRM is down.
      }
    },
    [officeUser],
  );

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
      // Offline queue replay — Phase 8 swap. Each action now goes through
      // /api/tm/* instead of supabase.from(...). The Supabase JWT is
      // attached by tmClient; the onrol.in proxy validates it.
      if (item.actionType === "create_task") {
        await tmCreateTask(item.payload as Record<string, unknown>);
        return;
      }
      if (item.actionType === "update_task") {
        const targetId = item.entityId;
        if (!targetId) throw new Error("Missing queue entityId for update action.");
        await tmUpdateTask(targetId, item.payload as Record<string, unknown>);
        return;
      }
      if (item.actionType === "visit_checkin" || item.actionType === "visit_checkout") {
        const targetId = item.entityId;
        if (!targetId) throw new Error("Missing queue entityId for visit action.");
        await tmUpdateTask(targetId, item.payload as Record<string, unknown>);
        return;
      }
      if (item.actionType === "log_activity") {
        const p = item.payload as Record<string, unknown>;
        await tmInsertActivityEvent({
          actorUserId: (p.actor_user_id as string | null | undefined) ?? null,
          institutionId: (p.institution_id as string | null | undefined) ?? null,
          visitTaskId: (p.visit_task_id as string | null | undefined) ?? null,
          targetUserId: (p.target_user_id as string | null | undefined) ?? null,
          eventType: (p.event_type as string) ?? "queued_event",
          eventSummary: (p.event_summary as string | null | undefined) ?? null,
          metadata: (p.metadata as Record<string, unknown>) ?? null,
        });
        return;
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
        await refreshTasksFn();
      }
    } finally {
      queueSyncInFlight.current = false;
      setSyncingQueue(false);
    }
  }, [executeQueueItem, loadQueueItems, officeUser, refreshTasksFn, logActivityEvent]);

  const queueOrRunTaskMutation = useCallback(
    async (args: {
      actionType: "create_task" | "update_task";
      entityId?: string | null;
      localEntityId?: string | null;
      payload: Record<string, unknown>;
      successMessage?: string;
      queuedMessage?: string;
    }) => {
      if (!navigator.onLine) {
        const queueItem = await enqueueOfflineAction({
          actionType: args.actionType,
          entityId: args.entityId ?? args.localEntityId ?? null,
          payload: args.payload,
        });
        if (args.actionType === "update_task" && args.entityId) {
          setTasks((prev) =>
            prev.map((task) =>
              task.id === args.entityId
                ? {
                    ...task,
                    ...(args.payload as Partial<OfficeTask>),
                    updated_at: new Date().toISOString(),
                  }
                : task,
            ),
          );
        }
        setQueueItems((prev) => [...prev, queueItem]);
        toast.message(args.queuedMessage || "Saved offline. Will sync when back online.");
        return { queued: true as const, id: null };
      }

      if (args.actionType === "create_task") {
        const created = await tmCreateTask(args.payload as Record<string, unknown>);
        if (args.successMessage) toast.success(args.successMessage);
        return { queued: false as const, id: (created as { id?: string } | null)?.id ?? null };
      }

      if (!args.entityId) throw new Error("Missing entityId for update task mutation.");
      await tmUpdateTask(args.entityId, args.payload as Record<string, unknown>);
      if (args.successMessage) toast.success(args.successMessage);
      return { queued: false as const, id: args.entityId };
    },
    [],
  );

  // Online/offline listeners
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

  // Visible tasks (filtered)
  const getTaskBrandDetails = (task: OfficeTask) => {
    const raw = task.brand_details;
    if (!raw || typeof raw !== "object") return {};
    return raw as Record<string, unknown>;
  };

  const visibleTasks = useMemo(() => {
    if (!officeUser) return [];
    const base = officeUser.role === "employee"
      ? tasks.filter((task) => task.user_id === officeUser.id)
      : taskScope === "my"
        ? tasks.filter((t) => t.user_id === officeUser.id)
        : tasks;

    return base.filter((task) => {
      if (adminEmployeeFilter !== "all" && task.user_id !== adminEmployeeFilter) return false;
      if (adminStatusFilter !== "all" && task.status !== adminStatusFilter) return false;
      if (adminTypeFilter !== "all" && task.task_type !== adminTypeFilter) return false;
      if (adminTaskCategoryFilter !== "all" && (task.task_category || "general") !== adminTaskCategoryFilter) return false;
      if (adminPriorityFilter !== "all" && task.priority !== adminPriorityFilter) return false;
      if (adminDateFilter && task.assigned_date !== adminDateFilter) return false;
      if (adminBrandFilter !== "all" && (task.task_category !== "visit" || task.visit_brand !== adminBrandFilter)) return false;
      if (adminOutcomeFilter !== "all" && (task.task_category !== "visit" || !(task.visit_outcome || []).includes(adminOutcomeFilter))) return false;
      if (adminFollowUpStatusFilter !== "all" && (task.task_category !== "visit" || task.follow_up_status !== adminFollowUpStatusFilter)) return false;
      if (adminFollowUpDateFilter && (task.task_category !== "visit" || task.follow_up_date !== adminFollowUpDateFilter)) return false;
      const details = getTaskBrandDetails(task);
      if (adminProgramInterestFilter !== "all" && (task.task_category !== "visit" || !(details.program_interest || []).includes(adminProgramInterestFilter))) return false;
      if (adminInterestLevelFilter !== "all" && (task.task_category !== "visit" || details.interest_level !== adminInterestLevelFilter)) return false;
      if (adminDiscussionStageFilter !== "all" && (task.task_category !== "visit" || details.discussion_stage !== adminDiscussionStageFilter)) return false;
      return true;
    });
  }, [
    tasks,
    officeUser,
    taskScope,
    adminEmployeeFilter,
    adminStatusFilter,
    adminTypeFilter,
    adminTaskCategoryFilter,
    adminPriorityFilter,
    adminDateFilter,
    adminBrandFilter,
    adminOutcomeFilter,
    adminFollowUpStatusFilter,
    adminFollowUpDateFilter,
    adminProgramInterestFilter,
    adminInterestLevelFilter,
    adminDiscussionStageFilter,
  ]);

  return {
    // Core data
    tasks,
    setTasks,
    teamMembers,
    setTeamMembers,
    auditLogs,
    setAuditLogs,
    activityEvents,
    setActivityEvents,

    // Form state
    showForm,
    setShowForm,
    editingTaskId,
    setEditingTaskId,
    taskDraft,
    setTaskDraft,

    // Quick add
    taskScope,
    setTaskScope,
    showQuickAdd,
    setShowQuickAdd,
    quickTitle,
    setQuickTitle,
    quickPriority,
    setQuickPriority,
    quickDueDate,
    setQuickDueDate,

    // Admin filters
    adminEmployeeFilter,
    setAdminEmployeeFilter,
    adminStatusFilter,
    setAdminStatusFilter,
    adminTypeFilter,
    setAdminTypeFilter,
    adminTaskCategoryFilter,
    setAdminTaskCategoryFilter,
    adminPriorityFilter,
    setAdminPriorityFilter,
    adminDateFilter,
    setAdminDateFilter,
    adminBrandFilter,
    setAdminBrandFilter,
    adminOutcomeFilter,
    setAdminOutcomeFilter,
    adminFollowUpStatusFilter,
    setAdminFollowUpStatusFilter,
    adminFollowUpDateFilter,
    setAdminFollowUpDateFilter,
    adminProgramInterestFilter,
    setAdminProgramInterestFilter,
    adminInterestLevelFilter,
    setAdminInterestLevelFilter,
    adminDiscussionStageFilter,
    setAdminDiscussionStageFilter,
    showAdminAdvancedFilters,
    setShowAdminAdvancedFilters,

    // Derived
    visibleTasks,

    // Core functions
    loadTaskData,
    refreshTasks: refreshTasksFn,
    logActivityEvent,
    queueOrRunTaskMutation,
    executeQueueItem,

    // Offline
    isOffline,
    queueItems,
    syncingQueue,
    processOfflineQueue,
    loadQueueItems,
  };
}
