// /site-map/ — the HTML sitemap. Lists every pillar, blog, glossary entry,
// persona, and tool page on onrol.in. Designed primarily to give Google a
// dense crawl-discovery surface for the 130+ pillars currently stuck in
// "Discovered – currently not indexed".
//
// Linked from the footer (Buyer's guides + AI Institutes by City columns),
// so every page on the site is at most 2 hops from every pillar.

import { Link } from "react-router-dom";
import SEO from "@/components/seo/SEO";
import Footer from "@/components/shared/Footer";
import Container from "@/components/shared/Container";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import { breadcrumbJsonLd } from "@/lib/structuredData";
import { pillarPages } from "@/lib/pillarContent";
import { blogPosts } from "@/lib/blogContent";
import { PERSONAS } from "@/lib/personas";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

// Group pillars by category for clean visual scanning.
function classifyPillar(slug: string): string {
  if (slug.startsWith("ai-institute-")) return "Local SEO — Cities + States";
  if (slug.startsWith("ai-for-")) return "Industry-Specific AI";
  if (slug.startsWith("ai-course-for-") || slug === "ai-course-for-beginners") return "AI Courses by Persona";
  if (
    slug.includes("generative-ai") ||
    slug.includes("agentic-ai") ||
    slug.includes("ai-engineer") ||
    slug.includes("ai-automation") ||
    slug.includes("vibe-coding")
  ) return "Keyword-Specific Courses";
  if (
    slug.startsWith("best-") ||
    slug.startsWith("ai-course-fees") ||
    slug.startsWith("ai-institutes-near-me") ||
    slug.startsWith("how-to-choose") ||
    slug.includes("comparison") ||
    slug === "academic-ai-vs-applied-ai" ||
    slug === "ai-execution-school"
  ) return "Buyer's Guides + Comparison";
  return "Other Pillars";
}

const CATEGORY_ORDER = [
  "Buyer's Guides + Comparison",
  "AI Courses by Persona",
  "Keyword-Specific Courses",
  "Industry-Specific AI",
  "Local SEO — Cities + States",
  "Other Pillars",
];

