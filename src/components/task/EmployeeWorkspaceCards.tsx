"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  X,
  RotateCcw,
  Building2,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Briefcase,
  TrendingUp,
} from "lucide-react";
import { OfficeTask, OfficeUser } from "@/types/taskManager";

interface EmployeeWorkspaceCardsProps {
  teamMembers: OfficeUser[];
  tasks: OfficeTask[];
  uiTheme: "dark" | "light";
  adminUserId: string;
  onOpenTask: (taskId: string) => void;
  todayStr: string;
}

interface CardState {
  [userId: string]: {
    collapsed: boolean;
    hidden: boolean;
    position: number;
  };
}

function timeSince(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (diffMs < 0) return "just now";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatVisitTime(task: OfficeTask): string {
  const t = task.check_in_at ?? task.meeting_started_at ?? task.created_at;
  if (!t) return "";
  return new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const AVATAR_COLORS = [
  ["bg-violet-100 text-violet-700", "bg-violet-900/50 text-violet-300"],
  ["bg-indigo-100 text-indigo-700", "bg-[#f3f5f8]/50 text-indigo-300"],
  ["bg-sky-100 text-orange-700",       "bg-[#f3f5f8]/50 text-orange-300"],
  ["bg-emerald-100 text-emerald-700","bg-emerald-900/50 text-emerald-300"],
  ["bg-amber-100 text-amber-700",   "bg-amber-900/50 text-amber-300"],
  ["bg-rose-100 text-rose-700",     "bg-rose-900/50 text-rose-300"],
  ["bg-teal-100 text-teal-700",     "bg-[#f3f5f8]/50 text-teal-300"],
];
const avatarColor = (i: number, dark: boolean) =>
  AVATAR_COLORS[i % AVATAR_COLORS.length][dark ? 1 : 0];

const visitStatusColors: Record<string, [string, string]> = {
  planned:          ["bg-indigo-100 text-indigo-700",  "bg-[#f3f5f8]/40 text-indigo-300"],
  reached:          ["bg-amber-100 text-amber-700",    "bg-amber-900/40 text-amber-300"],
  in_meeting:       ["bg-emerald-100 text-emerald-700","bg-emerald-900/40 text-emerald-300"],
  completed:        ["bg-sky-100 text-orange-700",        "bg-[#f3f5f8]/40 text-orange-300"],
  followup_pending: ["bg-violet-100 text-violet-700",  "bg-violet-900/40 text-violet-300"],
  rescheduled:      ["bg-orange-100 text-orange-700",  "bg-orange-900/40 text-orange-300"],
  closed_lost:      ["bg-red-100 text-red-700",        "bg-red-900/40 text-red-300"],
};
const vsColor = (s: string, dark: boolean) =>
  (visitStatusColors[s] ?? visitStatusColors.planned)[dark ? 1 : 0];

const visitStatusLabel: Record<string, string> = {
  planned: "Planned", reached: "Reached", in_meeting: "In Meeting",
  completed: "Done", followup_pending: "Follow-up",
  rescheduled: "Rescheduled", closed_lost: "Closed",
};

export default function EmployeeWorkspaceCards({
  teamMembers, tasks, uiTheme, adminUserId, onOpenTask, todayStr,
}: EmployeeWorkspaceCardsProps) {
  const storageKey = `employee-cards-state-${adminUserId}`;
  const isDark = uiTheme === "dark";

  // ── Card state (persist collapsed / hidden / position) ────────────────────
  const [cardState, setCardState] = useState<CardState>({});
  useEffect(() => {
    try { const r = localStorage.getItem(storageKey); if (r) setCardState(JSON.parse(r)); }
    catch { /* ignore */ }
  }, [storageKey]);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(cardState)); }
    catch { /* ignore */ }
  }, [cardState, storageKey]);

  function getState(id: string, idx: number) {
    return cardState[id] ?? { collapsed: false, hidden: false, position: idx };
  }
  function patch(id: string, idx: number, p: Partial<{ collapsed: boolean; hidden: boolean; position: number }>) {
    setCardState((prev) => ({ ...prev, [id]: { ...getState(id, idx), ...p } }));
  }

  // ── Drag-and-drop state ───────────────────────────────────────────────────
  // We maintain a local display order that overrides position during drag.
  const [order, setOrder] = useState<string[]>([]);        // userId order
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  // Build ordered visible members
  const allOrdered = [...teamMembers]
    .map((m, i) => ({ m, state: getState(m.id, i), orig: i }))
    .sort((a, b) => (a.state.position ?? a.orig) - (b.state.position ?? b.orig));
  const visibleAll = allOrdered.filter((x) => !x.state.hidden);
  const hiddenCount = allOrdered.length - visibleAll.length;

  // Sync order state when visible list changes (new member, restore, etc.)
  useEffect(() => {
    setOrder(visibleAll.map((x) => x.m.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleAll.map((x) => x.m.id).join(",")]);

  // Current display order (live-reordered during drag)
  const displayOrder = draggingId !== null && overIdx !== null
    ? (() => {
        const arr = [...order];
        const from = arr.indexOf(draggingId);
        if (from === -1) return arr;
        arr.splice(from, 1);
        arr.splice(overIdx, 0, draggingId);
        return arr;
      })()
    : order;

  const memberMap = new Map(allOrdered.map((x) => [x.m.id, x]));
  const visibleMembers = displayOrder
    .map((id) => memberMap.get(id))
    .filter(Boolean) as typeof visibleAll;

  // ── Drag handlers (HTML5 DnD — works on desktop; touch covered via onTouchX) ──
  const dragOverIdx = useRef<number | null>(null);

  function onDragStart(id: string) {
    setDraggingId(id);
    setOverIdx(order.indexOf(id));
  }

  function onDragEnter(idx: number) {
    dragOverIdx.current = idx;
    setOverIdx(idx);
  }

  function onDragEnd() {
    // Commit new order to cardState positions
    if (draggingId !== null && overIdx !== null) {
      const newOrder = [...order];
      const from = newOrder.indexOf(draggingId);
      if (from !== -1) {
        newOrder.splice(from, 1);
        newOrder.splice(overIdx, 0, draggingId);
      }
      setOrder(newOrder);
      setCardState((prev) => {
        const next = { ...prev };
        newOrder.forEach((id, pos) => {
          const orig = memberMap.get(id)?.orig ?? pos;
          next[id] = { ...getState(id, orig), position: pos };
        });
        return next;
      });
    }
    setDraggingId(null);
    setOverIdx(null);
  }

  // ── Touch drag ────────────────────────────────────────────────────────────
  const touchDragId = useRef<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback((id: string) => {
    touchDragId.current = id;
    setDraggingId(id);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchDragId.current || !gridRef.current) return;
    const touch = e.touches[0];
    const cards = gridRef.current.querySelectorAll<HTMLElement>("[data-card-idx]");
    let nearest: number | null = null;
    let nearestDist = Infinity;
    cards.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(touch.clientX - cx, touch.clientY - cy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = parseInt(el.dataset.cardIdx!, 10);
      }
    });
    if (nearest !== null) {
      dragOverIdx.current = nearest;
      setOverIdx(nearest);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    onDragEnd();
    touchDragId.current = null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId, overIdx, order]);

  // ── Misc card actions ─────────────────────────────────────────────────────
  function handleCollapse(id: string, orig: number) {
    patch(id, orig, { collapsed: !getState(id, orig).collapsed });
  }
  function handleHide(id: string, orig: number) {
    patch(id, orig, { hidden: true });
    setOrder((o) => o.filter((x) => x !== id));
  }
  function handleRestoreAll() {
    setCardState((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) next[k] = { ...next[k], hidden: false };
      return next;
    });
  }
  function handlePinToTop(id: string) {
    setOrder((o) => {
      const next = o.filter((x) => x !== id);
      next.unshift(id);
      setCardState((prev) => {
        const s = { ...prev };
        next.forEach((uid, pos) => {
          const orig = memberMap.get(uid)?.orig ?? pos;
          s[uid] = { ...getState(uid, orig), position: pos };
        });
        return s;
      });
      return next;
    });
  }

  // ── Task helpers ──────────────────────────────────────────────────────────
  function getOngoing(id: string) {
    return tasks.find((t) => t.user_id === id && t.status === "ongoing");
  }
  function getTodayVisits(id: string) {
    return tasks.filter((t) => t.user_id === id && t.task_category === "visit" && t.visit_date === todayStr);
  }
  function getStats(id: string) {
    const all = tasks.filter((t) => t.user_id === id && t.assigned_date === todayStr);
    return {
      total: all.length,
      completed: all.filter((t) => t.status === "completed").length,
      delayed: all.filter((t) => t.status === "delayed").length,
      ongoing: all.filter((t) => t.status === "ongoing").length,
    };
  }

  // ── Style tokens ──────────────────────────────────────────────────────────
  const cardBg    = isDark ? "bg-[#f3f5f8] border-[#454545]" : "bg-white border-slate-200";
  const headerBg  = isDark ? "bg-[#404040]/40" : "bg-slate-50/70";
  const sub       = isDark ? "text-slate-400" : "text-slate-500";
  const divider   = isDark ? "border-[#454545]/60" : "border-slate-100";
  const ctrlBtn   = `h-6 w-6 flex items-center justify-center rounded transition-colors ${
    isDark ? "text-slate-500 hover:bg-[#454545] hover:text-slate-200"
           : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
  }`;
  const sLabel    = `text-[10px] font-semibold uppercase tracking-widest ${sub}`;

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${isDark ? "bg-[#404040]/60" : "bg-slate-50"}`}>
        <div className="flex items-center gap-2.5">
          <TrendingUp size={15} className={isDark ? "text-indigo-400" : "text-indigo-600"} />
          <span className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
            Employee Live Monitor
          </span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${isDark ? "bg-[#454545] text-slate-300" : "bg-white border border-slate-200 text-slate-600"}`}>
            {visibleMembers.length}/{teamMembers.length}
          </span>
        </div>
        {hiddenCount > 0 && (
          <button
            onClick={handleRestoreAll}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              isDark ? "border-slate-600 text-slate-300 hover:bg-[#454545]"
                     : "border-slate-300 text-slate-600 hover:bg-white"
            }`}
          >
            <RotateCcw size={11} />
            Restore {hiddenCount}
          </button>
        )}
      </div>

      {/* Cards grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        onDragOver={(e) => e.preventDefault()}
      >
        {visibleMembers.map(({ m: member, state, orig }, idx) => {
          const ongoing       = getOngoing(member.id);
          const todayVisits   = getTodayVisits(member.id);
          const stats         = getStats(member.id);
          const displayVisits = todayVisits.slice(0, 4);
          const completedV    = todayVisits.filter((t) => t.visit_status === "completed").length;
          const progressPct   = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          const initials      = (member.full_name ?? member.email ?? "?").slice(0, 2).toUpperCase();

          const isDraggingThis = draggingId === member.id;
          const isDropTarget   = !isDraggingThis && overIdx === idx && draggingId !== null;

          return (
            <div
              key={member.id}
              data-card-idx={idx}
              draggable
              onDragStart={() => onDragStart(member.id)}
              onDragEnter={() => onDragEnter(idx)}
              onDragEnd={onDragEnd}
              onTouchStart={() => onTouchStart(member.id)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className={[
                "rounded-2xl border shadow-sm flex flex-col overflow-hidden",
                "transition-all duration-200 ease-out",
                isDraggingThis
                  ? "opacity-40 scale-[0.97] cursor-grabbing shadow-none"
                  : "cursor-grab active:cursor-grabbing",
                isDropTarget
                  ? isDark
                    ? "ring-2 ring-indigo-500 border-indigo-500 scale-[1.01]"
                    : "ring-2 ring-indigo-400 border-indigo-400 scale-[1.01]"
                  : "",
                cardBg,
              ].join(" ")}
            >
              {/* Card header */}
              <div className={`flex items-center justify-between gap-3 px-5 py-4 ${headerBg} select-none`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarColor(orig, isDark)}`}>
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                        {member.full_name}
                      </span>
                      <span
                        className={`h-2 w-2 rounded-full flex-shrink-0 ${member.is_active ? "bg-emerald-500" : "bg-slate-400"}`}
                        title={member.is_active ? "Active" : "Inactive"}
                      />
                    </div>
                    <p className={`text-xs truncate mt-0.5 ${sub}`}>{member.department ?? "No department"}</p>
                  </div>
                </div>

                {/* Controls — stop drag propagation so buttons still work */}
                <div
                  className="flex items-center gap-0.5 flex-shrink-0"
                  onPointerDown={(e) => e.stopPropagation()}
                  onDragStart={(e) => e.stopPropagation()}
                >
                  <button onClick={() => handleCollapse(member.id, orig)} className={ctrlBtn} title={state.collapsed ? "Expand" : "Collapse"}>
                    {state.collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                  </button>
                  <button onClick={() => handlePinToTop(member.id)} className={ctrlBtn} title="Pin to top">
                    <MapPin size={13} />
                  </button>
                  <button onClick={() => handleHide(member.id, orig)} className={ctrlBtn} title="Hide card">
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Body */}
              {!state.collapsed && (
                <div className="flex flex-col flex-1">
                  {/* Progress */}
                  {stats.total > 0 && (
                    <div className="px-5 pt-3 pb-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={sLabel}>Today's Progress</span>
                        <span className={`text-[11px] font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          {stats.completed}/{stats.total}
                        </span>
                      </div>
                      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-[#454545]" : "bg-slate-100"}`}>
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Stat pills */}
                  <div className={`flex flex-wrap items-center gap-2 px-5 py-3 border-t ${divider}`}>
                    <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${isDark ? "bg-[#404040] text-slate-300" : "bg-slate-100 text-slate-700"}`}>
                      <Clock3 size={11} className={sub} />{stats.total} tasks
                    </span>
                    <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${isDark ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                      <CheckCircle2 size={11} />{stats.completed} done
                    </span>
                    {stats.ongoing > 0 && (
                      <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${isDark ? "bg-[#f3f5f8]/40 text-indigo-300" : "bg-indigo-50 text-indigo-700"}`}>
                        <Briefcase size={11} />{stats.ongoing} active
                      </span>
                    )}
                    {stats.delayed > 0 && (
                      <span className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${isDark ? "bg-rose-900/40 text-rose-300" : "bg-rose-50 text-rose-700"}`}>
                        <AlertTriangle size={11} />{stats.delayed} late
                      </span>
                    )}
                  </div>

                  {/* Ongoing task */}
                  <div className={`px-5 py-3 border-t ${divider}`}>
                    <p className={`${sLabel} mb-2`}>Current Task</p>
                    {ongoing ? (
                      <button
                        onClick={() => onOpenTask(ongoing.id)}
                        className={`w-full text-left rounded-xl border px-3 py-2.5 transition-colors ${
                          isDark ? "border-[#454545] bg-[#404040] hover:bg-[#454545]"
                                 : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className={`text-xs font-medium leading-snug ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                              {ongoing.task_title}
                            </span>
                          </div>
                          <span className={`text-[10px] flex-shrink-0 ${sub}`}>
                            {timeSince(ongoing.started_at ?? ongoing.created_at)}
                          </span>
                        </div>
                        {ongoing.task_description && (
                          <p className={`mt-1 text-[11px] line-clamp-1 ${sub}`}>{ongoing.task_description}</p>
                        )}
                      </button>
                    ) : (
                      <p className={`text-xs italic ${sub}`}>No active task right now</p>
                    )}
                  </div>

                  {/* Visit tasks */}
                  {displayVisits.length > 0 && (
                    <div className={`px-5 py-3 border-t ${divider}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={sLabel}>Today's Visits</p>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isDark ? "bg-[#f3f5f8]/40 text-indigo-300" : "bg-indigo-50 text-indigo-700"}`}>
                          {completedV}/{todayVisits.length} done
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {displayVisits.map((task) => (
                          <li key={task.id} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 ${isDark ? "bg-[#404040]" : "bg-slate-50"}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <Building2 size={12} className={`flex-shrink-0 ${sub}`} />
                              <button
                                onClick={() => onOpenTask(task.id)}
                                className={`text-xs font-medium hover:underline truncate text-left ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
                              >
                                {task.institution_name ?? "Unknown Institution"}
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {task.visit_status && (
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${vsColor(task.visit_status, isDark)}`}>
                                  {visitStatusLabel[task.visit_status] ?? task.visit_status}
                                </span>
                              )}
                              {formatVisitTime(task) && (
                                <span className={`text-[10px] ${sub}`}>{formatVisitTime(task)}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                      {todayVisits.length > 4 && (
                        <p className={`mt-1.5 text-[10px] ${sub}`}>+{todayVisits.length - 4} more visits</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Collapsed summary */}
              {state.collapsed && (
                <div className={`flex items-center gap-4 px-5 py-3 border-t ${divider}`}>
                  <span className={`text-[11px] ${sub}`}>{stats.total} tasks · {stats.completed} done</span>
                  {ongoing && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                      ▶ {ongoing.task_title}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
