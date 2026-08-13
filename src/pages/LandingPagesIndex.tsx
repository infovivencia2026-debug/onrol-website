// /landingpage/ — hub page listing every ONROL landing page.
//
// Each landing page under /landingpage/<slug>/ is a standalone funnel
// (no navbar/footer, single conversion goal). This index is the public
// directory of all live funnels — useful for the team to share + for
// SEO to consolidate the landingpage section under one canonical hub.

import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Rocket, Zap } from "lucide-react";
import SEO from "@/components/seo/SEO";
import Footer from "@/components/shared/Footer";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import { breadcrumbJsonLd } from "@/lib/structuredData";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

interface LandingEntry {
  slug: string;
  title: string;
  blurb: string;
  audience: string;
  cta: string;
  accent: "orange" | "cyan" | "violet" | "emerald";
  icon: typeof Sparkles;
}

const LANDINGS: LandingEntry[] = [
  {
    slug: "aigeneralist",
    title: "AI Generalist Program",
    blurb:
      "23 live sessions, 50+ training hours, zero coding required. Move from knowing AI to building with AI — 6 income paths covered. India-priced.",
    audience: "Students, professionals, freelancers wanting to ship + earn with AI",
    cta: "Register now",
    accent: "emerald",
    icon: Sparkles,
  },
  {
    slug: "ai-agents",
    title: "AI Agents Masterclass",
    blurb:
      "Free 90-minute live masterclass on building AI agents that take actions — book meetings, send emails, run multi-step workflows. OpenAI Assistants, Claude tool use, n8n, MCP.",
    audience: "Engineers, founders, working professionals adding agents to their stack",
    cta: "Reserve your seat",
    accent: "cyan",
    icon: Zap,
  },
  {
    slug: "career-catalyst",
    title: "Career Catalyst Webinar",
    blurb:
      "Live 90-minute career-acceleration webinar for Indian professionals — find your AI-augmented next step in 3 months. Includes ONROL's persona-fit framework.",
    audience: "Working professionals, freelancers, career switchers",
    cta: "Register free",
    accent: "orange",
    icon: Rocket,
  },
];

// Accent classes for each entry — keeps Tailwind JIT happy (no dynamic class names).
const ACCENT = {
  orange: { ring: "from-orange-500 via-amber-400 to-orange-500", chip: "bg-orange-500/15 text-orange-600", border: "hover:border-orange-300/40", cta: "bg-orange-500 hover:bg-orange-400" },
  cyan: { ring: "from-orange-500 via-orange-400 to-orange-500", chip: "bg-orange-500/15 text-orange-600", border: "hover:border-orange-300/40", cta: "bg-cyan-500 hover:bg-cyan-400" },
  violet: { ring: "from-violet-500 via-fuchsia-400 to-violet-500", chip: "bg-violet-500/15 text-violet-600", border: "hover:border-violet-300/40", cta: "bg-violet-500 hover:bg-violet-400" },
  emerald: { ring: "from-emerald-500 via-teal-400 to-emerald-500", chip: "bg-emerald-500/15 text-emerald-600", border: "hover:border-emerald-300/40", cta: "bg-emerald-500 hover:bg-emerald-400" },
} as const;

export default function LandingPagesIndex() {
  const path = "/landingpage/";

  return (
    <main
      className="min-h-screen bg-white pt-24 text-[#0A0A0A] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title="ONROL Landing Pages — Free Masterclasses + Webinars | India's AI Execution School"
        description="Browse every ONROL free masterclass and webinar landing page in one place. AI Agents masterclass, Career Catalyst webinar, and more — all India-priced, all free to attend live."
        path={path}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Landing Pages", href: path },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "@id": "https://onrol.in/landingpage/#itemlist",
            name: "ONROL Landing Pages",
            numberOfItems: LANDINGS.length,
            itemListElement: LANDINGS.map((l, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: l.title,
              url: `https://onrol.in/landingpage/${l.slug}/`,
            })),
          },
        ]}
      />

      {/* Hero */}
      <section className="relative bg-white py-14 md:py-20">
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <BreadcrumbTrail crumbs={[{ name: "Landing Pages", href: path }]} variant="dark" />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
            — Free masterclasses + webinars
          </p>
          <h1
            className="mt-3 max-w-4xl"
            style={{
              fontSize: "clamp(38px, 6vw, 72px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 800,
            }}
          >
            All ONROL <span className="text-orange-400">landing pages</span> in one place.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[#0A0A0A]/75 md:text-xl">
            Every ONROL free masterclass, webinar, and program funnel. Pick the one that fits your goal —
            reserve a live seat in under 30 seconds. India-priced, all live, all free to attend.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-white py-10 md:py-16">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {LANDINGS.map((l) => {
              const a = ACCENT[l.accent];
              const Icon = l.icon;
              return (
                <a
                  key={l.slug}
                  href={`/landingpage/${l.slug}/`}
                  className={`group relative flex h-full flex-col overflow-hidden  border border-[#0B1640]/10 bg-white p-6 transition hover:-translate-y-1 md:p-8 ${a.border}`}
                >
                  <div aria-hidden className={`absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r ${a.ring}`} />
                  <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center  ${a.chip}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-[#0A0A0A] md:text-3xl">
                    {l.title}
                  </h2>
                  <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0A0A0A]/55">
                    {l.audience}
                  </p>
                  <p className="mt-4 text-[15px] leading-relaxed text-[#0A0A0A]/75 md:text-base">
                    {l.blurb}
                  </p>
                  <div className="mt-auto pt-6">
                    <span className={`inline-flex items-center gap-2  ${a.cta} px-5 py-2.5 text-sm font-bold text-[#0A0A0A] transition`}>
                      {l.cta}
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why we use landing pages */}
      <section className="bg-white py-14 md:py-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
            — Why landing pages
          </p>
          <h2
            className="mt-3"
            style={{
              fontSize: "clamp(26px, 4vw, 38px)",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              fontWeight: 800,
            }}
          >
            One page. One action. Zero distraction.
          </h2>
          <p className="mt-5 text-[15.5px] leading-relaxed text-[#0A0A0A]/75 md:text-base md:leading-[1.7]">
            Every landing page above is a single-focus funnel — no navbar, no footer, no "explore more" CTA.
            You land, you see exactly one thing, you reserve your seat. We use these for paid ads, QR codes,
            partner shares, and direct WhatsApp distribution. The full ONROL site (with all programs,
            personas, blog, glossary) is still at{" "}
            <Link to="/" className="text-orange-600 underline-offset-4 hover:underline">
              onrol.in
            </Link>{" "}
            — these landings are for when you already know what you came for.
          </p>
          <p className="mt-5 text-[14.5px] leading-relaxed text-[#0A0A0A]/55 md:text-[15px] md:leading-[1.7]">
            More landings coming soon: AI for Working Professionals, AI Generalist Cohort Open House,
            Founder Office Hours, and persona-specific funnels. Check back, or follow ONROL's{" "}
            <Link to="/community/" className="text-orange-600 underline-offset-4 hover:underline">
              Community feed
            </Link>{" "}
            for new launches.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  );
}
