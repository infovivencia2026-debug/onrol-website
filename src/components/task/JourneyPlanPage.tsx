/**
 * JourneyPlanPage
 *
 * Standalone component for the employee's Journey Plan section.
 * Extracted from TaskManager.tsx to keep this UX slice maintainable.
 *
 * Layout: compact header bar → thin progress bar → tabbed main content + slim sidebar
 */
import React, { useState } from "react";
import { CalendarOff, ChevronDown, ChevronRight, MapPin, Search, Share2, X } from "lucide-react";
import type { NotificationItem, OfficeTask, UiTheme } from "@/types/taskManager";
import { getJourneyStageIndex } from "@/utils/taskManager";
import { shareViaWhatsApp, buildVisitShareText } from "@/lib/whatsappShare";

export interface JourneyPlannerData {
  today: OfficeTask[];
  tomorrow: OfficeTask[];
  selected: OfficeTask[];
  upcoming: OfficeTask[];
  all: OfficeTask[];
}

export interface JourneyPlanPageProps {
  journeyPlanner: JourneyPlannerData;
  journeyDate: string;
  setJourneyDate: (d: string) => void;
  journeyViewMode: "day" | "upcoming" | "all";
  setJourneyViewMode: (m: "day" | "upcoming" | "all") => void;
  journeyVisitSearch: string;
  setJourneyVisitSearch: (s: string) => void;
  expandedVisitTaskId: string | null;
  setExpandedVisitTaskId: (id: string | null) => void;
  uiTheme: UiTheme;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => Promise<void>;
  openCreateForm: () => void;
  renderTaskCard: (task: OfficeTask) => React.ReactNode;
  navigate: (url: string) => void;
}

// Helpers

function stageLabel(task: OfficeTask, dark: boolean) {
  // Completed for today — but may still have a follow-up scheduled
  if (task.visit_status === "completed" || task.status === "completed") {
    const followLabel = task.follow_up_date ? ` · F/U ${task.follow_up_date}` : "";
    return {
      label: `Closed for today${followLabel}`,
      dot: "bg-emerald-500",
      badge: dark ? "bg-emerald-900/30 text-emerald-300 border-emerald-800/40" : "bg-emerald-50 text-emerald-700 border-emerald-200",
      border: "border-l-4 border-l-emerald-400",
    };
  }
  if (task.visit_status === "closed_lost") {
    return {
      label: "Closed — Lost",
      dot: "bg-slate-500",
      badge: dark ? "bg-[#454545]/40 text-slate-300 border-slate-600" : "bg-slate-100 text-slate-700 border-slate-300",
      border: "border-l-4 border-l-slate-400",
    };
  }
  if (task.visit_status === "followup_pending") {
    return {
      label: task.follow_up_date ? `Follow-up pending · ${task.follow_up_date}` : "Follow-up pending",
      dot: "bg-amber-500",
      badge: dark ? "bg-amber-900/30 text-amber-300 border-amber-800/40" : "bg-amber-50 text-amber-800 border-amber-300",
      border: "border-l-4 border-l-amber-400",
    };
  }
  if (task.visit_status === "in_meeting") {
    return {
      label: "In Meeting",
      dot: "bg-indigo-500",
      badge: dark ? "bg-[#f3f5f8]/30 text-indigo-300 border-[#454545]/40" : "bg-indigo-50 text-indigo-700 border-indigo-200",
      border: "border-l-4 border-l-indigo-400",
    };
  }
  if (task.visit_status === "reached") {
    return {
      label: "Reached",
      dot: "bg-amber-500",
      badge: dark ? "bg-amber-900/30 text-amber-300 border-amber-800/40" : "bg-amber-50 text-amber-700 border-amber-200",
      border: "border-l-4 border-l-amber-400",
    };
  }
  if (task.visit_status === "rescheduled") {
    return {
      label: "Rescheduled",
      dot: "bg-rose-400",
      badge: dark ? "bg-rose-900/30 text-rose-300 border-rose-800/40" : "bg-rose-50 text-rose-700 border-rose-200",
      border: "border-l-4 border-l-rose-400",
    };
  }
  return {
    label: "Planned",
    dot: "bg-sky-500",
    badge: dark ? "bg-[#f3f5f8]/30 text-orange-300 border-[#454545]/40" : "bg-sky-50 text-orange-700 border-orange-200",
    border: "border-l-4 border-l-sky-400",
  };
}