export default function SiteMap() {
  const path = "/site-map/";

  // Group pillars
  const pillarsByCategory: Record<string, typeof pillarPages> = {};
  for (const p of pillarPages) {
    const c = classifyPillar(p.slug);
    (pillarsByCategory[c] ||= []).push(p);
  }
  for (const c in pillarsByCategory) {
    pillarsByCategory[c].sort((a, b) => a.h1.localeCompare(b.h1));
  }

  return (
    <main
      className="min-h-screen bg-white pt-24 text-[#0A0A0A] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title="ONROL Site Map — Every Pillar, Blog, Persona, Tool | India's AI Execution School"
        description="Complete index of every ONROL page — AI courses by persona, AI institutes by city, AI by industry, blog posts, glossary, tools. Designed for fast navigation + crawl discovery."
        path={path}
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", href: "/" },
            { name: "Site Map", href: path },
          ]),
        ]}
      />

      <section className="bg-white py-12 md:py-16">
        <Container>
          <BreadcrumbTrail crumbs={[{ name: "Site Map", href: path }]} variant="dark" />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
            — Full directory of onrol.in
          </p>
          <h1
            className="mt-3 max-w-4xl"
            style={{
              fontSize: "clamp(34px, 5vw, 60px)",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              fontWeight: 800,
            }}
          >
            Site map — <span className="text-orange-400">every ONROL page</span> in one place.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#0A0A0A]/75 md:text-lg">
            Browse every pillar, blog post, persona, glossary entry, and tool on onrol.in. Use the
            jump links below if you know what you're looking for, or scan top to bottom.
          </p>
          <div className="mt-7 flex flex-wrap gap-2 text-[12px] font-semibold">
            {[
              ["Buyer's guides", "#guides"],
              ["By persona", "#personas"],
              ["By keyword", "#keyword"],
              ["By industry", "#industry"],
              ["By city/state", "#local"],
              ["Personas library", "#persona-pages"],
              ["Blog", "#blog"],
              ["Tools", "#tools"],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-full border border-[#0B1640]/10 bg-white/[0.04] px-3 py-1.5 text-[#0A0A0A]/85 transition hover:border-orange-300/40 hover:text-orange-600"
              >
                {label}
              </a>
            ))}
          </div>
        </Container>
      </section>

      {/* Pillars by category */}
      {CATEGORY_ORDER.map((cat) => {
        const items = pillarsByCategory[cat];
        if (!items || items.length === 0) return null;
        const anchorMap: Record<string, string> = {
          "Buyer's Guides + Comparison": "guides",
          "AI Courses by Persona": "personas",
          "Keyword-Specific Courses": "keyword",
          "Industry-Specific AI": "industry",
          "Local SEO — Cities + States": "local",
        };
        const anchor = anchorMap[cat] || cat.toLowerCase().replace(/\s+/g, "-");
        return (
          <section key={cat} id={anchor} className="bg-white py-10 md:py-12">
            <Container>
              <h2
                className="mb-6 max-w-3xl border-b border-[#0B1640]/10 pb-3 text-[#0A0A0A]"
                style={{
                  fontSize: "clamp(22px, 3.2vw, 32px)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                {cat}
                <span className="ml-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0A0A0A]/55">
                  {items.length}
                </span>
              </h2>
              <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <li key={p.slug} className="text-[14px] leading-relaxed">
                    <Link
                      to={`/${p.slug}/`}
                      className="text-[#0A0A0A]/75 transition hover:text-orange-600"
                    >
                      {p.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </Container>
          </section>
        );
      })}

      {/* Personas */}
      <section id="persona-pages" className="bg-white py-10 md:py-12">
        <Container>
          <h2
            className="mb-6 max-w-3xl border-b border-[#0B1640]/10 pb-3 text-[#0A0A0A]"
            style={{ fontSize: "clamp(22px, 3.2vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}
          >
            Personas library
            <span className="ml-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0A0A0A]/55">
              {PERSONAS.length}
            </span>
          </h2>
          <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
            <li className="text-[14px] leading-relaxed">
              <Link to="/personas/" className="font-semibold text-orange-600 transition hover:text-orange-600">
                All personas index
              </Link>
            </li>
            {PERSONAS.map((p) => (
              <li key={p.slug} className="text-[14px] leading-relaxed">
                <Link to={`/personas/${p.slug}/`} className="text-[#0A0A0A]/75 transition hover:text-orange-600">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Blog */}
      <section id="blog" className="bg-white py-10 md:py-12">
        <Container>
          <h2
            className="mb-6 max-w-3xl border-b border-[#0B1640]/10 pb-3 text-[#0A0A0A]"
            style={{ fontSize: "clamp(22px, 3.2vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}
          >
            Blog
            <span className="ml-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#0A0A0A]/55">
              {blogPosts.length}
            </span>
          </h2>
          <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2">
            <li className="text-[14px] leading-relaxed">
              <Link to="/blog/" className="font-semibold text-orange-600 transition hover:text-orange-600">
                Blog index
              </Link>
            </li>
            {blogPosts
              .slice()
              .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
              .map((b) => (
                <li key={b.slug} className="text-[14px] leading-relaxed">
                  <Link to={`/blog/${b.slug}/`} className="text-[#0A0A0A]/75 transition hover:text-orange-600">
                    {b.title}
                  </Link>
                </li>
              ))}
          </ul>
        </Container>
      </section>

      {/* Tools + utility pages */}
      <section id="tools" className="bg-white py-10 md:py-12">
        <Container>
          <h2
            className="mb-6 max-w-3xl border-b border-[#0B1640]/10 pb-3 text-[#0A0A0A]"
            style={{ fontSize: "clamp(22px, 3.2vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}
          >
            Tools, glossary, community + utility
          </h2>
          <ul className="grid gap-x-8 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              ["AI Skills Quiz", "/tools/ai-skills-quiz/"],
              ["Full AI Glossary (53+ terms)", "/glossary/"],
              ["AI News index", "/ai-news/"],
              ["Questions Answered", "/questions/"],
              ["What ONROL learners build", "/proof/"],
              ["Why AI matters now (18-month window)", "/why-now/"],
              ["ONROL Community", "/community/"],
              ["ONROL Community Feed", "/community/feed/"],
              ["Landing Pages hub", "/landingpage/"],
              ["AI Generalist Program", "/programs/ai-generalist/"],
              ["AI Architect Program", "/programs/ai-architect/"],
              ["All Programs", "/programs/"],
              ["About ONROL", "/about/"],
              ["Founder — Dr. Neeraja Reddy", "/founders/dr-neeraja-reddy/"],
              ["Contact", "/contact/"],
              ["Events", "/events/"],
              ["Privacy Policy", "/privacy-policy/"],
              ["Terms & Conditions", "/terms-and-conditions/"],
              ["Refund Policy", "/refund-policy/"],
            ].map(([label, to]) => (
              <li key={to} className="text-[14px] leading-relaxed">
                <Link to={to} className="text-[#0A0A0A]/75 transition hover:text-orange-600">{label}</Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Footer />
    </main>
  );
}
