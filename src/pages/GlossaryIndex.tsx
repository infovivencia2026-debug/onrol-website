import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Container from "@/components/shared/Container";
import SEO from "@/components/seo/SEO";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import {
  breadcrumbJsonLd,
  definedTermSetJsonLd,
} from "@/lib/structuredData";
import { glossary, glossaryCategories } from "@/lib/glossaryData";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

// Group entries alphabetically (A, B, C…); slot non-letters under "#".
function groupAlpha(items: typeof glossary) {
  const buckets: Record<string, typeof glossary> = {};
  for (const e of items) {
    const ch = e.term[0]?.toUpperCase() || "#";
    const key = /[A-Z]/.test(ch) ? ch : "#";
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(e);
  }
  return Object.keys(buckets)
    .sort()
    .map((k) => ({ letter: k, items: buckets[k].sort((a, b) => a.term.localeCompare(b.term)) }));
}

export default function GlossaryIndex() {
  const [filter, setFilter] = useState<string>("All");
  const categories = useMemo(() => glossaryCategories(), []);
  const visible = useMemo(
    () => (filter === "All" ? glossary : glossary.filter((g) => g.category === filter)),
    [filter],
  );
  const groups = useMemo(() => groupAlpha(visible), [visible]);

  return (
    <main
      className="bg-white pt-24 text-[#0A0A0A] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title="AI Glossary — Plain-English definitions of every AI term that matters | ONROL"
        description="A practitioner's AI glossary: 50+ terms (LLM, RAG, agents, MCP, vibe coding, prompt engineering and more) defined in plain English by ONROL — India's AI Execution School."
        path="/glossary/"
        image="https://onrol.in/og/glossary.png"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Glossary", href: "/glossary/" },
          ]),
          definedTermSetJsonLd(glossary.map((g) => ({ slug: g.slug, term: g.term }))),
        ]}
      />

      {/* Hero */}
      <section className="relative bg-white py-12 md:py-16">
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-violet-400 to-pink-500" />
        <Container>
          <BreadcrumbTrail crumbs={[{ name: "Glossary", href: "/glossary/" }]} variant="dark" />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">— AI Glossary</p>
          <h1
            className="mt-3 max-w-4xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(38px, 6.2vw, 76px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 800,
            }}
          >
            Every AI term <span className="text-orange-400">that matters,</span> in plain English.
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-[#0A0A0A]/75">
            {glossary.length} definitions across models, tools, techniques, and concepts — written for practitioners
            who want to understand AI deeply enough to ship with it.
          </p>

          {/* Category filter chips */}
          <div className="mt-7 flex flex-wrap gap-2">
            {categories.map((c) => {
              const active = c === filter;
              return (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
                    active
                      ? "bg-orange-500 text-[#0A0A0A]"
                      : "border border-[#0B1640]/10 bg-white/[0.03] text-[#0A0A0A]/75 hover:border-orange-300/40 hover:bg-white/8 hover:text-[#0A0A0A]"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Alphabetical grid — dark surface. */}
      <section className="bg-white py-16 md:py-24">
        <Container>
          {groups.length === 0 ? (
            <p className="text-[#0A0A0A]/55">No terms match that filter.</p>
          ) : (
            <div className="space-y-12">
              {groups.map((g) => (
                <div key={g.letter}>
                  <h2
                    className="border-b border-[#0B1640]/10 pb-3 text-[#0A0A0A]"
                    style={{
                      fontSize: "clamp(28px, 4vw, 44px)",
                      lineHeight: 1,
                      letterSpacing: "-0.025em",
                      fontWeight: 800,
                    }}
                  >
                    {g.letter}
                  </h2>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {g.items.map((e) => (
                      <Link
                        key={e.slug}
                        to={`/glossary/${e.slug}/`}
                        className="group flex flex-col  border border-[#0B1640]/10 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-300/40"
                      >
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600">
                          {e.category}
                        </p>
                        <p
                          className="mt-2 text-[#0A0A0A]"
                          style={{
                            fontSize: "clamp(17px, 2.2vw, 21px)",
                            lineHeight: 1.18,
                            fontWeight: 800,
                            letterSpacing: "-0.012em",
                          }}
                        >
                          {e.term}
                        </p>
                        <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-[#0A0A0A]/70">
                          {e.short}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
