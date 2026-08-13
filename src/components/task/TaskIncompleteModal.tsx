/**
 * TaskIncompleteModal
 *
 * Appears when a task is overdue or the user marks a task as incomplete.
 * Options:
 *  1. Reason for non-completion (dropdown + free-text)
 *  2. Reschedule — pick a new due date
 *  3. Reassign — transfer to another team member
 *  4. Escalate — flag to admin
 *  5. Cancel / Archive task
 */
import { useState } from "react";
import {
  X, AlertTriangle, CalendarClock, UserCheck, ArrowUpCircle,
  Trash2, Save, ChevronDown,
} from "lucide-react";
import type { OfficeTask, OfficeUser } from "@/types/taskManager";

// ─── types ───────────────────────────────────────────────────────────────────

export type IncompleteAction =
  | "reschedule"
  | "reassign"
  | "escalate"
  | "cancel"
  | "save_reason";

export interface IncompletePayload {
  action: IncompleteAction;
  reason: string;
  reasonDetail: string;
  newDueDate?: string | null;
  reassignToUserId?: string | null;
  reassignToUserName?: string | null;
}

interface TaskIncompleteModalProps {
  task: OfficeTask;
  teamMembers: OfficeUser[];
  uiTheme: "dark" | "light";
  currentUserId: string;
  onSubmit: (payload: IncompletePayload) => Promise<void> | void;
  onClose: () => void;
}

// ─── constants ────────────────────────────────────────────────────────────────

const DELAY_REASONS = [
  { value: "customer_unavailable",  label: "Customer / contact was unavailable" },
  { value: "awaiting_information",  label: "Waiting for information / documents" },
  { value: "personal_emergency",    label: "Personal emergency / leave" },
  { value: "field_issue",           label: "Field / travel issue" },
  { value: "task_too_complex",      label: "Task too large — needs more time" },
  { value: "dependency_blocked",    label: "Blocked by another task or team" },
  { value: "low_priority_shift",    label: "Reprioritised — higher-urgency task took over" },
  { value: "tech_issue",            label: "Technical / system issue" },
  { value: "other",                 label: "Other (describe below)" },
];

// ─── component ────────────────────────────────────────────────────────────────

