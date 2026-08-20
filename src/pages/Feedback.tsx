import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  GraduationCap, Briefcase, Rocket, Sparkles,
  Search, Instagram, Youtube, Linkedin, Users, MessageSquare,
  Zap, Bot, Clapperboard, Coins, Target,
  TrendingUp, Award, Compass, Eye,
  Star, ArrowLeft, ArrowRight, Check, Loader2,
  User, Phone, Mail, MessageCircle, PhoneCall,
  Building2, BookOpen, CalendarDays, Send, PartyPopper,
  type LucideIcon,
} from "lucide-react";
import { submitFeedback } from "@/lib/feedbackIntake";

// ── Question data ─────────────────────────────────────────────────────────────
type Pick = { label: string; icon: LucideIcon; audience?: "student" | "general"; hint?: string };

const AUDIENCE: Pick[] = [
  { label: "Student", icon: GraduationCap, audience: "student", hint: "School / college / university" },
  { label: "Working professional", icon: Briefcase, audience: "general", hint: "Job / career" },
  { label: "Founder / business owner", icon: Rocket, audience: "general", hint: "Running or building a business" },
  { label: "Just exploring AI", icon: Sparkles, audience: "general", hint: "Curious to learn" },
];
const HOW_FOUND: Pick[] = [
  { label: "Google search", icon: Search },
  { label: "Instagram", icon: Instagram },
  { label: "YouTube", icon: Youtube },
  { label: "LinkedIn", icon: Linkedin },
  { label: "Friend / referral", icon: Users },
  { label: "Somewhere else", icon: MessageSquare },
];
const HELP: Pick[] = [
  { label: "Build websites & apps", icon: Zap },
  { label: "Automate boring work", icon: Bot },
  { label: "Make videos, posts & designs", icon: Clapperboard },
  { label: "Earn money with AI skills", icon: Coins },
  { label: "Get a job / placement", icon: Target },
];
const SIX_MONTHS: Pick[] = [
  { label: "Already earning with AI", icon: TrendingUp },
  { label: "Placement-ready with real projects", icon: Award },
  { label: "Learning AI, still deciding", icon: Compass },
  { label: "Just want to explore more", icon: Eye },
];
const CONTACT_METHOD: Pick[] = [
  { label: "WhatsApp", icon: MessageCircle },
  { label: "Phone call", icon: PhoneCall },
  { label: "Email", icon: Mail },
];
const DEGREES = ["B.Tech / B.E.", "B.Sc / BCA", "B.Com / BBA", "M.Tech / M.E.", "MBA / PGDM", "MCA / M.Sc", "Diploma", "Other"];
const YEARS = ["1st year", "2nd year", "3rd year", "4th year", "Final year", "Graduated"];
const CHEERS = ["Nice.", "Love that.", "Great pick.", "Got it.", "Awesome.", "Noted."];

type StepDef =
  | { id: "audience" | "howFound" | "help" | "sixMonths" | "contactMethod"; kind: "single"; q: string; accent: string; choices: Pick[] }
  | { id: "rating"; kind: "rating"; q: string; accent: string }
  | { id: "education"; kind: "education"; q: string; accent: string }
  | { id: "contact"; kind: "contact"; q: string; accent: string };

