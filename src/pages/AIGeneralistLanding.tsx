// AI Generalist marketing landing — distributed via QR + paid funnels.
//
// Route: /ai-generalist
//
// Differs from /programs/ai-generalist/:
//   - No global navbar/footer (handled in App.tsx hideGlobalNavbar list)
//   - Single-page funnel: one screenful pitch, two CTAs (Reserve Masterclass + Get Brochure)
//   - Self-contained modals (brochure download is gated behind name/phone/email form)
//
// SEO indexable so it can also rank for branded queries like
// "ONROL AI Generalist", "AI Generalist India" etc.

import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Download,
  Mail,
  Phone,
  Rocket,
  Sparkles,
  User,
  X,
} from "lucide-react";
import SEO from "@/components/seo/SEO";
import { courseJsonLd, breadcrumbJsonLd } from "@/lib/structuredData";
import { founderJsonLd } from "@/lib/founder";
import { submitBrochureRequest } from "@/lib/intake";
import { syncMasterclassSubmissionToSheet } from "@/lib/masterclassSheetSync";
import brochurePdf from "@/assets/Onrol Brochure new.pdf";

const STATS = [
  { v: "3 Months", l: "Live Program", c: "text-orange-400" },
  { v: "5 AI Systems", l: "You Will Build", c: "text-orange-400" },
  { v: "Beginner Friendly", l: "No Coding Needed", c: "text-purple-400" },
  { v: "Portfolio Ready", l: "Real Projects, Real Proof", c: "text-green-400" },
];

const BUILDS = [
  { title: "AI Websites & Apps", desc: "Build sharp websites and AI-powered apps." },
  { title: "AI Automations", desc: "Automate tasks and workflows that save hours." },
  { title: "AI Chatbots", desc: "Build smart chatbots that engage and convert." },
  { title: "AI Agents", desc: "Create AI agents that work and take action." },
  { title: "Client Systems", desc: "Build end-to-end systems for real businesses." },
  { title: "Portfolio & Presence", desc: "Build your online presence and get client-ready." },
];

const FOR_WHO = [
  "Students",
  "Job Seekers",
  "Freelancers",
  "Creators",
  "Entrepreneurs",
  "Working Professionals",
];

const COMPARISONS: [string, string][] = [
  ["Theory heavy", "Project focused"],
  ["Watch videos", "Build daily"],
  ["No portfolio", "Real projects"],
  ["No execution", "Monetization systems"],
  ["No client exposure", "Client-ready workflows"],
];

