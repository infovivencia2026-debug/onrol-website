// /career-catalyst/ — Webinar-driven landing page for the ONROL
// Career Catalyst Program (3-track combo: AI & Automation + Data Science +
// Digital Marketing). Reference-matched hero (light theme + classroom photo),
// dark conversion sections below.
//
// Conversion goals (in order):
//   1. Form submission (full name + phone + email + status)
//   2. Phone CTA (floating top-right + final banner)
//
// SEO: Event JSON-LD (10 May 2026 3 PM IST online webinar) + Course JSON-LD
// (6-month combo) + Person + Speakable + FAQPage. No global navbar/footer
// here — clean conversion page (PPC-optimised).

import { useEffect, useState, FormEvent } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  LineChart,
  Megaphone,
  MessagesSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Users as UsersIcon,
  Video,
  Zap,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import SEO from "@/components/seo/SEO";
import {
  breadcrumbJsonLd,
  faqJsonLd,
  speakableJsonLd,
  SITE_URL,
  ORG_NAME,
  ORG_LOGO,
} from "@/lib/structuredData";
import { founderJsonLd } from "@/lib/founder";
import {
  CONTACT_PHONE,
  CONTACT_PHONE_DIGITS,
} from "@/lib/brand";
import { submitCareerCatalystRegistration } from "@/lib/careerCatalystRegistration";
import { trackLandingVisit } from "@/lib/trackLandingVisit";
import { toast } from "sonner";

// WhatsApp Community invite the user is redirected to after submitting.
const WHATSAPP_COMMUNITY_LINK =
  "https://chat.whatsapp.com/ChxiriuqKJODmrdF9ItMvt";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

// ── Webinar / event constants ──────────────────────────────────────────────
const WEBINAR_DATE_ISO = "2026-05-10T15:00:00+05:30";
const WEBINAR_END_ISO = "2026-05-10T15:30:00+05:30";
const WEBINAR_DATE_HUMAN = "10 May 2026 (Sunday)";
const WEBINAR_TIME_HUMAN = "3:00 PM IST";

// ── Course tracks ──────────────────────────────────────────────────────────
const TRACKS = [
  {
    id: "ai-automation",
    title: "AI & Automation",
    Icon: Brain,
    accent: "from-orange-500 to-amber-400",
    iconBg: "bg-orange-500/15 text-orange-300",
    duration: "8 weeks",
    blurb:
      "ChatGPT / Claude / Gemini deep-dive, prompt engineering, AI agents (n8n / Make / Zapier + LLM APIs), vibe coding (Lovable / Bolt / Cursor / v0).",
    outputs: [
      "Build production AI agents",
      "Automate 30% of any workflow",
      "Ship vibe-coded sites in days",
    ],
  },
  {
    id: "data-science",
    title: "Data Science",
    Icon: LineChart,
    accent: "from-orange-400 to-orange-300",
    iconBg: "bg-orange-400/15 text-orange-300",
    duration: "8 weeks",
    blurb:
      "Python, SQL, Pandas, statistics, ML fundamentals, real Indian datasets, live dashboards, modern data stack (warehousing + BI).",
    outputs: [
      "Build a real-world ML model",
      "Ship a live data dashboard",
      "Learn modern data tooling",
    ],
  },
  {
    id: "digital-marketing",
    title: "Digital Marketing",
    Icon: Megaphone,
    accent: "from-violet-400 to-fuchsia-300",
    iconBg: "bg-violet-400/15 text-violet-200",
    duration: "8 weeks",
    blurb:
      "Performance ads (Meta / Google), SEO, content marketing, AI-augmented growth, funnel design, analytics, conversion optimisation.",
    outputs: [
      "Run profitable Meta + Google ads",
      "Rank organic content with AI",
      "Build complete growth funnels",
    ],
  },
];

// ── Alumni quotes (light social proof) ────────────────────────────────────
const TESTIMONIALS = [
  {
    name: "Sneha R.",
    role: "AI Analyst @ Hyderabad startup",
    quote:
      "Was stuck in a non-tech job for 2 years. The AI + automation track got me my first ₹6L offer in month 5 of the program.",
  },
  {
    name: "Karthik V.",
    role: "Final-year B.Tech, Chennai",
    quote:
      "Built 3 real client projects during the internship. My GitHub did 90% of the talking in placement interviews.",
  },
  {
    name: "Anjali M.",
    role: "Career switcher (HR → marketing)",
    quote:
      "I run my own performance ads now — for 4 small brands. The digital marketing track paid for itself in month 3.",
  },
];

