import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type {
  OfficeTask,
  OfficeUser,
  VisitOutcome,
  VisitStatus,
  Status,
  FollowUpType,
  FollowUpStatus,
  LeadStage,
  BrandDetails,
  VisitBrand,
  TaskComment,
  VisitSectionState,
} from "@/types/taskManager";
import { defaultVisitSectionState } from "@/types/taskManager";
import {
  getJourneyStageIndex,
  getVisitStatusLabelForTask,
  visitOutcomeLabels,
  followUpTypeLabels,
  followUpStatusLabels,
  getErrorMessage,
  normalizeIsoDateInput,
} from "@/utils/taskManager";

// ---------------------------------------------------------------------------
// Helper functions (pure / standalone)
// ---------------------------------------------------------------------------

function mapVisitToTaskStatus(visitStatus: VisitStatus): Status {
  if (visitStatus === "completed") return "completed";
  if (visitStatus === "closed_lost") return "completed";
  // followup_pending means the visit happened but needs a follow-up — task is still ongoing,
  // not completed. (Marking it completed closed the card the moment a next-visit date was picked.)
  if (visitStatus === "followup_pending") return "ongoing";
  if (visitStatus === "reached" || visitStatus === "in_meeting") return "ongoing";
  if (visitStatus === "rescheduled") return "delayed";
  return "not_started";
}

function autoVisitStatusFromOutcome(
  outcomes: VisitOutcome[],
  followUpRequired: boolean,
  current: VisitStatus | null | undefined,
): VisitStatus {
  if (followUpRequired) return "followup_pending";
  if (outcomes.includes("not_interested")) return "closed_lost";
  if (outcomes.includes("interested") || outcomes.includes("need_demo") || outcomes.includes("need_proposal"))
    return "completed";
  return current || "planned";
}

function sanitizeBrandDetails(brand: VisitBrand, details: BrandDetails): BrandDetails {
  const base: BrandDetails = {
    program_interest: Array.isArray(details.program_interest) ? details.program_interest.slice(0, 3) : [],
    audience_type: details.audience_type || null,
    interest_level: (details.interest_level as import("@/types/taskManager").InterestLevel | null) || null,
    discussion_stage: details.discussion_stage || null,
  };

  if (brand === "Vivencia") {
    return {
      ...base,
      class_group: Array.isArray(details.class_group) ? details.class_group : [],
      special_flags: Array.isArray(details.special_flags) ? details.special_flags : [],
      department_group: [],
      opportunity_flags: [],
    };
  }
  return {
    ...base,
    department_group: Array.isArray(details.department_group) ? details.department_group : [],
    opportunity_flags: Array.isArray(details.opportunity_flags) ? details.opportunity_flags : [],
    class_group: [],
    special_flags: [],
  };
}

function getTaskBrandDetails(task: OfficeTask): BrandDetails {
  const raw = task.brand_details;
  if (!raw || typeof raw !== "object") return {};
  return raw as BrandDetails;
}

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

const RESCHEDULE_AUDIT_PREFIX = "[RESCHEDULE_AUDIT]";

function upsertRescheduleAuditRemark(existing: string | null | undefined, fromDate: string, toDate: string): string {
  const token = `${RESCHEDULE_AUDIT_PREFIX}${fromDate}|${toDate}`;
  const current = (existing || "").trim();
  if (!current) return token;
  if (current.includes(RESCHEDULE_AUDIT_PREFIX)) {
    return current.replace(/\[RESCHEDULE_AUDIT\][^\n\r]*/g, token);
  }
  return `${current}\n${token}`;
}

// ---------------------------------------------------------------------------
// Speech recognition types
// ---------------------------------------------------------------------------

interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((error: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
}

interface SpeechRecognitionCtor {
  new (): SpeechRecognitionInstance;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseVisitWorkflowCallbacks {
  /** Called after a task is updated via Supabase. */
  onTaskUpdate?: (taskId: string, payload: Partial<OfficeTask>) => void;
  /** Log an activity event (audit trail). */
  logActivityEvent?: (payload: {
    eventType: string;
    summary: string;
    visitTaskId?: string | null;
    institutionId?: string | null;
    targetUserId?: string | null;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  /**
   * Create an in-app notification for the acting user (e.g. follow-up reminder).
   * Provided by useNotifications; optional so the hook degrades gracefully.
   */
  createInAppNotification?: (input: {
    userId: string;
    type: string;
    title: string;
    message: string;
    severity?: import("@/types/taskManager").NotificationSeverity;
    actionUrl?: string | null;
    relatedVisitTaskId?: string | null;
    relatedInstitutionId?: string | null;
    dedupeFingerprint?: string | null;
  }) => Promise<void>;
}

export interface UseVisitWorkflowReturn {
  // Visit section state
  visitSectionStateByTask: Record<string, VisitSectionState>;
  setVisitSectionStateByTask: React.Dispatch<React.SetStateAction<Record<string, VisitSectionState>>>;
  quickNoteDraftByTask: Record<string, string>;
  setQuickNoteDraftByTask: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  voiceTaskId: string | null;
  setVoiceTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  locationBusyTaskId: string | null;
  setLocationBusyTaskId: React.Dispatch<React.SetStateAction<string | null>>;

  // Comments
  commentsByTask: Record<string, TaskComment[]>;
  setCommentsByTask: React.Dispatch<React.SetStateAction<Record<string, TaskComment[]>>>;
  commentDraftByTask: Record<string, string>;
  setCommentDraftByTask: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  // Follow-up
  activeFollowupTaskId: string | null;
  setActiveFollowupTaskId: React.Dispatch<React.SetStateAction<string | null>>;

  // Actions
  toggleVisitOutcome: (task: OfficeTask, outcome: VisitOutcome) => Promise<void>;
  applyFollowupAction: (
    task: OfficeTask,
    action: "call" | "whatsapp" | "visit_again" | "demo" | "send_proposal" | "no_followup",
  ) => Promise<void>;
  saveFollowUpDate: (taskId: string, date: string, preferredFollowUpType?: FollowUpType | null) => Promise<void>;
  saveQuickNote: (taskId: string, value: string) => Promise<void>;
  saveDsrFields: (taskId: string, patch: Partial<OfficeTask>) => Promise<void>;
  startVoiceQuickNote: (task: OfficeTask) => void;
  toggleBrandMultiValue: (task: OfficeTask, field: keyof BrandDetails, value: string, max?: number) => Promise<void>;
  setBrandSingleValue: (task: OfficeTask, field: keyof BrandDetails, value: string) => Promise<void>;
  addTaskComment: (taskId: string) => void;
  fetchAndSaveVisitLocation: (task: OfficeTask) => Promise<void>;

  // Journey helpers
  getJourneyStageIndex: (task: OfficeTask) => number;
  getVisitStatusLabelForTask: (task: OfficeTask) => string;
  mapVisitToTaskStatus: (visitStatus: VisitStatus) => Status;
}

export default function useVisitWorkflow(
  officeUser: OfficeUser | null,
  callbacks: UseVisitWorkflowCallbacks & {
    tasks: OfficeTask[];
    setTasks: React.Dispatch<React.SetStateAction<OfficeTask[]>>;
    refreshTasks: (options?: { showLoading?: boolean }) => Promise<void>;
    queueOrRunTaskMutation: (args: {
      actionType: "create_task" | "update_task";
      entityId?: string | null;
      localEntityId?: string | null;
      payload: Record<string, unknown>;
      successMessage?: string;
      queuedMessage?: string;
    }) => Promise<{ queued: boolean; id: string | null }>;
    notifyAdminsForVisitEvent: (
      sourceTask: OfficeTask,
      title: string,
      message: string,
      severity?: import("@/types/taskManager").NotificationSeverity,
    ) => Promise<void>;
    updateInstitutionMetaFromVisit: (
      task: OfficeTask,
      options: { lastVisitAt?: string; lastOutcome?: string | null; leadStage?: LeadStage },
    ) => Promise<void>;
  },
): UseVisitWorkflowReturn {
  const {
    tasks,
    setTasks,
    refreshTasks,
    queueOrRunTaskMutation,
    notifyAdminsForVisitEvent,
    updateInstitutionMetaFromVisit,
    logActivityEvent,
    createInAppNotification,
  } = callbacks;

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  const [visitSectionStateByTask, setVisitSectionStateByTask] = useState<Record<string, VisitSectionState>>({});
  const [quickNoteDraftByTask, setQuickNoteDraftByTask] = useState<Record<string, string>>({});
  const [voiceTaskId, setVoiceTaskId] = useState<string | null>(null);
  const [locationBusyTaskId, setLocationBusyTaskId] = useState<string | null>(null);

  const [commentsByTask, setCommentsByTask] = useState<Record<string, TaskComment[]>>({});
  const [commentDraftByTask, setCommentDraftByTask] = useState<Record<string, string>>({});

  const [activeFollowupTaskId, setActiveFollowupTaskId] = useState<string | null>(null);

  const ensureFollowUpTaskForDate = useCallback(
    async (task: OfficeTask, date: string, actionLabel?: string, followUpTypeHint?: FollowUpType | null) => {
      const normalizedDate = normalizeIsoDateInput(date);
      if (!normalizedDate || task.task_category !== "visit" || !task.user_id) return;
      const institutionLabel = task.institution_name || task.task_title;
      const marker = `Linked visit task: ${task.id}`;
      const normalizedInstitutionName = (task.institution_name || "").toLowerCase();
      const followUpType = followUpTypeHint ?? task.follow_up_type ?? null;

      const isVisitFollowUp =
        followUpType === "visit" ||
        ((task.visit_outcome || []).includes("decision_maker_not_available") ||
          (task.visit_outcome || []).includes("revisit_required"));

      const linkedCandidates = tasks.filter((candidate) => {
        if (candidate.user_id !== task.user_id) return false;
        if ((candidate.task_category || "general") !== (isVisitFollowUp ? "visit" : "general")) return false;
        if (candidate.id === task.id) return false;
        const description = (candidate.description || "").toLowerCase();
        const hasMarker = description.includes(marker.toLowerCase());
        if (isVisitFollowUp) {
          if (hasMarker) return true;
          const sameInstitutionId = Boolean(task.institution_id) && candidate.institution_id === task.institution_id;
          const sameInstitutionName =
            Boolean(normalizedInstitutionName) &&
            (candidate.institution_name || "").toLowerCase().includes(normalizedInstitutionName);
          return sameInstitutionId || sameInstitutionName;
        }
        const title = (candidate.task_title || "").toLowerCase();
        return hasMarker || title.includes(normalizedInstitutionName);
      });
      const existingSameDate = linkedCandidates.find(
        (candidate) => normalizeIsoDateInput(candidate.assigned_date) === normalizedDate,
      );
      if (existingSameDate) return;

      const activeLinked = linkedCandidates.filter(
        (candidate) => candidate.status !== "completed" && candidate.visit_status !== "completed",
      );

      if (activeLinked.length > 0) {
        const [primary, ...duplicates] = activeLinked.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );

        await queueOrRunTaskMutation({
          actionType: "update_task",
          entityId: primary.id,
          payload: isVisitFollowUp
            ? {
                assigned_date: normalizedDate,
                visit_date: normalizedDate,
                due_date: normalizedDate,
                status: "not_started",
                visit_status: "planned",
                follow_up_required: null,
                follow_up_type: null,
                follow_up_date: null,
                follow_up_status: null,
              }
            : {
                assigned_date: normalizedDate,
                due_date: normalizedDate,
                status: "not_started",
              },
          queuedMessage: "Follow-up task move queued offline.",
        });

        for (const duplicate of duplicates) {
          await queueOrRunTaskMutation({
            actionType: "update_task",
            entityId: duplicate.id,
            payload: {
              status: "completed",
              visit_status: duplicate.task_category === "visit" ? "completed" : duplicate.visit_status,
              completion_note: "Superseded by updated follow-up schedule.",
            },
            queuedMessage: "Duplicate follow-up cleanup queued offline.",
          });
        }
        return;
      }

      const payload: Record<string, unknown> = isVisitFollowUp
        ? {
            user_id: task.user_id,
            task_title: `Visit: ${institutionLabel}`,
            description: `${actionLabel || "Visit follow-up"} scheduled from journey workflow. ${marker}`,
            task_category: "visit",
            task_type: "planned",
            priority: task.priority || "medium",
            status: "not_started",
            visit_brand: task.visit_brand || null,
            institution_type: task.institution_type || null,
            institution_name: task.institution_name || null,
            institution_id: task.institution_id || null,
            visit_date: normalizedDate,
            visit_status: "planned",
            assigned_date: normalizedDate,
            due_date: normalizedDate,
            remarks: null,
            blockers: null,
            completion_note: null,
            check_in_at: null,
            meeting_started_at: null,
            meeting_completed_at: null,
            check_out_at: null,
            check_in_latitude: null,
            check_in_longitude: null,
            check_in_address: null,
            check_in_city: null,
            check_in_area: null,
            check_in_maps_link: null,
            check_in_location_at: null,
            visit_outcome: null,
            follow_up_required: null,
            follow_up_type: null,
            follow_up_date: null,
            follow_up_status: null,
            quick_note: null,
            brand_details: task.brand_details || null,
            started_at: null,
            completed_at: null,
          }
        : {
            user_id: task.user_id,
            task_title: `Follow-up: ${institutionLabel}`,
            description: `${actionLabel || "Visit follow-up"} scheduled from journey workflow. ${marker}`,
            task_category: "general",
            task_type: "planned",
            priority: "medium",
            status: "not_started",
            visit_brand: null,
            institution_type: null,
            institution_name: null,
            institution_id: null,
            visit_date: null,
            visit_status: null,
            assigned_date: normalizedDate,
            due_date: normalizedDate,
            remarks: null,
            blockers: null,
            completion_note: null,
            check_in_at: null,
            meeting_started_at: null,
            meeting_completed_at: null,
            check_out_at: null,
            check_in_latitude: null,
            check_in_longitude: null,
            check_in_address: null,
            check_in_city: null,
            check_in_area: null,
            check_in_maps_link: null,
            check_in_location_at: null,
            visit_outcome: null,
            follow_up_required: null,
            follow_up_type: null,
            follow_up_date: null,
            follow_up_status: null,
            quick_note: null,
            brand_details: null,
            started_at: null,
            completed_at: null,
          };

      await queueOrRunTaskMutation({
        actionType: "create_task",
        localEntityId: `followup_${task.id}_${normalizedDate}_${isVisitFollowUp ? "visit" : "general"}`,
        payload,
        queuedMessage: "Follow-up task queued offline.",
      });
    },
    [queueOrRunTaskMutation, tasks],
  );

  // ---------------------------------------------------------------------------
  // localStorage effects — visit section state
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!officeUser) return;
    try {
      const raw = localStorage.getItem(`visit-sections-${officeUser.id}`);
      if (!raw) {
        setVisitSectionStateByTask({});
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, Partial<VisitSectionState>>;
      const normalized: Record<string, VisitSectionState> = {};
      Object.entries(parsed).forEach(([taskId, sectionState]) => {
        normalized[taskId] = {
          ...defaultVisitSectionState,
          ...sectionState,
        };
      });
      setVisitSectionStateByTask(normalized);
    } catch {
      setVisitSectionStateByTask({});
    }
  }, [officeUser]);

  useEffect(() => {
    if (!officeUser) return;
    localStorage.setItem(`visit-sections-${officeUser.id}`, JSON.stringify(visitSectionStateByTask));
  }, [visitSectionStateByTask, officeUser]);

  // ---------------------------------------------------------------------------
  // localStorage effects — comments
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!officeUser) return;
    const commentsKey = `task-comments-${officeUser.id}`;
    const commentsRaw = localStorage.getItem(commentsKey);
    if (commentsRaw) {
      try {
        setCommentsByTask(JSON.parse(commentsRaw));
      } catch {
        // ignore
      }
    }
  }, [officeUser]);

  useEffect(() => {
    if (!officeUser) return;
    localStorage.setItem(`task-comments-${officeUser.id}`, JSON.stringify(commentsByTask));
  }, [commentsByTask, officeUser]);

  // ---------------------------------------------------------------------------
  // Visit outcome
  // ---------------------------------------------------------------------------

  const toggleVisitOutcome = useCallback(
    async (task: OfficeTask, outcome: VisitOutcome) => {
      if (task.task_category !== "visit") return;
      const current = [...(task.visit_outcome || [])] as VisitOutcome[];
      const exists = current.includes(outcome);
      let next = exists ? current.filter((o) => o !== outcome) : [...current, outcome];
      if (!exists && next.length > 2) {
        next = [current[current.length - 1] || outcome, outcome].slice(0, 2) as VisitOutcome[];
      }

      const followUpRequired = Boolean(task.follow_up_required);
      const currentVisitStatus = (task.visit_status as VisitStatus | null) || "planned";
      const currentTaskStatus = task.status || mapVisitToTaskStatus(currentVisitStatus);
      const preserveInFlightStatus =
        !followUpRequired && (currentVisitStatus === "planned" || currentVisitStatus === "reached" || currentVisitStatus === "in_meeting");
      const nextVisitStatus = preserveInFlightStatus
        ? currentVisitStatus
        : autoVisitStatusFromOutcome(next, followUpRequired, currentVisitStatus);
      const updates: Partial<OfficeTask> = {
        visit_outcome: next,
        visit_status: nextVisitStatus,
        status: preserveInFlightStatus ? currentTaskStatus : mapVisitToTaskStatus(nextVisitStatus),
      };

      if (next.includes("not_interested")) {
        updates.follow_up_required = false;
        updates.follow_up_type = null;
        updates.follow_up_date = null;
        updates.follow_up_status = null;
      }

      try {
        await queueOrRunTaskMutation({
          actionType: "update_task",
          entityId: task.id,
          payload: updates,
          successMessage: navigator.onLine ? "Outcome updated." : undefined,
          queuedMessage: "Outcome update saved offline and queued for sync.",
        });
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to update outcome."));
        return;
      }
      await logActivityEvent?.({
        eventType: "visit_outcome_selected",
        summary: `${task.task_title}: outcome updated`,
        visitTaskId: task.id,
        institutionId: task.institution_id ?? null,
        metadata: { outcomes: next },
      });
      await notifyAdminsForVisitEvent(
        task,
        "Visit outcome updated",
        `${officeUser?.full_name || "Employee"} updated outcome for ${task.institution_name || "institution"}.`,
      );
      const suggestedStage: LeadStage | undefined = next.includes("need_proposal")
        ? "proposal_expected"
        : next.includes("need_demo")
          ? "demo_scheduled"
          : next.includes("interested")
            ? "interested"
            : undefined;
      await updateInstitutionMetaFromVisit(task, {
        lastOutcome: next.map((o) => visitOutcomeLabels[o]).join(", ") || null,
        leadStage: suggestedStage,
      });
      if (navigator.onLine) {
        await refreshTasks();
      }
    },
    [queueOrRunTaskMutation, logActivityEvent, notifyAdminsForVisitEvent, updateInstitutionMetaFromVisit, officeUser, refreshTasks],
  );

  // ---------------------------------------------------------------------------
  // Follow-up actions
  // ---------------------------------------------------------------------------

  const applyFollowupAction = useCallback(
    async (
      task: OfficeTask,
      action: "call" | "whatsapp" | "visit_again" | "demo" | "send_proposal" | "no_followup",
    ) => {
      if (task.task_category !== "visit") return;
      if (action === "no_followup") {
        const visitOutcomes = (task.visit_outcome || []) as VisitOutcome[];
        const nextVisitStatus = autoVisitStatusFromOutcome(
          visitOutcomes,
          false,
          task.visit_status as VisitStatus | null,
        );
        try {
          await queueOrRunTaskMutation({
            actionType: "update_task",
            entityId: task.id,
            payload: {
              follow_up_required: false,
              follow_up_type: null,
              follow_up_date: null,
              follow_up_status: null,
              visit_status: nextVisitStatus,
              status: mapVisitToTaskStatus(nextVisitStatus),
            },
            successMessage: navigator.onLine ? "Follow-up cleared." : undefined,
            queuedMessage: "Follow-up update queued offline.",
          });
        } catch (error: unknown) {
          toast.error(getErrorMessage(error, "Unable to clear follow-up."));
          return;
        }
        await logActivityEvent?.({
          eventType: "followup_cleared",
          summary: `${task.task_title}: no follow-up required`,
          visitTaskId: task.id,
          institutionId: task.institution_id ?? null,
        });
        await notifyAdminsForVisitEvent(
          task,
          "Follow-up cleared",
          `${officeUser?.full_name || "Employee"} cleared follow-up for ${task.institution_name || "institution"}.`,
        );
        await updateInstitutionMetaFromVisit(task, { leadStage: "visited" });
        setActiveFollowupTaskId(null);
        if (navigator.onLine) {
          await refreshTasks();
        }
        return;
      }

      const followTypeMap: Record<Exclude<typeof action, "no_followup">, FollowUpType> = {
        call: "call",
        whatsapp: "whatsapp",
        visit_again: "visit",
        demo: "demo",
        send_proposal: "proposal",
      };
      const follow_up_type = followTypeMap[action as Exclude<typeof action, "no_followup">];
      const today = new Date().toISOString().slice(0, 10);
      try {
        await queueOrRunTaskMutation({
          actionType: "update_task",
          entityId: task.id,
          payload: {
            follow_up_required: true,
            follow_up_type,
            follow_up_date: task.follow_up_date || today,
            follow_up_status: "pending",
            visit_status: "followup_pending",
            status: mapVisitToTaskStatus("followup_pending"),
          },
          successMessage: navigator.onLine ? "Follow-up set." : undefined,
          queuedMessage: "Follow-up action queued offline.",
        });
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to set follow-up."));
        return;
      }
      await logActivityEvent?.({
        eventType: "followup_created",
        summary: `${task.task_title}: follow-up ${followUpTypeLabels[follow_up_type]} scheduled`,
        visitTaskId: task.id,
        institutionId: task.institution_id ?? null,
        metadata: { follow_up_type, follow_up_date: task.follow_up_date || today },
      });
      await notifyAdminsForVisitEvent(
        task,
        "Follow-up scheduled",
        `${officeUser?.full_name || "Employee"} scheduled ${followUpTypeLabels[follow_up_type]} for ${
          task.institution_name || "institution"
        }.`,
      );
      // Remind the acting employee on the follow-up date
      if (officeUser && createInAppNotification) {
        const dueDate = task.follow_up_date || today;
        await createInAppNotification({
          userId: officeUser.id,
          type: "follow_up",
          title: `Follow-up due: ${task.institution_name || task.task_title}`,
          message: `${followUpTypeLabels[follow_up_type]} follow-up scheduled for ${dueDate}.`,
          severity: "medium",
          relatedVisitTaskId: task.id,
          relatedInstitutionId: task.institution_id ?? null,
          dedupeFingerprint: `followup-${task.id}-${dueDate}`,
        });
      }
      await updateInstitutionMetaFromVisit(task, { leadStage: "followup_pending" });
      setActiveFollowupTaskId(task.id);
      const dueDate = normalizeIsoDateInput(task.follow_up_date || today);
      await ensureFollowUpTaskForDate(task, dueDate, followUpTypeLabels[follow_up_type], follow_up_type);
      if (navigator.onLine) {
        await refreshTasks();
      }
    },
    [
      queueOrRunTaskMutation,
      logActivityEvent,
      notifyAdminsForVisitEvent,
      updateInstitutionMetaFromVisit,
      officeUser,
      ensureFollowUpTaskForDate,
      refreshTasks,
    ],
  );

  // ---------------------------------------------------------------------------
  // Save follow-up date
  // ---------------------------------------------------------------------------

  const saveFollowUpDate = useCallback(
    async (taskId: string, date: string, preferredFollowUpType?: FollowUpType | null) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const normalizedDate = normalizeIsoDateInput(date);
      if (!normalizedDate) {
        toast.error("Please select a valid follow-up date.");
        return;
      }
      // (Previously showed a window.confirm when a linked visit task existed on another date.
      //  That confused users: picking a follow-up date for *today's* closed visit was asking
      //  whether to reschedule. Now we silently let ensureFollowUpTaskForDate below
      //  move/create the linked follow-up task. Today's DSR task keeps its own visit_date.)
      const previousFollowUpDate = normalizeIsoDateInput(task.follow_up_date || "");
      const isDateRescheduled = Boolean(previousFollowUpDate && previousFollowUpDate !== normalizedDate);
      const remarksWithAudit = isDateRescheduled
        ? upsertRescheduleAuditRemark(task.remarks, previousFollowUpDate as string, normalizedDate)
        : task.remarks;

      try {
        await queueOrRunTaskMutation({
          actionType: "update_task",
          entityId: taskId,
          payload: {
            follow_up_required: true,
            follow_up_date: normalizedDate,
            follow_up_status: "pending",
            visit_status: "followup_pending",
            status: mapVisitToTaskStatus("followup_pending"),
            ...(isDateRescheduled ? { remarks: remarksWithAudit } : {}),
          },
          successMessage: navigator.onLine ? "Follow-up date saved." : undefined,
          queuedMessage: "Follow-up date queued offline.",
        });
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to save follow-up date."));
        return;
      }
      await logActivityEvent?.({
        eventType: "followup_date_updated",
        summary: isDateRescheduled
          ? `${task?.task_title || "Visit task"}: follow-up date rescheduled from ${previousFollowUpDate} to ${normalizedDate}`
          : `${task?.task_title || "Visit task"}: follow-up date set to ${normalizedDate}`,
        visitTaskId: taskId,
        institutionId: task?.institution_id ?? null,
        metadata: {
          follow_up_date: normalizedDate,
          previous_follow_up_date: previousFollowUpDate || null,
          is_reschedule: isDateRescheduled,
        },
      });
      // Update reminder notification with the new date
      if (officeUser && createInAppNotification && task) {
        await createInAppNotification({
          userId: officeUser.id,
          type: "follow_up",
          title: `Follow-up due: ${task.institution_name || task.task_title}`,
          message: `Follow-up date updated to ${normalizedDate}.`,
          severity: "medium",
          relatedVisitTaskId: taskId,
          relatedInstitutionId: task?.institution_id ?? null,
          dedupeFingerprint: `followup-${taskId}-${normalizedDate}`,
        });
      }
      await ensureFollowUpTaskForDate(task, normalizedDate, "Visit follow-up", preferredFollowUpType);
      if (navigator.onLine) {
        await refreshTasks();
      }
    },
    [tasks, queueOrRunTaskMutation, logActivityEvent, createInAppNotification, officeUser, refreshTasks, ensureFollowUpTaskForDate],
  );

  // ---------------------------------------------------------------------------
  // Quick note
  // ---------------------------------------------------------------------------

  const saveQuickNote = useCallback(
    async (taskId: string, value: string) => {
      try {
        await queueOrRunTaskMutation({
          actionType: "update_task",
          entityId: taskId,
          payload: { quick_note: value || null },
          queuedMessage: "Quick note queued offline.",
        });
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to save note."));
        return;
      }
      if (navigator.onLine) {
        await refreshTasks();
      }
    },
    [queueOrRunTaskMutation, refreshTasks],
  );

  // ---------------------------------------------------------------------------
  // DSR fields — generic patch helper for any DSR column
  // ---------------------------------------------------------------------------

  const saveDsrFields = useCallback(
    async (taskId: string, patch: Partial<OfficeTask>) => {
      try {
        await queueOrRunTaskMutation({
          actionType: "update_task",
          entityId: taskId,
          payload: patch,
          queuedMessage: "DSR update queued offline.",
        });
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to save DSR fields."));
        return;
      }
      if (navigator.onLine) {
        await refreshTasks();
      }
    },
    [queueOrRunTaskMutation, refreshTasks],
  );

  // ---------------------------------------------------------------------------
  // Voice quick note (speech recognition)
  // ---------------------------------------------------------------------------

  const startVoiceQuickNote = useCallback(
    (task: OfficeTask) => {
      const speechWindow = window as unknown as {
        SpeechRecognition?: SpeechRecognitionCtor;
        webkitSpeechRecognition?: SpeechRecognitionCtor;
      };
      const SpeechRecognitionApi = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
      if (!SpeechRecognitionApi) {
        toast.error("Voice input not supported on this browser.");
        return;
      }
      const recognition = new SpeechRecognitionApi();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      setVoiceTaskId(task.id);
      recognition.onresult = async (event: SpeechRecognitionEventLike) => {
        const transcript = event?.results?.[0]?.[0]?.transcript?.trim?.() || "";
        if (!transcript) return;
        const merged = [task.quick_note || "", transcript].filter(Boolean).join(" ");
        setQuickNoteDraftByTask((prev) => ({ ...prev, [task.id]: merged }));
        await saveQuickNote(task.id, merged);
      };
      recognition.onerror = () => {
        toast.error("Voice input failed.");
        setVoiceTaskId(null);
      };
      recognition.onend = () => setVoiceTaskId(null);
      recognition.start();
    },
    [saveQuickNote],
  );

  // ---------------------------------------------------------------------------
  // Brand details helpers
  // ---------------------------------------------------------------------------

  const updateBrandDetails = useCallback(
    async (task: OfficeTask, nextDetails: BrandDetails) => {
      if (task.task_category !== "visit") return;
      const clean = sanitizeBrandDetails(task.visit_brand || "Vivencia", nextDetails);
      try {
        await queueOrRunTaskMutation({
          actionType: "update_task",
          entityId: task.id,
          payload: { brand_details: clean },
          queuedMessage: "Brand details queued offline.",
        });
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to update brand details."));
        return;
      }
      await logActivityEvent?.({
        eventType: "brand_details_updated",
        summary: `${task.task_title}: brand details updated`,
        visitTaskId: task.id,
        institutionId: task.institution_id ?? null,
        metadata: { brand: task.visit_brand, details: clean },
      });
      if (navigator.onLine) {
        await refreshTasks();
      }
    },
    [queueOrRunTaskMutation, logActivityEvent, refreshTasks],
  );

  const toggleBrandMultiValue = useCallback(
    async (task: OfficeTask, field: keyof BrandDetails, value: string, max = 6) => {
      const details = getTaskBrandDetails(task);
      const current = Array.isArray(details[field])
        ? ([...(details[field] as string[])] as string[])
        : [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value].slice(0, max);
      await updateBrandDetails(task, { ...details, [field]: next });
    },
    [updateBrandDetails],
  );

  const setBrandSingleValue = useCallback(
    async (task: OfficeTask, field: keyof BrandDetails, value: string) => {
      const details = getTaskBrandDetails(task);
      await updateBrandDetails(task, { ...details, [field]: value });
    },
    [updateBrandDetails],
  );

  // ---------------------------------------------------------------------------
  // Comments
  // ---------------------------------------------------------------------------

  const addTaskComment = useCallback(
    (taskId: string) => {
      if (!officeUser) return;
      const draft = (commentDraftByTask[taskId] || "").trim();
      if (!draft) return;
      const next: TaskComment = {
        id: `${taskId}-${Date.now()}`,
        taskId,
        text: draft,
        author: officeUser.full_name,
        createdAt: new Date().toISOString(),
      };
      setCommentsByTask((prev) => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), next],
      }));
      setCommentDraftByTask((prev) => ({ ...prev, [taskId]: "" }));
    },
    [officeUser, commentDraftByTask],
  );

  // ---------------------------------------------------------------------------
  // Geolocation / check-in
  // ---------------------------------------------------------------------------

  const getBestEffortPosition = useCallback(async (): Promise<GeolocationPosition> => {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported on this device/browser.");
    }

    return new Promise<GeolocationPosition>((resolve, reject) => {
      let best: GeolocationPosition | null = null;
      let settled = false;
      let watchId: number | null = null;

      const finalize = (position: GeolocationPosition) => {
        if (settled) return;
        settled = true;
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        resolve(position);
      };

      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        reject(error);
      };

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!best || (position.coords.accuracy || Number.MAX_SAFE_INTEGER) < (best.coords.accuracy || Number.MAX_SAFE_INTEGER)) {
            best = position;
          }
          if ((position.coords.accuracy || Number.MAX_SAFE_INTEGER) <= 80) {
            finalize(position);
          }
        },
        () => {
          // Ignore watch errors; fallback below.
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        },
      );

      setTimeout(() => {
        if (settled) return;
        if (best) {
          finalize(best);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          finalize,
          fail,
          {
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 60000,
          },
        );
      }, 9000);
    });
  }, []);

  const fetchDeviceLocation = useCallback(async () => {
    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      throw new Error("Location capture needs HTTPS in production. Please open this app over https://");
    }
    const position = await getBestEffortPosition();

    const latitude = Number(position.coords.latitude.toFixed(6));
    const longitude = Number(position.coords.longitude.toFixed(6));
    const accuracyMeters = Math.max(1, Math.round(position.coords.accuracy || 0));

    let address = `${latitude}, ${longitude}`;
    let city: string | null = null;
    let area: string | null = null;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      );
      if (response.ok) {
        const data = await response.json();
        address = data?.display_name || address;
        city =
          data?.address?.city ||
          data?.address?.town ||
          data?.address?.village ||
          data?.address?.municipality ||
          null;
        area =
          data?.address?.suburb ||
          data?.address?.neighbourhood ||
          data?.address?.county ||
          data?.address?.state_district ||
          data?.address?.state ||
          null;
      }
    } catch {
      // Fallback to lat/lng-only summary if reverse geocode fails.
    }

    return {
      latitude,
      longitude,
      accuracyMeters,
      address,
      city,
      area,
      mapsLink: `https://www.google.com/maps?q=${latitude},${longitude}`,
    };
  }, [getBestEffortPosition]);

  const fetchAndSaveVisitLocation = useCallback(
    async (task: OfficeTask) => {
      if (task.task_category !== "visit") return;
      try {
        setLocationBusyTaskId(task.id);
        const location = await fetchDeviceLocation();

        // Note: institutions are not available in this hook; caller should
        // handle institution-coordinate proximity checks before calling.
        const now = new Date().toISOString();
        const updates: Partial<OfficeTask> = {
          check_in_latitude: location.latitude,
          check_in_longitude: location.longitude,
          check_in_address: location.address,
          check_in_city: location.city,
          check_in_area: location.area,
          check_in_maps_link: location.mapsLink,
          check_in_location_at: now,
          check_in_at: now,
          visit_status: "reached",
          status: mapVisitToTaskStatus("reached"),
        };
        await queueOrRunTaskMutation({
          actionType: "update_task",
          entityId: task.id,
          payload: updates,
          queuedMessage: "Location captured and queued for sync.",
        });
        await notifyAdminsForVisitEvent(
          task,
          "Visit check-in location captured",
          `${officeUser?.full_name || "Employee"} captured location for ${task.institution_name || "institution"}.`,
        );
        const accuracyNote =
          location.accuracyMeters > 250
            ? `Low GPS accuracy (~${location.accuracyMeters}m). Prefer mobile GPS for better precision.`
            : `Accuracy ~${location.accuracyMeters}m.`;
        toast.success(`Location captured and check-in saved. ${accuracyNote}`);
        if (navigator.onLine) {
          await refreshTasks();
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to fetch location."));
      } finally {
        setLocationBusyTaskId(null);
      }
    },
    [fetchDeviceLocation, queueOrRunTaskMutation, notifyAdminsForVisitEvent, officeUser, refreshTasks],
  );

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // State — visit section
    visitSectionStateByTask,
    setVisitSectionStateByTask,
    quickNoteDraftByTask,
    setQuickNoteDraftByTask,
    voiceTaskId,
    setVoiceTaskId,
    locationBusyTaskId,
    setLocationBusyTaskId,

    // State — comments
    commentsByTask,
    setCommentsByTask,
    commentDraftByTask,
    setCommentDraftByTask,

    // State — follow-up
    activeFollowupTaskId,
    setActiveFollowupTaskId,

    // Actions
    toggleVisitOutcome,
    applyFollowupAction,
    saveFollowUpDate,
    saveQuickNote,
    saveDsrFields,
    startVoiceQuickNote,
    toggleBrandMultiValue,
    setBrandSingleValue,
    addTaskComment,
    fetchAndSaveVisitLocation,

    // Journey helpers
    getJourneyStageIndex,
    getVisitStatusLabelForTask,
    mapVisitToTaskStatus,
  };
}