export default function Feedback() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ name: "", phone: "", email: "", website: "" });
  const [edu, setEdu] = useState({ institute: "", branch: "", degree: "", year: "" });
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<null | string>(null); // intent tier
  const [error, setError] = useState("");

  const audience = answers.audience as "student" | "general" | undefined;

  const steps = useMemo<StepDef[]>(() => {
    const s: StepDef[] = [
      { id: "audience", kind: "single", q: "Which sounds most like", accent: "you?", choices: AUDIENCE },
    ];
    if (audience === "student")
      s.push({ id: "education", kind: "education", q: "Tell us about your", accent: "studies" });
    else if (audience === "general")
      s.push({ id: "howFound", kind: "single", q: "How did you find", accent: "ONROL?", choices: HOW_FOUND });
    s.push(
      { id: "rating", kind: "rating", q: "How's your experience with", accent: "ONROL?" },
      { id: "help", kind: "single", q: "What do you want AI to", accent: "help you do?", choices: HELP },
      { id: "sixMonths", kind: "single", q: "Where do you want to be in", accent: "6 months?", choices: SIX_MONTHS },
      { id: "contactMethod", kind: "single", q: "Best way to", accent: "reach you?", choices: CONTACT_METHOD },
      { id: "contact", kind: "contact", q: "Last step —", accent: "your details" },
    );
    return s;
  }, [audience]);

  const clamped = Math.min(step, steps.length - 1);
  const current = steps[clamped];
  const total = steps.length;
  const progress = ok ? 100 : Math.round((clamped / total) * 100);
  const cheer = CHEERS[clamped % CHEERS.length];

  const advance = () => { setError(""); setStep((v) => Math.min(steps.length - 1, v + 1)); };
  const back = () => { setError(""); setStep((v) => Math.max(0, v - 1)); };

  // pick a choice → store + auto-advance (small delay lets the tap animate)
  const choose = (stepId: string, pick: Pick) => {
    setAnswers((a) => stepId === "audience"
      ? { ...a, audience: pick.audience!, role: pick.label }
      : { ...a, [stepId]: pick.label });
    setError("");
    if (stepId === "audience") { setStep((v) => v + 1); return; } // branch: skip delay so path is instant
    window.setTimeout(() => setStep((v) => Math.min(steps.length, v + 1)), reduce ? 0 : 240);
  };

  const submit = async () => {
    if (!contact.name.trim() || !contact.phone.trim()) { setError("Please add your name and mobile number."); return; }
    setBusy(true); setError("");
    try {
      const r = await submitFeedback({
        name: contact.name, phone: contact.phone, email: contact.email, website: contact.website,
        audience, role: answers.role,
        institute: edu.institute, branch: edu.branch, degree: edu.degree, year: edu.year,
        howFound: answers.howFound,
        rating: answers.rating,
        help: answers.help, sixMonths: answers.sixMonths,
        contactMethod: answers.contactMethod,
      });
      setOk(r.intentTier);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  };

  const slide = reduce ? {} : {
    initial: { opacity: 0, x: 28 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -28 },
    transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <div className="min-h-screen w-full bg-[hsl(28_100%_98%)] font-sans text-stone-900 flex items-center justify-center p-4 sm:p-6 [color-scheme:light]">
      {/* atmospheric warm wash — brand orange, low opacity (no purple slop) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[18%] -left-[12%] h-[46vw] w-[46vw] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[42vw] w-[42vw] rounded-full bg-primary/10 blur-[130px]" />
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-xl rounded-[28px] bg-white/95 backdrop-blur-xl border border-stone-900/[0.06] shadow-[0_30px_80px_-32px_rgba(28,25,23,0.28)] overflow-hidden"
      >
        {/* progress spark */}
        <div className="h-1.5 w-full bg-primary/10">
          <motion.div className="h-full bg-primary rounded-r-full" animate={{ width: `${progress}%` }} transition={{ duration: reduce ? 0 : 0.4, ease: "easeOut" }} />
        </div>

        <div className="p-6 sm:p-9">
          {/* header row */}
          <div className="flex items-center justify-between mb-6">
            <img src="/onrol-logo-dark.png" alt="ONROL" width={105} height={28} className="h-7 w-auto" />
            {!ok && (
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                {current.kind === "contact" ? "Almost done" : `Step ${clamped + 1} of ${total}`}
              </span>
            )}
          </div>

          {ok ? <Done tier={ok} name={contact.name} reduce={!!reduce} /> : (
            <AnimatePresence mode="wait">
              <motion.div key={current.id} {...slide}>
                {/* cheer chip (not on the first screen) */}
                {clamped > 0 && (
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-[#b45309]">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> {cheer}
                  </div>
                )}

                <h1 className="font-display text-[26px] leading-[1.15] sm:text-[32px] font-extrabold tracking-tight text-stone-900 mb-6">
                  {current.q}{" "}
                  <span className="font-editorial italic font-medium text-primary">{current.accent}</span>
                </h1>

                {current.kind === "single" && (
                  <div className="space-y-2.5" role="radiogroup" aria-label={`${current.q} ${current.accent}`}>
                    {current.choices.map((c, i) => {
                      const selected = current.id === "audience" ? answers.audience === c.audience : answers[current.id] === c.label;
                      return (
                        <motion.button
                          key={c.label} type="button" role="radio" aria-checked={selected}
                          onClick={() => choose(current.id, c)}
                          initial={reduce ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: reduce ? 0 : i * 0.04, duration: 0.22 }}
                          whileTap={reduce ? undefined : { scale: 0.985 }}
                          className={`group flex w-full min-h-[60px] items-center gap-4 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 ${
                            selected ? "border-primary bg-primary/5" : "border-stone-200 hover:border-primary/40 hover:bg-stone-50"
                          }`}
                        >
                          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors ${selected ? "bg-primary text-white" : "bg-primary/10 text-primary group-hover:bg-primary/15"}`}>
                            <c.icon className="h-5 w-5" />
                          </span>
                          <span className="flex-1">
                            <span className="block text-[15px] font-semibold text-stone-800">{c.label}</span>
                            {c.hint && <span className="mt-0.5 block text-[13px] text-stone-500">{c.hint}</span>}
                          </span>
                          {selected
                            ? <Check className="h-5 w-5 text-primary" />
                            : <ArrowRight className="h-4 w-4 text-stone-300 transition-colors group-hover:text-primary/60" />}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {current.kind === "rating" && (
                  <div>
                    <div className="flex gap-2 sm:gap-3" role="radiogroup" aria-label="Rate your experience 1 to 5">
                      {[1, 2, 3, 4, 5].map((n) => {
                        const sel = Number(answers.rating) >= n;
                        return (
                          <button
                            key={n} type="button" role="radio" aria-checked={answers.rating === String(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}
                            onClick={() => { setAnswers((a) => ({ ...a, rating: String(n) })); window.setTimeout(advance, reduce ? 0 : 260); }}
                            className="flex h-16 flex-1 items-center justify-center rounded-2xl border-2 border-stone-200 transition-colors hover:border-primary/40 hover:bg-stone-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
                          >
                            <Star className={`h-7 w-7 transition-colors ${sel ? "fill-primary text-primary" : "text-stone-300"}`} />
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex justify-between text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                      <span>Poor</span><span>Loved it</span>
                    </div>
                  </div>
                )}

                {current.kind === "education" && (
                  <div className="space-y-4">
                    <Labeled id="edu-institute" label="College / Institute" icon={Building2}>
                      <input id="edu-institute" value={edu.institute} onChange={(e) => setEdu({ ...edu, institute: e.target.value })}
                        className={INPUT} placeholder="e.g. JNTUH College of Engineering" autoComplete="organization" />
                    </Labeled>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Labeled id="edu-branch" label="Branch / Stream" icon={BookOpen}>
                        <input id="edu-branch" value={edu.branch} onChange={(e) => setEdu({ ...edu, branch: e.target.value })}
                          className={INPUT} placeholder="e.g. CSE, ECE, Commerce" />
                      </Labeled>
                      <Labeled id="edu-year" label="Year of study" icon={CalendarDays}>
                        <select id="edu-year" value={edu.year} onChange={(e) => setEdu({ ...edu, year: e.target.value })} className={INPUT}>
                          <option value="">Select…</option>
                          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </Labeled>
                    </div>
                    <Labeled id="edu-degree" label="Degree / Course" icon={GraduationCap}>
                      <select id="edu-degree" value={edu.degree} onChange={(e) => setEdu({ ...edu, degree: e.target.value })} className={INPUT}>
                        <option value="">Select…</option>
                        {DEGREES.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </Labeled>
                    <PrimaryBtn onClick={advance} disabled={!edu.institute.trim()}>Continue <ArrowRight className="h-4 w-4" /></PrimaryBtn>
                  </div>
                )}

                {current.kind === "contact" && (
                  <div className="space-y-4">
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
                      value={contact.website} onChange={(e) => setContact({ ...contact, website: e.target.value })}
                      className="absolute -left-[9999px] h-px w-px opacity-0" />
                    <Labeled id="c-name" label="Full name" icon={User} required>
                      <input id="c-name" required value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })}
                        className={INPUT} placeholder="Your name" autoComplete="name" />
                    </Labeled>
                    <Labeled id="c-phone" label="Mobile / WhatsApp" icon={Phone} required>
                      <input id="c-phone" required inputMode="tel" value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                        className={INPUT} placeholder="10-digit number" autoComplete="tel" />
                    </Labeled>
                    <Labeled id="c-email" label="Email" icon={Mail}>
                      <input id="c-email" type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })}
                        className={INPUT} placeholder="you@email.com" autoComplete="email" />
                    </Labeled>
                    {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
                    <PrimaryBtn onClick={submit} disabled={busy}>
                      {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</> : <>Submit <Send className="h-4 w-4" /></>}
                    </PrimaryBtn>
                    <p className="text-center text-xs text-stone-400">Your details stay private — we never sell them.</p>
                  </div>
                )}

                {error && current.kind !== "contact" && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
              </motion.div>
            </AnimatePresence>
          )}

          {/* back */}
          {!ok && clamped > 0 && (
            <button type="button" onClick={back}
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const INPUT = "w-full rounded-xl border-2 border-stone-200 bg-white px-3.5 py-3 text-[15px] text-stone-900 placeholder-stone-400 transition-colors focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15";

function Labeled({ id, label, icon: Icon, required, children }: { id: string; label: string; icon: LucideIcon; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-stone-500">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}{required && <span className="text-primary">*</span>}
      </label>
      {children}
    </div>
  );
}

function PrimaryBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-[16px] font-bold text-white shadow-[0_14px_30px_-12px_hsl(var(--primary)/0.6)] transition-all hover:brightness-105 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30">
      {children}
    </button>
  );
}

function Done({ tier, name, reduce }: { tier: string; name: string; reduce: boolean }) {
  const first = name.trim().split(" ")[0] || "there";
  const MSG: Record<string, string> = {
    hot: "A counsellor will reach out on WhatsApp shortly with a plan tailored to your goals.",
    warm: "We'll send your resources on WhatsApp — keep an eye out for your personalised next steps.",
    nurture: "You're on the list — we'll share free resources and workshops that match your interests.",
    community: "Your input helps us make every session better. You'll hear from us about what's next.",
  };
  return (
    <motion.div initial={reduce ? false : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center py-10 text-center">
      <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-primary text-white shadow-[0_16px_36px_-10px_hsl(var(--primary)/0.7)]">
        <PartyPopper className="h-9 w-9" />
      </div>
      <h1 className="font-display text-2xl font-extrabold text-stone-900 sm:text-3xl">
        Thank you, <span className="font-editorial italic font-medium text-primary">{first}!</span>
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-stone-500">{MSG[tier] ?? MSG.community}</p>
      <a href="https://onrol.in" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-stone-900 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-stone-800">
        Explore ONROL programs <ArrowRight className="h-4 w-4" />
      </a>
    </motion.div>
  );
}