// ── Audience pills ─────────────────────────────────────────────────────────
const AUDIENCE = [
  "Final-year college students",
  "Recent graduates",
  "Working professionals",
  "Career switchers",
  "Job-seekers",
  "Freelancers",
  "Founders",
];

// ── What's included ────────────────────────────────────────────────────────
const INCLUDED = [
  { Icon: GraduationCap, text: "3 stacked courses (AI & Automation + Data Science + Digital Marketing)" },
  { Icon: Briefcase, text: "6 months internship — real client projects, real portfolio" },
  { Icon: Trophy, text: "Placement assistance — interview prep + employer network" },
  { Icon: ShieldCheck, text: "Verified completion certificate" },
  { Icon: UsersIcon, text: "Live mentor support — practitioners actively shipping AI work" },
  { Icon: Sparkles, text: "AI portfolio projects you can show in any interview" },
  { Icon: Video, text: "Recorded sessions for revision (live cohort + replays)" },
  { Icon: MessagesSquare, text: "Year-long access to ONROL Community (10K+ Indian builders)" },
];

// ── FAQs ───────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "Who is the Career Catalyst Program for?",
    a: "Final-year students, recent graduates, working professionals wanting a switch, freelancers, and job-seekers who want a market-ready skill stack — AI + Data Science + Digital Marketing — in 6 months. No prior coding background required.",
  },
  {
    q: "Why all 3 courses combined?",
    a: "Indian employers in 2026 hire T-shaped talent: depth in one skill + working knowledge of two adjacent ones. AI (build) + Data Science (analyse) + Digital Marketing (distribute) is the most-demanded combination across product, marketing, ops, and consulting roles.",
  },
  {
    q: "Is the ₹70,000 a one-time fee or instalments?",
    a: "₹70,000 is the all-inclusive combo fee covering all 3 courses + 6-month internship + placement assistance. Instalment plans (3 / 6 month EMI) are available — discussed live in the webinar with no obligation.",
  },
  {
    q: "How do you compare to ₹1.5L–₹2.92L market alternatives?",
    a: "Most Indian programs charge per course (₹50k–₹1L each, total ₹1.5L–₹3L for the same 3-course stack). Career Catalyst bundles all three at ₹70,000 because we believe execution-focused learners should not subsidise institutional overhead.",
  },
  {
    q: "What does the Sunday webinar cover?",
    a: "30 minutes live with our mentors. We walk through the curriculum, the project archetypes, the placement pipeline, real alumni outcomes, and answer all your questions live. Plus a special offer for attendees who decide on the call.",
  },
  {
    q: "Is the program online, offline, or hybrid?",
    a: "Fully online — accessible from any city in India. Live cohort sessions on weekday evenings + Saturday workshops. All sessions recorded for catch-up. Optional in-person workshops at our Hyderabad campus (Jubilee Hills).",
  },
  {
    q: "What's the placement support like?",
    a: "Personal mentor guidance, interview prep + mock interviews, AI-powered ATS-beating resume, portfolio review, employer network introductions. We don't promise a job — we give you everything needed to win one.",
  },
  {
    q: "Can I attend the webinar without committing to the program?",
    a: "Yes — that's the whole point. The webinar is free, no obligation, no recording shared publicly. Come, listen, see if it fits. Decide later (or not at all).",
  },
];

