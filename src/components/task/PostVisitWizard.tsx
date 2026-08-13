/**
 * PostVisitWizard — enhanced
 * Steps: Outcome → Interest & Engagement → Contact → Follow-up → Notes & Share
 */
import React, { useState } from "react";
import { Check, ChevronRight, ChevronLeft, Mic, X, Phone, User, Share2 } from "lucide-react";
import type { OfficeTask, VisitOutcome, BrandDetails, FollowUpType } from "@/types/taskManager";
import { visitOutcomeLabels, brandFieldConfig } from "@/utils/taskManager";

// ── outcome config ─────────────────────────────────────────────────────────
const OUTCOME_ITEMS: { value: VisitOutcome; emoji: string; color: string }[] = [
  { value: "interested",                   emoji: "🌟", color: "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100" },
  { value: "need_proposal",                emoji: "📄", color: "border-orange-300 bg-sky-50 text-orange-800 hover:bg-sky-100" },
  { value: "need_demo",                    emoji: "🎯", color: "border-violet-300 bg-violet-50 text-violet-800 hover:bg-violet-100" },
  { value: "call_later",                   emoji: "📞", color: "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100" },
  { value: "not_interested",               emoji: "❌", color: "border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100" },
  { value: "revisit_required",             emoji: "🔄", color: "border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100" },
  { value: "met_wrong_person",             emoji: "👤", color: "border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100" },
  { value: "decision_maker_not_available", emoji: "⏳", color: "border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100" },
];

