import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Sparkles, Search, X } from "lucide-react";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";
import SEO from "@/components/seo/SEO";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import { breadcrumbJsonLd, qaPageJsonLd } from "@/lib/structuredData";
import { QUESTIONS, QUESTION_TOPICS } from "@/lib/questionsData";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;
const PAGE_URL = "https://onrol.in/questions/";

export default function Questions() {
  const path = "/questions/";
  const [topic, setTopic] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const filtered = useMemo(() => {
    let pool = QUESTIONS;
    if (topic !== "All") pool = pool.filter((q) => q.topic === topic);
    const needle = query.trim().toLowerCase();
    if (needle) {
      pool = pool.filter(
        (q) =>
          q.q.toLowerCase().includes(needle) ||
          q.a.toLowerCase().includes(needle),
      );
    }
    return pool;
  }, [topic, query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { All: QUESTIONS.length };
    for (const q of QUESTIONS) map[q.topic] = (map[q.topic] ?? 0) + 1;
    return map;
  }, []);

  return (
    <main
      className="bg-white pt-24 text-[#0A0A0A] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title="AI Questions Answered — India's AI Execution School | ONROL"
        description="30+ practical answers to the most-asked AI questions from Indian students, professionals, freelancers, and business owners — covering learning paths, careers, tools, costs, cohorts, and more."
        path={path}
        image="https://onrol.in/og/default.png"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Questions", href: path },
          ]),
          qaPageJsonLd(
            QUESTIONS.map((q) => ({
              question: q.q,
              answer: q.a,
              url: q.related?.href
                ? `https://onrol.in${q.related.href}`
                : undefined,
            })),
            PAGE_URL,
            "AI Questions Answered — ONROL",
          ),
        ]}
      />

      {/* Hero */}
      <section className="relative bg-white py-14 md:py-20">
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
        <Container>
          <BreadcrumbTrail crumbs={[{ name: "Questions", href: path }]} variant="dark" />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
            — AI questions, answered
          </p>
          <h1
            className="mt-4 max-w-4xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(38px, 6vw, 76px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 800,
            }}
          >
            The questions Indians actually ask <span className="text-orange-400">about AI</span>.
          </h1>
          <p className="mt-7 max-w-3xl text-lg text-[#0A0A0A]/85 md:text-xl md:leading-snug">
            {QUESTIONS.length} practical answers — careers, costs, cohorts, tools. Curated and authored by ONROL,
            updated as the market shifts. Use Ctrl+F or the search box to find yours fast.
          </p>
        </Container>
      </section>

      {/* Filter + search */}
      <section className="bg-white py-8">
        <Container>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {QUESTION_TOPICS.map((t) => {
                const active = topic === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTopic(t)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition active:scale-[0.98] ${
                      active
                        ? "bg-orange-500 text-[#0A0A0A]"
                        : "border border-[#0B1640]/10 bg-white/[0.03] text-[#0A0A0A]/75 hover:border-orange-300/40 hover:bg-white/8 hover:text-[#0A0A0A]"
                    }`}
                  >
                    {t}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                        active ? "bg-white/20" : "bg-white/8 text-[#0A0A0A]/55"
                      }`}
                    >
                      {counts[t] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0A0A0A]/55" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions…"
                className="h-11 w-full rounded-full border border-[#0B1640]/10 bg-white/[0.03] pl-10 pr-10 text-[13.5px] text-[#0A0A0A] placeholder:text-[#0A0A0A]/55 focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[#0A0A0A]/55 transition hover:bg-white/10 hover:text-[#0A0A0A]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      {/* Q&A list */}
      <section className="bg-white py-12 md:py-16">
        <Container>
          {filtered.length === 0 ? (
            <p className="text-center text-[14.5px] text-[#0A0A0A]/75">
              No questions match. Try a different topic or clear the search.
            </p>
          ) : (
            <div className="mx-auto max-w-3xl space-y-3">
              {filtered.map((item, i) => {
                const open = openIdx === i;
                return (
                  <motion.details
                    key={item.q}
                    initial={false}
                    open={open}
                    onToggle={(e) =>
                      setOpenIdx((e.target as HTMLDetailsElement).open ? i : null)
                    }
                    className={`group  border bg-white transition ${
                      open
                        ? "border-orange-300/40"
                        : "border-[#0B1640]/10"
                    }`}
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600">
                          {item.topic}
                        </p>
                        <h2
                          className="mt-1 text-[#0A0A0A]"
                          style={{
                            fontSize: "clamp(16px, 2.2vw, 20px)",
                            lineHeight: 1.25,
                            fontWeight: 700,
                            letterSpacing: "-0.005em",
                          }}
                        >
                          {item.q}
                        </h2>
                      </div>
                      <ChevronDown
                        className={`mt-1 h-4 w-4 shrink-0 text-orange-600 transition-transform ${
                          open ? "rotate-180" : ""
                        }`}
                      />
                    </summary>
                    <div className="px-5 pb-5 text-[14.5px] leading-[1.7] text-[#0A0A0A]/85 sm:px-6">
                      <p>{item.a}</p>
                      {item.related ? (
                        <Link
                          to={item.related.href}
                          className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-[0.18em] text-orange-600 transition hover:text-orange-600"
                        >
                          {item.related.label} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                    </div>
                  </motion.details>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      {/* CTA */}
      <section className="relative bg-white pb-20 md:pb-28">
        <Container>
          <div className="relative overflow-hidden  bg-gradient-to-r from-[#FF6B47] via-[#FF7A3D] to-[#FF8A4C] p-8 md:p-12">
            <div className="grid gap-6 md:grid-cols-[1.2fr_auto] md:items-center">
              <div>
                <h2
                  className="text-[#0A0A0A]"
                  style={{
                    fontSize: "clamp(28px, 4.4vw, 44px)",
                    fontWeight: 900,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.05,
                  }}
                >
                  Question not on the list?
                </h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-black/75">
                  The Free Masterclass is the fastest path to specific answers — 90 minutes, live, no pitch.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/programs/"
                  className="inline-flex items-center gap-2  bg-white px-7 py-3.5 text-[14px] font-bold uppercase tracking-wider text-orange-700 transition hover:bg-orange-50"
                >
                  <Sparkles className="h-4 w-4" />
                  Reserve seat <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/contact/"
                  className="inline-flex items-center gap-2  border border-white/30 bg-white/10 px-6 py-3.5 text-[14px] font-bold uppercase tracking-wider text-[#0A0A0A] backdrop-blur transition hover:bg-white/20"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
