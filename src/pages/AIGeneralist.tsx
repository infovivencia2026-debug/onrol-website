import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Zap,
  Users,
  Briefcase,
  Bot,
  Search,
  Brain,
  CheckCircle2,
  X,
  GraduationCap,
  UserRound,
  Building2,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import SEO from "@/components/seo/SEO";
import Footer from "@/components/shared/Footer";
import { courseJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/structuredData";
import { founderJsonLd } from "@/lib/founder";
import { programsData } from "@/lib/programData";
import { Page } from "@/components/system/grid";

const AI_GENERALIST_FAQ = [
  { q: "Who is AI Generalist for?", a: "Working professionals, students, freelancers, founders, and creators who want to ship real AI work, not just learn theory. Zero coding required." },
  { q: "How is it different from a YouTube playlist or self-paced video course?", a: "Live cohort with mentors, daily build sessions, and deployed projects you can show. You do not just watch. You ship." },
  { q: "What if I miss a session?", a: "All live sessions are recorded for cohort members. Mentors hold catch-up office hours so you do not fall behind." },
  { q: "Will I get certificates?", a: "You get a portfolio of live AI projects under your name, plus a verified completion certificate." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
} as const;

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
} as const;

const buildSystems = [
  { icon: Zap, title: "AI Automation System", text: "Capture leads, send follow-ups & run operations on autopilot with n8n." },
  { icon: Brain, title: "Websites & AI Apps", text: "Portfolio sites, funnels & AI mini-apps built with vibe coding (Lovable)." },
  { icon: Bot, title: "AI Agents", text: "Autonomous agents that research, qualify leads & generate content for you." },
  { icon: CalendarDays, title: "AI Content & Videos", text: "AI reels, carousels, brand images & voiceovers (Canva, Higgsfield)." },
  { icon: Users, title: "AI Chatbots", text: "WhatsApp, website & Telegram chatbots every business wants to deploy." },
];

const modules = [
  { number: "Module 1", title: "AI Foundations + Prompting + Diffusion", items: ["AI Intro, Ethics & LLMs", "Prompt Engineering", "Diffusion Models — Image Generation", "AI Video & Audio Generation"], days: "Weeks 1–3" },
  { number: "Module 2", title: "Automation + Workflows", items: ["Automation Frameworks", "n8n, Zapier & Make", "WhatsApp, Email & Telegram", "APIs & Integrations"], days: "Weeks 4–5" },
  { number: "Module 3", title: "AI Agents + Agentic Workflows", items: ["Single AI Agents", "Multi-Agent Systems", "RAG Basics", "Agentic Frameworks"], days: "Weeks 6–8" },
  { number: "Module 4", title: "Vibe Coding + App Development", items: ["Vibe Coding with Lovable", "AI App Development", "Full-Stack with AI", "Backend, Database, Auth & Deploy"], days: "Weeks 9–10" },
  { number: "Module 5", title: "Claude Ecosystem + Career", items: ["Claude Skills, Code & Connectors", "OpenAI Ecosystem", "Portfolio & Freelancing", "AI Career Roadmap"], days: "Weeks 11–12" },
];

const audience = [
  { icon: GraduationCap, title: "Students", text: "Build career-ready skills and stand out." },
  { icon: Briefcase, title: "Job Seekers", text: "Add AI skills and get hired faster." },
  { icon: UserRound, title: "Working Professionals", text: "Automate work and grow faster." },
  { icon: Building2, title: "Entrepreneurs", text: "Build systems and scale your business." },
  { icon: Rocket, title: "Creators & Freelancers", text: "Build income systems and get clients." },
];

const outcomes: [string, string][] = [
  ["A Complete AI Portfolio", "7+ real-world AI projects"],
  ["5 AI Systems", "Fully functional and ready to use"],
  ["AI Automations", "Save 10+ hours every week"],
  ["AI Chatbots", "Trained for real business use"],
  ["AI Agent", "Your personal AI assistant"],
  ["Freelance Presence", "Profile, portfolio & positioning"],
  ["Outreach System", "To get clients consistently"],
  ["ONROL Certificate", "To showcase your skills"],
];

const comparison: [string, string][] = [
  ["Theory Heavy", "100% Practical, Project-Based"],
  ["Passive Learning", "Build Real AI Systems"],
  ["No Real Portfolio", "7+ Real Projects Portfolio"],
  ["No Automation Focus", "Automation-First Approach"],
  ["No Freelance Training", "Freelance & Income Focused"],
  ["Generic Content", "AI Tools + Real Business Use"],
  ["No Mentorship", "Mentorship + Community Support"],
];

const AIGeneralist = () => {
  const p = programsData["ai-generalist"];
  const navigate = useNavigate();
  // Registration is captured on the /programs gate. Other cohort CTAs open the
  // canonical masterclass form on the home page.
  const openMasterclass = () => navigate("/programs/");

  return (
    <>
      <SEO
        title="AI Generalist — 3-Month Career Accelerator | ONROL"
        description="Become an AI Generalist in 3 months. Build 5 AI systems, 7+ real projects, and a portfolio that gets you hired, clients, or freelance income."
        path="/programs/ai-generalist/"
        image="https://onrol.in/og/programs.png"
        jsonLd={[
          courseJsonLd({
            name: "AI Generalist Career Accelerator",
            description: p.heroSubheadline + " " + p.heroSupportLine,
            url: "https://onrol.in/programs/ai-generalist/",
            duration: "P3M",
            educationalLevel: "Beginner",
            courseMode: "Online",
            startDate: "2026-08-04",
            occupationalCategory: "AI Practitioner / Generalist",
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Programs", href: "/programs" },
            { name: "AI Generalist", href: "/programs/ai-generalist" },
          ]),
          founderJsonLd(),
          faqJsonLd(AI_GENERALIST_FAQ),
        ]}
      />

      <main className="ai-generalist-page min-h-screen overflow-x-hidden bg-white text-[#111827] antialiased">
        <PageStyles />

        <div className="px-3 pt-16 sm:px-5 sm:pt-[72px] lg:px-8">
          <Page className="divide-y divide-black/10">
            <HeroSection />
            <PositioningBanner />
            <BuildSystemsSection />
            <JourneySection />
            <AudienceSection />
            <OutcomesSection />
            <ComparisonSection />
            <FinalCtaSection onReserve={openMasterclass} />
          </Page>
        </div>

        <Footer />
      </main>
    </>
  );
};

export default AIGeneralist;

/* ───────────────────────────── HERO ───────────────────────────── */
function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden px-5 py-16 sm:min-h-[calc(100svh-72px)] lg:px-8">
      {/* Full-bleed AI Generalist hero background. AVIF/WebP/JPG fallback
          via <picture>; positioned absolute + object-cover so it fills
          the entire section regardless of viewport aspect. No scrim or
          tint overlay by design — the photo composition handles its
          own legibility for the foreground content.

          z-0 on the picture + z-10 on the content wrapper (below) is
          the safer pattern: a negative z-index can place an element
          BEHIND an ancestor with its own stacking context, which on
          some browsers caused the photo to be hidden behind <main>'s
          cream background. Keeping both inside the section's
          coordinate space avoids that ambiguity. */}
      <picture aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <source srcSet="/aig-hero-bg.avif" type="image/avif" />
        <source srcSet="/aig-hero-bg.webp" type="image/webp" />
        <img
          src="/aig-hero-bg.jpg"
          alt=""
          width={2200}
          height={980}
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </picture>
      {/* Soft white scrim so the black headline stays legible over the light photo. */}
      <div aria-hidden className="absolute inset-0 z-0 bg-gradient-to-b from-white/85 via-white/55 to-white/40 md:bg-gradient-to-r md:from-white/85 md:via-white/55 md:to-transparent" />
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-y-10 lg:grid-cols-2 lg:gap-x-14"
      >
        <motion.div variants={fadeUp}>
          {/* Black headline on the light image (orange accent on the program name). */}
          <h1
            className="font-black uppercase leading-[0.95] tracking-tight text-[#0A0A0A]"
            style={{ fontFamily: '"Fira Sans", system-ui, sans-serif', fontSize: "clamp(40px, 7vw, 82px)" }}
          >
            <span className="block text-[0.56em] font-extrabold">Become an</span>
            <span className="block text-[#f46718]">AI Generalist</span>
            <span className="block">in 3 Months</span>
          </h1>
          <p className="mt-6 max-w-xl text-[16px] font-medium leading-7 text-black/70 md:text-[18px] md:leading-8">
            Go from curious beginner to AI Generalist. Build 5 AI systems, 7+ projects, and a portfolio that gets you hired, clients, or freelance income.
          </p>
        </motion.div>

        {/* Form — right column */}
        <div>
          <InlineRegistrationForm />
        </div>
      </motion.div>
    </section>
  );
}


