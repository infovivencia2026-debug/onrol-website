import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react";
import Container from "@/components/shared/Container";
import FounderCard from "@/components/shared/FounderCard";
import SEO from "@/components/seo/SEO";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import { projectArchetypes, deployedTools, type ProjectArchetype } from "@/lib/proofData";

const ACCENT: Record<ProjectArchetype["accent"], { strip: string; ring: string; chip: string; num: string }> = {
  cyan:    { strip: "from-orange-500 to-orange-500",       ring: "ring-cyan-300/40",   chip: "bg-orange-500/10 text-orange-600 border-orange-300/30",     num: "text-orange-600" },
  violet:  { strip: "from-violet-500 to-fuchsia-500",  ring: "ring-violet-300/40", chip: "bg-violet-500/10 text-violet-200 border-violet-300/30", num: "text-violet-600" },
  amber:   { strip: "from-amber-500 to-orange-500",    ring: "ring-amber-300/40",  chip: "bg-amber-500/10 text-amber-200 border-amber-300/30",   num: "text-amber-300" },
  emerald: { strip: "from-emerald-500 to-teal-500",    ring: "ring-emerald-300/40",chip: "bg-emerald-500/10 text-emerald-200 border-emerald-300/30", num: "text-emerald-600" },
  pink:    { strip: "from-pink-500 to-rose-500",       ring: "ring-pink-300/40",   chip: "bg-pink-500/10 text-pink-200 border-pink-300/30",     num: "text-pink-300" },
};

// ItemList JSON-LD signals to AI engines that this page is a curated list
// of products / project archetypes — strong citation signal for queries like
// "AI projects you can build" or "AI portfolio examples for students".
function itemListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "ONROL — projects every learner ships in 3 months",
    description:
      "The five core project archetypes every ONROL learner builds and deploys during the 3-month Generalist intensive.",
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: projectArchetypes.length,
    itemListElement: projectArchetypes.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreativeWork",
        name: p.title,
        description: p.what,
        url: `https://onrol.in/proof/#${p.id}`,
        keywords: p.stack.join(", "),
      },
    })),
  };
}

