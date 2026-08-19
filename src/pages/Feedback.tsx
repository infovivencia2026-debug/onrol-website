import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Heart,
  ThumbsUp,
  Meh,
  Frown,
  Sparkles,
  Compass,
  MinusCircle,
  Rocket,
  TrendingUp,
  HelpCircle,
  Zap,
  Bot,
  Clapperboard,
  Coins,
  Target,
  Gem,
  Waves,
  Award,
  Eye,
  MessageCircle,
  Phone,
  Mail,
  User,
  GraduationCap,
  CalendarDays,
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
  Star,
  type LucideIcon,
} from "lucide-react";

import { submitFeedback } from "@/lib/feedbackIntake";

type Choice = { value: string; icon: LucideIcon };
type Step =
  | { kind: "choice"; key: string; title: string; choices: Choice[] }
  | { kind: "rating"; key: string; title: string }
  | { kind: "text"; key: string; title: string; optional?: boolean; placeholder: string }
  | { kind: "contact"; title: string };

const STEPS: Step[] = [
  {
    kind: "choice",
    key: "session",
    title: "How was the session for you?",
    choices: [
      { value: "Loved it", icon: Heart },
      { value: "Good", icon: ThumbsUp },
      { value: "Okay", icon: Meh },
      { value: "Not great", icon: Frown },
    ],
  },
  { kind: "rating", key: "rating", title: "Rate the session (1 = low, 5 = best)" },
  {
    kind: "choice",
    key: "clarity",
    title: "Did the session make AI feel clear and useful for you?",
    choices: [
      { value: "Yes, a lot", icon: Sparkles },
      { value: "Somewhat", icon: Compass },
      { value: "Not really", icon: MinusCircle },
    ],
  },
  {
    kind: "choice",
    key: "confidence",
    title: "After this session, how confident do you feel about using AI in your career?",
    choices: [
      { value: "Very confident", icon: Rocket },
      { value: "Confident", icon: TrendingUp },
      { value: "Neutral", icon: Meh },
      { value: "Still unsure", icon: HelpCircle },
    ],
  },
  {
    kind: "text",
    key: "liked",
    title: "One thing you liked",
    optional: true,
    placeholder: "What stood out for you? (optional)",
  },
  {
    kind: "choice",
    key: "help",
    title: "What do you want AI to help you do?",
    choices: [
      { value: "Make websites and apps", icon: Zap },
      { value: "Do boring work automatically", icon: Bot },
      { value: "Make videos, posts and designs", icon: Clapperboard },
      { value: "Earn money with AI skills", icon: Coins },
      { value: "Get a good job / placement", icon: Target },
    ],
  },
  {
    kind: "choice",
    key: "why",
    title: "Why do you want to learn this?",
    choices: [
      { value: "To make my family proud", icon: Heart },
      { value: "To earn my own money", icon: Coins },
      { value: "To build something of my own", icon: Gem },
      { value: "To not fall behind others", icon: Waves },
    ],
  },
  {
    kind: "choice",
    key: "sixMonths",
    title: "Where do you want to be in 6 months?",
    choices: [
      { value: "Already earning with AI", icon: TrendingUp },
      { value: "Ready for placements with good projects", icon: Award },
      { value: "Learning AI, still deciding", icon: Compass },
      { value: "Just want to know more", icon: Eye },
    ],
  },
  {
    kind: "choice",
    key: "contactMethod",
    title: "How should we contact you?",
    choices: [
      { value: "WhatsApp", icon: MessageCircle },
      { value: "Phone call", icon: Phone },
      { value: "Email", icon: Mail },
    ],
  },
  { kind: "contact", title: "A little about you" },
];

const QUESTION_COUNT = STEPS.length - 1; // last step is the contact form

