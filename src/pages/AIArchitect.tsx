import { FormEvent, useState } from "react";
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
import { Page } from "@/components/system/grid";

const AI_ARCHITECT_FAQ = [
  { q: "Who is the AI Architect program for?", a: "Working professionals, freelancers, founders, developers, and AI Generalist graduates who want to design, build, deploy and scale complete AI systems — not just use tools." },
  { q: "How long is the program?", a: "6 months of live instructor-led training plus 6 months of guided execution — 250+ learning hours across 20 core modules and 20 weekly masterclasses." },
  { q: "Do I need a coding background?", a: "It's low-code friendly. You don't need to be a developer — basic coding interest helps. You build a strong technical foundation from scratch (web, Python, data) and progress to agents, automation, and production AI architecture." },
  { q: "What do I leave with?", a: "15+ real AI projects, a final capstone, and the ONROL AI Orchestrator Certification — ready for high-value roles, consulting, or freelancing." },
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
  { icon: Bot, title: "AI Applications", text: "Real-world web applications and AI-powered products." },
  { icon: Brain, title: "AI Agents", text: "Single-agent and multi-agent autonomous systems." },
  { icon: Zap, title: "Automation Systems", text: "Business workflows that eliminate repetitive work." },
  { icon: Search, title: "RAG & Knowledge Systems", text: "Knowledge-driven assistants and enterprise chatbots." },
  { icon: Building2, title: "Analytics Dashboards", text: "Data visualization and business intelligence systems." },
  { icon: Rocket, title: "Marketing Engines", text: "Lead generation, SEO, and content automation systems." },
  { icon: UserRound, title: "Personal Brand Assets", text: "Portfolio sites, LinkedIn systems, and professional presence." },
  { icon: ShieldCheck, title: "Production-Ready Solutions", text: "End-to-end systems ready for deployment and client delivery." },
];

const modules = [
  { number: "Phase 1", title: "Foundations", items: ["Web Dev — HTML/CSS/JS/React", "Python & Data Systems", "SQL, Power BI, Analytics", "UI Fundamentals"], days: "Month 1" },
  { number: "Phase 2", title: "AI Core", items: ["LLMs & Prompt Engineering", "RAG & Knowledge Systems", "Diffusion / Media AI", "AI Productivity Systems"], days: "Month 2" },
  { number: "Phase 3", title: "Automation & Agents", items: ["n8n & Workflow Engineering", "APIs & Webhooks", "AI Agents & Multi-Agent", "Agentic Workflows + MCP"], days: "Month 3" },
  { number: "Phase 4", title: "Build Products", items: ["Vibe Coding", "App & Web Development", "Claude / OpenAI Ecosystem", "Backend & Database Design"], days: "Month 4" },
  { number: "Phase 5", title: "Architecture & Deploy", items: ["System & AI Architecture", "Deployment & Hosting", "Scaling & Security", "AI Ops & Governance"], days: "Month 5" },
  { number: "Phase 6", title: "Growth & Career", items: ["Digital Marketing & Ads", "Social & Creative Production", "Personal Branding", "Capstone + Portfolio"], days: "Month 6 (+ 6 mo guided)" },
];

const audience = [
  { icon: UserRound, title: "Working Professionals", text: "Integrate AI into your role and future-proof your career." },
  { icon: Rocket, title: "Freelancers & Consultants", text: "Deliver AI solutions and automation to clients." },
  { icon: Building2, title: "Startup Founders", text: "Build AI-first products, services, and businesses." },
  { icon: Bot, title: "Developers & Technical Learners", text: "Combine software development with modern AI systems." },
  { icon: GraduationCap, title: "AI Generalist Graduates", text: "Move from AI execution to AI architecture." },
];

const outcomes: [string, string][] = [
  ["Design AI-powered systems", "End-to-end business systems"],
  ["Build apps & automations", "Websites, apps, and workflows"],
  ["AI agents & RAG systems", "Knowledge-driven AI assistants"],
  ["Production deployments", "Ship solutions to real users"],
  ["Growth systems", "Personal + business growth engines"],
  ["Client-ready projects", "Deliver real AI work"],
  ["High-value positioning", "Roles, consulting, freelancing"],
  ["AI Orchestrator Certification", "ONROL credential"],
];

const comparison: [string, string][] = [
  ["Tool Tutorials Only", "Build Complete AI Systems"],
  ["Theory Heavy", "100% Hands-on Execution"],
  ["No Real Portfolio", "20+ Projects & Capstone"],
  ["Single Skill", "Full-Stack AI Architecture"],
  ["No Deployment", "Production-Ready Deployment"],
  ["No Mentorship", "Industry Practitioner Mentors"],
  ["Generic Content", "Real Business Systems"],
];