const FAQ = [
  { q: "Who is AI Generalist for?", a: "Working professionals, students, freelancers, founders, and creators who want to ship real AI work, not just learn theory. Zero coding required." },
  { q: "How is it different from a YouTube playlist or self-paced video course?", a: "Live cohort with mentors, daily build sessions, and deployed projects you can show. You do not just watch. You ship." },
  { q: "What if I miss a session?", a: "All live sessions are recorded for cohort members. Mentors hold catch-up office hours so you do not fall behind." },
  { q: "Will I get a certificate?", a: "You get a portfolio of live AI projects under your name, plus a verified completion certificate." },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function AIGeneralistLanding() {
  const [reserveOpen, setReserveOpen] = useState(false);
  const [brochureOpen, setBrochureOpen] = useState(false);

  return (
    <>
      <SEO
        title="ONROL AI Generalist — Your Roadmap to a Future Proof AI Career"
        description="Direct landing page for ONROL's AI Generalist program. Reserve your free 90-minute Masterclass or download the brochure in 30 seconds. India-priced, 3-month live cohort, beginner-friendly, no coding required, 5 AI systems shipped."
        path="/ai-generalist/"
        image="https://onrol.in/og/programs.png"
        jsonLd={[
          courseJsonLd({
            name: "AI Generalist",
            description:
              "3-month live AI cohort. Build 5 AI systems with no coding. Includes websites, automations, chatbots, agents, client-ready workflows, and a deployed portfolio.",
            url: "https://onrol.in/ai-generalist/",
            duration: "P3M",
            courseMode: "Online",
            educationalLevel: "Beginner",
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "AI Generalist", href: "/ai-generalist/" },
          ]),
          founderJsonLd(),
          FAQ_JSONLD,
        ]}
      />

      <main className="min-h-screen overflow-x-hidden bg-[#f3f5f8] text-white antialiased">
        <PageStyles />

        {/* ── HERO ───────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pb-12 pt-16 sm:pb-16 sm:pt-20">
          <div className="grid-bg absolute inset-0 opacity-40" />
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-orange-500/15 blur-3xl" />
          <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-5xl px-5 text-center sm:px-8">
            <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400 transition hover:text-orange-300">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-orange-500/15 text-orange-400">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              ONROL · India's AI Execution School
            </Link>

            <h1 className="mb-4 text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Become an
              <br />
              <span className="gradient-text">AI Generalist</span> in 3 Months
            </h1>

            <p className="mx-auto mb-4 max-w-2xl text-lg italic text-orange-300 sm:text-xl">
              Your Roadmap to a Future Proof AI Career
            </p>

            <p className="mx-auto mb-3 max-w-2xl text-base text-slate-300 sm:text-lg">
              Build AI systems, automations, chatbots, AI agents, and client-ready projects.
            </p>
            <p className="mx-auto mb-9 max-w-2xl text-sm text-slate-400 sm:text-base">
              The fastest path from learning AI to building real-world systems and earning.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setReserveOpen(true)}
                className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/40 sm:px-7"
              >
                <Rocket className="h-4 w-4 transition-transform group-hover:rotate-12" />
                Reserve Free Masterclass
              </button>
              <button
                type="button"
                onClick={() => setBrochureOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-6 py-3.5 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10 sm:px-7"
              >
                <Download className="h-4 w-4" />
                Download Brochure
              </button>
            </div>
          </div>
        </section>

        {/* ── STATS ──────────────────────────────────────────────────── */}
        <section className="relative mx-auto mb-16 max-w-6xl px-5 sm:px-8">
          <div className="grid grid-cols-2 gap-6 rounded-2xl border border-white/8 bg-gradient-to-r from-[#404040] to-[#f3f5f8] p-6 sm:p-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.l} className="flex flex-col items-center justify-center text-center">
                <div className={`mb-1.5 text-2xl font-extrabold leading-tight sm:text-3xl ${s.c}`}>{s.v}</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:text-xs">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── IN 3 MONTHS ──────────────────────────────────────────────── */}
        <section className="mx-auto mb-16 max-w-6xl px-5 sm:px-8">
          <h2 className="mb-8 text-center text-3xl font-extrabold text-orange-400 sm:text-4xl">
            In 3 Months, You'll Build
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {BUILDS.map((b) => (
              <div key={b.title} className="card-hover h-full rounded-xl border border-white/8 bg-[#404040] p-4 sm:p-5">
                <h3 className="mb-2 text-sm font-bold leading-snug text-white sm:text-base">{b.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400 sm:text-[13px]">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── WHO IS THIS FOR ────────────────────────────────────────── */}
        <section className="mx-auto mb-16 max-w-6xl px-5 sm:px-8">
          <h2 className="mb-6 text-center text-4xl font-extrabold leading-tight tracking-tight text-orange-400 sm:text-5xl">
            Who Is This For?
          </h2>
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2.5">
            {FOR_WHO.map((p) => (
              <span key={p} className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200">
                {p}
              </span>
            ))}
          </div>
        </section>

        {/* ── COMPARISON ─────────────────────────────────────────────── */}
        <section className="mx-auto mb-16 max-w-6xl px-5 sm:px-8">
          <h2 className="mb-8 text-center text-3xl font-extrabold sm:text-4xl">
            Stop Watching Tutorials. Start Building.
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-b from-red-950/30 to-[#404040]">
              <div className="border-b border-red-500/20 bg-red-500/10 p-5 text-center">
                <h3 className="text-lg font-medium uppercase tracking-wide text-red-300 sm:text-xl">
                  Traditional Courses
                </h3>
              </div>
              <ul className="divide-y divide-red-500/15">
                {COMPARISONS.map((row) => (
                  <li key={`trad-${row[0]}`} className="flex items-center gap-3 p-4 sm:p-5">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                      <X className="h-4 w-4" strokeWidth={3} />
                    </span>
                    <span className="text-[15px] font-medium text-slate-300 sm:text-base">{row[0]}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-green-500/40 bg-gradient-to-b from-green-950/30 to-[#404040]">
              <div className="border-b border-green-500/25 bg-green-500/10 p-5 text-center">
                <h3 className="text-lg font-medium uppercase tracking-wide text-green-300 sm:text-xl">
                  ONROL AI Generalist
                </h3>
              </div>
              <ul className="divide-y divide-green-500/15">
                {COMPARISONS.map((row) => (
                  <li key={`onrol-${row[1]}`} className="flex items-center gap-3 p-4 sm:p-5">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
                      <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
                    </span>
                    <span className="text-[15px] font-semibold text-white sm:text-base">{row[1]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ──────────────────────────────────────────────── */}
        <section className="mx-auto mb-12 max-w-6xl px-5 sm:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-[#404040] to-[#f3f5f8] p-6 sm:p-10">
            <div className="grid-bg absolute inset-0 opacity-30" />
            <div className="absolute bottom-2 right-6 h-32 w-32 rounded-full bg-orange-500/20 blur-3xl" />
            <div className="relative text-center">
              <h3 className="mx-auto mb-3 max-w-2xl text-2xl font-extrabold leading-tight sm:text-3xl lg:text-4xl">
                Stop Learning AI. <span className="gradient-text">Start Building</span> With It.
              </h3>
              <p className="mx-auto mb-6 max-w-md text-slate-400">
                Join the AI Generalist Career Accelerator and build real AI systems with confidence.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setReserveOpen(true)}
                  className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/40"
                >
                  <Rocket className="h-4 w-4 transition-transform group-hover:rotate-12" />
                  Reserve Free Masterclass
                </button>
                <button
                  type="button"
                  onClick={() => setBrochureOpen(true)}
                  className="flex items-center gap-2 rounded-lg border border-white/12 bg-white/5 px-6 py-3.5 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />
                  Download Brochure
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── MICRO FOOTER (legal only — no full site nav) ───────────── */}
        <footer className="mx-auto max-w-6xl px-5 pb-10 pt-6 text-center text-xs text-slate-500 sm:px-8">
          <p>© {new Date().getFullYear()} ONROL. All rights reserved.</p>
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link to="/privacy-policy/" className="hover:text-slate-300">Privacy</Link>
            <Link to="/terms-and-conditions/" className="hover:text-slate-300">Terms</Link>
            <Link to="/refund-policy/" className="hover:text-slate-300">Refund</Link>
            <Link to="/contact/" className="hover:text-slate-300">Contact</Link>
            <Link to="/programs/ai-generalist/" className="hover:text-slate-300">Full program details</Link>
          </div>
        </footer>

        <ReserveModal open={reserveOpen} onClose={() => setReserveOpen(false)} />
        <BrochureModal open={brochureOpen} onClose={() => setBrochureOpen(false)} />
      </main>
    </>
  );
}

// ── Modals (self-contained — duplicated from /programs/ai-generalist intentionally ──
// so the landing page is a single file, easy to A/B-test in the future) ─────────

function ReserveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", background: "Student" });
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    try {
      const email = form.email.trim().toLowerCase();
      await submitBrochureRequest({
        fullName: form.name.trim(),
        email,
        phone: form.phone.trim(),
        role: form.background,
        source: "ai-generalist-landing-masterclass",
      });
      syncMasterclassSubmissionToSheet({
        full_name: form.name.trim(),
        email,
        phone: form.phone.trim(),
        current_role: form.background,
        source: "ai-generalist-landing-masterclass",
      });
      window.location.href = "/thanks/masterclass/";
    } catch (error) {
      console.warn("AI Generalist landing masterclass registration failed:", error);
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close registration modal" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-[modalIn_0.3s_ease-out] rounded-2xl border border-white/10 bg-gradient-to-br from-[#404040] to-[#f3f5f8] p-6 shadow-2xl sm:p-7">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-white hover:bg-white/10" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="mb-1 flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-orange-400" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">Free Masterclass</span>
        </div>
        <h3 className="mb-1 text-2xl font-bold text-white">Reserve Your Seat</h3>
        <p className="mb-5 text-sm text-slate-400">Get the next cohort details and brochure by email.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field icon={<User className="h-4 w-4" />} name="name" type="text" placeholder="Full name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} required />
          <Field icon={<Mail className="h-4 w-4" />} name="email" type="email" placeholder="Email address" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} required />
          <Field icon={<Phone className="h-4 w-4" />} name="phone" type="tel" placeholder="Phone number" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} required />
          <label className="block">
            <span className="mb-1.5 block text-xs text-slate-400">I am a...</span>
            <select
              name="background"
              value={form.background}
              onChange={(e) => setForm((p) => ({ ...p, background: e.target.value }))}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              {["Student", "Job Seeker", "Freelancer", "Creator", "Entrepreneur", "Working Professional"].map((opt) => (
                <option key={opt} className="bg-[#404040]">{opt}</option>
              ))}
            </select>
          </label>
          {status === "error" ? <p className="text-xs text-red-400">Something went wrong. Please try again.</p> : null}
          <button
            type="submit"
            disabled={status === "sending"}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-orange-500/40 disabled:opacity-60"
          >
            {status === "sending" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Reserving…
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Reserve My Seat
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-500">By submitting, you agree to receive program updates from ONROL.</p>
        </form>
      </div>
    </div>
  );
}

function BrochureModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [open]);

  if (!open) return null;

  const triggerDownload = () => {
    const link = document.createElement("a");
    link.href = brochurePdf;
    link.download = "ONROL-AI-Generalist-Brochure.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    try {
      const email = form.email.trim().toLowerCase();
      await submitBrochureRequest({
        fullName: form.name.trim(),
        email,
        phone: form.phone.trim(),
        source: "ai-generalist-landing-brochure",
      });
      triggerDownload();
      onClose();
      setForm({ name: "", email: "", phone: "" });
      setStatus("idle");
    } catch (error) {
      console.warn("AI Generalist landing brochure request failed:", error);
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close brochure modal" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-[modalIn_0.3s_ease-out] rounded-2xl border border-white/10 bg-gradient-to-br from-[#404040] to-[#f3f5f8] p-6 shadow-2xl sm:p-7">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-white hover:bg-white/10" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
        <div className="mb-1 flex items-center gap-3">
          <Download className="h-5 w-5 text-orange-400" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-400">Brochure</span>
        </div>
        <h3 className="mb-1 text-2xl font-bold text-white">Get the AI Generalist Brochure</h3>
        <p className="mb-5 text-sm text-slate-400">Share your details and we'll start the download instantly.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field icon={<User className="h-4 w-4" />} name="name" type="text" placeholder="Full name" value={form.name} onChange={(v) => setForm((p) => ({ ...p, name: v }))} required />
          <Field icon={<Mail className="h-4 w-4" />} name="email" type="email" placeholder="Email address" value={form.email} onChange={(v) => setForm((p) => ({ ...p, email: v }))} required />
          <Field icon={<Phone className="h-4 w-4" />} name="phone" type="tel" placeholder="Phone number" value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} required />
          {status === "error" ? <p className="text-xs text-red-400">Something went wrong. Please try again.</p> : null}
          <button
            type="submit"
            disabled={status === "sending"}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 py-3 font-semibold text-white transition-all hover:shadow-lg hover:shadow-orange-500/40 disabled:opacity-60"
          >
            {status === "sending" ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Preparing…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download Brochure
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-500">By submitting, you agree to receive program updates from ONROL.</p>
        </form>
      </div>
    </div>
  );
}

function Field({
  icon, value, onChange, ...props
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      />
    </div>
  );
}

function PageStyles() {
  return (
    <style>{`
      @keyframes modalIn { from{opacity:0;transform:scale(.94) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
      @keyframes gradientShift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
      }
      .gradient-text {
        background: linear-gradient(90deg, #fb923c, #f97316, #ea580c, #fb923c);
        background-size: 200% 100%;
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: gradientShift 4s ease infinite;
      }
      .grid-bg {
        background-image:
          linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
        background-size: 40px 40px;
      }
      .card-hover { transition: transform .35s ease, border-color .35s ease, box-shadow .35s ease, background-color .35s ease; }
      .card-hover:hover { transform: translateY(-4px); border-color: rgba(255,255,255,.15); box-shadow: 0 10px 30px -10px rgba(249,115,22,.15); }
    `}</style>
  );
}