export default function Proof() {
  const path = "/proof/";
  const categories = useMemo(() => {
    const cats = Array.from(new Set(deployedTools.map((t) => t.category)));
    return ["All", ...cats];
  }, []);
  const [filter, setFilter] = useState<string>("All");
  const visibleTools = useMemo(
    () => (filter === "All" ? deployedTools : deployedTools.filter((t) => t.category === filter)),
    [filter],
  );

  return (
    <main
      className="bg-white pt-24 text-[#0A0A0A] md:pt-28"
      style={{ fontFamily: `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif` }}
    >
      <SEO
        title="What You'll Build at ONROL — 5 Live AI Projects in 3 Months"
        description="Every ONROL learner ships 5 AI project archetypes — personal AI assistant, vibe-coded website, backend automation, lead-qualifier agent, AI content system. Plus 19 already-deployed tools at tools.onrol.in."
        path={path}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Proof", href: path },
          ]),
          itemListJsonLd(),
        ]}
      />

      {/* Hero */}
      <section className="relative bg-white py-12 md:py-20">
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-orange-400 to-violet-500" />
        <Container>
          <BreadcrumbTrail crumbs={[{ name: "Proof", href: path }]} variant="dark" />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">— Proof of execution</p>
          <h1
            className="mt-3 max-w-4xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(40px, 6.5vw, 76px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 800,
            }}
          >
            What you'll <span className="text-orange-400">build.</span>
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-medium leading-relaxed text-[#0A0A0A]/85 md:text-xl">
            Every ONROL learner ships five real AI projects in 3 months. Below is exactly what they build — plus the 19 tools we run at tools.onrol.in to prove ONROL itself walks the talk.
          </p>
          <p className="mt-3 max-w-3xl text-[13px] italic text-[#0A0A0A]/55">
            Live student-project gallery launches with Cohort 8 (Aug 2026). Until then, here's the deterministic list of what every cohort produces.
          </p>
        </Container>
      </section>

      {/* 5 archetypes — repainted to dark surface to match the rest of the site. */}
      <section className="bg-white py-16 md:py-24">
        <Container>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">— The 5 builds</p>
          <h2
            className="mt-3 max-w-3xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(30px, 4.6vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              fontWeight: 800,
            }}
          >
            Five projects, 3 months, five live URLs.
          </h2>
          <div className="mt-10 space-y-6">
            {projectArchetypes.map((p) => {
              const a = ACCENT[p.accent];
              return (
                <article
                  key={p.id}
                  id={p.id}
                  className="grid scroll-mt-32 gap-6  border border-[#0B1640]/10 bg-white p-7 sm:p-9 lg:grid-cols-[180px_1fr] lg:gap-10"
                >
                  <div>
                    <span
                      style={{
                        fontSize: "clamp(64px, 8vw, 112px)",
                        lineHeight: 0.85,
                        fontWeight: 800,
                        letterSpacing: "-0.04em",
                      }}
                      className={a.num}
                    >
                      {p.number}
                    </span>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0A0A0A]/55">
                      {p.buildDay}
                    </p>
                    <span className={`mt-3 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${a.chip}`}>
                      {p.category}
                    </span>
                  </div>
                  <div>
                    <h3
                      className="text-[#0A0A0A]"
                      style={{
                        fontSize: "clamp(22px, 3vw, 32px)",
                        lineHeight: 1.1,
                        fontWeight: 800,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {p.title}
                    </h3>
                    <p className="mt-2 text-[14.5px] font-semibold text-orange-600/85 md:text-base">{p.oneLiner}</p>
                    <p className="mt-4 text-[14.5px] leading-relaxed text-[#0A0A0A]/75 md:text-[15.5px]">{p.what}</p>
                    <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                      {p.outcomes.map((o) => (
                        <li
                          key={o}
                          className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[#0A0A0A]/85"
                        >
                          <span aria-hidden className={`mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r ${a.strip}`} />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {p.stack.map((s) => (
                        <span
                          key={s}
                          className="rounded-md border border-[#0B1640]/10 bg-white/[0.03] px-2 py-0.5 text-[10.5px] font-semibold text-[#0A0A0A]/75"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 19 deployed tools — real proof of execution */}
      <section className="relative bg-white py-16 md:py-24">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" />
        <Container>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">— ONROL ships what it teaches</p>
          <h2
            className="mt-3 max-w-3xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(30px, 4.6vw, 52px)",
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              fontWeight: 800,
            }}
          >
            19 deployed tools at <span className="text-orange-400">tools.onrol.in</span>
          </h2>
          <p className="mt-4 max-w-2xl text-base text-[#0A0A0A]/75 md:text-lg">
            Every ONROL learner gets free lifetime access to all 19 tools. They're built using the same vibe-coding + AI-orchestration stack we teach — proof that the curriculum produces real, deployed software.
          </p>

          <div className="mt-7 flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c === filter;
              return (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-cyan-300 text-[#f3f5f8]"
                      : "border border-[#0B1640]/15 bg-white/5 text-[#0A0A0A]/75 hover:border-white/40 hover:bg-white/10"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTools.map((t) => (
              <a
                key={t.slug}
                href={`https://tools.onrol.in/products/${t.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3  border border-[#0B1640]/10 bg-white p-4 transition hover:-translate-y-0.5 hover:border-orange-300/45 hover:bg-white"
              >
                <img
                  src={`https://tools.onrol.in/logos/${t.slug}.svg`}
                  alt={`${t.name} logo`}
                  loading="lazy"
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0  shadow-sm"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14.5px] font-bold text-[#0A0A0A]">{t.name}</p>
                    <ExternalLink className="h-3 w-3 shrink-0 text-[#0A0A0A]/55 transition group-hover:text-orange-600" />
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[#0A0A0A]/75">{t.blurb}</p>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a
              href="https://tools.onrol.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2  border border-orange-300/35 bg-gradient-to-r from-orange-400/15 via-indigo-400/15 to-violet-400/15 px-6 py-3 text-sm font-semibold text-orange-600 transition hover:border-orange-200/60 hover:from-orange-300/25"
            >
              Open the full tools suite at tools.onrol.in
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </Container>
      </section>

      {/* Founder credibility */}
      <section className="bg-white py-14 md:py-16">
        <Container>
          <FounderCard variant="light" size="expanded" />
        </Container>
      </section>

      {/* Final CTA — orange banner, matches the rest of the site. */}
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
                  Your turn — ship five real AI projects in 3 months.
                </h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-black/75">
                  Reserve a seat for the Free Masterclass. 90 minutes · AI agents + vibe coding · No pitch.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/programs/"
                  className="inline-flex items-center gap-2  bg-white px-7 py-3.5 text-[14px] font-bold uppercase tracking-wider text-orange-700 transition hover:bg-orange-50"
                >
                  Reserve seat <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/programs/ai-generalist/"
                  className="inline-flex items-center gap-2  border border-white/30 bg-white/10 px-6 py-3.5 text-[14px] font-bold uppercase tracking-wider text-[#0A0A0A] backdrop-blur transition hover:bg-white/20"
                >
                  See AI Generalist
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