const AIArchitect = () => {
  return (
    <>
      <SEO
        title="AI Architect Program — Build & Lead AI Systems | ONROL"
        description="ONROL's flagship advanced program. 6-month course + 6-month guided execution. Go beyond AI tools: design, build, deploy and scale complete AI-powered business systems. 20 modules, 250+ hours, live instructor-led, real projects, certification."
        path="/programs/ai-architect/"
        image="https://onrol.in/og/programs.png"
        jsonLd={[
          courseJsonLd({
            name: "AI Architect Program",
            description: "Design, build, deploy and scale complete AI-powered business systems. 6-month course + 6-month guided execution.",
            url: "https://onrol.in/programs/ai-architect/",
            duration: "P6M",
            educationalLevel: "Advanced",
            courseMode: "Online",
            occupationalCategory: "AI Architect / AI Engineer",
          }),
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Programs", href: "/programs" },
            { name: "AI Architect", href: "/programs/ai-architect" },
          ]),
          founderJsonLd(),
          faqJsonLd(AI_ARCHITECT_FAQ),
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
            <FinalCtaSection />
          </Page>
        </div>

        <Footer />
      </main>
    </>
  );
};

export default AIArchitect;

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
        <source srcSet="/aia-hero-bg.avif" type="image/avif" />
        <source srcSet="/aia-hero-bg.webp" type="image/webp" />
        <img
          src="/aia-hero-bg.jpg"
          alt=""
          width={2200}
          height={980}
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      </picture>
      {/* Hero: headline panel (left) + registration form (right) — same method
          as AI Generalist; the form tags the CRM lead as campaign=aiarchitect. */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto grid max-w-7xl items-start gap-y-10 lg:grid-cols-2 lg:items-center lg:gap-x-14"
      >
        <div>
          {/* DARK frosted glass panel (was light/55 white — swapped to
              navy/70 so the white headline + orange accent gradient can
              hold contrast against the warm maze background no matter
              which area of the photo sits behind it). The orange ring +
              corner glow are the new "effect" — ties the panel back to
              the brand orange and pushes the headline forward without
              relying on text-shadow tricks. */}
          <motion.div variants={fadeUp}>
            {/* White headline directly on the bronze image (per reference design). */}
            <h1
              className="font-black uppercase leading-[0.92] tracking-tight text-white"
              style={{ fontFamily: '"Fira Sans", system-ui, sans-serif', fontSize: "clamp(40px, 7vw, 82px)", textShadow: "0 2px 24px rgba(0,0,0,0.40)" }}
            >
              <span className="block text-[0.56em] font-extrabold tracking-normal">Become an</span>
              <span className="block">AI Architect</span>
              <span className="block">in 6 Months</span>
            </h1>
            <p
              className="mt-6 max-w-xl text-[16px] font-medium leading-7 text-white/85 md:text-[18px] md:leading-8"
              style={{ textShadow: "0 1px 14px rgba(0,0,0,0.35)" }}
            >
              Go beyond AI tools. Design, build, deploy and scale complete AI-powered business systems &mdash; apps, agents, automations, RAG, and production-ready solutions.
            </p>
          </motion.div>
        </div>

        {/* Form — right column on lg, spanning both rows. */}
        <div>
          <InlineRegistrationForm />
        </div>

      </motion.div>
    </section>
  );
}

/* ─────────── INLINE REGISTRATION FORM ───────────
   Posts to the ONROL CRM (go.onrol.in/api/public/leads) tagged
   campaign=aiarchitect so the lead is attributed to the AI Architect program. */
