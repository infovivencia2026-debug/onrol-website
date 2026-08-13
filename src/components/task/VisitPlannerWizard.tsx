/**
 * VisitPlannerWizard
 * Step-by-step visit creation: Institution -> Schedule -> Review
 */
import React, { useState } from "react";
import {
  Search, MapPin, ChevronRight, ChevronLeft,
  CheckCircle2, Building2, Calendar, Star,
  Plus, X, Clock,
} from "lucide-react";
import type {
  TaskDraft, Institution, InstitutionType,
  VisitBrand, Priority, OfficeTask, InstitutionDraft,
} from "@/types/taskManager";
import { brandFieldConfig } from "@/utils/taskManager";

export interface VisitPlannerWizardProps {
  taskDraft: TaskDraft;
  setTaskDraft: React.Dispatch<React.SetStateAction<TaskDraft>>;
  institutions: Institution[];
  institutionsLoading?: boolean;
  institutionsLoadError?: string | null;
  reloadInstitutions?: () => Promise<void>;
  getInstitutionSuggestions: (q: string) => Institution[];
  fetchInstitutionSuggestions?: (q: string) => Promise<Institution[]>;
  selectedDraftInstitution: Institution | null;
  institutionSearchByTask: Record<string, string | undefined>;
  setInstitutionSearchByTask: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  checkInstitutionConflict?: (key: string, id: string, name: string, taskId: string | null) => Promise<{ fullName: string; visitStatus?: string } | null>;
  institutionConflictByTask: Record<string, { fullName: string; visitStatus?: string } | null>;
  showCreateInstitutionForTask: string | null;
  setShowCreateInstitutionForTask: (v: string | null) => void;
  institutionCreateDraftByTask: Record<string, InstitutionDraft | undefined>;
  setInstitutionCreateDraftByTask: React.Dispatch<React.SetStateAction<Record<string, InstitutionDraft | undefined>>>;
  createInstitutionForDraft: () => Promise<void>;
  ensureInstitutionDraft: (d: InstitutionDraft | undefined) => InstitutionDraft;
  getInstitutionVisitHistory: (id: string, name: string) => OfficeTask[];
  editingTaskId: string | null;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; color: string; dot: string }[] = [
  { value: "high",   label: "High",   color: "border-red-200 bg-red-50 text-red-700",    dot: "bg-red-500" },
  { value: "medium", label: "Medium", color: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  { value: "low",    label: "Low",    color: "border-slate-200 bg-slate-50 text-slate-600", dot: "bg-slate-400" },
];

function formatLabel(val: string) {
  return val.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

const STEPS = ["Institution", "Schedule", "Review"] as const;

export const VisitPlannerWizard: React.FC<VisitPlannerWizardProps> = ({
  taskDraft, setTaskDraft,
  institutions, institutionsLoading = false, institutionsLoadError, reloadInstitutions, getInstitutionSuggestions, fetchInstitutionSuggestions, selectedDraftInstitution,
  institutionSearchByTask, setInstitutionSearchByTask,
  checkInstitutionConflict, institutionConflictByTask,
  showCreateInstitutionForTask, setShowCreateInstitutionForTask,
  institutionCreateDraftByTask, setInstitutionCreateDraftByTask,
  createInstitutionForDraft, ensureInstitutionDraft,
  getInstitutionVisitHistory,
  editingTaskId, onSave, onCancel, isSaving,
}) => {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const searchVal = institutionSearchByTask["__draft__"] ?? taskDraft.institutionName ?? "";
  const suggestions = getInstitutionSuggestions(searchVal);
  const conflict = institutionConflictByTask["__draft__"];
  const showNew = showCreateInstitutionForTask === "__draft__";
  const bConfig = brandFieldConfig[taskDraft.visitBrand] ?? brandFieldConfig["Vivencia"];

  // validation per step
  const step0Valid = !!taskDraft.institutionId || !!taskDraft.institutionName.trim();
  const step1Valid = !!taskDraft.visitDate;

  const updateSearch = (val: string) => {
    setInstitutionSearchByTask(p => ({ ...p, "__draft__": val }));
    setTaskDraft(p => ({ ...p, institutionName: val, institutionId: "" }));
    if (val.trim().length >= 2 && !getInstitutionSuggestions(val).length) {
      void fetchInstitutionSuggestions?.(val);
      void reloadInstitutions?.();
    }
  };

  const selectInstitution = async (inst: Institution) => {
    setTaskDraft(p => ({
      ...p,
      institutionId: inst.id,
      institutionName: inst.name,
      institutionType: inst.institution_type,
    }));
    setInstitutionSearchByTask(p => ({ ...p, "__draft__": inst.name }));
    await checkInstitutionConflict?.("__draft__", inst.id, inst.name, null);
  };

  const clearInstitution = () => {
    setTaskDraft(p => ({ ...p, institutionId: "", institutionName: "" }));
    setInstitutionSearchByTask(p => ({ ...p, "__draft__": "" }));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {editingTaskId ? "Edit Visit" : "Create Visit"}
          </p>
          <h3 className="mt-0.5 text-base font-bold text-slate-900">
            {step === 0 ? "Select Institution" : step === 1 ? "Set Schedule" : "Review and Create"}
          </h3>
        </div>
        <button onClick={onCancel} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200">
          <X size={14} />
        </button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 border-b border-slate-100">
        {STEPS.map((label, i) => (
          <button
            key={label}
            onClick={() => {
              if (i <= step || (i === 1 && step0Valid) || (i === 2 && step0Valid && step1Valid)) {
                setStep(i as 0 | 1 | 2);
              }
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              step === i
                ? "border-[#f3f5f8] text-[#f3f5f8]"
                : i < step
                ? "border-emerald-400 text-emerald-600"
                : "border-transparent text-slate-400"
            }`}
          >
            {i < step
              ? <CheckCircle2 size={13} className="text-emerald-500" />
              : <span className={`h-4 w-4 rounded-full text-[10px] flex items-center justify-center font-bold ${step === i ? "bg-[#f3f5f8] text-white" : "bg-slate-200 text-slate-500"}`}>{i + 1}</span>
            }
            {label}
          </button>
        ))}
      </div>

      <div className="px-5 py-5">
        {/* Step 1: Institution */}
        {step === 0 && (
          <div className="space-y-4">
            {/* Brand + Institution type */}
            <div className="flex flex-wrap gap-3">
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Brand</p>
                <div className="flex gap-1.5">
                  {(["Vivencia", "ONROL"] as VisitBrand[]).map(b => (
                    <button key={b} onClick={() => setTaskDraft(p => ({ ...p, visitBrand: b, brandDetails: {} }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                        taskDraft.visitBrand === b ? "border-[#f3f5f8] bg-[#f3f5f8] text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}>{b}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Type</p>
                <div className="flex gap-1.5">
                  {(["School", "College"] as InstitutionType[]).map(t => (
                    <button key={t} onClick={() => setTaskDraft(p => ({ ...p, institutionType: t }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${
                        taskDraft.institutionType === t ? "border-[#f3f5f8] bg-[#f3f5f8] text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}>{t}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Institution search */}
            {taskDraft.institutionId ? (
              /* Selected institution card */
              <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <Building2 size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{selectedDraftInstitution?.name ?? taskDraft.institutionName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {selectedDraftInstitution?.institution_type} · {selectedDraftInstitution?.city ?? "-"}
                        {selectedDraftInstitution?.area ? ` · ${selectedDraftInstitution.area}` : ""}
                      </p>
                      {selectedDraftInstitution?.primary_contact_name && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          Contact: {selectedDraftInstitution.primary_contact_name}
                          {selectedDraftInstitution.primary_contact_phone ? ` · ${selectedDraftInstitution.primary_contact_phone}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <button onClick={clearInstitution} className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-400 hover:text-red-500">
                    <X size={12} />
                  </button>
                </div>
                {/* Visit history */}
                {selectedDraftInstitution && (() => {
                  const history = getInstitutionVisitHistory(selectedDraftInstitution.id, selectedDraftInstitution.name).slice(0, 2);
                  if (!history.length) return null;
                  return (
                    <div className="mt-2.5 border-t border-emerald-200 pt-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 mb-1">Recent Visits</p>
                      {history.map(v => (
                        <p key={v.id} className="text-[11px] text-slate-600">
                          {v.visit_date || v.assigned_date} · {v.visit_brand} · {v.visit_status?.replace(/_/g, " ")}
                        </p>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Search input */
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Search Institution
                  {institutionsLoading && <span className="ml-1 text-amber-500">(syncing...)</span>}
                </p>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    autoFocus
                    placeholder="Search by school name, city, area, or contact"
                    value={searchVal}
                    onChange={e => updateSearch(e.target.value)}
                    onFocus={() => {
                      if (!getInstitutionSuggestions(searchVal).length) {
                        void fetchInstitutionSuggestions?.(searchVal);
                        void reloadInstitutions?.();
                      }
                    }}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f3f5f8]/30 focus:border-[#f3f5f8]"
                  />
                </div>
                {institutionsLoadError ? (
                  <p className="mt-1 text-[11px] text-amber-700">Supabase sync issue: {institutionsLoadError}</p>
                ) : null}

                {/* Results dropdown */}
                {searchVal.length >= 2 && (
                  <div className="mt-1.5 max-h-52 space-y-1 overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    {suggestions.length > 0 ? suggestions.map(inst => (
                      <button key={inst.id} type="button" onClick={() => void selectInstitution(inst)}
                        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 transition-colors">
                        <div className="h-8 w-8 flex-shrink-0 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Building2 size={14} className="text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{inst.name}</p>
                          <p className="text-[11px] text-slate-500">{inst.institution_type} · {inst.city ?? "-"}{inst.area ? ` · ${inst.area}` : ""}</p>
                        </div>
                      </button>
                    )) : (
                      <p className="px-3 py-2 text-xs text-slate-500 text-center">No institutions found. Add a new institution below.</p>
                    )}
                  </div>
                )}
                {searchVal.length > 0 && searchVal.length < 2 && (
                  <p className="mt-1 text-[11px] text-slate-400">Type at least 2 characters.</p>
                )}

                {/* Conflict warning */}
                {conflict && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <span className="text-amber-500 text-sm">⚠️</span>
                    <p className="text-[11px] text-amber-800">
                      <strong>{conflict.fullName}</strong> is already working with this institution
                      {conflict.visitStatus ? ` (${conflict.visitStatus.replace(/_/g, " ")})` : ""}.
                    </p>
                  </div>
                )}

                {/* Add new institution — bigger, theme-safe block button so employees on dark-mode
                    devices actually see it. The old link style (dark navy text) was invisible
                    against dark webview themes. */}
                <button
                  type="button"
                  onClick={() => setShowCreateInstitutionForTask(showNew ? null : "__draft__")}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-3 text-sm font-semibold transition-colors ${
                    showNew
                      ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                      : "border-indigo-300 bg-indigo-50 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-100"
                  }`}
                >
                  <Plus size={16} /> {showNew ? "Cancel adding new" : "Can't find it? Add new institution"}
                </button>

                {showNew && (
                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">New Institution</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        placeholder="Institution name *"
                        value={institutionCreateDraftByTask["__draft__"]?.name ?? ""}
                        onChange={e => setInstitutionCreateDraftByTask(p => ({
                          ...p, "__draft__": { ...ensureInstitutionDraft(p["__draft__"]), name: e.target.value }
                        }))}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f3f5f8]"
                      />
                      <select
                        value={institutionCreateDraftByTask["__draft__"]?.institutionType ?? "School"}
                        onChange={e => setInstitutionCreateDraftByTask(p => ({
                          ...p, "__draft__": { ...ensureInstitutionDraft(p["__draft__"]), institutionType: e.target.value as InstitutionType }
                        }))}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-900"
                      >
                        <option>School</option>
                        <option>College</option>
                      </select>
                      <input
                        placeholder="City *"
                        value={institutionCreateDraftByTask["__draft__"]?.city ?? ""}
                        onChange={e => setInstitutionCreateDraftByTask(p => ({
                          ...p, "__draft__": { ...ensureInstitutionDraft(p["__draft__"]), city: e.target.value }
                        }))}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f3f5f8]"
                      />
                      <input
                        placeholder="Contact name"
                        value={institutionCreateDraftByTask["__draft__"]?.contactName ?? ""}
                        onChange={e => setInstitutionCreateDraftByTask(p => ({
                          ...p, "__draft__": { ...ensureInstitutionDraft(p["__draft__"]), contactName: e.target.value }
                        }))}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f3f5f8]"
                      />
                      <input
                        placeholder="Contact phone"
                        value={institutionCreateDraftByTask["__draft__"]?.contactPhone ?? ""}
                        onChange={e => setInstitutionCreateDraftByTask(p => ({
                          ...p, "__draft__": { ...ensureInstitutionDraft(p["__draft__"]), contactPhone: e.target.value }
                        }))}
                        className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#f3f5f8]"
                      />
                      <button
                        type="button"
                        onClick={() => void createInstitutionForDraft()}
                        className="h-9 rounded-lg bg-[#f3f5f8] px-3 text-xs font-semibold text-white hover:opacity-90"
                      >
                        Create and Select
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setStep(1)}
              disabled={!step0Valid}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f3f5f8] py-3 text-sm font-semibold text-white disabled:opacity-40 transition-opacity"
            >
              Continue to Schedule <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Step 2: Schedule (date and time) */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Visit date */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                <Calendar size={11} /> Visit Date *
              </p>
              <input
                type="date"
                value={taskDraft.visitDate}
                onChange={e => setTaskDraft(p => ({ ...p, visitDate: e.target.value, assignedDate: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#f3f5f8]/30 focus:border-[#f3f5f8]"
              />
            </div>

            {/* Visit time (optional) */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                <Clock size={11} /> Preferred Time <span className="font-normal normal-case tracking-normal text-slate-300">(optional)</span>
              </p>
              <input
                type="time"
                value={(taskDraft as Record<string, string>).visitTime ?? ""}
                onChange={e => setTaskDraft(p => ({ ...p, visitTime: e.target.value } as typeof p))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#f3f5f8]/30"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep(0)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <ChevronLeft size={14} /> Back
              </button>
              <button onClick={() => setStep(2)} disabled={!step1Valid}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f3f5f8] py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                Continue to Review <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review (priority, visit type, notes, and summary) */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Priority */}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex items-center gap-1">
                <Star size={11} /> Priority
              </p>
              <div className="grid grid-cols-3 gap-2">
                {PRIORITY_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setTaskDraft(p => ({ ...p, priority: opt.value }))}
                    className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-all flex flex-col items-center gap-1 ${
                      taskDraft.priority === opt.value ? opt.color + " border-current ring-2 ring-offset-1 ring-current" : "border-slate-200 text-slate-400 hover:border-slate-300"
                    }`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${taskDraft.priority === opt.value ? opt.dot : "bg-slate-300"}`} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Planned / Unplanned */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Visit Type</p>
              <div className="flex gap-2">
                {(["planned", "unplanned"] as const).map(t => (
                  <button key={t} onClick={() => setTaskDraft(p => ({ ...p, taskType: t }))}
                    className={`flex-1 rounded-xl border py-2 text-sm font-medium transition-colors ${
                      taskDraft.taskType === t ? "border-[#f3f5f8] bg-[#f3f5f8] text-white" : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}>{t === "planned" ? "Planned" : "Unplanned / Drop-in"}</button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Notes / Goal for Visit <span className="font-normal normal-case tracking-normal text-slate-300">(optional)</span></p>
              <textarea
                rows={2}
                placeholder={`e.g. Meet the principal to introduce ${bConfig.title.split(" ")[0]} programs`}
                value={taskDraft.remarks ?? ""}
                onChange={e => setTaskDraft(p => ({ ...p, remarks: e.target.value }))}
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f3f5f8]/30"
              />
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Summary</p>
              <ReviewRow icon={<Building2 size={13} />} label="Institution">
                <span className="font-semibold">{taskDraft.institutionName || "-"}</span>
                <span className="ml-1.5 text-slate-400 text-xs">{taskDraft.institutionType}</span>
              </ReviewRow>
              <ReviewRow icon={<span className="text-sm">🏷ï¸</span>} label="Brand">
                <span className="font-medium">{taskDraft.visitBrand}</span>
              </ReviewRow>
              <ReviewRow icon={<Calendar size={13} />} label="Date">
                <span className="font-medium">{taskDraft.visitDate ? new Date(taskDraft.visitDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "-"}</span>
              </ReviewRow>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Interest fields are collected <strong>after</strong> the visit is completed.
            </p>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <ChevronLeft size={14} /> Back
              </button>
              <button onClick={onSave} disabled={isSaving || !step0Valid || !step1Valid}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f3f5f8] py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                {isSaving ? "Saving..." : editingTaskId ? "Save Changes" : "Create Visit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function ReviewRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex-shrink-0 text-slate-400">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <div className="mt-0.5 text-sm">{children}</div>
      </div>
    </div>
  );
}

export default VisitPlannerWizard;

