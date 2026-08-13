import React, { useEffect, useState } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader2,
  MapPin,
  Mic,
  MessageSquare,
  Phone,
  PlayCircle,
  Send,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import type {
  BrandDetails,
  FollowUpType,
  Institution,
  InstitutionConflictSignal,
  InstitutionDraft,
  InterestLevel,
  OfficeTask,
  VisitOutcome,
  VisitSectionState,
} from "@/types/taskManager";
import {
  brandFieldConfig,
  followUpTypeLabels,
  visitOutcomeLabels,
} from "@/utils/taskManager";

/* ------------------------------------------------------------------ */
/*  Props — kept backward-compatible with existing TaskManager wiring */
/* ------------------------------------------------------------------ */

export interface VisitPanelProps {
  task: OfficeTask;
  linkedInstitution: Institution | null;
  institutionHistory: OfficeTask[];
  brandDetails: BrandDetails;
  brandConfig: (typeof brandFieldConfig)[keyof typeof brandFieldConfig] | null;

  institutionSearchByTask: Record<string, string>;
  setInstitutionSearchByTask: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  getInstitutionSuggestions: (searchTerm: string) => Institution[];
  fetchInstitutionSuggestions?: (searchTerm: string) => Promise<Institution[]>;
  expandedInstitutionSuggestionByTask: Record<string, string | null>;
  setExpandedInstitutionSuggestionByTask: React.Dispatch<React.SetStateAction<Record<string, string | null>>>;
  applyInstitutionToTask: (task: OfficeTask, institution: Institution) => Promise<void>;
  institutionConflictByTask: Record<string, InstitutionConflictSignal | null>;
  reloadInstitutions?: () => Promise<void>;

  showCreateInstitutionForTask: string | null;
  setShowCreateInstitutionForTask: React.Dispatch<React.SetStateAction<string | null>>;
  institutionCreateDraftByTask: Record<string, InstitutionDraft>;
  setInstitutionCreateDraftByTask: React.Dispatch<React.SetStateAction<Record<string, InstitutionDraft>>>;
  creatingInstitutionForTask: string | null;
  createInstitutionForTask: (task: OfficeTask) => Promise<void>;

  toggleVisitOutcome: (task: OfficeTask, outcome: VisitOutcome) => Promise<void>;
  applyFollowupAction: (
    task: OfficeTask,
    action: "call" | "whatsapp" | "visit_again" | "demo" | "send_proposal" | "no_followup",
  ) => Promise<void>;
  saveFollowUpDate: (taskId: string, date: string, preferredFollowUpType?: FollowUpType | null) => Promise<void>;

  quickNoteDraftByTask: Record<string, string>;
  setQuickNoteDraftByTask: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  saveQuickNote: (taskId: string, value: string) => Promise<void>;
  startVoiceQuickNote: (task: OfficeTask) => void;
  voiceTaskId: string | null;

  toggleBrandMultiValue: (task: OfficeTask, field: keyof BrandDetails, value: string, max?: number) => Promise<void>;
  setBrandSingleValue: (task: OfficeTask, field: keyof BrandDetails, value: string) => Promise<void>;
  onVisitAction: (
    taskId: string,
    action: "started" | "check_in" | "meeting_started" | "meeting_completed" | "check_out",
  ) => Promise<void>;
  onFetchLocation: (task: OfficeTask) => Promise<void>;

  visitSectionStateByTask: Record<string, VisitSectionState>;
  setVisitSectionStateByTask: React.Dispatch<React.SetStateAction<Record<string, VisitSectionState>>>;

  /** Optional: generic DSR field saver (purpose, feedback, decision_maker_*, etc.) */
  saveDsrFields?: (taskId: string, patch: Partial<OfficeTask>) => Promise<void>;
  /** Gate the Admin Review card (manager comments + status) to admins only */
  isAdmin?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Wizard definition                                                 */
/* ------------------------------------------------------------------ */

type StepId = "start" | "arrived" | "meeting" | "note" | "result" | "review";

const STEPS: { id: StepId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "start", label: "Start", icon: PlayCircle },
  { id: "arrived", label: "Arrived", icon: MapPin },
  { id: "meeting", label: "Meeting", icon: Users },
  { id: "note", label: "Note", icon: MessageSquare },
  { id: "result", label: "Follow-up", icon: CalendarClock },
  { id: "review", label: "Review", icon: CheckCircle2 },
];