function InlineRegistrationForm() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", role: "", honey: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.honey) return; // honeypot
    setError("");
    setStatus("sending");
    const data = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      tag: "bulk",
      source: "AI Architect landing",
      campaign: "aiarchitect",
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
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed — please try again.");
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative mx-auto w-full max-w-full  border border-black/10 bg-white p-9 text-center"
      >
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h3 className="mt-3 text-[22px] font-black text-gray-950">You're on the list.</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
          Our team will reach out on WhatsApp with the AI Architect cohort details within 24 hours.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="relative mx-auto w-full max-w-full border border-black/10 bg-white p-7 sm:p-9 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)]"
    >
      <h3 className="text-[24px] font-black leading-tight tracking-tight text-gray-950 sm:text-[28px]">
        Get the AI Architect brochure.
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
        Fees, schedule, and the full cohort guide &mdash; in your WhatsApp within 24 hours.
      </p>

      <form onSubmit={handleSubmit} autoComplete="on" noValidate className="mt-5 space-y-3.5">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-600">Full Name</span>
          <input name="name" type="text" required placeholder="Your name" autoComplete="name" value={form.name} onChange={update("name")}
            className="h-11 w-full border border-gray-200 bg-white px-3.5 text-[16px] sm:text-[14px] font-medium text-gray-900 placeholder:text-black/55 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-600">Phone (WhatsApp)</span>
          <input name="phone" type="tel" required placeholder="+91 9XXXX XXXXX" autoComplete="tel" inputMode="tel" value={form.phone} onChange={update("phone")}
            className="h-11 w-full border border-gray-200 bg-white px-3.5 text-[16px] sm:text-[14px] font-medium text-gray-900 placeholder:text-black/55 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-600">Email</span>
          <input name="email" type="email" required placeholder="you@example.com" autoComplete="email" value={form.email} onChange={update("email")}
            className="h-11 w-full border border-gray-200 bg-white px-3.5 text-[16px] sm:text-[14px] font-medium text-gray-900 placeholder:text-black/55 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-600">I am a</span>
          <select name="role" value={form.role} onChange={update("role")}
            className="h-11 w-full border border-gray-200 bg-white px-3 text-[16px] sm:text-[14px] font-medium text-gray-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200">
            <option value="">Pick one</option>
            <option value="working-pro">Working Professional</option>
            <option value="freelancer">Freelancer / Consultant</option>
            <option value="founder">Startup Founder</option>
            <option value="developer">Developer</option>
            <option value="ai-generalist-grad">AI Generalist Graduate</option>
            <option value="student">Student</option>
          </select>
        </label>

        <input type="text" name="honey" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.honey} onChange={update("honey")}
          style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0, pointerEvents: "none" }} />

        {status === "error" && error ? (
          <p role="alert" className=" border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">{error}</p>
        ) : null}

        <button type="submit" disabled={status === "sending"}
          className="group inline-flex h-12 w-full items-center justify-center gap-2 bg-[#f46718] px-5 text-[14px] font-medium uppercase tracking-wider text-[#0A0A0A] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70">
          {status === "sending" ? (
            <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Sending…</>
          ) : (
            <>Send me the brochure <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></>
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
          <p className="mt-3 text-gray-500">Across the program you will build these production-ready AI systems.</p>
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
            Your <span className="text-[#f46718]">6-Month</span> AI Architect Journey
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
            By the <span className="text-[#f46718]">End</span>, You'll Have
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
            <p className="mt-2 font-black text-[#f46718]">AI ARCHITECT PROGRAM</p>
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
            {["20+ Projects", "AI Agents", "Production Systems"].map((i) => (
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
                <th className="bg-[#f46718] p-4 text-center font-black text-[#0A0A0A]">ONROL AI Architect</th>
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
function FinalCtaSection() {
  return (
    <section className="px-5 py-16 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-10 overflow-hidden  border border-black/10 bg-white p-9 text-[#0A0A0A] lg:grid-cols-[1fr_420px] lg:p-14">
        <div>
          <h2 className="text-4xl font-black tracking-tight lg:text-5xl">Architect Your AI Future</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-black/65">
            Six months of live training plus six months of guided execution to design, build, and ship complete AI systems — and lead AI transformation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold">
            {["Hands-on Execution", "Real Projects", "Production-Ready", "Mentor-Led"].map((i) => (
              <span key={i} className="rounded-full border border-black/15 bg-white px-4 py-2">
                {i}
              </span>
            ))}
          </div>
        </div>
        <div className=" border border-black/10 bg-[#FFFDFB] p-6">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.22em] text-[#f46718]">The Program</p>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {([["6+6", "Months"], ["20", "Modules"], ["250+", "Hours"]] as const).map(([n, l]) => (
              <div key={l} className=" border border-black/10 p-4">
                <p className="text-xl font-black leading-tight md:text-2xl">{n}</p>
                <p className="mt-1 text-[10.5px] uppercase tracking-[0.16em] text-black/55">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] text-black/60">
            Live cohort &middot; mentor-led &middot; 100% online from India
          </p>
          <div className="mt-6">
            <a
              href="https://wa.me/919706336699?text=Hi%20ONROL%20%E2%80%94%20I%20want%20to%20know%20more%20about%20the%20AI%20Architect%20program."
              target="_blank"
              rel="noopener noreferrer"
              className="block  border border-black/15 bg-white px-5 py-4 text-center font-black text-[#0A0A0A] hover:bg-orange-50"
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
