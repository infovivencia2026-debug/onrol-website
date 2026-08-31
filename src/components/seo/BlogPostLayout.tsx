import { Link } from "react-router-dom";
import { ArrowRight, Info, Lightbulb, AlertTriangle, Quote, Sparkles } from "lucide-react";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;
import Container from "@/components/shared/Container";
import Footer from "@/components/shared/Footer";
import FounderCard from "@/components/shared/FounderCard";
import SEO from "@/components/seo/SEO";
import FAQ from "@/components/seo/FAQ";
import BreadcrumbTrail from "@/components/seo/BreadcrumbTrail";
import CitationBait from "@/components/seo/CitationBait";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
  howToJsonLd,
  speakableSpecification,
} from "@/lib/structuredData";
import { founder, founderJsonLd } from "@/lib/founder";
import { pillarPages } from "@/lib/pillarContent";
import { blogPosts, deriveHowToSteps } from "@/lib/blogContent";
import { linkifyGlossaryTerms } from "@/lib/glossaryLinker";
import type { BlogPost } from "@/lib/blogContent";

export default function BlogPostLayout({ post }: { post: BlogPost }) {
  const path = `/blog/${post.slug}/`;
  const url = `https://onrol.in${path}`;
  const related = post.related
    .map((slug) => pillarPages.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => !!p);

  // Auto-derived HowTo schema for step-by-step posts.
  const howToSteps = deriveHowToSteps(post);

  // Build the JSON-LD bundle. Article + Breadcrumb + Person always; HowTo +
  // Speakable conditionally.
  // Compute word count from the rendered body so BlogPosting JSON-LD
  // gets a real number — Google uses this for "long-form content"
  // surfaces. Crude but accurate enough.
  const wordCount = post.blocks.reduce((n, b) => {
    if (b.kind === "p" || b.kind === "h2" || b.kind === "quote" || b.kind === "callout") {
      return n + (b.text?.split(/\s+/).filter(Boolean).length || 0);
    }
    if (b.kind === "ul") {
      return n + b.items.reduce((s, i) => s + i.split(/\s+/).filter(Boolean).length, 0);
    }
    if (b.kind === "table") {
      const cells = [...b.headers, ...b.rows.flat(), b.caption || ""];
      return n + cells.reduce((s, i) => s + i.split(/\s+/).filter(Boolean).length, 0);
    }
    return n;
  }, 0);
  // Pull the related-pillar names as semantic keywords for the JSON-LD.
  const keywords = related.map((p) => p.h1).slice(0, 8);

  // Internal-linking pass: surface 3 same-category blog posts (excluding
  // the current one) so every post earns 3 deeper crawl edges. Falls
  // back to recent posts if the category has fewer than 3 siblings.
  const sameCategory = blogPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, 3);
  const filler = sameCategory.length < 3
    ? blogPosts
        .filter((p) => p.slug !== post.slug && !sameCategory.some((s) => s.slug === p.slug))
        .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
        .slice(0, 3 - sameCategory.length)
    : [];
  const relatedPosts: BlogPost[] = [...sameCategory, ...filler];

  const articleSchema = articleJsonLd({
    headline: post.h1,
    description: post.metaDescription,
    url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    authorName: founder.name,
    authorUrl: "https://onrol.in/",
    articleSection: post.category,
    keywords,
    wordCount,
  });
  // Speakable: Google Assistant + AI search engines pull from these CSS targets.
  const speakable = {
    ...articleSchema,
    speakable: speakableSpecification(["h1", ".blog-hook", ".blog-faq-q"]),
  };

  const jsonLd: object[] = [
    speakable,
    breadcrumbJsonLd([
      { name: "Home", href: "/" },
      { name: "Blog", href: "/blog/" },
      { name: post.h1, href: path },
    ]),
    founderJsonLd(),
  ];
  if (howToSteps) {
    jsonLd.push(
      howToJsonLd({
        name: post.h1,
        description: post.metaDescription,
        url,
        steps: howToSteps,
        totalTime: `PT${post.readMinutes}M`,
      }),
    );
  }
  // FAQPage schema is now emitted exclusively here (the FAQ component no
  // longer injects its own JSON-LD — that caused GSC "Duplicate field"
  // errors). Single source of truth.
  if (post.faqs && post.faqs.length > 0) {
    jsonLd.push(faqJsonLd(post.faqs));
  }

  return (
    <main
      className="bg-[#f3f5f8] pt-24 text-[#0B1640] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title={post.title}
        description={post.metaDescription}
        path={path}
        image="https://onrol.in/og/blog.png"
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="relative bg-[#f3f5f8] py-12 md:py-16">
        <div aria-hidden className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-violet-400 to-pink-500" />
        <Container>
          <BreadcrumbTrail
            crumbs={[
              { name: "Blog", href: "/blog/" },
              { name: post.h1, href: path },
            ]}
            variant="dark"
          />
          <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
            — {post.category}
          </p>
          <h1
            className="mt-3 max-w-4xl text-[#0B1640]"
            style={{
              fontSize: "clamp(34px, 5.6vw, 60px)",
              lineHeight: 1.04,
              letterSpacing: "-0.025em",
              fontWeight: 800,
            }}
          >
            {post.h1}
          </h1>
          <p className="blog-hook mt-4 max-w-3xl text-lg font-medium leading-relaxed text-[#0B1640]/85 md:text-xl">
            {post.hook}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-[12px] text-[#0B1640]/75/80">
            <FounderCard variant="dark" size="compact" />
            <span aria-hidden className="h-1 w-1 rounded-full bg-slate-500" />
            <span>
              Published{" "}
              <time dateTime={post.publishedAt}>
                {new Date(post.publishedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </span>
            {post.updatedAt && post.updatedAt !== post.publishedAt ? (
              <>
                <span aria-hidden className="h-1 w-1 rounded-full bg-slate-500" />
                <span>
                  Updated{" "}
                  <time dateTime={post.updatedAt}>
                    {new Date(post.updatedAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                  </time>
                </span>
              </>
            ) : null}
            <span aria-hidden className="h-1 w-1 rounded-full bg-slate-500" />
            <span>{post.readMinutes} min read</span>
          </div>
        </Container>
      </section>

      {/* Body — kept on dark surface for theme consistency. */}
      <article className="bg-[#f3f5f8] py-16 md:py-24">
        <Container>
          <div className="mx-auto max-w-3xl space-y-6 rounded-3xl border border-[#0B1640]/10 bg-white p-7 md:p-12">
            {post.blocks.map((b, i) => (
              <BlockRenderer key={i} block={b} />
            ))}
          </div>
        </Container>
      </article>

      {/* Founder credibility */}
      <section className="bg-[#f3f5f8] py-14 md:py-16">
        <Container>
          <FounderCard variant="dark" size="expanded" />
        </Container>
      </section>

      {/* Citation-bait block — short, factual paragraph AI engines lift verbatim. */}
      <section className="bg-[#f3f5f8] py-2">
        <Container>
          <CitationBait variant="dark" />
        </Container>
      </section>

      {/* FAQ */}
      <FAQ
        eyebrow={`Questions about ${post.category}`}
        title="Common questions"
        items={post.faqs}
        variant="light"
      />

      {/* Related pillars */}
      <section className="bg-[#f3f5f8] py-16 md:py-24">
        <Container>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">— Read deeper</p>
          <h2
            className="mt-3 max-w-3xl text-[#0B1640]"
            style={{
              fontSize: "clamp(24px, 3.2vw, 38px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              fontWeight: 800,
            }}
          >
            Related pillars from ONROL
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={`/${r.slug}/`}
                className="group flex flex-col rounded-2xl border border-[#0B1640]/10 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-300/40"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600">Pillar</p>
                <p className="mt-2 text-[16px] font-semibold text-[#0B1640]">{r.h1}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#0B1640]/75">{r.hook}</p>
                <span className="mt-auto pt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600 transition group-hover:translate-x-0.5">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Related blog posts — same-category siblings give every post 3
          deeper crawl edges. Boosts internal PageRank flow and keeps
          readers on-site. Hidden when the corpus has fewer than 1
          related sibling (defensive). */}
      {relatedPosts.length > 0 && (
        <section className="bg-[#f3f5f8] pb-16 md:pb-20">
          <Container>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">— Continue reading</p>
            <h2
              className="mt-3 max-w-3xl text-[#0B1640]"
              style={{
                fontSize: "clamp(22px, 2.8vw, 34px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                fontWeight: 800,
              }}
            >
              More on {post.category.toLowerCase()}
            </h2>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {relatedPosts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}/`}
                  className="group flex flex-col rounded-2xl border border-[#0B1640]/10 bg-white p-5 transition hover:-translate-y-1 hover:border-orange-300/40"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600">{p.category}</p>
                  <p className="mt-2 text-[15.5px] font-semibold leading-snug text-[#0B1640]">{p.h1}</p>
                  <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-relaxed text-[#0B1640]/75">{p.hook}</p>
                  <span className="mt-auto pt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600 transition group-hover:translate-x-0.5">
                    Read →
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Final CTA — orange banner. */}
      <section className="relative bg-[#f3f5f8] pb-20 md:pb-28">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FF6B47] via-[#FF7A3D] to-[#FF8A4C] p-8 md:p-12">
            <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/12 blur-3xl" />
            <div className="grid gap-6 md:grid-cols-[1.2fr_auto] md:items-center">
              <div>
                <h2
                  className="text-white"
                  style={{
                    fontSize: "clamp(28px, 4.4vw, 44px)",
                    fontWeight: 900,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.05,
                  }}
                >
                  Ready to ship your first AI project?
                </h2>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/95">
                  Join the next ONROL Free Masterclass. 90 minutes · AI agents + Vibe coding · No pitch.
                </p>
              </div>
              <Link
                to="/programs/"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[14px] font-bold uppercase tracking-wider text-orange-700 transition hover:bg-orange-50"
              >
                <Sparkles className="h-4 w-4" />
                Reserve seat <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Global footer — gives every blog post deep links to all main pillar
          pages. Same SEO purpose as on pillar pages. */}
      <Footer />
    </main>
  );
}

function BlockRenderer({ block }: { block: BlogPost["blocks"][number] }) {
  switch (block.kind) {
    case "p":
      return (
        <p className="text-[15.5px] leading-[1.78] text-[#0B1640]/85 md:text-[16.5px]">
          {linkifyGlossaryTerms(block.text)}
        </p>
      );
    case "h2":
      return (
        <h2
          className="mt-8 text-[#0B1640]"
          style={{
            fontSize: "clamp(22px, 3.4vw, 32px)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            fontWeight: 800,
          }}
        >
          {block.text}
        </h2>
      );
    case "ul":
      return (
        <ul className="space-y-2.5">
          {block.items.map((it, i) => (
            <li key={i} className="flex items-start gap-3 text-[15.5px] leading-relaxed text-[#0B1640]/85">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );
    case "callout": {
      const styles =
        block.tone === "tip"
          ? { bg: "bg-emerald-500/10", border: "border-emerald-300/30", icon: Lightbulb, color: "text-emerald-300" }
          : block.tone === "warn"
            ? { bg: "bg-amber-500/10", border: "border-amber-300/30", icon: AlertTriangle, color: "text-amber-300" }
            : { bg: "bg-orange-500/10", border: "border-orange-300/30", icon: Info, color: "text-orange-600" };
      const Icon = styles.icon;
      return (
        <aside className={`flex items-start gap-3 rounded-xl border ${styles.border} ${styles.bg} p-4`}>
          <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.color}`} />
          <p className="text-[14.5px] leading-relaxed text-slate-100">{block.text}</p>
        </aside>
      );
    }
    case "quote":
      return (
        <blockquote className="my-2 rounded-xl border-l-4 border-orange-500 bg-white/[0.04] px-5 py-4">
          <Quote className="h-4 w-4 text-orange-400" />
          <p
            className="mt-2 text-[18px] italic leading-relaxed text-[#0B1640]/80"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {block.text}
          </p>
          {block.cite ? (
            <cite className="mt-2 block text-[12px] font-semibold uppercase tracking-wider not-italic text-[#0B1640]/55">
              — {block.cite}
            </cite>
          ) : null}
        </blockquote>
      );
    case "table":
      return (
        <figure className="my-2">
          <div className="overflow-x-auto rounded-2xl border border-[#0B1640]/10">
            <table className="w-full border-collapse text-left text-[14.5px]">
              <thead>
                <tr className="bg-[#0B1640] text-white">
                  {block.headers.map((h, i) => (
                    <th key={i} className="px-4 py-3 font-semibold first:rounded-tl-2xl last:rounded-tr-2xl">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} className="border-t border-[#0B1640]/10 odd:bg-white even:bg-[#0B1640]/[0.03]">
                    {row.map((cell, c) => (
                      <td
                        key={c}
                        className={`px-4 py-3 align-top text-[#0B1640]/85 ${c === 0 ? "font-semibold text-[#0B1640]" : ""}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption ? (
            <figcaption className="mt-2 text-[12.5px] text-[#0B1640]/55">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
  }
}
