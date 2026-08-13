import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";
import FounderCard from "@/components/shared/FounderCard";
import SEO from "@/components/seo/SEO";
import FAQ from "@/components/seo/FAQ";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import CitationBait from "@/components/seo/CitationBait";
import { breadcrumbJsonLd, faqJsonLd, speakableJsonLd, localBusinessJsonLd, itemListJsonLd, SITE_URL } from "@/lib/structuredData";
import { founderJsonLd } from "@/lib/founder";
import { linkifyGlossaryTerms } from "@/lib/glossaryLinker";
import type { PillarPage } from "@/lib/pillarContent";
import { relatedFor } from "@/lib/pillarContent";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

function PillarSectionInner({ s }: { s: PillarPage["sections"][number] }) {
  return (
    <>
      <h2
        className="max-w-4xl text-[#0A0A0A]"
        style={{
          fontSize: "clamp(28px, 4.2vw, 48px)",
          lineHeight: 1.05,
          letterSpacing: "-0.025em",
          fontWeight: 800,
        }}
      >
        {s.heading}
      </h2>
      {s.body ? (
        <p className="mt-5 max-w-3xl text-[15.5px] leading-relaxed text-[#0A0A0A]/80 md:text-base md:leading-[1.7]">
          {linkifyGlossaryTerms(s.body)}
        </p>
      ) : null}
      {s.bullets && s.bullets.length > 0 ? (
        <ul className="mt-6 grid max-w-3xl gap-3">
          {s.bullets.map((b) => (
            <li key={b} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-[#0A0A0A]/85 md:text-[15.5px]">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

const ACCENT_MAP: Record<PillarPage["accent"], { strip: string; eyebrow: string; emphasis: string; tile: string }> = {
  cyan:    { strip: "from-orange-500 via-orange-400 to-orange-500",       eyebrow: "text-orange-600",     emphasis: "text-orange-700",     tile: "bg-orange-50 border-orange-200 text-orange-700" },
  orange:  { strip: "from-orange-500 via-amber-400 to-orange-500", eyebrow: "text-orange-600",   emphasis: "text-orange-700",   tile: "bg-orange-50 border-orange-200 text-orange-700" },
  violet:  { strip: "from-violet-500 via-fuchsia-400 to-violet-500", eyebrow: "text-violet-600", emphasis: "text-violet-700",   tile: "bg-violet-50 border-violet-200 text-violet-700" },
  emerald: { strip: "from-emerald-500 via-teal-400 to-emerald-500", eyebrow: "text-emerald-600", emphasis: "text-emerald-700", tile: "bg-emerald-50 border-emerald-200 text-emerald-700" },
  amber:   { strip: "from-amber-500 via-yellow-400 to-amber-500",   eyebrow: "text-amber-600",   emphasis: "text-amber-700",   tile: "bg-amber-50 border-amber-200 text-amber-700" },
  pink:    { strip: "from-pink-500 via-rose-400 to-pink-500",       eyebrow: "text-pink-600",    emphasis: "text-pink-700",    tile: "bg-pink-50 border-pink-200 text-pink-700" },
  blue:    { strip: "from-orange-500 via-orange-400 to-orange-500",        eyebrow: "text-orange-600",    emphasis: "text-orange-700",    tile: "bg-orange-50 border-orange-200 text-orange-700" },
  rose:    { strip: "from-rose-500 via-pink-400 to-rose-500",       eyebrow: "text-rose-600",    emphasis: "text-rose-700",    tile: "bg-rose-50 border-rose-200 text-rose-700" },
};

export default function PillarPageLayout({ page }: { page: PillarPage }) {
  const accent = ACCENT_MAP[page.accent];
  // Trailing slash matches the URL OLS serves directly (no 301 redirect),
  // which Bing prefers and Google handles fine.
  const path = `/${page.slug}/`;
  const headlineParts = page.h1.trim().split(" ");
  const headlineHead = headlineParts.slice(0, -1).join(" ");
  const headlineTail = headlineParts.slice(-1)[0] || "";
  const related = page.related && page.related.length ? page.related : relatedFor(page.slug);
  const cta = page.cta || { label: "Begin Free Masterclass", href: "/programs/" };

  return (
    <main
      className="bg-white pt-24 text-[#0A0A0A] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title={page.title}
        description={page.metaDescription}
        path={path}
        image="https://onrol.in/og/default.png"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: page.h1, href: path },
          ]),
          founderJsonLd(),
          // Speakable: tells AI search / voice assistants which sentences
          // best summarise the page. Targets the H1 + the .lead paragraph.
          speakableJsonLd({
            url: `https://onrol.in${path}`,
            cssSelectors: ["h1", "p.lead"],
          }),
          // FAQ schema if the page has FAQs.
          ...(page.faqs && page.faqs.length > 0
            ? [faqJsonLd(page.faqs.map((f) => ({ q: f.q, a: f.a })))]
            : []),
          // LocalBusiness schema on city pages — helps Google's local pack
          // recognise ONROL as serving the named city. The Hyderabad page is
          // the actual on-campus address; other cities are area-served.
          ...(page.slug.startsWith("ai-institute-") || page.slug === "ai-institutes-near-me"
            ? [localBusinessJsonLd()]
            : []),
          // ItemList — only on listicle pillars that ship an `itemList` payload.
          // Drives Google's "Top N" rich-result card + AI-search list summaries.
          ...(page.itemList
            ? [
                itemListJsonLd({
                  name: page.itemList.name,
                  description: page.itemList.description,
                  url: `${SITE_URL}${path}`,
                  items: page.itemList.items,
                }),
              ]
            : []),
        ]}
      />

      {/* Hero */}
      <section className="relative bg-white py-12 md:py-20">
        <div aria-hidden className={`absolute left-0 right-0 top-0 h-1 bg-gradient-to-r ${accent.strip}`} />
        <Container>
          <BreadcrumbTrail crumbs={[{ name: page.h1, href: path }]} variant="light" />
          <p className={`mt-6 text-[11px] font-bold uppercase tracking-[0.3em] ${accent.eyebrow}`}>{page.eyebrow}</p>
          <h1
            className="mt-3 max-w-4xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(40px, 6.5vw, 80px)",
              lineHeight: 0.98,
              letterSpacing: "-0.035em",
              fontWeight: 800,
            }}
          >
            {headlineHead}{" "}
            <span className="text-orange-500">{headlineTail}</span>
          </h1>
          <p className="lead mt-5 max-w-2xl text-lg font-medium leading-relaxed text-[#0A0A0A]/90 md:text-2xl md:leading-tight">
            {page.hook}
          </p>
          <p className="lead-supporting mt-5 max-w-3xl text-base leading-relaxed text-[#0A0A0A]/70 md:text-lg">{page.intro}</p>

          {/* Last-updated freshness signal — AI engines + Google both reward
              recent dates. Captured at prerender time and baked into the static HTML. */}
          <p className="mt-4 text-[12px] text-[#0A0A0A]/55">
            Last updated:{" "}
            <time dateTime={new Date().toISOString().slice(0, 10)}>
              {new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
            </time>
          </p>

          {/* Stat tiles */}
          {page.stats && page.stats.length > 0 ? (
            <div className="mt-10 grid gap-4 border-t border-[#0B1640]/10 pt-7 sm:grid-cols-3 sm:gap-8">
              {page.stats.map((s, i) => {
                const colors = ["text-orange-600", "text-orange-600", "text-violet-600"];
                return (
                  <div key={s.label}>
                    <span
                      className={colors[i % colors.length]}
                      style={{
                        fontSize: "clamp(36px, 5.5vw, 60px)",
                        lineHeight: 0.95,
                        fontWeight: 800,
                        letterSpacing: "-0.04em",
                      }}
                    >
                      {s.value}
                    </span>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0A0A0A]/55">{s.label}</p>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Hero CTAs */}
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to={cta.href}
              className="inline-flex items-center gap-2  bg-[#f46718] px-7 py-4 text-[14px] font-bold text-[#0A0A0A] transition hover:brightness-110"
            >
              <Sparkles className="h-4 w-4" />
              {cta.label}
            </Link>
            <Link
              to="/programs/ai-generalist/"
              className="inline-flex items-center gap-2  border border-[#0B1640]/15 bg-white px-6 py-4 text-[14px] font-bold uppercase tracking-wider text-[#0A0A0A] transition hover:border-orange-300/60 hover:bg-orange-50"
            >
              See AI Generalist
            </Link>
          </div>
        </Container>
      </section>

      {/* Body sections — alternates dark/cream */}
      {/* Body sections — alternating bg shades on the dark side instead of dark/cream. */}
      {page.sections.map((s, i) => {
        const elevated = i % 2 === 1;
        return (
          <section
            key={s.heading + i}
            className={`bg-white py-16 md:py-24`}
          >
            <Container>
              {elevated ? (
                <div className=" border border-[#0B1640]/10 bg-white p-7 md:p-12">
                  <PillarSectionInner s={s} />
                </div>
              ) : (
                <PillarSectionInner s={s} />
              )}
            </Container>
          </section>
        );
      })}

      {/* Founder credibility (E-E-A-T signal for AI search) */}
      <section className="bg-white py-14 md:py-16">
        <Container>
          <FounderCard variant="dark" size="expanded" />
        </Container>
      </section>

      {/* Citation-bait block: short, factual, source-able by AI engines.
          Placed before FAQs so ChatGPT/Claude/Gemini lift the canonical
          paragraph when a user asks "what is ONROL". */}
      <section className="bg-white py-2">
        <Container>
          <CitationBait variant="dark" />
        </Container>
      </section>

      {/* FAQ */}
      <FAQ
        eyebrow={`Frequently asked — ${page.h1}`}
        title="Common questions"
        items={page.faqs}
        variant="light"
      />

      {/* Related links rail */}
      <section className="bg-white py-16 md:py-24">
        <Container>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">— Read next</p>
          <h2
            className="mt-3 max-w-3xl text-[#0A0A0A]"
            style={{
              fontSize: "clamp(24px, 3.2vw, 38px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontWeight: 800,
            }}
          >
            More from ONROL — India's AI Execution School
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <Link
                key={r.href}
                to={r.href}
                className="group flex flex-col  border border-[#0B1640]/10 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-300/50"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600">Related</p>
                <p className="mt-2 text-[15px] font-semibold text-[#0A0A0A]">{r.name}</p>
                {r.blurb ? <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#0A0A0A]/70">{r.blurb}</p> : null}
                <span className="mt-auto pt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600 transition group-hover:translate-x-0.5">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA banner removed per request (image/button not functioning). */}
      <div className="pb-12 md:pb-16" />

      {/* Global footer — critical for internal linking. Every pillar page gets
          ~40 deep links into other pillars/personas/cities, lifting them out
          of Google's "Discovered – currently not indexed" bucket. */}
      <Footer />
    </main>
  );
}