const PURPOSE_OPTIONS = [
  "Introduction / Cold Visit",
  "Product Demo",
  "Proposal Discussion",
  "Follow-up Meeting",
  "Negotiation / Closure",
  "Relationship Check-in",
  "Issue Resolution",
];

const PRODUCT_OPTIONS = [
  "Financial Literacy",
  "Young Entrepreneurship",
  "AI & Robotics",
];

const FEEDBACK_PRESETS = [
  "Very Interested",
  "Interested — wants proposal",
  "Needs demo for management",
  "Will discuss internally",
  "Budget concern",
  "Not the right time",
  "Already using competitor",
  "Not interested",
];

const NEXT_ACTIONS: {
  id: Parameters<VisitPanelProps["applyFollowupAction"]>[1];
  label: string;
  type: FollowUpType | null;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "call", label: "Call", type: "call", icon: Phone },
  { id: "whatsapp", label: "WhatsApp", type: "whatsapp", icon: MessageSquare },
  { id: "visit_again", label: "Visit Again", type: "visit", icon: MapPin },
  { id: "demo", label: "Demo", type: "demo", icon: PlayCircle },
  { id: "send_proposal", label: "Proposal", type: "proposal", icon: Send },
  { id: "no_followup", label: "No Follow-up", type: null, icon: XCircle },
];

const DSR_STATUS_OPTIONS: { value: "open" | "closed" | "on_hold"; label: string; tone: string }[] = [
  { value: "open", label: "Open", tone: "border-amber-300 bg-amber-50 text-amber-900" },
  { value: "closed", label: "Closed", tone: "border-emerald-300 bg-emerald-50 text-emerald-900" },
  { value: "on_hold", label: "On Hold", tone: "border-slate-300 bg-slate-50 text-slate-800" },
];

/* ------------------------------------------------------------------ */
/*  Tiny UI primitives                                                */
/* ------------------------------------------------------------------ */

const chip = (selected: boolean) =>
  `rounded-full border px-2.5 py-1 text-[11px] sm:text-xs font-medium transition-colors ${
    selected
      ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
      : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300"
  }`;

// Larger tap-target chip used in the Meeting step where users are filling out details quickly.
const bigChip = (selected: boolean) =>
  `rounded-xl border-2 px-3.5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
    selected
      ? "border-indigo-600 bg-indigo-600 text-white shadow-md"
      : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40"
  }`;

const sectionBadge = (n: number) =>
  `inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700`;

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

const labelCls = "text-[11px] font-semibold uppercase tracking-wide text-slate-600";

const cardCls = "rounded-lg border border-slate-200 bg-white p-3 sm:p-4 shadow-sm";

const sectionTitleCls = "flex items-center gap-2 text-sm font-semibold text-slate-800";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function deriveInitialStep(task: OfficeTask): StepId {
  if (task.visit_status === "completed" || task.visit_status === "closed_lost") return "review";
  if (task.meeting_completed_at || task.check_out_at) return "review";
  if (task.follow_up_date || task.follow_up_type) return "result";
  if (task.quick_note && (task.visit_outcome?.length ?? 0) === 0) return "note";
  if (task.meeting_started_at) return "meeting";
  if (task.check_in_at) return "arrived";
  return "start";
}

