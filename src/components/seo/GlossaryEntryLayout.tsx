import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;
import Container from "@/components/shared/Container";
import SEO from "@/components/seo/SEO";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import { breadcrumbJsonLd, definedTermJsonLd } from "@/lib/structuredData";
import type { GlossaryEntry } from "@/lib/glossaryData";
import { glossary } from "@/lib/glossaryData";

export default function GlossaryEntryLayout({ entry }: { entry: GlossaryEntry }) {
  const path = `/glossary/${entry.slug}/`;
  const related = entry.related
    .map((slug) => glossary.find((g) => g.slug === slug))
    .filter((x): x is GlossaryEntry => Boolean(x))
    .slice(0, 6);

  const metaTitle = `${entry.term} — ONROL AI Glossary`;
  const metaDescription = entry.short;

  return (
    <main
      className="bg-[#f3f5f8] pt-24 text-[#0B1640] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title={metaTitle}
        description={metaDescription}
        path={path}
        image="https://onrol.in/og/glossary.png"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Glossary", href: "/glossary/" },
            { name: entry.term, href: path },
          ]),
          definedTermJsonLd({
            slug: entry.slug,
            term: entry.term,
            description: entry.body,
            category: entry.category,
            alsoKnownAs: entry.alsoKnownAs,
          }),
        ]}
      />

      {/* Hero */}
      <section className="relative bg-[#f3f5f8] py-12 md:py-16">
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-violet-400 to-pink-500" />
        <Container>
          <BreadcrumbTrail
            crumbs={[
              { name: "Glossary", href: "/glossary/" },
              { name: entry.term, href: path },
            ]}
            variant="dark"
          />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
            — {entry.category}
          </p>
          <h1
            className="mt-3 max-w-4xl text-[#0B1640]"
            style={{
              fontSize: "clamp(36px, 5.6vw, 68px)",
              lineHeight: 1,
              letterSpacing: "-0.035em",
              fontWeight: 800,
            }}
          >
            {entry.term}
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-medium leading-relaxed text-[#0B1640]/85 md:text-2xl md:leading-snug">
            {entry.short}
          </p>
          {entry.alsoKnownAs && entry.alsoKnownAs.length > 0 ? (
            <p className="mt-4 text-[12.5px] uppercase tracking-[0.18em] text-[#0B1640]/55">
              Also known as: <span className="text-[#0B1640]/85">{entry.alsoKnownAs.join(" · ")}</span>
            </p>
          ) : null}
        </Container>
      </section>

      {/* Body — dark surface with elevated card. */}
      <section className="bg-[#f3f5f8] py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-3xl rounded-3xl border border-[#0B1640]/10 bg-white p-7 md:p-12">
            <h2
              className="text-[#0B1640]"
              style={{
                fontSize: "clamp(24px, 3.4vw, 36px)",
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                fontWeight: 800,
              }}
            >
              What is {entry.term}?
            </h2>
            <p className="mt-5 text-[15.5px] leading-[1.75] text-[#0B1640]/85 md:text-[16.5px]">
              {entry.body}
            </p>

            {entry.pillarLinks && entry.pillarLinks.length > 0 ? (
              <div className="mt-10 rounded-2xl border border-orange-300/20 bg-orange-500/[0.06] p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-600">
                  Learn more
                </p>
                <h3
                  className="mt-2 text-[#0B1640]"
                  style={{
                    fontSize: "clamp(18px, 2.2vw, 22px)",
                    lineHeight: 1.18,
                    fontWeight: 800,
                    letterSpacing: "-0.012em",
                  }}
                >
                  ONROL pages on {entry.term}
                </h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {entry.pillarLinks.map((p) => (
                    <Link
                      key={p.href}
                      to={p.href}
                      className="group flex items-start justify-between gap-3 rounded-xl border border-[#0B1640]/10 bg-white/[0.03] px-4 py-3 transition hover:-translate-y-0.5 hover:border-orange-300/40 hover:bg-white/8"
                    >
                      <span className="text-[14px] font-semibold text-[#0B1640]">{p.name}</span>
                      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 transition group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Container>
      </section>

      {/* Related terms */}
      {related.length > 0 ? (
        <section className="bg-[#f3f5f8] py-16 md:py-24">
          <Container>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">— Related</p>
            <h2
              className="mt-3 max-w-3xl text-[#0B1640]"
              style={{
                fontSize: "clamp(24px, 3.2vw, 38px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                fontWeight: 800,
              }}
            >
              Terms connected to {entry.term}
            </h2>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/glossary/${r.slug}/`}
                  className="group flex flex-col rounded-2xl border border-[#0B1640]/10 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-300/40"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600">{r.category}</p>
                  <p className="mt-2 text-[16px] font-semibold text-[#0B1640]">{r.term}</p>
                  <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-[#0B1640]/75">{r.short}</p>
                  <span className="mt-auto pt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600 transition group-hover:translate-x-0.5">
                    Open →
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {/* CTA banner removed per request (image/button not functioning). */}
      <div className="pb-16 md:pb-24" />
    </main>
  );
}