/* ─────────── INLINE REGISTRATION FORM ───────────
   EXACT same submission flow as /landingpage/aigeneralist/ hero form:
   1. POST to https://go.onrol.in/api/public/leads (ONROL CRM)
   2. Fire-and-forget POST to the Apps Script webhook (Google Sheet)
   3. Redirect to /landingpage/aigeneralist/roadmap.html on success
   Mirrors fields + payload + honeypot from the landing page form. */
const APPS_SCRIPT_WEBHOOK_URL =
  (import.meta as unknown as { env?: { VITE_APPS_SCRIPT_CAREER_CATALYST_URL?: string } }).env
    ?.VITE_APPS_SCRIPT_CAREER_CATALYST_URL ?? "";

function InlineRegistrationForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "", honey: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState("");

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  function syncToSheet(payload: Record<string, unknown>) {
    if (!APPS_SCRIPT_WEBHOOK_URL) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const enriched = {
        ...payload,
        form_type: "aigeneralist",
        page_path: window.location.pathname,
        referrer: document.referrer || "",
        user_agent: navigator.userAgent || "",
        utm_source: params.get("utm_source") || "",
        utm_medium: params.get("utm_medium") || "",
        utm_campaign: params.get("utm_campaign") || "aigeneralist",
      };
      // text/plain dodges CORS preflight; no-cors → opaque response (we only need the side-effect).
      fetch(APPS_SCRIPT_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(enriched),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* analytics never breaks the form */
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.honey) return; // honeypot tripped — silently drop
    setError("");
    setStatus("sending");
    const data = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      tag: "bulk",
      source: "AI Generalist landing",
      campaign: "aigeneralist",
      notes: form.role ? "role: " + form.role : "",
    };
    try {
      const res = await fetch("https://go.onrol.in/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (res.status === 429) throw new Error("Too many submissions — please wait a minute and try again.");
        throw new Error("Submission failed (" + res.status + ")");
      }
      syncToSheet(data); // mirror to Google Sheet (fire-and-forget)
      window.location.assign("/landingpage/aigeneralist/roadmap.html");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed — please try again.";
      setError(msg);
      setStatus("error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-full border border-black/10 bg-white p-7 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.4)] sm:p-9"
    >
      <h3 className="text-[24px] font-black leading-tight tracking-tight text-gray-950 sm:text-[28px]">
        Get the AI Generalist brochure.
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
        Fees, schedule, and the full cohort guide &mdash; in your WhatsApp within 24 hours.
      </p>

      <form onSubmit={handleSubmit} autoComplete="on" noValidate className="mt-5 space-y-3.5">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-600">Full Name</span>
          <input
            name="name"
            type="text"
            required
            placeholder="Your name"
            autoComplete="name"
            value={form.name}
            onChange={update("name")}
            className="h-11 w-full  border border-gray-200 bg-white px-3.5 text-[16px] sm:text-[14px] font-medium text-gray-900 placeholder:text-black/55 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-600">Phone (WhatsApp)</span>
          <input
            name="phone"
            type="tel"
            required
            placeholder="+91 9XXXX XXXXX"
            autoComplete="tel"
            inputMode="tel"
            value={form.phone}
            onChange={update("phone")}
            className="h-11 w-full  border border-gray-200 bg-white px-3.5 text-[16px] sm:text-[14px] font-medium text-gray-900 placeholder:text-black/55 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-600">Email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            className="h-11 w-full  border border-gray-200 bg-white px-3.5 text-[16px] sm:text-[14px] font-medium text-gray-900 placeholder:text-black/55 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-600">I am a</span>
          <select
            name="role"
            value={form.role}
            onChange={update("role")}
            className="h-11 w-full  border border-gray-200 bg-white px-3 text-[16px] sm:text-[14px] font-medium text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          >
            <option value="">Pick one</option>
            <option value="student">Student</option>
            <option value="working-pro">Working Professional</option>
            <option value="freelancer">Freelancer / Creator</option>
            <option value="founder">Founder / SMB Owner</option>
            <option value="other">Other</option>
          </select>
        </label>

        {/* Honeypot — real users leave this empty; bots fill it. */}
        <input
          type="text"
          name="honey"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={form.honey}
          onChange={update("honey")}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        />

        {status === "error" && error ? (
          <p role="alert" className=" border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={status === "sending"}
          className="group inline-flex h-12 w-full items-center justify-center gap-2  bg-[#f46718] px-5 text-[14px] font-medium uppercase tracking-wider text-[#0A0A0A] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {status === "sending" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Sending…
            </>
          ) : (
            <>
              Send me the brochure <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-[11.5px] leading-relaxed text-gray-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          No spam. Used only to confirm your seat.
        </p>
      </form>
    </motion.div>
  );
}

/* ───────────────────────────── POSITIONING BANNER ───────────────────────────── */
function PositioningBanner() {
  return (
    <section className="px-5 py-8 lg:px-8">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mx-auto max-w-7xl  border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-orange-50 p-6 text-center shadow-sm md:p-10"
      >
        <h2 className="text-2xl font-black text-[#f46718]">No Other AI Program Is Built Like This</h2>
        <p className="mx-auto mt-4 max-w-3xl text-gray-700">
          This is not theory. This is not tools. This is execution. You will build real systems, real projects, and a real income pathway.
        </p>
      </motion.div>
    </section>
  );
}

/* ───────────────────────────── BUILD SYSTEMS ───────────────────────────── */
function BuildSystemsSection() {
  return (
    <section className="px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black tracking-tight">
            What You Will <span className="text-[#f46718]">Build</span>
          </h2>
          <p className="mt-3 text-gray-500">By the end of 3 months, you will build these 5 AI systems.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {buildSystems.map((card) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="group  border border-gray-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center  bg-orange-50 text-[#f46718] transition group-hover:bg-[#f46718] group-hover:text-[#0A0A0A]">
                <card.icon className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-black">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">{card.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── JOURNEY ───────────────────────────── */
function JourneySection() {
  return (
    <section id="journey" className="scroll-mt-24 px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-black tracking-tight">
            Your <span className="text-[#f46718]">3-Month</span> AI Generalist Journey
          </h2>
        </div>
        {/* Timeline:
            - Desktop (lg+): horizontal rail above 6 cards, with dots on the rail.
            - Mobile (<lg): vertical orange rail on the left edge with numbered
              dots beside each card — restores the sequence cueing on phones. */}
        <div className="relative grid gap-5 pl-7 lg:grid-cols-6 lg:pl-0 lg:pt-6">
          {/* Desktop horizontal rail */}
          <div aria-hidden className="absolute left-0 right-0 top-3 hidden h-0.5 bg-orange-200 lg:block" />
          {/* Mobile vertical rail */}
          <div aria-hidden className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-orange-200 lg:hidden" />
          {modules.map((module, i) => (
            <motion.div
              key={module.number}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative  border border-orange-100 bg-white p-5 shadow-sm"
            >
              {/* Desktop dot — sits on the horizontal rail */}
              <span aria-hidden className="absolute -top-7 left-1/2 hidden h-5 w-5 -translate-x-1/2 rounded-full border-4 border-white bg-[#f46718] lg:block" />
              {/* Mobile dot — sits on the vertical rail */}
              <span aria-hidden className="absolute left-[-1.45rem] top-5 grid h-5 w-5 place-items-center rounded-full border-4 border-white bg-[#f46718] text-[10px] font-black text-[#0A0A0A] lg:hidden">
                {i + 1}
              </span>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-[#f46718]">{module.number}</p>
                <p className="text-[10.5px] font-bold uppercase tracking-wider text-gray-500">{module.days}</p>
              </div>
              <h3 className="mt-2 text-base font-black leading-tight lg:min-h-[48px]">{module.title}</h3>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {module.items.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span aria-hidden className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#f46718]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── AUDIENCE ───────────────────────────── */
function AudienceSection() {
  // Brand-only palette: orange and navy alternation (no off-brand blue).
  const audienceTones = [
    "bg-orange-50 text-[#f46718]",
    "bg-[#f46718]/8 text-[#0A0A0A]",
    "bg-amber-50 text-amber-700",
    "bg-[#f46718]/8 text-[#0A0A0A]",
    "bg-orange-50 text-[#f46718]",
  ];
  return (
    <section id="audience" className="scroll-mt-24 px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-black tracking-tight">
            Who Is This <span className="text-[#f46718]">For?</span>
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {audience.map((item, index) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className=" border border-gray-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-100"
            >
              <div
                className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
                  audienceTones[index % audienceTones.length]
                }`}
              >
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="font-black">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── OUTCOMES (By Month 3) ───────────────────────────── */
function OutcomesSection() {
  return (
    <section className="px-5 py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8  border border-orange-100 bg-gradient-to-r from-white via-orange-50/50 to-white p-8 shadow-sm lg:grid-cols-[1fr_360px_1fr]">
        <div>
          <h2 className="text-3xl font-black">
            By <span className="text-[#f46718]">Month 3</span>, You'll Have
          </h2>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            {outcomes.map(([title, sub]) => (
              <div key={title} className="flex gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#f46718]" />
                <div>
                  <p className="font-black">{title}</p>
                  <p className="text-sm text-gray-600">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certificate mockup — desktop only. On mobile it was 480px of pure
            decoration above the comparison table (audit). */}
        <div className="hidden  border border-orange-300 bg-white p-7 text-center shadow-xl shadow-orange-100 md:block">
          <p className="text-2xl font-black">ONROL</p>
          <p className="text-xs font-bold text-gray-500">Certificate of Completion</p>
          <div className="my-10 border-y border-orange-100 py-8">
            <p className="text-xs text-gray-500">This is to certify that</p>
            <p className="mt-3 text-2xl font-black">Your Name</p>
            <p className="mt-3 text-sm text-gray-600">has successfully completed the</p>
            <p className="mt-2 font-black text-[#f46718]">AI GENERALIST PROGRAM</p>
          </div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-[#f46718]">
            <CheckCircle2 className="h-9 w-9" />
          </div>
        </div>

        <div className=" border border-black/10 bg-white p-7 text-[#0A0A0A]">
          <p className="text-xs font-bold text-[#f46718]">AI Portfolio</p>
          <h3 className="mt-5 text-3xl font-black leading-tight">AI solutions that solve real problems.</h3>
          <a
            href="#journey"
            className="mt-6 inline-flex items-center gap-2  bg-[#f46718] px-5 py-3 text-sm font-black hover:bg-orange-700"
          >
            View Projects <ArrowRight className="h-4 w-4" />
          </a>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            {["7+ Projects", "5 Systems", "12+ Automations"].map((i) => (
              <div key={i} className=" border border-black/10 p-3 text-xs font-bold">
                {i}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── COMPARISON ───────────────────────────── */
function ComparisonSection() {
  return (
    <section className="px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-8 text-center text-4xl font-black tracking-tight">
          Traditional Courses vs <span className="text-[#f46718]">ONROL</span>
        </h2>
        {/* Desktop: full 3-column table. Mobile (<md): stacked cards — no
            horizontal scroll trap (mobile audit). */}
        <div className="hidden overflow-x-auto  border border-orange-100 bg-white shadow-sm md:block">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="p-4 font-black">Feature</th>
                <th className="p-4 text-center font-black">Traditional Courses</th>
                <th className="bg-[#f46718] p-4 text-center font-black text-[#0A0A0A]">ONROL AI Generalist</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map(([feature, onrol]) => (
                <tr key={feature} className="border-t border-gray-100">
                  <td className="p-4 font-semibold text-gray-700">{feature}</td>
                  <td className="p-4 text-center text-red-500">
                    <X className="mx-auto h-5 w-5" />
                  </td>
                  <td className="bg-orange-50/50 p-4 text-center font-bold text-gray-800">
                    <CheckCircle2 className="mr-2 inline h-5 w-5 text-green-600" />
                    {onrol}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards — feature IS the traditional behaviour (e.g.
            "Theory Heavy"); ONROL row is the contrast. No repeated copy. */}
        <ul className="space-y-3 md:hidden">
          {comparison.map(([feature, onrol]) => (
            <li key={feature} className="overflow-hidden  border border-orange-100 bg-white shadow-sm">
              <div className="flex items-start gap-3 px-4 py-3 text-[14px] text-gray-700">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-label="Traditional" />
                <span>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-red-600/80">Traditional</span>
                  <br />
                  <span className="font-semibold text-gray-800 line-through decoration-red-400/55 decoration-2">{feature}</span>
                </span>
              </div>
              <div className="flex items-start gap-3 border-t border-orange-100 bg-orange-50/50 px-4 py-3 text-[14px] text-gray-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-label="ONROL" />
                <span>
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-orange-700">ONROL</span>
                  <br />
                  <span className="font-semibold">{onrol}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────────────────────────── FINAL CTA ───────────────────────────── */
function FinalCtaSection({ onReserve }: { onReserve: () => void }) {
  return (
    <section className="px-5 py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 overflow-hidden  border border-black/10 bg-white p-9 text-[#0A0A0A] lg:grid-cols-[1fr_420px] lg:p-14">
        <div>
          <h2 className="text-4xl font-black tracking-tight lg:text-5xl">Your AI Transformation Starts Now</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-black/65">
            3 months can change your career, income, and future. Join the next cohort and build your AI-powered future.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
            {["Practical", "Project-Based", "Beginner Friendly", "Income Focused"].map((i) => (
              <span key={i} className="rounded-full border border-black/15 bg-white px-4 py-2">
                {i}
              </span>
            ))}
          </div>
        </div>
        <div className=" border border-black/10 bg-[#FFFDFB] p-6">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-[#f46718]">Next Cohort</p>
          {/* Honest cohort meta — date computed from courseJsonLd startDate.
              No more fake hardcoded countdown (was a trust break per audit). */}
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {(() => {
              const start = new Date("2026-08-04T00:00:00+05:30");
              const now = new Date();
              const daysLeft = Math.max(0, Math.ceil((start.getTime() - now.getTime()) / 86_400_000));
              const startDateStr = start.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
              const startYearStr = String(start.getFullYear());
              return [
                [startDateStr, "Starts"],
                [startYearStr, "Cohort 08"],
                [`${daysLeft}d`, "From today"],
              ] as const;
            })().map(([n, l]) => (
              <div key={l} className=" border border-black/10 p-4">
                <p className="text-xl font-black leading-tight md:text-2xl">{n}</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.16em] text-black/55">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] text-black/60">
            Live cohort &middot; limited seats &middot; 100% online from India
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onReserve}
              className=" bg-[#f46718] px-5 py-4 font-black text-[#0A0A0A] transition hover:bg-orange-700"
            >
              Reserve your free seat
            </button>
            <a
              href="https://wa.me/919706336699?text=Hi%20ONROL%20%E2%80%94%20I%20want%20to%20talk%20to%20an%20advisor%20about%20the%20AI%20Generalist%20cohort."
              target="_blank"
              rel="noopener noreferrer"
              className=" border border-black/15 bg-white px-5 py-4 text-center font-black text-[#0A0A0A] hover:bg-orange-50"
            >
              Talk to Advisor
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── PAGE STYLES ───────────────────────────── */
function PageStyles() {
  return (
    <style>{`
      /* Typography system — Manrope for display, Inter for body, JetBrains
         Mono for numeric stats. Scoped to .ai-generalist-page so the rest
         of the site keeps its existing stack. */
      .ai-generalist-page {
        font-family: "Fira Sans", "Figtree", system-ui, -apple-system, "Segoe UI", sans-serif;
        font-feature-settings: "ss01" on, "cv11" on, "kern" on;
        font-variant-ligatures: common-ligatures contextual;
        letter-spacing: -0.005em;
      }
      .ai-generalist-page h1,
      .ai-generalist-page h2,
      .ai-generalist-page h3,
      .ai-generalist-page h4 {
        font-family: "Fira Sans", "Figtree", system-ui, sans-serif;
        font-feature-settings: "ss01" on, "ss02" on, "cv11" on, "kern" on;
        letter-spacing: -0.022em;
      }
      .ai-generalist-page h1 { letter-spacing: -0.025em; font-weight: 700; }
      .ai-generalist-page h2 { letter-spacing: -0.028em; }
      /* Numeric tiles + stat values read crisper in a mono — keeps the
         Aug 4 / Cohort 08 / Xd row feeling instrument-panel. */
      .ai-generalist-page .stat-num,
      .ai-generalist-page time { font-variant-numeric: tabular-nums; }
      /* Slightly tighter leading on big display copy on mobile. */
      @media (max-width: 640px) {
        .ai-generalist-page h1 { line-height: 1.02; }
        .ai-generalist-page h2 { line-height: 1.08; }
      }
      .ai-generalist-page section:nth-of-type(even) { background-color: #F6F5F2; }
      @keyframes modalIn { from{opacity:0;transform:scale(.94) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
      }
    `}</style>
  );
}
