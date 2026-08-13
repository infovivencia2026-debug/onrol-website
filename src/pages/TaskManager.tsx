import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Building2,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Bell,
  GaugeCircle,
  Home,
  Loader2,
  Moon,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Sun,
  UserCircle2,
  Users,
  ListTodo,
  Upload,
  FileDown,
  ChevronDown,
  ChevronUp,
  Download,
  LayoutDashboard,
  ListChecks,
  SquarePlus,
  Settings,
  Sparkles,
  CheckCheck,
  MessageSquare,
  Inbox,
  Megaphone,
  ContactRound,
  UsersRound,
  Send,
  Phone,
  Video,
  Search,
  MapPin,
  Share2,
  FileText,
  Activity,
  FolderOpen,
  HelpCircle,
  Edit2,
  X,
  Menu,
  MoreVertical,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import VisitPanel from "@/components/task/VisitPanel";
import JourneyPlanPage from "@/components/task/JourneyPlanPage";
import PostVisitWizard from "@/components/task/PostVisitWizard";
import { VisitPlannerWizard } from "@/components/task/VisitPlannerWizard";
import FileTransfer from "@/components/task/FileTransfer";
import onrolLogo from "@/assets/onrol-logo.png";
import { supabase } from "@/lib/supabase";
import { tmUpdateInstitution, tmDeleteTask } from "@/lib/tmClient";
import { enableWebPush, sendReminderNotifications, sendTestNotification } from "@/lib/pushNotifications";
import { enablePush } from "@/lib/pushUnified";
import { isNative, checkAndroidUpdate } from "@/lib/capacitorNative";
import { sendAdminPush } from "@/lib/adminPush";
import {
  enqueueOfflineAction,
  getOfflineQueueItems,
  nextRetryAtIso,
  removeQueueItem,
  updateQueueItem,
  type OfflineQueueItem,
} from "@/lib/offlineQueue";
import { isStandaloneMode, type BeforeInstallPromptEvent } from "@/lib/pwa";
import type { Session, User } from "@supabase/supabase-js";
import { useLocation, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import type {
  Role,
  TaskSection,
  TaskCategory,
  TaskType,
  Priority,
  Status,
  VisitBrand,
  InstitutionType,
  VisitStatus,
  VisitOutcome,
  FollowUpType,
  FollowUpStatus,
  InterestLevel,
  UiTheme,
  AdminModule,
  VisitSectionKey,
  BrandDetails,
  BrandRelevance,
  LeadStage,
  ConversionStatus,
  DealSizeCategory,
  InstitutionDraft,
  SpeechRecognitionEventLike,
  SpeechRecognitionInstance,
  SpeechRecognitionCtor,
  VisitSectionState,
  Institution,
  OfficeUser,
  OfficeTask,
  TaskStatusAudit,
  ActivityEvent,
  SyncState,
  NotificationSeverity,
  NotificationType,
  NotificationItem,
  NotificationPrefs,
  InstitutionConflictSignal,
  AutomationSettings,
  TaskDraft,
  ImportRow,
  OfficeInvite,
  ImportHistory,
  TaskComment,
  ConversationType,
  ConversationMemberRole,
  PresenceStatus,
  AnnouncementAckStatus,
  MessengerConversation,
  MessengerMessage,
  MessengerConversationMember,
} from "@/types/taskManager";
import {
  initialDraft,
  defaultNotificationPrefs,
  defaultAutomationSettings,
  defaultVisitSectionState,
} from "@/types/taskManager";
import {
  statusLabels,
  visitStatusLabels,
  canAccessJourneyPlanner,
  getVisitStatusLabelForTask,
  getJourneyStageIndex,
  visitOutcomeLabels,
  followUpTypeLabels,
  followUpStatusLabels,
  brandFieldConfig,
  formatChipLabel,
  formatNotificationTypeLabel,
  normalizeInstitutionName,
  normalizeIsoDateInput,
  getErrorMessage,
  isMessengerSchemaMissingError,
  createDefaultInstitutionDraft,
  ensureInstitutionDraft,
  statusClass,
  priorityClass,
  raceWithTimeout,
  expectedHeaders,
  normalizeHeader,
  parseCsvLine,
  parseScheduleText,
} from "@/utils/taskManager";
import MessengerPanel from "@/components/task/MessengerPanel";
import {
  WorkspaceEmptyState,
  WorkspaceGreeting,
  WorkspaceInlineNotice,
  WorkspacePageSkeleton,
} from "@/components/task/WorkspaceStates";
import useWebRTC from "@/hooks/taskManager/useWebRTC";
import CallOverlay from "@/components/task/CallOverlay";
import EmployeeWorkspaceCards from "@/components/task/EmployeeWorkspaceCards";
import MeetingRoom from "@/components/task/MeetingRoom";
import { MeetingListView } from "@/components/task/meeting/MeetingListView";
import { MeetingCreateModal } from "@/components/task/meeting/MeetingCreateModal";
import type { Meeting } from "@/types/meeting";
import {
  unlockAudio,
  playTaskCompleteTone,
  playOverdueTone,
  playNotificationPop,
} from "@/lib/soundNotifications";
import { getDesktopSettings, isDesktopRuntime, openExternalUrl, setDesktopBadge } from "@/lib/desktopBridge";
import type { DesktopDeepLink, DesktopUpdateState } from "@/lib/desktopBridge";
import {
  useAuth,
  useTasks,
  useNotifications,
  useInstitutions,
  useMessenger,
  useVisitWorkflow,
  useOfflineAndPWA,
  useAdmin,
  useImportExport,
  useFileTransferPresence,
} from "@/hooks/taskManager";
import SectionHeader from "@/components/task/SectionHeader";
import OfflineBanner from "@/components/task/OfflineBanner";
import BackToTop from "@/components/task/BackToTop";
import AIAssistant from "@/components/task/AIAssistant";
import UserManagement from "@/components/task/UserManagement";
import UserGuide from "@/components/task/UserGuide";
import TaskIncompleteModal, { type IncompletePayload } from "@/components/task/TaskIncompleteModal";
import SparklineKpiCard from "@/components/task/SparklineKpiCard";
import EmployeeDashboardPanel from "@/components/task/EmployeeDashboardPanel";
import AdminFiltersDrawer from "@/components/task/AdminFiltersDrawer";
import AvatarWithFallback from "@/components/ui/AvatarWithFallback";
import EmptyState from "@/components/ui/EmptyState";
import { formatRelativeTime, formatShortDate } from "@/lib/timeUtils";

const DND_STORAGE_KEY = "task-notification-dnd-until";
const QUIET_HOURS_ENABLED_KEY = "task-notification-quiet-hours-enabled";
const QUIET_HOURS_START_KEY = "task-notification-quiet-hours-start";
const QUIET_HOURS_END_KEY = "task-notification-quiet-hours-end";
const MEETING_HISTORY_STORAGE_KEY = "task-meeting-history";
const STICKY_NOTES_STORAGE_KEY = "task-sticky-notes";

type MeetingHistoryEntry = {
  id: string;
  roomCode: string;
  roomName: string;
  hostName: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  participantPeak: number;
  transcript: string;
  summary: string;
  actionItems: string[];
  decisions: string[];
};

type StickyNoteEntry = {
  id: string;
  body: string;
  color: "amber" | "blue" | "mint" | "rose";
  updatedAt: string;
};

// --- utility functions moved to @/utils/taskManager ---

// Separate component so the redirect timer lives in a stable useEffect,
// not in the render body of TaskManager (which caused multiple timers on Android).
function SessionExpiredGate({
  logout,
  showDebug,
  authBootError,
}: {
  logout: () => Promise<void>;
  showDebug: boolean;
  authBootError: string | null;
}) {
  useEffect(() => {
    // Wait 6 s before redirecting — gives Capacitor/Android time to refresh the token.
    const timer = setTimeout(() => { void logout(); }, 6000);
    return () => clearTimeout(timer);
  }, [logout]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 text-slate-700">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Session Expired</h2>
        <p className="mt-2 text-sm text-slate-600">Your session has expired. Redirecting to login…</p>
        {showDebug && authBootError ? (
          <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
            Debug: {authBootError}
          </p>
        ) : null}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => { void logout(); }}
            className="rounded-lg bg-[#f3f5f8] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-95"
          >
            Log In Now
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

const RESCHEDULE_AUDIT_REGEX = /\[RESCHEDULE_AUDIT\](\d{4}-\d{2}-\d{2})\|(\d{4}-\d{2}-\d{2})/;
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

function extractRescheduleAuditLine(task: OfficeTask): string | null {
  const remarks = task.remarks || "";
  const match = remarks.match(RESCHEDULE_AUDIT_REGEX);
  if (!match) return null;
  const fromIso = match[1];
  const toIso = match[2];
  if (!fromIso || !toIso || fromIso === toIso) return null;
  return `${fromIso} -> ${toIso}`;
}

export default function TaskManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    session,
    authUser,
    officeUser,
    loading,
    pageLoading,
    authBootError,
    bootStep,
    profileDraft,
    setProfileDraft,
    profileSaving,
    setBootStep,
    setAuthBootError,
    setPageLoading,
    updateProfile: saveProfileSettings,
  } = useAuth();

  // --- Extracted hooks ---
  const tasksHook = useTasks(officeUser, { setBootStep: setBootStep as (step: string) => void, setPageLoading, setAuthBootError });
  const {
    tasks, setTasks, teamMembers, setTeamMembers, auditLogs, activityEvents,
    showForm, setShowForm, editingTaskId, setEditingTaskId, taskDraft, setTaskDraft,
    taskScope, setTaskScope, showQuickAdd, setShowQuickAdd, quickTitle, setQuickTitle,
    quickPriority, setQuickPriority, quickDueDate, setQuickDueDate,
    visibleTasks, refreshTasks, logActivityEvent, queueOrRunTaskMutation,
    processOfflineQueue, loadQueueItems, isOffline, queueItems, syncingQueue,
    // Admin filter states
    adminEmployeeFilter, setAdminEmployeeFilter, adminStatusFilter, setAdminStatusFilter,
    adminTypeFilter, setAdminTypeFilter, adminTaskCategoryFilter, setAdminTaskCategoryFilter,
    adminPriorityFilter, setAdminPriorityFilter, adminDateFilter, setAdminDateFilter,
    adminBrandFilter, setAdminBrandFilter, adminOutcomeFilter, setAdminOutcomeFilter,
    adminFollowUpStatusFilter, setAdminFollowUpStatusFilter, adminFollowUpDateFilter, setAdminFollowUpDateFilter,
    adminProgramInterestFilter, setAdminProgramInterestFilter, adminInterestLevelFilter, setAdminInterestLevelFilter,
    adminDiscussionStageFilter, setAdminDiscussionStageFilter, showAdminAdvancedFilters, setShowAdminAdvancedFilters,
  } = tasksHook;

  const notifHook = useNotifications(officeUser);
  const {
    notifications, setNotifications, notificationsBusy, notificationsError,
    notifPanelOpen, setNotifPanelOpen, quickActionsOpen, setQuickActionsOpen,
    notificationPrefs, setNotificationPrefs, automationSettings, setAutomationSettings,
    runningAutomation, setRunningAutomation, pushBusy, pushAction, pushStatus, pushMessage,
    setPushBusy, setPushAction, setPushStatus, setPushMessage,
    notifSettings, setNotifSettings,
    notifPanelRef, notifBellRef, quickActionsRef, quickActionsButtonRef,
    unreadNotificationCount, markNotificationRead, markAllNotificationsRead, clearAllNotifications,
    playNotificationTone, playMessageTone, showBrowserNotification,
    enablePushNotifications, sendTestPushNotification, sendReminderPushNotifications,
    createInAppNotification, logNotificationDelivery, withUiTimeout,
    setNotificationsError,
  } = notifHook;

  const instHook = useInstitutions(officeUser, { tasks, refreshTasks, logActivityEvent });
  const {
    institutions, setInstitutions, institutionSearchByTask, setInstitutionSearchByTask,
    expandedInstitutionSuggestionByTask, setExpandedInstitutionSuggestionByTask,
    showCreateInstitutionForTask, setShowCreateInstitutionForTask,
    creatingInstitutionForTask, setCreatingInstitutionForTask,
    duplicateConfirmByTask, setDuplicateConfirmByTask,
    institutionCreateDraftByTask, setInstitutionCreateDraftByTask,
    institutionConflictByTask, setInstitutionConflictByTask,
    selectedInstitutionId, setSelectedInstitutionId,
    adminInstitutionSearch, setAdminInstitutionSearch,
    adminInstitutionTypeFilter, setAdminInstitutionTypeFilter,
    adminInstitutionCityFilter, setAdminInstitutionCityFilter,
    adminInstitutionBrandFilter, setAdminInstitutionBrandFilter,
    adminInstitutionLeadStageFilter, setAdminInstitutionLeadStageFilter,
    adminInstitutionConversionFilter, setAdminInstitutionConversionFilter,
    adminInstitutionLeadScoreBand, setAdminInstitutionLeadScoreBand,
    adminInstitutionSort, setAdminInstitutionSort,
    institutionImportBusy, setInstitutionImportBusy, institutionImportSummary, setInstitutionImportSummary,
    institutionsLoading, institutionsLoadError, institutionsLoadSource,
    getInstitutionSuggestions, fetchInstitutionSuggestions, applyInstitutionToTask, createInstitutionForTask,
    checkInstitutionConflict, handleInstitutionExcelImport, reloadInstitutions,
  } = instHook || {};

  const messengerHook = useMessenger(officeUser, { playMessageTone });
  const {
    messengerConversations, setMessengerConversations, messengerMessagesByConversation,
    messengerMembersByConversation, messengerDirectory, messengerLoading: messengerLoading,
    messengerError: messengerError, messengerSchemaReady,
    messengerComposer, setMessengerComposer, messengerConversationQuery, setMessengerConversationQuery,
    messengerMessageQuery, setMessengerMessageQuery, messengerDirectoryQuery, setMessengerDirectoryQuery,
    messengerActionBusy, messengerReplyToId, setMessengerReplyToId,
    messengerEditMessageId, setMessengerEditMessageId, messengerEditBody, setMessengerEditBody,
    selectedMessageId, setSelectedMessageId, pinnedConversationIds, pinnedMessageIdsByConversation,
    announcementAcks, presenceByUserId, myPresenceStatus,
    messengerSettings, createTeamName, setCreateTeamName, createTeamDescription, setCreateTeamDescription,
    createTeamMemberIds, setCreateTeamMemberIds, selectedTeamAddMemberId, setSelectedTeamAddMemberId,
    showAnnouncementComposer, setShowAnnouncementComposer, announcementTitle, setAnnouncementTitle,
    announcementBody, setAnnouncementBody,
    messengerMode, messengerFilteredConversations, selectedMessengerConversation,
    messengerConversationId, setMessengerConversationId,
    loadMessengerData, sendMessengerPayload, uploadMessengerFile, markMessengerConversationRead,
    markAllMessengerConversationsRead, openOrCreateDirectConversation,
    createTeamGroupConversation, addMemberToSelectedTeam, removeMemberFromSelectedTeam,
    createAnnouncementConversation, acknowledgeAnnouncement, toggleAnnouncementReplies,
    toggleConversationPin, toggleConversationMute, toggleMessagePin, deleteConversation,
    startEditingMessage, saveEditedMessage, softDeleteMessage, moderateDeleteMessage, forwardMessages,
    sendLinkedRecordMessage, openMessengerSection,
    openInternalDiscussionForRecord,
  } = messengerHook || {};
  // Explicitly grab the two that TypeScript loses from the union with `{}`
  const saveMessengerSettings = messengerHook?.saveMessengerSettings ?? (async () => {});
  const setMessengerSettings = messengerHook?.setMessengerSettings;
  const sendMessengerPayloadSafe =
    messengerHook?.sendMessengerPayload ??
    (async () => {});
  const uploadMessengerFileSafe =
    messengerHook?.uploadMessengerFile ??
    (async () => {
      throw new Error("Messenger upload is unavailable.");
    });
  // messengerNavigate reuses the top-level navigate (same router instance)
  const messengerNavigate = navigate;

  const callHook = useWebRTC(officeUser);
  const {
    callState, callSession,
    localStream, remoteStream,
    localVideoRef, remoteVideoRef,
    isMuted, isCameraOff, isFrontCamera, canSwitchCamera,
    initiateCall, acceptCall, rejectCall, endCall,
    toggleMute, toggleCamera, switchCamera,
  } = callHook;

  const visitHook = useVisitWorkflow(officeUser, {
    tasks, setTasks, refreshTasks, queueOrRunTaskMutation,
    logActivityEvent,
    createInAppNotification: notifHook?.createInAppNotification,
    notifyAdminsForVisitEvent: notifHook?.notifyAdminsForVisitEvent ?? (async () => {}),
    updateInstitutionMetaFromVisit: async (task, options) => {
      if (!task.institution_id) return;
      try {
        const updates: Record<string, unknown> = {};
        if (options.lastVisitAt) updates.last_visit_at = options.lastVisitAt;
        if (options.lastOutcome !== undefined) updates.last_outcome = options.lastOutcome;
        if (options.leadStage) updates.current_lead_stage = options.leadStage;
        if (Object.keys(updates).length) {
          await tmUpdateInstitution(task.institution_id, updates);
        }
      } catch { /* best-effort */ }
    },
  });
  const {
    visitSectionStateByTask, setVisitSectionStateByTask,
    quickNoteDraftByTask, setQuickNoteDraftByTask, voiceTaskId, setVoiceTaskId,
    locationBusyTaskId, setLocationBusyTaskId,
    commentsByTask, setCommentsByTask, commentDraftByTask, setCommentDraftByTask,
    activeFollowupTaskId, setActiveFollowupTaskId,
    toggleVisitOutcome, applyFollowupAction, saveFollowUpDate, saveQuickNote, saveDsrFields,
    startVoiceQuickNote, toggleBrandMultiValue, setBrandSingleValue,
    addTaskComment, fetchAndSaveVisitLocation,
  } = visitHook || {};

  // Global file transfer presence — always connected so all devices are always visible
  const ftPresence = useFileTransferPresence(officeUser ?? null);

  const pwaHook = useOfflineAndPWA(officeUser, refreshTasks, logActivityEvent);
  const {
    installPromptEvent, setInstallPromptEvent, showInstallBanner, setShowInstallBanner,
    showPwaOnboarding, setShowPwaOnboarding, isStandalone, setIsStandalone,
    handleInstallPWA, dismissInstallBanner, dismissPwaOnboarding,
    queueSummary,
  } = pwaHook || {};

  const adminHook = useAdmin(officeUser, { tasks, teamMembers, institutions });
  const {
    adminModule, setAdminModule, selectedEmployeeId, setSelectedEmployeeId, adminMemberDrawerOpen, setAdminMemberDrawerOpen,
    invites, setInvites, inviteEmail, setInviteEmail, inviteName, setInviteName,
    inviteDepartment, setInviteDepartment, inviteRole, setInviteRole, inviting, setInviting,
    adminRangePreset, adminRangeFrom, adminRangeTo, adminGlobalBrand, adminGlobalInstitutionType,
    adminGlobalEmployee, adminGlobalCity, adminGlobalVisitStatus, adminGlobalFollowUpStatus,
    adminGlobalLeadStage, adminGlobalConversionStatus, adminGlobalRevenueBand, adminGlobalLeadScoreBand,
    setAdminRangePreset, setAdminRangeFrom, setAdminRangeTo, setAdminGlobalBrand,
    setAdminGlobalInstitutionType, setAdminGlobalEmployee, setAdminGlobalCity,
    setAdminGlobalVisitStatus, setAdminGlobalFollowUpStatus, setAdminGlobalLeadStage,
    setAdminGlobalConversionStatus, setAdminGlobalRevenueBand, setAdminGlobalLeadScoreBand,
    dataHealthCheckedAt, setDataHealthCheckedAt, dataHealthActionBusy, setDataHealthActionBusy,
    createInvite, resendInvite, revokeInvite,
    runDataHealthCheck, runDataHealthFix, runAutomation,
    pipelineStats, teamStats, revenueMetrics,
  } = adminHook || {};

  const importExportHook = useImportExport(officeUser, refreshTasks);
  const {
    showImportPanel, setShowImportPanel, importRows, setImportRows,
    importError, setImportError, importing, setImporting,
    importFileName, setImportFileName, importHistory, setImportHistory,
    handleImportFile, applyImport, exportTasksCsv,
  } = importExportHook || {};
  // --- End extracted hooks ---

  // ---------------------------------------------------------------------------
  // Derived messenger values (computed from hook state — were lost in code split)
  // ---------------------------------------------------------------------------

  const selectedConversationMessagesFiltered = useMemo(() => {
    if (!messengerConversationId) return [] as import("@/types/taskManager").MessengerMessage[];
    const msgs = (messengerMessagesByConversation ?? {})[messengerConversationId] ?? [];
    const filtered = !messengerMessageQuery?.trim()
      ? msgs
      : msgs.filter((m) => m.body?.toLowerCase().includes(messengerMessageQuery.trim().toLowerCase()));
    // Always display oldest → newest (top → bottom), regardless of fetch order
    return filtered.slice().sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messengerConversationId, messengerMessagesByConversation, messengerMessageQuery]);

  const selectedConversationMessagesById = useMemo(() => {
    const result: Record<string, import("@/types/taskManager").MessengerMessage> = {};
    for (const msg of selectedConversationMessagesFiltered) result[msg.id] = msg;
    return result;
  }, [selectedConversationMessagesFiltered]);

  const selectedConversationPinnedMessageIds = useMemo(() => {
    if (!messengerConversationId) return [] as string[];
    return (pinnedMessageIdsByConversation ?? {})[messengerConversationId] ?? [];
  }, [messengerConversationId, pinnedMessageIdsByConversation]);

  const selectedConversationCanModerate = useMemo(() => {
    if (!officeUser || !messengerConversationId) return false;
    if (officeUser.role === "admin") return true;
    const members = (messengerMembersByConversation ?? {})[messengerConversationId] ?? [];
    return members.some((m) => m.user_id === officeUser.id && m.role === "admin");
  }, [officeUser, messengerConversationId, messengerMembersByConversation]);

  const selectedMessageForActions = useMemo(() => {
    if (!selectedMessageId) return null;
    return selectedConversationMessagesById[selectedMessageId] ?? null;
  }, [selectedMessageId, selectedConversationMessagesById]);

  const selectedMessagePinned = useMemo(
    () => (selectedMessageId ? selectedConversationPinnedMessageIds.includes(selectedMessageId) : false),
    [selectedMessageId, selectedConversationPinnedMessageIds],
  );

  const selectedMessageMine = useMemo(
    () => (selectedMessageForActions && officeUser ? selectedMessageForActions.sender_id === officeUser.id : false),
    [selectedMessageForActions, officeUser],
  );

  const selectedMessageCanEdit = useMemo(
    () => Boolean(selectedMessageMine && selectedMessageForActions && !selectedMessageForActions.deleted_at),
    [selectedMessageMine, selectedMessageForActions],
  );

  const announcementRepliesLocked = useMemo(
    () =>
      selectedMessengerConversation?.type === "announcement" &&
      !(selectedMessengerConversation?.settings as Record<string, unknown> | null | undefined)?.replies_enabled,
    [selectedMessengerConversation],
  );

  const latestGeneralTask = useMemo(
    () =>
      (tasks ?? [])
        .filter((t) => (t.task_category || "general") !== "visit" && t.user_id === officeUser?.id)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null,
    [tasks, officeUser],
  );

  const latestJourneyTask = useMemo(
    () =>
      (tasks ?? [])
        .filter((t) => t.task_category === "visit" && t.user_id === officeUser?.id)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0] ?? null,
    [tasks, officeUser],
  );

  const selectedInstitution = useMemo(
    () => (selectedInstitutionId ? (institutions ?? []).find((i) => i.id === selectedInstitutionId) ?? null : null),
    [selectedInstitutionId, institutions],
  );

  const selectedGroupAddableMembers = useMemo(() => {
    if (!messengerConversationId) return messengerDirectory ?? [];
    const memberIds = new Set(
      ((messengerMembersByConversation ?? {})[messengerConversationId] ?? []).map((m) => m.user_id),
    );
    return (messengerDirectory ?? []).filter((u) => !memberIds.has(u.id));
  }, [messengerConversationId, messengerMembersByConversation, messengerDirectory]);

  const selectedConversationMemberUsers = useMemo(() => {
    if (!messengerConversationId) return [] as Array<{ user_id: string; role: string; user: import("@/types/taskManager").OfficeUser | null }>;
    const members = (messengerMembersByConversation ?? {})[messengerConversationId] ?? [];
    return members.map((m) => ({
      user_id: m.user_id,
      role: m.role,
      user: (messengerDirectory ?? []).find((u) => u.id === m.user_id) ?? null,
    }));
  }, [messengerConversationId, messengerMembersByConversation, messengerDirectory]);

  // ---------------------------------------------------------------------------
  // End derived messenger values
  // ---------------------------------------------------------------------------

  const [dashboardView, setDashboardView] = useState<"list" | "calendar">("list");
  const [calendarAnchor, setCalendarAnchor] = useState(() => new Date());
  const [journeyDate, setJourneyDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [journeyViewMode, setJourneyViewMode] = useState<"day" | "upcoming" | "all">("day");
  const [journeyVisitSearch, setJourneyVisitSearch] = useState("");
  const [expandedAuditTaskId, setExpandedAuditTaskId] = useState<string | null>(null);
  const [expandedTaskCardId, setExpandedTaskCardId] = useState<string | null>(null);
  const [showArchivedTasks, setShowArchivedTasks] = useState(false);
  const [showToolbarMenu, setShowToolbarMenu] = useState(false);
  // Admin Sales/Journey Tasks table search + "show all" toggle — keeps the DOM light by
  // rendering only the first 100 rows by default and filtering client-side on query.
  const [adminTasksSearch, setAdminTasksSearch] = useState("");
  const [adminTasksShowAll, setAdminTasksShowAll] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "notifications" | "account">("profile");
  // Post-visit wizard: set to task id when meeting_completed fires
  const [postVisitWizardTaskId, setPostVisitWizardTaskId] = useState<string | null>(null);
  // Reschedule dialog: set to task id when employee marks visit rescheduled
  const [rescheduleDialogTaskId, setRescheduleDialogTaskId] = useState<string | null>(null);
  const [rescheduleNewDate, setRescheduleNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [activeSection, setActiveSection] = useState<TaskSection>("dashboard");
  const [meetingJoinCode, setMeetingJoinCode] = useState<string | null>(null);
  const [showMeetingCreateModal, setShowMeetingCreateModal] = useState(false);
  const [selectedMeetingForJoin, setSelectedMeetingForJoin] = useState<Meeting | null>(null);
  // Global search
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [showAdminFiltersDrawer, setShowAdminFiltersDrawer] = useState(false);
  const [incompleteTask, setIncompleteTask] = useState<import("@/types/taskManager").OfficeTask | null>(null);
  const desktopRuntime = isDesktopRuntime();
  const [desktopSettings, setDesktopSettings] = useState({
    runInBackground: true,
    notificationsEnabled: true,
    notificationSound: true,
    launchOnStartup: false,
    globalHotkeysEnabled: true,
    dndUntil: null as string | null,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    zoomFactor: 1.0,
  });
  const [desktopSettingsSaving, setDesktopSettingsSaving] = useState(false);
  const [desktopNotificationHistory, setDesktopNotificationHistory] = useState<Array<Record<string, unknown>>>([]);
  const [desktopUpdateState, setDesktopUpdateState] = useState<DesktopUpdateState | null>(null);
  const [desktopHealthState, setDesktopHealthState] = useState<Record<string, unknown> | null>(null);
  const [desktopUpdateBusy, setDesktopUpdateBusy] = useState(false);
  const [androidUpdate, setAndroidUpdate] = useState<{ available: boolean; latestVersion: string; apkUrl: string } | null>(null);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState<"all" | "unread" | "tasks" | "meetings" | "chat" | "admin">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [quietHoursEnabled, setQuietHoursEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(QUIET_HOURS_ENABLED_KEY) === "1";
  });
  const [channelPrefs, setChannelPrefs] = useState({
    messages: true,
    tasks: true,
    meetings: true,
    admin: true,
  });
  const [uiTheme, setUiTheme] = useState<UiTheme>(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem("task-ui-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [reportSection, setReportSection] = useState<"insights" | "history" | "logs">("insights");
  const [meetingHistory, setMeetingHistory] = useState<MeetingHistoryEntry[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<Array<{
    id: string;
    user_id: string;
    channel: string;
    status: string;
    message_type: string | null;
    title: string | null;
    body: string | null;
    created_at: string;
    metadata: Record<string, unknown> | null;
  }>>([]);
  const [deliveryLogsLoading, setDeliveryLogsLoading] = useState(false);
  const [automationAiPrompt, setAutomationAiPrompt] = useState("");
  const [automationAiBusy, setAutomationAiBusy] = useState(false);
  const [automationAiResponse, setAutomationAiResponse] = useState("");
  const [automationAiError, setAutomationAiError] = useState<string | null>(null);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteEntry[]>([]);
  const [stickyDraft, setStickyDraft] = useState("");
  const [stickyColor, setStickyColor] = useState<StickyNoteEntry["color"]>("amber");
  const [showStickyPad, setShowStickyPad] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [meetingTaskConvertBusyById, setMeetingTaskConvertBusyById] = useState<Record<string, boolean>>({});
  // Meeting → Tasks assignee dialog
  const [meetingAssigneeDialog, setMeetingAssigneeDialog] = useState<{
    row: { id: string; roomName: string; actionItems: string[] };
    assignments: Record<number, string>; // index → userId
  } | null>(null);

  const showDebug = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return import.meta.env.DEV && params.get("debug") === "1";
  }, [location.search]);

  // Web push readiness (derived from env — same logic as useNotifications.ts)
  const webPushConfigured = Boolean((import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim());

  // Throttle ref so runAutomationEngine doesn't fire more than once per minute
  const lastAutomationRunAt = useRef<number>(0);
  const openCreateQueryHandledRef = useRef(false);

  // Wrappers matching old names used in Settings JSX
  const handleEnableNotifications = enablePushNotifications;
  const handleSendTestNotification = sendTestPushNotification;
  const handleSendReminderPush = sendReminderPushNotifications;

  const runAutomationAiCopilot = useCallback(async () => {
    const prompt = automationAiPrompt.trim();
    if (!prompt) {
      toast.message("Enter an automation goal first.");
      return;
    }
    if (!session?.access_token) {
      toast.error("Session expired. Please log in again.");
      return;
    }
    setAutomationAiBusy(true);
    setAutomationAiError(null);
    try {
      const now = new Date().toISOString();
      const context = [
        `time=${now}`,
        `total_tasks=${tasks.length}`,
        `total_institutions=${institutions.length}`,
        `pending_tasks=${tasks.filter((t) => t.status !== "completed").length}`,
        `overdue_tasks=${tasks.filter((t) => t.status !== "completed" && t.due_date && new Date(t.due_date).getTime() < Date.now()).length}`,
        `admin_module=${adminModule}`,
      ].join(", ");
      const response = await fetch("/api/ai/automation-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ prompt, context }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((payload as { error?: string })?.error || "Automation AI request failed.");
      }
      const text = (payload as { text?: string })?.text?.trim();
      if (!text) throw new Error("AI returned an empty response.");
      setAutomationAiResponse(text);
      toast.success("Automation suggestions ready.");
    } catch (error: unknown) {
      const message = getErrorMessage(error, "Failed to generate automation suggestions.");
      setAutomationAiError(message);
      toast.error(message);
    } finally {
      setAutomationAiBusy(false);
    }
  }, [adminModule, automationAiPrompt, institutions, session?.access_token, tasks]);

  // ── Task incomplete / overdue handler ──────────────────────────────────────
  const handleTaskIncomplete = useCallback(async (payload: IncompletePayload) => {
    if (!incompleteTask) return;
    const taskId = incompleteTask.id;
    const todayIso = new Date().toISOString().slice(0, 10);

    const patch: Record<string, unknown> = {
      remarks: [incompleteTask.remarks, payload.reasonDetail].filter(Boolean).join(" | ") || null,
      blockers: payload.reason,
      updated_at: new Date().toISOString(),
    };

    if (payload.action === "reschedule") {
      patch.due_date = payload.newDueDate;
      patch.status = "in_progress";
    } else if (payload.action === "reassign") {
      patch.user_id = payload.reassignToUserId;
      patch.due_date = incompleteTask.due_date;
      patch.status = "pending";
    } else if (payload.action === "escalate") {
      patch.status = "blocked";
      patch.priority = "urgent";
    } else if (payload.action === "cancel") {
      patch.status = "cancelled";
      patch.completed_at = todayIso;
    }

    await queueOrRunTaskMutation({ actionType: "update_task", entityId: taskId, payload: patch });

    const reasonLabel = payload.reasonDetail
      ? `${payload.reason}: ${payload.reasonDetail}`
      : payload.reason;
    void logActivityEvent?.({
      actorUserId: officeUser.id,
      eventType: "task_incomplete",
      eventSummary: `Task "${incompleteTask.task_title}" marked incomplete — ${reasonLabel}. Action: ${payload.action}`,
      visitTaskId: taskId,
    });

    const actionMsg: Record<IncompletePayload["action"], string> = {
      reschedule: `Rescheduled to ${payload.newDueDate ?? "new date"}`,
      reassign: `Transferred to ${payload.reassignToUserName ?? "team member"}`,
      escalate: "Escalated to admin",
      cancel: "Task cancelled",
      save_reason: "Reason saved",
    };
    toast.success(actionMsg[payload.action]);
    setIncompleteTask(null);
  }, [incompleteTask, logActivityEvent, officeUser, queueOrRunTaskMutation]);

  const handleMeetingSessionSaved = useCallback(async (sessionPayload: {
    roomCode: string;
    roomName: string;
    hostName: string;
    startedAt: string;
    endedAt: string;
    durationSeconds: number;
    participantPeak: number;
    transcript: string;
    summary: string;
    actionItems: string[];
    decisions: string[];
  }) => {
    if (!officeUser) return;
    let finalSummary = sessionPayload.summary;
    let finalActionItems = sessionPayload.actionItems;
    let finalDecisions = sessionPayload.decisions;

    if (session?.access_token && sessionPayload.transcript.trim()) {
      try {
        const response = await fetch("/api/ai/meeting-intelligence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            transcript: sessionPayload.transcript,
            roomName: sessionPayload.roomName,
            durationSeconds: sessionPayload.durationSeconds,
            participantPeak: sessionPayload.participantPeak,
          }),
        });
        const payload = await response.json().catch(() => ({}));
        if (response.ok) {
          const aiSummary = String((payload as { summary?: string }).summary || "").trim();
          const aiActions = Array.isArray((payload as { actionItems?: unknown[] }).actionItems)
            ? ((payload as { actionItems?: unknown[] }).actionItems || []).map((item) => String(item).trim()).filter(Boolean)
            : [];
          const aiDecisions = Array.isArray((payload as { decisions?: unknown[] }).decisions)
            ? ((payload as { decisions?: unknown[] }).decisions || []).map((item) => String(item).trim()).filter(Boolean)
            : [];
          if (aiSummary) finalSummary = aiSummary;
          if (aiActions.length) finalActionItems = aiActions;
          if (aiDecisions.length) finalDecisions = aiDecisions;
        }
      } catch {
        // keep fallback heuristics if AI call fails
      }
    }

    const record: MeetingHistoryEntry = {
      id: `${Date.now()}-${sessionPayload.roomCode}`,
      ...sessionPayload,
      summary: finalSummary,
      actionItems: finalActionItems,
      decisions: finalDecisions,
    };
    setMeetingHistory((prev) => {
      const next = [record, ...prev].slice(0, 120);
      try {
        window.localStorage.setItem(`${MEETING_HISTORY_STORAGE_KEY}-${officeUser.id}`, JSON.stringify(next));
      } catch {
        // ignore storage failures
      }
      return next;
    });

    await logActivityEvent({
      eventType: "meeting_session_logged",
      summary: `Meeting logged: ${sessionPayload.roomName} (${Math.max(1, Math.round(sessionPayload.durationSeconds / 60))} min)`,
      metadata: {
        room_code: sessionPayload.roomCode,
        room_name: sessionPayload.roomName,
        host_name: sessionPayload.hostName,
        started_at: sessionPayload.startedAt,
        ended_at: sessionPayload.endedAt,
        duration_seconds: sessionPayload.durationSeconds,
        participant_peak: sessionPayload.participantPeak,
        transcript: sessionPayload.transcript,
        summary: finalSummary,
        action_items: finalActionItems,
        decisions: finalDecisions,
      },
    });
  }, [logActivityEvent, officeUser, session?.access_token]);

  const persistStickyNotes = useCallback((notes: StickyNoteEntry[]) => {
    if (!officeUser) return;
    try {
      window.localStorage.setItem(`${STICKY_NOTES_STORAGE_KEY}-${officeUser.id}`, JSON.stringify(notes.slice(0, 24)));
    } catch {
      // ignore storage failures
    }
  }, [officeUser]);

  const addStickyNote = useCallback(() => {
    const body = stickyDraft.trim();
    if (!body) {
      toast.message("Write something before adding a sticky note.");
      return;
    }
    const note: StickyNoteEntry = {
      id: `note-${Date.now()}`,
      body,
      color: stickyColor,
      updatedAt: new Date().toISOString(),
    };
    setStickyNotes((prev) => {
      const next = [note, ...prev].slice(0, 24);
      persistStickyNotes(next);
      return next;
    });
    setStickyDraft("");
    toast.success("Sticky note added.");
  }, [persistStickyNotes, stickyColor, stickyDraft]);

  const deleteStickyNote = useCallback((noteId: string) => {
    setStickyNotes((prev) => {
      const next = prev.filter((note) => note.id !== noteId);
      persistStickyNotes(next);
      return next;
    });
  }, [persistStickyNotes]);

  useEffect(() => {
    if (!officeUser?.id) return;
    let alive = true;
    const loadAutomationSettings = async () => {
      try {
        const localRaw = localStorage.getItem(`automation-settings-${officeUser.id}`);
        if (localRaw) {
          const parsed = JSON.parse(localRaw) as Partial<AutomationSettings>;
          if (alive && parsed && typeof parsed === "object") {
            setAutomationSettings((prev) => ({ ...prev, ...parsed }));
          }
        }
      } catch {
        // Ignore malformed local settings.
      }

      try {
        const { data, error } = await supabase
          .from("automation_settings")
          .select("value")
          .eq("key", "meeting_visibility")
          .maybeSingle();
        if (error) throw error;
        const value = data?.value;
        if (alive && value && typeof value === "object") {
          const enabled = Boolean((value as Record<string, unknown>).public_team_ongoing_meetings);
          setAutomationSettings((prev) => ({ ...prev, public_team_ongoing_meetings: enabled }));
        }
      } catch {
        // Ignore if automation_settings table/migration is unavailable.
      }
    };

    void loadAutomationSettings();
    return () => {
      alive = false;
    };
  }, [officeUser?.id, setAutomationSettings]);

  // Persist automationSettings to localStorage and DB-backed controls when available.
  const saveAutomationSettings = useCallback(() => {
    try {
      localStorage.setItem(`automation-settings-${officeUser?.id}`, JSON.stringify(automationSettings));
    } catch {
      toast.error("Could not save settings.");
      return;
    }

    // The legacy automation_settings.meeting_visibility config now lives
    // in the CRM's PUBLIC_TEAM_ONGOING_MEETINGS env var (see
    // api/meetings/list.ts). The toggle persists locally and is
    // informational only on the client.
    toast.success("Automation settings saved.");
  }, [automationSettings, officeUser?.id]);

  // Helpers for the Create-form institution & brand details
  // createInstitutionForTask only uses task.id — pass a minimal stub for the draft key
  const createInstitutionForDraft = useCallback(
    () => createInstitutionForTask?.({ id: "__draft__" } as import("@/types/taskManager").OfficeTask),
    [createInstitutionForTask],
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateDraftBrandDetails = useCallback(
    (updater: (prev: Record<string, any>) => Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTaskDraft((prev) => ({ ...prev, brandDetails: updater((prev.brandDetails ?? {}) as Record<string, any>) }));
    },
    [setTaskDraft],
  );

  const isMessengerSection = activeSection.startsWith("messenger_");

  const loadDesktopNotificationHistory = useCallback(async () => {
    if (!desktopRuntime || !window.desktopAPI) return;
    try {
      const history = await window.desktopAPI.getNotificationHistory();
      setDesktopNotificationHistory(Array.isArray(history) ? history : []);
    } catch {
      setDesktopNotificationHistory([]);
    }
  }, [desktopRuntime]);

  const loadDesktopHealthState = useCallback(async () => {
    if (!desktopRuntime || !window.desktopAPI?.getHealth) return;
    try {
      const health = await window.desktopAPI.getHealth();
      setDesktopHealthState((health && typeof health === "object") ? health : null);
    } catch {
      setDesktopHealthState(null);
    }
  }, [desktopRuntime]);

  const updateDesktopSettings = useCallback(
    async (patch: Partial<typeof desktopSettings>) => {
      if (!desktopRuntime || !window.desktopAPI) return;
      try {
        setDesktopSettingsSaving(true);
        const next = await window.desktopAPI.updateSettings(patch);
        setDesktopSettings((prev) => ({ ...prev, ...(next as typeof desktopSettings) }));
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to update desktop settings."));
      } finally {
        setDesktopSettingsSaving(false);
      }
    },
    [desktopRuntime, desktopSettings],
  );

  useEffect(() => {
    if (!desktopRuntime || !window.desktopAPI) return;
    let mounted = true;
    const bootstrapDesktopData = async () => {
      try {
        const [settings, launchOnStartup, updateState] = await Promise.all([
          getDesktopSettings(),
          window.desktopAPI!.getLaunchOnStartup(),
          window.desktopAPI!.getUpdateState(),
        ]);
        if (!mounted) return;
        if (settings) {
          setDesktopSettings((prev) => ({
            ...prev,
            ...(settings as typeof prev),
            launchOnStartup: Boolean(launchOnStartup ?? (settings as { launchOnStartup?: boolean }).launchOnStartup),
          }));
        }
        setDesktopUpdateState(updateState as DesktopUpdateState);
      } catch {
        // Best-effort desktop bootstrap only
      }
      await loadDesktopNotificationHistory();
      await loadDesktopHealthState();
    };
    void bootstrapDesktopData();
    const offUpdate = window.desktopAPI.onUpdateState((payload) => {
      setDesktopUpdateState(payload);
    });
    return () => {
      mounted = false;
      offUpdate();
    };
  }, [desktopRuntime, loadDesktopHealthState, loadDesktopNotificationHistory]);

  // Android APK update check — runs once after login on native platform
  useEffect(() => {
    if (!officeUser || !isNative()) return;
    checkAndroidUpdate().then((info) => {
      if (info.available) setAndroidUpdate(info);
    }).catch(() => undefined);
  }, [officeUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("task-ui-theme", uiTheme);
  }, [uiTheme]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (desktopSettings.dndUntil) window.localStorage.setItem(DND_STORAGE_KEY, desktopSettings.dndUntil);
    else window.localStorage.removeItem(DND_STORAGE_KEY);
  }, [desktopSettings.dndUntil]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(QUIET_HOURS_ENABLED_KEY, quietHoursEnabled ? "1" : "0");
    window.localStorage.setItem(QUIET_HOURS_START_KEY, desktopSettings.quietHoursStart || "22:00");
    window.localStorage.setItem(QUIET_HOURS_END_KEY, desktopSettings.quietHoursEnd || "07:00");
  }, [quietHoursEnabled, desktopSettings.quietHoursStart, desktopSettings.quietHoursEnd]);

  useEffect(() => {
    if (!desktopRuntime) return;
    setQuietHoursEnabled(Boolean(desktopSettings.quietHoursEnabled));
  }, [desktopRuntime, desktopSettings.quietHoursEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setChannelPrefs({
      messages: window.localStorage.getItem("task-notification-channel-messages") !== "0",
      tasks: window.localStorage.getItem("task-notification-channel-tasks") !== "0",
      meetings: window.localStorage.getItem("task-notification-channel-meetings") !== "0",
      admin: window.localStorage.getItem("task-notification-channel-admin") !== "0",
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("task-notification-channel-messages", channelPrefs.messages ? "1" : "0");
    window.localStorage.setItem("task-notification-channel-tasks", channelPrefs.tasks ? "1" : "0");
    window.localStorage.setItem("task-notification-channel-meetings", channelPrefs.meetings ? "1" : "0");
    window.localStorage.setItem("task-notification-channel-admin", channelPrefs.admin ? "1" : "0");
  }, [channelPrefs]);

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.pathname === "/messenger/inbox") {
      setActiveSection("messenger_inbox");
      setShowForm(false);
      return;
    }
    if (location.pathname === "/messenger/teams") {
      setActiveSection("messenger_teams");
      setShowForm(false);
      return;
    }
    if (location.pathname === "/messenger/announcements") {
      setActiveSection("messenger_announcements");
      setShowForm(false);
      return;
    }
    if (location.pathname === "/messenger/directory") {
      setActiveSection("messenger_directory");
      setShowForm(false);
      return;
    }
    if (location.pathname.startsWith("/meeting/join/")) {
      const code = location.pathname.split("/").pop()?.toUpperCase() || null;
      if (code && code.length === 6) {
        // Persist across login redirect
        sessionStorage.setItem("pendingMeetingCode", code);
        setMeetingJoinCode(code);
        setActiveSection("meeting");
        setShowForm(false);
      }
      return;
    }
    if (location.pathname.startsWith("/messenger/chat/")) {
      if (!["messenger_inbox", "messenger_teams", "messenger_announcements", "messenger_directory"].includes(activeSection)) {
        setActiveSection("messenger_inbox");
      }
      setShowForm(false);
      const routeConversationId = location.pathname.split("/").pop() || null;
      if (routeConversationId) setMessengerConversationId(routeConversationId);
      return;
    }
    if (location.pathname === "/task/tasks") {
      if (params.get("openCreate") === "1") {
        setActiveSection("create");
        setShowForm(true);
        return;
      }
      setActiveSection("tasks");
      setShowForm(false);
      return;
    }
    if (location.pathname === "/task/journey") {
      setActiveSection("journey");
      setAdminModule("journey");
      setShowForm(false);
      return;
    }
    if (location.pathname === "/task/admin/institutions" || location.pathname === "/task/institutions") {
      setActiveSection("institutions");
      const institutionFromQuery = params.get("institution");
      if (institutionFromQuery) setSelectedInstitutionId(institutionFromQuery);
      return;
    }
    if (location.pathname === "/admin/dashboard") {
      setActiveSection("dashboard");
      const moduleParam = params.get("module");
      if (moduleParam && ["overview", "pipeline", "journey", "tasks", "team", "reports"].includes(moduleParam)) {
        setAdminModule(moduleParam as AdminModule);
      }
      setShowForm(false);
      return;
    }
    if (location.pathname === "/task/app" || location.pathname === "/task/overview") {
      const section = params.get("section");
      if (section === "meeting") {
        setActiveSection("meeting");
        setShowForm(false);
        return;
      }
      if (section === "chat") {
        setActiveSection("messenger_inbox");
        setShowForm(false);
        return;
      }
      setActiveSection("dashboard");
      setShowForm(false);
      return;
    }
    if (location.pathname === "/admin/settings/automation") {
      setActiveSection("settings");
      setShowForm(false);
      return;
    }
    if (location.pathname === "/admin/users") {
      setActiveSection("user_management");
      setShowForm(false);
      return;
    }
    if (location.pathname.startsWith("/admin/employees/")) {
      setActiveSection("dashboard");
      setAdminModule("team");
      setShowForm(false);
      const routeEmployeeId = location.pathname.split("/").pop() || null;
      if (routeEmployeeId) setSelectedEmployeeId(routeEmployeeId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!officeUser) return;
    try {
      const raw = window.localStorage.getItem(`${MEETING_HISTORY_STORAGE_KEY}-${officeUser.id}`);
      if (!raw) {
        setMeetingHistory([]);
        return;
      }
      const parsed = JSON.parse(raw) as MeetingHistoryEntry[];
      setMeetingHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setMeetingHistory([]);
    }
  }, [officeUser?.id]);

  // Wire FCM push on native Android after login
  useEffect(() => {
    if (!officeUser?.id || !isNative()) return;
    enablePush((title, body) => toast(body, { description: title }))
      .then(({ provider }) => console.log(`[push] enabled via ${provider}`))
      .catch((err) => console.warn("[push] setup failed:", err));
  }, [officeUser?.id]);

  // On Android: refresh Supabase session when the app returns from background
  // This prevents the "session expired" auto-logout that happens when the OS
  // suspends the app and the JWT expires while backgrounded.
  useEffect(() => {
    if (!isNative()) return;
    let cleanup: (() => void) | undefined;
    import("@capacitor/app").then(({ App }) => {
      const handle = App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) {
          // Actively refresh the JWT so the user stays logged in after long backgrounds
          void supabase.auth.refreshSession().then(({ data }) => {
            if (data.session && officeUser) {
              // Re-sync profile draft from localStorage in case avatar/phone was saved
              const extKey = `profile-ext-${officeUser.id}`;
              try {
                const ext = JSON.parse(localStorage.getItem(extKey) ?? "{}") as Record<string, string>;
                if (ext.avatarUrl || ext.phone) {
                  setProfileDraft((prev) => ({
                    ...prev,
                    avatarUrl: ext.avatarUrl || prev.avatarUrl,
                    phone: ext.phone || prev.phone,
                    bio: ext.bio || prev.bio,
                    statusMessage: ext.statusMessage || prev.statusMessage,
                    linkedin: ext.linkedin || prev.linkedin,
                  }));
                }
              } catch { /* ignore */ }
            }
          }).catch(() => undefined);
        }
      });
      // handle is a Promise<PluginListenerHandle> — resolve and store remove fn
      void handle.then((h) => { cleanup = () => void h.remove(); });
    }).catch(() => undefined);
    return () => { cleanup?.(); };
  }, []);

  useEffect(() => {
    if (!officeUser) return;
    try {
      const raw = window.localStorage.getItem(`${STICKY_NOTES_STORAGE_KEY}-${officeUser.id}`);
      if (!raw) {
        setStickyNotes([]);
        return;
      }
      const parsed = JSON.parse(raw) as StickyNoteEntry[];
      setStickyNotes(Array.isArray(parsed) ? parsed.slice(0, 24) : []);
    } catch {
      setStickyNotes([]);
    }
  }, [officeUser?.id]);

  useEffect(() => {
    if (!officeUser || officeUser.role !== "admin") return;
    let cancelled = false;
    const loadDeliveryLogs = async () => {
      setDeliveryLogsLoading(true);
      try {
        const { data, error } = await supabase
          .from("notification_delivery_log")
          .select("id,user_id,channel,status,title,body,created_at,metadata")
          .order("created_at", { ascending: false })
          .limit(120);
        if (cancelled) return;
        if (error) {
          setDeliveryLogs([]);
          return;
        }
        setDeliveryLogs(
          ((data || []) as Array<Record<string, unknown>>).map((row) => ({
            id: String(row.id || ""),
            user_id: String(row.user_id || ""),
            channel: String(row.channel || "in_app"),
            status: String(row.status || "unknown"),
            message_type: row.message_type != null ? String(row.message_type) : null,
            title: row.title ? String(row.title) : null,
            body: row.body ? String(row.body) : null,
            created_at: String(row.created_at || ""),
            metadata: (row.metadata as Record<string, unknown> | null) ?? null,
          })),
        );
      } catch {
        if (!cancelled) setDeliveryLogs([]);
      } finally {
        if (!cancelled) setDeliveryLogsLoading(false);
      }
    };
    void loadDeliveryLogs();
    return () => {
      cancelled = true;
    };
  }, [officeUser]);

  // Auto-save task draft to localStorage so partial forms survive navigation
  useEffect(() => {
    if (!officeUser || !showForm) return;
    try {
      localStorage.setItem(`task-draft-${officeUser.id}`, JSON.stringify(taskDraft));
    } catch { /* ignore */ }
  }, [taskDraft, showForm, officeUser]);

  // Restore draft on mount if user was mid-form
  useEffect(() => {
    if (!officeUser) return;
    try {
      const raw = localStorage.getItem(`task-draft-${officeUser.id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as typeof taskDraft;
        if (parsed?.taskTitle?.trim() || parsed?.institutionName?.trim()) {
          setTaskDraft((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officeUser?.id]);

  useEffect(() => {
    if (adminModule !== "reports") return;
    setReportSection("insights");
  }, [adminModule]);

  useEffect(() => {
    if (!officeUser) return;
    const settingsKey = `task-settings-${officeUser.id}`;
    const commentsKey = `task-comments-${officeUser.id}`;
    const filtersKey = `task-filters-${officeUser.id}`;
    const settingsRaw = localStorage.getItem(settingsKey);
    const commentsRaw = localStorage.getItem(commentsKey);
    const filtersRaw = localStorage.getItem(filtersKey);
    if (settingsRaw) {
      try {
        setNotifSettings(JSON.parse(settingsRaw));
      } catch {
        // ignore
      }
    }
    if (commentsRaw) {
      try {
        setCommentsByTask(JSON.parse(commentsRaw));
      } catch {
        // ignore
      }
    }
    if (filtersRaw && officeUser.role === "admin") {
      try {
        const parsed = JSON.parse(filtersRaw) as {
          employee?: string;
          status?: Status | "all";
          type?: TaskType | "all";
          priority?: Priority | "all";
          date?: string;
          brand?: VisitBrand | "all";
          outcome?: VisitOutcome | "all";
          followUpStatus?: FollowUpStatus | "all";
          followUpDate?: string;
          programInterest?: string | "all";
          interestLevel?: InterestLevel | "all";
          discussionStage?: string | "all";
          scope?: "my" | "team";
        };
        if (parsed.employee) setAdminEmployeeFilter(parsed.employee);
        if (parsed.status) setAdminStatusFilter(parsed.status);
        if (parsed.type) setAdminTypeFilter(parsed.type);
        if (parsed.priority) setAdminPriorityFilter(parsed.priority);
        if (parsed.date !== undefined) setAdminDateFilter(parsed.date);
        if (parsed.brand) setAdminBrandFilter(parsed.brand);
        if (parsed.outcome) setAdminOutcomeFilter(parsed.outcome);
        if (parsed.followUpStatus) setAdminFollowUpStatusFilter(parsed.followUpStatus);
        if (parsed.followUpDate !== undefined) setAdminFollowUpDateFilter(parsed.followUpDate);
        if (parsed.programInterest) setAdminProgramInterestFilter(parsed.programInterest);
        if (parsed.interestLevel) setAdminInterestLevelFilter(parsed.interestLevel);
        if (parsed.discussionStage) setAdminDiscussionStageFilter(parsed.discussionStage);
        if (parsed.scope) setTaskScope(parsed.scope);
      } catch {
        // ignore
      }
    }
    if (officeUser.role === "employee") {
      setTaskScope("my");
    }
  }, [officeUser]);

  const logout = async () => {
    try {
      await withUiTimeout(
        supabase.auth.signOut({ scope: "global" }),
        4000,
        "Timed out while signing out globally.",
      );
    } catch {
      // continue to local cleanup
    }
    try {
      await withUiTimeout(
        supabase.auth.signOut({ scope: "local" }),
        3000,
        "Timed out while signing out locally.",
      );
    } catch {
      // continue to local cleanup
    }
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith("sb-")) keysToRemove.push(key);
      }
      keysToRemove.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // ignore storage cleanup errors
    }
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i += 1) {
        const key = window.sessionStorage.key(i);
        if (key && key.startsWith("sb-")) keysToRemove.push(key);
      }
      keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
    } catch {
      // ignore storage cleanup errors
    }
    // Auth state change will trigger officeUser -> null which clears data
    navigate("/task", { replace: true });
    window.setTimeout(() => {
      window.location.assign("/task");
    }, 50);
  };

  // ── Global search + shortcuts modal keyboard shortcuts ─────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const inInput = tag === "input" || tag === "textarea" || tag === "select";
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setGlobalSearchOpen((v) => !v);
      }
      if (e.key === "?" && !inInput && !e.ctrlKey && !e.metaKey) {
        setShowShortcutsModal((v) => !v);
      }
      if (e.key === "Escape") {
        setGlobalSearchOpen(false);
        setShowShortcutsModal(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Desktop badge count sync (unread notifications → tray/taskbar) ───────
  useEffect(() => {
    if (!desktopRuntime) return;
    void setDesktopBadge(unreadNotificationCount);
  }, [desktopRuntime, unreadNotificationCount]);

  // ── Desktop zoom change listener ─────────────────────────────────────────
  useEffect(() => {
    if (!desktopRuntime) return undefined;
    const off = window.desktopAPI!.onZoomChanged(({ zoomFactor }) => {
      setDesktopSettings((prev) => ({ ...prev, zoomFactor }));
    });
    return off;
  }, [desktopRuntime]);

  // ── Employee inactivity auto-logout (2 hours, admin exempt) ──────────────
  useEffect(() => {
    if (!officeUser || officeUser.role === "admin") return;
    const TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        toast.error("You were automatically logged out after 2 hours of inactivity.");
        void logout();
      }, TIMEOUT_MS);
    };
    const events = ["mousemove", "keydown", "pointerdown", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officeUser?.id, officeUser?.role]);

  // ── Restore pending meeting code after login redirect ──────────────────────
  useEffect(() => {
    if (!officeUser) return;
    const pending = sessionStorage.getItem("pendingMeetingCode");
    if (pending && pending.length === 6) {
      sessionStorage.removeItem("pendingMeetingCode");
      setMeetingJoinCode(pending);
      setActiveSection("meeting");
      setShowForm(false);
      navigate(`/meeting/join/${pending}`, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officeUser?.id]);

  const goToTaskHome = () => {
    if (!officeUser) return;
    if (officeUser.role === "admin") {
      setActiveSection("dashboard");
      setAdminModule("overview");
      setShowForm(false);
      navigate("/admin/dashboard", { replace: true });
      return;
    }
    // Home for employees = Overview dashboard (not Journey Plan). Journey Plan has
    // its own sidebar item; Home should consistently land on the Overview summary.
    setActiveSection("dashboard");
    setShowForm(false);
    navigate("/task/overview", { replace: true });
  };

  const openNotificationAction = (rawUrl: string) => {
    const trimmed = String(rawUrl || "").trim();
    if (!trimmed) return;

    let route = trimmed;
    try {
      if (/^https?:\/\//i.test(trimmed)) {
        const parsed = new URL(trimmed);
        route = `${parsed.pathname}${parsed.search || ""}${parsed.hash || ""}`;
      }
    } catch {
      route = trimmed;
    }

    if (route.includes("/meeting/join/")) {
      const meetCode = route.split("/").pop()?.toUpperCase();
      if (meetCode) {
        sessionStorage.setItem("pendingMeetingCode", meetCode);
        setMeetingJoinCode(meetCode);
        setActiveSection("meeting");
        setShowForm(false);
        navigate(`/meeting/join/${meetCode}`);
        return;
      }
    }
    if (route.includes("/messenger/")) {
      setActiveSection("messenger_inbox");
      setShowForm(false);
      navigate(route);
      return;
    }
    if (route.includes("/task/journey")) {
      setActiveSection("journey");
      setShowForm(false);
      navigate("/task/journey");
      return;
    }
    if (route.includes("/task/tasks")) {
      setActiveSection("tasks");
      setShowForm(false);
      navigate("/task/tasks");
      return;
    }
    if (route.includes("/admin/dashboard")) {
      setActiveSection("dashboard");
      setShowForm(false);
      navigate("/admin/dashboard");
      return;
    }
    navigate(route.startsWith("/") ? route : "/task/overview");
  };

  const refreshWorkspace = async () => {
    try {
      await raceWithTimeout(
        refreshTasks({ showLoading: false }),
        12000,
        "Workspace refresh timed out.",
      );
      toast.success("Workspace refreshed.");
    } catch {
      window.location.reload();
    }
  };

  const runOfficeUsersBackfillViaRpc = async () => {
    if (!officeUser || officeUser.role !== "admin") return;
    // The legacy run_backfill_office_users_from_tasks RPC is no longer
    // needed: the CRM keeps office_users authoritative on every login +
    // invite-accept. Trigger a manual refresh instead.
    setDataHealthActionBusy("rpc");
    try {
      await refreshTasks({ showLoading: false });
      setDataHealthCheckedAt(new Date().toISOString());
      toast.success("Data refresh complete.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Refresh failed."));
    } finally {
      setDataHealthActionBusy(null);
    }
  };

  const getTaskBrandDetails = (task: OfficeTask): BrandDetails => {
    const raw = task.brand_details;
    if (!raw || typeof raw !== "object") return {};
    return raw as BrandDetails;
  };

  const sanitizeBrandDetails = (brand: VisitBrand, details: BrandDetails): BrandDetails => {
    const base: BrandDetails = {
      program_interest: Array.isArray(details.program_interest) ? details.program_interest.slice(0, 3) : [],
      audience_type: details.audience_type || null,
      interest_level: (details.interest_level as InterestLevel | null) || null,
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
  };

  const summary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const list = visibleTasks;
    const todayTasks = list.filter((task) => task.assigned_date === today);
    return {
      today: todayTasks.length,
      ongoing: list.filter((task) => task.status === "ongoing").length,
      completedToday: todayTasks.filter((task) => task.status === "completed").length,
      delayed: list.filter((task) => task.status === "delayed").length,
      unplannedToday: todayTasks.filter((task) => task.task_type === "unplanned").length,
    };
  }, [visibleTasks]);

  const slaSummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const dueToday = visibleTasks.filter((t) => t.due_date === today && t.status !== "completed");
    const overdue = visibleTasks.filter((t) => t.due_date && t.due_date < today && t.status !== "completed");
    const atRisk = visibleTasks.filter((t) => t.status === "delayed");
    return {
      dueToday: dueToday.length,
      overdue: overdue.length,
      atRisk: atRisk.length,
    };
  }, [visibleTasks]);

  const followUpSummary = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const visitTasks = visibleTasks.filter((t) => t.task_category === "visit");
    return {
      pendingToday: visitTasks.filter((t) => t.follow_up_required && t.follow_up_status === "pending" && t.follow_up_date === today).length,
      overdue: visitTasks.filter((t) => t.follow_up_required && t.follow_up_status === "pending" && t.follow_up_date && t.follow_up_date < today).length,
      requiringFollowup: visitTasks.filter((t) => t.follow_up_required).length,
    };
  }, [visibleTasks]);

  const employeeDailyBrief = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const ownVisitTasks = visibleTasks.filter(
      (task) => task.task_category === "visit" && task.visit_status !== "rescheduled",
    );
    const plannedToday = ownVisitTasks.filter((task) => (task.visit_date || task.assigned_date) === today);
    const dueToday = ownVisitTasks.filter(
      (task) => task.follow_up_required && task.follow_up_status === "pending" && task.follow_up_date === today,
    );
    const overdue = ownVisitTasks.filter(
      (task) => task.follow_up_required && task.follow_up_status === "pending" && (task.follow_up_date || "") < today,
    );
    const needsAction = ownVisitTasks.find(
      (task) =>
        task.visit_status === "completed" &&
        (task.visit_outcome || []).some((outcome) =>
          ["interested", "need_proposal", "need_demo", "call_later", "revisit_required"].includes(outcome),
        ) &&
        !task.follow_up_required,
    );
    return {
      plannedToday: plannedToday.length,
      dueToday: dueToday.length,
      overdue: overdue.length,
      nextActionTask: needsAction ?? null,
    };
  }, [visibleTasks]);

  const journeyPlanner = useMemo(() => {
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    const visitTasksRaw = visibleTasks
      .filter((task) => task.task_category === "visit" && task.visit_status !== "rescheduled")
      .sort((a, b) => {
        const aDate = normalizeIsoDateInput(a.visit_date || a.assigned_date);
        const bDate = normalizeIsoDateInput(b.visit_date || b.assigned_date);
        return aDate.localeCompare(bDate);
      });

    // Journey UI should show one active row per institution+date.
    // If duplicates exist in data, keep the most advanced / most recently updated record.
    const dedupeRank = (task: OfficeTask) => {
      const stage = getJourneyStageIndex(task);
      const updated = new Date(task.updated_at || task.created_at || 0).getTime();
      const created = new Date(task.created_at || 0).getTime();
      return [stage, updated, created] as const;
    };

    const visitTasksByKey = new Map<string, OfficeTask>();
    for (const task of visitTasksRaw) {
      const dateKey = normalizeIsoDateInput(task.visit_date || task.assigned_date);
      const institutionKey =
        task.institution_id ||
        normalizeInstitutionName(task.institution_name || task.task_title || "") ||
        task.id;
      const key = `${institutionKey}__${dateKey}`;
      const existing = visitTasksByKey.get(key);
      if (!existing) {
        visitTasksByKey.set(key, task);
        continue;
      }
      const [stageA, updatedA, createdA] = dedupeRank(existing);
      const [stageB, updatedB, createdB] = dedupeRank(task);
      if (
        stageB > stageA ||
        (stageB === stageA && updatedB > updatedA) ||
        (stageB === stageA && updatedB === updatedA && createdB > createdA)
      ) {
        visitTasksByKey.set(key, task);
      }
    }

    const dedupedVisitTasks = Array.from(visitTasksByKey.values()).sort((a, b) => {
      const aDate = normalizeIsoDateInput(a.visit_date || a.assigned_date);
      const bDate = normalizeIsoDateInput(b.visit_date || b.assigned_date);
      if (aDate !== bDate) return aDate.localeCompare(bDate);
      return (a.institution_name || a.task_title || "").localeCompare(b.institution_name || b.task_title || "");
    });

    // If the same institution has a newer active visit date, suppress older stale rows.
    // This prevents "today + future date" duplicate schedule visibility for one institution.
    const institutionLatestActiveDate = new Map<string, string>();
    for (const task of dedupedVisitTasks) {
      const institutionKey =
        task.institution_id ||
        normalizeInstitutionName(task.institution_name || task.task_title || "") ||
        task.id;
      const dateKey = normalizeIsoDateInput(task.visit_date || task.assigned_date);
      const latest = institutionLatestActiveDate.get(institutionKey);
      if (!latest || dateKey > latest) institutionLatestActiveDate.set(institutionKey, dateKey);
    }

    const visitTasks = dedupedVisitTasks.filter((task) => {
      const institutionKey =
        task.institution_id ||
        normalizeInstitutionName(task.institution_name || task.task_title || "") ||
        task.id;
      const dateKey = normalizeIsoDateInput(task.visit_date || task.assigned_date);
      const latestDate = institutionLatestActiveDate.get(institutionKey);
      if (!latestDate || dateKey === latestDate) return true;

      const status = (task.visit_status || "planned") as string;
      const isClosed =
        task.status === "completed" ||
        status === "completed" ||
        status === "closed_lost";
      if (isClosed) return false;

      // Keep explicitly in-progress visits visible; hide stale/queued older schedules.
      const isInProgress =
        status === "reached" ||
        status === "in_meeting" ||
        Boolean(task.check_in_at || task.meeting_started_at);
      if (isInProgress) return true;

      return false;
    });

    const forDate = (dateIso: string) =>
      visitTasks.filter((task) => normalizeIsoDateInput(task.visit_date || task.assigned_date) === dateIso);

    const upcoming = visitTasks.filter((task) => {
      const d = normalizeIsoDateInput(task.visit_date || task.assigned_date);
      return d >= todayIso && task.status !== "completed" && task.visit_status !== "completed" && task.visit_status !== "closed_lost";
    });

    return {
      today: forDate(todayIso),
      tomorrow: forDate(tomorrowIso),
      selected: forDate(journeyDate),
      upcoming,
      all: visitTasks,
    };
  }, [visibleTasks, journeyDate]);

  const employeeHasJourneyAccess = useMemo(() => {
    return !!officeUser;
  }, [officeUser]);

  const employeeGeneralTasks = useMemo(
    () => visibleTasks.filter((task) => (task.task_category || "general") !== "visit"),
    [visibleTasks],
  );

  const totalMessengerUnread = useMemo(
    () => (messengerConversations || []).reduce((sum, c) => sum + (c.unread_count || 0), 0),
    [messengerConversations],
  );

  const employeeJourneyTasks = useMemo(
    () => visibleTasks.filter((task) => task.task_category === "visit"),
    [visibleTasks],
  );

  const filteredNotifications = useMemo(() => {
    const source = notifications || [];
    const bySeverity =
      severityFilter === "all" ? source : source.filter((item) => item.severity === severityFilter);
    const byFeed = bySeverity.filter((item) => {
      if (notificationFilter === "all") return true;
      if (notificationFilter === "unread") return !item.is_read;
      const normalizedType = String(item.type || "").toLowerCase();
      if (notificationFilter === "tasks") {
        return normalizedType.includes("task") || normalizedType.includes("follow_up") || normalizedType.includes("visit");
      }
      if (notificationFilter === "meetings") {
        return normalizedType.includes("meeting");
      }
      if (notificationFilter === "chat") {
        return normalizedType.includes("message") || normalizedType.includes("chat") || normalizedType.includes("mention");
      }
      if (notificationFilter === "admin") {
        return normalizedType.includes("admin");
      }
      return true;
    });
    return byFeed.slice(0, 40);
  }, [notificationFilter, notifications, severityFilter]);

  const brandInterestSummary = useMemo(() => {
    const visitTasks = visibleTasks.filter((t) => t.task_category === "visit");
    const hasInterest = (t: OfficeTask) => {
      const details = getTaskBrandDetails(t);
      return (details.program_interest || []).length > 0;
    };
    return {
      vivenciaInterested: visitTasks.filter((t) => t.visit_brand === "Vivencia" && hasInterest(t)).length,
      onrolInterested: visitTasks.filter((t) => t.visit_brand === "ONROL" && hasInterest(t)).length,
      highInterest: visitTasks.filter((t) => getTaskBrandDetails(t).interest_level === "high").length,
      proposalExpected: visitTasks.filter((t) => getTaskBrandDetails(t).discussion_stage === "proposal_expected").length,
    };
  }, [visibleTasks]);

  const calendarDays = useMemo(() => {
    const anchor = new Date(calendarAnchor);
    const day = anchor.getDay();
    const sunday = new Date(anchor);
    sunday.setDate(anchor.getDate() - day);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      return {
        key: iso,
        label: d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" }),
        date: iso,
        tasks: visibleTasks.filter((task) => task.assigned_date === iso),
      };
    });
  }, [calendarAnchor, visibleTasks]);

  const workloadByEmployee = useMemo(() => {
    return (teamMembers || [])
      .filter((u) => u.role === "employee")
      .map((member) => {
        const list = tasks.filter((t) => t.user_id === member.id);
        return {
          id: member.id,
          name: member.full_name,
          total: list.length,
          ongoing: list.filter((t) => t.status === "ongoing").length,
          delayed: list.filter((t) => t.status === "delayed").length,
          completed: list.filter((t) => t.status === "completed").length,
        };
      });
  }, [teamMembers, tasks]);

  const ganttRows = useMemo(() => {
    const rows = (visibleTasks || [])
      .filter((t) => t.assigned_date && t.due_date)
      .slice(0, 12)
      .map((t) => {
        const start = new Date(t.assigned_date);
        const end = new Date(t.due_date || t.assigned_date);
        return { task: t, start, end };
      });
    if (!rows.length) return { rows: [], min: null as Date | null, max: null as Date | null };
    const min = new Date(Math.min(...rows.map((r) => r.start.getTime())));
    const max = new Date(Math.max(...rows.map((r) => r.end.getTime())));
    return { rows, min, max };
  }, [visibleTasks]);

  const selectedEmployee = useMemo(
    () => teamMembers.find((member) => member.id === selectedEmployeeId) ?? null,
    [teamMembers, selectedEmployeeId],
  );
  const officeUserNameById = useMemo(() => {
    const entries = new Map<string, string>();
    for (const member of teamMembers) {
      if (member.id) entries.set(member.id, member.full_name || member.email || member.id);
    }
    for (const member of messengerDirectory) {
      if (member.id && !entries.has(member.id)) entries.set(member.id, member.full_name || member.email || member.id);
    }
    if (officeUser?.id) {
      entries.set(officeUser.id, officeUser.full_name || officeUser.email || officeUser.id);
    }
    return entries;
  }, [teamMembers, messengerDirectory, officeUser]);
  const getOfficeUserLabel = useCallback(
    (userId: string | null | undefined) => {
      if (!userId) return "Unknown";
      return officeUserNameById.get(userId) || `Unknown (${userId.slice(0, 8)})`;
    },
    [officeUserNameById],
  );
  const missingTaskOwnerIds = useMemo(() => {
    const knownIds = new Set(officeUserNameById.keys());
    return Array.from(
      new Set(
        (tasks || [])
          .map((task) => task.user_id)
          .filter((userId): userId is string => Boolean(userId && !knownIds.has(userId))),
      ),
    );
  }, [officeUserNameById, tasks]);
  const dataHealthBackfillSql = useMemo(() => {
    if (!missingTaskOwnerIds.length) return "";
    const ids = missingTaskOwnerIds.map((id) => `'${id}'::uuid`).join(",\n    ");
    return [
      "-- Backfill missing task owners into office_users",
      "insert into public.office_users (id, full_name, email, role, department, is_active)",
      "select",
      "  au.id,",
      "  coalesce(nullif(trim(au.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(au.email, ''), '@', 1), 'Employee') as full_name,",
      "  coalesce(lower(au.email), lower('unknown+' || au.id::text || '@onrol.local')) as email,",
      "  'employee' as role,",
      "  'Operations' as department,",
      "  true as is_active",
      "from auth.users au",
      `where au.id in (\n    ${ids}\n  )`,
      "on conflict (id) do update",
      "set",
      "  full_name = coalesce(nullif(public.office_users.full_name, ''), excluded.full_name),",
      "  email = coalesce(nullif(public.office_users.email, ''), excluded.email),",
      "  is_active = true;",
    ].join("\n");
  }, [missingTaskOwnerIds]);
  const selectedEmployeeTasks = useMemo(
    () => tasks.filter((task) => task.user_id === selectedEmployeeId),
    [tasks, selectedEmployeeId],
  );
  const filteredInstitutions = useMemo(() => {
    const filtered = institutions.filter((inst) => {
      if (adminInstitutionSearch.trim()) {
        const q = adminInstitutionSearch.trim().toLowerCase();
        if (
          !inst.name.toLowerCase().includes(q) &&
          !(inst.city || "").toLowerCase().includes(q) &&
          !(inst.area || "").toLowerCase().includes(q) &&
          !(inst.primary_contact_name || "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (adminInstitutionTypeFilter !== "all" && inst.institution_type !== adminInstitutionTypeFilter) return false;
      if (adminInstitutionCityFilter && (inst.city || "").toLowerCase() !== adminInstitutionCityFilter.toLowerCase()) return false;
      if (adminInstitutionBrandFilter !== "all" && inst.brand_relevance !== adminInstitutionBrandFilter) return false;
      if (adminInstitutionLeadStageFilter !== "all" && inst.current_lead_stage !== adminInstitutionLeadStageFilter) return false;
      if (adminInstitutionConversionFilter !== "all" && (inst.conversion_status || "not_converted") !== adminInstitutionConversionFilter) return false;
      if (adminInstitutionLeadScoreBand !== "all") {
        const score = Number(inst.lead_score ?? 0);
        if (adminInstitutionLeadScoreBand === "high" && score < 8) return false;
        if (adminInstitutionLeadScoreBand === "medium" && (score < 4 || score > 7)) return false;
        if (adminInstitutionLeadScoreBand === "low" && score > 3) return false;
      }
      return true;
    });
    const withVisits = filtered.map((inst) => ({
      inst,
      visits: tasks.filter((t) => t.task_category === "visit" && (t.institution_id === inst.id || t.institution_name === inst.name)).length,
    }));
    withVisits.sort((a, b) => {
      if (adminInstitutionSort === "name") return a.inst.name.localeCompare(b.inst.name);
      if (adminInstitutionSort === "city") return (a.inst.city || "").localeCompare(b.inst.city || "");
      if (adminInstitutionSort === "most_visits") return b.visits - a.visits;
      if (adminInstitutionSort === "last_visited") {
        const av = a.inst.last_visit_at ? new Date(a.inst.last_visit_at).getTime() : 0;
        const bv = b.inst.last_visit_at ? new Date(b.inst.last_visit_at).getTime() : 0;
        return bv - av;
      }
      const au = new Date(a.inst.updated_at).getTime();
      const bu = new Date(b.inst.updated_at).getTime();
      return bu - au;
    });
    return withVisits.map((x) => x.inst);
  }, [institutions, tasks, adminInstitutionSearch, adminInstitutionTypeFilter, adminInstitutionCityFilter, adminInstitutionBrandFilter, adminInstitutionLeadStageFilter, adminInstitutionConversionFilter, adminInstitutionLeadScoreBand, adminInstitutionSort]);

  const selectedDraftInstitution = useMemo(
    () =>
      institutions.find((inst) => inst.id === taskDraft.institutionId) ||
      institutions.find((inst) => normalizeInstitutionName(inst.name) === normalizeInstitutionName(taskDraft.institutionName || "")) ||
      null,
    [institutions, taskDraft.institutionId, taskDraft.institutionName],
  );

  const adminDateWindow = useMemo(() => {
    const today = new Date();
    const isoToday = today.toISOString().slice(0, 10);
    if (adminRangePreset === "all") return { from: "", to: "" };
    if (adminRangePreset === "today") return { from: isoToday, to: isoToday };
    if (adminRangePreset === "yesterday") {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      const iso = y.toISOString().slice(0, 10);
      return { from: iso, to: iso };
    }
    if (adminRangePreset === "this_week") {
      const d = new Date(today);
      const offset = d.getDay() === 0 ? 6 : d.getDay() - 1;
      d.setDate(today.getDate() - offset);
      return { from: d.toISOString().slice(0, 10), to: isoToday };
    }
    if (adminRangePreset === "this_month") {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: d.toISOString().slice(0, 10), to: isoToday };
    }
    return { from: adminRangeFrom || "", to: adminRangeTo || "" };
  }, [adminRangePreset, adminRangeFrom, adminRangeTo]);

  const dashboardTasks = useMemo(() => {
    if (!officeUser) return [];
    if (officeUser.role !== "admin") return visibleTasks || [];
    const institutionMap = new Map((institutions || []).map((inst) => [inst.id, inst]));
    return (tasks || []).filter((task) => {
      if (task.task_category !== "visit") return false;

      const assigned = task.visit_date || task.assigned_date;
      if (adminDateWindow.from && assigned < adminDateWindow.from) return false;
      if (adminDateWindow.to && assigned > adminDateWindow.to) return false;

      if (adminGlobalEmployee !== "all" && task.user_id !== adminGlobalEmployee) return false;
      if (adminGlobalBrand !== "all" && task.visit_brand !== adminGlobalBrand) return false;
      if (adminGlobalInstitutionType !== "all" && task.institution_type !== adminGlobalInstitutionType) return false;
      if (adminGlobalVisitStatus !== "all" && task.visit_status !== adminGlobalVisitStatus) return false;
      if (adminGlobalFollowUpStatus !== "all" && task.follow_up_status !== adminGlobalFollowUpStatus) return false;

      const linkedInstitution =
        (task.institution_id ? institutionMap.get(task.institution_id) : undefined) ||
        institutions.find((inst) => normalizeInstitutionName(inst.name) === normalizeInstitutionName(task.institution_name || ""));

      if (adminGlobalCity.trim()) {
        const city = (linkedInstitution?.city || task.check_in_city || "").toLowerCase();
        if (!city.includes(adminGlobalCity.trim().toLowerCase())) return false;
      }
      if (adminGlobalLeadStage !== "all" && (linkedInstitution?.current_lead_stage || "new_lead") !== adminGlobalLeadStage) {
        return false;
      }
      if (adminGlobalConversionStatus !== "all") {
        const conversionStatus = linkedInstitution?.conversion_status || "not_converted";
        if (conversionStatus !== adminGlobalConversionStatus) return false;
      }
      if (adminGlobalRevenueBand !== "all") {
        const value = Number(linkedInstitution?.final_value ?? linkedInstitution?.expected_value ?? 0);
        if (adminGlobalRevenueBand === "lt_100k" && !(value > 0 && value < 100000)) return false;
        if (adminGlobalRevenueBand === "100k_500k" && !(value >= 100000 && value <= 500000)) return false;
        if (adminGlobalRevenueBand === "gt_500k" && !(value > 500000)) return false;
      }
      if (adminGlobalLeadScoreBand !== "all") {
        const score = Number(linkedInstitution?.lead_score ?? 0);
        if (adminGlobalLeadScoreBand === "high" && score < 8) return false;
        if (adminGlobalLeadScoreBand === "medium" && (score < 4 || score > 7)) return false;
        if (adminGlobalLeadScoreBand === "low" && score > 3) return false;
      }
      return true;
    });
  }, [
    officeUser,
    visibleTasks,
    tasks,
    institutions,
    adminDateWindow,
    adminGlobalEmployee,
    adminGlobalBrand,
    adminGlobalInstitutionType,
    adminGlobalVisitStatus,
    adminGlobalFollowUpStatus,
    adminGlobalCity,
    adminGlobalLeadStage,
    adminGlobalConversionStatus,
    adminGlobalRevenueBand,
    adminGlobalLeadScoreBand,
  ]);

  const dashboardKpis = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const employees = new Set(dashboardTasks.map((task) => task.user_id));
    const institutionsSet = new Set(
      dashboardTasks.map((task) => task.institution_id || normalizeInstitutionName(task.institution_name || "")).filter(Boolean),
    );
    const completedVisits = dashboardTasks.filter((task) => task.visit_status === "completed" || task.visit_status === "closed_lost");
    const followPending = dashboardTasks.filter((task) => task.follow_up_required && task.follow_up_status === "pending");
    const followOverdue = followPending.filter((task) => (task.follow_up_date || "") < today);
    return {
      totalVisits: dashboardTasks.length,
      completedVisits: completedVisits.length,
      followPending: followPending.length,
      followOverdue: followOverdue.length,
      activeEmployeesToday: new Set(
        dashboardTasks
          .filter((task) => (task.updated_at || "").slice(0, 10) === today || (task.visit_date || task.assigned_date) === today)
          .map((task) => task.user_id),
      ).size,
      institutionsEngaged: institutionsSet.size,
      vivenciaVisits: dashboardTasks.filter((task) => task.visit_brand === "Vivencia").length,
      onrolVisits: dashboardTasks.filter((task) => task.visit_brand === "ONROL").length,
      highInterest: dashboardTasks.filter((task) => getTaskBrandDetails(task).interest_level === "high").length,
      proposalExpected: dashboardTasks.filter((task) => {
        const details = getTaskBrandDetails(task);
        return (task.visit_outcome || []).includes("need_proposal") || details.discussion_stage === "proposal_expected";
      }).length,
      demoExpected: dashboardTasks.filter((task) => {
        const details = getTaskBrandDetails(task);
        return (task.visit_outcome || []).includes("need_demo") || details.discussion_stage === "workshop_discussed";
      }).length,
      employeesTouched: employees.size,
    };
  }, [dashboardTasks]);

  const institutionIntelligenceRows = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const rows = (institutions || []).map((institution) => {
      const relatedTasks = (tasks || []).filter(
        (task) =>
          task.task_category === "visit" &&
          (task.institution_id === institution.id ||
            normalizeInstitutionName(task.institution_name || "") === normalizeInstitutionName(institution.name)),
      );
      const visitCount = relatedTasks.length;
      const completedCount = relatedTasks.filter((task) => task.visit_status === "completed").length;
      const proposalCount = relatedTasks.filter((task) => (task.visit_outcome || []).includes("need_proposal")).length;
      const demoCount = relatedTasks.filter((task) => (task.visit_outcome || []).includes("need_demo")).length;
      const followupPending = relatedTasks.filter(
        (task) => task.follow_up_required && task.follow_up_status === "pending",
      ).length;
      const overdueFollowups = relatedTasks.filter(
        (task) =>
          task.follow_up_required &&
          task.follow_up_status === "pending" &&
          task.follow_up_date &&
          task.follow_up_date < todayIso,
      ).length;
      const repeatedReschedules = relatedTasks.filter((task) => task.visit_status === "rescheduled").length;
      const highInterest = relatedTasks.some((task) => getTaskBrandDetails(task).interest_level === "high");
      const hasProposalStage =
        institution.current_lead_stage === "proposal_expected" ||
        institution.current_lead_stage === "proposal_sent" ||
        proposalCount > 0;
      const hasDemoStage = institution.current_lead_stage === "demo_scheduled" || demoCount > 0;
      const lastActivityAt = institution.last_visit_at || institution.updated_at;
      const lastActivityGapDays = Math.max(
        0,
        Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / (24 * 60 * 60 * 1000)),
      );
      const scoreFromSignals = Math.min(
        10,
        (highInterest ? 3 : 0) +
          (visitCount >= 3 ? 2 : 0) +
          (followupPending === 0 && visitCount > 0 ? 1 : 0) +
          (hasProposalStage ? 2 : 0) +
          (hasDemoStage ? 2 : 0),
      );
      const leadScore = Math.max(0, Math.min(10, Number(institution.lead_score ?? scoreFromSignals)));
      const leadScoreBand = leadScore >= 8 ? "high" : leadScore >= 4 ? "medium" : "low";

      const tags: Array<"high_potential" | "at_risk" | "stalled" | "fast_moving"> = [];
      if (leadScore >= 8 && institution.current_lead_stage !== "closed_won") tags.push("high_potential");
      if (overdueFollowups > 0 || repeatedReschedules >= 2 || (hasProposalStage && !hasDemoStage && lastActivityGapDays >= 3))
        tags.push("at_risk");
      if (visitCount >= 4 && institution.current_lead_stage !== "closed_won" && institution.current_lead_stage !== "closed_lost")
        tags.push("stalled");
      if (visitCount >= 2 && hasDemoStage && institution.current_lead_stage === "negotiation") tags.push("fast_moving");

      return {
        institution,
        relatedTasks,
        visitCount,
        completedCount,
        proposalCount,
        demoCount,
        followupPending,
        overdueFollowups,
        repeatedReschedules,
        highInterest,
        leadScore,
        leadScoreBand,
        lastActivityGapDays,
        tags,
      };
    });
    return rows;
  }, [institutions, tasks]);

  const conversionRevenueKpis = useMemo(() => {
    const converted = institutions.filter((institution) => institution.conversion_status === "converted");
    const totalInstitutions = Math.max(institutions.length, 1);
    const conversionRate = Math.round((converted.length / totalInstitutions) * 100);
    const expectedRevenue = institutions.reduce(
      (sum, institution) => sum + Number(institution.expected_value || 0),
      0,
    );
    const finalRevenue = institutions.reduce((sum, institution) => sum + Number(institution.final_value || 0), 0);
    const conversionValue = institutions.reduce(
      (sum, institution) => sum + Number(institution.conversion_value || 0),
      0,
    );
    const effectiveRevenue = finalRevenue || conversionValue;
    const highPotential = institutionIntelligenceRows.filter((row) => row.tags.includes("high_potential")).length;
    const atRisk = institutionIntelligenceRows.filter((row) => row.tags.includes("at_risk")).length;
    const stalled = institutionIntelligenceRows.filter((row) => row.tags.includes("stalled")).length;
    return {
      totalConversions: converted.length,
      conversionRate,
      expectedRevenue,
      effectiveRevenue,
      highPotential,
      atRisk,
      stalled,
    };
  }, [institutions, institutionIntelligenceRows]);

  const funnelMetrics = useMemo(() => {
    const byStage = (stages: LeadStage[]) =>
      institutions.filter((institution) => stages.includes(institution.current_lead_stage)).length;
    const visited = byStage(["visited", "interested", "followup_pending", "proposal_expected", "proposal_sent", "demo_scheduled", "negotiation", "closed_won", "closed_lost"]);
    const interested = byStage(["interested", "followup_pending", "proposal_expected", "proposal_sent", "demo_scheduled", "negotiation", "closed_won", "closed_lost"]);
    const proposal = byStage(["proposal_expected", "proposal_sent", "demo_scheduled", "negotiation", "closed_won", "closed_lost"]);
    const demo = byStage(["demo_scheduled", "negotiation", "closed_won", "closed_lost"]);
    const closed = byStage(["closed_won"]);
    const rows = [
      { label: "Visited", value: visited, rate: 100 },
      { label: "Interested", value: interested, rate: visited ? Math.round((interested / visited) * 100) : 0 },
      { label: "Proposal", value: proposal, rate: interested ? Math.round((proposal / interested) * 100) : 0 },
      { label: "Demo", value: demo, rate: proposal ? Math.round((demo / proposal) * 100) : 0 },
      { label: "Closed Won", value: closed, rate: demo ? Math.round((closed / demo) * 100) : 0 },
    ];
    return rows;
  }, [institutions]);

  const brandConversionPerformance = useMemo(() => {
    const summarize = (brand: VisitBrand) => {
      const brandTasks = dashboardTasks.filter((task) => task.visit_brand === brand);
      const brandInstIds = new Set(
        brandTasks.map((task) => task.institution_id || normalizeInstitutionName(task.institution_name || "")).filter(Boolean),
      );
      const brandInstitutions = institutions.filter((institution) => {
        const key = institution.id || normalizeInstitutionName(institution.name);
        const byRelevance =
          institution.brand_relevance === "both" ||
          institution.brand_relevance === (brand === "Vivencia" ? "vivencia" : "onrol");
        return brandInstIds.has(key) || byRelevance;
      });
      const conversions = brandInstitutions.filter((institution) => {
        if (institution.conversion_status === "converted") {
          if (!institution.conversion_brand) return true;
          return institution.conversion_brand === (brand === "Vivencia" ? "vivencia" : "onrol");
        }
        return false;
      }).length;
      const revenue = brandInstitutions.reduce(
        (sum, institution) =>
          sum +
          Number(
            institution.final_value ||
              institution.conversion_value ||
              institution.expected_value ||
              0,
          ),
        0,
      );
      const interested = brandTasks.filter((task) => (task.visit_outcome || []).includes("interested")).length;
      const proposals = brandTasks.filter((task) => (task.visit_outcome || []).includes("need_proposal")).length;
      const demos = brandTasks.filter((task) => (task.visit_outcome || []).includes("need_demo")).length;
      const conversionRate = brandInstitutions.length ? Math.round((conversions / brandInstitutions.length) * 100) : 0;
      return {
        brand,
        visits: brandTasks.length,
        interested,
        proposals,
        demos,
        conversions,
        conversionRate,
        revenue,
      };
    };
    return {
      vivencia: summarize("Vivencia"),
      onrol: summarize("ONROL"),
    };
  }, [dashboardTasks, institutions]);

  const avgTimeToConversionDays = useMemo(() => {
    const converted = institutions.filter(
      (institution) => institution.conversion_status === "converted" && institution.conversion_date && institution.created_at,
    );
    if (!converted.length) return 0;
    const totalDays = converted.reduce((sum, institution) => {
      const start = new Date(institution.created_at).getTime();
      const end = new Date(institution.conversion_date as string).getTime();
      const diff = Math.max(0, end - start);
      return sum + Math.round(diff / (24 * 60 * 60 * 1000));
    }, 0);
    return Math.round(totalDays / converted.length);
  }, [institutions]);

  const adminDailyDigest = useMemo(() => {
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayIso = yesterday.toISOString().slice(0, 10);

    const visitTasks = dashboardTasks.filter((task) => task.task_category === "visit");
    const completedToday = visitTasks.filter(
      (task) => task.visit_status === "completed" && (task.visit_date || task.assigned_date) === todayIso,
    ).length;
    const completedYesterday = visitTasks.filter(
      (task) => task.visit_status === "completed" && (task.visit_date || task.assigned_date) === yesterdayIso,
    ).length;
    const overdueFollowups = visitTasks.filter(
      (task) => task.follow_up_required && task.follow_up_status === "pending" && (task.follow_up_date || "") < todayIso,
    ).length;
    const highInterestInactive = institutions.filter((institution) => {
      if (!institution.last_visit_at) return false;
      const hasHighInterestVisit = visitTasks.some(
        (task) => task.institution_id === institution.id && getTaskBrandDetails(task).interest_level === "high",
      );
      if (!hasHighInterestVisit) return false;
      const cutoff = Date.now() - Number(automationSettings.high_interest_inactive_days || 3) * 24 * 60 * 60 * 1000;
      return new Date(institution.last_visit_at).getTime() < cutoff;
    }).length;
    const newInstitutions = (institutions || []).filter((institution) => institution.created_at.slice(0, 10) === todayIso).length;
    const inactiveEmployeeThresholdMs =
      Number(automationSettings.inactive_employee_days || 2) * 24 * 60 * 60 * 1000;
    const inactiveEmployees = (teamMembers || [])
      .filter((member) => member.role === "employee")
      .map((member) => {
        const latestTaskUpdate = (tasks || [])
          .filter((task) => task.user_id === member.id)
          .map((task) => new Date(task.updated_at).getTime())
          .sort((a, b) => b - a)[0];
        const latestEventUpdate = (activityEvents || [])
          .filter((event) => event.actor_user_id === member.id)
          .map((event) => new Date(event.created_at).getTime())
          .sort((a, b) => b - a)[0];
        return Math.max(latestTaskUpdate || 0, latestEventUpdate || 0);
      })
      .filter((lastActivity) => lastActivity > 0 && Date.now() - lastActivity > inactiveEmployeeThresholdMs).length;

    return {
      completedToday,
      completedYesterday,
      overdueFollowups,
      highInterestInactive,
      newInstitutions,
      inactiveEmployees,
      vivenciaVisits: dashboardKpis.vivenciaVisits,
      onrolVisits: dashboardKpis.onrolVisits,
    };
  }, [
    dashboardTasks,
    institutions,
    automationSettings.high_interest_inactive_days,
    automationSettings.inactive_employee_days,
    teamMembers,
    tasks,
    activityEvents,
    dashboardKpis.vivenciaVisits,
    dashboardKpis.onrolVisits,
  ]);

  const followUpControl = useMemo(() => {
    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    const pending = dashboardTasks.filter((task) => task.follow_up_required && task.follow_up_status === "pending");
    const scheduledVisitsTomorrow = dashboardTasks.filter((task) => {
      if ((task.task_category || "general") !== "visit") return false;
      if (
        task.status === "completed" ||
        task.visit_status === "completed" ||
        task.visit_status === "closed_lost" ||
        task.visit_status === "rescheduled"
      ) return false;
      const scheduledDate = normalizeIsoDateInput(task.visit_date || task.assigned_date);
      return scheduledDate === tomorrowIso;
    });
    return {
      dueToday: pending.filter((task) => task.follow_up_date === todayIso),
      overdue: pending.filter((task) => (task.follow_up_date || "") < todayIso),
      dueTomorrow: pending.filter((task) => task.follow_up_date === tomorrowIso),
      scheduledVisitsTomorrow,
      byEmployee: (teamMembers || [])
        .filter((member) => member.role === "employee")
        .map((member) => ({
          member,
          count: pending.filter((task) => task.user_id === member.id).length,
        }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count),
    };
  }, [dashboardTasks, teamMembers]);

  const employeePerformanceRows = useMemo(() => {
    const now = Date.now();
    return (teamMembers || [])
      .filter((member) => member.role === "employee")
      .map((member) => {
        const list = dashboardTasks.filter((task) => task.user_id === member.id);
        const handledInstitutionKeys = Array.from(
          new Set(
            list
              .map((task) => task.institution_id || normalizeInstitutionName(task.institution_name || ""))
              .filter(Boolean),
          ),
        );
        const handledInstitutions = institutions.filter((institution) => {
          const key = institution.id || normalizeInstitutionName(institution.name);
          return handledInstitutionKeys.includes(key);
        });
        const conversions = handledInstitutions.filter((institution) => institution.conversion_status === "converted").length;
        const revenue = handledInstitutions.reduce(
          (sum, institution) => sum + Number(institution.final_value || institution.conversion_value || institution.expected_value || 0),
          0,
        );
        const conversionRate = handledInstitutions.length ? Math.round((conversions / handledInstitutions.length) * 100) : 0;
        const lastActivityTs = Math.max(...list.map((task) => new Date(task.updated_at).getTime()), 0);
        const institutionsHandled = new Set(list.map((task) => task.institution_id || normalizeInstitutionName(task.institution_name || "")).filter(Boolean)).size;
        const state =
          lastActivityTs === 0
            ? "inactive"
            : now - lastActivityTs < 24 * 60 * 60 * 1000
              ? "active_today"
              : now - lastActivityTs < 3 * 24 * 60 * 60 * 1000
                ? "active_recently"
                : "inactive";
        return {
          member,
          visits: list.length,
          completed: list.filter((task) => task.visit_status === "completed" || task.visit_status === "closed_lost").length,
          followPending: list.filter((task) => task.follow_up_required && task.follow_up_status === "pending").length,
          overdue: list.filter((task) => task.follow_up_required && task.follow_up_status === "pending" && (task.follow_up_date || "") < new Date().toISOString().slice(0, 10)).length,
          institutionsHandled,
          interested: list.filter((task) => (task.visit_outcome || []).includes("interested")).length,
          proposals: list.filter((task) => (task.visit_outcome || []).includes("need_proposal")).length,
          demos: list.filter((task) => (task.visit_outcome || []).includes("need_demo")).length,
          conversions,
          conversionRate,
          revenue,
          vivencia: list.filter((task) => task.visit_brand === "Vivencia").length,
          onrol: list.filter((task) => task.visit_brand === "ONROL").length,
          lastActivityTs,
          state,
        };
      })
      .sort((a, b) => b.visits - a.visits);
  }, [teamMembers, dashboardTasks, institutions]);

  const pipelineByStage = useMemo(() => {
    const stageOrder: LeadStage[] = [
      "new_lead",
      "contacted",
      "visited",
      "interested",
      "followup_pending",
      "proposal_expected",
      "proposal_sent",
      "demo_scheduled",
      "negotiation",
      "closed_won",
      "closed_lost",
    ];
    return stageOrder.map((stage) => {
      const stageInstitutions = (institutions || []).filter((inst) => inst.current_lead_stage === stage);
      return {
        stage,
        count: stageInstitutions.length,
        sample: stageInstitutions.slice(0, 3),
      };
    });
  }, [institutions]);

  const attentionAlerts = useMemo(() => {
    const alerts: Array<{ key: string; label: string; severity: "high" | "medium" | "low"; count: number; onClick?: () => void }> = [];
    const today = new Date().toISOString().slice(0, 10);
    const overdue = dashboardTasks.filter((task) => task.follow_up_required && task.follow_up_status === "pending" && (task.follow_up_date || "") < today);
    if (overdue.length) alerts.push({ key: "overdue", label: "Overdue follow-ups", severity: "high", count: overdue.length });
    const stalled = institutions.filter((inst) => {
      if (!inst.last_visit_at) return false;
      const diff = Date.now() - new Date(inst.last_visit_at).getTime();
      return diff > 7 * 24 * 60 * 60 * 1000 && inst.current_lead_stage !== "closed_won" && inst.current_lead_stage !== "closed_lost";
    });
    if (stalled.length) alerts.push({ key: "stalled", label: "Stalled institutions (7+ days)", severity: "medium", count: stalled.length });
    const highInterestNoFollowup = dashboardTasks.filter((task) => {
      const details = getTaskBrandDetails(task);
      return details.interest_level === "high" && !task.follow_up_required;
    });
    if (highInterestNoFollowup.length) alerts.push({ key: "high_interest", label: "High-interest visits without follow-up", severity: "high", count: highInterestNoFollowup.length });
    const inactiveEmployees = employeePerformanceRows.filter((row) => row.state === "inactive");
    if (inactiveEmployees.length) alerts.push({ key: "inactive_employees", label: "Inactive employees", severity: "low", count: inactiveEmployees.length });
    const conversionRisk = institutionIntelligenceRows.filter((row) => row.tags.includes("at_risk")).length;
    if (conversionRisk) alerts.push({ key: "conversion_risk", label: "Conversion-risk institutions", severity: "high", count: conversionRisk });
    const highPotential = institutionIntelligenceRows.filter((row) => row.tags.includes("high_potential")).length;
    if (highPotential) alerts.push({ key: "high_potential", label: "High-potential leads", severity: "medium", count: highPotential });
    return alerts.slice(0, 6);
  }, [dashboardTasks, institutions, employeePerformanceRows, institutionIntelligenceRows]);

  const opsInboxRows = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const ownerNameById = new Map((teamMembers || []).map((member) => [member.id, member.full_name]));
    const rows = dashboardTasks
      .flatMap((task) => {
        const items: Array<{
          id: string;
          kind: "overdue_followup" | "due_today" | "meeting_pending" | "stale_visit";
          title: string;
          owner: string;
          dueDate: string | null;
          severity: "high" | "medium" | "low";
          task: OfficeTask;
          actionLabel: string;
        }> = [];
        const owner = ownerNameById.get(task.user_id) || "Unassigned";
        if (task.follow_up_required && task.follow_up_status === "pending" && task.follow_up_date) {
          if (task.follow_up_date < todayIso) {
            items.push({
              id: `${task.id}-overdue`,
              kind: "overdue_followup",
              title: `Overdue follow-up: ${task.institution_name || task.task_title}`,
              owner,
              dueDate: task.follow_up_date,
              severity: "high",
              task,
              actionLabel: "Resolve follow-up",
            });
          } else if (task.follow_up_date === todayIso) {
            items.push({
              id: `${task.id}-today`,
              kind: "due_today",
              title: `Follow-up due today: ${task.institution_name || task.task_title}`,
              owner,
              dueDate: task.follow_up_date,
              severity: "medium",
              task,
              actionLabel: "Take follow-up",
            });
          }
        }
        if (task.visit_status === "reached" || task.visit_status === "in_meeting") {
          items.push({
            id: `${task.id}-meeting`,
            kind: "meeting_pending",
            title: `Meeting stage pending closure: ${task.institution_name || task.task_title}`,
            owner,
            dueDate: task.visit_date || task.assigned_date || null,
            severity: task.visit_status === "in_meeting" ? "high" : "medium",
            task,
            actionLabel: "Open visit flow",
          });
        }
        if (
          task.visit_status === "planned" &&
          task.visit_date &&
          task.visit_date < todayIso &&
          task.status !== "completed"
        ) {
          items.push({
            id: `${task.id}-stale`,
            kind: "stale_visit",
            title: `Planned visit missed: ${task.institution_name || task.task_title}`,
            owner,
            dueDate: task.visit_date,
            severity: "low",
            task,
            actionLabel: "Reschedule / start",
          });
        }
        return items;
      })
      .sort((a, b) => {
        const severityRank = { high: 3, medium: 2, low: 1 };
        if (severityRank[b.severity] !== severityRank[a.severity]) return severityRank[b.severity] - severityRank[a.severity];
        return new Date(a.dueDate || "9999-12-31").getTime() - new Date(b.dueDate || "9999-12-31").getTime();
      });
    return rows.slice(0, 24);
  }, [dashboardTasks, teamMembers]);

  const slaHeatRows = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    return (teamMembers || [])
      .filter((member) => member.role === "employee")
      .map((member) => {
        const list = dashboardTasks.filter((task) => task.user_id === member.id);
        const total = list.length;
        const overdue = list.filter((task) => task.follow_up_required && task.follow_up_status === "pending" && (task.follow_up_date || "") < todayIso).length;
        const dueToday = list.filter((task) => task.follow_up_required && task.follow_up_status === "pending" && task.follow_up_date === todayIso).length;
        const completed = list.filter((task) => task.visit_status === "completed" || task.visit_status === "closed_lost").length;
        const completionRate = total ? Math.round((completed / total) * 100) : 0;
        const riskScore = Math.max(0, Math.min(100, Math.round(overdue * 20 + dueToday * 8 + (100 - completionRate) * 0.35)));
        const heat =
          riskScore >= 75 ? "critical" : riskScore >= 50 ? "high" : riskScore >= 25 ? "moderate" : "healthy";
        return {
          member,
          total,
          overdue,
          dueToday,
          completionRate,
          riskScore,
          heat,
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [dashboardTasks, teamMembers]);

  const institutionHealthRows = useMemo(() => {
    return institutionIntelligenceRows
      .map((row) => {
        const freshnessPenalty = Math.min(30, row.lastActivityGapDays * 1.4);
        const followupPenalty = Math.min(30, row.overdueFollowups * 8 + row.repeatedReschedules * 4);
        const momentumBonus = row.highInterest ? 8 : 0;
        const stageBonus =
          row.institution.current_lead_stage === "negotiation"
            ? 12
            : row.institution.current_lead_stage === "demo_scheduled"
              ? 8
              : row.institution.current_lead_stage === "proposal_sent"
                ? 6
                : 0;
        const base = 70 + momentumBonus + stageBonus;
        const healthScore = Math.max(0, Math.min(100, Math.round(base - freshnessPenalty - followupPenalty)));
        const band = healthScore >= 75 ? "strong" : healthScore >= 50 ? "watch" : "critical";
        return {
          ...row,
          healthScore,
          band,
        };
      })
      .sort((a, b) => a.healthScore - b.healthScore);
  }, [institutionIntelligenceRows]);

  const adminGanttRows = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    const end = new Date(now);
    end.setDate(end.getDate() + 14);
    const spanMs = end.getTime() - start.getTime();
    const byEmployee = (teamMembers || [])
      .filter((member) => member.role === "employee")
      .map((member) => {
        const tasksForMember = dashboardTasks
          .filter((task) => task.user_id === member.id)
          .map((task) => {
            const baseDate = task.visit_date || task.assigned_date || task.due_date || new Date().toISOString().slice(0, 10);
            const taskStart = new Date(`${baseDate}T00:00:00`);
            const taskEnd = new Date(taskStart);
            taskEnd.setDate(taskEnd.getDate() + 1);
            const left = ((taskStart.getTime() - start.getTime()) / spanMs) * 100;
            const width = Math.max(4, ((taskEnd.getTime() - taskStart.getTime()) / spanMs) * 100);
            return {
              task,
              left: Math.max(0, Math.min(100, left)),
              width: Math.max(3.6, Math.min(100, width)),
              tone:
                task.visit_status === "completed" || task.visit_status === "closed_lost"
                  ? "emerald"
                  : task.follow_up_required && task.follow_up_status === "pending"
                    ? "amber"
                    : task.visit_status === "in_meeting"
                      ? "indigo"
                      : "sky",
            };
          })
          .filter((item) => item.left < 100 && item.left + item.width > 0)
          .slice(0, 20);
        return {
          member,
          bars: tasksForMember,
        };
      })
      .filter((row) => row.bars.length > 0);
    const tickDates = Array.from({ length: 6 }).map((_, index) => {
      const tick = new Date(start);
      tick.setDate(start.getDate() + Math.round((15 / 5) * index));
      return tick.toISOString().slice(5, 10);
    });
    return { rows: byEmployee, tickDates };
  }, [dashboardTasks, teamMembers]);

  const recentActivity = useMemo(() => {
    if ((activityEvents || []).length) return (activityEvents || []).slice(0, 20);
    return (auditLogs || []).slice(0, 20).map((log) => ({
      id: `audit-${log.id}`,
      actor_user_id: log.changed_by,
      institution_id: null,
      visit_task_id: log.task_id,
      event_type: "status_change",
      event_summary: `${statusLabels[log.old_status]} -> ${statusLabels[log.new_status]}`,
      metadata: { note: log.change_note },
      created_at: log.changed_at,
    })) as ActivityEvent[];
  }, [activityEvents, auditLogs]);

  const taskHistoryRows = useMemo(() => {
    return (auditLogs || [])
      .map((log) => {
        const task = (tasks || []).find((item) => item.id === log.task_id);
        const actor = (teamMembers || []).find((member) => member.id === log.changed_by);
        return {
          id: log.id,
          when: log.changed_at,
          taskTitle: task?.task_title || `Task ${log.task_id.slice(0, 8)}`,
          institution: task?.institution_name || "-",
          actor: actor?.full_name || "System",
          oldStatus: statusLabels[log.old_status],
          newStatus: statusLabels[log.new_status],
          note: log.change_note || "-",
        };
      })
      .slice(0, 120);
  }, [auditLogs, tasks, teamMembers]);

  const meetingHistoryRows = useMemo(() => {
    const fromActivity = (activityEvents || [])
      .filter((entry) => entry.event_type === "meeting_session_logged")
      .map((entry) => {
        const meta = (entry.metadata || {}) as Record<string, unknown>;
        return {
          id: entry.id,
          roomName: String(meta.room_name || "Meeting"),
          roomCode: String(meta.room_code || "-"),
          hostName: String(meta.host_name || "Unknown"),
          startedAt: String(meta.started_at || entry.created_at),
          endedAt: String(meta.ended_at || entry.created_at),
          durationSeconds: Number(meta.duration_seconds || 0),
          participantPeak: Number(meta.participant_peak || 1),
          transcript: String(meta.transcript || ""),
          summary: String(meta.summary || entry.event_summary || ""),
          actionItems: Array.isArray(meta.action_items) ? (meta.action_items as unknown[]).map((item) => String(item)).filter(Boolean) : [],
          decisions: Array.isArray(meta.decisions) ? (meta.decisions as unknown[]).map((item) => String(item)).filter(Boolean) : [],
          source: "activity" as const,
        };
      });
    const localRows = (meetingHistory || []).map((entry) => ({
      ...entry,
      actionItems: Array.isArray(entry.actionItems) ? entry.actionItems : [],
      decisions: Array.isArray(entry.decisions) ? entry.decisions : [],
      source: "local" as const,
    }));
    const merged = [...fromActivity, ...localRows];
    const deduped = merged.reduce<Array<(typeof merged)[number]>>((acc, item) => {
      if (acc.some((existing) => existing.id === item.id)) return acc;
      acc.push(item);
      return acc;
    }, []);
    return deduped
      .sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime())
      .slice(0, 120);
  }, [activityEvents, meetingHistory]);

  const convertMeetingActionsToTasks = useCallback(async (
    row: { id: string; roomName: string; actionItems: string[] },
    assignments: Record<number, string> = {},
  ) => {
    if (!officeUser) return;
    const actions = row.actionItems.filter((item) => item.trim());
    if (!actions.length) {
      toast.message("No action items found to convert.");
      return;
    }
    setMeetingTaskConvertBusyById((prev) => ({ ...prev, [row.id]: true }));
    try {
      for (let i = 0; i < Math.min(actions.length, 8); i++) {
        const assignedUserId = assignments[i] ?? officeUser.id;
        await queueOrRunTaskMutation({
          insertPayload: {
            user_id: assignedUserId,
            task_title: actions[i].slice(0, 140),
            description: `Auto-created from meeting "${row.roomName}"`,
            task_type: "planned",
            priority: "medium",
            status: "not_started",
            assigned_date: new Date().toISOString().slice(0, 10),
            due_date: null,
            task_category: "general",
            remarks: null,
            blockers: null,
            completion_note: null,
          },
          successMessage: null,
          failureMessage: "Unable to convert meeting actions to tasks.",
        });
      }
      await refreshTasks({ showLoading: false });
      toast.success(`${Math.min(actions.length, 8)} task(s) created from meeting actions.`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to convert meeting actions to tasks."));
    } finally {
      setMeetingTaskConvertBusyById((prev) => ({ ...prev, [row.id]: false }));
      setMeetingAssigneeDialog(null);
    }
  }, [officeUser, queueOrRunTaskMutation, refreshTasks]);

  const reportInsightCards = useMemo(() => {
    const overdueShare = dashboardKpis.followPending
      ? Math.round((dashboardKpis.followOverdue / dashboardKpis.followPending) * 100)
      : 0;
    return [
      {
        label: "Critical Follow-up Risk",
        value: `${overdueShare}%`,
        note: `${dashboardKpis.followOverdue} of ${dashboardKpis.followPending} pending follow-ups are overdue.`,
      },
      {
        label: "Team Utilization",
        value: `${dashboardKpis.activeEmployeesToday}/${Math.max(teamMembers.filter((m) => m.role === "employee").length, 1)}`,
        note: "Employees active today across visits and task updates.",
      },
      {
        label: "Conversion Throughput",
        value: `${conversionRevenueKpis.conversionRate}%`,
        note: `${conversionRevenueKpis.totalConversions} closed wins with realized revenue of Rs ${Math.round(conversionRevenueKpis.effectiveRevenue).toLocaleString("en-IN")}.`,
      },
    ];
  }, [conversionRevenueKpis, dashboardKpis, teamMembers]);

  const selectedEmployeePerformance = useMemo(() => {
    if (!selectedEmployeeId) return null;
    const row = employeePerformanceRows.find((r) => r.member.id === selectedEmployeeId);
    if (!row) return null;
    const list = dashboardTasks.filter((task) => task.user_id === selectedEmployeeId);
    const institutionsVisited = Object.entries(
      list.reduce<Record<string, number>>((acc, task) => {
        const key = task.institution_id || normalizeInstitutionName(task.institution_name || "") || "unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    return {
      ...row,
      list,
      institutionsVisited,
      stalled: list.filter((task) => task.follow_up_required && task.follow_up_status === "pending" && (task.follow_up_date || "") < new Date().toISOString().slice(0, 10)),
    };
  }, [selectedEmployeeId, employeePerformanceRows, dashboardTasks]);

  const adminMemberTaskRows = useMemo(() => {
    const byMember = (teamMembers || []).map((member) => {
      const memberTasks = (tasks || []).filter((task) => task.user_id === member.id);
      const completed = memberTasks.filter((task) => task.status === "completed").length;
      const pending = memberTasks.filter((task) => task.status !== "completed").length;
      const overdue = memberTasks.filter(
        (task) => task.status !== "completed" && task.due_date && task.due_date < new Date().toISOString().slice(0, 10),
      ).length;
      const journey = memberTasks.filter((task) => task.task_category === "visit").length;
      const followUps = memberTasks.filter((task) => task.follow_up_required && task.follow_up_status === "pending").length;
      return {
        member,
        memberTasks,
        total: memberTasks.length,
        completed,
        pending,
        overdue,
        journey,
        followUps,
      };
    });
    return byMember.sort((a, b) => b.total - a.total);
  }, [teamMembers, tasks]);

  const selectedMemberTaskWindow = useMemo(() => {
    const selected = adminMemberTaskRows.find((row) => row.member.id === selectedEmployeeId) || adminMemberTaskRows[0];
    if (!selected) return null;
    const filtered = selected.memberTasks.filter((task) => {
      const targetDate = task.visit_date || task.assigned_date;
      if (adminRangePreset === "today") return targetDate === new Date().toISOString().slice(0, 10);
      if (adminRangePreset === "this_month") {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return targetDate.startsWith(currentMonth);
      }
      if (adminRangePreset === "all") return true;
      if (adminDateWindow.from && targetDate < adminDateWindow.from) return false;
      if (adminDateWindow.to && targetDate > adminDateWindow.to) return false;
      return true;
    });
    return {
      ...selected,
      filtered,
    };
  }, [adminMemberTaskRows, selectedEmployeeId, adminRangePreset, adminDateWindow]);

  useEffect(() => {
    if (officeUser?.role !== "admin") return;
    if (!adminMemberTaskRows.length) return;
    if (!selectedEmployeeId || !adminMemberTaskRows.some((row) => row.member.id === selectedEmployeeId)) {
      setSelectedEmployeeId(adminMemberTaskRows[0].member.id);
    }
  }, [officeUser?.role, adminMemberTaskRows, selectedEmployeeId]);

  const runAutomationEngine = useCallback(async () => {
    if (!officeUser || runningAutomation || isOffline) return;
    const now = Date.now();
    if (now - lastAutomationRunAt.current < 60000) return;
    lastAutomationRunAt.current = now;
    setRunningAutomation(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const incompleteThreshold = Date.now() - Number(automationSettings.incomplete_visit_hours || 2) * 60 * 60 * 1000;

      if (notificationPrefs.in_app_enabled && officeUser.role === "employee") {
        const ownVisitTasks = tasks.filter((task) => task.user_id === officeUser.id && task.task_category === "visit");
        const dueToday = ownVisitTasks.filter(
          (task) => task.follow_up_required && task.follow_up_status === "pending" && task.follow_up_date === today,
        );
        const overdue = ownVisitTasks.filter(
          (task) => task.follow_up_required && task.follow_up_status === "pending" && (task.follow_up_date || "") < today,
        );
        const plannedToday = ownVisitTasks.filter(
          (task) => (task.visit_date || task.assigned_date) === today && !task.check_in_at,
        );
        const startedNotCompleted = ownVisitTasks.filter(
          (task) =>
            Boolean(task.check_in_at) &&
            !task.meeting_completed_at &&
            !task.check_out_at &&
            new Date(task.check_in_at || 0).getTime() < incompleteThreshold,
        );
        const completedNoFollowUp = ownVisitTasks.filter((task) => {
          const suggestsFollowup = (task.visit_outcome || []).some((outcome) =>
            ["interested", "need_proposal", "need_demo", "call_later", "revisit_required"].includes(outcome),
          );
          return suggestsFollowup && !task.follow_up_required;
        });

        if (dueToday.length) {
          const targetName = dueToday[0]?.institution_name || dueToday[0]?.task_title || "selected institution";
          const targetBrand = dueToday[0]?.visit_brand ? ` (${dueToday[0].visit_brand})` : "";
          await createInAppNotification({
            userId: officeUser.id,
            type: "follow_up",
            title: "Follow-ups due today",
            message: dueToday.length === 1
              ? `Call ${targetName}${targetBrand} today.`
              : `You have ${dueToday.length} follow-ups due today.`,
            severity: "medium",
            actionUrl: "/task/app",
            dedupeFingerprint: `employee_due_today_${today}`,
            cooldownHours: 24,
          });
        }
        if (overdue.length) {
          const targetName = overdue[0]?.institution_name || overdue[0]?.task_title || "selected institution";
          await createInAppNotification({
            userId: officeUser.id,
            type: "follow_up",
            title: "Overdue follow-ups need action",
            message: overdue.length === 1
              ? `Overdue: follow up with ${targetName}.`
              : `${overdue.length} follow-up items are overdue.`,
            severity: "high",
            actionUrl: "/task/app",
            dedupeFingerprint: `employee_overdue_${today}`,
            cooldownHours: 24,
          });
        }
        if (plannedToday.length) {
          await createInAppNotification({
            userId: officeUser.id,
            type: "visit",
            title: "Planned visits pending check-in",
            message: `${plannedToday.length} planned visit(s) for today have not started.`,
            severity: "low",
            actionUrl: "/task/app",
            dedupeFingerprint: `employee_planned_not_started_${today}`,
            cooldownHours: 24,
          });
        }
        if (startedNotCompleted.length) {
          await createInAppNotification({
            userId: officeUser.id,
            type: "visit",
            title: "Visit started but not completed",
            message: `${startedNotCompleted.length} visit(s) started earlier still need completion.`,
            severity: "medium",
            actionUrl: "/task/app",
            dedupeFingerprint: `employee_started_incomplete_${today}`,
            cooldownHours: 12,
          });
        }
        if (completedNoFollowUp.length) {
          await createInAppNotification({
            userId: officeUser.id,
            type: "system_suggestion",
            title: "Add next action for completed visits",
            message: `${completedNoFollowUp.length} completed visit(s) suggest follow-up but have none.`,
            severity: "medium",
            actionUrl: "/task/app",
            dedupeFingerprint: `employee_missing_followup_${today}`,
            cooldownHours: 24,
          });
        }
      }

      if (notificationPrefs.in_app_enabled && officeUser.role === "admin") {
        const adminUsers = (teamMembers || []).filter((member) => member.role === "admin").map((member) => member.id);
        const adminTargets = adminUsers.length ? adminUsers : [officeUser.id];
        const visitTasks = (tasks || []).filter((task) => task.task_category === "visit");
        const overdue = visitTasks.filter(
          (task) => task.follow_up_required && task.follow_up_status === "pending" && (task.follow_up_date || "") < today,
        );
        const highInterestInactive = (institutions || []).filter((institution) => {
          if (!institution.last_visit_at) return false;
          const detailsTask = visitTasks.find((task) => task.institution_id === institution.id && getTaskBrandDetails(task).interest_level === "high");
          if (!detailsTask) return false;
          const cutoff =
            Date.now() - Number(automationSettings.high_interest_inactive_days || 3) * 24 * 60 * 60 * 1000;
          return new Date(institution.last_visit_at).getTime() < cutoff;
        });
        const proposalStale = (institutions || []).filter((institution) => {
          if (institution.current_lead_stage !== "proposal_expected" || !institution.last_visit_at) return false;
          const cutoff = Date.now() - Number(automationSettings.proposal_stale_days || 3) * 24 * 60 * 60 * 1000;
          return new Date(institution.last_visit_at).getTime() < cutoff;
        });
        const demoStale = (institutions || []).filter((institution) => {
          if (institution.current_lead_stage !== "demo_scheduled" || !institution.last_visit_at) return false;
          const cutoff = Date.now() - Number(automationSettings.demo_stale_days || 3) * 24 * 60 * 60 * 1000;
          return new Date(institution.last_visit_at).getTime() < cutoff;
        });

        const employeeLastActivity = (teamMembers || [])
          .filter((member) => member.role === "employee")
          .map((member) => {
            const latestTaskUpdate = (tasks || [])
              .filter((task) => task.user_id === member.id)
              .map((task) => new Date(task.updated_at).getTime())
              .sort((a, b) => b - a)[0];
            const latestEventUpdate = (activityEvents || [])
              .filter((event) => event.actor_user_id === member.id)
              .map((event) => new Date(event.created_at).getTime())
              .sort((a, b) => b - a)[0];
            return {
              id: member.id,
              name: member.full_name,
              last: Math.max(latestTaskUpdate || 0, latestEventUpdate || 0),
            };
          })
          .filter((entry) => entry.last > 0);
        const inactiveEmployees = employeeLastActivity.filter((entry) => {
          const cutoff = Date.now() - Number(automationSettings.inactive_employee_days || 2) * 24 * 60 * 60 * 1000;
          return entry.last < cutoff;
        });

        for (const adminUserId of adminTargets) {
          if (overdue.length && notificationPrefs.admin_overdue_alerts) {
            await createInAppNotification({
              userId: adminUserId,
              type: "admin_alert",
              title: "Overdue follow-ups require review",
              message: `${overdue.length} overdue follow-up item(s) across team.`,
              severity: "high",
              actionUrl: "/admin/dashboard",
              dedupeFingerprint: `admin_overdue_${today}`,
              cooldownHours: 24,
            });
          }
          if (highInterestInactive.length && notificationPrefs.admin_inactive_institution_alerts) {
            await createInAppNotification({
              userId: adminUserId,
              type: "admin_alert",
              title: "High-interest institutions are inactive",
              message: `${highInterestInactive.length} high-interest institution(s) need action.`,
              severity: "high",
              actionUrl: "/task/institutions",
              dedupeFingerprint: `admin_high_interest_inactive_${today}`,
              cooldownHours: 24,
            });
          }
          if ((proposalStale.length || demoStale.length) && notificationPrefs.admin_stale_pipeline_alerts) {
            await createInAppNotification({
              userId: adminUserId,
              type: "admin_alert",
              title: "Pipeline stages are stale",
              message: `${proposalStale.length + demoStale.length} institution(s) stuck in proposal/demo stages.`,
              severity: "medium",
              actionUrl: "/task/institutions",
              dedupeFingerprint: `admin_pipeline_stale_${today}`,
              cooldownHours: 24,
            });
          }
          if (inactiveEmployees.length && notificationPrefs.admin_inactive_employee_alerts) {
            await createInAppNotification({
              userId: adminUserId,
              type: "admin_alert",
              title: "Inactive employees detected",
              message: `${inactiveEmployees.length} employee(s) had no recent activity.`,
              severity: "medium",
              actionUrl: "/admin/dashboard",
              dedupeFingerprint: `admin_inactive_employees_${today}`,
              cooldownHours: 24,
            });
          }
        }
      }

      await logActivityEvent({
        eventType: "automation_scan_completed",
        summary: "Smart reminder scan executed",
        metadata: {
          role: officeUser.role,
          tasks_considered: tasks.length,
          institutions_considered: institutions.length,
        },
      });

      try {
        const { data: refreshed } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", officeUser.id)
          .order("created_at", { ascending: false })
          .limit(120);
        if (refreshed) setNotifications(refreshed as NotificationItem[]);
      } catch {
        // ignore when notifications table is not available yet
      }
    } finally {
      setRunningAutomation(false);
    }
  }, [
    activityEvents,
    automationSettings,
    createInAppNotification,
    institutions,
    isOffline,
    logActivityEvent,
    notificationPrefs,
    officeUser,
    runningAutomation,
    tasks,
    teamMembers,
  ]);

  useEffect(() => {
    if (!pageLoading) return undefined;
    const timer = setTimeout(() => {
      setPageLoading(false);
      toast.error("Task loading timed out. Showing the latest available data.");
    }, 20000);
    return () => clearTimeout(timer);
  }, [pageLoading]);

  const openCreateForm = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    const isEmployee = officeUser?.role === "employee";
    const isJourneyContext = isEmployee && activeSection === "journey" && employeeHasJourneyAccess;
    setTaskDraft({
      ...initialDraft,
      taskCategory: isJourneyContext ? "visit" : "general",
      assignedDate: today,
      visitDate: today,
      taskType: isJourneyContext ? "planned" : initialDraft.taskType,
      status: initialDraft.status,
      brandDetails: {},
    });
    setEditingTaskId(null);
    setShowForm(true);
    setActiveSection("create");
  }, [activeSection, employeeHasJourneyAccess, officeUser?.role, setEditingTaskId, setShowForm, setTaskDraft]);

  useEffect(() => {
    if (location.pathname !== "/task/tasks") {
      openCreateQueryHandledRef.current = false;
      return;
    }
    const params = new URLSearchParams(location.search);
    if (params.get("openCreate") !== "1") {
      openCreateQueryHandledRef.current = false;
      return;
    }
    if (openCreateQueryHandledRef.current) return;
    openCreateQueryHandledRef.current = true;
    openCreateForm();
    navigate("/task/tasks", { replace: true });
  }, [location.pathname, location.search, navigate, openCreateForm]);

  const openEditForm = (task: OfficeTask) => {
    setTaskDraft({
      taskCategory: task.task_category === "visit" ? "visit" : "general",
      taskTitle: task.task_title,
      description: task.description,
      taskType: task.task_type,
      priority: task.priority,
      status: task.status,
      visitBrand: task.visit_brand === "ONROL" ? "ONROL" : "Vivencia",
      institutionType: task.institution_type === "College" ? "College" : "School",
      institutionName: task.institution_name ?? "",
      institutionId: task.institution_id ?? "",
      visitDate: task.visit_date ?? task.assigned_date,
      visitStatus: (task.visit_status as VisitStatus) || "planned",
      assignedDate: task.assigned_date,
      dueDate: task.due_date ?? "",
      remarks: task.remarks ?? "",
      blockers: task.blockers ?? "",
      completionNote: task.completion_note ?? "",
      brandDetails: getTaskBrandDetails(task),
    });
    setEditingTaskId(task.id);
    setShowForm(true);
    setActiveSection("create");
  };

  // ── Desktop deep link navigation (must be after openEditForm declaration) ──
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!desktopRuntime) return undefined;
    const off = window.desktopAPI!.onDeepLink((link: DesktopDeepLink) => {
      const { host, id } = link;
      if (host === "task" && id) {
        const found = tasks?.find((t) => t.id === id);
        if (found) openEditForm(found);
        else { setActiveSection("tasks"); toast.message(`Task ${id.slice(0, 8)}… not found.`); }
      } else if (host === "institution" && id) {
        setSelectedInstitutionId?.(id);
        setActiveSection("institutions");
      } else if (host === "meeting") {
        setActiveSection("meeting");
      } else if (host === "dashboard") {
        setActiveSection("dashboard");
      } else if (host === "chat") {
        setActiveSection("messenger_inbox");
      }
    });
    return off;
  // openEditForm is a stable inline function — omitting from array is safe here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktopRuntime, tasks, setSelectedInstitutionId]);

  const mapVisitToTaskStatus = (visitStatus: VisitStatus): Status => {
    if (visitStatus === "completed") return "completed";
    if (visitStatus === "closed_lost") return "completed";
    if (visitStatus === "reached" || visitStatus === "in_meeting") return "ongoing";
    if (visitStatus === "rescheduled") return "delayed";
    return "not_started";
  };

  const saveTask = async () => {
    if (!officeUser) return;
    if (taskDraft.taskCategory === "general" && !taskDraft.taskTitle.trim()) {
      toast.error("Task title is required.");
      return;
    }
    if (taskDraft.taskCategory === "visit" && !taskDraft.institutionName.trim()) {
      toast.error("Institution name is required for visit tasks.");
      return;
    }
    if (taskDraft.taskCategory === "visit") {
      const details = sanitizeBrandDetails(taskDraft.visitBrand, taskDraft.brandDetails || {});
      const hasProgramInterest = (details.program_interest || []).length > 0;
      if ((taskDraft.visitStatus === "completed" || taskDraft.visitStatus === "followup_pending") && !hasProgramInterest) {
        toast.error("Select at least one program interest before completing a visit.");
        return;
      }
    }

    const derivedAssignedDate = taskDraft.taskCategory === "visit" ? taskDraft.visitDate : taskDraft.assignedDate;
    const derivedStatus: Status =
      taskDraft.taskCategory === "visit" ? mapVisitToTaskStatus(taskDraft.visitStatus) : taskDraft.status;
    const visitTaskTitle = taskDraft.institutionName.trim()
      ? `Visit: ${taskDraft.institutionName.trim()}`
      : "Visit Plan";
    const visitTaskDescription = [
      `${taskDraft.visitBrand} ${taskDraft.institutionType}`,
      taskDraft.visitDate ? `on ${taskDraft.visitDate}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const payload = {
      user_id: officeUser.role === "admin" && adminEmployeeFilter !== "all" ? adminEmployeeFilter : officeUser.id,
      task_title: taskDraft.taskCategory === "visit" ? visitTaskTitle : taskDraft.taskTitle.trim(),
      description:
        taskDraft.taskCategory === "visit"
          ? visitTaskDescription
          : taskDraft.description.trim() || "",
      task_category: taskDraft.taskCategory,
      task_type: taskDraft.taskType,
      priority: taskDraft.priority,
      status: derivedStatus,
      visit_brand: taskDraft.taskCategory === "visit" ? taskDraft.visitBrand : null,
      institution_type: taskDraft.taskCategory === "visit" ? taskDraft.institutionType : null,
      institution_name: taskDraft.taskCategory === "visit" ? taskDraft.institutionName.trim() : null,
      institution_id: taskDraft.taskCategory === "visit" ? (taskDraft.institutionId || null) : null,
      visit_date: taskDraft.taskCategory === "visit" ? taskDraft.visitDate : null,
      visit_status: taskDraft.taskCategory === "visit" ? taskDraft.visitStatus : null,
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
      brand_details: taskDraft.taskCategory === "visit" ? sanitizeBrandDetails(taskDraft.visitBrand, taskDraft.brandDetails || {}) : null,
      assigned_date: derivedAssignedDate,
      due_date: taskDraft.dueDate || null,
      remarks: taskDraft.remarks || null,
      blockers: taskDraft.blockers || null,
      completion_note: taskDraft.completionNote || null,
      started_at: derivedStatus === "ongoing" ? new Date().toISOString() : null,
      completed_at: derivedStatus === "completed" ? new Date().toISOString() : null,
    };

    try {
      if (editingTaskId) {
      const result = await queueOrRunTaskMutation({
        actionType: "update_task",
        entityId: editingTaskId,
        payload,
        successMessage: "Task updated.",
        queuedMessage: "Task update saved offline and queued for sync.",
      });
      await logActivityEvent({
        eventType: "task_updated",
        summary: `Task updated: ${taskDraft.taskCategory === "visit" ? visitTaskTitle : taskDraft.taskTitle.trim()}`,
        visitTaskId: editingTaskId,
        institutionId: taskDraft.institutionId || null,
        metadata: { task_category: taskDraft.taskCategory, visit_brand: taskDraft.visitBrand || null, queued: result.queued },
      });
      } else {
      const localQueuedId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const result = await queueOrRunTaskMutation({
        actionType: "create_task",
        localEntityId: localQueuedId,
        payload,
        successMessage: "Task created.",
        queuedMessage: "Task saved offline and queued for sync.",
      });
      if (result.queued) {
        appendLocalQueuedTask(payload, localQueuedId);
      }
      // Notify the assigned employee (admin-created task for someone else)
      const assignedUserId = payload.user_id as string | undefined;
      if (
        !result.queued &&
        officeUser.role === "admin" &&
        assignedUserId &&
        assignedUserId !== officeUser.id
      ) {
        const taskLabel = taskDraft.taskCategory === "visit" ? visitTaskTitle : taskDraft.taskTitle.trim();
        void sendAdminPush({
          userIds: [assignedUserId],
          title: "New Task Assigned",
          body: taskLabel,
          data: { taskId: result.id ?? "", type: "task_assigned" },
        });
      }
      await logActivityEvent({
        eventType: "task_created",
        summary: `Task created: ${taskDraft.taskCategory === "visit" ? visitTaskTitle : taskDraft.taskTitle.trim()}`,
        visitTaskId: result.id ?? localQueuedId,
        institutionId: taskDraft.institutionId || null,
        metadata: { task_category: taskDraft.taskCategory, visit_brand: taskDraft.visitBrand || null, queued: result.queued },
      });
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to save task."));
      return;
    }

    try { localStorage.removeItem(`task-draft-${officeUser?.id}`); } catch { /* ignore */ }
    setShowForm(false);
    setEditingTaskId(null);
    // Play sound feedback based on final status
    if (derivedStatus === "completed") playTaskCompleteTone();
    else if (derivedStatus === "delayed") playOverdueTone();
    if (navigator.onLine) {
      void refreshTasks().catch(() => {});
    }
  };

  const downloadTemplate = () => {
    const csv = `${expectedHeaders.join(",")}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "onrol-task-import-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const saveCurrentFilters = () => {
    if (!officeUser || officeUser.role !== "admin") return;
    localStorage.setItem(
      `task-filters-${officeUser.id}`,
      JSON.stringify({
        employee: adminEmployeeFilter,
        status: adminStatusFilter,
        type: adminTypeFilter,
        priority: adminPriorityFilter,
        date: adminDateFilter,
        brand: adminBrandFilter,
        outcome: adminOutcomeFilter,
        followUpStatus: adminFollowUpStatusFilter,
        followUpDate: adminFollowUpDateFilter,
        programInterest: adminProgramInterestFilter,
        interestLevel: adminInterestLevelFilter,
        discussionStage: adminDiscussionStageFilter,
        scope: taskScope,
      }),
    );
    toast.success("Filters saved.");
  };

  const applyAdminPreset = (preset: "today_ops" | "sales_followups" | "overdue") => {
    const todayIso = new Date().toISOString().slice(0, 10);
    setTaskScope("team");
    setAdminEmployeeFilter("all");
    setAdminTypeFilter("all");
    setAdminPriorityFilter("all");
    setAdminProgramInterestFilter("all");
    setAdminInterestLevelFilter("all");
    setAdminDiscussionStageFilter("all");
    setAdminBrandFilter("all");
    setAdminOutcomeFilter("all");
    setAdminFollowUpDateFilter("");
    setAdminDateFilter("");
    setAdminStatusFilter("all");
    setAdminTaskCategoryFilter("all");
    setAdminFollowUpStatusFilter("all");

    if (preset === "today_ops") {
      setAdminDateFilter(todayIso);
      setAdminStatusFilter("ongoing");
      toast.success("Applied preset: Today Ops");
      return;
    }
    if (preset === "sales_followups") {
      setAdminTaskCategoryFilter("visit");
      setAdminFollowUpStatusFilter("pending");
      toast.success("Applied preset: Sales Follow-ups");
      return;
    }
    setAdminTaskCategoryFilter("visit");
    setAdminFollowUpStatusFilter("pending");
    setAdminStatusFilter("delayed");
    toast.success("Applied preset: Overdue");
  };

  const quickAddTask = async () => {
    if (!officeUser) return;
    if (!quickTitle.trim()) {
      toast.error("Quick add title is required.");
      return;
    }
    const payload = {
      user_id: officeUser.id,
      task_title: quickTitle.trim(),
      description: "Quick add task",
      task_category: "general" as TaskCategory,
      task_type: "planned" as TaskType,
      priority: quickPriority,
      status: "not_started" as Status,
      visit_brand: null,
      institution_type: null,
      institution_name: null,
      institution_id: null,
      visit_date: null,
      visit_status: null,
      assigned_date: new Date().toISOString().slice(0, 10),
      due_date: quickDueDate || null,
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
    };
    let createdTaskId: string | null = null;
    let queued = false;
    try {
      const localQueuedId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const result = await queueOrRunTaskMutation({
        actionType: "create_task",
        localEntityId: localQueuedId,
        payload,
        successMessage: "Task added.",
        queuedMessage: "Quick task saved offline and queued for sync.",
      });
      if (result.queued) {
        appendLocalQueuedTask(payload, localQueuedId);
      }
      createdTaskId = result.id ?? localQueuedId;
      queued = result.queued;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to quick add task."));
      return;
    }
    try {
      await logActivityEvent({
        eventType: "task_created_quick",
        summary: `Quick task created: ${quickTitle.trim()}`,
        visitTaskId: createdTaskId,
        metadata: { quick_add: true, queued },
      });
    } catch { /* activity logging is best-effort */ }
    setQuickTitle("");
    setQuickPriority("medium");
    setQuickDueDate("");
    setShowQuickAdd(false);
    if (navigator.onLine) {
      void refreshTasks().catch(() => {});
    }
  };

  const handleInstallApp = async () => {
    if (installPromptEvent) {
      try {
        await installPromptEvent.prompt();
        const choice = await installPromptEvent.userChoice;
        if (choice.outcome === "accepted") {
          toast.success("App installed! Open it from your home screen or app drawer.");
          setShowInstallBanner?.(false);
        }
      } catch {
        toast.error("Install prompt unavailable right now.");
      }
    } else {
      // Fallback: manual install instructions for Chrome desktop & mobile
      toast(
        "To install: open Chrome menu (...) -> \"Add to Home screen\" on mobile, or \"Install ONROL Task Manager\" on desktop.",
        { duration: 6000 },
      );
    }
  };

  const exportConversionAnalyticsCsv = () => {
    const headers = [
      "Institution",
      "Type",
      "City",
      "Brand Relevance",
      "Lead Stage",
      "Conversion Status",
      "Conversion Date",
      "Conversion Brand",
      "Expected Value",
      "Final Value",
      "Lead Score",
      "Visit Count",
      "Follow-up Pending",
      "Overdue Follow-up",
      "Insight Tags",
      "Last Visit At",
    ];

    const rows = institutionIntelligenceRows.map((row) => [
      row.institution.name,
      row.institution.institution_type,
      row.institution.city || "",
      row.institution.brand_relevance || "",
      row.institution.current_lead_stage || "",
      row.institution.conversion_status || "not_converted",
      row.institution.conversion_date || "",
      row.institution.conversion_brand || "",
      row.institution.expected_value ?? "",
      row.institution.final_value ?? row.institution.conversion_value ?? "",
      row.leadScore,
      row.visitCount,
      row.followupPending,
      row.overdueFollowups,
      row.tags.join(" | "),
      row.institution.last_visit_at || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `onrol-conversion-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ---------------------------------------------------------------------------
  // Helper functions previously missing after code split
  // ---------------------------------------------------------------------------

  const appendLocalQueuedTask = (payload: Record<string, unknown>, localQueuedId: string) => {
    const fakeTask: OfficeTask = {
      id: localQueuedId,
      ...(payload as Partial<OfficeTask>),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as OfficeTask;
    setTasks((prev) => [fakeTask, ...prev]);
  };

  const getInstitutionVisitHistory = (institutionId: string | null | undefined, institutionName: string | null | undefined) => {
    return (tasks || []).filter(
      (t) =>
        t.task_category === "visit" &&
        (
          (institutionId && t.institution_id === institutionId) ||
          (institutionName && normalizeInstitutionName(t.institution_name || "") === normalizeInstitutionName(institutionName))
        ),
    );
  };

  const renderSyncBadge = (taskId: string) => {
    const queued = (queueItems || []).find(
      (item) => item.entityId === taskId,
    );
    if (!queued) return null;
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
        <RefreshCw className="h-3 w-3 animate-spin" /> Syncing
      </span>
    );
  };

  const quickStatusUpdate = async (taskId: string, status: Status) => {
    try {
      await queueOrRunTaskMutation({
        actionType: "update_task",
        entityId: taskId,
        payload: {
          status,
          ...(status === "completed" ? { completed_at: new Date().toISOString() } : {}),
          ...(status === "ongoing" ? { started_at: new Date().toISOString() } : {}),
        },
        successMessage: `Task marked ${status}.`,
        queuedMessage: "Status update queued offline.",
      });
      if (navigator.onLine) void refreshTasks().catch(() => {});
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update task status."));
    }
  };

  const deleteTaskByAdmin = async (task: OfficeTask) => {
    if (officeUser.role !== "admin") return;
    const confirmed = window.confirm(`Delete task "${task.task_title}"? This cannot be undone.`);
    if (!confirmed) return;
    if (!navigator.onLine) {
      toast.error("Task deletion requires online mode.");
      return;
    }
    try {
      await tmDeleteTask(task.id);
      setTasks((prev) => prev.filter((item) => item.id !== task.id));
      setExpandedAuditTaskId((prev) => (prev === task.id ? null : prev));
      toast.success("Task deleted.");
      await logActivityEvent({
        eventType: "task_deleted",
        summary: `Deleted task: ${task.task_title}`,
        visitTaskId: task.task_category === "visit" ? task.id : null,
        institutionId: task.institution_id ?? null,
        metadata: { task_id: task.id, task_category: task.task_category || "general" },
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to delete task."));
    }
  };

  const quickVisitStatusUpdate = async (taskId: string, visitStatus: VisitStatus) => {
    try {
      await queueOrRunTaskMutation({
        actionType: "update_task",
        entityId: taskId,
        payload: { visit_status: visitStatus, status: mapVisitToTaskStatus(visitStatus) },
        successMessage: "Visit status updated.",
        queuedMessage: "Visit status update queued offline.",
      });
      // When rescheduling, open the reschedule dialog so employee can pick the
      // new date — the dialog then auto-creates a fresh planned visit task.
      if (visitStatus === "rescheduled") {
        setRescheduleDialogTaskId(taskId);
        setRescheduleNewDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
      }
      if (navigator.onLine) void refreshTasks().catch(() => {});
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update visit status."));
    }
  };

  // Move existing visit task to new date (no duplicate task)
  const confirmReschedule = async () => {
    const original = tasks?.find((t) => t.id === rescheduleDialogTaskId);
    if (!original || !rescheduleNewDate) { setRescheduleDialogTaskId(null); return; }
    const previousDate = normalizeIsoDateInput(original.visit_date || original.assigned_date);
    const nextDate = normalizeIsoDateInput(rescheduleNewDate);
    if (!nextDate) {
      toast.error("Please choose a valid reschedule date.");
      return;
    }
    if (previousDate && previousDate === nextDate) {
      toast.message("This visit is already on the selected date.");
      setRescheduleDialogTaskId(null);
      return;
    }
    try {
      await queueOrRunTaskMutation({
        actionType: "update_task",
        entityId: original.id,
        payload: {
          assigned_date: nextDate,
          visit_date: nextDate,
          due_date: nextDate,
          status: "not_started",
          visit_status: "planned",
          started_at: null,
          check_in_at: null,
          meeting_started_at: null,
          meeting_completed_at: null,
          check_out_at: null,
          follow_up_required: null,
          follow_up_type: null,
          follow_up_date: null,
          follow_up_status: null,
          completion_note: null,
          remarks: previousDate ? upsertRescheduleAuditRemark(original.remarks, previousDate, nextDate) : original.remarks,
        },
        successMessage: `Visit moved to ${nextDate}.`,
        queuedMessage: "Visit reschedule queued offline.",
      });
      await logActivityEvent({
        eventType: "visit_rescheduled",
        summary: `${original.task_title}: moved from ${previousDate || "previous date"} to ${nextDate}`,
        visitTaskId: original.id,
        institutionId: original.institution_id ?? null,
        metadata: {
          previous_date: previousDate || null,
          new_date: nextDate,
        },
      });
      setRescheduleDialogTaskId(null);
      if (navigator.onLine) void refreshTasks().catch(() => {});
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to reschedule visit."));
    }
  };

  // Map action → minimum required current visit_status (prevents backward transitions)
  const visitActionMinStage: Record<string, number> = {
    started: 0,
    check_in: 1,
    meeting_started: 2,
    meeting_completed: 3,
    check_out: 4,
  };
  const visitActionTargetStage: Record<string, number> = {
    started: 1,
    check_in: 2,
    meeting_started: 3,
    meeting_completed: 4,
  };

  const runVisitAction = async (
    taskId: string,
    action: "started" | "check_in" | "meeting_started" | "meeting_completed" | "check_out",
  ) => {
    const task = tasks?.find((t) => t.id === taskId);
    if (!task) return;

    // Allow closeout actions (meeting_completed / check_out) even after a follow-up date is picked —
    // the user is finalizing today's DSR. Only block re-starting a visit that's already wrapped.
    const isCloseoutAction = action === "meeting_completed" || action === "check_out";
    if (
      !isCloseoutAction &&
      (task.visit_status === "followup_pending" || task.visit_status === "closed_lost")
    ) {
      toast.error("This visit is already closed for today. Continue from the scheduled follow-up.");
      return;
    }

    // Stage sequence guardrails: prevent skipping ahead or repeating completed steps.
    const currentStage = getJourneyStageIndex(task);
    const required = visitActionMinStage[action] ?? -1;
    if (currentStage < required) {
      toast.error("Please complete the previous step first.");
      return;
    }
    // Skip guard for closeout actions — check the actual timestamp field so that
    // follow_up_pending (which getJourneyStageIndex treats as stage 4) doesn't
    // short-circuit meeting_completed and leave visit_status stuck on followup_pending.
    if (action === "meeting_completed") {
      if (task.meeting_completed_at) return; // already done — silent no-op
    } else if (action === "check_out") {
      if (task.check_out_at) return; // already done — silent no-op
    } else {
      const targetStage = visitActionTargetStage[action];
      if (currentStage >= targetStage) {
        toast.error("This step is already completed.");
        return;
      }
    }

    // ── Institution conflict re-check at check-in ─────────────────────────────
    if ((action === "check_in" || action === "started") && task?.institution_id && checkInstitutionConflict) {
      try {
        const conflict = await checkInstitutionConflict(task.institution_id, task.institution_name || "", task.id);
        if (conflict) {
          const ok = window.confirm(
            `⚠ ï¸ ${conflict.fullName} is already handling ${task.institution_name || "this institution"}. Check in anyway?`,
          );
          if (!ok) return;
        }
      } catch {
        // best-effort — don't block check-in if conflict RPC fails
      }
    }

    try {
      const now = new Date().toISOString();
      const payload: Record<string, unknown> = {};
      if (action === "started") {
        payload.started_at = now;
        payload.status = "ongoing";
        payload.visit_status = task?.visit_status || "planned";
      } else if (action === "check_in") {
        payload.started_at = task?.started_at || now;
        payload.check_in_at = now;
        payload.visit_status = "reached";
        payload.status = "ongoing";
      } else if (action === "meeting_started") {
        payload.meeting_started_at = now;
        payload.visit_status = "in_meeting";
        payload.status = "ongoing";
      } else if (action === "meeting_completed") {
        payload.meeting_completed_at = now;
        payload.visit_status = "completed";
        payload.status = "completed";
        payload.completed_at = now;
      } else if (action === "check_out") {
        payload.check_out_at = now;
      }
      const visitActionType =
        action === "check_in" ? "visit_checkin" :
        action === "check_out" ? "visit_checkout" :
        "update_task";
      await queueOrRunTaskMutation({
        actionType: visitActionType,
        entityId: taskId,
        payload,
        successMessage: "Visit stage updated.",
        queuedMessage: "Visit stage update queued offline.",
      });
      // (Post-visit wizard removed — all closeout fields are now collected inline across
      // the 6-step VisitPanel wizard, so a separate modal would duplicate the flow.)
      if (navigator.onLine) void refreshTasks().catch(() => {});
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to update visit stage."));
    }
  };

  // ---------------------------------------------------------------------------
  // End of previously missing functions
  // ---------------------------------------------------------------------------

  const renderTaskCard = (task: OfficeTask) => {
    const brandDetails = task.task_category === "visit" ? getTaskBrandDetails(task) : {};
    const brandConfig = task.task_category === "visit" ? (brandFieldConfig[task.visit_brand ?? ""] ?? brandFieldConfig["Vivencia"]) : null;
    const linkedInstitution =
      task.task_category === "visit"
        ? institutions.find((inst) => inst.id === task.institution_id) ||
          institutions.find((inst) => normalizeInstitutionName(inst.name) === normalizeInstitutionName(task.institution_name || "")) ||
          null
        : null;
    const institutionHistory =
      task.task_category === "visit" && linkedInstitution
        ? getInstitutionVisitHistory(linkedInstitution.id, linkedInstitution.name).slice(0, 5)
        : [];
    const programInterest = (brandDetails.program_interest || []).slice(0, 2).map(formatChipLabel).join(", ");
    const summaryBadges =
      task.task_category === "visit" && task.visit_brand === "Vivencia"
        ? [programInterest, brandDetails.interest_level ? formatChipLabel(brandDetails.interest_level) : "", brandDetails.discussion_stage ? formatChipLabel(brandDetails.discussion_stage) : ""].filter(Boolean).slice(0, 3)
        : task.task_category === "visit"
          ? [programInterest, brandDetails.audience_type ? formatChipLabel(brandDetails.audience_type) : "", brandDetails.discussion_stage ? formatChipLabel(brandDetails.discussion_stage) : ""].filter(Boolean).slice(0, 3)
          : [];
    const visitStages = [
      { label: "Planned", action: "started" as const, cta: "Start Visit" },
      { label: "Started", action: "check_in" as const, cta: "Mark Reached" },
      { label: "Reached", action: "meeting_started" as const, cta: "Start Meeting" },
      { label: "Meeting Started", action: "meeting_completed" as const, cta: "Move To Review" },
      { label: "Review & Result", action: "meeting_completed" as const, cta: "Complete Review" },
    ];
    const journeyStageIndex = getJourneyStageIndex(task);
    const normalizedStageIndex = Math.max(journeyStageIndex, 0);
    const nextStageIndex = Math.min(normalizedStageIndex + 1, visitStages.length - 1);
    const nextStage = visitStages[nextStageIndex];
    const hasCheckedOut = Boolean(task.check_out_at);
    const showCheckOutAction = normalizedStageIndex >= 4 && !hasCheckedOut;
    const isVisitFlowComplete = normalizedStageIndex >= 4 && hasCheckedOut;

    const isCardExpanded = expandedTaskCardId === task.id;
    return (
    <article
      key={task.id}
      className={`task-card-animate min-w-0 w-full max-w-full overflow-hidden rounded-xl border shadow-sm transition-all ${
        uiTheme === "dark" ? "bg-[#f3f5f8]" : "bg-white"
      } ${
        task.task_category === "visit" && task.follow_up_required && task.follow_up_status === "pending"
          ? "border-amber-300 ring-1 ring-amber-200"
          : uiTheme === "dark" ? "border-[#404040]" : "border-slate-200"
      }`}
    >
      {/* ── Collapsed header ───────────────────────────────
          For visit tasks: compact (institution name is already shown in the parent JourneyRow
          and in the VisitPanel header — don't triple-render it). We keep a thin collapse bar
          with just status/priority + chevron for power users and standalone contexts.
          For general tasks: unchanged — the title is the primary identifier. */}
      {task.task_category === "visit" ? (
        <button
          type="button"
          onClick={() => setExpandedTaskCardId(isCardExpanded ? null : task.id)}
          className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left transition-colors ${
            isCardExpanded
              ? uiTheme === "dark" ? "border-b border-[#454545]" : "border-b border-slate-100"
              : ""
          }`}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {isCardExpanded ? (
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Visit details</span>
            ) : (task.visit_status === "completed" || task.status === "completed") ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Closed for today
                </span>
                {task.follow_up_date ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Follow-up · {task.follow_up_date}
                  </span>
                ) : null}
              </>
            ) : task.visit_status === "followup_pending" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                Follow-up pending{task.follow_up_date ? ` · ${task.follow_up_date}` : ""}
              </span>
            ) : task.check_in_at ? (
              <span className="text-[11px] font-medium uppercase tracking-wide text-orange-600">Visit in progress</span>
            ) : (
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Open visit</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {renderSyncBadge(task.id)}
            {!(task.visit_status === "completed" || task.status === "completed") ? (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityClass[task.priority]}`}>{task.priority}</span>
            ) : null}
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"} ${isCardExpanded ? "rotate-180" : ""}`} />
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setExpandedTaskCardId(isCardExpanded ? null : task.id)}
          className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors ${
            isCardExpanded
              ? uiTheme === "dark" ? "border-b border-[#454545]" : "border-b border-slate-100"
              : ""
          }`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${
              task.status === "completed" ? "bg-emerald-500" :
              task.status === "ongoing" ? "bg-sky-500" :
              task.status === "delayed" ? "bg-rose-500" : "bg-slate-400"
            }`} />
            <h4 className={`truncate text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{task.task_title}</h4>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {renderSyncBadge(task.id)}
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass[task.status]}`}>{statusLabels[task.status]}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${priorityClass[task.priority]}`}>{task.priority}</span>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"} ${isCardExpanded ? "rotate-180" : ""}`} />
          </div>
        </button>
      )}

      {/* ── Expanded body ──────────────────────────────────── */}
      {isCardExpanded ? (
      <div className="px-4 pb-4 pt-2">
      {/* Hide the auto-generated "Brand School on <date>" description for visit tasks — it's redundant with the VisitPanel header */}
      {task.task_category !== "visit" && task.description ? (
        <p className={`mt-1 whitespace-pre-line text-sm leading-6 ${uiTheme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{task.description}</p>
      ) : null}
      {task.task_category !== "visit" ? (
        <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-slate-700">
          <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-medium">General Task</span>
          <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-medium">{task.task_type}</span>
          <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-medium">Assigned: {task.assigned_date}</span>
          {task.due_date ? <span className="rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-medium">Due: {task.due_date}</span> : null}
        </div>
      ) : null}
      {task.task_category === "visit" ? (
        <VisitPanel
          task={task}
          linkedInstitution={linkedInstitution}
          institutionHistory={institutionHistory}
          brandDetails={brandDetails}
          brandConfig={brandConfig}
          institutionSearchByTask={institutionSearchByTask}
          setInstitutionSearchByTask={setInstitutionSearchByTask}
          getInstitutionSuggestions={getInstitutionSuggestions}
          expandedInstitutionSuggestionByTask={expandedInstitutionSuggestionByTask}
          setExpandedInstitutionSuggestionByTask={setExpandedInstitutionSuggestionByTask}
          applyInstitutionToTask={applyInstitutionToTask}
          fetchInstitutionSuggestions={fetchInstitutionSuggestions}
          institutionConflictByTask={institutionConflictByTask}
          reloadInstitutions={reloadInstitutions}
          showCreateInstitutionForTask={showCreateInstitutionForTask}
          setShowCreateInstitutionForTask={setShowCreateInstitutionForTask}
          institutionCreateDraftByTask={institutionCreateDraftByTask}
          setInstitutionCreateDraftByTask={setInstitutionCreateDraftByTask}
          creatingInstitutionForTask={creatingInstitutionForTask}
          createInstitutionForTask={createInstitutionForTask}
          toggleVisitOutcome={toggleVisitOutcome}
          applyFollowupAction={applyFollowupAction}
          saveFollowUpDate={saveFollowUpDate}
          quickNoteDraftByTask={quickNoteDraftByTask}
          setQuickNoteDraftByTask={setQuickNoteDraftByTask}
          saveQuickNote={saveQuickNote}
          saveDsrFields={saveDsrFields}
          isAdmin={officeUser.role === "admin"}
          startVoiceQuickNote={startVoiceQuickNote}
          voiceTaskId={voiceTaskId}
          toggleBrandMultiValue={toggleBrandMultiValue}
          setBrandSingleValue={setBrandSingleValue}
          onVisitAction={runVisitAction}
          onFetchLocation={fetchAndSaveVisitLocation}
          visitSectionStateByTask={visitSectionStateByTask}
          setVisitSectionStateByTask={setVisitSectionStateByTask}
        />
      ) : null}
      <div className="mt-4 space-y-2">
        {task.task_category === "visit" ? (
          <>
            <div className="crm-action-cluster">
              <p className="crm-action-title">Utilities</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openEditForm(task)} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">Edit</button>
                {officeUser.role === "admin" ? (
                  <button
                    onClick={() => void deleteTaskByAdmin(task)}
                    className="rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700"
                  >
                    Delete
                  </button>
                ) : null}
                <button
                  onClick={() => void openInternalDiscussionForRecord("visit", task.id, task.institution_name || task.task_title)}
                  disabled={messengerActionBusy === "open-record-discussion"}
                  className="rounded-md border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 disabled:opacity-60"
                >
                  {messengerActionBusy === "open-record-discussion" ? "Opening..." : "Discuss Internally"}
                </button>
                {officeUser.role === "admin" ? (
                  <button
                    onClick={() => setExpandedAuditTaskId((prev) => (prev === task.id ? null : task.id))}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs"
                  >
                    Audit Trail {expandedAuditTaskId === task.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                ) : null}
              </div>
            </div>
            {officeUser.role !== "admin" ? (() => {
              const latest = (auditLogs || []).filter((l) => l.task_id === task.id)[0];
              const lastStamp =
                task.check_out_at || task.meeting_completed_at || task.meeting_started_at || task.check_in_at || task.updated_at;
              if (!latest && !lastStamp) return null;
              const label = latest
                ? `${statusLabels[latest.old_status]} → ${statusLabels[latest.new_status]}`
                : task.visit_status
                  ? `Status: ${task.visit_status.replace("_", " ")}`
                  : "Visit updated";
              const when = latest ? latest.changed_at : lastStamp;
              return (
                <div className="mt-2 flex items-start gap-2 rounded-md border border-indigo-200 bg-indigo-50/70 px-3 py-2 text-xs text-indigo-900">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{label}</div>
                    <div className="text-[11px] text-indigo-700/80">
                      {when ? new Date(when).toLocaleString() : ""}
                    </div>
                  </div>
                </div>
              );
            })() : null}
          </>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => openEditForm(task)} className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">Edit</button>
            {officeUser.role === "admin" ? (
              <button
                onClick={() => void deleteTaskByAdmin(task)}
                className="rounded-md border border-rose-300 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700"
              >
                Delete
              </button>
            ) : null}
            <button
              onClick={() => void openInternalDiscussionForRecord("task", task.id, task.task_title)}
              disabled={messengerActionBusy === "open-record-discussion"}
              className="rounded-md border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 disabled:opacity-60"
            >
              {messengerActionBusy === "open-record-discussion" ? "Opening..." : "Discuss Internally"}
            </button>
            <button onClick={() => quickStatusUpdate(task.id, "ongoing")} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs">Mark Ongoing</button>
            <button onClick={() => quickStatusUpdate(task.id, "completed")} className="rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs text-white">Mark Completed</button>
            <button
              onClick={() => setIncompleteTask(task)}
              className="rounded-md border border-amber-400 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Not Completed
            </button>
            <button
              onClick={() => setExpandedAuditTaskId((prev) => (prev === task.id ? null : task.id))}
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs"
            >
              Audit Trail {expandedAuditTaskId === task.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        )}
      </div>
      {expandedAuditTaskId === task.id && officeUser.role === "admin" ? (
        <div className={`mt-3 rounded-lg border p-2 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/50" : "border-slate-200 bg-slate-50"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Status Timeline</p>
          <div className="mt-2 space-y-2">
            {(auditLogs || [])
              .filter((log) => log.task_id === task.id)
              .slice(0, 5)
              .map((log) => (
                <div key={log.id} className={`rounded border px-2 py-1.5 text-xs ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-400" : "border-slate-200 bg-white text-slate-600"}`}>
                  <span className={`font-medium ${uiTheme === "dark" ? "text-slate-200" : "text-slate-800"}`}>{statusLabels[log.old_status]}</span>
                  {" → "}
                  <span className={`font-medium ${uiTheme === "dark" ? "text-slate-200" : "text-slate-800"}`}>{statusLabels[log.new_status]}</span>
                  <span className={`ml-2 ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>{new Date(log.changed_at).toLocaleString()}</span>
                  {log.change_note ? <p className={`mt-1 ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>{log.change_note}</p> : null}
                </div>
              ))}
            {!(auditLogs || []).some((log) => log.task_id === task.id) ? <p className={`text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>No status changes yet.</p> : null}
          </div>
        </div>
      ) : null}

      {officeUser.role === "admin" ? (
      <div className={`mt-3 rounded-lg border p-2 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/40" : "border-slate-200 bg-slate-50"}`}>
        {task.task_category === "visit" ? (
          <div className={`mb-2 grid gap-1 text-[11px] md:grid-cols-2 ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
            <p>Check In: {task.check_in_at ? new Date(task.check_in_at).toLocaleString() : "-"}</p>
            <p>Meeting Started: {task.meeting_started_at ? new Date(task.meeting_started_at).toLocaleString() : "-"}</p>
            <p>Meeting Completed: {task.meeting_completed_at ? new Date(task.meeting_completed_at).toLocaleString() : "-"}</p>
            <p>Check Out: {task.check_out_at ? new Date(task.check_out_at).toLocaleString() : "-"}</p>
            <p>Location Time: {task.check_in_location_at ? new Date(task.check_in_location_at).toLocaleString() : "-"}</p>
            <p>Coordinates: {task.check_in_latitude && task.check_in_longitude ? `${task.check_in_latitude}, ${task.check_in_longitude}` : "-"}</p>
            <p className="md:col-span-2">Address: {task.check_in_address || "-"}</p>
            <p>City: {task.check_in_city || "-"}</p>
            <p>Area: {task.check_in_area || "-"}</p>
            <p className="md:col-span-2">
              Maps:{" "}
              {task.check_in_maps_link ? (
                <a
                  href={task.check_in_maps_link}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-indigo-400 underline"
                >
                  Open in Google Maps
                </a>
              ) : (
                "-"
              )}
            </p>
          </div>
        ) : null}
        <p className={`text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Comments & Mentions</p>
        <div className="mt-2 space-y-1">
          {(commentsByTask[task.id] || []).slice(-3).map((comment) => (
            <div key={comment.id} className={`rounded border px-2 py-1 text-xs ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-400" : "border-slate-200 bg-white text-slate-600"}`}>
              <span className={`font-semibold ${uiTheme === "dark" ? "text-slate-200" : "text-slate-700"}`}>{comment.author}:</span> {comment.text}
            </div>
          ))}
          {!commentsByTask[task.id]?.length ? <p className={`text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>No comments yet.</p> : null}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={commentDraftByTask[task.id] || ""}
            onChange={(e) => setCommentDraftByTask((prev) => ({ ...prev, [task.id]: e.target.value }))}
            placeholder="Add comment (use @name for mentions)"
            className={`h-8 flex-1 rounded border px-2 text-xs placeholder:text-slate-400 ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white text-slate-900"}`}
          />
          <button onClick={() => addTaskComment(task.id)} className={`rounded border px-2 py-1 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-200 hover:bg-slate-600" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
            Add
          </button>
        </div>
      </div>
      ) : null}
      </div>
      ) : null}
    </article>
  );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 text-slate-600">
        <div className="rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] px-5 py-4 shadow-sm">
          <p className="flex items-center text-base">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading Task Manager...
          </p>
          {showDebug ? (
            <>
              <p className="mt-2 text-xs text-slate-500">
                Debug step: <span className="font-semibold uppercase">{bootStep}</span>
              </p>
              {authBootError ? (
                <>
                  <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                    Error: {authBootError}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => navigate("/task", { replace: true })}
                      className="rounded-md bg-[#f3f5f8] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-95"
                    >
                      Go To Task Login
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      Retry
                    </button>
                  </div>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    );
  }

  if (!session || !authUser) {
    // On Android (Capacitor), the auth state briefly drops during token refresh
    // before firing SIGNED_IN again. Give it 6 seconds before treating as truly expired.
    // The redirect is handled by useAuth's own useEffect; this screen is just a fallback.
    return (
      <SessionExpiredGate logout={logout} showDebug={showDebug} authBootError={authBootError} />
    );
  }

  if (!officeUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4 text-slate-700">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Profile Loading Issue</h2>
          <p className="mt-2 text-sm text-slate-600">
            Signed in, but your task profile could not be loaded. Please reopen Task Login to re-sync your profile.
          </p>
          {authBootError ? (
            <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
              Debug: {authBootError}
            </p>
          ) : null}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                void logout();
              }}
              className="rounded-lg bg-[#f3f5f8] px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            >
              Open Task Login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const messengerPanelBorder = uiTheme === "dark"
    ? "border-[#404040] bg-[#f3f5f8]"
    : "border-emerald-100 bg-gradient-to-b from-emerald-50/70 via-white to-white";
  const messengerSoftPanel = uiTheme === "dark"
    ? "border-[#404040] bg-[#1a1a1a]/70"
    : "border-emerald-100 bg-[#f4fbf7]";
  const messengerGhostBtnClass = `inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
    uiTheme === "dark"
      ? "border-[#454545] bg-[#f3f5f8] text-slate-200 hover:bg-[#404040]"
      : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
  }`;
  const messengerActionBtnClass = `${messengerGhostBtnClass} h-9 gap-1.5 px-2.5`;
  const messengerInlineBtnClass = `inline-flex items-center justify-center rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
    uiTheme === "dark"
      ? "border-[#454545] bg-[#f3f5f8] text-slate-200 hover:bg-[#404040]"
      : "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
  }`;
  const messengerPrimaryBtnClass = "inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-60";
  const messengerDangerBtnClass = `inline-flex items-center justify-center rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
    uiTheme === "dark"
      ? "border-rose-700 bg-rose-950/30 text-rose-200 hover:bg-rose-900/45"
      : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
  }`;
  const messengerInputClass = `h-10 w-full rounded-xl border px-3 text-sm ${
    uiTheme === "dark"
      ? "border-[#454545] bg-[#404040] text-slate-100 placeholder:text-slate-500"
      : "border-emerald-100 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
  }`;
  return (
    <div className={`min-h-screen w-full overflow-x-hidden ${uiTheme === "dark" ? "dark bg-[#1a1a1a]" : "bg-[#F5F7FA]"}`} onClick={unlockAudio}>
      {/* Admin mode indicator — thin teal stripe fixed at the very top of the viewport.
          Unmissable cue that you're in the admin surface (vs an employee account on the
          same device). 2px tall, non-interactive, hidden for employees. */}
      {officeUser.role === "admin" ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[2px] bg-gradient-to-r from-teal-400 via-indigo-500 to-teal-400"
        />
      ) : null}
      <CallOverlay
        callState={callState}
        callSession={callSession}
        localStream={localStream}
        remoteStream={remoteStream}
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        isMuted={isMuted}
        isCameraOff={isCameraOff}
        isFrontCamera={isFrontCamera}
        canSwitchCamera={canSwitchCamera}
        acceptCall={acceptCall}
        rejectCall={rejectCall}
        endCall={endCall}
        toggleMute={toggleMute}
        toggleCamera={toggleCamera}
        switchCamera={switchCamera}
      />

      {/* Android APK update banner */}
      {androidUpdate?.available && (
        <div className="fixed bottom-16 left-0 right-0 z-[9990] mx-3 mb-1 flex items-center justify-between gap-3 rounded-xl border border-emerald-600 bg-emerald-700 px-4 py-3 shadow-xl">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Update Available</p>
            <p className="text-xs text-emerald-200">Version {androidUpdate.latestVersion} is ready to download</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <a href={androidUpdate.apkUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 active:opacity-80">
              Download
            </a>
            <button onClick={() => setAndroidUpdate(null)} className="rounded-lg border border-emerald-500 px-2 py-1.5 text-xs text-white active:opacity-80">
              Later
            </button>
          </div>
        </div>
      )}

      {/* Post-visit wizard — auto-opens after meeting_completed */}
      {postVisitWizardTaskId && (() => {
        const wizardTask = tasks?.find((t) => t.id === postVisitWizardTaskId);
        if (!wizardTask) return null;
        return (
          <PostVisitWizard
            task={wizardTask}
            onClose={() => setPostVisitWizardTaskId(null)}
            toggleVisitOutcome={toggleVisitOutcome ?? (async () => {})}
            applyFollowupAction={applyFollowupAction ?? (async () => {})}
            saveFollowUpDate={saveFollowUpDate ?? (async () => {})}
            saveQuickNote={saveQuickNote ?? (async () => {})}
            startVoiceQuickNote={startVoiceQuickNote ?? (() => {})}
            voiceTaskId={voiceTaskId ?? null}
            quickNoteDraft={quickNoteDraftByTask?.[postVisitWizardTaskId] ?? ""}
            setQuickNoteDraft={(v) => setQuickNoteDraftByTask?.((prev) => ({ ...prev, [postVisitWizardTaskId]: v }))}
            setBrandSingleValue={setBrandSingleValue ?? (async () => {})}
            toggleBrandMultiValue={toggleBrandMultiValue ?? (async () => {})}
          />
        );
      })()}

      {/* Reschedule dialog — pick new date, then creates a fresh planned visit */}
      {rescheduleDialogTaskId && (() => {
        const rescheduleTask = tasks?.find((t) => t.id === rescheduleDialogTaskId);
        return (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setRescheduleDialogTaskId(null)} />
            <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-base font-bold text-slate-900">Reschedule Visit</h3>
              <p className="mt-1 text-sm text-slate-500">
                Pick a new date for <span className="font-semibold">{rescheduleTask?.institution_name || rescheduleTask?.task_title}</span>.
                A new planned visit will be created automatically.
              </p>
              <label className="mt-4 block text-xs font-semibold text-slate-500 uppercase tracking-widest">New Visit Date</label>
              <input
                type="date"
                value={rescheduleNewDate}
                onChange={(e) => setRescheduleNewDate(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#f3f5f8]/30"
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setRescheduleDialogTaskId(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600"
                >Cancel</button>
                <button
                  onClick={() => void confirmReschedule()}
                  disabled={!rescheduleNewDate}
                  className="flex-1 rounded-xl bg-[#f3f5f8] py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >Create Visit</button>
              </div>
            </div>
          </div>
        );
      })()}
      <div className={`crm-workspace min-h-screen w-full overflow-x-hidden ${uiTheme === "dark" ? "crm-theme-dark bg-[#1a1a1a] text-slate-100" : "bg-[#F8FAFC] text-slate-900"}`}>
      <header className={`crm-topbar sticky top-0 z-40 border-b backdrop-blur-xl ${uiTheme === "dark" ? "border-[#404040] bg-[#1a1a1a]/95" : "border-slate-200 bg-white/96"}`} style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        {/* ── Mobile header (Android native style) ── */}
        <div className="flex items-center justify-between px-3 py-3 md:hidden">
          {/* Hamburger */}
          <button
            onClick={() => setShowMobileDrawer(true)}
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${uiTheme === "dark" ? "text-slate-300 active:bg-[#404040]" : "text-slate-700 active:bg-slate-100"}`}
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
          {/* Center: logo + title */}
          <div className="flex items-center gap-2">
            <img src={onrolLogo} alt="ONROL" className="h-7 w-7 rounded-lg object-contain" />
            <span className={`text-base font-bold tracking-tight ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>
              {isMessengerSection ? "Messenger" : "ONROL"}
            </span>
          </div>
          {/* Right: bell + 3-dot */}
          <div className="flex items-center gap-1">
            <button
              ref={notifBellRef}
              onClick={() => setNotifPanelOpen((prev) => !prev)}
              className={`relative flex h-9 w-9 items-center justify-center rounded-xl ${uiTheme === "dark" ? "text-slate-300 active:bg-[#404040]" : "text-slate-700 active:bg-slate-100"}`}
            >
              <BellRing className="h-5 w-5" />
              {unreadNotificationCount > 0 ? (
                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </span>
              ) : null}
            </button>
            <button
              ref={quickActionsButtonRef}
              onClick={() => setQuickActionsOpen((prev) => !prev)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${uiTheme === "dark" ? "text-slate-300 active:bg-[#404040]" : "text-slate-700 active:bg-slate-100"}`}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Desktop header ── */}
        <div className="crm-topbar-inner mx-auto hidden w-full max-w-7xl min-w-0 items-center justify-between gap-3 px-6 py-3 md:flex">
          <div className="flex min-w-0 items-center gap-3">
            <img src={onrolLogo} alt="ONROL" className="h-9 w-9 rounded-lg object-contain ring-1 ring-slate-200/70" />
            <div className="min-w-0">
            <h1 className={`crm-top-title truncate text-lg font-semibold md:text-xl ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>
              {isMessengerSection ? "ONROL Messenger" : "ONROL Task Manager"}
            </h1>
            <p className={`text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              {isMessengerSection ? "Internal work communication" : "Internal daily execution tracking"}
            </p>
            </div>
          </div>
          <div className="crm-top-actions relative flex w-full items-center justify-end gap-1.5 max-[360px]:gap-1 md:w-auto md:gap-2">
            {/* Online/Offline badge */}
            <span className={`hidden rounded-full px-2 py-1 text-[11px] font-semibold md:inline-flex ${isOffline ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>
              {isOffline ? "Offline" : "Online"}
            </span>
            {/* Help — icon on mobile, icon+text on sm+ */}
            <button
              onClick={() => setShowUserGuide(true)}
              title="Help"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-300 hover:bg-[#454545]" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Help</span>
            </button>
            <div
              className={`hidden items-center gap-1 rounded-xl border p-1 sm:inline-flex ${
                uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]/90" : "border-slate-300 bg-white"
              }`}
            >
              <button
                onClick={() => setUiTheme("light")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  uiTheme === "light"
                    ? "bg-[#f3f5f8] text-white shadow-sm"
                    : uiTheme === "dark"
                      ? "text-slate-200 hover:bg-[#404040]"
                      : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Sun className="h-3.5 w-3.5" /> Light
              </button>
              <button
                onClick={() => setUiTheme("dark")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  uiTheme === "dark"
                    ? "bg-[#f3f5f8] text-white shadow-sm"
                    : uiTheme === "dark"
                      ? "text-slate-200 hover:bg-[#404040]"
                      : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Moon className="h-3.5 w-3.5" /> Dark
              </button>
            </div>
            <button
              ref={quickActionsButtonRef}
              onClick={() => setQuickActionsOpen((prev) => !prev)}
              className={`inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 max-[360px]:h-8 max-[360px]:min-w-8 max-[360px]:px-1.5 sm:hidden ${
                uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-100" : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            <button
              ref={notifBellRef}
              onClick={() => setNotifPanelOpen((prev) => !prev)}
              className={`relative inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm max-[360px]:h-8 max-[360px]:min-w-8 max-[360px]:px-1.5 ${
                uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-200 hover:bg-[#454545]" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <BellRing className="h-4 w-4" />
              {unreadNotificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              ) : null}
            </button>
            {notifPanelOpen ? (
              <div ref={notifPanelRef} className={`crm-notif-popover absolute right-0 top-11 z-40 w-[26rem] max-w-[96vw] rounded-2xl border p-3 shadow-2xl ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]/95" : "border-slate-200 bg-white/95"}`}>
                <div className="flex items-center justify-between gap-2 border-b pb-2.5">
                  <div>
                    <p className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Notifications</p>
                    <p className={`text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Actionable alerts for tasks, visits, and chat.</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => void markAllNotificationsRead()}
                      disabled={notificationsBusy}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-medium disabled:opacity-50 ${uiTheme === "dark" ? "border-slate-600 text-indigo-300 hover:bg-[#404040]" : "border-slate-200 text-indigo-700 hover:bg-indigo-50"}`}
                    >
                      {notificationsBusy ? "Busy..." : "Mark all read"}
                    </button>
                    <button
                      onClick={() => void clearAllNotifications()}
                      disabled={notificationsBusy}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-medium disabled:opacity-50 ${uiTheme === "dark" ? "border-rose-800 text-rose-400 hover:bg-rose-900/30" : "border-rose-200 text-rose-600 hover:bg-rose-50"}`}
                    >
                      Clear all
                    </button>
                  </div>
                </div>
                {notificationsError ? (
                  <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-700">
                    Notification sync issue: {notificationsError}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {([
                    ["all", "All"],
                    ["unread", "Unread"],
                    ["tasks", "Tasks"],
                    ["meetings", "Meetings"],
                    ["chat", "Chat"],
                    ["admin", "Admin"],
                  ] as const).map(([key, label]) => (
                    <button
                      key={`notif-filter-${key}`}
                      onClick={() => setNotificationFilter(key)}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        notificationFilter === key
                          ? "border-[#f3f5f8] bg-[#f3f5f8] text-white"
                          : uiTheme === "dark"
                            ? "border-[#454545] bg-[#404040] text-slate-300"
                            : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  <div className="ml-auto flex items-center gap-1.5">
                    {(["all", "high", "medium", "low"] as const).map((level) => (
                      <button
                        key={`sev-${level}`}
                        onClick={() => setSeverityFilter(level)}
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          severityFilter === level
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : uiTheme === "dark"
                              ? "border-[#454545] bg-[#404040] text-slate-300"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {level === "all" ? "Any" : level}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => {
                      const until = new Date(Date.now() + 30 * 60 * 1000).toISOString();
                      setDesktopSettings((prev) => ({ ...prev, dndUntil: until }));
                      if (desktopRuntime) void updateDesktopSettings({ dndUntil: until });
                      toast.success("Notifications snoozed for 30 minutes.");
                    }}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}
                  >
                    Snooze 30m
                  </button>
                  <button
                    onClick={() => {
                      const until = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
                      setDesktopSettings((prev) => ({ ...prev, dndUntil: until }));
                      if (desktopRuntime) void updateDesktopSettings({ dndUntil: until });
                      toast.success("Notifications snoozed for 2 hours.");
                    }}
                    className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}
                  >
                    Snooze 2h
                  </button>
                  {desktopSettings.dndUntil ? (
                    <button
                      onClick={() => {
                        setDesktopSettings((prev) => ({ ...prev, dndUntil: null }));
                        if (desktopRuntime) void updateDesktopSettings({ dndUntil: null });
                        toast.success("Notification snooze cleared.");
                      }}
                      className={`rounded-lg border px-2 py-1 text-[11px] font-medium ${uiTheme === "dark" ? "border-rose-700 bg-rose-900/30 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}
                    >
                      Clear Snooze
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 max-h-[66vh] space-y-2 overflow-auto pr-1">
                  {filteredNotifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={async () => {
                        if (!item.is_read) await markNotificationRead(item.id);
                        setNotifPanelOpen(false);
                        if (item.action_url) openNotificationAction(item.action_url);
                      }}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        uiTheme === "dark"
                          ? item.is_read ? "border-[#454545] bg-[#404040]/85 hover:bg-[#404040]" : "border-indigo-700 bg-[#f3f5f8]/30"
                          : item.is_read ? "border-slate-200 bg-slate-50/70 hover:bg-slate-100/70" : "border-indigo-200 bg-indigo-50/90"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{formatNotificationTypeLabel(item.type)}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            item.severity === "high"
                              ? "bg-rose-100 text-rose-700"
                              : item.severity === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : uiTheme === "dark" ? "bg-[#454545] text-slate-300" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <p className={`mt-1 text-sm font-semibold leading-snug ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{item.title}</p>
                      <p className={`mt-0.5 text-xs leading-relaxed ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>{item.message}</p>
                      <p className={`mt-1 text-[11px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>{new Date(item.created_at).toLocaleString()}</p>
                    </button>
                  ))}
                  {!filteredNotifications.length ? <p className={`rounded-xl border px-3 py-2.5 text-xs ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>No notifications for selected filters.</p> : null}
                </div>
              </div>
            ) : null}
            {quickActionsOpen ? (
              <div
                ref={quickActionsRef}
                className={`absolute right-0 top-12 z-[70] w-60 max-[360px]:w-52 rounded-2xl border p-2.5 shadow-2xl md:hidden ${
                  uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"
                }`}
              >
                <p className={`px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                  Quick Actions
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      goToTaskHome();
                      setQuickActionsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      uiTheme === "dark" ? "text-slate-100 hover:bg-[#404040]" : uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Home className="h-4 w-4" /> Home
                  </button>
                  <button
                    onClick={() => {
                      void refreshWorkspace();
                      setQuickActionsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      uiTheme === "dark" ? "text-slate-100 hover:bg-[#404040]" : uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </button>
                  <button
                    onClick={() => {
                      setUiTheme((prev) => (prev === "dark" ? "light" : "dark"));
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      uiTheme === "dark" ? "text-slate-100 hover:bg-[#404040]" : uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {uiTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {uiTheme === "dark" ? "Light Mode" : "Dark Mode"}
                  </button>
                  {!isStandalone ? (
                    <button
                      onClick={() => {
                        void handleInstallApp();
                        setQuickActionsOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                        uiTheme === "dark" ? "text-slate-100 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Download className="h-4 w-4" /> Install App
                    </button>
                  ) : null}
                  <button
                    onClick={() => {
                      void logout();
                      setQuickActionsOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                      uiTheme === "dark" ? "text-rose-300 hover:bg-[#404040]" : "text-rose-700 hover:bg-rose-50"
                    }`}
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <AvatarWithFallback
                name={officeUser.full_name ?? "User"}
                avatarUrl={officeUser.avatar_url as string | undefined}
                size="sm"
              />
              <div className="text-right">
                <p className={`text-sm font-medium ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>{officeUser.full_name}</p>
                <p className={`text-xs uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{officeUser.role}</p>
              </div>
            </div>
            <button onClick={() => void logout()} className={`rounded-lg border px-3 py-2 text-sm ${uiTheme === "dark" ? "border-[#454545] text-slate-200" : "border-slate-300 text-slate-700"}`}>Logout</button>
          </div>
        </div>
      </header>

      <main
        className={`crm-main mx-auto grid w-full min-w-0 max-w-full gap-4 overflow-x-hidden px-3 py-4 pb-32 sm:px-4 md:gap-6 md:px-6 md:pb-8 md:pt-5 ${
          officeUser.role === "employee"
            ? `max-w-[1700px] ${isStandalone ? "md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]" : "md:grid-cols-[228px_minmax(0,1fr)] xl:grid-cols-[256px_minmax(0,1fr)]"}`
            : `max-w-[1700px] ${isStandalone ? "md:grid-cols-[228px_minmax(0,1fr)] xl:grid-cols-[256px_minmax(0,1fr)]" : "md:grid-cols-[244px_minmax(0,1fr)] xl:grid-cols-[272px_minmax(0,1fr)]"}`
        }`}
      >
        <aside className={`crm-left-rail hidden h-fit rounded-xl border p-3 shadow-sm md:sticky md:top-[4.5rem] md:block md:self-start md:max-h-[calc(100vh-5rem)] md:overflow-y-auto ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
          <p className={`px-2 pb-2 text-xs font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Task Navigation</p>
          <div className="mb-2 space-y-1">
            <p className={`px-2 text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Workspace</p>
            <button
              onClick={goToTaskHome}
              className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <Home className="h-4 w-4" /> Home
            </button>
            <button
              onClick={() => void refreshWorkspace()}
              className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <RefreshCw className="h-4 w-4" /> Refresh Data
            </button>
          </div>
          <div className="space-y-1">
            {officeUser.role === "admin" ? (
              <>
                <p className={`px-2 pt-1 text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>CRM Modules</p>
                {[
                  { key: "overview", label: "Overview", icon: LayoutDashboard },
                  { key: "pipeline", label: "Pipeline", icon: GaugeCircle },
                  { key: "tasks", label: "Tasks", icon: ListTodo },
                  { key: "field_today", label: "Field Today", icon: MapPin },
                  { key: "team", label: "Team", icon: Users },
                  { key: "reports", label: "Reports", icon: FileDown },
                ].map((module) => (
                  <button
                    key={module.key}
                    onClick={() => {
                      if (module.key === "journey") {
                        setActiveSection("journey");
                        setAdminModule("journey");
                        setShowForm(false);
                        navigate("/task/journey", { replace: true });
                        return;
                      }
                      if (module.key === "tasks") {
                        setActiveSection("tasks");
                        setAdminModule("tasks");
                        setShowForm(false);
                        navigate("/task/tasks", { replace: true });
                        return;
                      }
                      setAdminModule(module.key as AdminModule);
                      setActiveSection("dashboard");
                      setShowForm(false);
                      navigate(`/admin/dashboard?module=${module.key}`, { replace: true });
                    }}
                    className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                      (module.key === "tasks" && activeSection === "tasks") ||
                      (module.key !== "tasks" && activeSection === "dashboard" && adminModule === module.key)
                        ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm"
                        : uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <module.icon className="h-4 w-4" /> {module.label}
                  </button>
                ))}
                <p className={`px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Messenger</p>
                {[
                  { key: "inbox", label: "Chat", icon: Inbox },
                ].map((item) => (
                  <button
                    key={`admin-msg-${item.key}`}
                    onClick={() => openMessengerSection(item.key as "inbox" | "teams" | "announcements" | "directory")}
                    className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                      activeSection === `messenger_${item.key}` ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <item.icon className="h-4 w-4" /> {item.label}
                  </button>
                ))}
                <button
                  onClick={() => { setActiveSection("meeting"); setShowForm(false); }}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "meeting" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Video className="h-4 w-4" /> Meeting
                </button>
                <p className={`px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Admin Tools</p>
                <button
                  onClick={openCreateForm}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "create" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <SquarePlus className="h-4 w-4" /> Create Task
                </button>
                <button
                  onClick={() => {
                    setActiveSection("institutions");
                    setShowForm(false);
                    navigate("/task/institutions", { replace: true });
                  }}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "institutions" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Building2 className="h-4 w-4" /> Institutions
                </button>
                <button
                  onClick={() => {
                    setActiveSection("user_management");
                    setShowForm(false);
                    navigate("/admin/users", { replace: true });
                  }}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "user_management" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Users className="h-4 w-4" /> User Management
                </button>
                <button
                  onClick={() => {
                    setActiveSection("settings");
                    setShowForm(false);
                    navigate("/admin/settings/automation", { replace: true });
                  }}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "settings" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Settings className="h-4 w-4" /> Settings
                </button>
                <button
                  onClick={() => { setActiveSection("logs"); setShowForm(false); }}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "logs" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Activity className="h-4 w-4" /> Activity Logs
                </button>
                <button
                  onClick={() => { setActiveSection("filetransfer"); setShowForm(false); }}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "filetransfer" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Share2 className="h-4 w-4" /> File Transfer
                </button>
                {/* Removed duplicate "Settings" entry — the "Automation & AI" button above
                    already routes to /admin/settings/automation. */}
              </>
            ) : (
              <>
                <p className={`px-2 pt-1 text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Work</p>
                <button
                  onClick={() => {
                    setActiveSection("dashboard");
                    setShowForm(false);
                    navigate("/task/overview", { replace: true });
                  }}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "dashboard" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" /> Overview
                </button>
                <button
                  onClick={() => {
                    setActiveSection("tasks");
                    setShowForm(false);
                    navigate("/task/tasks", { replace: true });
                  }}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "tasks" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <ListTodo className="h-4 w-4" /> Tasks
                </button>
                {employeeHasJourneyAccess ? (
                  <button
                    onClick={() => {
                      setActiveSection("journey");
                      setShowForm(false);
                      navigate("/task/journey", { replace: true });
                    }}
                    className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                      activeSection === "journey" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <ListChecks className="h-4 w-4" /> Journey Plan
                  </button>
                ) : null}
                <p className={`px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Create</p>
                <button
                  onClick={openCreateForm}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "create" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <SquarePlus className="h-4 w-4" /> Create Task
                </button>
                <p className={`px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Data</p>
                <button
                  onClick={() => {
                    setActiveSection("institutions");
                    setShowForm(false);
                    navigate("/task/institutions", { replace: true });
                  }}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "institutions" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Building2 className="h-4 w-4" /> Institutions
                </button>
                <p className={`px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Messenger</p>
                {[
                  { key: "inbox", label: "Chat", icon: Inbox },
                ].map((item) => (
                  <button
                    key={`employee-msg-${item.key}`}
                    onClick={() => openMessengerSection(item.key as "inbox" | "teams" | "announcements" | "directory")}
                    className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                      activeSection === `messenger_${item.key}` ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <item.icon className="h-4 w-4" /> {item.label}
                  </button>
                ))}
                <button
                  onClick={() => { setActiveSection("meeting"); setShowForm(false); }}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "meeting" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Video className="h-4 w-4" /> Meeting
                </button>
                <button
                  onClick={() => { setActiveSection("filetransfer"); setShowForm(false); }}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "filetransfer" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : uiTheme === "dark" ? "text-slate-300 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Share2 className="h-4 w-4" /> File Transfer
                </button>
                <p className={`px-2 pt-2 text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Account</p>
                <button
                  onClick={() => {
                    setActiveSection("settings");
                    setShowForm(false);
                    // Only admins have the /admin/settings/automation surface — employees stay on /task
                    if (officeUser.role === "admin") {
                      navigate("/admin/settings/automation", { replace: true });
                    }
                  }}
                  className={`crm-nav-item flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
                    activeSection === "settings" ? "border-l-4 border-l-indigo-500 bg-indigo-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Settings className="h-4 w-4" /> User Settings
                </button>
              </>
            )}
          </div>
          {officeUser.role === "admin" ? (
          <div className={`mt-3 rounded-lg border p-2 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Quick Add</p>
            <input
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Task title"
              className={`mt-2 h-8 w-full rounded border px-2 text-xs placeholder:text-slate-400 ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-100" : "border-slate-300 bg-white text-slate-900"}`}
            />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <select value={quickPriority} onChange={(e) => setQuickPriority(e.target.value as Priority)} className={`h-8 rounded border px-2 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-100" : "border-slate-300 bg-white text-slate-900"}`}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <div className="flex flex-col gap-0.5">
                <label className={`text-[10px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Due Date</label>
                <input type="date" value={quickDueDate} onChange={(e) => setQuickDueDate(e.target.value)} className={`h-8 rounded border px-2 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-100" : "border-slate-300 bg-white text-slate-900"}`} />
              </div>
            </div>
            <button onClick={quickAddTask} className="mt-2 w-full rounded bg-[#f3f5f8] px-2 py-1.5 text-xs font-medium text-white">
              Add
            </button>
          </div>
          ) : null}

          {/* ── Downloads section ─────────────────────────────────────────── */}
          <div className={`mt-3 rounded-xl border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/60" : "border-slate-200 bg-slate-50"}`}>
            <p className={`mb-2 text-[11px] font-semibold uppercase tracking-widest ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Get ONROL On</p>
            <div className="space-y-1">
              {/* Web PWA */}
              {!isStandalone ? (
                <button
                  onClick={() => void handleInstallApp()}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${uiTheme === "dark" ? "text-slate-300 hover:bg-[#454545]" : "text-slate-700 hover:bg-white"}`}
                >
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${installPromptEvent ? "bg-indigo-100 text-indigo-600" : uiTheme === "dark" ? "bg-slate-600 text-slate-400" : "bg-slate-200 text-slate-500"}`}>
                    <Download className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className={installPromptEvent ? "font-semibold text-indigo-600" : ""}>Web App (PWA)</p>
                    <p className={`text-[10px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Install to home screen</p>
                  </div>
                </button>
              ) : (
                <div className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${uiTheme === "dark" ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className={`font-medium ${uiTheme === "dark" ? "text-emerald-400" : "text-emerald-700"}`}>Web App Installed</p>
                    <p className={`text-[10px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Running as standalone</p>
                  </div>
                </div>
              )}
              {/* Android APK */}
              {(import.meta.env.VITE_APK_DOWNLOAD_URL as string | undefined)?.trim() ? (
                <a
                  href={(import.meta.env.VITE_APK_DOWNLOAD_URL as string).trim()}
                  download
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${uiTheme === "dark" ? "text-slate-300 hover:bg-[#454545]" : "text-slate-700 hover:bg-white"}`}
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M17.523 15.342 16.1 13.92a5.99 5.99 0 0 0 .9-3.17 6 6 0 0 0-6-6 5.99 5.99 0 0 0-3.17.9L6.41 4.23A8 8 0 0 1 18.77 16.59l-1.247-1.248ZM4.638 7.637 6.06 9.06A5.989 5.989 0 0 0 5 11.75a6 6 0 0 0 6 6c.98 0 1.9-.243 2.69-.67l1.422 1.422A8 8 0 0 1 3.37 6.369l1.268 1.268ZM11 7.75a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/><path d="m14.12 2.293 1.565 2.711a.75.75 0 1 1-1.3.75L12.82 3.043a.75.75 0 0 1 1.3-.75ZM8.585 3.043 7.015 5.754a.75.75 0 1 1-1.3-.75l1.57-2.711a.75.75 0 0 1 1.3.75Z"/></svg>
                  </span>
                  <div className="min-w-0">
                    <p>Android APK</p>
                    <p className={`text-[10px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>v{import.meta.env.VITE_APP_VERSION ?? "latest"} · Direct install</p>
                  </div>
                  <FileDown className={`ml-auto h-3 w-3 flex-shrink-0 ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`} />
                </a>
              ) : null}
              {/* Windows Installer */}
              {(import.meta.env.VITE_DESKTOP_INSTALLER_URL as string | undefined)?.trim() ? (
                <a
                  href={(import.meta.env.VITE_DESKTOP_INSTALLER_URL as string).trim()}
                  download
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${uiTheme === "dark" ? "text-slate-300 hover:bg-[#454545]" : "text-slate-700 hover:bg-white"}`}
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-orange-600">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M0 3.449 9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
                  </span>
                  <div className="min-w-0">
                    <p>Windows Desktop</p>
                    <p className={`text-[10px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Installer (.exe)</p>
                  </div>
                  <FileDown className={`ml-auto h-3 w-3 flex-shrink-0 ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`} />
                </a>
              ) : null}
              {/* iOS — coming soon */}
              <div className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs ${uiTheme === "dark" ? "opacity-40" : "opacity-40"}`}>
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${uiTheme === "dark" ? "bg-[#454545] text-slate-400" : "bg-slate-200 text-slate-500"}`}>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                </span>
                <div className="min-w-0">
                  <p className="font-medium">iOS App</p>
                  <p className={`text-[10px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Coming soon</p>
                </div>
                <span className={`ml-auto text-[10px] font-semibold ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Soon</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 w-full space-y-4 md:space-y-5">
          {showDebug ? (
            <section className="rounded-xl border border-orange-200/70 bg-cyan-50 px-4 py-3 text-xs text-orange-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p>
                  <span className="font-semibold">Task Debug:</span>{" "}
                  step=<span className="font-semibold uppercase">{bootStep}</span>
                  {pageLoading ? " | loading=tasks" : ""}
                </p>
                <p className="font-mono text-[11px]">{officeUser.role.toUpperCase()}</p>
              </div>
              {authBootError ? (
                <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">
                  Error: {authBootError}
                </p>
              ) : null}
            </section>
          ) : null}

          {!showDebug && showPwaOnboarding && false ? (
            <section className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">Get field-ready setup in 3 quick steps</p>
                  <p className="mt-1 text-xs">
                    1) Add to Home Screen  2) Enable Notifications  3) Allow Location
                  </p>
                  <p className="mt-1 text-[11px] text-indigo-700">
                    Android: Install/Add to Home Screen. iPhone: Share ? Add to Home Screen.
                  </p>
                </div>
                <button onClick={dismissPwaOnboarding} className="rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700">
                  Dismiss
                </button>
              </div>
            </section>
          ) : null}

          {showInstallBanner && installPromptEvent ? (
            <section className={`rounded-2xl border px-4 py-3 shadow-sm ${uiTheme === "dark" ? "border-indigo-700/50 bg-[#f3f5f8]/40" : "border-indigo-200 bg-gradient-to-r from-indigo-50 to-white"}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${uiTheme === "dark" ? "bg-indigo-700" : "bg-indigo-600"}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="h-5 w-5"><path d="M12 17V3M5 10l7-7 7 7M19 21H5"/></svg>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${uiTheme === "dark" ? "text-indigo-100" : "text-indigo-900"}`}>Install ONROL App</p>
                    <p className={`text-xs ${uiTheme === "dark" ? "text-indigo-300" : "text-indigo-600"}`}>Faster access, offline support, and desktop shortcuts.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleInstallApp} className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">
                    Install
                  </button>
                  <button onClick={dismissInstallBanner} className={`rounded-xl border px-3 py-1.5 text-xs ${uiTheme === "dark" ? "border-slate-600 text-slate-400" : "border-slate-300 text-slate-500"}`}>
                    Not now
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {/* Mobile nav moved to fixed bottom — see bottom-nav below */}

          {(isOffline || queueSummary.total > 0 || syncingQueue) ? (
            <section className="rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-1 font-semibold ${isOffline ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>
                    {isOffline ? "Offline Mode" : "Online"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">Pending Sync: {queueSummary.pending}</span>
                  <span className="rounded-full bg-rose-100 px-2 py-1 font-semibold text-rose-700">Failed: {queueSummary.failed}</span>
                  {syncingQueue ? <span className="rounded-full bg-indigo-100 px-2 py-1 font-semibold text-indigo-700">Syncing...</span> : null}
                </div>
                <button
                  onClick={() => void processOfflineQueue()}
                  disabled={syncingQueue || isOffline || queueSummary.total === 0}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 disabled:opacity-60"
                >
                  Retry Sync
                </button>
              </div>
            </section>
          ) : null}

          {isMessengerSection ? (
            <section className="mx-auto w-full max-w-[1480px]">
            <MessengerPanel
              uiTheme={uiTheme}
              messengerMode={messengerMode}
              openMessengerSection={openMessengerSection}
              navigate={navigate}
              officeUser={officeUser}
              messengerConversationQuery={messengerConversationQuery}
              setMessengerConversationQuery={setMessengerConversationQuery}
              messengerFilteredConversations={messengerFilteredConversations}
              selectedMessengerConversation={selectedMessengerConversation}
              setMessengerConversationId={setMessengerConversationId}
              messengerMessagesByConversation={messengerMessagesByConversation}
              markMessengerConversationRead={markMessengerConversationRead}
              pinnedConversationIds={pinnedConversationIds}
              toggleConversationPin={toggleConversationPin}
              deleteConversation={deleteConversation}
              toggleConversationMute={toggleConversationMute}
              messengerDirectoryQuery={messengerDirectoryQuery}
              setMessengerDirectoryQuery={setMessengerDirectoryQuery}
              messengerDirectory={messengerDirectory}
              presenceByUserId={presenceByUserId}
              openOrCreateDirectConversation={openOrCreateDirectConversation}
              messengerActionBusy={messengerActionBusy}
              selectedConversationMessagesFiltered={selectedConversationMessagesFiltered}
              selectedConversationMessagesById={selectedConversationMessagesById}
              selectedConversationPinnedMessageIds={selectedConversationPinnedMessageIds}
              selectedConversationCanModerate={selectedConversationCanModerate}
              messengerMessageQuery={messengerMessageQuery}
              setMessengerMessageQuery={setMessengerMessageQuery}
              messengerLoading={messengerLoading}
              messengerError={messengerError}
              selectedMessageId={selectedMessageId}
              setSelectedMessageId={setSelectedMessageId}
              selectedMessageForActions={selectedMessageForActions}
              selectedMessagePinned={selectedMessagePinned}
              selectedMessageCanEdit={selectedMessageCanEdit}
              selectedMessageMine={selectedMessageMine}
              messengerReplyToId={messengerReplyToId}
              setMessengerReplyToId={setMessengerReplyToId}
              messengerEditMessageId={messengerEditMessageId}
              setMessengerEditMessageId={setMessengerEditMessageId}
              messengerEditBody={messengerEditBody}
              setMessengerEditBody={setMessengerEditBody}
              toggleMessagePin={toggleMessagePin}
              startEditingMessage={startEditingMessage}
              saveEditedMessage={saveEditedMessage}
              softDeleteMessage={softDeleteMessage}
              moderateDeleteMessage={moderateDeleteMessage}
              forwardMessages={forwardMessages}
              messengerConversations={messengerConversations}
              messengerComposer={messengerComposer}
              setMessengerComposer={setMessengerComposer}
              sendMessengerPayload={sendMessengerPayloadSafe}
              uploadMessengerFile={uploadMessengerFileSafe}
              latestGeneralTask={latestGeneralTask}
              latestJourneyTask={latestJourneyTask}
              selectedInstitution={selectedInstitution}
              sendLinkedRecordMessage={sendLinkedRecordMessage}
              showAnnouncementComposer={showAnnouncementComposer}
              setShowAnnouncementComposer={setShowAnnouncementComposer}
              announcementAcks={announcementAcks}
              announcementRepliesLocked={announcementRepliesLocked}
              acknowledgeAnnouncement={acknowledgeAnnouncement}
              toggleAnnouncementReplies={toggleAnnouncementReplies}
              loadMessengerData={loadMessengerData}
              createTeamName={createTeamName}
              setCreateTeamName={setCreateTeamName}
              createTeamDescription={createTeamDescription}
              setCreateTeamDescription={setCreateTeamDescription}
              createTeamMemberIds={createTeamMemberIds}
              setCreateTeamMemberIds={setCreateTeamMemberIds}
              createTeamGroupConversation={createTeamGroupConversation}
              selectedTeamAddMemberId={selectedTeamAddMemberId}
              setSelectedTeamAddMemberId={setSelectedTeamAddMemberId}
              addMemberToSelectedTeam={addMemberToSelectedTeam}
              removeMemberFromSelectedTeam={removeMemberFromSelectedTeam}
              selectedGroupAddableMembers={selectedGroupAddableMembers}
              selectedConversationMemberUsers={selectedConversationMemberUsers}
              announcementTitle={announcementTitle}
              setAnnouncementTitle={setAnnouncementTitle}
              announcementBody={announcementBody}
              setAnnouncementBody={setAnnouncementBody}
              createAnnouncementConversation={createAnnouncementConversation}
              markAllMessengerConversationsRead={markAllMessengerConversationsRead}
              messengerPanelBorder={messengerPanelBorder}
              messengerSoftPanel={messengerSoftPanel}
              messengerGhostBtnClass={messengerGhostBtnClass}
              messengerInlineBtnClass={messengerInlineBtnClass}
              messengerPrimaryBtnClass={messengerPrimaryBtnClass}
              messengerDangerBtnClass={messengerDangerBtnClass}
              messengerInputClass={messengerInputClass}
              initiateCall={initiateCall}
            />
            </section>
          ) : activeSection === "dashboard" ? (
            <>
              {officeUser.role === "admin" ? (
                <>

                  {/* Mobile Admin Snapshot removed — duplicated the 4-KPI grid below
                      (which is 2-col on mobile and already color-coded). */}

                  {(adminModule === "overview" || adminModule === "pipeline" || adminModule === "reports" || adminModule === "field_today") ? (
                  <section className="sticky top-3 z-20 rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-3 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="min-w-0">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Command Center</h3>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">Review overdue follow-ups first, then high-interest institutions.</p>
                        </div>
                        {/* My / Team scope toggle — always visible so admins can flip scope
                            without needing to open the filters drawer. */}
                        <div className="inline-flex shrink-0 rounded-lg border border-slate-300 p-0.5 dark:border-slate-600">
                          {(["team", "my"] as const).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setTaskScope(s)}
                              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                                taskScope === s
                                  ? "bg-indigo-600 text-white"
                                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#404040]"
                              }`}
                            >
                              {s === "team" ? "Team" : "My"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Quick inline filters — most-used only */}
                        <select className="h-8 rounded-lg border border-slate-300 px-2 text-xs" value={adminRangePreset} onChange={(e) => setAdminRangePreset(e.target.value as typeof adminRangePreset)}>
                          <option value="all">All Time</option>
                          <option value="today">Today</option>
                          <option value="this_week">This Week</option>
                          <option value="this_month">This Month</option>
                          <option value="custom">Custom</option>
                        </select>
                        <select className="h-8 rounded-lg border border-slate-300 px-2 text-xs" value={adminGlobalEmployee} onChange={(e) => setAdminGlobalEmployee(e.target.value)}>
                          <option value="all">All Employees</option>
                          {teamMembers.filter((m) => m.role === "employee").map((m) => (
                            <option key={m.id} value={m.id}>{m.full_name}</option>
                          ))}
                        </select>
                        <select className="h-8 rounded-lg border border-slate-300 px-2 text-xs" value={adminGlobalBrand} onChange={(e) => setAdminGlobalBrand(e.target.value as VisitBrand | "all")}>
                          <option value="all">All Brands</option>
                          <option value="Vivencia">Vivencia</option>
                          <option value="ONROL">ONROL</option>
                        </select>
                        <button
                          onClick={() => setShowAdminFiltersDrawer(true)}
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /></svg>
                          More Filters
                          {[adminGlobalInstitutionType, adminGlobalCity, adminGlobalVisitStatus, adminGlobalLeadStage, adminGlobalConversionStatus].filter((v) => v && v !== "all").length > 0 ? (
                            <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] text-white">
                              {[adminGlobalInstitutionType, adminGlobalCity, adminGlobalVisitStatus, adminGlobalLeadStage, adminGlobalConversionStatus].filter((v) => v && v !== "all").length}
                            </span>
                          ) : null}
                        </button>
                      </div>
                      {adminRangePreset === "custom" ? (
                        <div className="flex w-full gap-2 mt-1">
                          <input type="date" className="h-8 rounded-lg border border-slate-300 px-2 text-xs" value={adminRangeFrom} onChange={(e) => setAdminRangeFrom(e.target.value)} />
                          <input type="date" className="h-8 rounded-lg border border-slate-300 px-2 text-xs" value={adminRangeTo} onChange={(e) => setAdminRangeTo(e.target.value)} />
                        </div>
                      ) : null}
                    </div>
                  </section>
                  ) : null}

                  {adminModule === "overview" ? (
                  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: "Visits Scheduled", value: dashboardKpis.totalVisits, icon: ListTodo, trend: `+${adminDailyDigest.completedToday} closed today`, tone: "slate" },
                      { label: "Follow-ups Pending", value: dashboardKpis.followPending, icon: BellRing, trend: `${dashboardKpis.followOverdue} overdue`, tone: "amber" },
                      { label: "Active Team Today", value: dashboardKpis.activeEmployeesToday, icon: Users, trend: `${dashboardKpis.institutionsEngaged} institutions touched`, tone: "emerald" },
                      { label: "Conversion Rate", value: `${conversionRevenueKpis.conversionRate}%`, icon: GaugeCircle, trend: `${conversionRevenueKpis.totalConversions} total wins`, tone: "indigo" },
                      { label: "Revenue Realized", value: `₹${Math.round(conversionRevenueKpis.effectiveRevenue).toLocaleString("en-IN")}`, icon: CalendarRange, trend: `Expected ₹${Math.round(conversionRevenueKpis.expectedRevenue).toLocaleString("en-IN")}`, tone: "sky" },
                      { label: "High-Potential Leads", value: conversionRevenueKpis.highPotential, icon: CheckCheck, trend: `${conversionRevenueKpis.atRisk} at risk`, tone: "violet" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">{item.label}</p>
                          <item.icon className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="mt-1.5 text-xl font-semibold text-slate-900">{item.value}</p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                            item.tone === "amber"
                              ? "bg-amber-100 text-amber-800"
                              : item.tone === "emerald"
                                ? "bg-emerald-100 text-emerald-800"
                                : item.tone === "indigo"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : item.tone === "sky"
                                    ? "bg-sky-100 text-orange-800"
                                    : item.tone === "violet"
                                      ? "bg-violet-100 text-violet-800"
                                      : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {item.trend}
                        </span>
                      </div>
                    ))}
                  </section>
                  ) : null}

                  {adminModule === "team" ? (
                  <details className="rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-3 shadow-sm">
                    <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-700 hover:text-slate-900">
                      Data Health <span className="ml-1 text-[11px] font-normal text-slate-500">(maintenance)</span>
                    </summary>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] text-slate-500">Detect missing task-owner profiles before they appear as Unknown.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            void refreshTasks({ showLoading: false }).then(() => {
                              setDataHealthCheckedAt(new Date().toISOString());
                              toast.success("Data health rechecked.");
                            }).catch(() => toast.error("Health check failed."));
                          }}
                          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700"
                        >
                          Check now
                        </button>
                        <button
                          onClick={() => void runOfficeUsersBackfillViaRpc()}
                          disabled={dataHealthActionBusy === "rpc"}
                          className="rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 disabled:opacity-60"
                        >
                          {dataHealthActionBusy === "rpc" ? "Running..." : "Run Backfill via RPC"}
                        </button>
                        <button
                          onClick={async () => {
                            if (!dataHealthBackfillSql) return;
                            try {
                              await navigator.clipboard.writeText(dataHealthBackfillSql);
                              toast.success("Backfill SQL copied. Run it in Supabase SQL Editor.");
                            } catch {
                              toast.error("Unable to copy SQL. Open supabase/backfill_office_users_from_tasks.sql.");
                            }
                          }}
                          disabled={!dataHealthBackfillSql}
                          className="rounded-md border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-semibold text-indigo-700 disabled:opacity-60"
                        >
                          Copy backfill SQL
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 dark:border-[#454545] dark:bg-[#404040] px-3 py-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Missing task owners: {missingTaskOwnerIds.length}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        {dataHealthCheckedAt
                          ? `Last checked: ${new Date(dataHealthCheckedAt).toLocaleString()}`
                          : 'Click "Check now" after adding users/tasks.'}
                      </p>
                      {missingTaskOwnerIds.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {missingTaskOwnerIds.slice(0, 10).map((ownerId) => (
                            <span key={`missing-owner-${ownerId}`} className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700">
                              {ownerId.slice(0, 8)}
                            </span>
                          ))}
                          {missingTaskOwnerIds.length > 10 ? (
                            <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] text-slate-600">
                              +{missingTaskOwnerIds.length - 10} more
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs font-medium text-emerald-700">All task owners are mapped in office_users.</p>
                      )}
                    </div>
                  </details>
                  ) : null}

                  {adminModule === "team" ? (
                  <section className="grid gap-4 lg:grid-cols-5">
                    <div className="rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-4 shadow-sm lg:col-span-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">Team Task Window</h3>
                        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 dark:border-[#454545] dark:bg-[#404040] p-1">
                          {[
                            { key: "today", label: "Today" },
                            { key: "this_month", label: "This Month" },
                            { key: "all", label: "All" },
                          ].map((option) => (
                            <button
                              key={option.key}
                              onClick={() => setAdminRangePreset(option.key as typeof adminRangePreset)}
                              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                                adminRangePreset === option.key
                                  ? "bg-[#f3f5f8] text-white"
                                  : "text-slate-600 hover:bg-white"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Mobile: stacked cards. Desktop: same table as before. */}
                      <div className="mt-3 space-y-2 sm:hidden">
                        {adminMemberTaskRows.map((row) => (
                          <button
                            key={`overview-member-mobile-${row.member.id}`}
                            type="button"
                            onClick={() => { setSelectedEmployeeId(row.member.id); setAdminMemberDrawerOpen(true); }}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg border p-3 text-left transition-colors ${
                              selectedEmployeeId === row.member.id
                                ? "border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-[#f3f5f8]/30"
                                : "border-slate-200 bg-white dark:border-[#454545] dark:bg-[#f3f5f8]"
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{row.member.full_name}</p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.member.role} • {row.member.department || "Operations"}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 text-[11px]">
                              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700 dark:bg-[#404040] dark:text-slate-300" title="Total">{row.total}</span>
                              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" title="Pending">{row.pending}</span>
                              <span className="rounded-md bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" title="Overdue">{row.overdue}</span>
                            </div>
                          </button>
                        ))}
                        {!adminMemberTaskRows.length ? (
                          <EmptyState uiTheme={uiTheme} size="compact" title="No team members" subtitle="Invite employees from the Admin Tools → Institutions area." />
                        ) : null}
                      </div>
                      <div className="mt-3 hidden max-h-[380px] overflow-auto rounded-xl border border-slate-200 dark:border-[#454545] sm:block">
                        <table className="crm-data-table min-w-full">
                          <thead>
                            <tr>
                              <th className="px-2 py-2 text-left">Member</th>
                              <th className="px-2 py-2 text-left">Total</th>
                              <th className="px-2 py-2 text-left">Pending</th>
                              <th className="px-2 py-2 text-left">Overdue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {adminMemberTaskRows.map((row) => (
                              <tr
                                key={`overview-member-${row.member.id}`}
                                onClick={() => {
                                  setSelectedEmployeeId(row.member.id);
                                  setAdminMemberDrawerOpen(true);
                                }}
                                className={`cursor-pointer ${selectedEmployeeId === row.member.id ? "bg-slate-100/80 dark:bg-[#404040]/80" : ""}`}
                              >
                                <td className="px-2 py-2">
                                  <p className="font-semibold text-slate-900 dark:text-slate-100">{row.member.full_name}</p>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.member.role} • {row.member.department || "Operations"}</p>
                                </td>
                                <td className="px-2 py-2">{row.total}</td>
                                <td className="px-2 py-2">{row.pending}</td>
                                <td className="px-2 py-2 text-rose-700">{row.overdue}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {!adminMemberTaskRows.length ? (
                          <div className="p-3">
                            <EmptyState uiTheme={uiTheme} size="compact" title="No team members" subtitle="Invite employees from the Admin Tools → Institutions area." />
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-4 shadow-sm lg:col-span-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {selectedMemberTaskWindow?.member.full_name || "Member"} • Task Snapshot
                        </h3>
                        <button
                          onClick={() => setAdminMemberDrawerOpen(true)}
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Open Detail Drawer
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-[#454545] dark:bg-[#404040] px-2.5 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">Total</p>
                          <p className="text-base font-semibold text-slate-900">{selectedMemberTaskWindow?.total || 0}</p>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-emerald-700">Completed</p>
                          <p className="text-base font-semibold text-emerald-900">{selectedMemberTaskWindow?.completed || 0}</p>
                        </div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-amber-700">Pending</p>
                          <p className="text-base font-semibold text-amber-900">{selectedMemberTaskWindow?.pending || 0}</p>
                        </div>
                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2">
                          <p className="text-[11px] uppercase tracking-wide text-rose-700">Overdue</p>
                          <p className="text-base font-semibold text-rose-900">{selectedMemberTaskWindow?.overdue || 0}</p>
                        </div>
                      </div>
                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs text-slate-600">
                          Use the drawer to review full task details, statuses, priorities, and due dates in a focused Salesforce-style panel.
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(selectedMemberTaskWindow?.filtered || []).slice(0, 6).map((task) => (
                            <span key={`overview-chip-${task.id}`} className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-700">
                              {task.task_title}
                            </span>
                          ))}
                          {selectedMemberTaskWindow && !selectedMemberTaskWindow.filtered.length ? (
                            <span className="text-xs text-slate-500">No tasks in this range.</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </section>
                  ) : null}

                  {adminModule === "overview" ? (
                  <section className={`rounded-xl border p-4 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Action Hub</h3>
                        <p className={`text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>What needs attention right now.</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${uiTheme === "dark" ? "bg-[#404040] text-slate-300" : "bg-slate-100 text-slate-700"}`}>
                        {opsInboxRows.length} open
                      </span>
                    </div>

                    {/* Pill strip: follow-up counters + attention alerts in one row. */}
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                      <span className="rounded-full border border-orange-200 bg-sky-50 px-2.5 py-1 font-semibold text-orange-800">Due today {followUpControl.dueToday.length}</span>
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-semibold text-rose-800">Overdue {followUpControl.overdue.length}</span>
                      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-800">Tomorrow {followUpControl.dueTomorrow.length}</span>
                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-semibold text-violet-800">Visits tomorrow {followUpControl.scheduledVisitsTomorrow.length}</span>
                      {attentionAlerts.map((alert) => (
                        <span
                          key={alert.key}
                          className={`rounded-full border px-2.5 py-1 font-semibold ${
                            alert.severity === "high"
                              ? "border-rose-300 bg-rose-100 text-rose-800"
                              : alert.severity === "medium"
                                ? "border-amber-300 bg-amber-100 text-amber-800"
                                : "border-slate-300 bg-slate-100 text-slate-700"
                          }`}
                        >
                          {alert.label}: {alert.count}
                        </span>
                      ))}
                    </div>
                    {/* Mobile: stacked action cards. Desktop: original table. */}
                    <div className="mt-3 space-y-2 sm:hidden">
                      {opsInboxRows.map((row) => (
                        <button
                          key={`ops-mobile-${row.id}`}
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeId(row.task.user_id);
                            if (row.kind === "overdue_followup" || row.kind === "due_today" || row.kind === "stale_visit") {
                              setActiveSection("journey");
                              navigate("/task/journey", { replace: true });
                              setExpandedVisitTaskId(row.task.id);
                            } else {
                              setActiveSection("tasks");
                              navigate("/task/tasks", { replace: true });
                              setExpandedAuditTaskId(row.task.id);
                            }
                          }}
                          className={`flex w-full items-start gap-2 rounded-lg border p-3 text-left transition-colors ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8] hover:bg-[#404040]/80" : "border-slate-200 bg-white hover:bg-slate-50"}`}
                        >
                          <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            row.severity === "high" ? "bg-rose-100 text-rose-700" : row.severity === "medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600 dark:bg-[#454545] dark:text-slate-300"
                          }`}>
                            {row.severity}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>{row.title}</p>
                            <p className={`mt-0.5 text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                              {row.owner}{row.dueDate ? ` · Due ${row.dueDate}` : ""}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">{row.actionLabel} →</p>
                          </div>
                        </button>
                      ))}
                      {!opsInboxRows.length ? (
                        <EmptyState uiTheme={uiTheme} size="compact" title="Inbox is clear" subtitle="No open ops items for the current filters." />
                      ) : null}
                    </div>
                    <div className={`mt-3 hidden max-h-72 overflow-auto rounded-xl border sm:block ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-200"}`}>
                      <table className="crm-data-table min-w-full text-[12px]">
                        <thead className={`sticky top-0 ${uiTheme === "dark" ? "bg-[#f3f5f8]/95" : "bg-white/95"} backdrop-blur`}>
                          <tr className={`${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"} text-left text-[11px] font-semibold uppercase tracking-wide`}>
                            <th className="px-2.5 py-2">Priority</th>
                            <th className="px-2.5 py-2">Action Item</th>
                            <th className="px-2.5 py-2">Owner</th>
                            <th className="px-2.5 py-2">Due</th>
                            <th className="px-2.5 py-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {opsInboxRows.map((row) => (
                            <tr key={row.id} className={`border-t ${uiTheme === "dark" ? "border-[#454545] hover:bg-[#404040]/70" : "border-slate-100 hover:bg-slate-50/80"}`}>
                              <td className="px-2.5 py-2">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  row.severity === "high"
                                    ? "bg-rose-100 text-rose-700"
                                    : row.severity === "medium"
                                      ? "bg-amber-100 text-amber-700"
                                      : uiTheme === "dark"
                                        ? "bg-[#454545] text-slate-300"
                                        : "bg-slate-100 text-slate-600"
                                }`}>
                                  {row.severity}
                                </span>
                              </td>
                              <td className={`px-2.5 py-2 font-medium ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>{row.title}</td>
                              <td className={`px-2.5 py-2 ${uiTheme === "dark" ? "text-slate-300" : "text-slate-600"}`}>{row.owner}</td>
                              <td className={`px-2.5 py-2 ${uiTheme === "dark" ? "text-slate-300" : "text-slate-600"}`}>{row.dueDate || "-"}</td>
                              <td className="px-2.5 py-2">
                                <button
                                  onClick={() => {
                                    setSelectedEmployeeId(row.task.user_id);
                                    if (row.kind === "overdue_followup" || row.kind === "due_today" || row.kind === "stale_visit") {
                                      setActiveSection("journey");
                                      navigate("/task/journey", { replace: true });
                                      setExpandedVisitTaskId(row.task.id);
                                    } else {
                                      setActiveSection("tasks");
                                      navigate("/task/tasks", { replace: true });
                                      setExpandedAuditTaskId(row.task.id);
                                    }
                                  }}
                                  className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-200" : "border-slate-300 bg-white text-slate-700"}`}
                                >
                                  {row.actionLabel}
                                </button>
                              </td>
                            </tr>
                          ))}
                          {!opsInboxRows.length ? (
                            <tr>
                              <td colSpan={5} className={`px-3 py-6 text-center text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>
                                Ops inbox is clear for current filters.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  ) : null}

                  {adminModule === "team" ? (
                  <section className="grid gap-4">
                    <div className={`rounded-xl border p-4 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>SLA Heat Map</h3>
                        <p className={`text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Risk score by employee workload and overdue pressure.</p>
                      </div>
                      <div className="mt-3 space-y-2">
                        {slaHeatRows.map((row) => (
                          <button
                            key={`sla-${row.member.id}`}
                            onClick={() => { setSelectedEmployeeId(row.member.id); setAdminModule("team"); setActiveSection("dashboard"); }}
                            className={`w-full rounded-lg border p-2 text-left transition ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] hover:bg-[#454545]" : "border-slate-200 bg-slate-50 hover:bg-white"}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-xs font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{row.member.full_name}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                row.heat === "critical"
                                  ? "bg-rose-100 text-rose-700"
                                  : row.heat === "high"
                                    ? "bg-amber-100 text-amber-700"
                                    : row.heat === "moderate"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-emerald-100 text-emerald-700"
                              }`}>
                                {row.heat}
                              </span>
                            </div>
                            <div className={`mt-1 h-2 rounded-full ${uiTheme === "dark" ? "bg-[#454545]" : "bg-slate-200"}`}>
                              <div className={`h-2 rounded-full ${
                                row.riskScore >= 75 ? "bg-rose-500" : row.riskScore >= 50 ? "bg-amber-500" : row.riskScore >= 25 ? "bg-yellow-500" : "bg-emerald-500"
                              }`} style={{ width: `${Math.max(8, row.riskScore)}%` }} />
                            </div>
                            <div className={`mt-1 flex items-center justify-between text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                              <span>Overdue {row.overdue} • Due today {row.dueToday}</span>
                              <span>Completion {row.completionRate}%</span>
                            </div>
                          </button>
                        ))}
                        {!slaHeatRows.length ? <p className={`text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>No employee data for SLA heat map.</p> : null}
                      </div>
                    </div>
                  </section>
                  ) : null}

                  {adminModule === "pipeline" ? (
                  <section className="grid gap-4">
                    <div className={`rounded-xl border p-4 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Institution Health Scoring</h3>
                        <p className={`text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Lowest score = highest intervention priority.</p>
                      </div>
                      <div className={`mt-3 max-h-72 overflow-auto rounded-xl border ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-200"}`}>
                        <table className="crm-data-table min-w-full text-[12px]">
                          <thead className={`sticky top-0 ${uiTheme === "dark" ? "bg-[#f3f5f8]/95" : "bg-white/95"} backdrop-blur`}>
                            <tr className={`${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"} text-left text-[11px] font-semibold uppercase tracking-wide`}>
                              <th className="px-2.5 py-2">Institution</th>
                              <th className="px-2.5 py-2">Score</th>
                              <th className="px-2.5 py-2">Band</th>
                              <th className="px-2.5 py-2">Signals</th>
                            </tr>
                          </thead>
                          <tbody>
                            {institutionHealthRows.slice(0, 24).map((row) => (
                              <tr key={`health-${row.institution.id}`} className={`border-t ${uiTheme === "dark" ? "border-[#454545] hover:bg-[#404040]/70" : "border-slate-100 hover:bg-slate-50/80"}`}>
                                <td className={`px-2.5 py-2 font-medium ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>{row.institution.name}</td>
                                <td className={`px-2.5 py-2 font-semibold ${row.healthScore < 50 ? "text-rose-600" : row.healthScore < 75 ? "text-amber-600" : "text-emerald-600"}`}>{row.healthScore}</td>
                                <td className="px-2.5 py-2">
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    row.band === "critical"
                                      ? "bg-rose-100 text-rose-700"
                                      : row.band === "watch"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-700"
                                  }`}>{row.band}</span>
                                </td>
                                <td className={`px-2.5 py-2 text-[11px] ${uiTheme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                                  Overdue {row.overdueFollowups} • Last active {row.lastActivityGapDays}d
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </section>
                  ) : null}

                  {adminModule === "team" ? (
                  <section className={`rounded-xl border p-4 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Team Visit Timeline (Gantt)</h3>
                      <div className="flex items-center gap-2">
                        {adminGanttRows.tickDates.map((d) => (
                          <span key={`tick-${d}`} className={`text-[10px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>{d}</span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {adminGanttRows.rows.slice(0, 8).map((row) => (
                        <div key={`gantt-${row.member.id}`} className={`rounded-lg border p-2 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/70" : "border-slate-200 bg-slate-50/80"}`}>
                          <p className={`mb-1 text-[11px] font-semibold ${uiTheme === "dark" ? "text-slate-200" : "text-slate-700"}`}>{row.member.full_name}</p>
                          <div className={`relative h-8 overflow-hidden rounded-md ${uiTheme === "dark" ? "bg-[#f3f5f8]" : "bg-white"}`}>
                            {row.bars.map((bar) => (
                              <div
                                key={`bar-${bar.task.id}-${bar.left}`}
                                className={`absolute top-1 h-6 rounded px-2 text-[10px] font-semibold text-white ${
                                  bar.tone === "emerald"
                                    ? "bg-emerald-500"
                                    : bar.tone === "amber"
                                      ? "bg-amber-500"
                                      : bar.tone === "indigo"
                                        ? "bg-indigo-500"
                                        : "bg-sky-500"
                                }`}
                                style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
                                title={`${bar.task.institution_name || bar.task.task_title} • ${(bar.task.visit_date || bar.task.assigned_date)}`}
                              >
                                <span className="block truncate">{bar.task.institution_name || bar.task.task_title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {!adminGanttRows.rows.length ? <p className={`text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>No timeline tasks available in selected filters.</p> : null}
                    </div>
                  </section>
                  ) : null}

                  {adminModule === "team" ? (
                  <section className="grid gap-4 lg:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-4 shadow-sm lg:col-span-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">Employee Performance Overview</h3>
                        <p className="text-xs text-slate-500">Track activity, follow-up load, and visit coverage.</p>
                      </div>
                      <div className="mt-3 max-h-[520px] overflow-auto rounded-xl border border-slate-200">
                        <table className="crm-data-table min-w-full text-[12px]">
                          <thead className="sticky top-0 z-10 bg-white/95 backdrop-blur">
                            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              <th className="px-2.5 py-2">Employee</th>
                              <th className="px-2.5 py-2">Visits</th>
                              <th className="px-2.5 py-2">Completed</th>
                              <th className="px-2.5 py-2">Pending</th>
                              <th className="px-2.5 py-2">Overdue</th>
                              <th className="px-2.5 py-2">Institutions</th>
                              <th className="px-2.5 py-2">Conv.</th>
                              <th className="px-2.5 py-2">Rate</th>
                              <th className="px-2.5 py-2">Revenue</th>
                              <th className="px-2.5 py-2">State</th>
                            </tr>
                          </thead>
                          <tbody>
                            {employeePerformanceRows.map((row) => (
                              <tr
                                key={row.member.id}
                                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50/80"
                                onClick={() => {
                                  setSelectedEmployeeId(row.member.id);
                                  navigate(`/admin/employees/${row.member.id}`);
                                }}
                              >
                                <td className="px-2.5 py-1.5 font-medium text-slate-800">{row.member.full_name}</td>
                                <td className="px-2.5 py-1.5">{row.visits}</td>
                                <td className="px-2.5 py-1.5">{row.completed}</td>
                                <td className="px-2.5 py-1.5">{row.followPending}</td>
                                <td className="px-2.5 py-1.5 text-rose-700">{row.overdue}</td>
                                <td className="px-2.5 py-1.5">{row.institutionsHandled}</td>
                                <td className="px-2.5 py-1.5">{row.conversions}</td>
                                <td className="px-2.5 py-1.5">{row.conversionRate}%</td>
                                <td className="px-2.5 py-1.5">?{Math.round(row.revenue).toLocaleString("en-IN")}</td>
                                <td className="px-2.5 py-1.5">
                                  <span className={`rounded-full px-2 py-1 text-[11px] ${row.state === "active_today" ? "bg-emerald-100 text-emerald-700" : row.state === "active_recently" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                                    {row.state === "active_today" ? "Active Today" : row.state === "active_recently" ? "Active Recently" : "Inactive"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-4 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-900">Recent Activity Feed</h3>
                      <div className="mt-3 max-h-64 space-y-2 overflow-auto">
                        {recentActivity.map((item) => {
                          const actor = teamMembers.find((m) => m.id === item.actor_user_id);
                          return (
                            <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 dark:border-[#454545] dark:bg-[#404040] px-2 py-1.5 text-xs">
                              <p className="font-medium text-slate-800">{item.event_summary}</p>
                              <p className="text-slate-500">{actor?.full_name || "System"} • {new Date(item.created_at).toLocaleString()}</p>
                            </div>
                          );
                        })}
                        {!recentActivity.length ? <p className="text-xs text-slate-500">No recent activity found.</p> : null}
                      </div>
                    </div>
                  </section>
                  ) : null}

                  {adminModule === "pipeline" ? (
                  <section className="rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">Institution Pipeline Overview</h3>
                      <p className="text-xs text-slate-500">Review movement from visit to conversion.</p>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-3 lg:grid-cols-4">
                      {pipelineByStage.map((item) => (
                        <button
                          key={item.stage}
                          onClick={() => {
                            setAdminInstitutionLeadStageFilter(item.stage);
                            setActiveSection("institutions");
                            navigate("/task/institutions", { replace: true });
                          }}
                          className="rounded-lg border border-slate-200 bg-slate-50 dark:border-[#454545] dark:bg-[#404040] p-3 text-left hover:bg-white"
                        >
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">{formatChipLabel(item.stage)}</p>
                          <p className="mt-1 text-xl font-semibold text-slate-900">{item.count}</p>
                          {item.sample[0] ? <p className="mt-1 text-xs text-slate-500">e.g. {item.sample[0].name}</p> : null}
                        </button>
                      ))}
                    </div>
                  </section>
                  ) : null}

                  {adminModule === "pipeline" ? (
                  <section className="rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">Brand Conversion & Revenue</h3>
                      <p className="text-xs text-slate-500">Vivencia vs ONROL · avg time to convert {avgTimeToConversionDays}d</p>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {[brandConversionPerformance.vivencia, brandConversionPerformance.onrol].map((row) => (
                        <div key={row.brand} className="rounded-lg border border-slate-200 bg-slate-50 dark:border-[#454545] dark:bg-[#404040] p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.brand}</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{row.visits} visits</p>
                          <p className="text-xs text-slate-600">
                            Interested {row.interested} • Proposal {row.proposals} • Demo {row.demos}
                          </p>
                          <p className="text-xs text-slate-600">
                            Conversions {row.conversions} • Rate {row.conversionRate}%
                          </p>
                          <p className="mt-1 text-xs font-semibold text-emerald-700">
                            Revenue ₹{Math.round(row.revenue).toLocaleString("en-IN")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>
                  ) : null}

                  {adminModule === "field_today" ? (() => {
                    const todayIso = new Date().toISOString().slice(0, 10);
                    const usersById = new Map((teamMembers || []).map((u) => [u.id, u]));
                    const instsById = new Map((institutions || []).map((i) => [i.id, i]));
                    const todays = (tasks || []).filter((t) => {
                      const d = t.visit_date || t.assigned_date;
                      return d === todayIso && t.task_category === "visit";
                    });
                    const planned    = todays.filter((t) => (t.visit_status ?? "planned") === "planned").length;
                    const reached    = todays.filter((t) => t.visit_status === "reached").length;
                    const inMeeting  = todays.filter((t) => t.visit_status === "in_meeting").length;
                    const completed  = todays.filter((t) => t.visit_status === "completed").length;
                    const fuPending  = todays.filter((t) => t.visit_status === "followup_pending").length;
                    // Idle = reached >30 min ago and meeting not started
                    const now = Date.now();
                    const idleAtSite = todays.filter((t) => {
                      if (t.visit_status !== "reached" || !t.check_in_at) return false;
                      const reachedAt = new Date(t.check_in_at).getTime();
                      return Number.isFinite(reachedAt) && (now - reachedAt) > 30 * 60_000 && !t.meeting_started_at;
                    }).length;

                    // One row per employee with at least one visit today (or any active visit_status)
                    const byEmployee = new Map<string, { user: typeof teamMembers[number]; rows: typeof todays }>();
                    for (const t of todays) {
                      const u = usersById.get(t.user_id);
                      if (!u) continue;
                      if (!byEmployee.has(u.id)) byEmployee.set(u.id, { user: u, rows: [] });
                      byEmployee.get(u.id)!.rows.push(t);
                    }
                    const fmtSince = (iso?: string | null) => {
                      if (!iso) return "—";
                      const ms = now - new Date(iso).getTime();
                      if (!Number.isFinite(ms) || ms < 0) return "—";
                      const m = Math.floor(ms / 60_000);
                      if (m < 1) return "just now";
                      if (m < 60) return `${m}m ago`;
                      const h = Math.floor(m / 60);
                      return `${h}h ${m % 60}m ago`;
                    };
                    const stagePill = (s: string | null | undefined) => {
                      const map: Record<string, string> = {
                        planned:           "bg-sky-100 text-orange-700",
                        reached:           "bg-amber-100 text-amber-700",
                        in_meeting:        "bg-indigo-100 text-indigo-700",
                        completed:         "bg-emerald-100 text-emerald-700",
                        followup_pending:  "bg-amber-100 text-amber-700",
                        rescheduled:       "bg-rose-100 text-rose-700",
                        closed_lost:       "bg-slate-100 text-slate-600",
                      };
                      return map[s ?? "planned"] ?? "bg-slate-100 text-slate-600";
                    };
                    const stageLabel = (s: string | null | undefined) => (s ?? "planned").replace(/_/g, " ");

                    return (
                      <>
                        {/* KPI strip */}
                        <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                          {[
                            { label: "Today",       value: todays.length,  cls: "border-slate-200 bg-white" },
                            { label: "Planned",     value: planned,        cls: "border-orange-200 bg-sky-50" },
                            { label: "Reached",     value: reached,        cls: "border-amber-200 bg-amber-50" },
                            { label: "In Meeting",  value: inMeeting,      cls: "border-indigo-200 bg-indigo-50" },
                            { label: "Completed",   value: completed,      cls: "border-emerald-200 bg-emerald-50" },
                            { label: "Idle ≥ 30m",  value: idleAtSite,     cls: idleAtSite ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white" },
                          ].map((k) => (
                            <div key={k.label} className={`rounded-xl border px-3 py-2 ${k.cls}`}>
                              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{k.label}</p>
                              <p className="mt-0.5 text-xl font-bold text-slate-900">{k.value}</p>
                            </div>
                          ))}
                        </section>

                        {/* Live employee grid */}
                        <section className="mt-3 rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-4 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-semibold text-slate-900">Field Activity — Today</h3>
                            <p className="text-xs text-slate-500">{byEmployee.size} active · follow-up pending {fuPending}</p>
                          </div>
                          {byEmployee.size === 0 ? (
                            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                              No field visits scheduled today.
                            </p>
                          ) : (
                            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                              {Array.from(byEmployee.values()).map(({ user, rows }) => {
                                const active = rows.find((r) => r.visit_status === "reached" || r.visit_status === "in_meeting") ?? rows[0];
                                const inst = active.institution_id ? instsById.get(active.institution_id) : null;
                                const lastChange = active.meeting_started_at || active.check_in_at || active.updated_at;
                                const phone = inst?.primary_contact_phone || "";
                                return (
                                  <div key={user.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-[#454545] dark:bg-[#404040]">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-slate-900">{user.full_name}</p>
                                        <p className="truncate text-[11px] text-slate-500">{user.department || user.role}</p>
                                      </div>
                                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${stagePill(active.visit_status)}`}>
                                        {stageLabel(active.visit_status)}
                                      </span>
                                    </div>
                                    <div className="mt-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[12px]">
                                      <p className="truncate font-medium text-slate-800">{active.institution_name || active.task_title || "—"}</p>
                                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                        {inst?.city || "—"} · last update {fmtSince(lastChange)}
                                      </p>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                      {phone ? (
                                        <a href={`tel:${phone}`} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                                          Call
                                        </a>
                                      ) : null}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedEmployeeId(user.id);
                                          setActiveSection("tasks");
                                          setAdminModule("tasks");
                                          setExpandedAuditTaskId(active.id);
                                          navigate("/task/tasks", { replace: true });
                                        }}
                                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        Open Visit
                                      </button>
                                      {rows.length > 1 ? (
                                        <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                          +{rows.length - 1} more today
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </section>
                      </>
                    );
                  })() : null}

                  {adminModule === "reports" ? (
                  <section className={`rounded-xl border p-4 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Reports & Data Tools</h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => {
                            const usersById = new Map((teamMembers || []).map((u) => [u.id, u]));
                            const instsById = new Map((institutions || []).map((i) => [i.id, i]));
                            const enriched = (visibleTasks || []).map((t) => {
                              const u = usersById.get(t.user_id);
                              const inst = t.institution_id ? instsById.get(t.institution_id) : null;
                              return {
                                ...t,
                                user_full_name: u?.full_name || "",
                                institution_strength: inst?.strength ?? "",
                                institution_address: inst ? [inst.address_line_1, inst.address_line_2, inst.area, inst.city].filter(Boolean).join(", ") : "",
                                institution_contact_name: inst?.primary_contact_name || "",
                                institution_contact_designation: inst?.primary_contact_designation || "",
                                institution_contact_phone: inst?.primary_contact_phone || "",
                                institution_contact_email: inst?.primary_contact_email || "",
                              };
                            });
                            void exportTasksCsv?.(enriched as unknown as Array<Record<string, unknown>>);
                          }}
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white ${uiTheme === "dark" ? "bg-indigo-600 hover:bg-indigo-500" : "bg-[#f3f5f8] hover:bg-[#f3f5f8]/90"}`}
                        >
                          <Download className="h-3.5 w-3.5" /> Export DSR (xlsx)
                        </button>
                        <button
                          onClick={exportConversionAnalyticsCsv}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-200" : "border-slate-300 text-slate-700"}`}
                        >
                          <Download className="h-3.5 w-3.5" /> Intelligence CSV
                        </button>
                        <button
                          onClick={downloadTemplate}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-200" : "border-slate-300 text-slate-700"}`}
                        >
                          <FileDown className="h-3.5 w-3.5" /> Template
                        </button>
                        <button
                          onClick={() => { setShowImportPanel((p) => !p); setActiveSection("tasks"); setAdminModule("tasks"); navigate("/task/tasks", { replace: true }); }}
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-200" : "border-slate-300 text-slate-700"}`}
                        >
                          <Upload className="h-3.5 w-3.5" /> Import
                        </button>
                      </div>
                    </div>
                    <p className={`mt-1 text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                      DSR uses the current Tasks filters. Import opens the Tasks importer.
                    </p>

                    <div className={`mt-3 inline-flex rounded-lg border p-1 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                      {([
                        { key: "insights", label: "AI Insights" },
                        { key: "history", label: "Meeting & Task History" },
                        { key: "logs", label: "Delivery Log" },
                      ] as const).map((item) => (
                        <button
                          key={`report-section-${item.key}`}
                          onClick={() => setReportSection(item.key)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                            reportSection === item.key
                              ? "bg-[#f3f5f8] text-white"
                              : uiTheme === "dark"
                                ? "text-slate-300 hover:bg-[#454545]"
                                : "text-slate-600 hover:bg-white"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {reportSection === "insights" ? (
                      <div className="mt-3 space-y-3">
                        {/* Plain-English lead summary so the grid of numbers below lands in context */}
                        <p className={`text-[13px] ${uiTheme === "dark" ? "text-slate-300" : "text-slate-600"}`}>
                          <span className="font-semibold">{conversionRevenueKpis.totalConversions}</span> conversions out of{" "}
                          <span className="font-semibold">{conversionRevenueKpis.totalInstitutions}</span> institutions ({conversionRevenueKpis.conversionRate}%).{" "}
                          {conversionRevenueKpis.atRisk > 0
                            ? <><span className="font-semibold text-rose-600">{conversionRevenueKpis.atRisk}</span> at-risk need attention.</>
                            : "No leads currently flagged at risk."}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className={`rounded-lg border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                            <p className={`text-[11px] uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Stuck Leads</p>
                            <p className={`mt-1 text-xl font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{conversionRevenueKpis.stalled}</p>
                            <p className={`mt-1 text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Conversion, revenue and lead health KPIs are on the Overview page.</p>
                          </div>
                        </div>
                        <div className="grid gap-2 md:grid-cols-3">
                          {reportInsightCards.map((card) => (
                            <div key={card.label} className={`rounded-lg border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/80" : "border-slate-200 bg-white"}`}>
                              <p className={`text-[11px] uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{card.label}</p>
                              <p className={`mt-1 text-lg font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{card.value}</p>
                              <p className={`mt-1 text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>{card.note}</p>
                            </div>
                          ))}
                        </div>
                        {automationAiResponse ? (
                          <div className={`rounded-lg border p-3 text-xs whitespace-pre-wrap ${uiTheme === "dark" ? "border-indigo-700 bg-[#f3f5f8]/20 text-indigo-200" : "border-indigo-200 bg-indigo-50 text-indigo-900"}`}>
                            {automationAiResponse}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {reportSection === "history" ? (
                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        <div className={`rounded-lg border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/70" : "border-slate-200 bg-slate-50/70"}`}>
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-300" : "text-slate-600"}`}>Meeting History</p>
                            <span className={`text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{meetingHistoryRows.length} records</span>
                          </div>
                          <div className="mt-2 max-h-72 space-y-2 overflow-auto">
                            {meetingHistoryRows.map((row) => (
                              <details key={`meeting-history-${row.id}`} className={`rounded border px-2.5 py-2 ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                                <summary className={`cursor-pointer text-xs font-medium ${uiTheme === "dark" ? "text-slate-200" : "text-slate-800"}`}>
                                  {row.roomName} • {Math.max(1, Math.round(row.durationSeconds / 60))} min • {new Date(row.endedAt).toLocaleString()}
                                </summary>
                                <p className={`mt-1 text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                                  Code: {row.roomCode} • Host: {row.hostName} • Peak: {row.participantPeak}
                                </p>
                                <p className={`mt-1 text-[11px] ${uiTheme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{row.summary}</p>
                                {row.transcript ? (
                                  <p className={`mt-1 text-[11px] whitespace-pre-wrap ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                                    Transcript: {row.transcript.slice(0, 500)}{row.transcript.length > 500 ? "…" : ""}
                                  </p>
                                ) : null}
                                {row.actionItems?.length ? (
                                  <div className="mt-2">
                                    <p className={`text-[11px] font-semibold ${uiTheme === "dark" ? "text-slate-300" : "text-slate-700"}`}>Action Items</p>
                                    <ul className={`mt-1 space-y-1 text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                                      {row.actionItems.slice(0, 5).map((item) => (
                                        <li key={`${row.id}-action-${item}`} className="rounded bg-slate-500/10 px-2 py-1">{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}
                                {row.decisions?.length ? (
                                  <div className="mt-2">
                                    <p className={`text-[11px] font-semibold ${uiTheme === "dark" ? "text-slate-300" : "text-slate-700"}`}>Decisions</p>
                                    <ul className={`mt-1 space-y-1 text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                                      {row.decisions.slice(0, 5).map((item) => (
                                        <li key={`${row.id}-decision-${item}`} className="rounded bg-indigo-500/10 px-2 py-1">{item}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}
                                <div className="mt-2 flex flex-wrap justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const date = new Date(row.endedAt).toLocaleString();
                                      const mins = Math.max(1, Math.round(row.durationSeconds / 60));
                                      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Meeting Minutes – ${row.roomName}</title>
<style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a}h1{font-size:22px;border-bottom:2px solid #f3f5f8;padding-bottom:8px}h2{font-size:14px;color:#f3f5f8;margin-top:20px;text-transform:uppercase;letter-spacing:.05em}p,li{font-size:13px;line-height:1.6}ul{padding-left:20px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;background:#f8fafc;padding:12px;border-radius:8px;margin:16px 0}.meta-item{font-size:12px}.meta-item span{font-weight:600}@media print{body{margin:20px}}</style></head>
<body><h1>Meeting Minutes</h1>
<div class="meta">
<div class="meta-item"><span>Room:</span> ${row.roomName} (${row.roomCode})</div>
<div class="meta-item"><span>Date:</span> ${date}</div>
<div class="meta-item"><span>Duration:</span> ${mins} minutes</div>
<div class="meta-item"><span>Host:</span> ${row.hostName}</div>
<div class="meta-item"><span>Peak Participants:</span> ${row.participantPeak}</div>
</div>
${row.summary ? `<h2>Summary</h2><p>${row.summary}</p>` : ""}
${row.actionItems?.length ? `<h2>Action Items</h2><ul>${row.actionItems.map(i => `<li>${i}</li>`).join("")}</ul>` : ""}
${row.decisions?.length ? `<h2>Decisions</h2><ul>${row.decisions.map(d => `<li>${d}</li>`).join("")}</ul>` : ""}
${row.transcript ? `<h2>Transcript</h2><p style="white-space:pre-wrap;font-size:11px;color:#555">${row.transcript}</p>` : ""}
</body></html>`;
                                      const blob = new Blob([html], { type: "text/html" });
                                      const a = document.createElement("a");
                                      a.href = URL.createObjectURL(blob);
                                      a.download = `meeting-minutes-${row.roomCode}-${new Date(row.endedAt).toISOString().slice(0,10)}.html`;
                                      a.click();
                                      URL.revokeObjectURL(a.href);
                                    }}
                                    className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <FileText size={11} /> Download Minutes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!row.actionItems?.length) return;
                                      setMeetingAssigneeDialog({
                                        row,
                                        assignments: Object.fromEntries(
                                          row.actionItems.slice(0, 8).map((_, i) => [i, officeUser?.id ?? ""])
                                        ),
                                      });
                                    }}
                                    disabled={Boolean(meetingTaskConvertBusyById[row.id]) || !row.actionItems?.length}
                                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                                      Boolean(meetingTaskConvertBusyById[row.id]) || !row.actionItems?.length
                                        ? "cursor-not-allowed bg-slate-400/20 text-slate-400"
                                        : "bg-[#f3f5f8] text-white hover:bg-[#f3f5f8]/90"
                                    }`}
                                  >
                                    {meetingTaskConvertBusyById[row.id] ? "Converting…" : "Convert to Tasks"}
                                  </button>
                                </div>
                              </details>
                            ))}
                            {!meetingHistoryRows.length ? <p className={`text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>No meeting sessions logged yet.</p> : null}
                          </div>
                        </div>
                        <div className={`rounded-lg border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/70" : "border-slate-200 bg-slate-50/70"}`}>
                          <div className="flex items-center justify-between">
                            <p className={`text-xs font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-300" : "text-slate-600"}`}>Task History</p>
                            <span className={`text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{taskHistoryRows.length} records</span>
                          </div>
                          <div className="mt-2 max-h-72 overflow-auto">
                            <table className="min-w-full text-[11px]">
                              <thead>
                                <tr className={uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}>
                                  <th className="px-2 py-1 text-left">Time</th>
                                  <th className="px-2 py-1 text-left">Task</th>
                                  <th className="px-2 py-1 text-left">Change</th>
                                  <th className="px-2 py-1 text-left">By</th>
                                </tr>
                              </thead>
                              <tbody>
                                {taskHistoryRows.map((row) => (
                                  <tr key={`task-history-${row.id}`} className={uiTheme === "dark" ? "border-t border-[#454545] text-slate-300" : "border-t border-slate-200 text-slate-700"}>
                                    <td className="px-2 py-1">{new Date(row.when).toLocaleString()}</td>
                                    <td className="px-2 py-1">{row.taskTitle}</td>
                                    <td className="px-2 py-1">{row.oldStatus} → {row.newStatus}</td>
                                    <td className="px-2 py-1">{row.actor}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {!taskHistoryRows.length ? <p className={`text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>No task history records found.</p> : null}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {reportSection === "logs" ? (
                      <div className={`mt-3 rounded-lg border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/80" : "border-slate-200 bg-slate-50/70"}`}>
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-300" : "text-slate-600"}`}>Notification Delivery Log</p>
                          <span className={`text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{deliveryLogsLoading ? "Loading..." : `${deliveryLogs.length} entries`}</span>
                        </div>
                        <div className="mt-2 max-h-80 overflow-auto">
                          <table className="min-w-full text-[11px]">
                            <thead>
                              <tr className={uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}>
                                <th className="px-2 py-1 text-left">Time</th>
                                <th className="px-2 py-1 text-left">Channel</th>
                                <th className="px-2 py-1 text-left">Type</th>
                                <th className="px-2 py-1 text-left">Status</th>
                                <th className="px-2 py-1 text-left">Title</th>
                              </tr>
                            </thead>
                            <tbody>
                              {deliveryLogs.map((row) => (
                                <tr key={`delivery-log-${row.id}`} className={uiTheme === "dark" ? "border-t border-[#454545] text-slate-300" : "border-t border-slate-200 text-slate-700"}>
                                  <td className="px-2 py-1">{new Date(row.created_at).toLocaleString()}</td>
                                  <td className="px-2 py-1">{row.channel}</td>
                                  <td className="px-2 py-1">{row.message_type || "-"}</td>
                                  <td className="px-2 py-1">{row.status}</td>
                                  <td className="px-2 py-1">{row.title || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {!deliveryLogs.length && !deliveryLogsLoading ? (
                            <div className="mt-2">
                              <EmptyState uiTheme={uiTheme} size="compact" title="No delivery logs" subtitle="Push delivery history will appear once notifications start firing." />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </section>
                  ) : null}

                  {adminModule === "team" && selectedEmployeePerformance ? (
                    <section className="rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-4 shadow-sm">
                      {/* Breadcrumb + heading — gives the admin a clickable path back to the Team list
                          instead of only a "Back to Dashboard" bottom button. */}
                      <nav className="mb-2 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeId(null);
                            navigate("/admin/dashboard?module=team", { replace: true });
                          }}
                          className="font-medium hover:text-indigo-600 hover:underline"
                        >
                          Team
                        </button>
                        <span>›</span>
                        <span className="text-slate-700 dark:text-slate-200">{selectedEmployeePerformance.member.full_name}</span>
                      </nav>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{selectedEmployeePerformance.member.full_name} • Performance Detail</h3>
                        <button
                          onClick={() => {
                            setSelectedEmployeeId(null);
                            setAdminModule("overview");
                            navigate("/admin/dashboard", { replace: true });
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-600 dark:text-slate-300"
                        >
                          <ArrowRight className="h-3.5 w-3.5" /> Back to Dashboard
                        </button>
                      </div>
                      <div className="mt-3 grid gap-2 md:grid-cols-6">
                        {[
                          { label: "Total Visits", value: selectedEmployeePerformance.visits },
                          { label: "Completed", value: selectedEmployeePerformance.completed },
                          { label: "Follow-up Pending", value: selectedEmployeePerformance.followPending },
                          { label: "Overdue", value: selectedEmployeePerformance.overdue },
                          { label: "Institutions", value: selectedEmployeePerformance.institutionsHandled },
                          { label: "Vivencia / ONROL", value: `${selectedEmployeePerformance.vivencia} / ${selectedEmployeePerformance.onrol}` },
                          { label: "Interested", value: selectedEmployeePerformance.interested },
                          { label: "Proposal", value: selectedEmployeePerformance.proposals },
                          { label: "Demo", value: selectedEmployeePerformance.demos },
                          { label: "Conversions", value: selectedEmployeePerformance.conversions },
                          { label: "Conv. Rate", value: `${selectedEmployeePerformance.conversionRate}%` },
                          { label: "Revenue", value: `₹${Math.round(selectedEmployeePerformance.revenue).toLocaleString("en-IN")}` },
                        ].map((item) => (
                          <div key={item.label} className="rounded-lg border border-slate-200 bg-slate-50 dark:border-[#454545] dark:bg-[#404040] p-2">
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">{item.label}</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}
                </>
              ) : null}
              {officeUser.role !== "admin" ? (
                <>
                  <EmployeeDashboardPanel
                    officeUser={officeUser}
                    tasks={tasks ?? []}
                    onOpenTask={openEditForm}
                    onCreateTask={openCreateForm}
                  />
                  {/* Daily Brief + Today Tasks + SLA rows were removed — they duplicated the KPI row at the top of EmployeeDashboardPanel. */}
                  {slaSummary.overdue > 0 || slaSummary.atRisk > 0 ? (
                    <section className="grid gap-3 sm:grid-cols-2">
                      {slaSummary.overdue > 0 ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-rose-700">Overdue</p>
                          <p className="mt-1 text-2xl font-semibold text-rose-900">{slaSummary.overdue}</p>
                          <p className="text-[11px] text-rose-700/80">past due date</p>
                        </div>
                      ) : null}
                      {slaSummary.atRisk > 0 ? (
                        <div className="rounded-xl border border-orange-200 bg-orange-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-orange-700">At Risk</p>
                          <p className="mt-1 text-2xl font-semibold text-orange-900">{slaSummary.atRisk}</p>
                          <p className="text-[11px] text-orange-700/80">flagged delayed</p>
                        </div>
                      ) : null}
                    </section>
                  ) : null}
                  <section className="rounded-xl border border-slate-200 bg-white dark:border-[#404040] dark:bg-[#f3f5f8] p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">Smart Suggestions</h3>
                      <button
                        onClick={() => void runAutomationEngine()}
                        disabled={runningAutomation}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700"
                      >
                        {runningAutomation ? "Refreshing..." : "Refresh Suggestions"}
                      </button>
                    </div>
                    <div className="mt-2 space-y-2">
                      {notifications
                        .filter((item) => !item.is_read)
                        .slice(0, 5)
                        .map((item) => (
                          <button
                            key={item.id}
                            onClick={async () => {
                              await markNotificationRead(item.id);
                              if (item.action_url) openNotificationAction(item.action_url);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-[#454545] dark:bg-[#404040] px-3 py-2 text-left"
                          >
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.type}</p>
                            <p className="mt-0.5 text-sm font-medium text-slate-900">{item.title}</p>
                            <p className="text-xs text-slate-600">{item.message}</p>
                          </button>
                        ))}
                      {!notifications.some((item) => !item.is_read) ? (
                        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                          No urgent reminders right now.
                        </p>
                      ) : null}
                    </div>
                  </section>
                </>
              ) : null}
            </>
          ) : null}

          {(activeSection === "tasks" || activeSection === "create") ? (
              <section className={`crm-card crm-task-workspace rounded-xl border p-3 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
            {/* ── Toolbar: mobile-first compact header ──────────────────────── */}
            <div className="flex items-center justify-between gap-2">

              {/* Left: section title + employee filter tabs */}
              <div className="min-w-0">
                <h2 className={`crm-section-title text-sm font-bold truncate ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>
                  {officeUser.role === "admin" ? "Dashboard" : "Daily Tasks"}
                </h2>
                {officeUser.role !== "admin" && activeSection === "tasks" ? (
                  <p className={`text-xs mt-0.5 ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                    Priority queue • one-click execution
                  </p>
                ) : null}
              </div>

              {/* Right: primary CTA + overflow menu */}
              <div className="flex shrink-0 items-center gap-1.5">
                {/* Admin scope toggle — visible on desktop only */}
                {officeUser.role === "admin" ? (
                  <div className={`hidden sm:inline-flex rounded-lg border p-0.5 ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-300"}`}>
                    {(["my", "team"] as const).map((s) => (
                      <button key={s} onClick={() => setTaskScope(s)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${taskScope === s ? "bg-[#f3f5f8] text-white" : uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                        {s === "my" ? "My" : "Team"}
                      </button>
                    ))}
                  </div>
                ) : null}

                {/* Calendar / List toggle — desktop only */}
                <button
                  onClick={() => setDashboardView((prev) => (prev === "list" ? "calendar" : "list"))}
                  className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${uiTheme === "dark" ? "border-[#454545] text-slate-200" : "border-slate-300 text-slate-700"}`}
                >
                  {dashboardView === "list" ? <><CalendarRange className="h-3.5 w-3.5" /> Calendar</> : <><ListTodo className="h-3.5 w-3.5" /> List</>}
                </button>

                {/* Overflow menu: utility actions collapsed on mobile */}
                <div className="relative">
                  <button
                    id="task-toolbar-more"
                    onClick={() => setShowToolbarMenu((p) => !p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition ${uiTheme === "dark" ? "border-[#454545] text-slate-300 hover:bg-[#404040]" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
                    title="More actions"
                    aria-expanded={showToolbarMenu}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                  {/* Full-screen click-catcher so tapping outside closes the menu
                      (native WebView on Android often doesn't bubble clicks to body reliably) */}
                  {showToolbarMenu ? (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowToolbarMenu(false)}
                      aria-hidden="true"
                    />
                  ) : null}
                  {showToolbarMenu ? (
                    <div className={`absolute right-0 top-full mt-1 z-50 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl border shadow-xl ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                      {[
                        { icon: <CalendarRange className="h-4 w-4" />, label: dashboardView === "list" ? "Calendar View" : "List View", action: () => { setDashboardView((p) => p === "list" ? "calendar" : "list"); setShowToolbarMenu(false); } },
                        ...(officeUser.role === "admin" ? [{ icon: <ListTodo className="h-4 w-4" />, label: "Save Filters", action: () => { saveCurrentFilters(); setShowToolbarMenu(false); } }] : []),
                        ...(officeUser.role === "admin" ? [{ icon: <FileDown className="h-4 w-4" />, label: "Open Reports", action: () => { setAdminModule("reports"); setActiveSection("dashboard"); navigate("/admin/dashboard?module=reports", { replace: true }); setShowToolbarMenu(false); } }] : []),
                      ].map((item) => (
                        <button key={item.label} onClick={item.action}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors ${uiTheme === "dark" ? "text-slate-200 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-50"}`}>
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Primary CTA — always visible */}
                <button onClick={openCreateForm} className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3f5f8] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#f3f5f8]/90">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {officeUser.role === "admin" ? "Add Task" : "Add Task"}
                  </span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>
            </div>

          {officeUser.role === "admin" ? (
              <div className={`crm-filter-panel mt-3 rounded-lg border ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/50" : "border-slate-200 bg-slate-50"}`}>
              <details>
              <summary className={`flex cursor-pointer select-none items-center justify-between gap-2 px-3 py-2`}>
                <span className={`text-[11px] font-semibold uppercase tracking-widest ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Filters</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.preventDefault(); setShowAdminAdvancedFilters((prev) => !prev); }}
                    className={`rounded border px-2 py-0.5 text-[11px] font-medium ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-300 hover:bg-slate-600" : "border-slate-300 bg-white text-slate-600"}`}
                  >
                    {showAdminAdvancedFilters ? "Less" : "Advanced"}
                  </button>
                </div>
              </summary>
              <div className="px-3 pb-3 pt-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <div className="col-span-full flex flex-wrap gap-2">
                  {[
                    { key: "today_ops", label: "Today Ops" },
                    { key: "sales_followups", label: "Sales Follow-ups" },
                    { key: "overdue", label: "Overdue" },
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      onClick={() => applyAdminPreset(preset.key as "today_ops" | "sales_followups" | "overdue")}
                        className={`crm-preset-chip rounded-full border px-3 py-1 text-xs font-medium ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-300 hover:bg-slate-600" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"}`}
                      >
                        {preset.label}
                      </button>
                  ))}
                </div>
                <select className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminEmployeeFilter} onChange={(e) => setAdminEmployeeFilter(e.target.value)}>
                  <option value="all">All Employees</option>
                  {teamMembers.filter((u) => u.role === "employee").map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                </select>
                <select className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminStatusFilter} onChange={(e) => setAdminStatusFilter(e.target.value as Status | "all")}>
                  <option value="all">All Status</option>
                  <option value="not_started">Not Started</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="delayed">Delayed</option>
                </select>
                <select className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminTaskCategoryFilter} onChange={(e) => setAdminTaskCategoryFilter(e.target.value as TaskCategory | "all")}>
                  <option value="all">All Categories</option>
                  <option value="general">Regular Tasks</option>
                  <option value="visit">Sales/Journey Tasks</option>
                </select>
                <select className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminPriorityFilter} onChange={(e) => setAdminPriorityFilter(e.target.value as Priority | "all")}>
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Due Date</label>
                  <input type="date" value={adminDateFilter} onChange={(e) => setAdminDateFilter(e.target.value)} className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} />
                </div>
              </div>

              {showAdminAdvancedFilters ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  <select className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminTypeFilter} onChange={(e) => setAdminTypeFilter(e.target.value as TaskType | "all")}>
                    <option value="all">All Types</option>
                    <option value="planned">Planned</option>
                    <option value="unplanned">Unplanned</option>
                  </select>
                  <select className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminBrandFilter} onChange={(e) => setAdminBrandFilter(e.target.value as VisitBrand | "all")}>
                    <option value="all">All Brands</option>
                    <option value="Vivencia">Vivencia</option>
                    <option value="ONROL">ONROL</option>
                  </select>
                  <select className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminOutcomeFilter} onChange={(e) => setAdminOutcomeFilter(e.target.value as VisitOutcome | "all")}>
                    <option value="all">All Outcomes</option>
                    {(Object.keys(visitOutcomeLabels) as VisitOutcome[]).map((outcome) => (
                      <option key={outcome} value={outcome}>
                        {visitOutcomeLabels[outcome]}
                      </option>
                    ))}
                  </select>
                  <select className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminFollowUpStatusFilter} onChange={(e) => setAdminFollowUpStatusFilter(e.target.value as FollowUpStatus | "all")}>
                    <option value="all">All Follow-up</option>
                    {(Object.keys(followUpStatusLabels) as FollowUpStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {followUpStatusLabels[status]}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Follow-up Date</label>
                    <input type="date" value={adminFollowUpDateFilter} onChange={(e) => setAdminFollowUpDateFilter(e.target.value)} className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} />
                  </div>
                  <select className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminProgramInterestFilter} onChange={(e) => setAdminProgramInterestFilter(e.target.value)}>
                    <option value="all">Program Interest</option>
                    {[...brandFieldConfig.Vivencia.programInterest, ...brandFieldConfig.ONROL.programInterest].map((option) => (
                      <option key={option} value={option}>
                        {formatChipLabel(option)}
                      </option>
                    ))}
                  </select>
                  <select className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminInterestLevelFilter} onChange={(e) => setAdminInterestLevelFilter(e.target.value as InterestLevel | "all")}>
                    <option value="all">Interest Level</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <select className={`h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminDiscussionStageFilter} onChange={(e) => setAdminDiscussionStageFilter(e.target.value)}>
                    <option value="all">Discussion Stage</option>
                    {[...brandFieldConfig.Vivencia.discussionStage, ...brandFieldConfig.ONROL.discussionStage].map((option) => (
                      <option key={option} value={option}>
                        {formatChipLabel(option)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              </details>
            </div>
          ) : null}

          {showImportPanel ? (
            <div className={`mt-4 rounded-lg border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Bulk Import (Excel/CSV Schedule)</p>
              <p className={`mt-1 text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                Expected columns: Date, Weekday, Theme, 9:45-10:15, 10:20-12:20, 2:00-3:00, 3:00-5:30 (Heavy Ops Work), 5:30-6:00, Evening, Key Deliverables / Notes
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept=".csv,.tsv,.txt,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImportFile(file);
                    e.currentTarget.value = "";
                  }}
                  className="block text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#f3f5f8] file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                />
                <button
                  onClick={applyImport}
                  disabled={!importRows.length || importing}
                  className="rounded-lg bg-[#f3f5f8] px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {importing ? "Importing..." : `Import ${importRows.length} Tasks`}
                </button>
              </div>
              {importError ? <p className="mt-2 text-xs text-rose-600">Error: {importError}</p> : null}
              {!importError && importRows.length ? (
                <p className="mt-2 text-xs text-emerald-700">
                  Parsed {importRows.length} rows. Sample: {importRows[0].date} - {importRows[0].theme}
                </p>
              ) : null}
            </div>
          ) : null}

          
            </section>
          ) : null}

          {activeSection === "tasks" && officeUser.role === "admin" ? (
          <section className={`rounded-xl border p-3 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
            <details>
              <summary className={`cursor-pointer select-none text-xs font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Admin Tools - Invite &amp; Import History
              </summary>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {/* Invite */}
                <div className={`rounded-lg border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`text-xs font-semibold ${uiTheme === "dark" ? "text-slate-200" : "text-slate-800"}`}>Invite User</p>
                  <p className={`mt-0.5 text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Role &amp; department apply on first login.</p>
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    <input className={`h-8 rounded-lg border px-2.5 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#f3f5f8] text-slate-100 placeholder:text-slate-500" : "border-slate-300 bg-white"}`} placeholder="Email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                    <input className={`h-8 rounded-lg border px-2.5 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#f3f5f8] text-slate-100 placeholder:text-slate-500" : "border-slate-300 bg-white"}`} placeholder="Full name (optional)" value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
                    <input className={`h-8 rounded-lg border px-2.5 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#f3f5f8] text-slate-100 placeholder:text-slate-500" : "border-slate-300 bg-white"}`} placeholder="Department" value={inviteDepartment} onChange={(e) => setInviteDepartment(e.target.value)} />
                    <select className={`h-8 rounded-lg border px-2 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#f3f5f8] text-slate-100" : "border-slate-300 bg-white"}`} value={inviteRole} onChange={(e) => setInviteRole(e.target.value as Role)}>
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button onClick={createInvite} disabled={inviting} className="crm-btn-primary mt-2 rounded-lg px-3 py-1.5 text-xs text-white disabled:opacity-60">
                    {inviting ? "Creating..." : "Create Invite"}
                  </button>
                  <div className={`mt-2 max-h-24 space-y-1 overflow-auto`}>
                    {invites.slice(0, 6).map((invite) => (
                      <div key={invite.id} className={`rounded border px-2 py-1 text-[11px] ${uiTheme === "dark" ? "border-[#454545] text-slate-400" : "border-slate-200 text-slate-600"}`}>
                        {invite.email} • {invite.role} • {invite.status}
                      </div>
                    ))}
                    {!invites.length ? <p className={`text-[11px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>No invites yet.</p> : null}
                  </div>
                </div>

                {/* Import History */}
                <div className={`rounded-lg border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`text-xs font-semibold ${uiTheme === "dark" ? "text-slate-200" : "text-slate-800"}`}>Import History</p>
                  <p className={`mt-0.5 text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Latest import batches and counts.</p>
                  <div className="mt-2 max-h-32 space-y-1.5 overflow-auto">
                    {importHistory.map((item) => (
                      <div key={item.id} className={`rounded border px-2 py-1.5 text-[11px] ${uiTheme === "dark" ? "border-[#454545] text-slate-400" : "border-slate-200 text-slate-600"}`}>
                        <p className={`font-medium ${uiTheme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{item.source_file || "Manual import"}</p>
                        <p>Total: {item.total_rows} • Success: {item.success_rows} • Failed: {item.failed_rows}</p>
                        <p className={`text-[10px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                    {!importHistory.length ? <p className={`text-[11px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>No import history found.</p> : null}
                  </div>
                </div>
              </div>
            </details>
          </section>
          ) : null}

          {activeSection === "create" && showForm ? (
          <section className={`overflow-hidden rounded-2xl border shadow-lg ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
            {/* ── Premium header ── */}
            <div className={`flex items-center justify-between border-b px-5 py-4 ${uiTheme === "dark" ? "border-[#454545]/60 bg-gradient-to-r from-[#404040] to-[#f3f5f8]" : "border-slate-100 bg-gradient-to-r from-slate-50 to-white"}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${uiTheme === "dark" ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600"}`}>
                  {editingTaskId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4.5 w-4.5" />}
                </div>
                <div>
                  <h3 className={`text-sm font-bold leading-tight ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>
                    {editingTaskId
                      ? officeUser.role === "employee"
                        ? taskDraft.taskCategory === "visit" ? "Update Journey Stop" : "Update Task"
                        : "Edit Task"
                      : officeUser.role === "employee"
                        ? taskDraft.taskCategory === "visit" ? "Plan Journey Stop" : "New Task"
                        : "New Task"}
                  </h3>
                  <p className={`text-[11px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                    {taskDraft.taskCategory === "visit" ? "Schedule a school or college visit" : "Capture a task or action item"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${uiTheme === "dark" ? "text-slate-500 hover:bg-[#454545] hover:text-slate-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* ── Body ── */}
            <div className="space-y-5 p-5">
              {/* Task Category segmented control */}
              {(officeUser.role !== "employee" || employeeHasJourneyAccess) ? (
                <div>
                  <p className={`mb-2 text-[11px] font-semibold uppercase tracking-widest ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Category</p>
                  <div className={`inline-flex rounded-xl p-1 ${uiTheme === "dark" ? "bg-[#404040]" : "bg-slate-100"}`}>
                    <button
                      type="button"
                      onClick={() => setTaskDraft((p) => ({ ...p, taskCategory: "general", brandDetails: {} }))}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                        taskDraft.taskCategory === "general"
                          ? "bg-[#f3f5f8] text-white shadow-sm"
                          : uiTheme === "dark" ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <ListTodo className="h-3.5 w-3.5" /> General
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskDraft((p) => ({
                        ...p, taskCategory: "visit", taskType: "planned", status: "not_started",
                        visitDate: p.visitDate || new Date().toISOString().slice(0, 10),
                        assignedDate: p.visitDate || new Date().toISOString().slice(0, 10),
                        brandDetails: p.taskCategory === "visit" ? p.brandDetails : {},
                      }))}
                      className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                        taskDraft.taskCategory === "visit"
                          ? "bg-[#f3f5f8] text-white shadow-sm"
                          : uiTheme === "dark" ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5" /> Visit
                    </button>
                  </div>
                </div>
              ) : null}

            {taskDraft.taskCategory === "visit" ? (
              /* ── Visit task: full wizard ── */
              <VisitPlannerWizard
                taskDraft={taskDraft}
                setTaskDraft={setTaskDraft}
                institutions={institutions ?? []}
                institutionsLoading={Boolean(institutionsLoading)}
                institutionsLoadError={institutionsLoadError ?? null}
                getInstitutionSuggestions={getInstitutionSuggestions ?? (() => [])}
                selectedDraftInstitution={selectedDraftInstitution}
                institutionSearchByTask={institutionSearchByTask ?? {}}
                setInstitutionSearchByTask={setInstitutionSearchByTask ?? (() => {})}
                checkInstitutionConflict={checkInstitutionConflict}
                institutionConflictByTask={institutionConflictByTask ?? {}}
                showCreateInstitutionForTask={showCreateInstitutionForTask ?? null}
                setShowCreateInstitutionForTask={setShowCreateInstitutionForTask ?? (() => {})}
                institutionCreateDraftByTask={institutionCreateDraftByTask ?? {}}
                setInstitutionCreateDraftByTask={setInstitutionCreateDraftByTask ?? (() => {})}
                createInstitutionForDraft={createInstitutionForDraft ?? (async () => {})}
                reloadInstitutions={reloadInstitutions}
                ensureInstitutionDraft={ensureInstitutionDraft}
                getInstitutionVisitHistory={getInstitutionVisitHistory ?? (() => [])}
                editingTaskId={editingTaskId}
                onSave={() => void saveTask()}
                onCancel={() => { setShowForm(false); setActiveSection("tasks"); }}
                isSaving={false}
              />
            ) : (
              /* ── General task form ── */
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className={`mb-1.5 block text-xs font-medium ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                    Task Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={`h-10 w-full rounded-xl border px-3.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                      uiTheme === "dark"
                        ? "border-[#454545] bg-[#404040] text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-100"
                    }`}
                    placeholder="What needs to be done?"
                    value={taskDraft.taskTitle}
                    onChange={(e) => setTaskDraft((p) => ({ ...p, taskTitle: e.target.value }))}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={`mb-1.5 block text-xs font-medium ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Description</label>
                  <textarea
                    className={`min-h-[80px] w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                      uiTheme === "dark"
                        ? "border-[#454545] bg-[#404040] text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-100"
                    }`}
                    placeholder="Add more context or details…"
                    value={taskDraft.description}
                    onChange={(e) => setTaskDraft((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>

                {/* Row: Type + Priority */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={`mb-2 block text-xs font-medium ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Type</label>
                    <div className={`inline-flex rounded-xl p-1 ${uiTheme === "dark" ? "bg-[#404040]" : "bg-slate-100"}`}>
                      {(["planned", "unplanned"] as TaskType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setTaskDraft((p) => ({ ...p, taskType: type }))}
                          className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
                            taskDraft.taskType === type
                              ? "bg-[#f3f5f8] text-white shadow-sm"
                              : uiTheme === "dark" ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {type === "planned" ? "Planned" : "Unplanned"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`mb-2 block text-xs font-medium ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Priority</label>
                    <div className="flex gap-2">
                      {([
                        { v: "high",   label: "High",   active: "bg-rose-600 text-white border-rose-600",   idle: uiTheme === "dark" ? "border-[#454545] text-slate-400 hover:border-rose-500 hover:text-rose-400" : "border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-600" },
                        { v: "medium", label: "Medium", active: "bg-amber-500 text-white border-amber-500",  idle: uiTheme === "dark" ? "border-[#454545] text-slate-400 hover:border-amber-500 hover:text-amber-400" : "border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600" },
                        { v: "low",    label: "Low",    active: "bg-emerald-600 text-white border-emerald-600", idle: uiTheme === "dark" ? "border-[#454545] text-slate-400 hover:border-emerald-500 hover:text-emerald-400" : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600" },
                      ] as {v: Priority; label: string; active: string; idle: string}[]).map((p) => (
                        <button
                          key={p.v}
                          type="button"
                          onClick={() => setTaskDraft((prev) => ({ ...prev, priority: p.v }))}
                          className={`flex-1 rounded-xl border px-2 py-1.5 text-xs font-semibold transition-all ${taskDraft.priority === p.v ? p.active : p.idle}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className={`mb-2 block text-xs font-medium ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Status</label>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { v: "not_started", label: "Not Started", active: "bg-[#454545] text-white border-[#454545]" },
                      { v: "ongoing",     label: "Ongoing",     active: "bg-sky-600 text-white border-sky-600" },
                      { v: "completed",   label: "Completed",   active: "bg-emerald-600 text-white border-emerald-600" },
                      { v: "delayed",     label: "Delayed",     active: "bg-rose-600 text-white border-rose-600" },
                    ] as {v: Status; label: string; active: string}[]).map((s) => (
                      <button
                        key={s.v}
                        type="button"
                        onClick={() => setTaskDraft((p) => ({ ...p, status: s.v }))}
                        className={`rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                          taskDraft.status === s.v
                            ? s.active
                            : uiTheme === "dark" ? "border-[#454545] text-slate-400 hover:border-slate-600 hover:text-slate-300" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dates row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={`mb-1.5 block text-xs font-medium ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Start Date</label>
                    <input
                      type="date"
                      className={`h-10 w-full rounded-xl border px-3 text-sm transition-colors focus:outline-none focus:ring-2 ${
                        uiTheme === "dark"
                          ? "border-[#454545] bg-[#404040] text-slate-100 focus:border-indigo-500 focus:ring-indigo-500/20"
                          : "border-slate-200 bg-white text-slate-900 focus:border-indigo-400 focus:ring-indigo-100"
                      }`}
                      value={taskDraft.assignedDate}
                      onChange={(e) => setTaskDraft((p) => ({ ...p, assignedDate: e.target.value, visitDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={`mb-1.5 block text-xs font-medium ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Due Date</label>
                    <input
                      type="date"
                      className={`h-10 w-full rounded-xl border px-3 text-sm transition-colors focus:outline-none focus:ring-2 ${
                        uiTheme === "dark"
                          ? "border-[#454545] bg-[#404040] text-slate-100 focus:border-indigo-500 focus:ring-indigo-500/20"
                          : "border-slate-200 bg-white text-slate-900 focus:border-indigo-400 focus:ring-indigo-100"
                      }`}
                      value={taskDraft.dueDate || ""}
                      onChange={(e) => setTaskDraft((p) => ({ ...p, dueDate: e.target.value }))}
                    />
                  </div>
                </div>
                {/* Notes row: Remarks + Blockers */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={`mb-1.5 block text-xs font-medium ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Remarks</label>
                    <textarea
                      className={`min-h-[72px] w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                        uiTheme === "dark"
                          ? "border-[#454545] bg-[#404040] text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-100"
                      }`}
                      placeholder="Any relevant notes…"
                      value={taskDraft.remarks || ""}
                      onChange={(e) => setTaskDraft((p) => ({ ...p, remarks: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className={`mb-1.5 block text-xs font-medium ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Blockers</label>
                    <textarea
                      className={`min-h-[72px] w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                        uiTheme === "dark"
                          ? "border-[#454545] bg-[#404040] text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                          : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-100"
                      }`}
                      placeholder="Anything blocking progress…"
                      value={taskDraft.blockers || ""}
                      onChange={(e) => setTaskDraft((p) => ({ ...p, blockers: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Completion note */}
                <div>
                  <label className={`mb-1.5 block text-xs font-medium ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>Completion Note</label>
                  <textarea
                    className={`min-h-[72px] w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
                      uiTheme === "dark"
                        ? "border-[#454545] bg-[#404040] text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20"
                        : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-100"
                    }`}
                    placeholder="What was accomplished or what remains…"
                    value={taskDraft.completionNote || ""}
                    onChange={(e) => setTaskDraft((p) => ({ ...p, completionNote: e.target.value }))}
                  />
                </div>

                {/* Action buttons */}
                <div className={`flex items-center gap-3 border-t pt-4 ${uiTheme === "dark" ? "border-[#454545]/60" : "border-slate-100"}`}>
                  <button
                    type="button"
                    onClick={saveTask}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f3f5f8] py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#f3f5f8] active:scale-[0.98]"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {editingTaskId ? "Update Task" : "Save Task"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition-colors ${
                      uiTheme === "dark"
                        ? "border-[#454545] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800"
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            </div>
          </section>
          ) : null}

          {(activeSection === "tasks" || activeSection === "journey") && pageLoading && visibleTasks.length === 0 ? (
            <WorkspacePageSkeleton uiTheme={uiTheme} lines={6} />
          ) : null}

          {(activeSection === "tasks" || activeSection === "journey") && dashboardView === "calendar" ? (
          <section className={`rounded-xl border p-4 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Weekly Calendar</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const next = new Date(calendarAnchor);
                    next.setDate(next.getDate() - 7);
                    setCalendarAnchor(next);
                  }}
                  className={`rounded border px-2 py-1 text-xs ${uiTheme === "dark" ? "border-slate-600 text-slate-300 hover:bg-[#454545]" : "border-slate-300 hover:bg-slate-50"}`}
                >
                  Previous Week
                </button>
                <button
                  onClick={() => setCalendarAnchor(new Date())}
                  className={`rounded border px-2 py-1 text-xs ${uiTheme === "dark" ? "border-slate-600 text-slate-300 hover:bg-[#454545]" : "border-slate-300 hover:bg-slate-50"}`}
                >
                  Current Week
                </button>
                <button
                  onClick={() => {
                    const next = new Date(calendarAnchor);
                    next.setDate(next.getDate() + 7);
                    setCalendarAnchor(next);
                  }}
                  className={`rounded border px-2 py-1 text-xs ${uiTheme === "dark" ? "border-slate-600 text-slate-300 hover:bg-[#454545]" : "border-slate-300 hover:bg-slate-50"}`}
                >
                  Next Week
                </button>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-7">
              {calendarDays.map((day) => (
                <div key={day.key} className={`rounded-lg border p-2 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`text-xs font-semibold ${uiTheme === "dark" ? "text-slate-200" : "text-slate-700"}`}>{day.label}</p>
                  <p className={`mt-1 text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{day.tasks.length} task(s)</p>
                  <div className="mt-2 space-y-1">
                    {day.tasks.slice(0, 3).map((task) => (
                      <p key={task.id} className={`rounded px-1.5 py-1 text-[11px] ${uiTheme === "dark" ? "bg-[#454545] text-slate-200" : "bg-white text-slate-700"}`}>
                        {task.task_title}
                      </p>
                    ))}
                    {day.tasks.length > 3 ? <p className={`text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>+{day.tasks.length - 3} more</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
          ) : activeSection === 'journey' && employeeHasJourneyAccess ? (
            <JourneyPlanPage
              journeyPlanner={journeyPlanner}
              journeyDate={journeyDate}
              setJourneyDate={setJourneyDate}
              journeyViewMode={journeyViewMode}
              setJourneyViewMode={setJourneyViewMode}
              journeyVisitSearch={journeyVisitSearch}
              setJourneyVisitSearch={setJourneyVisitSearch}
              expandedVisitTaskId={expandedAuditTaskId}
              setExpandedVisitTaskId={(id) => setExpandedAuditTaskId(id)}
              uiTheme={uiTheme}
              notifications={notifications ?? []}
              markNotificationRead={markNotificationRead ?? (async () => {})}
              openCreateForm={openCreateForm}
              renderTaskCard={renderTaskCard}
              navigate={(url) => navigate(url)}
            />
          ) : activeSection === "tasks" && officeUser.role === "employee" ? (
          <section className="grid min-w-0 max-w-full gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <WorkspaceGreeting
              uiTheme={uiTheme}
              name={officeUser.full_name ?? officeUser.email ?? "there"}
              taskCount={employeeGeneralTasks.filter((t) => t.status !== "completed").length}
              overdueCount={employeeGeneralTasks.filter((t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < new Date()).length}
            />
            <div className={`min-w-0 max-w-full rounded-xl border p-4 shadow-sm ${uiTheme === "dark" ? "border-[#404040] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>
                    {showArchivedTasks ? "Archived Tasks" : "General Tasks"}
                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${uiTheme === "dark" ? "bg-[#454545] text-slate-300" : "bg-slate-100 text-slate-500"}`}>
                      {showArchivedTasks
                        ? employeeGeneralTasks.filter((t) => t.status === "completed").length
                        : employeeGeneralTasks.filter((t) => t.status !== "completed").length}
                    </span>
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowArchivedTasks((p) => !p)}
                    className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                      showArchivedTasks
                        ? uiTheme === "dark" ? "border-amber-700 bg-amber-900/30 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-700"
                        : uiTheme === "dark" ? "border-slate-600 text-slate-300 hover:bg-[#454545]" : "border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {showArchivedTasks ? <CheckCircle2 className="h-3 w-3" /> : <FolderOpen className="h-3 w-3" />}
                    {showArchivedTasks ? "Active" : "Archive"}
                  </button>
                  {!showArchivedTasks && (
                    <button onClick={openCreateForm} className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${uiTheme === "dark" ? "border-slate-600 text-slate-300 hover:bg-[#454545]" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
                      <Plus className="h-3 w-3" /><span className="hidden sm:inline">Add Task</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 max-h-[460px] space-y-2 overflow-auto pr-1">
                {showArchivedTasks ? (
                  <>
                    {employeeGeneralTasks.filter((t) => t.status === "completed").map(renderTaskCard)}
                    {!employeeGeneralTasks.filter((t) => t.status === "completed").length ? (
                      <div className="flex flex-col items-center py-10 text-center">
                        <CheckCircle2 className={`mb-2 h-10 w-10 ${uiTheme === "dark" ? "text-slate-600" : "text-slate-300"}`} />
                        <p className={`text-sm font-medium ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>No archived tasks yet</p>
                        <p className={`mt-1 text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Completed tasks will appear here.</p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    {employeeGeneralTasks.filter((t) => t.status !== "completed").map(renderTaskCard)}
                    {!employeeGeneralTasks.filter((t) => t.status !== "completed").length ? (
                      <WorkspaceEmptyState
                        uiTheme={uiTheme}
                        emoji="🎯"
                        title="You're all clear!"
                        description="No active tasks right now. Add a new task or check your archive."
                        actionLabel="+ Add Task"
                        onAction={openCreateForm}
                      />
                    ) : null}
                    {employeeGeneralTasks.filter((t) => t.status === "completed").length > 0 && (
                      <button
                        onClick={() => setShowArchivedTasks(true)}
                        className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors ${uiTheme === "dark" ? "border-[#454545] text-slate-400 hover:bg-[#404040]" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        {employeeGeneralTasks.filter((t) => t.status === "completed").length} completed task{employeeGeneralTasks.filter((t) => t.status === "completed").length !== 1 ? "s" : ""} in archive
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
            <div className={`rounded-xl border p-4 shadow-sm ${uiTheme === "dark" ? "border-[#404040] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Journey Plan</h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${uiTheme === "dark" ? "bg-[#404040] text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                  {employeeJourneyTasks.length}
                </span>
              </div>
              {/* Compact stat row — no redundant scrollable task list (users open the full page for that) */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className={`rounded-lg border px-2 py-2 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-sky-100 bg-sky-50"}`}>
                  <div className={`text-base font-bold ${uiTheme === "dark" ? "text-orange-300" : "text-orange-700"}`}>
                    {employeeJourneyTasks.filter((task) => getJourneyStageIndex(task) === 0).length}
                  </div>
                  <div className={`text-[10px] font-medium uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Planned</div>
                </div>
                <div className={`rounded-lg border px-2 py-2 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-amber-100 bg-amber-50"}`}>
                  <div className={`text-base font-bold ${uiTheme === "dark" ? "text-amber-300" : "text-amber-700"}`}>
                    {employeeJourneyTasks.filter((task) => [1, 2, 3].includes(getJourneyStageIndex(task))).length}
                  </div>
                  <div className={`text-[10px] font-medium uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Ongoing</div>
                </div>
                <div className={`rounded-lg border px-2 py-2 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-emerald-100 bg-emerald-50"}`}>
                  <div className={`text-base font-bold ${uiTheme === "dark" ? "text-emerald-300" : "text-emerald-700"}`}>
                    {employeeJourneyTasks.filter((task) => getJourneyStageIndex(task) >= 4).length}
                  </div>
                  <div className={`text-[10px] font-medium uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Done</div>
                </div>
              </div>
              {employeeHasJourneyAccess ? (
                <button
                  onClick={() => {
                    setActiveSection("journey");
                    setShowForm(false);
                    navigate("/task/journey", { replace: true });
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
                >
                  Open Journey Plan →
                </button>
              ) : (
                <p className={`mt-3 rounded-lg border px-3 py-2 text-[11px] ${uiTheme === "dark" ? "border-amber-700 bg-amber-900/30 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                  Journey Plan access is enabled for Sales and Trainee departments.
                </p>
              )}
            </div>
            <div className={`rounded-xl border p-3 shadow-sm ${uiTheme === "dark" ? "border-[#404040] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between">
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Reminders</p>
                <button
                  onClick={() => void runAutomationEngine()}
                  disabled={runningAutomation}
                  className={`rounded-md border px-2 py-1 text-[11px] font-medium ${uiTheme === "dark" ? "border-slate-600 text-slate-300 hover:bg-[#454545]" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                >
                  {runningAutomation ? "Refreshing..." : "Refresh"}
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {notifications
                  .filter((item) => !item.is_read)
                  .slice(0, 4)
                  .map((item) => (
                    <button
                      key={`task-note-${item.id}`}
                      onClick={async () => {
                        await markNotificationRead(item.id);
                        if (item.action_url) openNotificationAction(item.action_url);
                      }}
                      className={`w-full rounded-lg border px-2.5 py-2 text-left ${
                        uiTheme === "dark" ? "border-[#454545] bg-[#404040] hover:bg-[#454545]" : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{item.type}</p>
                      <p className={`mt-0.5 text-xs font-medium ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{item.title}</p>
                    </button>
                  ))}
                {!notifications.some((item) => !item.is_read) ? (
                  <WorkspaceInlineNotice uiTheme={uiTheme} tone="positive">
                    No urgent reminders right now.
                  </WorkspaceInlineNotice>
                ) : null}
              </div>
            </div>
            </aside>
          </section>
          ) : activeSection === "tasks" ? (
          <>
          <EmployeeWorkspaceCards
            teamMembers={teamMembers.filter((u) => u.role === "employee")}
            tasks={tasks}
            uiTheme={uiTheme}
            adminUserId={officeUser.id}
            onOpenTask={(taskId) => {
              const task = tasks.find((t) => t.id === taskId);
              if (task) openEditForm(task);
            }}
            todayStr={new Date().toISOString().slice(0, 10)}
          />
          </>
          ) : null}

          {activeSection === "tasks" && officeUser.role === "admin" ? (() => {
            const q = adminTasksSearch.trim().toLowerCase();
            const allRows = visibleTasks.filter((t) => t.task_category === "visit" && t.visit_status !== "rescheduled");
            const matches = q
              ? allRows.filter((t) =>
                  (t.institution_name || "").toLowerCase().includes(q) ||
                  (t.task_title || "").toLowerCase().includes(q) ||
                  (getOfficeUserLabel(t.user_id) || "").toLowerCase().includes(q),
                )
              : allRows;
            const PAGE_CAP = 100;
            const rows = adminTasksShowAll ? matches : matches.slice(0, PAGE_CAP);
            const truncated = !adminTasksShowAll && matches.length > PAGE_CAP;
            return (
            <section className={`crm-rail-card rounded-2xl border p-5 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>
                  Sales/Journey Tasks ({matches.length}{q ? ` of ${allRows.length}` : ""})
                </h3>
                <p className={`mt-1 text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Admin filters applied: employee, date, and brand.</p>
              </div>
              <input
                type="search"
                value={adminTasksSearch}
                onChange={(e) => { setAdminTasksSearch(e.target.value); setAdminTasksShowAll(false); }}
                placeholder="Search institution, employee, title…"
                className={`h-8 w-full max-w-[320px] rounded-lg border px-3 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 sm:w-72 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-100" : "border-slate-300 bg-white text-slate-900"}`}
              />
            </div>
            <div className={`mt-4 max-h-[420px] overflow-auto rounded-xl border ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-200"}`}>
                <table className="crm-data-table min-w-full border-collapse text-[12px]">
                  <thead className={`sticky top-0 z-10 backdrop-blur ${uiTheme === "dark" ? "bg-[#404040]/95" : "bg-slate-50/95"}`}>
                    <tr className={`text-left text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                      {["Date", "Employee", "Brand", "Institution Type", "Institution", "Visit Status", "Outcome", "Follow-up", "Follow-up Date", "Follow-up Status", "Actions"].map((head) => (
                        <th key={head} className={`border-b px-2.5 py-2 ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-200"}`}>
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .map((task) => {
                        const rescheduleAuditLine = extractRescheduleAuditLine(task);
                        return (
                          <tr key={task.id} className={uiTheme === "dark" ? "odd:bg-[#f3f5f8] even:bg-[#404040]/60" : "odd:bg-white even:bg-slate-50/60"}>
                            <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{task.visit_date || task.assigned_date}</td>
                            <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{getOfficeUserLabel(task.user_id)}</td>
                            <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{task.visit_brand || "-"}</td>
                            <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{task.institution_type || "-"}</td>
                            <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{task.institution_name || "-"}</td>
                            <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{getVisitStatusLabelForTask(task)}</td>
                            <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{(task.visit_outcome || []).map((o) => visitOutcomeLabels[o]).join(", ") || "-"}</td>
                            <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{task.follow_up_required ? (task.follow_up_type ? followUpTypeLabels[task.follow_up_type] : "Required") : "No"}</td>
                            <td
                              className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}
                              title={rescheduleAuditLine ? `Rescheduled: ${rescheduleAuditLine}` : undefined}
                            >
                              <div className="flex flex-col">
                                <span>{task.follow_up_date || "-"}</span>
                                {rescheduleAuditLine ? (
                                  <span className={`text-[10px] ${uiTheme === "dark" ? "text-violet-300" : "text-violet-700"}`}>
                                    {rescheduleAuditLine}
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{task.follow_up_status ? followUpStatusLabels[task.follow_up_status] : "-"}</td>
                            <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040]" : "border-slate-100"}`}>
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  onClick={() => openEditForm(task)}
                                  className={`rounded-md border px-2 py-1 text-[11px] font-medium ${uiTheme === "dark" ? "border-slate-600 text-slate-200 hover:bg-[#404040]" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => void deleteTaskByAdmin(task)}
                                  className={`rounded-md border px-2 py-1 text-[11px] font-medium ${uiTheme === "dark" ? "border-rose-500/60 text-rose-300 hover:bg-rose-950/40" : "border-rose-300 text-rose-700 hover:bg-rose-50"}`}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              {truncated ? (
                <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs dark:border-[#454545] dark:bg-[#404040]">
                  <span className="text-slate-600 dark:text-slate-400">
                    Showing first {PAGE_CAP} of {matches.length} rows for performance.
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdminTasksShowAll(true)}
                    className="rounded-md border border-indigo-300 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700 dark:border-indigo-700 dark:bg-[#f3f5f8]/40 dark:text-indigo-200"
                  >
                    Show all {matches.length}
                  </button>
                </div>
              ) : null}
              {!rows.length ? (
                <div className="mt-3">
                  <EmptyState
                    uiTheme={uiTheme}
                    size="compact"
                    title={q ? "No matching tasks" : "No tasks found"}
                    subtitle={q ? `Nothing matches "${adminTasksSearch}". Try a shorter query or clear filters.` : "Try adjusting the employee / date / brand filters above."}
                    action={q ? { label: "Clear search", onClick: () => setAdminTasksSearch("") } : undefined}
                  />
                </div>
              ) : null}
            </section>
            );
          })() : null}

          {activeSection === "tasks" && officeUser.role === "admin" && selectedEmployee ? (
          <section className={`crm-rail-card rounded-2xl border p-5 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
            <h3 className={`text-base font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{selectedEmployee.full_name} - Task History</h3>
            <p className={`mt-1 text-sm ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>{selectedEmployee.email} • {selectedEmployee.department}</p>
            <div className={`mt-4 max-h-[340px] overflow-auto rounded-xl border ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-200"}`}>
              <table className="crm-data-table min-w-full border-collapse text-[12px]">
                <thead className={`sticky top-0 z-10 backdrop-blur ${uiTheme === "dark" ? "bg-[#404040]/95" : "bg-slate-50/95"}`}>
                  <tr className={`text-left text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                    {["Task", "Type", "Priority", "Status", "Assigned", "Due", "Updated", "Actions"].map((head) => (
                      <th key={head} className={`border-b px-2.5 py-2 ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-200"}`}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedEmployeeTasks.map((task) => (
                    <tr key={task.id} className={uiTheme === "dark" ? "odd:bg-[#f3f5f8] even:bg-[#404040]/60" : "odd:bg-white even:bg-slate-50/60"}>
                      <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{task.task_title}</td>
                      <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{task.task_type}</td>
                      <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{task.priority}</td>
                      <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{statusLabels[task.status]}</td>
                      <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{task.assigned_date}</td>
                      <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{task.due_date || "-"}</td>
                      <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{new Date(task.updated_at).toLocaleString()}</td>
                      <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040]" : "border-slate-100"}`}>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => openEditForm(task)}
                            className={`rounded-md border px-2 py-1 text-[11px] font-medium ${uiTheme === "dark" ? "border-slate-600 text-slate-200 hover:bg-[#404040]" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void deleteTaskByAdmin(task)}
                            className={`rounded-md border px-2 py-1 text-[11px] font-medium ${uiTheme === "dark" ? "border-rose-500/60 text-rose-300 hover:bg-rose-950/40" : "border-rose-300 text-rose-700 hover:bg-rose-50"}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={`mt-5 rounded-lg border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
              <h4 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Brand Details</h4>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {selectedEmployeeTasks
                  .filter((task) => task.task_category === "visit")
                  .slice(0, 6)
                  .map((task) => {
                    const details = getTaskBrandDetails(task);
                    return (
                      <div key={`${task.id}-brand`} className={`rounded-md border p-3 text-xs ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8] text-slate-400" : "border-slate-200 bg-white text-slate-600"}`}>
                        <p className={`font-semibold ${uiTheme === "dark" ? "text-slate-200" : "text-slate-800"}`}>{task.task_title}</p>
                        <p className="mt-1">Brand: {task.visit_brand || "-"}</p>
                        <p>Program: {(details.program_interest || []).map(formatChipLabel).join(", ") || "-"}</p>
                        <p>Interest: {details.interest_level ? formatChipLabel(details.interest_level) : "-"}</p>
                        <p>Stage: {details.discussion_stage ? formatChipLabel(details.discussion_stage) : "-"}</p>
                        <p>Audience: {details.audience_type ? formatChipLabel(details.audience_type) : "-"}</p>
                      </div>
                    );
                  })}
                {!selectedEmployeeTasks.some((task) => task.task_category === "visit") ? (
                  <p className="text-xs text-slate-500">No visit brand details found for this employee.</p>
                ) : null}
              </div>
            </div>

            <h4 className={`mt-5 text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Status Change Audit Log</h4>
            <div className={`mt-2 max-h-64 overflow-auto rounded-lg border ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-200"}`}>
              <table className="crm-data-table min-w-full border-collapse text-[12px]">
                <thead className={`sticky top-0 z-10 backdrop-blur ${uiTheme === "dark" ? "bg-[#404040]/95" : "bg-slate-50/95"}`}>
                  <tr className={`text-left text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                    {["Time", "Task", "Old", "New", "Note"].map((head) => (
                      <th key={head} className={`border-b px-2.5 py-2 ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-200"}`}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs
                    .filter((log) => selectedEmployeeTasks.some((task) => task.id === log.task_id))
                    .slice(0, 50)
                    .map((log) => {
                      const task = selectedEmployeeTasks.find((t) => t.id === log.task_id);
                      return (
                        <tr key={log.id} className={uiTheme === "dark" ? "odd:bg-[#f3f5f8] even:bg-[#404040]/60" : "odd:bg-white even:bg-slate-50/60"}>
                          <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{new Date(log.changed_at).toLocaleString()}</td>
                          <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{task?.task_title ?? log.task_id.slice(0, 8)}</td>
                          <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{statusLabels[log.old_status]}</td>
                          <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{statusLabels[log.new_status]}</td>
                          <td className={`border-b px-2.5 py-1.5 ${uiTheme === "dark" ? "border-[#404040] text-slate-300" : "border-slate-100 text-slate-700"}`}>{log.change_note || "-"}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
          ) : null}

          {activeSection === "meeting" ? (
            selectedMeetingForJoin ? (
              // During/after meeting: show MeetingRoom
              <section className="mx-auto w-full max-w-[1480px] h-[calc(100dvh-170px)] min-h-0 overflow-hidden md:h-[calc(100dvh-150px)]">
                <MeetingRoom
                  officeUser={officeUser}
                  uiTheme={uiTheme}
                  initialJoinCode={selectedMeetingForJoin.code}
                  teamMembers={teamMembers}
                  onMeetingSessionSaved={handleMeetingSessionSaved}
                  onExitMeeting={() => setSelectedMeetingForJoin(null)}
                />
              </section>
            ) : (
              // Meeting discovery: show list and create modal
              <section className={`mx-auto w-full max-w-[1480px] space-y-4 p-4 ${uiTheme === "dark" ? "bg-[#f3f5f8]" : "bg-slate-50"}`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-2xl font-bold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Meetings</h2>
                </div>

                <div className={`rounded-xl border ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-white"} p-6`}>
                  <MeetingListView
                    officeUser={officeUser}
                    accessToken={session?.access_token ?? null}
                    publicTeamOngoingEnabled={Boolean(automationSettings.public_team_ongoing_meetings)}
                    onCreateMeeting={() => setShowMeetingCreateModal(true)}
                    onSelectMeeting={(meeting) => {
                      if (!meeting) return;
                      const openMeetingRoom = () => {
                        setSelectedMeetingForJoin(meeting);
                      };

                      if (!session?.access_token) {
                        toast.message("Opening meeting room (session token unavailable for join API).");
                        openMeetingRoom();
                        return;
                      }

                      void fetch(`/api/meetings/${meeting.id}/join`, {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${session.access_token}`,
                        },
                      })
                        .then(async (response) => {
                          if (!response.ok) {
                            const payload = await response.json().catch(() => ({}));
                            const reason = typeof payload?.error === "string" ? payload.error : "Join API failed";
                            toast.warning(`Opening room directly. ${reason}.`);
                          }
                          openMeetingRoom();
                        })
                        .catch((err) => {
                          console.error("Failed to join meeting:", err);
                          toast.warning("Join API failed. Opening room directly.");
                          openMeetingRoom();
                        });
                    }}
                  />
                </div>

                <MeetingCreateModal
                  isOpen={showMeetingCreateModal}
                  onClose={() => setShowMeetingCreateModal(false)}
                  officeUser={officeUser}
                  accessToken={session?.access_token ?? null}
                  teamMembers={teamMembers}
                  onMeetingCreated={(meeting) => {
                    setShowMeetingCreateModal(false);
                    if (meeting.meeting_type === "instant") {
                      // For instant meetings, join immediately
                      setSelectedMeetingForJoin(meeting);
                    } else {
                      // For scheduled meetings, show success and return to list
                      toast.success("Meeting scheduled successfully!");
                    }
                  }}
                />
              </section>
            )
          ) : null}

          {activeSection === "institutions" ? (
            <section className="space-y-4">
              <div className={`crm-rail-card rounded-2xl border p-5 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Institution CRM</p>
                <p className={`mt-1 text-sm ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                  Search institutions, review visit history, monitor lead stages, and track pending follow-ups.
                </p>
                <div className={`crm-filter-panel mt-4 grid gap-3 rounded-xl border p-3 md:grid-cols-7 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/40" : "border-slate-200 bg-slate-50/80"}`}>
                  <input
                    value={adminInstitutionSearch}
                    onChange={(e) => setAdminInstitutionSearch(e.target.value)}
                    placeholder="Search by institution, city, area, contact"
                    className={`crm-input-soft h-10 rounded-lg border px-3 text-sm md:col-span-2 ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100 placeholder-slate-500" : "border-slate-300 bg-white"}`}
                  />
                  <select className={`crm-input-soft h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminInstitutionTypeFilter} onChange={(e) => setAdminInstitutionTypeFilter(e.target.value as InstitutionType | "all")}>
                    <option value="all">All Types</option>
                    <option value="School">School</option>
                    <option value="College">College</option>
                  </select>
                  <input value={adminInstitutionCityFilter} onChange={(e) => setAdminInstitutionCityFilter(e.target.value)} placeholder="City" className={`crm-input-soft h-10 rounded-lg border px-3 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100 placeholder-slate-500" : "border-slate-300 bg-white"}`} />
                  {officeUser.role === "admin" ? (
                    <label className={`crm-input-soft inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-300 hover:bg-[#454545]" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>
                      {institutionImportBusy ? "Importing..." : "Import Excel"}
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        disabled={institutionImportBusy}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleInstitutionExcelImport(file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  ) : (
                    <div className={`inline-flex h-10 items-center justify-center rounded-lg border px-3 text-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-400" : "border-slate-300 bg-slate-100 text-slate-500"}`}>
                      Read-only catalog
                    </div>
                  )}
                  <select className={`crm-input-soft h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminInstitutionBrandFilter} onChange={(e) => setAdminInstitutionBrandFilter(e.target.value as BrandRelevance | "all")}>
                    <option value="all">Brand Relevance</option>
                    <option value="vivencia">Vivencia</option>
                    <option value="onrol">ONROL</option>
                    <option value="both">Both</option>
                  </select>
                  <select className={`crm-input-soft h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminInstitutionLeadStageFilter} onChange={(e) => setAdminInstitutionLeadStageFilter(e.target.value as LeadStage | "all")}>
                    <option value="all">Lead Stage</option>
                    {[
                      "new_lead",
                      "contacted",
                      "visited",
                      "interested",
                      "followup_pending",
                      "proposal_expected",
                      "proposal_sent",
                      "demo_scheduled",
                      "negotiation",
                      "closed_won",
                      "closed_lost",
                    ].map((stage) => (
                      <option key={stage} value={stage}>
                        {formatChipLabel(stage)}
                      </option>
                    ))}
                  </select>
                  <select className={`crm-input-soft h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminInstitutionConversionFilter} onChange={(e) => setAdminInstitutionConversionFilter(e.target.value as ConversionStatus | "all")}>
                    <option value="all">Conversion</option>
                    <option value="not_converted">Not Converted</option>
                    <option value="converted">Converted</option>
                  </select>
                  <select className={`crm-input-soft h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminInstitutionLeadScoreBand} onChange={(e) => setAdminInstitutionLeadScoreBand(e.target.value as "all" | "high" | "medium" | "low")}>
                    <option value="all">Lead Score</option>
                    <option value="high">High (8-10)</option>
                    <option value="medium">Medium (4-7)</option>
                    <option value="low">Low (0-3)</option>
                  </select>
                  <select className={`crm-input-soft h-10 rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} value={adminInstitutionSort} onChange={(e) => setAdminInstitutionSort(e.target.value as typeof adminInstitutionSort)}>
                    <option value="recently_updated">Sort: Recently Updated</option>
                    <option value="last_visited">Sort: Last Visited</option>
                    <option value="most_visits">Sort: Most Visits</option>
                    <option value="city">Sort: City</option>
                    <option value="name">Sort: Name</option>
                  </select>
                </div>
                {institutionImportSummary ? (
                  <p className={`mt-2 text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>{institutionImportSummary}</p>
                ) : null}
                <p className={`mt-2 text-[11px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>
                  Catalog source: {institutionsLoadSource === "supabase" ? "Supabase" : institutionsLoadSource === "cache" ? "Local cache" : institutionsLoadSource === "tasks" ? "Task backfill" : "No data"}
                  {institutionsLoading ? " • Syncing..." : ""}
                </p>
                {institutionsLoadError ? (
                  <p className="mt-1 text-[11px] text-amber-700">
                    Supabase sync issue: {institutionsLoadError}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                <div className={`crm-rail-card rounded-2xl border p-4 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                  <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Institutions ({filteredInstitutions.length})</h3>
                  <div className="mt-3 max-h-[540px] space-y-2 overflow-auto">
                    {(filteredInstitutions || []).map((inst) => {
                      const visitCount = (tasks || []).filter((t) => t.task_category === "visit" && (t.institution_id === inst.id || t.institution_name === inst.name)).length;
                      return (
                        <button
                          key={inst.id}
                          onClick={() => setSelectedInstitutionId(inst.id)}
                          className={`crm-list-row w-full rounded-xl border p-3 text-left transition ${
                            selectedInstitutionId === inst.id
                              ? uiTheme === "dark" ? "border-orange-400 bg-[#404040]" : "border-blue-600 bg-blue-50/70"
                              : uiTheme === "dark" ? "border-[#454545] hover:bg-[#404040]" : "border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className={`font-medium ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{inst.name}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] ${uiTheme === "dark" ? "bg-[#454545] text-slate-300" : "bg-slate-100 text-slate-700"}`}>{formatChipLabel(inst.current_lead_stage || "new_lead")}</span>
                          </div>
                          <p className={`mt-1 text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                            {inst.institution_type} • {inst.city || "-"} {inst.area ? `• ${inst.area}` : ""}
                          </p>
                          <p className={`text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>
                            Visits: {visitCount} • Last: {inst.last_visit_at ? new Date(inst.last_visit_at).toLocaleDateString() : "-"}
                          </p>
                          <p className={`text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>
                            Conversion: {inst.conversion_status === "converted" ? "Converted" : "Not converted"} • Score: {Math.max(0, Math.min(10, Number(inst.lead_score ?? 0)))}
                          </p>
                        </button>
                      );
                    })}
                    {!filteredInstitutions.length ? (
                      <WorkspaceEmptyState
                        uiTheme={uiTheme}
                        title={institutionsLoading ? "Loading institution catalog" : "No institutions found"}
                        description={
                          institutionsLoading
                            ? "Syncing institutions from Supabase. This can take a few seconds."
                            : "Try broadening search and filters or reload the catalog."
                        }
                        actionLabel="Reload Catalog"
                        onAction={() => void reloadInstitutions()}
                      />
                    ) : null}
                  </div>
                </div>

                <div className={`crm-rail-card rounded-2xl border p-4 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                  <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Institution Detail</h3>
                  {!selectedInstitution ? (
                    <WorkspaceInlineNotice uiTheme={uiTheme} className="mt-3">
                      Select an institution to review full context.
                    </WorkspaceInlineNotice>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div className={`rounded-lg border p-3 text-xs ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                        <p className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{selectedInstitution.name}</p>
                        <p>{selectedInstitution.institution_type} • {selectedInstitution.city || "-"} {selectedInstitution.area ? `• ${selectedInstitution.area}` : ""}</p>
                        <p className="mt-1">Lead Stage: {formatChipLabel(selectedInstitution.current_lead_stage || "new_lead")}</p>
                        <p>Conversion: {selectedInstitution.conversion_status === "converted" ? "Converted" : "Not converted"}</p>
                        <p>
                          Revenue: Rs {Math.round(Number(selectedInstitution.final_value || selectedInstitution.conversion_value || selectedInstitution.expected_value || 0)).toLocaleString("en-IN")}
                        </p>
                        <p>Lead Score: {Math.max(0, Math.min(10, Number(selectedInstitution.lead_score ?? 0)))} / 10</p>
                        <p>Last Outcome: {selectedInstitution.last_outcome || "-"}</p>
                        <p>Contact: {selectedInstitution.primary_contact_name || "-"} {selectedInstitution.primary_contact_phone ? `• ${selectedInstitution.primary_contact_phone}` : ""}</p>
                        <div className="mt-2">
                          <button
                            onClick={() => void openInternalDiscussionForRecord("institution", selectedInstitution.id, selectedInstitution.name)}
                            disabled={messengerActionBusy === "open-record-discussion"}
                            className="crm-btn-secondary rounded-md border px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 disabled:opacity-60"
                          >
                            {messengerActionBusy === "open-record-discussion" ? "Opening..." : "Discuss Internally"}
                          </button>
                        </div>
                      </div>
                      {(() => {
                        const intelligence = institutionIntelligenceRows.find((row) => row.institution.id === selectedInstitution.id);
                        if (!intelligence) return null;
                        return (
                          <div className="rounded-lg border border-slate-200 bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sales Intelligence</p>
                            <p className="mt-1 text-xs text-slate-600">
                              Visits: {intelligence.visitCount} • Follow-up Pending: {intelligence.followupPending} • Overdue: {intelligence.overdueFollowups}
                            </p>
                            <p className="text-xs text-slate-600">
                              Last activity gap: {intelligence.lastActivityGapDays} day(s) • Repeated reschedules: {intelligence.repeatedReschedules}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {intelligence.tags.length ? (
                                intelligence.tags.map((tag) => (
                                  <span key={`${selectedInstitution.id}-${tag}`} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700">
                                    {formatChipLabel(tag)}
                                  </span>
                                ))
                              ) : (
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                                  Stable
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                      <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-[#454545] dark:bg-[#404040] p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visit Timeline</p>
                        <div className="mt-2 max-h-56 space-y-1 overflow-auto">
                          {getInstitutionVisitHistory(selectedInstitution.id, selectedInstitution.name).map((visit) => (
                            <div key={`${selectedInstitution.id}-${visit.id}`} className="rounded border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600">
                              <p className="font-medium text-slate-800">{visit.visit_date || visit.assigned_date} • {visit.visit_brand || "-"}</p>
                              <p>{visit.task_title}</p>
                              <p>Outcome: {(visit.visit_outcome || []).map((o) => visitOutcomeLabels[o]).join(", ") || "-"}</p>
                            </div>
                          ))}
                          {!getInstitutionVisitHistory(selectedInstitution.id, selectedInstitution.name).length ? (
                            <p className="text-xs text-slate-500">No visit history yet.</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {(activeSection as string) === "downloads" ? (
            <section className={`rounded-xl border p-5 shadow-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
              <div className="mb-5">
                <h3 className={`text-lg font-bold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Downloads</h3>
                <p className={`mt-0.5 text-sm ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Install ONROL on all your devices for the best experience.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Web PWA */}
                <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${installPromptEvent ? "bg-indigo-100 text-indigo-600" : uiTheme === "dark" ? "bg-[#454545] text-slate-400" : "bg-slate-200 text-slate-500"}`}>
                      <Download className="h-5 w-5" />
                    </span>
                    <div>
                      <p className={`text-sm font-bold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Web App</p>
                      <p className={`text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>PWA · All browsers</p>
                    </div>
                  </div>
                  <p className={`text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Install directly from your browser. Works offline, sends push notifications.</p>
                  {isStandalone ? (
                    <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold ${uiTheme === "dark" ? "bg-emerald-900/40 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                      <CheckCircle2 className="h-3.5 w-3.5" /> Already installed
                    </div>
                  ) : (
                    <button
                      onClick={() => void handleInstallApp()}
                      className={`mt-auto rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${installPromptEvent ? "bg-indigo-600 text-white hover:bg-indigo-500" : uiTheme === "dark" ? "border border-slate-600 text-slate-300 hover:bg-[#454545]" : "border border-slate-300 text-slate-600 hover:bg-white"}`}
                    >
                      {installPromptEvent ? "Install Now" : "Add to Home Screen"}
                    </button>
                  )}
                </div>
                {/* Android */}
                <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M17.523 15.342 16.1 13.92a5.99 5.99 0 0 0 .9-3.17 6 6 0 0 0-6-6 5.99 5.99 0 0 0-3.17.9L6.41 4.23A8 8 0 0 1 18.77 16.59l-1.247-1.248ZM4.638 7.637 6.06 9.06A5.989 5.989 0 0 0 5 11.75a6 6 0 0 0 6 6c.98 0 1.9-.243 2.69-.67l1.422 1.422A8 8 0 0 1 3.37 6.369l1.268 1.268Z"/><path d="m14.12 2.293 1.565 2.711a.75.75 0 1 1-1.3.75L12.82 3.043a.75.75 0 0 1 1.3-.75ZM8.585 3.043 7.015 5.754a.75.75 0 1 1-1.3-.75l1.57-2.711a.75.75 0 0 1 1.3.75Z"/></svg>
                    </span>
                    <div>
                      <p className={`text-sm font-bold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Android</p>
                      <p className={`text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>APK · Direct install</p>
                    </div>
                  </div>
                  <p className={`text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Native app with offline support, GPS check-in, and push notifications.</p>
                  {(import.meta.env.VITE_APK_DOWNLOAD_URL as string | undefined)?.trim() ? (
                    <a
                      href={(import.meta.env.VITE_APK_DOWNLOAD_URL as string).trim()}
                      download
                      className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
                    >
                      <FileDown className="h-3.5 w-3.5" /> Download APK
                    </a>
                  ) : (
                    <p className={`mt-auto text-[11px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>APK not yet available.</p>
                  )}
                </div>
                {/* Windows */}
                <div className={`rounded-2xl border p-4 flex flex-col gap-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-orange-600">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M0 3.449 9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
                    </span>
                    <div>
                      <p className={`text-sm font-bold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Windows</p>
                      <p className={`text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Desktop app · x64</p>
                    </div>
                  </div>
                  <p className={`text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Full desktop experience with system tray, global shortcuts, and auto-updates.</p>
                  <div className="mt-auto flex flex-col gap-1.5">
                    <a
                      href={((import.meta.env.VITE_DESKTOP_INSTALLER_URL as string | undefined)?.trim()) || "https://onrol.in/downloads/onrol-setup.exe"}
                      download
                      className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors"
                    >
                      <FileDown className="h-3.5 w-3.5" /> Download Installer
                    </a>
                    <a
                      href={((import.meta.env.VITE_DESKTOP_PORTABLE_URL as string | undefined)?.trim()) || "https://onrol.in/downloads/onrol-portable.exe"}
                      download
                      className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-1.5 text-xs font-medium transition-colors ${uiTheme === "dark" ? "border-slate-600 text-slate-300 hover:bg-[#454545]" : "border-slate-300 text-slate-600 hover:bg-white"}`}
                    >
                      Portable (.exe)
                    </a>
                  </div>
                </div>
                {/* iOS — coming soon */}
                <div className={`rounded-2xl border p-4 flex flex-col gap-3 opacity-50 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${uiTheme === "dark" ? "bg-[#454545] text-slate-400" : "bg-slate-200 text-slate-500"}`}>
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    </span>
                    <div>
                      <p className={`text-sm font-bold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>iOS</p>
                      <p className={`text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>iPhone & iPad</p>
                    </div>
                  </div>
                  <p className={`text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Native iOS app. App Store listing in development.</p>
                  <div className={`mt-auto flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold ${uiTheme === "dark" ? "border-slate-600 text-slate-400" : "border-slate-300 text-slate-400"}`}>
                    Coming Soon
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "settings" ? (
            <section className="space-y-0 pb-4">
              {/* ── Cover + Avatar hero ─────────────────────────────────────── */}
              <div className={`relative rounded-2xl overflow-hidden ${uiTheme === "dark" ? "border border-[#454545]" : "border border-slate-200"}`}>
                {/* Cover banner */}
                <div
                  className="h-28 w-full"
                  style={{ background: officeUser.role === "admin"
                    ? "linear-gradient(135deg,#454545 0%,#312e81 40%,#4f46e5 100%)"
                    : "linear-gradient(135deg,#f3f5f8 0%,#404040 40%,#0369a1 100%)" }}
                />
                {/* Avatar + info overlay */}
                <div className={`px-5 pb-5 ${uiTheme === "dark" ? "bg-[#f3f5f8]" : "bg-white"}`}>
                  <div className="flex items-end gap-4 -mt-10">
                    {/* Avatar */}
                    <div className="relative group flex-shrink-0">
                      <div
                        className="h-20 w-20 rounded-2xl overflow-hidden ring-4 cursor-pointer shadow-xl"
                        style={{ ringColor: uiTheme === "dark" ? "#404040" : "#fff" }}
                        onClick={() => { const el = document.getElementById("avatar-upload-input"); if (el) el.click(); }}
                      >
                        {(profileDraft.avatarUrl ?? (officeUser as Record<string,unknown>).avatar_url) ? (
                          <img
                            src={(profileDraft.avatarUrl ?? (officeUser as Record<string,unknown>).avatar_url) as string}
                            alt={officeUser.full_name ?? ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white" style={{ background: officeUser.role === "admin" ? "linear-gradient(135deg,#4f46e5,#7c3aed)" : "linear-gradient(135deg,#0369a1,#0891b2)" }}>
                            {(officeUser.full_name ?? officeUser.email).slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl">
                          <Upload className="h-5 w-5 text-white" />
                          <span className="mt-1 text-[10px] text-white font-medium">Change</span>
                        </div>
                      </div>
                      <input
                        id="avatar-upload-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB"); return; }
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("upload_preset", "onrol_hub_unsigned");
                            formData.append("folder", "onrol_hub_uploads/avatars");
                            formData.append("public_id", `avatar_${officeUser.id}_${Date.now()}`);
                            const res = await fetch(
                              "https://api.cloudinary.com/v1_1/dumpn4wcq/image/upload",
                              { method: "POST", body: formData }
                            );
                            if (!res.ok) {
                              let errMsg = "Upload failed";
                              try { const j = await res.json() as { error?: { message?: string } }; errMsg = j.error?.message ?? errMsg; } catch { /* ignore */ }
                              throw new Error(errMsg);
                            }
                            const result = await res.json() as { secure_url: string };
                            const publicUrl = `${result.secure_url}?t=${Date.now()}`;
                            setProfileDraft((prev) => ({ ...prev, avatarUrl: publicUrl }));
                            toast.success("Photo uploaded — click Save Profile to apply.");
                          } catch (err: unknown) {
                            const errMsg = err && typeof err === "object" && "message" in err ? String((err as {message:unknown}).message) : "unknown error";
                            toast.error("Photo upload failed: " + errMsg);
                            console.error("[avatar upload]", err);
                          }
                        }}
                      />
                    </div>
                    {/* Name / role */}
                    <div className="flex-1 min-w-0 pt-10">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-lg font-bold truncate ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{officeUser.full_name ?? officeUser.email}</p>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          officeUser.role === "admin"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}>{officeUser.role}</span>
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{officeUser.email}</p>
                      {profileDraft.statusMessage && (
                        <p className={`text-xs mt-1 italic ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>"{profileDraft.statusMessage}"</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Tab bar ─────────────────────────────────────────────────── */}
              <div className={`mt-3 flex gap-1 rounded-xl p-1 ${uiTheme === "dark" ? "bg-[#404040]" : "bg-slate-100"}`}>
                {(["profile", "notifications", "account"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSettingsTab(tab)}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold capitalize transition-all ${
                      settingsTab === tab
                        ? uiTheme === "dark" ? "bg-[#454545] text-slate-100 shadow" : "bg-white text-slate-900 shadow"
                        : uiTheme === "dark" ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >{tab}</button>
                ))}
              </div>

              {/* ═══════════════ PROFILE TAB ════════════════════════════════ */}
              {settingsTab === "profile" ? (
                <div className={`mt-3 rounded-2xl border p-5 space-y-4 ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                  {officeUser.role === "admin" && (
                    <div className={`rounded-xl border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                      <p className={`text-xs font-semibold ${uiTheme === "dark" ? "text-slate-200" : "text-slate-800"}`}>Quick Team Chat</p>
                      <p className={`mt-0.5 text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Create a group chat that includes all team members at once.</p>
                      <div className="mt-2 flex gap-2">
                        <input
                          className={`h-8 flex-1 rounded-lg border px-2.5 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#f3f5f8] text-slate-100 placeholder:text-slate-500" : "border-slate-300 bg-white"}`}
                          placeholder="Group name (e.g. All Team)"
                          value={createTeamName}
                          onChange={(e) => setCreateTeamName(e.target.value)}
                        />
                        <button
                          onClick={() => {
                            if (!createTeamName.trim()) setCreateTeamName("All Team");
                            void createTeamGroupConversation();
                            setActiveSection("messenger_inbox");
                          }}
                          className="rounded-lg bg-[#f3f5f8] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#f3f5f8]/80"
                        >Create</button>
                      </div>
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Full Name</label>
                      <input
                        value={profileDraft.fullName}
                        onChange={(e) => setProfileDraft((prev) => ({ ...prev, fullName: e.target.value }))}
                        className={`h-10 w-full rounded-xl border px-3 text-sm transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100 placeholder-slate-500 focus:border-indigo-500" : "border-slate-300 bg-slate-50 text-slate-900 focus:border-indigo-400 focus:bg-white"}`}
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Department</label>
                      <input
                        value={profileDraft.department}
                        onChange={(e) => setProfileDraft((prev) => ({ ...prev, department: e.target.value }))}
                        className={`h-10 w-full rounded-xl border px-3 text-sm transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100 placeholder-slate-500 focus:border-indigo-500" : "border-slate-300 bg-slate-50 text-slate-900 focus:border-indigo-400 focus:bg-white"}`}
                        placeholder="Operations"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Phone</label>
                      <input
                        value={profileDraft.phone ?? ""}
                        onChange={(e) => setProfileDraft((prev) => ({ ...prev, phone: e.target.value }))}
                        className={`h-10 w-full rounded-xl border px-3 text-sm transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100 placeholder-slate-500 focus:border-indigo-500" : "border-slate-300 bg-slate-50 text-slate-900 focus:border-indigo-400 focus:bg-white"}`}
                        placeholder="+91 9999 999999"
                        type="tel"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>LinkedIn</label>
                      <input
                        value={profileDraft.linkedin ?? ""}
                        onChange={(e) => setProfileDraft((prev) => ({ ...prev, linkedin: e.target.value }))}
                        className={`h-10 w-full rounded-xl border px-3 text-sm transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100 placeholder-slate-500 focus:border-indigo-500" : "border-slate-300 bg-slate-50 text-slate-900 focus:border-indigo-400 focus:bg-white"}`}
                        placeholder="linkedin.com/in/yourname"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Status Message</label>
                      <input
                        value={profileDraft.statusMessage ?? ""}
                        onChange={(e) => setProfileDraft((prev) => ({ ...prev, statusMessage: e.target.value }))}
                        className={`h-10 w-full rounded-xl border px-3 text-sm transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100 placeholder-slate-500 focus:border-indigo-500" : "border-slate-300 bg-slate-50 text-slate-900 focus:border-indigo-400 focus:bg-white"}`}
                        placeholder="What are you working on?"
                        maxLength={80}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                        Bio <span className={`font-normal normal-case ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>{(profileDraft.bio ?? "").length}/160</span>
                      </label>
                      <textarea
                        value={profileDraft.bio ?? ""}
                        onChange={(e) => setProfileDraft((prev) => ({ ...prev, bio: e.target.value.slice(0, 160) }))}
                        rows={3}
                        className={`w-full rounded-xl border px-3 py-2 text-sm transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100 placeholder-slate-500 focus:border-indigo-500" : "border-slate-300 bg-slate-50 text-slate-900 focus:border-indigo-400 focus:bg-white"}`}
                        placeholder="A short bio about yourself..."
                        maxLength={160}
                      />
                    </div>
                  </div>
                  {/* Read-only info */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className={`rounded-xl border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/50" : "border-slate-200 bg-slate-50"}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Email</p>
                      <p className={`mt-1 text-sm font-medium truncate ${uiTheme === "dark" ? "text-slate-200" : "text-slate-800"}`}>{officeUser.email}</p>
                    </div>
                    <div className={`rounded-xl border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/50" : "border-slate-200 bg-slate-50"}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Role</p>
                      <p className={`mt-1 text-sm font-medium capitalize ${uiTheme === "dark" ? "text-slate-200" : "text-slate-800"}`}>{officeUser.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      onClick={saveProfileSettings}
                      disabled={profileSaving}
                      className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md active:scale-95 transition-all disabled:opacity-60 disabled:scale-100"
                      style={{ background: profileSaving ? "rgba(99,102,241,0.5)" : "linear-gradient(135deg,#6366f1,#7c3aed)" }}
                    >
                      {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {profileSaving ? "Saving..." : "Save Profile"}
                    </button>
                    <p className={`text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Click avatar to change photo · Max 2 MB</p>
                  </div>
                </div>
              ) : null}

              {/* ═══════════════ NOTIFICATIONS TAB ══════════════════════════ */}
              {settingsTab === "notifications" ? (
                <div className="mt-3 space-y-3">
                  {/* Smart reminders */}
                  <div className={`rounded-2xl border p-4 ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Smart Reminders</p>
                      <button
                        onClick={() => void runAutomationEngine()}
                        disabled={runningAutomation}
                        className={`inline-flex items-center gap-1 rounded border px-2.5 py-1.5 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-300 hover:bg-slate-600" : "border-slate-300 bg-white text-slate-700"}`}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        {runningAutomation ? "Scanning..." : "Run Smart Scan"}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {[
                        { key: "in_app_enabled", label: "In-app reminders" },
                        { key: "follow_up_reminders", label: "Follow-up reminders" },
                        { key: "visit_reminders", label: "Visit reminders" },
                        { key: "morning_summary", label: "Morning summary" },
                        { key: "push_enabled", label: "Push reminders" },
                        ...(officeUser.role === "admin"
                          ? [
                              { key: "admin_overdue_alerts", label: "Admin overdue alerts" },
                              { key: "admin_inactive_institution_alerts", label: "Inactive institution alerts" },
                              { key: "admin_inactive_employee_alerts", label: "Inactive employee alerts" },
                              { key: "admin_stale_pipeline_alerts", label: "Stale proposal/demo alerts" },
                            ]
                          : []),
                      ].map((item) => (
                        <label key={item.key} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                          {item.label}
                          <input
                            type="checkbox"
                            checked={Boolean(notificationPrefs[item.key as keyof NotificationPrefs])}
                            onChange={(e) => setNotificationPrefs((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                            className="accent-indigo-600 h-4 w-4"
                          />
                        </label>
                      ))}
                    </div>
                    <label className={`mt-2 flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                      Notification &amp; message sounds
                      <input type="checkbox" checked={notifSettings.sound_enabled} onChange={(e) => setNotifSettings((prev) => ({ ...prev, sound_enabled: e.target.checked }))} className="accent-indigo-600 h-4 w-4" />
                    </label>
                  </div>
                  {/* Channel alerts */}
                  <div className={`rounded-2xl border p-4 ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                    <p className={`text-sm font-semibold mb-3 ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Channel Alerts</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {([["messages", "Message alerts"], ["tasks", "Task & visit alerts"], ["meetings", "Meeting alerts"], ["admin", "Admin alerts"]] as const).map(([key, label]) => (
                        <label key={`notif-ch-${key}`} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                          <span>{label}</span>
                          <input type="checkbox" checked={channelPrefs[key]} onChange={(e) => setChannelPrefs((prev) => ({ ...prev, [key]: e.target.checked }))} className="accent-indigo-600 h-4 w-4" />
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Messenger preferences */}
                  <div className={`rounded-2xl border p-4 ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Messenger Preferences</p>
                      <button onClick={() => void saveMessengerSettings()} className={`rounded border px-2.5 py-1.5 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-300 hover:bg-slate-600" : "border-slate-300 bg-white text-slate-700"}`}>Save</button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {[
                        { key: "push_dm", label: "Direct message push" },
                        { key: "push_mentions", label: "Mention push" },
                        { key: "push_announcements", label: "Announcement push" },
                        { key: "mute_general_groups", label: "Mute general groups" },
                        { key: "show_read_receipts", label: "Show read receipts" },
                        { key: "show_presence", label: "Show presence" },
                      ].map((item) => (
                        <label key={`ms-${item.key}`} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                          <span>{item.label}</span>
                          <input type="checkbox" checked={Boolean(messengerSettings[item.key as keyof typeof messengerSettings])} onChange={(e) => setMessengerSettings((prev) => ({ ...prev, [item.key]: e.target.checked }))} className="accent-indigo-600 h-4 w-4" />
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Desktop → "also enable browser push" nudge (Option A for closed-app delivery) */}
                  {desktopRuntime ? (
                    <div className={`rounded-2xl border p-4 ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]/30" : "border-indigo-200 bg-indigo-50"}`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-full bg-indigo-100 p-1.5">
                          <Bell className="h-4 w-4 text-indigo-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-semibold ${uiTheme === "dark" ? "text-indigo-100" : "text-indigo-900"}`}>
                            Get notifications even when ONROL Desktop is closed
                          </p>
                          <p className={`mt-1 text-xs leading-relaxed ${uiTheme === "dark" ? "text-indigo-200" : "text-indigo-800"}`}>
                            The desktop app only shows pings while it's running. For notifications when you've fully quit the app, log in at <span className="font-semibold">onrol.in</span> in Chrome or Edge once and click <span className="font-semibold">Enable Notifications</span> there. Your system browser keeps a tiny background service alive that delivers pings system-wide — the same way Slack and Discord work on desktop.
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void openExternalUrl("https://onrol.in/task/app")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
                            >
                              Open web app in browser →
                            </button>
                            <button
                              type="button"
                              onClick={() => void openExternalUrl("https://support.google.com/chrome/answer/3220216")}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                            >
                              How to enable
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Web Push */}
                  <div className={`rounded-2xl border p-4 ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Web Push</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${webPushConfigured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                        {webPushConfigured ? "Configured" : "Needs Setup"}
                      </span>
                    </div>
                    {!webPushConfigured && (
                      <p className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        Add <code>VITE_VAPID_PUBLIC_KEY</code> to your frontend environment and redeploy.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleEnableNotifications} disabled={pushBusy || !webPushConfigured} className="rounded-lg bg-[#f3f5f8] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                        {pushBusy && pushAction === "enable" ? "Enabling..." : "Enable Notifications"}
                      </button>
                      <button onClick={handleSendTestNotification} disabled={pushBusy || !webPushConfigured} className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-200" : "border-slate-300 bg-white text-slate-800"}`}>
                        {pushBusy && pushAction === "test" ? "Sending..." : "Send Test"}
                      </button>
                      <button onClick={handleSendReminderPush} disabled={pushBusy || !webPushConfigured} className={`rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50 ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-200" : "border-slate-300 bg-white text-slate-800"}`}>
                        {pushBusy && pushAction === "reminder" ? "Sending..." : "Reminder Push"}
                      </button>
                      <button onClick={() => void markAllNotificationsRead()} disabled={notificationsBusy} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-200" : "border-slate-300 bg-white text-slate-800"}`}>
                        <span className="inline-flex items-center gap-1"><CheckCheck className="h-4 w-4" /> {notificationsBusy ? "Working..." : "Mark All Read"}</span>
                      </button>
                    </div>
                    {pushMessage && <p className={`mt-2 text-xs ${pushStatus === "error" ? "text-rose-600" : "text-emerald-700"}`}>{pushMessage}</p>}
                  </div>
                  {/* Desktop */}
                  {desktopRuntime ? (
                    <div className={`rounded-2xl border p-4 space-y-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Desktop Settings</p>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${uiTheme === "dark" ? "bg-emerald-900/30 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>Connected</span>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          { key: "runInBackground", label: "Run in background on close" },
                          { key: "notificationsEnabled", label: "Native desktop notifications" },
                          { key: "notificationSound", label: "Desktop notification sounds" },
                          { key: "globalHotkeysEnabled", label: "Global keyboard shortcuts" },
                        ].map((item) => (
                          <label key={`dp-${item.key}`} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                            <span>{item.label}</span>
                            <input type="checkbox" checked={Boolean(desktopSettings[item.key as keyof typeof desktopSettings])} disabled={desktopSettingsSaving} onChange={(e) => { void updateDesktopSettings({ [item.key]: e.target.checked }); }} className="accent-indigo-600 h-4 w-4" />
                          </label>
                        ))}
                        <label className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                          <span>Launch on system startup</span>
                          <input type="checkbox" checked={Boolean(desktopSettings.launchOnStartup)} disabled={desktopSettingsSaving} onChange={async (e) => {
                            if (!window.desktopAPI) return;
                            try { setDesktopSettingsSaving(true); await window.desktopAPI.setLaunchOnStartup(e.target.checked); setDesktopSettings((prev) => ({ ...prev, launchOnStartup: e.target.checked })); }
                            catch (error: unknown) { toast.error(getErrorMessage(error, "Could not update startup setting.")); }
                            finally { setDesktopSettingsSaving(false); }
                          }} className="accent-indigo-600 h-4 w-4" />
                        </label>
                      </div>
                      {/* Quiet Hours */}
                      <div className={`rounded-xl border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Quiet Hours</p>
                          <label className={`inline-flex items-center gap-2 text-xs ${uiTheme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                            <input type="checkbox" checked={quietHoursEnabled} onChange={(e) => { setQuietHoursEnabled(e.target.checked); setDesktopSettings((prev) => ({ ...prev, quietHoursEnabled: e.target.checked })); if (desktopRuntime) void updateDesktopSettings({ quietHoursEnabled: e.target.checked }); }} className="accent-indigo-600" />
                            Enabled
                          </label>
                        </div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <label className={`flex items-center justify-between rounded border px-2 py-1.5 text-xs ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8] text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
                            Start
                            <input type="time" value={desktopSettings.quietHoursStart || "22:00"} onChange={(e) => { setDesktopSettings((prev) => ({ ...prev, quietHoursStart: e.target.value })); if (desktopRuntime) void updateDesktopSettings({ quietHoursStart: e.target.value }); }} className={`rounded border px-1 py-0.5 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white text-slate-800"}`} />
                          </label>
                          <label className={`flex items-center justify-between rounded border px-2 py-1.5 text-xs ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8] text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
                            End
                            <input type="time" value={desktopSettings.quietHoursEnd || "07:00"} onChange={(e) => { setDesktopSettings((prev) => ({ ...prev, quietHoursEnd: e.target.value })); if (desktopRuntime) void updateDesktopSettings({ quietHoursEnd: e.target.value }); }} className={`rounded border px-1 py-0.5 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white text-slate-800"}`} />
                          </label>
                        </div>
                      </div>
                      {/* Display Scale */}
                      <div className={`rounded-xl border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Display Scale</p>
                        <div className="flex items-center gap-3">
                          <button onClick={async () => { const r = await window.desktopAPI?.zoomOut(); if (r?.zoomFactor) setDesktopSettings((p) => ({ ...p, zoomFactor: r.zoomFactor })); }} className={`h-7 w-7 rounded border text-sm font-bold ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-200" : "border-slate-300 bg-white text-slate-700"}`}>−</button>
                          <input type="range" min={50} max={200} step={10} value={Math.round((desktopSettings.zoomFactor ?? 1.0) * 100)} onChange={async (e) => { const factor = Number(e.target.value) / 100; setDesktopSettings((p) => ({ ...p, zoomFactor: factor })); await window.desktopAPI?.setZoomLevel(factor); }} className="flex-1 accent-blue-500" />
                          <button onClick={async () => { const r = await window.desktopAPI?.zoomIn(); if (r?.zoomFactor) setDesktopSettings((p) => ({ ...p, zoomFactor: r.zoomFactor })); }} className={`h-7 w-7 rounded border text-sm font-bold ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-200" : "border-slate-300 bg-white text-slate-700"}`}>+</button>
                          <span className={`w-10 text-center text-xs font-semibold tabular-nums ${uiTheme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{Math.round((desktopSettings.zoomFactor ?? 1.0) * 100)}%</span>
                          <button onClick={async () => { const r = await window.desktopAPI?.zoomReset(); if (r?.zoomFactor) setDesktopSettings((p) => ({ ...p, zoomFactor: r.zoomFactor })); }} className={`rounded border px-2 py-1 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-200" : "border-slate-300 bg-white text-slate-700"}`}>Reset</button>
                        </div>
                        <p className={`mt-1 text-[10px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Ctrl+= / Ctrl+− to adjust. Ctrl+0 to reset.</p>
                      </div>
                      {/* Updates */}
                      <div className="flex flex-wrap gap-2">
                        <button onClick={async () => { if (!window.desktopAPI) return; try { setDesktopUpdateBusy(true); const result = await window.desktopAPI.checkForUpdates(); if (!result?.ok) toast.message(result?.message || "Update check is not available in this build."); } catch (error: unknown) { toast.error(getErrorMessage(error, "Unable to check for updates.")); } finally { setDesktopUpdateBusy(false); } }} disabled={desktopUpdateBusy} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-200" : "border-slate-300 bg-white text-slate-700"}`}>{desktopUpdateBusy ? "Checking..." : "Check for Updates"}</button>
                        <button onClick={async () => { if (!window.desktopAPI) return; try { const result = await window.desktopAPI.installUpdate(); if (!result?.ok) toast.message("No downloaded update available yet."); } catch (error: unknown) { toast.error(getErrorMessage(error, "Unable to install update.")); } }} className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-200" : "border-slate-300 bg-white text-slate-700"}`}>Install Update</button>
                      </div>
                      {desktopUpdateState && desktopUpdateState.status !== "idle" ? (
                        <div className={`rounded-xl border p-3 ${desktopUpdateState.status === "ready" ? (uiTheme === "dark" ? "border-emerald-700 bg-emerald-950/30" : "border-emerald-300 bg-emerald-50") : desktopUpdateState.status === "error" ? (uiTheme === "dark" ? "border-rose-700 bg-rose-950/30" : "border-rose-200 bg-rose-50") : uiTheme === "dark" ? "border-[#454545] bg-[#404040]/60" : "border-slate-200 bg-slate-50"}`}>
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-xs font-semibold ${desktopUpdateState.status === "ready" ? (uiTheme === "dark" ? "text-emerald-300" : "text-emerald-700") : desktopUpdateState.status === "error" ? (uiTheme === "dark" ? "text-rose-300" : "text-rose-700") : uiTheme === "dark" ? "text-slate-200" : "text-slate-800"}`}>
                              {desktopUpdateState.status === "ready" ? "Update Ready" : desktopUpdateState.status === "error" ? "Update Failed" : desktopUpdateState.status === "downloading" ? "Downloading..." : desktopUpdateState.status === "checking" ? "Checking..." : desktopUpdateState.status === "up-to-date" ? "Up to Date" : "Update Available"}
                            </p>
                            {desktopUpdateState.status === "ready" && <button onClick={async () => { try { await window.desktopAPI?.installUpdate(); } catch { toast.error("Could not install update."); } }} className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500">Restart & Install</button>}
                          </div>
                          {desktopUpdateState.message && <p className={`mt-1 text-[11px] ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>{desktopUpdateState.message}</p>}
                          {desktopUpdateState.status === "downloading" && typeof desktopUpdateState.progress === "number" && (
                            <div className="mt-2">
                              <div className={`h-2 w-full overflow-hidden rounded-full ${uiTheme === "dark" ? "bg-[#454545]" : "bg-slate-200"}`}>
                                <div className="h-full rounded-full bg-blue-500 transition-all duration-300" style={{ width: `${Math.round(desktopUpdateState.progress)}%` }} />
                              </div>
                              <p className={`mt-1 text-[10px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>{Math.round(desktopUpdateState.progress)}%{desktopUpdateState.bytesPerSecond ? ` · ${(desktopUpdateState.bytesPerSecond / 1024).toFixed(0)} KB/s` : ""}</p>
                            </div>
                          )}
                        </div>
                      ) : null}
                      {/* Diagnostics */}
                      <div className={`rounded-xl border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className={`text-xs font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Startup Diagnostics</p>
                          <button onClick={() => void loadDesktopHealthState()} className={`rounded border px-2 py-1 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-200" : "border-slate-300 bg-white text-slate-700"}`}>Refresh</button>
                        </div>
                        {desktopHealthState ? (
                          <div className="grid gap-1.5 sm:grid-cols-2">
                            {[["Tray icon", Boolean(desktopHealthState.trayReady)], ["Window runtime", Boolean(desktopHealthState.windowReady)], ["Background mode", Boolean(desktopHealthState.backgroundEnabled)], ["Startup launch", Boolean(desktopHealthState.startupEnabled)], ["Notifications", Boolean(desktopHealthState.notificationsEnabled)], ["System support", Boolean(desktopHealthState.notificationSupported)]].map(([label, ok]) => (
                              <div key={`h-${label}`} className={`flex items-center justify-between rounded border px-2 py-1 text-xs ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8] text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
                                <span>{label as string}</span>
                                <span className={`rounded-full px-1.5 py-0.5 font-semibold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{ok ? "OK" : "Check"}</span>
                              </div>
                            ))}
                          </div>
                        ) : <p className={`text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-600"}`}>Run diagnostics to validate tray/startup/notifications.</p>}
                      </div>
                      {/* Notification History */}
                      <div className={`rounded-xl border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-slate-50"}`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className={`text-xs font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Desktop Notification History</p>
                          <div className="flex gap-1.5">
                            <button onClick={() => void loadDesktopNotificationHistory()} className={`rounded border px-2 py-1 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-200" : "border-slate-300 bg-white text-slate-700"}`}>Refresh</button>
                            <button onClick={async () => { if (!window.desktopAPI) return; await window.desktopAPI.clearNotificationHistory(); await loadDesktopNotificationHistory(); }} className={`rounded border px-2 py-1 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-200" : "border-slate-300 bg-white text-slate-700"}`}>Clear</button>
                          </div>
                        </div>
                        <div className="max-h-40 space-y-1 overflow-auto">
                          {desktopNotificationHistory.slice(0, 40).map((item, index) => (
                            <div key={`dnh-${index}`} className={`rounded border px-2 py-1.5 text-xs ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8] text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
                              <p className="font-semibold">{String(item.title || "Notification")}</p>
                              {item.body && <p className={uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}>{String(item.body)}</p>}
                              {item.createdAt && <p className="text-slate-500">{new Date(String(item.createdAt)).toLocaleString()}</p>}
                            </div>
                          ))}
                          {!desktopNotificationHistory.length && <p className={`text-xs ${uiTheme === "dark" ? "text-slate-500" : "text-slate-500"}`}>No history yet.</p>}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* ═══════════════ ACCOUNT TAB ════════════════════════════════ */}
              {settingsTab === "account" ? (
                <div className="mt-3 space-y-3">
                  {/* Theme */}
                  <div className={`rounded-2xl border p-4 ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                    <p className={`text-sm font-semibold mb-3 ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Appearance</p>
                    <div className="flex gap-3">
                      {([["light", "Light"], ["dark", "Dark"]] as const).map(([mode, label]) => (
                        <button
                          key={mode}
                          onClick={() => setUiTheme(mode)}
                          className={`flex-1 rounded-xl border py-3 text-sm font-semibold transition-all ${uiTheme === mode
                            ? mode === "dark" ? "border-indigo-500 bg-[#f3f5f8] text-indigo-300" : "border-indigo-400 bg-indigo-50 text-indigo-700"
                            : uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-400 hover:border-slate-500" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {mode === "light" ? "☀️" : "🌙"} {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Admin automation */}
                  {officeUser.role === "admin" ? (
                    <div className={`rounded-2xl border p-4 space-y-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                      <p className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Automation Controls</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className={`text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                          High-interest inactive days
                          <input type="number" min={1} value={automationSettings.high_interest_inactive_days} onChange={(e) => setAutomationSettings((prev) => ({ ...prev, high_interest_inactive_days: Number(e.target.value || 1) }))} className={`mt-1 h-9 w-full rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 text-slate-900"}`} />
                        </label>
                        <label className={`text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                          Proposal stale days
                          <input type="number" min={1} value={automationSettings.proposal_stale_days} onChange={(e) => setAutomationSettings((prev) => ({ ...prev, proposal_stale_days: Number(e.target.value || 1) }))} className={`mt-1 h-9 w-full rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 text-slate-900"}`} />
                        </label>
                        <label className={`text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                          Demo stale days
                          <input type="number" min={1} value={automationSettings.demo_stale_days} onChange={(e) => setAutomationSettings((prev) => ({ ...prev, demo_stale_days: Number(e.target.value || 1) }))} className={`mt-1 h-9 w-full rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 text-slate-900"}`} />
                        </label>
                        <label className={`text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
                          Inactive employee days
                          <input type="number" min={1} value={automationSettings.inactive_employee_days} onChange={(e) => setAutomationSettings((prev) => ({ ...prev, inactive_employee_days: Number(e.target.value || 1) }))} className={`mt-1 h-9 w-full rounded-lg border px-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 text-slate-900"}`} />
                        </label>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[ 
                          { key: "in_app_alerts_enabled", label: "In-app alerts enabled" },
                          { key: "push_jobs_enabled", label: "Push jobs enabled" },
                          { key: "auto_followup_tasks_enabled", label: "Auto follow-up tasks" },
                          { key: "auto_stage_suggestions_enabled", label: "Auto stage suggestions" },
                          { key: "public_team_ongoing_meetings", label: "Public team ongoing meetings" },
                        ].map((item) => (
                          <label key={item.key} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${uiTheme === "dark" ? "border-[#454545] bg-[#404040] text-slate-300" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                            {item.label}
                            <input type="checkbox" checked={Boolean(automationSettings[item.key as keyof AutomationSettings])} onChange={(e) => setAutomationSettings((prev) => ({ ...prev, [item.key]: e.target.checked }))} className="accent-indigo-600 h-4 w-4" />
                          </label>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={saveAutomationSettings} className="rounded-lg bg-[#f3f5f8] px-3 py-2 text-sm font-medium text-white">Save Automation</button>
                        <button onClick={() => void runAutomationEngine()} className={`rounded-lg border px-3 py-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-300" : "border-slate-300 bg-white text-slate-700"}`}>Run Rule Scan</button>
                      </div>
                      {/* AI Copilot */}
                      <div className={`rounded-xl border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/80" : "border-slate-200 bg-slate-50/80"}`}>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className={`text-xs font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-300" : "text-slate-600"}`}>Automation AI Copilot</p>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${uiTheme === "dark" ? "bg-[#f3f5f8]/40 text-orange-300" : "bg-blue-100 text-orange-700"}`}>Mistral</span>
                        </div>
                        <p className={`text-xs mb-2 ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Ask for automation ideas, SLA cleanup plans, follow-up nudges, and team reminders.</p>
                        <textarea value={automationAiPrompt} onChange={(e) => setAutomationAiPrompt(e.target.value)} placeholder="Example: Suggest 5 automation rules to reduce overdue follow-ups by 30% this week." rows={3} className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${uiTheme === "dark" ? "border-slate-600 bg-[#f3f5f8] text-slate-100 placeholder:text-slate-500" : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"}`} />
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button onClick={() => void runAutomationAiCopilot()} disabled={automationAiBusy} className="rounded-lg bg-[#f3f5f8] px-3 py-2 text-sm font-medium text-white disabled:opacity-60">{automationAiBusy ? "Generating..." : "Generate AI Plan"}</button>
                          <button onClick={() => { setAutomationAiPrompt(""); setAutomationAiResponse(""); setAutomationAiError(null); }} className={`rounded-lg border px-3 py-2 text-sm ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-300" : "border-slate-300 bg-white text-slate-700"}`}>Clear</button>
                        </div>
                        {automationAiError && <p className="mt-2 text-xs text-rose-500">{automationAiError}</p>}
                        {automationAiResponse && <div className={`mt-2 rounded-lg border px-3 py-2 text-xs whitespace-pre-wrap ${uiTheme === "dark" ? "border-slate-600 bg-[#f3f5f8] text-slate-200" : "border-slate-300 bg-white text-slate-700"}`}>{automationAiResponse}</div>}
                      </div>
                    </div>
                  ) : null}
                  {/* Sign out */}
                  <div className={`rounded-2xl border p-4 ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                    <p className={`text-sm font-semibold mb-3 ${uiTheme === "dark" ? "text-slate-100" : "text-slate-800"}`}>Session</p>
                    <button
                      onClick={async () => { await supabase.auth.signOut(); }}
                      className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {officeUser.role === "employee" && employeeHasJourneyAccess && activeSection === "journey" ? (
            <div className="crm-fab-bottom fixed inset-x-3 bottom-[76px] z-[65] md:hidden">
              <div className={`grid grid-cols-4 gap-2 rounded-xl border p-2 shadow-xl ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                <button
                  onClick={openCreateForm}
                  className="rounded-lg bg-[#f3f5f8] px-2 py-2 text-[11px] font-semibold text-white"
                >
                  New Visit
                </button>
                <button
                  onClick={() => {
                    const task = visibleTasks.find((t) => t.task_category === "visit" && (t.visit_status === "planned" || !t.check_in_at));
                    if (!task) {
                      toast.message("No planned visit found.");
                      return;
                    }
                    void runVisitAction(task.id, "started");
                  }}
                  className="rounded-lg border border-orange-300 bg-cyan-50 px-2 py-2 text-[11px] font-semibold text-orange-700"
                >
                  Start
                </button>
                <button
                  onClick={() => {
                    const task = visibleTasks.find((t) => t.task_category === "visit");
                    if (!task) {
                      toast.message("No visit found.");
                      return;
                    }
                    void fetchAndSaveVisitLocation(task);
                  }}
                  className="rounded-lg border border-violet-300 bg-violet-50 px-2 py-2 text-[11px] font-semibold text-violet-700"
                >
                  Reached
                </button>
                <button
                  onClick={() => {
                    const task = visibleTasks.find((t) => t.task_category === "visit" && (t.visit_status === "in_meeting" || t.visit_status === "reached"));
                    if (!task) {
                      toast.message("No active visit found to complete.");
                      return;
                    }
                    void runVisitAction(task.id, "meeting_completed");
                  }}
                  className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-2 text-[11px] font-semibold text-emerald-700"
                >
                  Complete
                </button>
              </div>
            </div>
          ) : null}

          {/* Admin mobile FAB — quick actions common to admins.
              Shown on Overview / Pipeline / Reports / Team; hidden on Tasks and Journey
              which already have their own toolbars. */}
          {officeUser.role === "admin" &&
           activeSection === "dashboard" &&
           (adminModule === "overview" || adminModule === "pipeline" || adminModule === "reports" || adminModule === "team" || adminModule === "field_today") ? (
            <div className="crm-fab-bottom fixed inset-x-3 bottom-[76px] z-[65] md:hidden">
              <div className={`grid grid-cols-3 gap-2 rounded-xl border p-2 shadow-xl ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
                <button
                  onClick={openCreateForm}
                  className="rounded-lg bg-indigo-600 px-2 py-2 text-[11px] font-semibold text-white"
                >
                  + Task
                </button>
                <button
                  onClick={() => { setActiveSection("institutions"); navigate("/task/admin/institutions", { replace: true }); }}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] font-semibold text-slate-700 dark:border-slate-600 dark:bg-[#404040] dark:text-slate-200"
                >
                  Institutions
                </button>
                <button
                  onClick={() => void runAutomationEngine()}
                  disabled={runningAutomation}
                  className="rounded-lg border border-indigo-300 bg-indigo-50 px-2 py-2 text-[11px] font-semibold text-indigo-700 disabled:opacity-60 dark:border-indigo-700 dark:bg-[#f3f5f8]/30 dark:text-indigo-300"
                >
                  {runningAutomation ? "Scanning…" : "Run AI"}
                </button>
              </div>
            </div>
          ) : null}

          {adminMemberDrawerOpen && selectedMemberTaskWindow ? (
            <div className="fixed inset-0 z-[70]">
              <button
                className="absolute inset-0 bg-[#f3f5f8]/35"
                onClick={() => setAdminMemberDrawerOpen(false)}
                aria-label="Close member detail drawer"
              />
              <aside className="absolute right-0 top-0 h-full w-full max-w-2xl border-l border-slate-200 bg-white p-4 shadow-2xl">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    {selectedMemberTaskWindow.member.full_name} • Detailed Tasks
                  </h3>
                  <button
                    onClick={() => setAdminMemberDrawerOpen(false)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-5">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-[#454545] dark:bg-[#404040] px-2.5 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">Total</p>
                    <p className="text-base font-semibold text-slate-900">{selectedMemberTaskWindow.total}</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-emerald-700">Completed</p>
                    <p className="text-base font-semibold text-emerald-900">{selectedMemberTaskWindow.completed}</p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-amber-700">Pending</p>
                    <p className="text-base font-semibold text-amber-900">{selectedMemberTaskWindow.pending}</p>
                  </div>
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-rose-700">Overdue</p>
                    <p className="text-base font-semibold text-rose-900">{selectedMemberTaskWindow.overdue}</p>
                  </div>
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-indigo-700">Follow-ups</p>
                    <p className="text-base font-semibold text-indigo-900">{selectedMemberTaskWindow.followUps}</p>
                  </div>
                </div>
                <div className="mt-3 max-h-[72vh] overflow-auto rounded-xl border border-slate-200">
                  <table className="crm-data-table min-w-full">
                    <thead>
                      <tr>
                        <th className="px-2 py-2 text-left">Task</th>
                        <th className="px-2 py-2 text-left">Category</th>
                        <th className="px-2 py-2 text-left">Status</th>
                        <th className="px-2 py-2 text-left">Due</th>
                        <th className="px-2 py-2 text-left">Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedMemberTaskWindow?.filtered || []).map((task) => (
                        <tr key={`drawer-task-${task.id}`}>
                          <td className="px-2 py-2">
                            <p className="font-medium text-slate-900">{task.task_title}</p>
                            <p className="text-[11px] text-slate-500">{task.institution_name || task.description || "-"}</p>
                          </td>
                          <td className="px-2 py-2">{task.task_category || "general"}</td>
                          <td className="px-2 py-2">{statusLabels[task.status]}</td>
                          <td className="px-2 py-2">{task.due_date || "-"}</td>
                          <td className="px-2 py-2 capitalize">{task.priority}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!selectedMemberTaskWindow.filtered.length ? (
                    <p className="p-3 text-xs text-slate-500">No tasks in this range.</p>
                  ) : null}
                </div>
              </aside>
            </div>
          ) : null}

          {/* ── Sticky Notes floating button + panel ─────────────────── */}
          {officeUser ? (
            <>
              {/* Floating toggle button */}
              <button
                type="button"
                onClick={() => setShowStickyPad((v) => !v)}
                title="Sticky Notes"
                style={{ bottom: "max(1.25rem, calc(1.25rem + env(safe-area-inset-bottom, 0px)))" }}
                className={`fixed left-5 z-[56] flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 ${
                  uiTheme === "dark"
                    ? "bg-amber-400 text-amber-950 hover:bg-amber-300"
                    : "bg-amber-400 text-amber-950 hover:bg-amber-300"
                } ${showStickyPad ? "ring-4 ring-amber-300/60" : ""}`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9l7-7V5a2 2 0 0 0-2-2zm-9 13H7v-2h3v2zm3-4H7v-2h6v2zm3-4H7V6h9v2z"/>
                </svg>
                {stickyNotes.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow">
                    {stickyNotes.length}
                  </span>
                )}
              </button>

              {/* Sticky Notes Panel */}
              {showStickyPad ? (
                <div
                  className={`fixed bottom-20 left-5 z-[56] flex w-[min(94vw,400px)] flex-col rounded-2xl border shadow-2xl transition-all ${
                    uiTheme === "dark"
                      ? "border-[#454545] bg-[#f3f5f8]/98"
                      : "border-amber-200/80 bg-amber-50/98"
                  }`}
                  style={{ backdropFilter: "blur(12px)", maxHeight: "calc(100dvh - 100px)" }}
                >
                  {/* Panel header */}
                  <div className={`flex items-center justify-between rounded-t-2xl border-b px-4 py-3 ${
                    uiTheme === "dark" ? "border-[#454545] bg-[#404040]/80" : "border-amber-200 bg-amber-100/80"
                  }`}>
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" fill="currentColor" className={`h-4 w-4 ${uiTheme === "dark" ? "text-amber-400" : "text-amber-600"}`}>
                        <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9l7-7V5a2 2 0 0 0-2-2zm-9 13H7v-2h3v2zm3-4H7v-2h6v2zm3-4H7V6h9v2z"/>
                      </svg>
                      <span className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-200" : "text-amber-900"}`}>Sticky Notes</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${uiTheme === "dark" ? "bg-[#454545] text-slate-400" : "bg-amber-200 text-amber-700"}`}>
                        {stickyNotes.length}/24
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowStickyPad(false)}
                      className={`rounded-lg p-1.5 transition ${uiTheme === "dark" ? "text-slate-400 hover:bg-[#454545]" : "text-amber-600 hover:bg-amber-200"}`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  {/* Compose area */}
                  <div className={`border-b px-4 py-3 ${uiTheme === "dark" ? "border-[#454545]" : "border-amber-200"}`}>
                    {/* Color swatches */}
                    <div className="mb-2.5 flex items-center gap-2">
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-500" : "text-amber-700/70"}`}>Color</span>
                      {([
                        { value: "amber", dot: "bg-amber-400", ring: "ring-amber-400" },
                        { value: "blue",  dot: "bg-sky-400",   ring: "ring-sky-400" },
                        { value: "mint",  dot: "bg-emerald-400", ring: "ring-emerald-400" },
                        { value: "rose",  dot: "bg-rose-400",  ring: "ring-rose-400" },
                      ] as Array<{ value: StickyNoteEntry["color"]; dot: string; ring: string }>).map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setStickyColor(c.value)}
                          className={`h-5 w-5 rounded-full ${c.dot} transition-transform hover:scale-110 ${stickyColor === c.value ? `ring-2 ring-offset-1 ${c.ring} scale-110` : ""} ${uiTheme === "dark" ? "ring-offset-slate-800" : "ring-offset-amber-50"}`}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <textarea
                        value={stickyDraft}
                        onChange={(e) => setStickyDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            addStickyNote();
                          }
                        }}
                        placeholder="Jot a quick note… (Enter to add)"
                        rows={2}
                        className={`flex-1 resize-none rounded-xl border px-3 py-2 text-xs leading-relaxed focus:outline-none ${
                          uiTheme === "dark"
                            ? "border-slate-600 bg-[#404040] text-slate-100 placeholder:text-slate-500 focus:border-amber-500"
                            : "border-amber-300 bg-white text-slate-800 placeholder:text-slate-400 focus:border-amber-500"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={addStickyNote}
                        className="self-end rounded-xl bg-amber-400 px-3 py-2 text-xs font-bold text-amber-950 transition hover:bg-amber-300 active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Notes grid */}
                  <div className="overflow-y-auto p-3" style={{ maxHeight: "360px" }}>
                    {!stickyNotes.length ? (
                      <div className={`flex flex-col items-center gap-2 rounded-xl border border-dashed py-8 ${uiTheme === "dark" ? "border-[#454545] text-slate-600" : "border-amber-300 text-amber-500"}`}>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8 opacity-40">
                          <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9l7-7V5a2 2 0 0 0-2-2z"/>
                        </svg>
                        <p className="text-xs">Your sticky notes will appear here.</p>
                      </div>
                    ) : (
                      <div className="columns-2 gap-3">
                        {stickyNotes.map((note, idx) => {
                          const bgMap = {
                            amber: uiTheme === "dark" ? "bg-amber-400/10 border-amber-500/30 text-amber-200" : "bg-amber-200 border-amber-300/60 text-amber-900",
                            blue:  uiTheme === "dark" ? "bg-orange-500/10 border-sky-500/30 text-orange-200"       : "bg-sky-100 border-orange-300/60 text-orange-900",
                            mint:  uiTheme === "dark" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200" : "bg-emerald-100 border-emerald-300/60 text-emerald-900",
                            rose:  uiTheme === "dark" ? "bg-rose-500/10 border-rose-500/30 text-rose-200"    : "bg-rose-100 border-rose-300/60 text-rose-900",
                          }[note.color];
                          const dotMap = { amber: "bg-amber-400", blue: "bg-sky-400", mint: "bg-emerald-400", rose: "bg-rose-400" }[note.color];
                          const rotation = idx % 2 === 0 ? "-rotate-1" : "rotate-1";
                          return (
                            <div
                              key={note.id}
                              className={`group mb-3 inline-block w-full break-inside-avoid rounded-xl border p-3 shadow-md transition-all hover:shadow-lg hover:rotate-0 ${bgMap} ${rotation}`}
                            >
                              {/* Note color dot + delete */}
                              <div className="mb-1.5 flex items-center justify-between">
                                <span className={`h-2 w-2 rounded-full ${dotMap}`} />
                                <button
                                  type="button"
                                  onClick={() => deleteStickyNote(note.id)}
                                  className="rounded p-0.5 opacity-0 transition group-hover:opacity-100 hover:bg-black/10"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                  </svg>
                                </button>
                              </div>
                              <p className="whitespace-pre-wrap break-words text-[12px] leading-relaxed">{note.body}</p>
                              <p className="mt-2 text-[9px] opacity-50">
                                {new Date(note.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {showQuickAdd ? (
            <div className="fixed inset-0 z-40 flex">
              <button className="h-full w-full bg-black/30" onClick={() => setShowQuickAdd(false)} />
              <div className="relative z-50 h-full w-full max-w-sm border-l border-slate-200 bg-white p-4 shadow-2xl">
                <h4 className="text-base font-semibold text-slate-900">Quick Add Task</h4>
                <p className="mt-1 text-xs text-slate-500">Fast capture without opening full task form.</p>
                <input
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Task title"
                  className="mt-3 h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <select value={quickPriority} onChange={(e) => setQuickPriority(e.target.value as Priority)} className="h-10 rounded border border-slate-300 bg-white px-2 text-sm text-slate-900">
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Due Date</label>
                    <input type="date" value={quickDueDate} onChange={(e) => setQuickDueDate(e.target.value)} className="h-10 rounded border border-slate-300 bg-white px-2 text-sm text-slate-900" />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={async () => {
                      await quickAddTask();
                    }}
                    className="rounded bg-[#f3f5f8] px-3 py-2 text-sm font-medium text-white"
                  >
                    Add Task
                  </button>
                  <button onClick={() => setShowQuickAdd(false)} className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700">
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* ── File Transfer ──────────────────────────────────────── */}
          {activeSection === "filetransfer" ? (
            <section className="mx-auto w-full max-w-3xl px-1 py-4">
              <FileTransfer
                officeUser={officeUser}
                uiTheme={uiTheme}
                presenceOnlineUsers={ftPresence.onlineUsers}
                presenceSessionId={ftPresence.sessionId}
                presenceDeviceType={ftPresence.deviceType}
                presenceBroadcast={ftPresence.broadcast}
                presenceAddSignalListener={ftPresence.addSignalListener}
              />
            </section>
          ) : null}

          {/* ── Admin Logs ─────────────────────────────────────────── */}
          {activeSection === "logs" ? (
            <AdminLogsSection
              activityEvents={activityEvents ?? []}
              teamMembers={teamMembers ?? []}
              uiTheme={uiTheme}
            />
          ) : null}

          {/* ── User Management (admin only) ───────────────────────── */}
          {activeSection === "user_management" && officeUser.role === "admin" ? (
            <UserManagement
              uiTheme={uiTheme}
              officeUser={officeUser}
              teamMembers={teamMembers ?? []}
              tasks={tasks ?? []}
              refreshTasks={refreshTasks}
            />
          ) : null}

        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════
          MOBILE DRAWER — slide-out from left (Android native)
          ═══════════════════════════════════════════════════════ */}
      {showMobileDrawer ? (
        <>
          {/* Dark overlay */}
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-[2px] md:hidden"
            onClick={() => setShowMobileDrawer(false)}
          />
          {/* Drawer panel */}
          <div
            className={`fixed inset-y-0 left-0 z-[61] flex w-72 max-w-[85vw] flex-col overflow-hidden shadow-2xl md:hidden ${uiTheme === "dark" ? "bg-[#f3f5f8]" : "bg-white"}`}
            style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* Drawer header */}
            <div className={`flex items-center justify-between border-b px-4 py-3.5 ${uiTheme === "dark" ? "border-[#454545]/60" : "border-slate-100"}`}>
              <div className="flex items-center gap-2.5">
                <img src={onrolLogo} alt="ONROL" className="h-7 w-7 rounded-lg object-contain" />
                <span className={`text-base font-bold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>ONROL</span>
              </div>
              <button
                onClick={() => setShowMobileDrawer(false)}
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${uiTheme === "dark" ? "text-slate-400 active:bg-[#404040]" : "text-slate-500 active:bg-slate-100"}`}
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* User profile card */}
            <div className={`mx-3 mt-3 flex items-center gap-3 rounded-2xl p-3 ${uiTheme === "dark" ? "bg-[#404040]/70" : "bg-slate-50"}`}>
              <AvatarWithFallback
                name={officeUser.full_name ?? "User"}
                avatarUrl={officeUser.avatar_url as string | undefined}
                size="md"
              />
              <div className="min-w-0">
                <p className={`truncate text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>{officeUser.full_name ?? officeUser.email}</p>
                <p className={`truncate text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{officeUser.email}</p>
                <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${officeUser.role === "admin" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}>{officeUser.role}</span>
              </div>
            </div>

            {/* Nav items */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
              {officeUser.role === "employee" ? (
                <>
                  {[
                    { key: "tasks",   label: "Tasks",      icon: ListTodo,      action: () => { setActiveSection("tasks"); setShowForm(false); navigate("/task/tasks", { replace: true }); setShowMobileDrawer(false); } },
                    ...(employeeHasJourneyAccess ? [{ key: "journey", label: "Journey Plan", icon: CalendarRange, action: () => { setActiveSection("journey"); setShowForm(false); navigate("/task/journey", { replace: true }); setShowMobileDrawer(false); } }] : []),
                    { key: "create",  label: "New Task",   icon: SquarePlus,    action: () => { setActiveSection("create"); setShowForm(true); setShowMobileDrawer(false); } },
                    { key: "messenger_inbox", label: "Chat", icon: Inbox,        action: () => { openMessengerSection("inbox"); setShowMobileDrawer(false); } },
                    { key: "meeting", label: "Meeting",    icon: Video,         action: () => { setActiveSection("meeting"); setShowForm(false); setShowMobileDrawer(false); } },
                    { key: "filetransfer", label: "File Transfer", icon: Share2, action: () => { setActiveSection("filetransfer"); setShowForm(false); setShowMobileDrawer(false); } },
                    { key: "settings", label: "Settings",  icon: Settings,      action: () => { setActiveSection("settings"); setShowForm(false); setShowMobileDrawer(false); } },
                    { key: "downloads", label: "Downloads", icon: Download,     action: () => { setActiveSection("downloads" as typeof activeSection); setShowForm(false); setShowMobileDrawer(false); } },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive = activeSection === item.key;
                    return (
                      <button key={item.key} onClick={item.action}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? uiTheme === "dark" ? "bg-indigo-600/20 text-indigo-300" : "bg-indigo-50 text-indigo-700"
                            : uiTheme === "dark" ? "text-slate-300 active:bg-[#404040]" : "text-slate-700 active:bg-slate-100"
                        }`}>
                        <Icon className={`h-4.5 w-4.5 ${isActive ? (uiTheme === "dark" ? "text-indigo-400" : "text-indigo-600") : uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`} />
                        {item.label}
                        {isActive ? <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" /> : null}
                      </button>
                    );
                  })}
                </>
              ) : (
                <>
                  {[
                    { key: "overview",    label: "Overview",     icon: LayoutDashboard, action: () => { setAdminModule("overview"); setActiveSection("dashboard"); navigate("/admin/dashboard?module=overview", { replace: true }); setShowMobileDrawer(false); } },
                    { key: "pipeline",    label: "Pipeline",     icon: GaugeCircle,     action: () => { setAdminModule("pipeline"); setActiveSection("dashboard"); navigate("/admin/dashboard?module=pipeline", { replace: true }); setShowMobileDrawer(false); } },
                    { key: "tasks",       label: "Tasks",        icon: ListTodo,        action: () => { setActiveSection("tasks"); setAdminModule("tasks"); setShowMobileDrawer(false); } },
                    { key: "field_today", label: "Field Today",  icon: MapPin,          action: () => { setAdminModule("field_today"); setActiveSection("dashboard"); navigate("/admin/dashboard?module=field_today", { replace: true }); setShowMobileDrawer(false); } },
                    { key: "team",        label: "Team",         icon: Users,           action: () => { setAdminModule("team"); setActiveSection("dashboard"); navigate("/admin/dashboard?module=team", { replace: true }); setShowMobileDrawer(false); } },
                    { key: "reports",     label: "Reports",      icon: FileDown,        action: () => { setAdminModule("reports"); setActiveSection("dashboard"); navigate("/admin/dashboard?module=reports", { replace: true }); setShowMobileDrawer(false); } },
                    { key: "messenger",   label: "Chat",         icon: Inbox,           action: () => { openMessengerSection("inbox"); setShowMobileDrawer(false); } },
                    { key: "meeting",     label: "Meeting",      icon: Video,           action: () => { setActiveSection("meeting"); setShowForm(false); setShowMobileDrawer(false); } },
                    { key: "create",      label: "Create Task",  icon: SquarePlus,      action: () => { openCreateForm(); setShowMobileDrawer(false); } },
                    { key: "institutions",label: "Institutions", icon: Building2,       action: () => { setActiveSection("institutions"); setShowForm(false); navigate("/task/institutions", { replace: true }); setShowMobileDrawer(false); } },
                    { key: "user_management", label: "User Management", icon: Users,     action: () => { setActiveSection("user_management"); setShowForm(false); navigate("/admin/users", { replace: true }); setShowMobileDrawer(false); } },
                    { key: "settings",    label: "Settings",     icon: Settings,        action: () => { setActiveSection("settings"); setShowForm(false); navigate("/admin/settings/automation", { replace: true }); setShowMobileDrawer(false); } },
                    { key: "logs",        label: "Activity Logs",icon: Activity,        action: () => { setActiveSection("logs"); setShowForm(false); setShowMobileDrawer(false); } },
                    { key: "filetransfer",label: "File Transfer",icon: Share2,          action: () => { setActiveSection("filetransfer"); setShowForm(false); setShowMobileDrawer(false); } },
                    { key: "downloads",   label: "Downloads",    icon: Download,        action: () => { setActiveSection("downloads" as typeof activeSection); setShowForm(false); setShowMobileDrawer(false); } },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      (item.key === "messenger" && activeSection === "messenger_inbox") ||
                      (item.key === "tasks" && activeSection === "tasks") ||
                      (item.key === "journey" && activeSection === "journey") ||
                      (item.key === "meeting" && activeSection === "meeting") ||
                      (item.key === "create" && activeSection === "create") ||
                      (item.key === "institutions" && activeSection === "institutions") ||
                      (item.key === "settings" && activeSection === "settings") ||
                      (item.key === "user_management" && activeSection === "user_management") ||
                      (item.key === "logs" && activeSection === "logs") ||
                      (item.key === "filetransfer" && activeSection === "filetransfer") ||
                      (item.key === "downloads" && (activeSection as string) === "downloads") ||
                      (activeSection === "dashboard" && adminModule === item.key);
                    return (
                      <button key={item.key} onClick={item.action}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? uiTheme === "dark" ? "bg-indigo-600/20 text-indigo-300" : "bg-indigo-50 text-indigo-700"
                            : uiTheme === "dark" ? "text-slate-300 active:bg-[#404040]" : "text-slate-700 active:bg-slate-100"
                        }`}>
                        <Icon className={`h-4.5 w-4.5 ${isActive ? (uiTheme === "dark" ? "text-indigo-400" : "text-indigo-600") : uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`} />
                        {item.label}
                        {isActive ? <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" /> : null}
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            {/* Bottom actions */}
            <div className={`border-t px-3 py-3 space-y-1 ${uiTheme === "dark" ? "border-[#454545]/60" : "border-slate-100"}`}>
              <button
                onClick={() => { setUiTheme(uiTheme === "dark" ? "light" : "dark"); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${uiTheme === "dark" ? "text-slate-300 active:bg-[#404040]" : "text-slate-700 active:bg-slate-100"}`}
              >
                {uiTheme === "dark" ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
                {uiTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              </button>
              <button
                onClick={() => { void logout(); setShowMobileDrawer(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${uiTheme === "dark" ? "text-rose-400 active:bg-rose-900/30" : "text-rose-600 active:bg-rose-50"}`}
              >
                <LogOut className="h-4.5 w-4.5" />
                Sign Out
              </button>
            </div>
          </div>
        </>
      ) : null}

      {/* ══════════════════════════════════════════════════════════
          FIXED BOTTOM NAVIGATION — 3-icon Android native
          ═══════════════════════════════════════════════════════ */}
      <nav
        className={`crm-mobile-bottom-nav fixed inset-x-0 bottom-0 z-[60] border-t md:hidden ${uiTheme === "dark" ? "border-[#454545]/80 bg-[#1a1a1a]" : "border-slate-200 bg-white"}`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {officeUser.role === "employee" ? (
          /* Employee: Tasks | [+ FAB] | Chat | Profile */
          <div className="flex items-stretch">
            <button
              onClick={() => { setActiveSection("tasks"); setShowForm(false); navigate("/task/tasks", { replace: true }); }}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${activeSection === "tasks" ? (uiTheme === "dark" ? "text-indigo-400" : "text-indigo-600") : (uiTheme === "dark" ? "text-slate-500" : "text-slate-400")}`}
            >
              <ListTodo className="h-[22px] w-[22px]" />
              Tasks
              <span className={`h-0.5 w-5 rounded-full transition-all ${activeSection === "tasks" ? (uiTheme === "dark" ? "bg-indigo-400" : "bg-indigo-600") : "bg-transparent"}`} />
            </button>

            <button
              onClick={() => { setActiveSection("create"); setShowForm(true); }}
              className="flex flex-1 flex-col items-center justify-center py-1"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg ${uiTheme === "dark" ? "bg-indigo-600" : "bg-[#f3f5f8]"}`}>
                <Plus className="h-6 w-6 text-white" />
              </span>
              <span className={`mt-0.5 text-[10px] font-semibold ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>New</span>
            </button>

            <button
              onClick={() => { setActiveSection("messenger_inbox"); setShowForm(false); navigate("/messenger/inbox", { replace: true }); }}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${activeSection.startsWith("messenger_") ? (uiTheme === "dark" ? "text-indigo-400" : "text-indigo-600") : (uiTheme === "dark" ? "text-slate-500" : "text-slate-400")}`}
            >
              <div className="relative">
                <Inbox className="h-[22px] w-[22px]" />
                {totalMessengerUnread > 0 && !activeSection.startsWith("messenger_") && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white leading-none">
                    {totalMessengerUnread > 9 ? "9+" : totalMessengerUnread}
                  </span>
                )}
              </div>
              Chat
              <span className={`h-0.5 w-5 rounded-full transition-all ${activeSection.startsWith("messenger_") ? (uiTheme === "dark" ? "bg-indigo-400" : "bg-indigo-600") : "bg-transparent"}`} />
            </button>

            <button
              onClick={() => setActiveSection("settings")}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${activeSection === "settings" ? (uiTheme === "dark" ? "text-indigo-400" : "text-indigo-600") : (uiTheme === "dark" ? "text-slate-500" : "text-slate-400")}`}
            >
              {(profileDraft.avatarUrl ?? (officeUser as Record<string,unknown>).avatar_url) ? (
                <img src={(profileDraft.avatarUrl ?? (officeUser as Record<string,unknown>).avatar_url) as string} alt="" className="h-[22px] w-[22px] rounded-full object-cover ring-1 ring-indigo-300" />
              ) : (
                <div className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold text-white ${activeSection === "settings" ? "ring-2 ring-indigo-400" : ""}`} style={{ background: "linear-gradient(135deg,#6366f1,#7c3aed)" }}>
                  {(officeUser.full_name ?? officeUser.email).slice(0, 1).toUpperCase()}
                </div>
              )}
              Me
              <span className={`h-0.5 w-5 rounded-full transition-all ${activeSection === "settings" ? (uiTheme === "dark" ? "bg-indigo-400" : "bg-indigo-600") : "bg-transparent"}`} />
            </button>
          </div>
        ) : (
          /* Admin: Tasks | Team | Chat | Profile */
          <div className="flex items-stretch">
            <button
              onClick={() => { setActiveSection("tasks"); setAdminModule("tasks"); }}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${activeSection === "tasks" ? (uiTheme === "dark" ? "text-indigo-400" : "text-indigo-600") : (uiTheme === "dark" ? "text-slate-500" : "text-slate-400")}`}
            >
              <ListTodo className="h-[22px] w-[22px]" />
              Tasks
              <span className={`h-0.5 w-5 rounded-full transition-all ${activeSection === "tasks" ? (uiTheme === "dark" ? "bg-indigo-400" : "bg-indigo-600") : "bg-transparent"}`} />
            </button>

            <button
              onClick={() => { setAdminModule("team"); setActiveSection("dashboard"); navigate("/admin/dashboard?module=team", { replace: true }); }}
              className="flex flex-1 flex-col items-center justify-center py-1"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg ${uiTheme === "dark" ? "bg-indigo-600" : "bg-[#f3f5f8]"}`}>
                <Users className="h-6 w-6 text-white" />
              </span>
              <span className={`mt-0.5 text-[10px] font-semibold ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Team</span>
            </button>

            <button
              onClick={() => { setActiveSection("messenger_inbox"); setShowForm(false); navigate("/messenger/inbox", { replace: true }); }}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${activeSection.startsWith("messenger_") ? (uiTheme === "dark" ? "text-indigo-400" : "text-indigo-600") : (uiTheme === "dark" ? "text-slate-500" : "text-slate-400")}`}
            >
              <div className="relative">
                <Inbox className="h-[22px] w-[22px]" />
                {totalMessengerUnread > 0 && !activeSection.startsWith("messenger_") && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white leading-none">
                    {totalMessengerUnread > 9 ? "9+" : totalMessengerUnread}
                  </span>
                )}
              </div>
              Chat
              <span className={`h-0.5 w-5 rounded-full transition-all ${activeSection.startsWith("messenger_") ? (uiTheme === "dark" ? "bg-indigo-400" : "bg-indigo-600") : "bg-transparent"}`} />
            </button>

            <button
              onClick={() => setActiveSection("settings")}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${activeSection === "settings" ? (uiTheme === "dark" ? "text-indigo-400" : "text-indigo-600") : (uiTheme === "dark" ? "text-slate-500" : "text-slate-400")}`}
            >
              {(profileDraft.avatarUrl ?? (officeUser as Record<string,unknown>).avatar_url) ? (
                <img src={(profileDraft.avatarUrl ?? (officeUser as Record<string,unknown>).avatar_url) as string} alt="" className="h-[22px] w-[22px] rounded-full object-cover ring-1 ring-indigo-300" />
              ) : (
                <div className={`flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-bold text-white ${activeSection === "settings" ? "ring-2 ring-indigo-400" : ""}`} style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)" }}>
                  {(officeUser.full_name ?? officeUser.email).slice(0, 1).toUpperCase()}
                </div>
              )}
              Me
              <span className={`h-0.5 w-5 rounded-full transition-all ${activeSection === "settings" ? (uiTheme === "dark" ? "bg-indigo-400" : "bg-indigo-600") : "bg-transparent"}`} />
            </button>
          </div>
        )}
      </nav>

      </div>

      {/* ── Keyboard Shortcuts Modal ─────────────────────────────── */}
      {showShortcutsModal ? (
        <div className="fixed inset-0 z-[9997] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm" onClick={() => setShowShortcutsModal(false)}>
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`} onClick={(e) => e.stopPropagation()}>
            <div className={`border-b px-5 py-4 ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-200"}`}>
              <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Keyboard Shortcuts</h3>
              <p className={`mt-0.5 text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>Press <kbd className="rounded border px-1 font-mono">?</kbd> anywhere to toggle this panel</p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
              {[
                { section: "Navigation", items: [
                  { keys: ["Ctrl", "K"], label: "Global search" },
                  { keys: ["Ctrl", "1"], label: "Go to Dashboard (desktop)" },
                  { keys: ["Ctrl", "2"], label: "Go to Tasks (desktop)" },
                  { keys: ["Ctrl", "3"], label: "Go to Chat (desktop)" },
                  { keys: ["Ctrl", "Shift", "N"], label: "New task (desktop)" },
                  { keys: ["Ctrl", "Shift", "Space"], label: "Focus app window (desktop)" },
                ]},
                { section: "Search & Dialogs", items: [
                  { keys: ["Ctrl", "K"], label: "Open global search" },
                  { keys: ["?"], label: "Show keyboard shortcuts" },
                  { keys: ["Esc"], label: "Close overlay / cancel" },
                  { keys: ["↵"], label: "Confirm / submit focused action" },
                ]},
                { section: "Display (Desktop)", items: [
                  { keys: ["Ctrl", "="], label: "Zoom in" },
                  { keys: ["Ctrl", "−"], label: "Zoom out" },
                  { keys: ["Ctrl", "0"], label: "Reset zoom" },
                ]},
                { section: "Messenger", items: [
                  { keys: ["Esc"], label: "Cancel reply / close context menu" },
                  { keys: ["↵"], label: "Send message" },
                  { keys: ["Shift", "↵"], label: "New line in message" },
                ]},
              ].map(({ section, items }) => (
                <div key={section} className="mb-4">
                  <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>{section}</p>
                  <div className="space-y-1.5">
                    {items.map(({ keys, label }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className={`text-xs ${uiTheme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{label}</span>
                        <div className="flex items-center gap-1">
                          {keys.map((k, i) => (
                            <React.Fragment key={i}>
                              {i > 0 && <span className={`text-[10px] ${uiTheme === "dark" ? "text-slate-600" : "text-slate-300"}`}>+</span>}
                              <kbd className={`rounded border px-1.5 py-0.5 font-mono text-[11px] ${uiTheme === "dark" ? "border-slate-600 bg-[#404040] text-slate-300" : "border-slate-300 bg-slate-100 text-slate-700"}`}>{k}</kbd>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className={`border-t px-5 py-3 text-right ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-100"}`}>
              <button onClick={() => setShowShortcutsModal(false)} className={`rounded-xl border px-4 py-2 text-xs font-semibold ${uiTheme === "dark" ? "border-slate-600 text-slate-300" : "border-slate-300 text-slate-600"}`}>Close</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── User Guide overlay ────────────────────────────────────── */}
      {showUserGuide ? (
        <UserGuide
          uiTheme={uiTheme}
          userRole={officeUser?.role ?? "employee"}
          onClose={() => setShowUserGuide(false)}
        />
      ) : null}

      {/* ── Meeting → Tasks Assignee Dialog ───────────────────────── */}
      {meetingAssigneeDialog ? (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl ${uiTheme === "dark" ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
            <div className={`border-b px-5 py-4 ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-200"}`}>
              <h3 className={`text-sm font-semibold ${uiTheme === "dark" ? "text-slate-100" : "text-slate-900"}`}>
                Assign Meeting Action Items
              </h3>
              <p className={`mt-0.5 text-xs ${uiTheme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                Assign each action item to a team member before creating tasks.
              </p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-5 py-4 space-y-3">
              {meetingAssigneeDialog.row.actionItems.slice(0, 8).map((item, idx) => (
                <div key={idx} className={`rounded-xl border p-3 ${uiTheme === "dark" ? "border-[#454545] bg-[#404040]/60" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`mb-2 text-xs font-medium leading-snug ${uiTheme === "dark" ? "text-slate-200" : "text-slate-800"}`}>
                    {idx + 1}. {item}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${uiTheme === "dark" ? "text-slate-500" : "text-slate-400"}`}>Assign to</span>
                    <select
                      value={meetingAssigneeDialog.assignments[idx] ?? officeUser?.id ?? ""}
                      onChange={(e) => {
                        setMeetingAssigneeDialog((prev) =>
                          prev ? {
                            ...prev,
                            assignments: { ...prev.assignments, [idx]: e.target.value },
                          } : prev
                        );
                      }}
                      className={`h-8 flex-1 rounded-lg border px-2 text-xs ${uiTheme === "dark" ? "border-slate-600 bg-[#454545] text-slate-100" : "border-slate-300 bg-white text-slate-800"}`}
                    >
                      {(teamMembers ?? []).map((u) => (
                        <option key={u.id} value={u.id}>{u.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className={`flex justify-end gap-2 border-t px-5 py-3 ${uiTheme === "dark" ? "border-[#454545]" : "border-slate-200"}`}>
              <button
                type="button"
                onClick={() => setMeetingAssigneeDialog(null)}
                className={`rounded-xl border px-4 py-2 text-xs font-semibold ${uiTheme === "dark" ? "border-slate-600 text-slate-300 hover:bg-[#404040]" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(meetingTaskConvertBusyById[meetingAssigneeDialog.row.id])}
                onClick={() => void convertMeetingActionsToTasks(meetingAssigneeDialog!.row, meetingAssigneeDialog!.assignments)}
                className="rounded-xl bg-[#f3f5f8] px-4 py-2 text-xs font-semibold text-white hover:bg-[#f3f5f8]/90 disabled:opacity-50"
              >
                {meetingTaskConvertBusyById[meetingAssigneeDialog.row.id] ? "Creating…" : `Create ${Math.min(meetingAssigneeDialog.row.actionItems.length, 8)} Task(s)`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Global Search Overlay ──────────────────────────────────── */}
      {globalSearchOpen ? (
        <GlobalSearchOverlay
          query={globalSearch}
          setQuery={setGlobalSearch}
          tasks={tasks ?? []}
          institutions={institutions ?? []}
          uiTheme={uiTheme}
          onClose={() => setGlobalSearchOpen(false)}
          onNavigate={(section: TaskSection) => {
            setActiveSection(section);
            setShowForm(false);
            setGlobalSearchOpen(false);
          }}
          onOpenTask={(task: OfficeTask) => {
            openEditForm(task);
            setGlobalSearchOpen(false);
          }}
          onOpenInstitution={(instId: string) => {
            setSelectedInstitutionId?.(instId);
            setActiveSection("institutions");
            setGlobalSearchOpen(false);
          }}
        />
      ) : null}

{/* Admin Filters Drawer */}
<AdminFiltersDrawer
  open={showAdminFiltersDrawer}
  onClose={() => setShowAdminFiltersDrawer(false)}
  adminRangePreset={adminRangePreset ?? "all"}
  setAdminRangePreset={setAdminRangePreset ?? (() => {})}
  adminRangeFrom={adminRangeFrom ?? ""}
  setAdminRangeFrom={setAdminRangeFrom ?? (() => {})}
  adminRangeTo={adminRangeTo ?? ""}
  setAdminRangeTo={setAdminRangeTo ?? (() => {})}
  adminGlobalBrand={adminGlobalBrand ?? "all"}
  setAdminGlobalBrand={setAdminGlobalBrand ?? (() => {})}
  adminGlobalInstitutionType={adminGlobalInstitutionType ?? "all"}
  setAdminGlobalInstitutionType={setAdminGlobalInstitutionType ?? (() => {})}
  adminGlobalEmployee={adminGlobalEmployee ?? "all"}
  setAdminGlobalEmployee={setAdminGlobalEmployee ?? (() => {})}
  adminGlobalCity={adminGlobalCity ?? ""}
  setAdminGlobalCity={setAdminGlobalCity ?? (() => {})}
  adminGlobalVisitStatus={adminGlobalVisitStatus ?? "all"}
  setAdminGlobalVisitStatus={setAdminGlobalVisitStatus ?? (() => {})}
  adminGlobalLeadStage={adminGlobalLeadStage ?? "all"}
  setAdminGlobalLeadStage={setAdminGlobalLeadStage ?? (() => {})}
  adminGlobalConversionStatus={adminGlobalConversionStatus ?? "all"}
  setAdminGlobalConversionStatus={setAdminGlobalConversionStatus ?? (() => {})}
  teamMembers={teamMembers ?? []}
  onReset={() => {
    setAdminRangePreset?.("all");
    setAdminGlobalBrand?.("all");
    setAdminGlobalInstitutionType?.("all");
    setAdminGlobalEmployee?.("all");
    setAdminGlobalCity?.("");
    setAdminGlobalVisitStatus?.("all");
    setAdminGlobalLeadStage?.("all");
    setAdminGlobalConversionStatus?.("all");
    setAdminGlobalRevenueBand?.("all");
    setAdminGlobalLeadScoreBand?.("all");
  }}
  onApply={() => setShowAdminFiltersDrawer(false)}
/>
{/* Offline indicator */}
<OfflineBanner isOffline={isOffline ?? false} />
{/* Task Incomplete Modal */}
{incompleteTask ? (
  <TaskIncompleteModal
    task={incompleteTask}
    teamMembers={teamMembers ?? []}
    uiTheme={uiTheme}
    currentUserId={officeUser.id}
    onSubmit={(p) => handleTaskIncomplete(p)}
    onClose={() => setIncompleteTask(null)}
  />
) : null}
{/* AI Assistant */}
<AIAssistant uiTheme={uiTheme} officeUser={officeUser} tasks={tasks ?? []} institutions={institutions ?? []} teamMembers={teamMembers ?? []} />
{/* Back to top */}
<BackToTop />

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Logs Section
// ─────────────────────────────────────────────────────────────────────────────
function AdminLogsSection({
  activityEvents,
  teamMembers,
  uiTheme,
}: {
  activityEvents: ActivityEvent[];
  teamMembers: OfficeUser[];
  uiTheme: UiTheme;
}) {
  const [logDateFrom, setLogDateFrom] = useState("");
  const [logDateTo, setLogDateTo] = useState("");
  const [logEventType, setLogEventType] = useState("all");
  const [logUser, setLogUser] = useState("all");
  const [logSearch, setLogSearch] = useState("");

  const eventTypes = useMemo(() => {
    const types = new Set(activityEvents.map((e) => e.event_type));
    return Array.from(types).sort();
  }, [activityEvents]);

  const filtered = useMemo(() => {
    return activityEvents.filter((e) => {
      if (logEventType !== "all" && e.event_type !== logEventType) return false;
      if (logUser !== "all" && e.actor_user_id !== logUser) return false;
      if (logDateFrom && e.created_at < logDateFrom) return false;
      if (logDateTo && e.created_at > logDateTo + "T23:59:59") return false;
      if (logSearch) {
        const q = logSearch.toLowerCase();
        if (!e.event_summary.toLowerCase().includes(q) && !e.event_type.toLowerCase().includes(q)) return false;
      }
      return true;
    }).slice(0, 500);
  }, [activityEvents, logEventType, logUser, logDateFrom, logDateTo, logSearch]);

  const userMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of teamMembers) m[u.id] = u.full_name;
    return m;
  }, [teamMembers]);

  const dark = uiTheme === "dark";

  return (
    <section className="space-y-4">
      <div className={`rounded-2xl border p-5 shadow-sm ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
        <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>Admin Activity Logs</p>
        <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>
          Full audit trail of system events, visit updates, task changes, and user actions.
        </p>
        {/* Filters */}
        <div className={`mt-4 grid gap-3 rounded-xl border p-3 sm:grid-cols-2 md:grid-cols-5 ${dark ? "border-[#454545] bg-[#404040]/40" : "border-slate-200 bg-slate-50/80"}`}>
          <input
            type="text"
            placeholder="Search events…"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            className={`h-9 rounded-lg border px-3 text-sm md:col-span-1 ${dark ? "border-slate-600 bg-[#404040] text-slate-100 placeholder-slate-500" : "border-slate-300 bg-white"}`}
          />
          <select value={logEventType} onChange={(e) => setLogEventType(e.target.value)} className={`h-9 rounded-lg border px-2 text-sm ${dark ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`}>
            <option value="all">All Event Types</option>
            {eventTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
          <select value={logUser} onChange={(e) => setLogUser(e.target.value)} className={`h-9 rounded-lg border px-2 text-sm ${dark ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`}>
            <option value="all">All Users</option>
            {teamMembers.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
          <div className="flex flex-col gap-1">
            <label className={`text-[11px] font-semibold uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-400"}`}>From Date</label>
            <input type="date" value={logDateFrom} onChange={(e) => setLogDateFrom(e.target.value)} className={`h-9 w-full rounded-lg border px-2 text-sm ${dark ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className={`text-[11px] font-semibold uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-400"}`}>To Date</label>
            <input type="date" value={logDateTo} onChange={(e) => setLogDateTo(e.target.value)} className={`h-9 w-full rounded-lg border px-2 text-sm ${dark ? "border-slate-600 bg-[#404040] text-slate-100" : "border-slate-300 bg-white"}`} />
          </div>
        </div>
        <p className={`mt-2 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
          Showing {filtered.length} of {activityEvents.length} events
        </p>
      </div>

      <div className={`rounded-2xl border shadow-sm overflow-hidden ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b text-xs font-semibold uppercase tracking-wide ${dark ? "border-[#454545] bg-[#404040] text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Event Type</th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Summary</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`px-4 py-8 text-center text-sm ${dark ? "text-slate-500" : "text-slate-400"}`}>
                    No events match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((ev) => (
                  <tr key={ev.id} className={`border-b ${dark ? "border-[#404040] hover:bg-[#404040]/50" : "border-slate-100 hover:bg-slate-50"}`}>
                    <td className={`whitespace-nowrap px-4 py-2.5 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                      {new Date(ev.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        String(ev.event_type || "").startsWith("task_") ? "bg-blue-100 text-orange-700" :
                        String(ev.event_type || "").startsWith("visit_") ? "bg-emerald-100 text-emerald-700" :
                        String(ev.event_type || "").includes("delete") || String(ev.event_type || "").includes("remov") ? "bg-rose-100 text-rose-700" :
                        String(ev.event_type || "").includes("login") || String(ev.event_type || "").includes("auth") ? "bg-violet-100 text-violet-700" :
                        String(ev.event_type || "").includes("error") || String(ev.event_type || "").includes("fail") ? "bg-red-100 text-red-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>{String(ev.event_type || "-").replace(/_/g, " ")}</span>
                    </td>
                    <td className={`px-4 py-2.5 text-xs ${dark ? "text-slate-300" : "text-slate-700"}`}>
                      {ev.actor_user_id ? (userMap[ev.actor_user_id] ?? ev.actor_user_id.slice(0, 8)) : "—"}
                    </td>
                    <td className={`px-4 py-2.5 text-xs max-w-xs truncate ${dark ? "text-slate-300" : "text-slate-700"}`} title={ev.event_summary}>
                      {ev.event_summary}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Global Search Overlay
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS: Array<{ label: string; subtitle: string; section: TaskSection }> = [
  { label: "Dashboard", subtitle: "Overview & analytics", section: "dashboard" },
  { label: "Tasks", subtitle: "All tasks list", section: "tasks" },
  { label: "Journey Planner", subtitle: "Plan field visits", section: "journey" },
  { label: "Institutions", subtitle: "Institution CRM", section: "institutions" },
  { label: "Meetings", subtitle: "Meeting workspace", section: "meeting" },
  { label: "File Transfer", subtitle: "P2P instant transfer", section: "filetransfer" },
  { label: "Messenger", subtitle: "Team chat & announcements", section: "messenger_inbox" },
  { label: "Settings", subtitle: "User & app settings", section: "settings" },
  { label: "Admin Logs", subtitle: "Activity audit trail", section: "logs" },
];

function GlobalSearchOverlay({
  query,
  setQuery,
  tasks,
  institutions,
  uiTheme,
  onClose,
  onNavigate,
  onOpenTask,
  onOpenInstitution,
}: {
  query: string;
  setQuery: (v: string) => void;
  tasks: OfficeTask[];
  institutions: Institution[];
  uiTheme: UiTheme;
  onClose: () => void;
  onNavigate: (section: TaskSection) => void;
  onOpenTask: (task: OfficeTask) => void;
  onOpenInstitution: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dark = uiTheme === "dark";

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();

  const navResults = q
    ? NAV_ITEMS.filter((n) => n.label.toLowerCase().includes(q) || n.subtitle.toLowerCase().includes(q))
    : NAV_ITEMS;

  const taskResults = useMemo(() => {
    if (!q) return [];
    return tasks
      .filter((t) =>
        t.task_title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.institution_name ?? "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [q, tasks]);

  const instResults = useMemo(() => {
    if (!q) return [];
    return institutions
      .filter((i) =>
        i.name.toLowerCase().includes(q) ||
        (i.city ?? "").toLowerCase().includes(q) ||
        (i.area ?? "").toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [q, institutions]);

  const hasResults = navResults.length > 0 || taskResults.length > 0 || instResults.length > 0;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center bg-black/50 backdrop-blur-sm px-3 pt-[8vh]" onClick={onClose}>
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className={`flex items-center gap-3 border-b px-4 ${dark ? "border-[#454545]" : "border-slate-200"}`}>
          <Search className={`h-5 w-5 shrink-0 ${dark ? "text-slate-400" : "text-slate-400"}`} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, institutions, navigate sections…"
            className={`h-14 flex-1 bg-transparent text-sm outline-none ${dark ? "text-slate-100 placeholder-slate-500" : "text-slate-900 placeholder-slate-400"}`}
          />
          <kbd className={`hidden shrink-0 rounded border px-1.5 py-0.5 text-[11px] font-mono sm:inline-block ${dark ? "border-slate-600 text-slate-400" : "border-slate-300 text-slate-400"}`}>ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[65vh] overflow-y-auto">
          {!hasResults && q && (
            <p className={`px-5 py-8 text-center text-sm ${dark ? "text-slate-500" : "text-slate-400"}`}>No results for "{query}"</p>
          )}

          {/* Navigation */}
          {navResults.length > 0 && (
            <div>
              <p className={`px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-400"}`}>Navigation</p>
              {navResults.map((item) => (
                <button
                  key={item.section}
                  onClick={() => onNavigate(item.section)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors ${dark ? "hover:bg-[#404040] text-slate-200" : "hover:bg-slate-50 text-slate-800"}`}
                >
                  <span className="font-medium">{item.label}</span>
                  <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{item.subtitle}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tasks */}
          {taskResults.length > 0 && (
            <div>
              <p className={`px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-400"}`}>Tasks</p>
              {taskResults.map((task) => (
                <button
                  key={task.id}
                  onClick={() => onOpenTask(task)}
                  className={`flex w-full flex-col px-4 py-2.5 text-left transition-colors ${dark ? "hover:bg-[#404040]" : "hover:bg-slate-50"}`}
                >
                  <span className={`text-sm font-medium ${dark ? "text-slate-200" : "text-slate-800"}`}>{task.task_title}</span>
                  <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
                    {task.status.replace(/_/g, " ")} · {task.priority} priority
                    {task.institution_name ? ` · ${task.institution_name}` : ""}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Institutions */}
          {instResults.length > 0 && (
            <div>
              <p className={`px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-400"}`}>Institutions</p>
              {instResults.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => onOpenInstitution(inst.id)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 transition-colors ${dark ? "hover:bg-[#404040]" : "hover:bg-slate-50"}`}
                >
                  <span className={`text-sm font-medium ${dark ? "text-slate-200" : "text-slate-800"}`}>{inst.name}</span>
                  <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
                    {[inst.area, inst.city].filter(Boolean).join(", ")}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="h-3" />
        </div>

        {/* Footer hint */}
        <div className={`border-t px-4 py-2 text-[11px] ${dark ? "border-[#454545] text-slate-600" : "border-slate-100 text-slate-400"}`}>
          Press <kbd className={`rounded border px-1 py-0.5 font-mono ${dark ? "border-slate-600" : "border-slate-300"}`}>↑↓</kbd> to navigate · <kbd className={`rounded border px-1 py-0.5 font-mono ${dark ? "border-slate-600" : "border-slate-300"}`}>↵</kbd> to select · <kbd className={`rounded border px-1 py-0.5 font-mono ${dark ? "border-slate-600" : "border-slate-300"}`}>ESC</kbd> to close
        </div>
      </div>
    </div>
  );
}





