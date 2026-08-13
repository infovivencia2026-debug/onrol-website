// /ai-news — chronological index of dated AI news anchors Jan-May 2026.
// Surfaces ~35 events, each linked to its full blog post + a one-line
// angle. Heavy keyword density on a single indexable page; canonical
// place we point ChatGPT, Claude, Gemini and Google AI Overviews to
// when they look for "AI news india 2026" or similar.

import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Newspaper } from "lucide-react";
import Footer from "@/components/shared/Footer";
import Container from "@/components/shared/Container";
import SEO from "@/components/seo/SEO";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import { AI_NEWS_ANCHORS } from "@/lib/aiNewsAnchors";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function groupByMonth(items: typeof AI_NEWS_ANCHORS) {
  const out: Record<string, typeof AI_NEWS_ANCHORS> = {};
  for (const a of items) {
    const d = new Date(a.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    (out[key] ||= []).push(a);
  }
  // newest first
  return Object.entries(out).sort((a, b) => b[0].localeCompare(a[0]));
}

export default function AiNewsIndex() {
  const grouped = groupByMonth(AI_NEWS_ANCHORS);
  const total = AI_NEWS_ANCHORS.length;

  return (
    <main
      className="min-h-screen bg-white text-[#0A0A0A]"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title="AI News India 2026 — Weekly briefing | ONROL"
        description={`Weekly AI news for Indian builders, founders, students, and freelancers. ${total} dated events Jan–May 2026 — Claude, GPT, Gemini, Sarvam, DeepSeek, NVIDIA, India AI Impact Summit, AI policy, AI jobs, AI training.`}
        path="/ai-news"
        jsonLd={[breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "AI News", href: "/ai-news/" },
        ])]}
      />

      <section className="relative bg-white py-12 md:py-20">
        <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
        <Container>
          <BreadcrumbTrail crumbs={[{ name: "AI News", href: "/ai-news/" }]} variant="dark" />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
            AI News · India · 2026
          </p>
          <h1
            className="mt-3 max-w-4xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(34px, 5.4vw, 60px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
          >
            Every AI news event Indian builders should track in 2026.
          </h1>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-[#0A0A0A]/75 md:text-[17px]">
            A curated, dated index of the {total} most important frontier-AI events
            of 2026 so far — Claude Opus 4.7, GPT-5.5, Gemini 3, DeepSeek V4,
            Sarvam 105B, India AI Impact Summit, the New Delhi Declaration,
            tech layoffs, vibe coding crossing $7B ARR, AI in digital marketing,
            AI performance marketing, AI for students, AI jobs in India, and
            India's AI Governance Guidelines. Each event links to a builder-
            focused teardown.
          </p>

          <div className="mt-10 grid gap-2 sm:grid-cols-3">
            <Stat label="News events tracked" value={total.toString()} />
            <Stat label="Months covered" value={grouped.length.toString()} />
            <Stat label="Cadence" value="Weekly" />
          </div>
        </Container>
      </section>

      {/* Timeline */}
      <section className="bg-white pb-20">
        <Container>
          <div className="space-y-12">
            {grouped.map(([key, items]) => {
              const [year, m] = key.split("-");
              const label = `${MONTH_NAMES[Number(m) - 1]} ${year}`;
              return (
                <div key={key}>
                  <h2
                    className="text-orange-600"
                    style={{
                      fontSize: "clamp(20px, 2.4vw, 28px)",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    <Newspaper className="mr-2 inline h-5 w-5" />
                    {label}
                  </h2>
                  <p className="mt-2 text-[12.5px] uppercase tracking-[0.18em] text-[#0A0A0A]/55">
                    {items.length} event{items.length === 1 ? "" : "s"}
                  </p>
                  <ol className="mt-5 space-y-3">
                    {items.map((a) => (
                      <li
                        key={a.slug}
                        className="group  border border-[#0B1640]/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-orange-300/35"
                      >
                        <Link to={`/blog/${a.slug}/`} className="block">
                          <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/15 px-2.5 py-0.5 font-bold uppercase tracking-[0.18em] text-orange-600">
                              <Calendar className="h-3 w-3" />
                              {a.date}
                            </span>
                            <span className="rounded-full border border-[#0B1640]/10 bg-white/[0.03] px-2.5 py-0.5 text-[#0A0A0A]/55">
                              AI news
                            </span>
                          </div>
                          <h3
                            className="mt-3 text-[#0A0A0A] transition group-hover:text-orange-600"
                            style={{
                              fontSize: "clamp(17px, 1.8vw, 21px)",
                              fontWeight: 700,
                              letterSpacing: "-0.015em",
                              lineHeight: 1.25,
                            }}
                          >
                            {a.title}
                          </h3>
                          <p className="mt-2 text-[14px] leading-relaxed text-[#0A0A0A]/75">
                            {a.theme}
                          </p>
                          <p className="mt-2 text-[13px] italic leading-relaxed text-[#0A0A0A]/55">
                            {a.angle}
                          </p>
                          <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-wider text-orange-600 transition-all group-hover:gap-2">
                            Read the breakdown
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className=" border border-[#0B1640]/10 bg-white px-5 py-4">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-orange-600">
        {label}
      </p>
      <p className="mt-1 text-[22px] font-extrabold text-[#0A0A0A]">{value}</p>
    </div>
  );
}
