import React from "react";
import { Calendar, CheckCircle2, Clock3, AlertTriangle, Building2, Plus } from "lucide-react";
import { OfficeTask, OfficeUser } from "@/types/taskManager";
import { formatRelativeTime } from "@/lib/timeUtils";

interface EmployeeDashboardPanelProps {
  officeUser: OfficeUser;
  tasks: OfficeTask[];
  onOpenTask: (task: OfficeTask) => void;
  onCreateTask: () => void;
}

// ── Date helpers ────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDayLabel(isoStr: string): string {
  const d = new Date(isoStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" });
}

function startOfWeekISO(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

function endOfNextSevenDaysISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function startOfMonthISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// ── Visit status helpers ────────────────────────────────────────────────────

const visitStatusDot: Record<string, string> = {
  completed:        "bg-emerald-500",
  planned:          "bg-amber-400",
  rescheduled:      "bg-rose-400",
  closed_lost:      "bg-rose-600",
  in_meeting:       "bg-blue-500",
  reached:          "bg-indigo-400",
  followup_pending: "bg-violet-400",
};

const visitStatusLabel: Record<string, string> = {
  planned:          "Planned",
  reached:          "Reached",
  in_meeting:       "In Meeting",
  completed:        "Completed",
  followup_pending: "Follow-up Pending",
  rescheduled:      "Rescheduled",
  closed_lost:      "Closed Lost",
};

// ── KPI mini card ────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  children,
}: {
  label: string;
  value: number | string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-1">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EmployeeDashboardPanel({
  officeUser,
  tasks,
  onOpenTask,
  onCreateTask,
}: EmployeeDashboardPanelProps) {
  const today = todayISO();

  // ── A: Next Action ──────────────────────────────────────────────────────────
  const overdueTasks = tasks
    .filter(
      (t) =>
        t.status !== "completed" &&
        t.due_date !== null &&
        t.due_date !== undefined &&
        t.due_date <= today
    )
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date < b.due_date ? -1 : 1;
    });

  const firstOverdue = overdueTasks[0] ?? null;

  // ── B: KPI rows ─────────────────────────────────────────────────────────────
  const todayVisits = tasks.filter(
    (t) => t.task_category === "visit" && t.visit_date === today
  );

  const visitStatusBreakdown = {
    planned:     todayVisits.filter((t) => !t.visit_status || t.visit_status === "planned").length,
    inProgress:  todayVisits.filter((t) => t.visit_status === "reached" || t.visit_status === "in_meeting").length,
    completed:   todayVisits.filter((t) => t.visit_status === "completed").length,
    followup:    todayVisits.filter((t) => t.visit_status === "followup_pending").length,
    rescheduled: todayVisits.filter((t) => t.visit_status === "rescheduled").length,
  };

  const nextSevenEnd = endOfNextSevenDaysISO();
  const followUpThisWeek = tasks.filter(
    (t) =>
      t.follow_up_date !== null &&
      t.follow_up_date !== undefined &&
      t.follow_up_date >= today &&
      t.follow_up_date <= nextSevenEnd
  ).length;

  const monthStart = startOfMonthISO();
  const completedThisMonth = tasks.filter(
    (t) =>
      t.status === "completed" &&
      t.updated_at >= monthStart
  ).length;

  // ── C: Today's Plan ─────────────────────────────────────────────────────────
  // Collapse duplicates: when a visit is submitted with a scheduled follow-up,
  // the workflow may create a sibling task row (same institution, same day).
  // Keep the latest-updated one per institution so "Abhyasa School" only shows once.
  const todayVisitRows = tasks
    .filter((t) => t.task_category === "visit" && t.visit_date === today)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
  const dedupeKey = (t: OfficeTask) =>
    (t.institution_id || t.institution_name || t.id).toLowerCase();
  const seenKeys = new Set<string>();
  const todayPlanTasks = todayVisitRows
    .filter((t) => {
      const key = dedupeKey(t);
      if (seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    })
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));

  // ── D: Recent Wins (exclude today's — those already show in Today's Plan) ──
  const recentWins = tasks
    .filter((t) => t.status === "completed" && t.visit_date !== today && t.task_category === "visit")
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* ── A: Next Action card ─────────────────────────────────────────────── */}
      {firstOverdue ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900">
                  ⚡ {overdueTasks.length} follow-up{overdueTasks.length !== 1 ? "s" : ""} due today
                </p>
                <p className="text-xs text-amber-700 mt-0.5 truncate">{firstOverdue.task_title}</p>
              </div>
            </div>
            <button
              onClick={() => onOpenTask(firstOverdue)}
              className="flex-shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg px-2.5 py-1 transition-colors"
            >
              View All
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-800">
            ✓ You&apos;re all caught up! No overdue follow-ups.
          </p>
        </div>
      )}

      {/* ── B: KPI row — compact 2x2 on mobile, 4-across on sm+ ─────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <div className="rounded-xl border-l-4 border-l-amber-400 border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Planned</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 leading-none sm:text-2xl">{visitStatusBreakdown.planned}</p>
          <p className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">today</p>
        </div>
        <div className="rounded-xl border-l-4 border-l-indigo-400 border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-700">In Progress</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 leading-none sm:text-2xl">{visitStatusBreakdown.inProgress}</p>
          <p className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">reached / meeting</p>
        </div>
        <div className="rounded-xl border-l-4 border-l-emerald-500 border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Completed</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 leading-none sm:text-2xl">{visitStatusBreakdown.completed}</p>
          <p className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">closed today</p>
        </div>
        <div className="rounded-xl border-l-4 border-l-violet-400 border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-violet-700">Follow-up</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 leading-none sm:text-2xl">{visitStatusBreakdown.followup}</p>
          <p className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">awaiting</p>
        </div>
      </div>

      {/* ── Secondary KPI row — scrollable strip on mobile, 3-across on sm+ ─── */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-3 sm:gap-3 sm:overflow-visible sm:px-0">
        <div className="shrink-0 basis-[42%] rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:basis-auto sm:p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Total Today</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 leading-none sm:text-2xl">{todayVisits.length}</p>
          <p className="text-[10px] text-slate-400 sm:text-[11px]">scheduled</p>
        </div>
        <div className="shrink-0 basis-[42%] rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:basis-auto sm:p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">F/U this week</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 leading-none sm:text-2xl">{followUpThisWeek}</p>
          <p className="text-[10px] text-slate-400 sm:text-[11px]">next 7 days</p>
        </div>
        <div className="shrink-0 basis-[42%] rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:basis-auto sm:p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">Month</p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 leading-none sm:text-2xl">{completedThisMonth}</p>
          <p className="text-[10px] text-slate-400 sm:text-[11px]">done this month</p>
        </div>
      </div>

      {/* ── C: Today's Plan ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="mb-2 flex items-center justify-between sm:mb-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">Today&apos;s Plan</p>
            <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">{formatDayLabel(today)}</p>
          </div>
          <Calendar size={14} className="shrink-0 text-slate-400" />
        </div>

        {todayPlanTasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Calendar size={28} className="text-slate-300" />
            <p className="text-sm text-slate-500 font-medium">No visits planned for today</p>
            <button
              onClick={onCreateTask}
              className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              <Plus size={12} />
              Plan a Visit
            </button>
          </div>
        ) : (
          <ul className="space-y-0">
            {todayPlanTasks.map((task, idx) => {
              const vsKey = task.visit_status ?? "planned";
              const dotColor = visitStatusDot[vsKey] ?? "bg-slate-300";
              const statusLabel = visitStatusLabel[vsKey] ?? vsKey;
              const isLast = idx === todayPlanTasks.length - 1;

              return (
                <li key={task.id} className="flex items-start gap-3">
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center flex-shrink-0 mt-1">
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
                    {!isLast && (
                      <span className="w-px flex-1 min-h-[20px] border-l-2 border-slate-200 mt-0.5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {task.institution_name ?? task.task_title}
                          </p>
                          {task.visit_brand && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex-shrink-0">
                              {task.visit_brand}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          {vsKey === "completed" || vsKey === "followup_pending" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <CheckCircle2 size={10} /> Closed for today
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${
                                vsKey === "reached" || vsKey === "in_meeting"
                                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                                  : vsKey === "rescheduled"
                                    ? "border-rose-300 bg-rose-50 text-rose-700"
                                    : "border-amber-300 bg-amber-50 text-amber-700"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          )}
                          {task.follow_up_date && vsKey === "followup_pending" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                              Follow-up · {task.follow_up_date}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {(vsKey === "planned" || !task.visit_status) ? (
                        <button
                          onClick={() => onOpenTask(task)}
                          className="flex-shrink-0 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md px-2 py-1 transition-colors"
                        >
                          Start
                        </button>
                      ) : vsKey === "reached" || vsKey === "in_meeting" ? (
                        <button
                          onClick={() => onOpenTask(task)}
                          className="flex-shrink-0 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md px-2 py-1 transition-colors"
                        >
                          Resume
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenTask(task)}
                          className="flex-shrink-0 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-md px-2 py-1 transition-colors"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── D: Recent Wins (visits closed before today) ─────────────────────── */}
      {recentWins.length > 0 && (
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <p className="text-sm font-semibold text-slate-900">Recently Closed Visits</p>
            </div>
            <p className="text-[11px] text-slate-400">before today</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentWins.map((task) => (
              <button
                key={task.id}
                onClick={() => onOpenTask(task)}
                className="min-w-[160px] rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-3 text-left flex flex-col gap-1.5 transition-colors flex-shrink-0"
              >
                <div className="flex items-center gap-1.5">
                  <Building2 size={11} className="text-slate-400 flex-shrink-0" />
                  <p className="text-xs font-medium text-slate-900 truncate leading-snug">
                    {task.institution_name ?? task.task_title}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100 rounded-full px-1.5 py-0.5 w-fit">
                  <CheckCircle2 size={9} />
                  {formatRelativeTime(task.updated_at)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