type FollowupAction = "call" | "whatsapp" | "visit_again" | "demo" | "send_proposal" | "no_followup";
const FOLLOWUP_ITEMS: { action: FollowupAction; label: string; emoji: string; color: string }[] = [
  { action: "call",          label: "Phone Call",    emoji: "📞", color: "border-orange-300 bg-sky-50 text-orange-800" },
  { action: "whatsapp",      label: "WhatsApp",      emoji: "💬", color: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  { action: "visit_again",   label: "Visit Again",   emoji: "🏫", color: "border-violet-300 bg-violet-50 text-violet-800" },
  { action: "demo",          label: "Demo",          emoji: "🎯", color: "border-amber-300 bg-amber-50 text-amber-800" },
  { action: "send_proposal", label: "Send Proposal", emoji: "📄", color: "border-indigo-300 bg-indigo-50 text-indigo-800" },
  { action: "no_followup",   label: "No Follow-up",  emoji: "✓",  color: "border-slate-300 bg-slate-50 text-slate-700" },
];

const INTEREST_COLORS = {
  low:    "border-slate-200 bg-slate-50 text-slate-600",
  medium: "border-amber-300 bg-amber-50 text-amber-800",
  high:   "border-emerald-300 bg-emerald-50 text-emerald-800",
};

function label(val: string) { return val.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }

// ── props ─────────────────────────────────────────────────────────────────
export interface PostVisitWizardProps {
  task: OfficeTask;
  onClose: () => void;
  toggleVisitOutcome: (task: OfficeTask, outcome: VisitOutcome) => Promise<void>;
  applyFollowupAction: (task: OfficeTask, action: FollowupAction) => Promise<void>;
  saveFollowUpDate: (taskId: string, date: string, preferredFollowUpType?: FollowUpType | null) => Promise<void>;
  saveQuickNote: (taskId: string, note: string) => Promise<void>;
  startVoiceQuickNote: (task: OfficeTask) => void;
  voiceTaskId: string | null;
  quickNoteDraft: string;
  setQuickNoteDraft: (v: string) => void;
  // interest fields
  setBrandSingleValue: (task: OfficeTask, field: keyof BrandDetails, value: string) => Promise<void>;
  toggleBrandMultiValue: (task: OfficeTask, field: keyof BrandDetails, value: string, max?: number) => Promise<void>;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | "done";
const STEP_LABELS = ["Outcome", "Interest", "Contact", "Follow-up", "Notes"];

// ── component ────────────────────────────────────────────────────────────
const PostVisitWizard: React.FC<PostVisitWizardProps> = ({
  task, onClose,
  toggleVisitOutcome, applyFollowupAction,
  saveFollowUpDate, saveQuickNote,
  startVoiceQuickNote, voiceTaskId,
  quickNoteDraft, setQuickNoteDraft,
  setBrandSingleValue, toggleBrandMultiValue,
}) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [saving, setSaving] = useState(false);
  const [followupDate, setFollowupDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [chosenAction, setChosenAction] = useState<FollowupAction | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const institutionName = task.institution_name || task.task_title || "Institution";
  const brand = (task.visit_brand as "Vivencia" | "ONROL") ?? "Vivencia";
  const bConfig = brandFieldConfig[brand] ?? brandFieldConfig["Vivencia"];
  const details: BrandDetails = (task.brand_details && typeof task.brand_details === "object" ? task.brand_details : {}) as BrandDetails;
  const currentOutcomes = (task.visit_outcome || []) as VisitOutcome[];
  const isNotInterested = currentOutcomes.includes("not_interested");

  // ── helpers ──────────────────────────────────────────────────────────────
  const wrap = async (fn: () => Promise<void>) => {
    setSaving(true);
    try { await fn(); } finally { setSaving(false); }
  };

  const handleFollowup = async (action: FollowupAction) => {
    await wrap(async () => {
      setChosenAction(action);
      await applyFollowupAction(task, action);
      if (action !== "no_followup") {
        const followUpTypeByAction: Record<Exclude<FollowupAction, "no_followup">, FollowUpType> = {
          call: "call",
          whatsapp: "whatsapp",
          visit_again: "visit",
          demo: "demo",
          send_proposal: "proposal",
        };
        await saveFollowUpDate(task.id, followupDate, followUpTypeByAction[action]);
      }
      setStep(5);
    });
  };

  const handleNoteSave = async () => {
    await wrap(async () => {
      if (contactName.trim() || contactPhone.trim()) {
        const contactNote = `Contact: ${contactName.trim()}${contactPhone.trim() ? ` · ${contactPhone.trim()}` : ""}`;
        const combined = [quickNoteDraft.trim(), contactNote].filter(Boolean).join("\n");
        await saveQuickNote(task.id, combined);
      } else if (quickNoteDraft.trim()) {
        await saveQuickNote(task.id, quickNoteDraft.trim());
      }
      setStep("done");
    });
  };

  const shareWhatsApp = () => {
    const interestLevel = details.interest_level ? label(details.interest_level) : "-";
    const programs = (details.program_interest ?? []).map(label).join(", ") || "-";
    const audience = details.audience_type ? label(details.audience_type) : "-";
    const stage = details.discussion_stage ? label(details.discussion_stage) : "-";
    const outcomes = currentOutcomes.map(o => visitOutcomeLabels[o]).join(", ") || "-";
    const followup = chosenAction && chosenAction !== "no_followup" ? `${label(chosenAction)} on ${followupDate}` : "No follow-up";
    const text = [
      `*Visit Summary — ${institutionName}*`,
      `Date: ${task.visit_date || task.assigned_date || new Date().toLocaleDateString("en-IN")}`,
      `Brand: ${brand}`,
      ``,
      `*Meeting Outcome:* ${outcomes}`,
      `*Interest Level:* ${interestLevel}`,
      `*Programs Interested:* ${programs}`,
      `*Audience:* ${audience}`,
      `*Discussion Stage:* ${stage}`,
      contactName ? `*Contact:* ${contactName}${contactPhone ? ` · ${contactPhone}` : ""}` : null,
      quickNoteDraft.trim() ? `*Notes:* ${quickNoteDraft.trim()}` : null,
      ``,
      `*Next Step:* ${followup}`,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 flex-shrink-0">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Visit complete</p>
            <h2 className="mt-0.5 text-base font-bold text-slate-900 truncate">{institutionName}</h2>
          </div>
          <button onClick={onClose} className="ml-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
            <X size={14} />
          </button>
        </div>

        {/* Step indicator */}
        {step !== "done" && typeof step === "number" && (
          <div className="flex items-center gap-0 border-b border-slate-100 flex-shrink-0">
            {STEP_LABELS.map((lbl, i) => {
              const s = (i + 1) as WizardStep;
              return (
                <div key={lbl} className={`flex-1 flex flex-col items-center py-2 text-[10px] font-semibold border-b-2 transition-colors ${
                  step === s ? "border-[#f3f5f8] text-[#f3f5f8]"
                  : (step as number) > (s as number) ? "border-emerald-400 text-emerald-600"
                  : "border-transparent text-slate-300"
                }`}>
                  <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] mb-0.5 ${
                    step === s ? "bg-[#f3f5f8] text-white"
                    : (step as number) > (s as number) ? "bg-emerald-400 text-white"
                    : "bg-slate-200 text-slate-400"
                  }`}>{(step as number) > (s as number) ? "✓" : i + 1}</span>
                  {lbl}
                </div>
              );
            })}
          </div>
        )}

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">

          {/* ── Step 1: Outcome ── */}
          {step === 1 && (
            <div className="px-5 py-4">
              <p className="text-sm font-semibold text-slate-800">What happened at the visit?</p>
              <p className="mt-0.5 text-xs text-slate-400">Pick up to 2 outcomes</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {OUTCOME_ITEMS.map(({ value, emoji, color }) => {
                  const selected = currentOutcomes.includes(value);
                  return (
                    <button key={value} onClick={() => void toggleVisitOutcome(task, value)}
                      className={`relative flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all ${color} ${selected ? "ring-2 ring-offset-1 ring-[#f3f5f8]" : ""}`}>
                      {selected && <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f3f5f8]"><Check size={9} className="text-white" /></span>}
                      <span className="text-base leading-none">{emoji}</span>
                      <span>{visitOutcomeLabels[value]}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => setStep(isNotInterested ? 4 : 2)}
                disabled={currentOutcomes.length === 0}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#f3f5f8] py-3 text-sm font-semibold text-white disabled:opacity-40">
                Next: Interest <ChevronRight size={15} />
              </button>
              {currentOutcomes.length === 0 && <p className="mt-1.5 text-center text-[11px] text-slate-400">Select at least one outcome to continue</p>}
            </div>
          )}

          {/* ── Step 2: Interest & Engagement ── */}
          {step === 2 && (
            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Interest & Engagement</p>
                <p className="mt-0.5 text-xs text-slate-400">What was discussed and how interested were they?</p>
              </div>

              {/* Interest level */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Interest Level</p>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map(lvl => (
                    <button key={lvl} onClick={() => void setBrandSingleValue(task, "interest_level", lvl)}
                      className={`rounded-xl border-2 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                        details.interest_level === lvl
                          ? INTEREST_COLORS[lvl] + " ring-2 ring-offset-1 ring-current"
                          : "border-slate-200 text-slate-400 hover:border-slate-300"
                      }`}>{lvl}</button>
                  ))}
                </div>
              </div>

              {/* Discussion stage */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Discussion Stage</p>
                <div className="flex flex-wrap gap-1.5">
                  {bConfig.discussionStage.map(s => (
                    <button key={s} onClick={() => void setBrandSingleValue(task, "discussion_stage", s)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        details.discussion_stage === s ? "border-[#f3f5f8] bg-[#f3f5f8] text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}>{label(s)}</button>
                  ))}
                </div>
              </div>

              {/* Audience type */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Audience Present</p>
                <div className="flex flex-wrap gap-1.5">
                  {bConfig.audienceType.map(a => (
                    <button key={a} onClick={() => void setBrandSingleValue(task, "audience_type", a)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        details.audience_type === a ? "border-blue-500 bg-blue-500 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}>{label(a)}</button>
                  ))}
                </div>
              </div>

              {/* Class group */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{bConfig.groupLabel}</p>
                <div className="flex flex-wrap gap-1.5">
                  {bConfig.groupOptions.map(g => {
                    const groupField = bConfig.groupField as keyof BrandDetails;
                    const arr = (details[groupField] ?? []) as string[];
                    const sel = arr.includes(g);
                    return (
                      <button key={g} onClick={() => void toggleBrandMultiValue(task, groupField, g)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          sel ? "border-violet-500 bg-violet-500 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"
                        }`}>{label(g)}</button>
                    );
                  })}
                </div>
              </div>

              {/* Program interest */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Programs Interested <span className="font-normal normal-case text-slate-400">(max 3)</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {bConfig.programInterest.map(p => {
                    const arr = details.program_interest ?? [];
                    const sel = arr.includes(p);
                    return (
                      <button key={p} onClick={() => void toggleBrandMultiValue(task, "program_interest", p, 3)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          sel ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"
                        }`}>{label(p)}</button>
                    );
                  })}
                </div>
              </div>

              {/* Special flags */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{bConfig.flagsLabel}</p>
                <div className="flex flex-wrap gap-1.5">
                  {bConfig.flagsOptions.map(f => {
                    const flagField = bConfig.flagsField as keyof BrandDetails;
                    const arr = (details[flagField] ?? []) as string[];
                    const sel = arr.includes(f);
                    return (
                      <button key={f} onClick={() => void toggleBrandMultiValue(task, flagField, f)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          sel ? "border-orange-500 bg-orange-500 text-white" : "border-slate-200 text-slate-600 hover:border-slate-400"
                        }`}>{label(f)}</button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={() => setStep(3)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f3f5f8] py-2.5 text-sm font-semibold text-white">
                  Next: Contact <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Contact Details ── */}
          {step === 3 && (
            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Who did you meet?</p>
                <p className="mt-0.5 text-xs text-slate-400">Save contact details for future follow-ups</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <User size={11} /> Contact Name
                  </label>
                  <input
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    placeholder="e.g. Mrs. Priya Sharma (Principal)"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f3f5f8]/30"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-500">
                    <Phone size={11} /> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f3f5f8]/30"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setStep(2)} className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={() => setStep(4)} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f3f5f8] py-2.5 text-sm font-semibold text-white">
                  Next: Follow-up <ChevronRight size={15} />
                </button>
              </div>
              <button onClick={() => setStep(4)} className="w-full text-center text-xs text-slate-400 underline">
                Skip contact details
              </button>
            </div>
          )}

          {/* ── Step 4: Follow-up ── */}
          {step === 4 && (
            <div className="px-5 py-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">What's the next step?</p>
                <p className="mt-0.5 text-xs text-slate-400">How will you follow up with {institutionName}?</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {FOLLOWUP_ITEMS.map(({ action, label: lbl, emoji, color }) => (
                  <button key={action} onClick={() => void handleFollowup(action)} disabled={saving}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${color} disabled:opacity-50 hover:scale-[1.01]`}>
                    <span className="text-base leading-none">{emoji}</span>
                    <span>{lbl}</span>
                  </button>
                ))}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Follow-up date</label>
                <input type="date" value={followupDate} onChange={e => setFollowupDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#f3f5f8]/30" />
              </div>

              <button onClick={() => setStep(3)} className="text-xs text-slate-400 underline">← Back to contact</button>
            </div>
          )}

          {/* ── Step 5: Notes & Share ── */}
          {step === 5 && (
            <div className="px-5 py-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">Final notes</p>
                <p className="mt-0.5 text-xs text-slate-400">Anything else to remember about this visit?</p>
              </div>

              <div className="relative">
                <textarea
                  value={quickNoteDraft}
                  onChange={e => setQuickNoteDraft(e.target.value)}
                  placeholder="e.g. Principal was very enthusiastic about AI robotics, requested a demo session next week…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f3f5f8]/30"
                />
                <button onClick={() => startVoiceQuickNote(task)} disabled={voiceTaskId !== null}
                  className={`absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                    voiceTaskId === task.id ? "border-rose-300 bg-rose-50 text-rose-600 animate-pulse" : "border-slate-200 bg-white text-slate-400 hover:bg-slate-100"
                  }`}>
                  <Mic size={13} />
                </button>
              </div>

              {/* WhatsApp share */}
              <button onClick={shareWhatsApp}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-semibold text-white hover:bg-[#22c55e] transition-colors shadow-sm">
                <Share2 size={15} />
                Share Visit Summary on WhatsApp
              </button>

              <div className="flex gap-2">
                <button onClick={() => setStep(4)} className="flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600">
                  <ChevronLeft size={14} /> Back
                </button>
                <button onClick={() => void handleNoteSave()} disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f3f5f8] py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {saving ? "Saving…" : "Save & Finish ✓"}
                </button>
              </div>
              <button onClick={() => setStep("done")} className="w-full text-center text-xs text-slate-400 underline">Skip notes</button>
            </div>
          )}

          {/* ── Done ── */}
          {step === "done" && (
            <div className="flex flex-col items-center px-5 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Check size={28} className="text-emerald-600" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Great work! 🎉</h3>
              <p className="mt-1 text-sm text-slate-500">
                Visit to <span className="font-semibold">{institutionName}</span> logged.
                {chosenAction && chosenAction !== "no_followup" && (
                  <> Follow-up reminder set for <span className="font-semibold">{followupDate}</span>.</>
                )}
              </p>
              <button onClick={onClose} className="mt-5 rounded-xl bg-[#f3f5f8] px-8 py-2.5 text-sm font-semibold text-white">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostVisitWizard;