/** Format "2026-04-10" → "Thursday, 10 Apr 2026" */
function formatDisplayDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}

// Sub-components

interface VisitRowProps {
  task: OfficeTask;
  isExpanded: boolean;
  onToggle: () => void;
  showDate: boolean;
  dark: boolean;
  renderTaskCard: (task: OfficeTask) => React.ReactNode;
}

const VisitRow: React.FC<VisitRowProps> = ({ task, isExpanded, onToggle, showDate, dark, renderTaskCard }) => {
  const { label: stageText, dot: stageDot, badge: stageBadge, border: stageBorder } = stageLabel(task, dark);
  const taskDate = task.visit_date || task.assigned_date;

  return (
    <div key={`jp-row-${task.id}`}>
      {/* Row: use a div to avoid nested-button DOM issues (WhatsApp button is a sibling). */}
      <div className={`crm-list-row relative flex w-full items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-4 sm:py-3.5 transition-colors ${stageBorder} ${
        isExpanded
          ? dark ? "bg-[#404040]" : "bg-slate-50"
          : dark ? "hover:bg-[#404040]/60" : "hover:bg-slate-50/70"
      }`}>
        {/* Clickable main area */}
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          className="absolute inset-0 z-0 w-full cursor-pointer"
          tabIndex={-1}
          aria-hidden="true"
        />
        <span className={`relative z-10 mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${stageDot}`} />
        <div className="relative z-10 min-w-0 flex-1" onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onToggle()}>
          <p className={`truncate text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-900"}`}>
            {task.institution_name || task.task_title}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
            {task.visit_brand ? (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  task.visit_brand === "ONROL"
                    ? dark ? "bg-[#f3f5f8]/30 text-orange-300" : "bg-blue-50 text-orange-700"
                    : dark ? "bg-violet-900/30 text-violet-300" : "bg-violet-50 text-violet-700"
                }`}
              >
                {task.visit_brand}
              </span>
            ) : null}
            {task.institution_type ? (
              <span className={`text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {task.institution_type}
              </span>
            ) : null}
            {(task as OfficeTask & { city?: string }).city ? (
              <span className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                · {(task as OfficeTask & { city?: string }).city}
              </span>
            ) : null}
            {showDate && taskDate ? (
              <span className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>· {taskDate}</span>
            ) : null}
          </div>
        </div>
        <div className="relative z-10 flex shrink-0 items-center gap-2">
          <span className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:inline-flex ${stageBadge}`}>
            {stageText}
          </span>
          {/* WhatsApp share: sibling button, not nested. */}
          <button
            type="button"
            title="Share via WhatsApp"
            onClick={() => shareViaWhatsApp(buildVisitShareText({
              institutionName: task.institution_name || task.task_title || "Visit",
              visitDate: task.visit_date || task.assigned_date,
              visitBrand: task.visit_brand,
              status: stageText,
              notes: (task as OfficeTask & { notes?: string | null }).notes,
            }))}
            className={`hidden rounded-full p-1 transition-colors sm:inline-flex ${dark ? "text-emerald-400 hover:bg-emerald-900/30" : "text-emerald-600 hover:bg-emerald-50"}`}
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onToggle} className={`rounded-full p-0.5 transition-colors ${dark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      {isExpanded ? (
        <div
          className={`border-t px-2 pb-3 pt-2 ${
            dark ? "border-[#404040] bg-[#404040]/40" : "border-slate-100 bg-slate-50/70"
          }`}
        >
          {renderTaskCard(task)}
        </div>
      ) : null}
    </div>
  );
};

// Main component