function stepIndex(id: StepId) {
  return STEPS.findIndex((s) => s.id === id);
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

const VisitPanel: React.FC<VisitPanelProps> = (props) => {
  const {
    task,
    linkedInstitution,
    institutionHistory,
    brandDetails,
    brandConfig,
    toggleVisitOutcome,
    applyFollowupAction,
    saveFollowUpDate,
    quickNoteDraftByTask,
    setQuickNoteDraftByTask,
    saveQuickNote,
    startVoiceQuickNote,
    voiceTaskId,
    toggleBrandMultiValue,
    setBrandSingleValue,
    onVisitAction,
    onFetchLocation,
    saveDsrFields,
    isAdmin = false,
  } = props;

  const [step, setStep] = useState<StepId>(() => deriveInitialStep(task));
  const [showHistory, setShowHistory] = useState(false);
  const [savingDsr, setSavingDsr] = useState(false);
  const [startingJourney, setStartingJourney] = useState(false);
  const [startingMeeting, setStartingMeeting] = useState(false);
  const [closingVisit, setClosingVisit] = useState(false);
  const [submittedLocally, setSubmittedLocally] = useState(false);

  // Local drafts for DSR fields, synced to task on blur / Save
  const [purpose, setPurpose] = useState(task.purpose_of_visit ?? "");
  const [products, setProducts] = useState(task.products_discussed ?? "");
  const [feedback, setFeedback] = useState(task.feedback ?? "");
  const [dmMet, setDmMet] = useState<boolean | null>(task.decision_maker_met ?? null);
  const [dmName, setDmName] = useState(task.decision_maker_name ?? "");
  const [objections, setObjections] = useState(task.objections_raised ?? "");
  const [nextSteps, setNextSteps] = useState(task.next_steps ?? "");
  const [managerReview, setManagerReview] = useState(task.manager_review ?? "");
  const [nextYear, setNextYear] = useState(task.next_year_target ?? "");
  const [dsrStatus, setDsrStatus] = useState<"open" | "closed" | "on_hold" | null>(
    task.dsr_status ?? null,
  );

  // When the task updates externally, refresh drafts for fields the user hasn't edited locally.
  useEffect(() => {
    setPurpose(task.purpose_of_visit ?? "");
    setProducts(task.products_discussed ?? "");
    setFeedback(task.feedback ?? "");
    setDmMet(task.decision_maker_met ?? null);
    setDmName(task.decision_maker_name ?? "");
    setObjections(task.objections_raised ?? "");
    setNextSteps(task.next_steps ?? "");
    setManagerReview(task.manager_review ?? "");
    setNextYear(task.next_year_target ?? "");
    setDsrStatus(task.dsr_status ?? null);
    setSubmittedLocally(false);
  }, [task.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const quickNote = quickNoteDraftByTask[task.id] ?? task.quick_note ?? "";
  const currentIdx = stepIndex(step);

  /* ---------- save helpers ---------- */

  const patchDsr = async (patch: Partial<OfficeTask>) => {
    if (!saveDsrFields) {
      toast.message("DSR save handler not wired — values are local only.");
      return;
    }
    try {
      setSavingDsr(true);
      await saveDsrFields(task.id, patch);
    } finally {
      setSavingDsr(false);
    }
  };

  /* ---------- navigation guards ---------- */

  const canGoNext = (from: StepId): { ok: boolean; reason?: string } => {
    switch (from) {
      case "start":
        if (!task.institution_id) return { ok: false, reason: "Link an institution first." };
        if (!task.check_in_at) return { ok: false, reason: "Tap Start Journey to capture check-in." };
        return { ok: true };
      case "arrived":
        if (!task.meeting_started_at) return { ok: false, reason: "Tap Meeting Started to continue." };
        return { ok: true };
      case "meeting":
        if (!purpose) return { ok: false, reason: "Select the purpose of visit." };
        if (dmMet === null) return { ok: false, reason: "Answer: was the decision maker met?" };
        if (dmMet && !dmName.trim()) return { ok: false, reason: "Enter the decision maker's name." };
        return { ok: true };
      case "note":
        if (!quickNote || quickNote.trim().length < 5) return { ok: false, reason: "Enter at least 5 characters in the quick note." };
        return { ok: true };
      case "result":
        return { ok: true };
      case "review":
        return { ok: true };
    }
  };

  const goNext = async () => {
    const check = canGoNext(step);
    if (!check.ok) {
      if (check.reason) toast.error(check.reason);
      return;
    }
    // Auto-save on step-out where relevant
    if (step === "meeting") {
      await patchDsr({
        purpose_of_visit: purpose || null,
        products_discussed: products || null,
        feedback: feedback || null,
        decision_maker_met: dmMet,
        decision_maker_name: dmName.trim() || null,
        objections_raised: objections || null,
      });
    }
    if (step === "note" && quickNote.trim()) {
      await saveQuickNote(task.id, quickNote.trim());
    }
    const idx = stepIndex(step);
    const next = STEPS[Math.min(STEPS.length - 1, idx + 1)]?.id;
    if (next) setStep(next);
  };

  const goBack = () => {
    const idx = stepIndex(step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  /* ---------- step renderers ---------- */

  const renderStartStep = () => (
    <div className="space-y-3">
      {/* All the chip-row info used to live outside the panel — merged here so mobile users see everything in one place before starting */}
      <div className={cardCls}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-slate-900">
              {linkedInstitution?.name || task.institution_name || "Unlinked visit"}
            </div>
            <div className="text-[11px] text-slate-500">
              {linkedInstitution?.institution_type || task.institution_type || "—"}
              {linkedInstitution?.city ? ` · ${linkedInstitution.city}` : ""}
              {linkedInstitution?.area ? ` · ${linkedInstitution.area}` : ""}
            </div>
          </div>
          {task.visit_brand ? (
            <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
              {task.visit_brand}
            </span>
          ) : null}
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-500">Visit date</dt>
            <dd className="text-slate-800">{task.visit_date || task.assigned_date || "—"}</dd>
          </div>
          <div>
            <dt className="font-semibold uppercase tracking-wide text-slate-500">Status</dt>
            <dd className="text-slate-800">{task.visit_status ? task.visit_status.replace("_", " ") : "Planned"}</dd>
          </div>
          {task.follow_up_date ? (
            <div className="col-span-2">
              <dt className="font-semibold uppercase tracking-wide text-amber-700">Follow-up</dt>
              <dd className="text-amber-800">
                {task.follow_up_type ? followUpTypeLabels[task.follow_up_type] : "Visit"} on {task.follow_up_date}
              </dd>
            </div>
          ) : null}
        </dl>

        {institutionHistory.length ? (
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600"
          >
            {showHistory ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {institutionHistory.length} prior visit{institutionHistory.length === 1 ? "" : "s"}
          </button>
        ) : null}
        {showHistory ? (
          <ul className="mt-2 space-y-1 rounded-md border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-700">
            {institutionHistory.slice(0, 5).map((h) => (
              <li key={h.id} className="flex justify-between gap-2">
                <span>{h.visit_date || h.assigned_date}</span>
                <span className="text-slate-500">{h.visit_status || "—"}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {!task.institution_id ? (
          <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-slate-50 p-2 text-[11px] text-slate-600">
            Link an institution from the search above before starting.
          </div>
        ) : null}

        <button
          type="button"
          disabled={!task.institution_id || !!task.check_in_at || startingJourney}
          onClick={async () => {
            try {
              setStartingJourney(true);
              await onFetchLocation(task);
              await onVisitAction(task.id, "check_in");
            } finally {
              setStartingJourney(false);
            }
          }}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {startingJourney ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting journey…
            </>
          ) : task.check_in_at ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Journey Started
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4" />
              Start Journey
            </>
          )}
        </button>
        {startingJourney ? (
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Capturing your location — don't close this screen.
          </p>
        ) : null}
        {task.check_in_at ? (
          <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-800">
            <MapPin className="h-3 w-3" />
            {task.check_in_city || task.check_in_area || "Location captured"}
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderArrivedStep = () => (
    <div className="space-y-3">
      <div className={cardCls}>
        <div className={sectionTitleCls}>
          <MapPin className="h-4 w-4 text-indigo-600" /> You've arrived
        </div>
        <div className="mt-2 space-y-1 text-[11px] text-slate-700">
          <div>
            <span className="font-medium text-slate-500">Check-in:</span>{" "}
            {task.check_in_at ? new Date(task.check_in_at).toLocaleString() : "—"}
          </div>
          {task.check_in_address ? (
            <div className="text-slate-600">{task.check_in_address}</div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onFetchLocation(task)}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600"
        >
          <MapPin className="h-3 w-3" /> Refresh location
        </button>

        <button
          type="button"
          disabled={!!task.meeting_started_at || startingMeeting}
          onClick={async () => {
            try {
              setStartingMeeting(true);
              await onVisitAction(task.id, "meeting_started");
            } finally {
              setStartingMeeting(false);
            }
          }}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {startingMeeting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting meeting…
            </>
          ) : task.meeting_started_at ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Meeting in Progress
            </>
          ) : (
            <>
              <Users className="h-4 w-4" />
              Start Meeting
            </>
          )}
        </button>
      </div>
    </div>
  );

  const selectCls =
    "w-full appearance-none rounded-lg border border-slate-300 bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 20 20%22 fill=%22%2364748b%22><path d=%22M5.5 7.5L10 12l4.5-4.5z%22/></svg>')] bg-[length:12px_12px] bg-[position:right_0.75rem_center] bg-no-repeat py-2.5 pl-3 pr-9 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  const renderMeetingStep = () => {
    const currentClassGroup = brandConfig
      ? (((brandDetails[brandConfig.groupField] as string[] | undefined) ?? [])[0] || "")
      : "";
    return (
    <div className="space-y-3">
      {/* Part 1 — Who you met & why */}
      <div className={cardCls}>
        <div className="flex items-center gap-2">
          <span className={sectionBadge(1)}>1</span>
          <div>
            <div className="text-sm font-semibold text-slate-900">Who & why</div>
            <div className="text-[11px] text-slate-500">Purpose, class group, decision maker</div>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <div className={labelCls}>Purpose of visit *</div>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className={`mt-1.5 ${selectCls}`}>
              <option value="">Select purpose…</option>
              {PURPOSE_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {brandConfig?.groupOptions?.length ? (
            <div>
              <div className={labelCls}>{brandConfig.groupLabel}</div>
              <select
                value={currentClassGroup}
                onChange={(e) => {
                  const picked = e.target.value;
                  const current = (brandDetails[brandConfig.groupField] as string[] | undefined) ?? [];
                  // Clear existing selections, then set the picked one (single-select behavior).
                  current.forEach((existing) => {
                    if (existing !== picked) void toggleBrandMultiValue(task, brandConfig.groupField, existing);
                  });
                  if (picked && !current.includes(picked)) {
                    void toggleBrandMultiValue(task, brandConfig.groupField, picked);
                  }
                }}
                className={`mt-1.5 ${selectCls}`}
              >
                <option value="">Select {brandConfig.groupLabel.toLowerCase()}…</option>
                {brandConfig.groupOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <div className={labelCls}>Decision maker met? *</div>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDmMet(true)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold active:scale-[0.98] ${
                  dmMet === true
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" /> Yes
              </button>
              <button
                type="button"
                onClick={() => setDmMet(false)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2.5 text-sm font-semibold active:scale-[0.98] ${
                  dmMet === false
                    ? "border-rose-600 bg-rose-600 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-rose-300"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {dmMet ? (
            <div>
              <div className={labelCls}>Decision maker name</div>
              <input
                value={dmName}
                onChange={(e) => setDmName(e.target.value)}
                placeholder="e.g. Ms. Priya Rao — Principal"
                className={`mt-1.5 ${inputCls}`}
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Part 2 — What was discussed */}
      <div className={cardCls}>
        <div className="flex items-center gap-2">
          <span className={sectionBadge(2)}>2</span>
          <div>
            <div className="text-sm font-semibold text-slate-900">What happened</div>
            <div className="text-[11px] text-slate-500">Product, feedback, interest, objections</div>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <div>
            <div className={labelCls}>Products / programs discussed</div>
            <select
              value={products}
              onChange={(e) => setProducts(e.target.value)}
              className={`mt-1.5 ${selectCls}`}
            >
              <option value="">Select product…</option>
              {PRODUCT_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value={PRODUCT_OPTIONS.join(" | ")}>All three</option>
            </select>
          </div>

          <div>
            <div className={labelCls}>Feedback from school</div>
            <select value={feedback} onChange={(e) => setFeedback(e.target.value)} className={`mt-1.5 ${selectCls}`}>
              <option value="">Select feedback…</option>
              {FEEDBACK_PRESETS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <div className={labelCls}>Interest level</div>
            <select
              value={(brandDetails.interest_level as string) || ""}
              onChange={(e) => {
                const v = e.target.value;
                if (v) void setBrandSingleValue(task, "interest_level", v);
              }}
              className={`mt-1.5 ${selectCls}`}
            >
              <option value="">Select level…</option>
              {(["low", "medium", "high"] as InterestLevel[]).map((lvl) => (
                <option key={lvl} value={lvl}>{lvl[0].toUpperCase() + lvl.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <div className={labelCls}>Objections <span className="text-slate-400 normal-case">(if any)</span></div>
            <textarea
              value={objections}
              onChange={(e) => setObjections(e.target.value)}
              rows={2}
              placeholder="Price concerns, timing, competitor, etc."
              className={`mt-1.5 text-sm ${inputCls}`}
            />
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderNoteStep = () => (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className={sectionTitleCls}>
          <MessageSquare className="h-4 w-4 text-indigo-600" /> Quick Note (required)
        </div>
        <p className="mt-1 text-xs text-slate-600">
          One-line takeaway. This appears in the DSR and admin reports.
        </p>
        <textarea
          value={quickNote}
          onChange={(e) =>
            setQuickNoteDraftByTask((prev) => ({ ...prev, [task.id]: e.target.value }))
          }
          onBlur={() => {
            if (quickNote.trim()) saveQuickNote(task.id, quickNote.trim());
          }}
          rows={4}
          placeholder="e.g. Principal agreed to demo on Monday. Key concern: pricing for grade 6-8 bundle."
          className={`mt-2 ${inputCls}`}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-slate-500">{quickNote.trim().length} characters</span>
          <button
            type="button"
            onClick={() => startVoiceQuickNote(task)}
            disabled={voiceTaskId === task.id}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-60"
          >
            <Mic className="h-3 w-3" />
            {voiceTaskId === task.id ? "Listening…" : "Voice note"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderResultStep = () => {
    return (
      <div className="space-y-4">

        <div className={cardCls}>
          <div className={sectionTitleCls}>
            <CalendarClock className="h-4 w-4 text-indigo-600" /> Follow-up
          </div>

          <div className="mt-3">
            <div className={labelCls}>Mode</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {NEXT_ACTIONS.map((a) => {
                const sel =
                  (a.type !== null && task.follow_up_type === a.type) ||
                  (a.id === "no_followup" && task.follow_up_required === false);
                const Icon = a.icon;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => applyFollowupAction(task, a.id)}
                    className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-2.5 text-[11px] font-medium transition-all active:scale-[0.98] ${
                      sel
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>

          {task.follow_up_required !== false ? (
            <div className="mt-4">
              <div className={labelCls}>Next follow-up date</div>
              <input
                type="date"
                value={task.follow_up_date || ""}
                onChange={(e) => saveFollowUpDate(task.id, e.target.value, task.follow_up_type ?? null)}
                className={`mt-2 h-11 ${inputCls}`}
              />
            </div>
          ) : null}

          <div className="mt-4">
            <div className={labelCls}>Status</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DSR_STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setDsrStatus(s.value);
                    patchDsr({ dsr_status: s.value });
                  }}
                  className={`rounded-xl border-2 px-3 py-2 text-xs font-semibold transition-all active:scale-[0.98] ${
                    dsrStatus === s.value ? s.tone : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isAdmin ? (
          <div className={cardCls}>
            <div className={sectionTitleCls}>Manager Review (admin only)</div>
            <textarea
              value={managerReview}
              onChange={(e) => setManagerReview(e.target.value)}
              onBlur={() => patchDsr({ manager_review: managerReview || null })}
              rows={2}
              placeholder="Admin / manager notes — visible in admin exports"
              className={`mt-2 ${inputCls}`}
            />
          </div>
        ) : task.manager_review ? (
          <div className={cardCls}>
            <div className={sectionTitleCls}>Manager feedback</div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{task.manager_review}</p>
          </div>
        ) : null}

      </div>
    );
  };

  const renderReviewStep = () => (
    <div className="space-y-4">
      <div className={cardCls}>
        <div className={sectionTitleCls}>
          <FileText className="h-4 w-4 text-indigo-600" /> Review before submitting
        </div>
        <p className="mt-1 text-[11px] text-slate-500">
          Double-check today's DSR entry. Submit when everything looks right.
        </p>
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
          {[
            ["Institution", linkedInstitution?.name || task.institution_name || "—"],
            ["Purpose", purpose || task.purpose_of_visit || "—"],
            ["DM met", task.decision_maker_met === true ? `Yes${dmName ? ` · ${dmName}` : ""}` : task.decision_maker_met === false ? "No" : "—"],
            ["Products", products || task.products_discussed || "—"],
            ["Feedback", feedback || task.feedback || "—"],
            ["Objections", objections || task.objections_raised || "—"],
            ["Follow-up", task.follow_up_date ? `${task.follow_up_date}${task.follow_up_type ? ` · ${followUpTypeLabels[task.follow_up_type] || task.follow_up_type}` : ""}` : task.follow_up_required === false ? "Not required" : "—"],
            ["Quick note", quickNote || "—"],
            ["Status", dsrStatus ? dsrStatus.replace("_", " ") : "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col border-b border-dashed border-slate-100 py-1 last:border-b-0 sm:border-b-0">
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
              <dd className="text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {(() => {
        // Consider the visit submitted if EITHER the client-side task shows completed,
        // OR both closeout timestamps exist (survives the refresh-lag window where
        // visit_status hasn't synced back yet).
        const submitted =
          task.visit_status === "completed" ||
          (!!task.meeting_completed_at && !!task.check_out_at) ||
          submittedLocally;
        return (
          <div className={cardCls}>
            <div className={sectionTitleCls}>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Submit DSR
            </div>
            {submitted ? (
              <div className="mt-2 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <div className="font-semibold">DSR submitted for today.</div>
                  <div>
                    {task.check_out_at
                      ? `Closed at ${new Date(task.check_out_at).toLocaleTimeString()}.`
                      : "Waiting for sync…"}
                    {" "}Admins can edit later from their dashboard.
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-600">
                This closes today's visit and locks the DSR entry. You can still edit later from the admin view.
              </p>
            )}
            <button
              type="button"
              disabled={submitted || closingVisit}
              onClick={async () => {
                try {
                  setClosingVisit(true);
                  if (!task.meeting_completed_at) {
                    await onVisitAction(task.id, "meeting_completed");
                  }
                  if (!task.check_out_at) {
                    await onVisitAction(task.id, "check_out");
                  }
                  setSubmittedLocally(true);
                  toast.success("Visit closed for today.");
                } finally {
                  setClosingVisit(false);
                }
              }}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {closingVisit ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : submitted ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  DSR Submitted
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submit &amp; Close Visit
                </>
              )}
            </button>
          </div>
        );
      })()}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case "start": return renderStartStep();
      case "arrived": return renderArrivedStep();
      case "meeting": return renderMeetingStep();
      case "note": return renderNoteStep();
      case "result": return renderResultStep();
      case "review": return renderReviewStep();
    }
  };

  /* ------------------------------ header ------------------------------ */

  const headerBrand = task.visit_brand ? (
    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
      {task.visit_brand}
    </span>
  ) : null;

  const ActiveStepIcon = STEPS[currentIdx]?.icon;
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 sm:p-4">
      {/* Compact header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">
              {linkedInstitution?.name || task.institution_name || "Unlinked visit"}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              {ActiveStepIcon ? <ActiveStepIcon className="h-3 w-3" /> : null}
              <span>Step {currentIdx + 1}/{STEPS.length} · {STEPS[currentIdx]?.label}</span>
            </div>
          </div>
        </div>
        {headerBrand}
      </div>

      {/* Step pips — dots on mobile, labels on sm+ */}
      <ol className="mt-3 flex items-center gap-1">
        {STEPS.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const Icon = s.icon;
          return (
            <li key={s.id} className="flex flex-1 items-center gap-1">
              <button
                type="button"
                onClick={() => setStep(s.id)}
                aria-label={s.label}
                className={`flex h-6 shrink-0 items-center gap-1 rounded-full border text-[11px] font-medium transition-colors sm:px-2 ${
                  active
                    ? "border-indigo-600 bg-indigo-600 px-2 text-white"
                    : done
                    ? "border-emerald-300 bg-emerald-50 px-1.5 text-emerald-700"
                    : "border-slate-300 bg-white px-1.5 text-slate-500"
                }`}
              >
                {done ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                <span className={active ? "inline" : "hidden sm:inline"}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 ? (
                <div className={`h-px flex-1 ${done ? "bg-emerald-300" : "bg-slate-200"}`} />
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Step body */}
      <div className="mt-3 sm:mt-4">{renderStep()}</div>

      {/* Footer nav — sticky-feel on mobile */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200 pt-3">
        <button
          type="button"
          onClick={goBack}
          disabled={currentIdx === 0}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 disabled:opacity-40"
        >
          Back
        </button>
        <div className="hidden truncate text-[11px] text-slate-500 sm:block">
          {savingDsr ? "Saving…" : task.visit_status ? `Status: ${task.visit_status.replace("_", " ")}` : ""}
        </div>
        <button
          type="button"
          onClick={goNext}
          disabled={currentIdx === STEPS.length - 1}
          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          Next <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </section>
  );
};

export default VisitPanel;
