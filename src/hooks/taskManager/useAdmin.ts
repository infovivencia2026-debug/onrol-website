import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { tmCreateInvite, tmUpdateInviteStatus, tmListInvites } from "@/lib/tmClient";
import type {
  AdminModule,
  OfficeInvite,
  OfficeTask,
  OfficeUser,
  Institution,
  VisitBrand,
  InstitutionType,
  VisitStatus,
  FollowUpStatus,
  LeadStage,
  ConversionStatus,
  ActivityEvent,
  NotificationPrefs,
  AutomationSettings,
  NotificationType,
  NotificationSeverity,
  TaskStatusAudit,
} from "@/types/taskManager";
import { getErrorMessage } from "@/utils/taskManager";

interface UseAdminDeps {
  tasks?: OfficeTask[];
  teamMembers?: OfficeUser[];
  institutions?: Institution[];
  activityEvents?: ActivityEvent[];
  notificationPrefs?: NotificationPrefs;
  automationSettings?: AutomationSettings;
  isOffline?: boolean;
  createInAppNotification?: (input: {
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
  logActivityEvent?: (payload: {
    eventType: string;
    summary: string;
    visitTaskId?: string | null;
    institutionId?: string | null;
    targetUserId?: string | null;
    metadata?: Record<string, unknown>;
  }) => Promise<void>;
  refreshTasks?: (opts?: { showLoading?: boolean }) => Promise<void>;
}

export default function useAdmin(
  officeUser: OfficeUser | null,
  deps: UseAdminDeps = {},
) {
  const {
    tasks = [],
    teamMembers = [],
    institutions = [],
    activityEvents = [],
    notificationPrefs,
    automationSettings,
    isOffline = false,
    createInAppNotification,
    logActivityEvent,
    refreshTasks,
  } = deps;

  // --- Admin module & drawer state ---
  const [adminModule, setAdminModule] = useState<AdminModule>("overview");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [adminMemberDrawerOpen, setAdminMemberDrawerOpen] = useState(false);

  // --- Invite state ---
  const [invites, setInvites] = useState<OfficeInvite[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteDepartment, setInviteDepartment] = useState("");
  const [inviteRole, setInviteRole] = useState<"employee" | "admin">("employee");
  const [inviting, setInviting] = useState(false);

  // --- Admin global filters ---
  const [adminRangePreset, setAdminRangePreset] = useState<"today" | "yesterday" | "this_week" | "this_month" | "all" | "custom">("today");
  const [adminRangeFrom, setAdminRangeFrom] = useState("");
  const [adminRangeTo, setAdminRangeTo] = useState("");
  const [adminGlobalBrand, setAdminGlobalBrand] = useState<VisitBrand | "all">("all");
  const [adminGlobalInstitutionType, setAdminGlobalInstitutionType] = useState<InstitutionType | "all">("all");
  const [adminGlobalEmployee, setAdminGlobalEmployee] = useState<string>("all");
  const [adminGlobalCity, setAdminGlobalCity] = useState("");
  const [adminGlobalVisitStatus, setAdminGlobalVisitStatus] = useState<VisitStatus | "all">("all");
  const [adminGlobalFollowUpStatus, setAdminGlobalFollowUpStatus] = useState<FollowUpStatus | "all">("all");
  const [adminGlobalLeadStage, setAdminGlobalLeadStage] = useState<LeadStage | "all">("all");
  const [adminGlobalConversionStatus, setAdminGlobalConversionStatus] = useState<ConversionStatus | "all">("all");
  const [adminGlobalRevenueBand, setAdminGlobalRevenueBand] = useState<"all" | "lt_100k" | "100k_500k" | "gt_500k">("all");
  const [adminGlobalLeadScoreBand, setAdminGlobalLeadScoreBand] = useState<"all" | "high" | "medium" | "low">("all");

  // --- Data health state ---
  const [dataHealthCheckedAt, setDataHealthCheckedAt] = useState<string | null>(null);
  const [dataHealthActionBusy, setDataHealthActionBusy] = useState<"rpc" | null>(null);

  // --- Automation ---
  const lastAutomationRunAt = useRef(0);

  // --- Invite functions ---
  const createInvite = useCallback(async () => {
    if (officeUser?.role !== "admin") return;
    if (!inviteEmail.trim()) {
      toast.error("Invite email is required.");
      return;
    }
    setInviting(true);
    try {
      await tmCreateInvite({
        email: inviteEmail.trim().toLowerCase(),
        fullName: inviteName.trim() || null,
        department: inviteDepartment.trim() || null,
        role: inviteRole,
      });
      toast.success("Invite created.");
      setInviteEmail("");
      setInviteName("");
      setInviteDepartment("");
      setInviteRole("employee");
      await refreshTasks?.({ showLoading: false });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to create invite."));
    } finally {
      setInviting(false);
    }
  }, [officeUser, inviteEmail, inviteName, inviteDepartment, inviteRole, refreshTasks]);

  const resendInvite = useCallback(async (inviteId: string) => {
    if (officeUser?.role !== "admin") return;
    try {
      await tmUpdateInviteStatus(inviteId, "pending");
      toast.success("Invite resent.");
      await refreshTasks?.({ showLoading: false });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to resend invite."));
    }
  }, [officeUser, refreshTasks]);

  const revokeInvite = useCallback(async (inviteId: string) => {
    if (officeUser?.role !== "admin") return;
    // Explicit confirm — revoking blocks the invitee from accepting and there's no undo.
    if (typeof window !== "undefined" && !window.confirm("Revoke this invite? The invitee will no longer be able to accept it.")) {
      return;
    }
    try {
      await tmUpdateInviteStatus(inviteId, "revoked");
      toast.success("Invite revoked.");
      await refreshTasks?.({ showLoading: false });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to revoke invite."));
    }
  }, [officeUser, refreshTasks]);

  // --- Data health functions ---
  const runDataHealthCheck = useCallback(async () => {
    if (!officeUser || officeUser.role !== "admin") return;
    setDataHealthActionBusy("rpc");
    try {
      // The legacy Supabase RPC backfilled office_users rows from
      // historical task assignees. The CRM keeps office_users authoritative
      // via /api/tm/office-users PUT calls during login + invite-accept, so
      // this backfill is a no-op on the new stack. Triggering it just
      // refreshes the local cache.
      await refreshTasks?.({ showLoading: false });
      setDataHealthCheckedAt(new Date().toISOString());
      toast.success("Data refresh complete.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Refresh failed."));
    } finally {
      setDataHealthActionBusy(null);
    }
  }, [officeUser, refreshTasks]);

  const runDataHealthFix = useCallback(async () => {
    // Alias / wrapper for the same RPC — can be extended for additional fix logic
    await runDataHealthCheck();
  }, [runDataHealthCheck]);

  // --- Automation engine ---
  const runAutomation = useCallback(async () => {
    if (!officeUser || isOffline) return;
    if (!notificationPrefs || !automationSettings) return;
    const now = Date.now();
    if (now - lastAutomationRunAt.current < 60000) return;
    lastAutomationRunAt.current = now;

    try {
      const today = new Date().toISOString().slice(0, 10);
      const incompleteThreshold = Date.now() - Number(automationSettings.incomplete_visit_hours || 2) * 60 * 60 * 1000;

      if (notificationPrefs.in_app_enabled && officeUser.role === "employee" && createInAppNotification) {
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

      if (notificationPrefs.in_app_enabled && officeUser.role === "admin" && createInAppNotification) {
        const adminUsers = teamMembers.filter((member) => member.role === "admin").map((member) => member.id);
        const adminTargets = adminUsers.length ? adminUsers : [officeUser.id];
        const visitTasks = tasks.filter((task) => task.task_category === "visit");
        const overdue = visitTasks.filter(
          (task) => task.follow_up_required && task.follow_up_status === "pending" && (task.follow_up_date || "") < today,
        );
        const highInterestInactive = institutions.filter((institution) => {
          if (!institution.last_visit_at) return false;
          const getTaskBrandDetails = (task: OfficeTask) => task.brand_details || {};
          const detailsTask = visitTasks.find((task) => task.institution_id === institution.id && getTaskBrandDetails(task).interest_level === "high");
          if (!detailsTask) return false;
          const cutoff =
            Date.now() - Number(automationSettings.high_interest_inactive_days || 3) * 24 * 60 * 60 * 1000;
          return new Date(institution.last_visit_at).getTime() < cutoff;
        });
        const proposalStale = institutions.filter((institution) => {
          if (institution.current_lead_stage !== "proposal_expected" || !institution.last_visit_at) return false;
          const cutoff = Date.now() - Number(automationSettings.proposal_stale_days || 3) * 24 * 60 * 60 * 1000;
          return new Date(institution.last_visit_at).getTime() < cutoff;
        });
        const demoStale = institutions.filter((institution) => {
          if (institution.current_lead_stage !== "demo_scheduled" || !institution.last_visit_at) return false;
          const cutoff = Date.now() - Number(automationSettings.demo_stale_days || 3) * 24 * 60 * 60 * 1000;
          return new Date(institution.last_visit_at).getTime() < cutoff;
        });

        const employeeLastActivity = teamMembers
          .filter((member) => member.role === "employee")
          .map((member) => {
            const latestTaskUpdate = tasks
              .filter((task) => task.user_id === member.id)
              .map((task) => new Date(task.updated_at).getTime())
              .sort((a, b) => b - a)[0];
            const latestEventUpdate = activityEvents
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
              actionUrl: "/task/admin/institutions",
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
              actionUrl: "/task/admin/institutions",
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

      await logActivityEvent?.({
        eventType: "automation_scan_completed",
        summary: "Smart reminder scan executed",
        metadata: {
          role: officeUser.role,
          tasks_considered: tasks.length,
          institutions_considered: institutions.length,
        },
      });
    } finally {
      // Note: runningAutomation state is kept in the parent
    }
  }, [
    officeUser,
    isOffline,
    notificationPrefs,
    automationSettings,
    tasks,
    teamMembers,
    institutions,
    activityEvents,
    createInAppNotification,
    logActivityEvent,
  ]);

  // --- Effect: load invites when admin ---
  useEffect(() => {
    if (!officeUser || officeUser.role !== "admin") return;
    let cancelled = false;
    (async () => {
      try {
        const inviteData = await tmListInvites().catch(() => [] as Array<Record<string, unknown>>);
        if (!cancelled) {
          setInvites((inviteData ?? []) as unknown as OfficeInvite[]);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [officeUser]);

  // --- Admin analytics / computed data ---
  const pipelineStats = useMemo(() => {
    const totalInstitutions = institutions.length;
    const byStage = institutions.reduce<Record<string, number>>((acc, inst) => {
      const stage = inst.current_lead_stage || "new_lead";
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
    const converted = institutions.filter((inst) => inst.conversion_status === "converted").length;
    const conversionRate = totalInstitutions > 0 ? ((converted / totalInstitutions) * 100).toFixed(1) : "0";
    return {
      totalInstitutions,
      byStage,
      converted,
      conversionRate,
    };
  }, [institutions]);

  const teamStats = useMemo(() => {
    const totalEmployees = teamMembers.filter((m) => m.role === "employee").length;
    // Pre-index tasks by user_id once so per-member aggregation is O(N+M) instead of O(N*M).
    // At 20 employees x 5k tasks the old filter-per-member ran 100k times per render.
    const tasksByUser = new Map<string, typeof tasks>();
    for (const t of tasks) {
      if (!t.user_id) continue;
      const bucket = tasksByUser.get(t.user_id);
      if (bucket) bucket.push(t);
      else tasksByUser.set(t.user_id, [t]);
    }
    const employeeActivity = teamMembers
      .filter((m) => m.role === "employee")
      .map((member) => {
        const memberTasks = tasksByUser.get(member.id) ?? [];
        let completed = 0, ongoing = 0, delayed = 0;
        for (const t of memberTasks) {
          if (t.status === "completed") completed++;
          else if (t.status === "ongoing") ongoing++;
          else if (t.status === "delayed") delayed++;
        }
        return {
          id: member.id,
          name: member.full_name,
          total: memberTasks.length,
          completed,
          ongoing,
          delayed,
        };
      });
    return {
      totalEmployees,
      employeeActivity,
    };
  }, [teamMembers, tasks]);

  const revenueMetrics = useMemo(() => {
    const expectedRevenue = institutions.reduce(
      (sum, inst) => sum + Number(inst.expected_value || 0),
      0,
    );
    const finalRevenue = institutions.reduce(
      (sum, inst) => sum + Number(inst.final_value || 0),
      0,
    );
    const conversionValue = institutions.reduce(
      (sum, inst) => sum + Number(inst.conversion_value || 0),
      0,
    );
    const effectiveRevenue = finalRevenue || conversionValue;
    const totalConversions = institutions.filter(
      (inst) => inst.conversion_status === "converted",
    ).length;
    const conversionRate = institutions.length > 0
      ? ((totalConversions / institutions.length) * 100).toFixed(1)
      : "0";
    const highPotential = institutions.filter((inst) => {
      const score = Number(inst.lead_score ?? 0);
      return score >= 7 && inst.conversion_status !== "converted";
    }).length;
    const atRisk = institutions.filter((inst) => {
      const score = Number(inst.lead_score ?? 0);
      return score >= 5 && inst.conversion_status !== "converted" && inst.last_visit_at
        ? (Date.now() - new Date(inst.last_visit_at).getTime() > 7 * 24 * 60 * 60 * 1000)
        : false;
    }).length;
    const stalled = institutions.filter((inst) => {
      if (inst.conversion_status === "converted") return false;
      if (!inst.last_visit_at) return true;
      return Date.now() - new Date(inst.last_visit_at).getTime() > 14 * 24 * 60 * 60 * 1000;
    }).length;

    return {
      expectedRevenue,
      effectiveRevenue,
      totalConversions,
      conversionRate,
      highPotential,
      atRisk,
      stalled,
    };
  }, [institutions]);

  return {
    // State: admin module & drawer
    adminModule,
    setAdminModule,
    selectedEmployeeId,
    setSelectedEmployeeId,
    adminMemberDrawerOpen,
    setAdminMemberDrawerOpen,

    // State: invites
    invites,
    setInvites,
    inviteEmail,
    setInviteEmail,
    inviteName,
    setInviteName,
    inviteDepartment,
    setInviteDepartment,
    inviteRole,
    setInviteRole,
    inviting,
    setInviting,

    // State: admin global filters
    adminRangePreset,
    setAdminRangePreset,
    adminRangeFrom,
    setAdminRangeFrom,
    adminRangeTo,
    setAdminRangeTo,
    adminGlobalBrand,
    setAdminGlobalBrand,
    adminGlobalInstitutionType,
    setAdminGlobalInstitutionType,
    adminGlobalEmployee,
    setAdminGlobalEmployee,
    adminGlobalCity,
    setAdminGlobalCity,
    adminGlobalVisitStatus,
    setAdminGlobalVisitStatus,
    adminGlobalFollowUpStatus,
    setAdminGlobalFollowUpStatus,
    adminGlobalLeadStage,
    setAdminGlobalLeadStage,
    adminGlobalConversionStatus,
    setAdminGlobalConversionStatus,
    adminGlobalRevenueBand,
    setAdminGlobalRevenueBand,
    adminGlobalLeadScoreBand,
    setAdminGlobalLeadScoreBand,

    // State: data health
    dataHealthCheckedAt,
    setDataHealthCheckedAt,
    dataHealthActionBusy,
    setDataHealthActionBusy,

    // Functions: invites
    createInvite,
    resendInvite,
    revokeInvite,

    // Functions: data health
    runDataHealthCheck,
    runDataHealthFix,

    // Functions: automation
    runAutomation,

    // Computed: analytics
    pipelineStats,
    teamStats,
    revenueMetrics,
  };
}