export default function TaskIncompleteModal({
  task,
  teamMembers,
  uiTheme,
  currentUserId,
  onSubmit,
  onClose,
}: TaskIncompleteModalProps) {
  const dark = uiTheme === "dark";

  const [reason, setReason]           = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [action, setAction]           = useState<IncompleteAction>("reschedule");
  const [newDueDate, setNewDueDate]   = useState(() => {
    // default new date = tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [reassignTo, setReassignTo]   = useState("");
  const [busy, setBusy]               = useState(false);

  const otherMembers = teamMembers.filter((m) => m.id !== currentUserId && m.is_active);
  const reassignUser = otherMembers.find((m) => m.id === reassignTo);

  const canSubmit = reason !== "" && (
    action !== "reassign" || reassignTo !== ""
  );

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      await onSubmit({
        action,
        reason,
        reasonDetail,
        newDueDate: action === "reschedule" ? newDueDate : null,
        reassignToUserId: action === "reassign" ? reassignTo : null,
        reassignToUserName: action === "reassign" ? (reassignUser?.full_name ?? reassignUser?.email ?? null) : null,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  // ─── styles ────────────────────────────────────────────────────────────────
  const overlay = "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4";
  const card    = `w-full max-w-lg rounded-2xl border shadow-2xl ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`;
  const label   = `block text-xs font-semibold mb-1 ${dark ? "text-slate-400" : "text-slate-600"}`;
  const input   = `w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
    dark ? "bg-[#404040] border-[#454545] text-slate-100 placeholder-slate-500" : "bg-white border-slate-300 text-slate-900 placeholder-slate-400"
  }`;
  const select  = `w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
    dark ? "bg-[#404040] border-[#454545] text-slate-100" : "bg-white border-slate-300 text-slate-900"
  }`;
  const divider = `border-t my-4 ${dark ? "border-[#404040]" : "border-slate-100"}`;

  const actionBtnCls = (a: IncompleteAction) =>
    `flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
      action === a
        ? dark
          ? "border-indigo-500 bg-[#f3f5f8]/30 text-indigo-300"
          : "border-indigo-500 bg-indigo-50 text-indigo-700"
        : dark
          ? "border-[#454545] bg-[#404040] text-slate-300 hover:border-slate-600"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
    }`;

  return (
    <div className={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={card}>
        {/* Header */}
        <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${dark ? "border-[#404040]" : "border-slate-100"}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-bold truncate ${dark ? "text-slate-100" : "text-slate-900"}`}>
                Task Not Completed
              </p>
              <p className={`text-xs truncate ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {task.task_title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`flex-shrink-0 rounded-full p-1.5 transition-colors ${dark ? "hover:bg-[#404040]" : "hover:bg-slate-100"}`}>
            <X className={`h-4 w-4 ${dark ? "text-slate-400" : "text-slate-500"}`} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Step 1 — Reason */}
          <div>
            <label className={label}>Why wasn't this completed? *</label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={select}
              >
                <option value="">— Select a reason —</option>
                {DELAY_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <ChevronDown className={`pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 ${dark ? "text-slate-500" : "text-slate-400"}`} />
            </div>
            {(reason === "other" || reasonDetail || reason) && (
              <textarea
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
                placeholder="Additional details (optional)..."
                rows={2}
                className={`${input} mt-2 resize-none`}
              />
            )}
          </div>

          <div className={divider} />

          {/* Step 2 — What to do next */}
          <div>
            <label className={label}>What should happen next? *</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button type="button" onClick={() => setAction("reschedule")} className={actionBtnCls("reschedule")}>
                <CalendarClock className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">Reschedule</span>
              </button>
              <button type="button" onClick={() => setAction("reassign")} className={actionBtnCls("reassign")}>
                <UserCheck className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">Reassign</span>
              </button>
              <button type="button" onClick={() => setAction("escalate")} className={actionBtnCls("escalate")}>
                <ArrowUpCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">Escalate</span>
              </button>
              <button type="button" onClick={() => setAction("cancel")} className={actionBtnCls("cancel")}>
                <Trash2 className="h-4 w-4 flex-shrink-0 text-rose-400" />
                <span className="text-xs">Cancel</span>
              </button>
            </div>
          </div>

          {/* Action-specific options */}
          {action === "reschedule" && (
            <div>
              <label className={label}>New due date *</label>
              <input
                type="date"
                value={newDueDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setNewDueDate(e.target.value)}
                className={input}
              />
            </div>
          )}

          {action === "reassign" && (
            <div>
              <label className={label}>Transfer to *</label>
              {otherMembers.length === 0 ? (
                <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>No other active team members found.</p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {otherMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setReassignTo(m.id)}
                      className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-all ${
                        reassignTo === m.id
                          ? dark ? "border-indigo-500 bg-[#f3f5f8]/20 text-indigo-300" : "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : dark ? "border-[#454545] bg-[#404040] text-slate-300 hover:border-slate-600" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">
                          {(m.full_name || m.email).slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{m.full_name}</p>
                        <p className={`truncate text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{m.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {action === "escalate" && (
            <div className={`rounded-xl border p-3 text-xs ${dark ? "border-amber-800/40 bg-amber-900/10 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              <p className="font-semibold">This will flag the task to the admin with your reason and mark it as escalated.</p>
              <p className="mt-1 opacity-70">Admin will be notified and can reassign or close the task.</p>
            </div>
          )}

          {action === "cancel" && (
            <div className={`rounded-xl border p-3 text-xs ${dark ? "border-rose-800/40 bg-rose-900/10 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-800"}`}>
              <p className="font-semibold">This will archive the task. It will no longer appear in active tasks.</p>
              <p className="mt-1 opacity-70">All history and notes are preserved for records.</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-2 border-t px-5 py-3 ${dark ? "border-[#404040]" : "border-slate-100"}`}>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${dark ? "border-[#454545] text-slate-300 hover:bg-[#404040]" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || busy}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {busy ? "Saving…" : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
