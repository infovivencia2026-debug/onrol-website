// Public per-post page for admin-published community posts.
// URL: /community/post/<slug>/
//
// JSON-LD: Article + BreadcrumbList for AI-search citation.

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Share2 } from "lucide-react";
import { toast } from "sonner";
import Container from "@/components/shared/Container";
import SEO from "@/components/seo/SEO";
import { copyText } from "@/lib/clipboard";
import {
  CATEGORY_BY_ID,
  getPostBySlug,
  listPublishedPosts,
  type CommunityPost,
} from "@/lib/communityPosts";
import { renderMarkdown } from "./AdminCommunityPostEditor";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;
const SITE_URL = "https://onrol.in";

export default function CommunityPostPublic() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [related, setRelated] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    setNotFound(false);

    (async () => {
      const found = await getPostBySlug(slug);
      if (!active) return;
      if (!found || found.status !== "published") {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setPost(found);
      setLoading(false);

      const sameCategory = await listPublishedPosts({
        category: found.category,
        limit: 4,
      });
      if (active) {
        setRelated(sameCategory.filter((p) => p.id !== found.id).slice(0, 3));
      }
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  const html = useMemo(() => (post ? renderMarkdown(post.body_md) : ""), [post]);

  if (notFound) return <Navigate to="/community/feed/" replace />;

  if (loading || !post) {
    return (
      <main className="min-h-screen bg-[#f3f5f8] text-[#0B1640]">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="space-y-4">
            <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
            <div className="h-10 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-white" />
            <div className="mt-8 aspect-[16/10] w-full animate-pulse rounded-2xl bg-white" />
            <div className="mt-6 space-y-3">
              <div className="h-3 w-full animate-pulse rounded bg-white" />
              <div className="h-3 w-11/12 animate-pulse rounded bg-white" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-white" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-white" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  const cat = CATEGORY_BY_ID[post.category];
  const url = `${SITE_URL}/community/post/${post.slug}/`;
  const published = post.published_at
    ? new Date(post.published_at).toISOString()
    : new Date(post.created_at).toISOString();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? "",
    image: post.cover_url ? [post.cover_url] : undefined,
    datePublished: published,
    dateModified: new Date(post.updated_at).toISOString(),
    author: { "@type": "Organization", name: "ONROL Community" },
    publisher: {
      "@type": "Organization",
      name: "ONROL",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/onrol-logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: cat.label,
    url,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Community",
        item: `${SITE_URL}/community/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cat.label,
        item: `${SITE_URL}/community/feed/${cat.id}/`,
      },
      { "@type": "ListItem", position: 4, name: post.title, item: url },
    ],
  };

  const onShare = async () => {
    const shareData = { title: post.title, text: post.excerpt ?? "", url };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      /* fall through to copy */
    }
    const ok = await copyText(url);
    if (ok) toast.success("Link copied to clipboard");
  };

  return (
    <main
      className="min-h-screen bg-[#f3f5f8] pt-24 text-[#0B1640] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO
        title={`${post.title} — ONROL Community`}
        description={post.excerpt ?? `${cat.label} update from ONROL Community.`}
        path={`/community/post/${post.slug}/`}
        image={post.cover_url ?? undefined}
        jsonLd={[articleJsonLd, breadcrumbJsonLd]}
      />

      <article className="bg-[#f3f5f8] pb-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Link
              to={`/community/feed/${cat.id}/`}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wider text-[#0B1640]/55 transition hover:text-orange-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {cat.label}
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full bg-gradient-to-r ${cat.accent} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f3f5f8]`}
              >
                {cat.label}
              </span>
              <span className="text-[12px] text-[#0B1640]/55">
                {new Date(published).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>

            <h1
              className="mt-4 text-[#0B1640]"
              style={{
                fontSize: "clamp(28px, 4.4vw, 44px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
              }}
            >
              {post.title}
            </h1>

            {post.excerpt ? (
              <p className="mt-4 text-[16px] leading-relaxed text-[#0B1640]/75 md:text-[17px]">
                {post.excerpt}
              </p>
            ) : null}

            {post.cover_url ? (
              <img
                src={post.cover_url}
                alt={post.title}
                className="mt-7 aspect-[16/9] w-full rounded-2xl border border-[#0B1640]/10 object-cover"
              />
            ) : null}

            <div
              className="prose-onrol mt-8 text-[15px] leading-[1.78] text-[#0B1640]/85 md:text-[16px]"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-[#0B1640]/10 pt-6">
              <button
                type="button"
                onClick={onShare}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#0B1640]/12 bg-white px-4 text-[12.5px] font-bold uppercase tracking-wider text-[#0B1640]/85 transition hover:border-orange-300/40 hover:bg-white hover:text-[#0B1640]"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <Link
                to={`/community/feed/${cat.id}/`}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#0B1640]/12 bg-white px-4 text-[12.5px] font-bold uppercase tracking-wider text-[#0B1640]/85 transition hover:border-orange-300/40 hover:bg-white hover:text-[#0B1640]"
              >
                More {cat.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {related.length > 0 ? (
            <section className="mx-auto mt-16 max-w-5xl">
              <h2
                className="text-[#0B1640]"
                style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.015em" }}
              >
                More from {cat.label}
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    to={`/community/post/${p.slug}/`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#0B1640]/10 bg-[#232532] transition hover:border-orange-300/35"
                  >
                    {p.cover_url ? (
                      <img
                        src={p.cover_url}
                        alt=""
                        className="aspect-[16/9] w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className={`aspect-[16/9] w-full bg-gradient-to-br ${cat.accent}`}
                      />
                    )}
                    <div className="flex flex-1 flex-col p-4">
                      <h3
                        className="text-[#0B1640] transition group-hover:text-orange-600"
                        style={{ fontSize: "15.5px", fontWeight: 700, lineHeight: 1.3 }}
                      >
                        {p.title}
                      </h3>
                      {p.excerpt ? (
                        <p className="mt-2 line-clamp-2 text-[13px] text-[#0B1640]/55">
                          {p.excerpt}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </Container>
      </article>
    </main>
  );
}