export default function CareerCatalystLanding() {
  // Moved 2026-05-20 from /career-catalyst/ → /landingpage/career-catalyst/.
  // Canonical MUST point at the new URL; the old URL serves only as a
  // 301 redirect via LiteSpeed vhost.conf. Pointing canonical at the old
  // URL creates a canonical-loop that Google flags as
  // "Duplicate, Google chose different canonical than user".
  const path = "/landingpage/career-catalyst/";
  const url = `${SITE_URL}${path}`;

  // Hidden visit counter — fire-and-forget on first mount.
  useEffect(() => {
    trackLandingVisit(path);
  }, []);

  // ── Form state ───────────────────────────────────────────────────────
  const [form, setForm] = useState({
    fullName: "",
    phone: "+91 ",
    email: "",
    status: "Student",
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error("Please fill in name, phone, and email.");
      return;
    }
    setSubmitting(true);

    // Fan out to community Supabase + Google Sheet (fire-and-forget).
    submitCareerCatalystRegistration({
      full_name: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      current_role: form.status,
      source: "career-catalyst-landing",
    });

    toast.success("Seat reserved. Redirecting to WhatsApp Community…");

    // Redirect to the WhatsApp Community invite. Use a short delay so the
    // toast paints and the fan-out fetches actually leave the browser
    // before navigation tears the page down.
    window.setTimeout(() => {
      window.location.href = WHATSAPP_COMMUNITY_LINK;
    }, 350);
  };

  // ── Schema ───────────────────────────────────────────────────────────
  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Career Catalyst Program — Free Sunday Webinar",
    description:
      "30-minute live webinar walking through the 3-track Career Catalyst Program (AI & Automation + Data Science + Digital Marketing). Curriculum, projects, placement pipeline, Q&A, special attendee offer.",
    startDate: WEBINAR_DATE_ISO,
    endDate: WEBINAR_END_ISO,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    location: {
      "@type": "VirtualLocation",
      url,
    },
    image: ORG_LOGO,
    organizer: {
      "@type": "Organization",
      name: ORG_NAME,
      url: SITE_URL,
    },
    offers: {
      "@type": "Offer",
      url,
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString().slice(0, 10) + "T00:00:00+05:30",
      category: "Free",
    },
    inLanguage: "en-IN",
  };

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: "ONROL Career Catalyst Program",
    description:
      "3-track combo program — AI & Automation + Data Science + Digital Marketing — across 6 months, with internship and placement assistance. Indian-priced at ₹70,000 vs ₹1.5L–₹2.92L market alternatives.",
    provider: {
      "@type": "EducationalOrganization",
      name: ORG_NAME,
      url: SITE_URL,
    },
    educationalCredentialAwarded: "Career Catalyst Certificate of Completion",
    inLanguage: "en-IN",
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "Online",
      courseWorkload: "P6M",
      location: { "@type": "VirtualLocation", url },
    },
    offers: {
      "@type": "Offer",
      price: "70000",
      priceCurrency: "INR",
      url,
      availability: "https://schema.org/InStock",
      category: "Paid",
    },
  };

  return (
    <main style={{ fontFamily: INTER_STACK }} className="min-h-screen bg-[#f3f5f8]">
      <SEO
        title="Career Catalyst Program — Free Webinar 10 May 2026 | ONROL"
        description="Stop learning theory. Start building real AI projects. Free 30-minute Sunday webinar on ONROL's Career Catalyst Program — 3 courses (AI & Automation + Data Science + Digital Marketing), 6-month internship + placement, ₹70,000 combo."
        path={path}
        image="https://onrol.in/og/default.png"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Career Catalyst", href: path },
          ]),
          eventSchema,
          courseSchema,
          founderJsonLd(),
          speakableJsonLd({ url, cssSelectors: ["h1", "p.lead", ".speakable"] }),
          faqJsonLd(FAQS),
        ]}
      />

      {/* Header hidden — clean conversion landing. Floating brand pill in corner. */}

      {/* ── HERO with classroom photo background ────────────────────── */}
      {/*  `isolate` creates a new CSS stacking context so the absolute
          background layers (cream fallback, photo, white-fade overlay)
          render BEHIND the hero content but ABOVE the page's dark <main>
          background. Without `isolate`, negative z-index children would
          escape the section and disappear behind the page bg. */}
      <section className="relative isolate overflow-hidden pb-8 pt-20 md:pb-16 md:pt-28">
        {/* Cream fallback — visible only if the photo fails or is loading. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-[#FAF7F2]" />
        {/* Background image — classroom photo. AVIF/WebP/JPG fallback chain.
            Hidden below md: on narrow viewports the photo bleeds behind the
            form card and creates visual noise. Cream + radial accent below
            give a clean look with no photo. */}
        <picture aria-hidden className="pointer-events-none absolute inset-0 z-[1] hidden h-full w-full md:block">
          <source srcSet="/career-catalyst-hero.avif" type="image/avif" />
          <source srcSet="/career-catalyst-hero.webp" type="image/webp" />
          <img
            src="/career-catalyst-hero.jpg"
            alt=""
            aria-hidden
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover object-center"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </picture>
        {/* White-to-transparent overlay (desktop only — no photo on mobile). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] hidden md:block md:bg-[linear-gradient(90deg,rgba(250,247,242,0.96)_0%,rgba(250,247,242,0.85)_42%,rgba(250,247,242,0.40)_75%,rgba(250,247,242,0.20)_100%)]"
        />
        {/* Soft warm radial accent over the cream so it doesn't feel flat without the image */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] bg-[radial-gradient(70%_60%_at_15%_20%,rgba(255,180,120,0.10),transparent_70%)]"
        />

        {/* Floating brand pill — replaces the navbar */}
        <a
          href="https://onrol.in/"
          aria-label="Visit ONROL home"
          className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3 py-2 shadow-[0_8px_22px_-10px_rgba(0,0,0,0.25)] backdrop-blur transition hover:border-orange-400/60 hover:bg-white sm:left-6 sm:top-6 sm:px-4 sm:py-2.5"
        >
          <Logo variant="dark" className="h-7 w-auto sm:h-8" />
        </a>

        {/* Floating phone CTA top-right */}
        <a
          href={`tel:${CONTACT_PHONE_DIGITS}`}
          className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/95 px-3.5 py-2 text-[12px] font-bold text-[#f3f5f8] shadow-[0_8px_22px_-10px_rgba(0,0,0,0.25)] backdrop-blur transition hover:border-orange-400/60 hover:bg-white sm:right-6 sm:top-6"
        >
          <Phone className="h-3.5 w-3.5 text-orange-500" />
          <span className="hidden sm:inline">{CONTACT_PHONE}</span>
          <span className="sm:hidden">Call</span>
        </a>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:items-start lg:px-8">
          {/* Left — copy */}
          <div className="max-w-2xl">
            <h1
              className="text-[#f3f5f8]"
              style={{
                fontSize: "clamp(28px, 7vw, 64px)",
                fontWeight: 800,
                letterSpacing: "-0.028em",
                lineHeight: 1.04,
              }}
            >
              What if one <span className="text-orange-500">Sunday</span>{" "}
              changed your entire <span className="text-orange-500">Career?</span>
            </h1>
            <p
              className="lead mt-5 text-slate-700"
              style={{ fontSize: "clamp(16px, 1.8vw, 19px)", lineHeight: 1.55 }}
            >
              Stop learning theory.{" "}
              Start building <span className="font-semibold text-orange-500">real AI projects</span>{" "}
              that get you hired in 2026.
            </p>

            {/* Rating + social proof row */}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[13px] font-bold text-[#f3f5f8]">4.9</span>
                <span className="text-[12.5px] text-slate-500">· 2,400+ alumni</span>
              </div>
              <span className="hidden h-4 w-px bg-slate-300 sm:block" />
              <div className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
                <UsersIcon className="h-3.5 w-3.5 text-orange-500" />
                <span className="font-semibold text-[#f3f5f8]">10,000+</span> Indian builders
              </div>
            </div>

            {/* Webinar at-a-glance — single pill on desktop, 3 small chips on mobile */}
            <div className="mt-6 hidden max-w-full flex-wrap items-center gap-x-5 gap-y-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-white shadow-[0_14px_28px_-12px_rgba(255,107,71,0.55)] md:mt-7 md:inline-flex">
              <span className="inline-flex items-center gap-1.5 text-[13px] font-bold">
                <LineChart className="h-4 w-4" />
                Career Catalyst Program
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                <Calendar className="h-3.5 w-3.5" />
                {WEBINAR_DATE_HUMAN.split(" ").slice(0, 2).join(" ")} · {WEBINAR_TIME_HUMAN}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold">
                <UserRound className="h-3.5 w-3.5" />
                Online
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 md:hidden">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 px-3 py-1.5 text-[12px] font-bold text-white shadow-[0_8px_16px_-8px_rgba(255,107,71,0.55)]">
                <LineChart className="h-3.5 w-3.5" />
                Career Catalyst
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/60 bg-orange-500/10 px-3 py-1.5 text-[11.5px] font-bold text-orange-700">
                <Calendar className="h-3 w-3" />
                {WEBINAR_DATE_HUMAN.split(" ").slice(0, 2).join(" ")} · {WEBINAR_TIME_HUMAN}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/50 bg-emerald-500/10 px-3 py-1.5 text-[11.5px] font-bold text-emerald-700">
                <UserRound className="h-3 w-3" />
                Online
              </span>
            </div>

            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] font-medium text-slate-500">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 100% Free</span>
              <span className="text-slate-300">·</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 30 minutes</span>
            </p>
          </div>

          {/* Right — Registration form (in hero) */}
          <div id="register" className="relative">
            {/* Decorative gradient blob behind card */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-3 -z-10 rounded-[2rem] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(255,107,71,0.18),transparent_75%)] blur-2xl"
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="relative overflow-hidden rounded-3xl border border-[#f3f5f8]/10 bg-white p-6 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.22)] sm:p-7"
            >
              {/* Top accent strip */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

              <div className="flex items-center justify-between">
                <p className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-orange-500">
                  <Sparkles className="h-3 w-3" />
                  Reserve your seat
                </p>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Free
                </span>
              </div>

              <h2
                className="mt-3 text-[#f3f5f8]"
                style={{
                  fontSize: "clamp(22px, 2.8vw, 28px)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                Join the live Sunday session.
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                30 minutes live · {WEBINAR_DATE_HUMAN.split(" ").slice(0, 2).join(" ")} ·{" "}
                {WEBINAR_TIME_HUMAN}
              </p>

              <form onSubmit={onSubmit} className="mt-5 grid gap-3">
                <FieldLight
                  label="Full name"
                  value={form.fullName}
                  onChange={(v) => setForm((p) => ({ ...p, fullName: v }))}
                  placeholder="Your name"
                />
                <FieldLight
                  label="Phone"
                  type="tel"
                  value={form.phone}
                  onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                  placeholder="+91 …"
                />
                <FieldLight
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                  placeholder="you@example.com"
                />
                <SelectFieldLight
                  label="I am a"
                  value={form.status}
                  onChange={(v) => setForm((p) => ({ ...p, status: v }))}
                  options={["Student", "Working professional", "Job-seeker", "Freelancer", "Founder", "Other"]}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-[14px] font-bold uppercase tracking-wider text-white shadow-[0_18px_36px_-12px_rgba(255,107,71,0.55)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    "Reserving…"
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Reserve my free seat
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ────────────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-[#f3f5f8] py-6 text-white md:py-7">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-4 px-4 text-center sm:grid-cols-4 sm:px-6 lg:px-8">
          {[
            { n: "10K+", l: "Indian builders" },
            { n: "₹2.2L", l: "Avg. placement" },
            { n: "6 mo", l: "Real internship" },
            { n: "4.9★", l: "Alumni rating" },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-[22px] font-extrabold tracking-tight text-orange-300 md:text-[26px]">
                {s.n}
              </div>
              <div className="mt-0.5 text-[11.5px] font-semibold uppercase tracking-wider text-slate-400">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEGREE vs PROGRAM ───────────────────────────────────────── */}
      <section className="bg-[#f3f5f8] py-16 text-white md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">
            🚀 Career Catalyst
          </p>
          <h2
            className="mt-3 text-white"
            style={{
              fontSize: "clamp(28px, 4.6vw, 52px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
          >
            Your degree gets you the interview.
            <br />
            <span className="text-orange-400">This program gets you the job.</span>
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-slate-300 md:text-[17px]">
            3 courses. 1 decision. A career that finally stands out. The Career Catalyst Program
            stacks the most-demanded skills of 2026 — AI & Automation + Data Science + Digital
            Marketing — with hands-on projects, a 6-month internship, and placement assistance.
          </p>
        </div>
      </section>

      {/* ── 3 TRACKS ────────────────────────────────────────────────── */}
      <section className="bg-[#f3f5f8] pb-16 text-white md:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 max-w-2xl text-center md:mx-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">
              ⚡ The 3-track combo
            </p>
            <h2
              className="mt-3 text-white"
              style={{
                fontSize: "clamp(24px, 3.6vw, 40px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.08,
              }}
            >
              Three skill stacks. One unfair advantage.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TRACKS.map((t, i) => (
              <motion.article
                key={t.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#3f3f3f] p-7 transition hover:-translate-y-1 hover:border-orange-300/40 hover:shadow-[0_30px_60px_-25px_rgba(255,107,71,0.4)]"
              >
                {/* Subtle gradient sheen on hover */}
                <div
                  aria-hidden
                  className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${t.accent} opacity-60`}
                />
                <div className="flex items-start justify-between">
                  <span className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${t.accent} text-[#f3f5f8] shadow-lg`}>
                    <t.Icon className="h-6 w-6" strokeWidth={2.4} />
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-300">
                    {t.duration}
                  </span>
                </div>
                <h3
                  className="mt-5 text-white"
                  style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.15 }}
                >
                  {t.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-slate-300">{t.blurb}</p>
                <div className="my-5 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-orange-300">
                  You'll be able to
                </p>
                <ul className="mt-3 space-y-2">
                  {t.outputs.map((o) => (
                    <li key={o} className="flex items-start gap-2 text-[13px] text-slate-200">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ─────────────────────────────────────────── */}
      <section className="bg-[#f3f5f8] py-16 text-white md:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">
              ✅ What's included
            </p>
            <h2
              className="mt-3 text-white"
              style={{
                fontSize: "clamp(24px, 3.6vw, 40px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.08,
              }}
            >
              Everything you need to land a job. Nothing you don't.
            </h2>
          </div>
          <div className="mt-9 grid gap-3 md:grid-cols-2">
            {INCLUDED.map((i, idx) => (
              <motion.div
                key={i.text}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.3) }}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#3f3f3f] p-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-500/15 text-orange-300">
                  <i.Icon className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <p className="text-[14px] leading-relaxed text-slate-200">{i.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO SHOULD JOIN ─────────────────────────────────────────── */}
      <section className="bg-[#f3f5f8] py-12 text-white md:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#3f3f3f] via-[#f3f5f8] to-[#f3f5f8] p-7 md:p-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">
              🎯 Who should join
            </p>
            <h2
              className="mt-3 text-white"
              style={{
                fontSize: "clamp(22px, 3.2vw, 32px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              Built for who you actually are.
            </h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {AUDIENCE.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-1.5 text-[12.5px] font-semibold text-slate-200"
                >
                  <UserRound className="h-3 w-3 text-orange-300" />
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW THE WEBINAR WORKS ───────────────────────────────────── */}
      <section className="bg-[#f3f5f8] py-16 text-white md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">
              📅 The Sunday Webinar
            </p>
            <h2
              className="mt-3 text-white"
              style={{
                fontSize: "clamp(24px, 3.8vw, 40px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.08,
              }}
            >
              30 minutes. No pitch. Real walk-through.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-slate-300">
              Here's exactly how the live session is structured.
            </p>
          </div>
          <div className="relative mt-10 grid gap-4 md:grid-cols-4">
            {/* Timeline connector — visible on md+ */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-orange-400/40 to-transparent md:block"
            />
            {[
              { t: "0–5 min", h: "Why this combo works in 2026", b: "The hiring shift, what employers actually pay for, why most degrees miss it." },
              { t: "5–15 min", h: "Walk through all 3 tracks", b: "Curriculum, projects, tools, what you'll ship in each." },
              { t: "15–25 min", h: "Internship + placement", b: "How the 6-month internship works, who hires, what placement support looks like." },
              { t: "25–30 min", h: "Q&A + special offer", b: "Bring every doubt. Decide on the call (or not — zero pressure)." },
            ].map((b, i) => (
              <motion.div
                key={b.h}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="relative rounded-2xl border border-white/10 bg-[#3f3f3f] p-5"
              >
                <span className="absolute -top-3 left-5 grid h-6 w-6 place-items-center rounded-full border border-orange-300/40 bg-[#f3f5f8] text-[11px] font-bold text-orange-300">
                  {i + 1}
                </span>
                <p className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.18em] text-orange-300">
                  {b.t}
                </p>
                <p className="mt-3 text-[15px] font-bold leading-snug text-white">{b.h}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{b.b}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────── */}
      <section className="bg-[#f3f5f8] pb-16 text-white md:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-9 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">
              💬 What alumni say
            </p>
            <h2
              className="mt-3 text-white"
              style={{
                fontSize: "clamp(24px, 3.6vw, 38px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
              }}
            >
              Real outcomes. Real builders.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.figure
                key={t.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#3f3f3f] p-6"
              >
                <div className="flex">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-[14.5px] leading-relaxed text-slate-200">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-[13.5px] font-bold text-white">{t.name}</p>
                  <p className="mt-0.5 text-[12px] text-slate-400">{t.role}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────── */}
      <section className="bg-[#f3f5f8] py-16 text-white md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">
            — FAQs
          </p>
          <h2
            className="mt-3 text-white"
            style={{
              fontSize: "clamp(24px, 3.6vw, 40px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
            }}
          >
            Real questions, straight answers.
          </h2>
          <div className="mt-7 space-y-3">
            {FAQS.map((f) => (
              <details
                key={f.q}
                className="group rounded-xl border border-white/10 bg-[#3f3f3f] p-5 open:border-orange-300/35"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-3 text-[14.5px] font-bold text-white sm:text-[15.5px]">
                  <span className="faq-question">{f.q}</span>
                  <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-orange-300 transition group-open:rotate-180" />
                </summary>
                <p className="faq-answer mt-3 text-[14px] leading-relaxed text-slate-300">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Registration form moved into the hero section above (id="register"). */}

      {/* ── FINAL CTA — full-bleed gradient banner ─────────────────── */}
      <section className="bg-[#f3f5f8] pb-24 pt-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-orange-300/20 bg-gradient-to-br from-[#404040] via-[#3f3f3f] to-[#f3f5f8] p-8 md:p-12">
            {/* Decorative gradient blob */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(255,107,71,0.35),transparent)] blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(56,189,248,0.18),transparent)] blur-2xl"
            />

            <div className="relative grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center md:gap-10">
              <div>
                <p className="inline-flex items-center gap-1.5 rounded-full border border-orange-300/30 bg-orange-500/10 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.22em] text-orange-300">
                  <Sparkles className="h-3 w-3" />
                  One Sunday. One Decision.
                </p>
                <h2
                  className="mt-4 text-white"
                  style={{
                    fontSize: "clamp(26px, 4vw, 42px)",
                    fontWeight: 800,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.08,
                  }}
                >
                  Your future self will thank you for showing up.
                </h2>
                <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-300">
                  Free 30-minute live walkthrough of the program, projects, internship and placement
                  pipeline. No recording. No pressure.
                </p>
              </div>

              <div className="flex flex-col gap-3 md:items-end">
                <a
                  href="#register"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-6 text-[13px] font-bold uppercase tracking-wider text-white shadow-[0_18px_36px_-12px_rgba(255,107,71,0.55)] transition hover:brightness-110 md:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  Reserve my free seat
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={`tel:${CONTACT_PHONE_DIGITS}`}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-5 text-[12.5px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-orange-300/40 hover:bg-white/[0.08] md:w-auto"
                >
                  <Phone className="h-4 w-4" />
                  Call {CONTACT_PHONE}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STICKY MOBILE BAR ───────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#f3f5f8]/95 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center gap-2.5">
          <a
            href={`tel:${CONTACT_PHONE_DIGITS}`}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/[0.04] text-orange-300"
            aria-label="Call ONROL"
          >
            <Phone className="h-5 w-5" />
          </a>
          <a
            href="#register"
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-[13px] font-bold uppercase tracking-wider text-white"
          >
            <Sparkles className="h-4 w-4" />
            Reserve free seat
          </a>
        </div>
      </div>
    </main>
  );
}

// ── Form sub-components — LIGHT variant for white card on cream hero ─────
function FieldLight({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
    </label>
  );
}

function SelectFieldLight({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[14px] text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