export default function Feedback() {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contact, setContact] = useState({ name: "", branch: "", year: "", phone: "", email: "", website: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const current = STEPS[step];
  const progress = Math.round(((step + (isSuccess ? 1 : 0)) / STEPS.length) * 100);

  const answer = (key: string, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setError("");
    window.setTimeout(() => setStep((s) => Math.min(STEPS.length - 1, s + 1)), reduceMotion ? 0 : 220);
  };

  const goNext = () => {
    setError("");
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.name.trim() || !contact.phone.trim() || !contact.email.trim()) {
      setError("Please add your name, phone, and email so our team can reach you.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      // Posts to the CRM (go.onrol.in) isolated feedback pipeline. See
      // src/lib/feedbackIntake.ts for the field mapping.
      await submitFeedback({
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        branch: contact.branch,
        year: contact.year,
        website: contact.website, // honeypot
        session: answers.session,
        rating: answers.rating,
        clarity: answers.clarity,
        confidence: answers.confidence,
        liked: answers.liked,
        help: answers.help,
        why: answers.why,
        sixMonths: answers.sixMonths,
        contactMethod: answers.contactMethod,
      });
      setIsSuccess(true);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const slide = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -40 },
        transition: { duration: 0.28, ease: "easeOut" as const },
      };

  const inputClass =
    "w-full appearance-none !bg-white border border-slate-200 rounded-xl !pl-12 !pr-4 !py-3.5 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all placeholder-slate-400";

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#f7f8fc] to-[#eceef5] text-slate-900 overflow-hidden font-sans flex items-center justify-center p-4 sm:p-6 [color-scheme:light]">
      {/* Ambient soft color washes */}
      <div aria-hidden className="absolute top-[-12%] left-[-10%] w-[42vw] h-[42vw] bg-purple-300/35 rounded-full filter blur-[130px] animate-pulse" />
      <div aria-hidden className="absolute bottom-[-12%] right-[-10%] w-[42vw] h-[42vw] bg-orange-300/35 rounded-full filter blur-[130px] animate-pulse delay-1000" />
      <div aria-hidden className="absolute top-[22%] right-[12%] w-[30vw] h-[30vw] bg-emerald-300/25 rounded-full filter blur-[110px] animate-pulse delay-700" />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-2xl rounded-[2rem] sm:rounded-[2.5rem] bg-white/80 backdrop-blur-2xl border border-black/[0.06] shadow-[0_24px_70px_-24px_rgba(15,23,42,0.22)] p-6 sm:p-10 md:p-12 overflow-hidden ring-1 ring-black/5"
      >
        {!isSuccess && (
          <>
            {/* Title */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Start your AI <span className="text-orange-500">Journey</span>
              </h1>
              <p className="mt-2 text-sm text-slate-500">Please fill this before you leave — it takes about a minute.</p>
            </div>

            {/* Progress bar */}
            <div className="mb-8" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Form progress">
              <div className="flex items-center justify-between mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <span>{current.kind === "contact" ? "Almost there" : `Question ${step + 1} of ${QUESTION_COUNT}`}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-orange-400"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={`step-${step}`} {...slide}>
                {/* ── Choice question ─────────────────────────────── */}
                {current.kind === "choice" && (
                  <fieldset>
                    <legend className="text-lg sm:text-xl font-bold text-slate-900 mb-5 leading-snug">{current.title}</legend>
                    <div className="space-y-3">
                      {current.choices.map((choice, i) => {
                        const Icon = choice.icon;
                        const selected = answers[current.key] === choice.value;
                        return (
                          <motion.button
                            key={choice.value}
                            type="button"
                            onClick={() => answer(current.key, choice.value)}
                            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: reduceMotion ? 0 : i * 0.05, duration: 0.25 }}
                            className={`group w-full min-h-[56px] flex items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                              selected
                                ? "border-purple-400 bg-purple-50 shadow-[0_10px_30px_-12px_rgba(147,51,234,0.4)]"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span className={`grid place-items-center w-10 h-10 shrink-0 rounded-xl transition-colors ${selected ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-500 group-hover:text-slate-700"}`}>
                              <Icon className="w-5 h-5" />
                            </span>
                            <span className="flex-1 text-[15px] font-medium text-slate-800">{choice.value}</span>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </motion.button>
                        );
                      })}
                    </div>
                  </fieldset>
                )}

                {/* ── Rating 1–5 ──────────────────────────────────── */}
                {current.kind === "rating" && (
                  <fieldset>
                    <legend className="text-lg sm:text-xl font-bold text-slate-900 mb-5 leading-snug">{current.title}</legend>
                    <div className="flex gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map((num) => {
                        const selected = answers.rating === String(num);
                        return (
                          <button
                            key={num}
                            type="button"
                            aria-label={`Rate ${num} out of 5`}
                            onClick={() => answer("rating", String(num))}
                            className={`flex-1 h-16 rounded-2xl border flex flex-col items-center justify-center gap-1 font-bold text-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                              selected
                                ? "border-purple-400 bg-purple-600 text-white shadow-[0_10px_30px_-10px_rgba(147,51,234,0.5)]"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <Star className={`w-4 h-4 ${selected ? "fill-white text-white" : "text-slate-300"}`} />
                            {num}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 flex justify-between text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      <span>Low</span>
                      <span>Best</span>
                    </p>
                  </fieldset>
                )}

                {/* ── Optional text ───────────────────────────────── */}
                {current.kind === "text" && (
                  <div>
                    <label htmlFor="q-text" className="block text-lg sm:text-xl font-bold text-slate-900 mb-4 leading-snug">
                      {current.title} {current.optional && <span className="text-sm font-medium text-slate-400">(optional)</span>}
                    </label>
                    <textarea
                      id="q-text"
                      rows={3}
                      value={answers[current.key] || ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [current.key]: e.target.value }))}
                      className="w-full appearance-none !bg-white border border-slate-200 rounded-2xl !px-4 !py-3.5 text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/25 transition-all placeholder-slate-400 resize-none"
                      placeholder={current.placeholder}
                    />
                    <button
                      type="button"
                      onClick={goNext}
                      className="mt-5 w-full py-3.5 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* ── Contact / details ───────────────────────────── */}
                {current.kind === "contact" && (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Honeypot — bots fill hidden fields; humans never see it. */}
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      value={contact.website}
                      onChange={(e) => setContact({ ...contact, website: e.target.value })}
                      style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
                    />
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">Almost done — how do we reach you?</h2>
                    <p className="text-sm text-slate-500 mb-4">Our team will call and help you take the first step.</p>

                    <div>
                      <label htmlFor="c-name" className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Name *</label>
                      <div className="relative">
                        <User aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input id="c-name" type="text" autoComplete="name" required value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={inputClass} placeholder="Your name" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="c-branch" className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Branch</label>
                        <div className="relative">
                          <GraduationCap aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input id="c-branch" type="text" value={contact.branch} onChange={(e) => setContact({ ...contact, branch: e.target.value })} className={inputClass} placeholder="e.g. CSE / IT" />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="c-year" className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Year</label>
                        <div className="relative">
                          <CalendarDays aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                          <input id="c-year" type="text" value={contact.year} onChange={(e) => setContact({ ...contact, year: e.target.value })} className={inputClass} placeholder="e.g. 2nd year" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="c-phone" className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Phone / WhatsApp *</label>
                      <div className="relative">
                        <Phone aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input id="c-phone" type="tel" autoComplete="tel" inputMode="tel" required value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={inputClass} placeholder="+91 98765 43210" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="c-email" className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Email *</label>
                      <div className="relative">
                        <Mail aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input id="c-email" type="email" autoComplete="email" inputMode="email" required value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={inputClass} placeholder="you@email.com" />
                      </div>
                    </div>

                    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_14px_30px_-12px_rgba(15,23,42,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
                      ) : (
                        <>Start my AI journey <Send className="w-5 h-5 ml-1" /></>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Back control */}
            {step > 0 && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg px-2 py-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>
            )}
          </>
        )}

        {isSuccess && (
          <motion.div
            key="success"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.25)]">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Done, {contact.name.split(" ")[0] || "welcome"}! 🎉</h2>
            <p className="text-slate-500 max-w-md">
              Our team will call you soon and help you take the first step in your AI career. Welcome aboard!
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