const JourneyPlanPage: React.FC<JourneyPlanPageProps> = ({
  journeyPlanner,
  journeyDate,
  setJourneyDate,
  journeyViewMode,
  setJourneyViewMode,
  journeyVisitSearch,
  setJourneyVisitSearch,
  expandedVisitTaskId,
  setExpandedVisitTaskId,
  uiTheme,
  notifications,
  markNotificationRead,
  openCreateForm,
  renderTaskCard,
  navigate,
}) => {
  const todayIso = new Date().toISOString().slice(0, 10);
  const dark = uiTheme === "dark";

  // Collapsed state for upcoming date groups; first group stays open by default.
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const prevDay = new Date(journeyDate);
  prevDay.setDate(prevDay.getDate() - 1);
  const nextDay = new Date(journeyDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const todayCompleted = journeyPlanner.today.filter((t) => getJourneyStageIndex(t) === 3);
  const todayTotal = journeyPlanner.today.length;
  const completedPct = todayTotal > 0 ? Math.round((todayCompleted.length / todayTotal) * 100) : 0;

  const unreadAlerts = notifications.filter((n) => !n.is_read);

  // Filtered lists
  const query = journeyVisitSearch.trim().toLowerCase();

  const filteredSelected = journeyPlanner.selected.filter(
    (t) =>
      !query ||
      (t.institution_name || t.task_title || "").toLowerCase().includes(query) ||
      (t.visit_brand || "").toLowerCase().includes(query) ||
      (t.institution_type || "").toLowerCase().includes(query),
  );

  const filteredAll = journeyPlanner.all.filter(
    (t) =>
      !query ||
      (t.institution_name || t.task_title || "").toLowerCase().includes(query) ||
      (t.visit_brand || "").toLowerCase().includes(query) ||
      (t.institution_type || "").toLowerCase().includes(query),
  );

  // group upcoming by date
  const upcomingByDate = journeyPlanner.upcoming.reduce<Record<string, OfficeTask[]>>((acc, t) => {
    const d = t.visit_date || t.assigned_date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(t);
    return acc;
  }, {});
  const upcomingDateEntries = Object.entries(upcomingByDate).sort(([a], [b]) => a.localeCompare(b));

  // Card and label helpers
  const sideCard = (children: React.ReactNode) => (
    <div
      className={`crm-rail-card rounded-2xl border p-4 shadow-sm ${
        dark ? "border-[#404040] bg-[#f3f5f8]" : "border-slate-200 bg-white"
      }`}
    >
      {children}
    </div>
  );

  const sectionLabel = (text: string) => (
    <p className={`text-xs font-semibold uppercase tracking-widest ${dark ? "text-slate-400" : "text-slate-500"}`}>
      {text}
    </p>
  );

  const mainPanelCls = `crm-card rounded-2xl border shadow-sm ${
    dark ? "border-[#404040] bg-[#f3f5f8]" : "border-slate-200 bg-white"
  }`;

  const dividerCls = `divide-y ${dark ? "divide-[#404040]" : "divide-slate-100"}`;

  // Tab content renderers

  const renderTodayTab = () => (
    <>
      {/* Stat row: 2-column grid on mobile, flex row on small screens and above. */}
      <div className={`grid grid-cols-2 gap-1.5 border-b px-3 py-2.5 sm:flex sm:flex-wrap sm:gap-2 sm:px-4 ${dark ? "border-[#404040]" : "border-slate-100"}`}>
        {[
          {
            label: "Planned",
            value: journeyPlanner.selected.filter((t) => getJourneyStageIndex(t) === 0).length,
            colorText: dark ? "text-orange-300" : "text-orange-700",
            colorBg: dark ? "border-[#454545]/40 bg-[#f3f5f8]/20" : "border-sky-100 bg-sky-50",
          },
          {
            label: "Reached",
            value: journeyPlanner.selected.filter((t) => getJourneyStageIndex(t) === 1).length,
            colorText: dark ? "text-amber-300" : "text-amber-700",
            colorBg: dark ? "border-amber-800/40 bg-amber-900/20" : "border-amber-100 bg-amber-50",
          },
          {
            label: "In Meeting",
            value: journeyPlanner.selected.filter((t) => getJourneyStageIndex(t) === 2).length,
            colorText: dark ? "text-indigo-300" : "text-indigo-700",
            colorBg: dark ? "border-[#454545]/40 bg-[#f3f5f8]/20" : "border-indigo-100 bg-indigo-50",
          },
          {
            label: "Completed",
            value: journeyPlanner.selected.filter((t) => getJourneyStageIndex(t) === 3).length,
            colorText: dark ? "text-emerald-300" : "text-emerald-700",
            colorBg: dark ? "border-emerald-800/40 bg-emerald-900/20" : "border-emerald-100 bg-emerald-50",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`crm-kpi-tile flex items-center gap-2 rounded-lg border px-2.5 py-1.5 sm:px-3 ${stat.colorBg}`}
          >
            <p className={`text-base font-bold leading-none sm:text-lg ${stat.colorText}`}>{stat.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Visit list */}
      <div className={dividerCls}>
        {filteredSelected.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarOff
              className={`mb-3 h-12 w-12 ${dark ? "text-slate-600" : "text-slate-300"}`}
              strokeWidth={1.5}
            />
          <p className={`text-sm font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>No visits planned</p>
            <p className={`mt-1 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
              Nothing planned for this date yet.
            </p>
            <button
              onClick={openCreateForm}
              className="mt-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              + Create Visit
            </button>
          </div>
        ) : (
          filteredSelected.map((task) => (
            <VisitRow
              key={task.id}
              task={task}
              isExpanded={expandedVisitTaskId === task.id}
              onToggle={() => setExpandedVisitTaskId(expandedVisitTaskId === task.id ? null : task.id)}
              showDate={false}
              dark={dark}
              renderTaskCard={renderTaskCard}
            />
          ))
        )}
      </div>
    </>
  );

  const renderUpcomingTab = () => (
    <div className={dividerCls}>
      {upcomingDateEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MapPin className={`mb-3 h-10 w-10 ${dark ? "text-slate-600" : "text-slate-300"}`} strokeWidth={1.5} />
          <p className={`text-sm font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>No upcoming visits scheduled</p>
        </div>
      ) : (
        upcomingDateEntries.map(([date, tasks], groupIdx) => {
          const isCollapsed = collapsedGroups[date] ?? groupIdx !== 0;
          return (
            <div key={`grp-${date}`}>
              {/* Group header */}
              <button
                type="button"
                onClick={() =>
                  setCollapsedGroups((prev) => ({ ...prev, [date]: !isCollapsed }))
                }
                className={`flex w-full items-center justify-between px-4 py-2.5 transition-colors ${
                  dark
                    ? "bg-[#404040]/60 hover:bg-[#404040] text-slate-300"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  )}
                  <span className="text-xs font-semibold">
                    {date === todayIso ? "Today" : formatDisplayDate(date)}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    dark ? "bg-[#454545] text-slate-300" : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {tasks.length} visit{tasks.length !== 1 ? "s" : ""}
                </span>
              </button>

              {/* Group rows */}
              {!isCollapsed && (
                <div className={dividerCls}>
                  {tasks.map((task) => (
                    <VisitRow
                      key={task.id}
                      task={task}
                      isExpanded={expandedVisitTaskId === task.id}
                      onToggle={() => setExpandedVisitTaskId(expandedVisitTaskId === task.id ? null : task.id)}
                      showDate={false}
                      dark={dark}
                      renderTaskCard={renderTaskCard}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const renderAllTab = () => (
    <>
      {/* Search: visible only in this tab. */}
      <div className={`border-b px-4 py-3 ${dark ? "border-[#404040]" : "border-slate-100"}`}>
        <div className="relative">
          <Search
            className={`absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${
              dark ? "text-slate-500" : "text-slate-400"
            }`}
          />
          <input
            type="text"
            value={journeyVisitSearch}
            onChange={(e) => setJourneyVisitSearch(e.target.value)}
            placeholder="Search institutions, brands, or dates"
            className={`crm-input-soft h-8 w-full rounded-lg border pl-8 pr-8 text-xs ${
              dark
                ? "border-[#454545] bg-[#404040] text-slate-100 placeholder-slate-500"
                : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400"
            }`}
          />
          {journeyVisitSearch ? (
            <button
              onClick={() => setJourneyVisitSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className={`h-3.5 w-3.5 ${dark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`} />
            </button>
          ) : null}
        </div>
      </div>

      <div className={dividerCls}>
        {filteredAll.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin className={`mb-3 h-10 w-10 ${dark ? "text-slate-600" : "text-slate-300"}`} strokeWidth={1.5} />
            <p className={`text-sm font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>No matching visits found</p>
            <p className={`mt-1 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
              Try a different search term.
            </p>
          </div>
        ) : (
          filteredAll.map((task) => (
            <VisitRow
              key={task.id}
              task={task}
              isExpanded={expandedVisitTaskId === task.id}
              onToggle={() => setExpandedVisitTaskId(expandedVisitTaskId === task.id ? null : task.id)}
              showDate={true}
              dark={dark}
              renderTaskCard={renderTaskCard}
            />
          ))
        )}
      </div>
    </>
  );

  // Render
  return (
    <section className="space-y-2 pb-24 sm:space-y-3 sm:pb-6">

      {/* 1) Compact header bar */}
      <div
        className={`crm-rail-card rounded-xl border px-3 py-2.5 shadow-sm sm:rounded-2xl sm:px-4 sm:py-3 ${
          dark ? "border-[#404040] bg-[#f3f5f8]" : "border-slate-200 bg-white"
        }`}
      >
        {/* Row 1: title + add button */}
        <div className="flex items-start justify-between gap-2 sm:items-center">
          <div className="min-w-0">
            <h2
              className={`text-base font-bold leading-tight tracking-tight sm:text-[1.1rem] ${
                dark ? "text-slate-100" : "text-slate-900"
              }`}
            >
              Journey Plan
            </h2>
            <p className={`text-[11px] font-medium ${dark ? "text-slate-400" : "text-slate-500"}`}>
              {formatDisplayDate(journeyDate)}
            </p>
          </div>
          <button
            onClick={openCreateForm}
            className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 active:bg-indigo-700 sm:px-3 sm:text-xs"
          >
            + Add Visit
          </button>
        </div>

        {/* Row 2: date navigation; full width on mobile. */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <button
            onClick={() => setJourneyDate(prevDay.toISOString().slice(0, 10))}
            className={`crm-input-soft flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition-colors sm:text-base ${
              dark
                ? "border-[#454545] bg-[#404040] text-slate-300 active:bg-[#454545]"
                : "border-slate-300 bg-white text-slate-600 active:bg-slate-50"
            }`}
          >
            ‹
          </button>
          <input
            type="date"
            value={journeyDate}
            onChange={(e) => {
              setJourneyDate(e.target.value);
              setJourneyViewMode("day");
            }}
            className={`crm-input-soft h-8 min-w-0 flex-1 rounded-lg border px-2 text-xs font-medium ${
              dark
                ? "border-[#454545] bg-[#404040] text-slate-100"
                : "border-slate-300 bg-white text-slate-900"
            }`}
          />
          <button
            onClick={() => setJourneyDate(nextDay.toISOString().slice(0, 10))}
            className={`crm-input-soft flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition-colors sm:text-base ${
              dark
                ? "border-[#454545] bg-[#404040] text-slate-300 active:bg-[#454545]"
                : "border-slate-300 bg-white text-slate-600 active:bg-slate-50"
            }`}
          >
            ›
          </button>
          {journeyDate !== todayIso ? (
            <button
              onClick={() => {
                setJourneyDate(todayIso);
                setJourneyViewMode("day");
              }}
              className="shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 active:bg-indigo-700 sm:px-3 sm:text-xs"
            >
              Today
            </button>
          ) : null}
        </div>

        {/* Thin completion progress bar */}
        <div
          className={`mt-3 h-1 w-full overflow-hidden rounded-full ${
            dark ? "bg-[#454545]" : "bg-slate-100"
          }`}
        >
          <div
            className="h-1 rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${completedPct}%` }}
          />
        </div>
      </div>

      {/* 2) Alerts banner (inline, shown only when unread alerts exist) */}
      {unreadAlerts.length > 0 ? (
        <div
          className={`flex flex-col gap-2 rounded-xl border px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-start sm:gap-3 sm:px-4 sm:py-3 ${
            dark
              ? "border-rose-800/50 bg-rose-900/20 text-rose-200"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5 sm:gap-2">
            <span className="text-xs font-bold uppercase tracking-wide opacity-70">Alerts</span>
            <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unreadAlerts.length}
            </span>
            {unreadAlerts.slice(0, 3).map((item) => (
              <button
                key={`alert-${item.id}`}
                onClick={async () => {
                  await markNotificationRead(item.id);
                  if (item.action_url) navigate(item.action_url);
                }}
                className={`w-full rounded-lg border px-2.5 py-1 text-left text-[11px] font-semibold transition-colors sm:w-auto ${
                  dark
                    ? "border-rose-700/60 bg-rose-900/40 hover:bg-rose-800/60"
                    : "border-rose-200 bg-white hover:bg-rose-50"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 3) Main grid: tabbed panel with slim sidebar */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">

        {/* Tabbed main panel */}
        <div className={mainPanelCls}>

          {/* Tab bar */}
          <div
            className={`flex items-center gap-0 overflow-x-auto border-b ${dark ? "border-[#404040]" : "border-slate-100"}`}
          >
            {(
              [
                ["day", journeyDate === todayIso ? "Today" : journeyDate.slice(5)],
                ["upcoming", `Upcoming (${journeyPlanner.upcoming.length})`],
                ["all", `All (${journeyPlanner.all.length})`],
              ] as ["day" | "upcoming" | "all", string][]
            ).map(([mode, tabLabel]) => (
              <button
                key={mode}
                onClick={() => setJourneyViewMode(mode)}
                className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-[11px] font-semibold transition-colors sm:px-4 sm:text-xs ${
                  journeyViewMode === mode
                    ? dark
                      ? "border-orange-400 text-orange-300"
                      : "border-sky-600 text-orange-700"
                    : dark
                    ? "border-transparent text-slate-400 hover:text-slate-300"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tabLabel}
              </button>
            ))}
          </div>

          {/* Tab bodies */}
          {journeyViewMode === "day" && renderTodayTab()}
          {journeyViewMode === "upcoming" && renderUpcomingTab()}
          {journeyViewMode === "all" && renderAllTab()}
        </div>

        {/* Slim sidebar: hidden on mobile, sticky on large screens. */}
        <aside className="hidden lg:block space-y-3 lg:sticky lg:top-24 lg:self-start">

          {/* Card 1: Daily Progress */}
          {sideCard(
            <>
              {sectionLabel("Daily Progress")}
              <div className="mt-3 flex items-end justify-between">
                <p className={`text-3xl font-bold ${dark ? "text-slate-100" : "text-slate-900"}`}>
                  {todayCompleted.length}
                  <span className={`text-base font-normal ${dark ? "text-slate-500" : "text-slate-400"}`}>
                    /{todayTotal}
                  </span>
                </p>
                <p className={`text-sm font-semibold ${dark ? "text-emerald-400" : "text-emerald-600"}`}>
                  {completedPct}%
                </p>
              </div>
              <div
                className={`mt-2 h-2 w-full overflow-hidden rounded-full ${
                  dark ? "bg-[#454545]" : "bg-slate-100"
                }`}
              >
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${completedPct}%` }}
                />
              </div>
              <div
                className={`mt-3 grid grid-cols-3 divide-x text-center text-[10px] font-semibold uppercase tracking-wide ${
                  dark ? "divide-[#454545] text-slate-500" : "divide-slate-100 text-slate-400"
                }`}
              >
                <div>
                  <p className={`text-base font-bold ${dark ? "text-orange-300" : "text-orange-700"}`}>
                    {journeyPlanner.today.filter((t) => getJourneyStageIndex(t) === 0).length}
                  </p>
                  <p>Going</p>
                </div>
                <div>
                  <p className={`text-base font-bold ${dark ? "text-indigo-300" : "text-indigo-700"}`}>
                    {journeyPlanner.today.filter((t) => {
                      const s = getJourneyStageIndex(t);
                      return s === 1 || s === 2;
                    }).length}
                  </p>
                  <p>Active</p>
                </div>
                <div>
                  <p className={`text-base font-bold ${dark ? "text-emerald-300" : "text-emerald-700"}`}>
                    {todayCompleted.length}
                  </p>
                  <p>Done</p>
                </div>
              </div>
            </>,
          )}

          {/* Card 2: Upcoming Dates */}
          {journeyPlanner.upcoming.length > 0
            ? sideCard(
                <>
                  {sectionLabel("Upcoming Dates")}
                  <div className="mt-2.5 space-y-1">
                    {upcomingDateEntries.slice(0, 7).map(([date, tasks]) => (
                      <button
                        key={`ud-${date}`}
                        onClick={() => {
                          setJourneyDate(date);
                          setJourneyViewMode("day");
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                          journeyDate === date
                            ? "crm-btn-primary bg-[#f3f5f8] text-white"
                            : dark
                            ? "hover:bg-[#404040] text-slate-300"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="text-xs font-medium">
                          {date === todayIso ? "Today" : formatDisplayDate(date)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            journeyDate === date
                              ? "bg-white/20 text-white"
                              : dark
                              ? "bg-[#454545] text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {tasks.length}
                        </span>
                      </button>
                    ))}
                  </div>
                </>,
              )
            : null}
        </aside>
      </div>
    </section>
  );
};

export default JourneyPlanPage;
