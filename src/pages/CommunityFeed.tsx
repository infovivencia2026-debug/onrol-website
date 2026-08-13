// Public community feed — admin-published posts grouped by category.
//
// Routes:
//   /community/feed/                   → all categories, latest-first
//   /community/feed/<category>/        → single category (e.g. /community/feed/news/)
//
// JSON-LD: ItemList for crawlers + AI-search citation.

import { useEffect, useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import ListSkeleton from "@/components/shared/ListSkeleton";
import Container from "@/components/shared/Container";
import SEO from "@/components/seo/SEO";
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  listPublishedPosts,
  type CommunityPost,
  type PostCategory,
} from "@/lib/communityPosts";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;
const SITE_URL = "https://onrol.in";

const isPostCategory = (v: string | undefined): v is PostCategory =>
  !!v && CATEGORIES.some((c) => c.id === v);

export default function CommunityFeed() {
  const { category } = useParams<{ category?: string }>();

  if (category && !isPostCategory(category)) {
    return <Navigate to="/community/feed/" replace />;
  }

  return <Feed category={category as PostCategory | undefined} />;
}

function Feed({ category }: { category?: PostCategory }) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listPublishedPosts({ category, limit: 60 })
      .then((data) => {
        if (active) setPosts(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category]);

  const cat = category ? CATEGORY_BY_ID[category] : null;
  const title = cat
    ? `${cat.label} — ONROL Community`
    : "ONROL Community feed — daily AI updates";
  const description = cat
    ? `${cat.description} Free, daily ${cat.label.toLowerCase()} updates from ONROL Community.`
    : "Free daily AI updates: news, tools, prompts, hacks, wins, jobs, workshops. Curated by ONROL Community.";
  const path = cat ? `/community/feed/${cat.id}/` : "/community/feed/";

  const grouped = useMemo(() => {
    if (cat) return null;
    const map = new Map<PostCategory, CommunityPost[]>();
    for (const c of CATEGORIES) map.set(c.id, []);
    for (const p of posts) {
      const arr = map.get(p.category as PostCategory);
      if (arr) arr.push(p);
    }
    return map;
  }, [posts, cat]);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    itemListElement: posts.slice(0, 30).map((p, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${SITE_URL}/community/post/${p.slug}/`,
      name: p.title,
    })),
  };

  return (
    <main
      className="min-h-screen bg-[#f3f5f8] pt-24 text-[#0B1640] md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <SEO title={title} description={description} path={path} jsonLd={itemListJsonLd} />

      <section className="bg-[#f3f5f8] py-10 md:py-14">
        <Container>
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
              — {cat ? cat.label : "Community feed"}
            </p>
            <h1
              className="mt-3 text-[#0B1640]"
              style={{
                fontSize: "clamp(28px, 5vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                lineHeight: 1.05,
              }}
            >
              {cat ? cat.label : "Daily AI updates."}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[#0B1640]/75 md:text-base">
              {cat ? cat.description : description}
            </p>
          </div>

          <nav className="mt-8 flex flex-wrap gap-1.5">
            <CategoryChip to="/community/feed/" label="All" active={!cat} />
            {CATEGORIES.map((c) => (
              <CategoryChip
                key={c.id}
                to={`/community/feed/${c.id}/`}
                label={c.label}
                active={cat?.id === c.id}
              />
            ))}
          </nav>
        </Container>
      </section>

      <section className="bg-[#f3f5f8] pb-24">
        <Container>
          {loading ? (
            <ListSkeleton count={6} variant="card" />
          ) : posts.length === 0 ? (
            <EmptyState category={cat?.label ?? null} />
          ) : cat ? (
            <PostGrid posts={posts} />
          ) : grouped ? (
            <div className="space-y-12">
              {CATEGORIES.map((c) => {
                const list = grouped.get(c.id) ?? [];
                if (list.length === 0) return null;
                return (
                  <CategorySection
                    key={c.id}
                    category={c}
                    posts={list.slice(0, 6)}
                    showAll={list.length > 6}
                  />
                );
              })}
            </div>
          ) : null}
        </Container>
      </section>
    </main>
  );
}

function CategoryChip({
  to,
  label,
  active,
}: {
  to: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[12.5px] font-bold uppercase tracking-wider transition ${
        active
          ? "bg-orange-500 text-white shadow-[0_10px_22px_-8px_rgba(255,107,71,0.55)]"
          : "border border-[#0B1640]/10 bg-white text-[#0B1640]/75 hover:border-orange-300/40 hover:bg-white"
      }`}
    >
      {label}
    </Link>
  );
}

function CategorySection({
  category,
  posts,
  showAll,
}: {
  category: (typeof CATEGORIES)[number];
  posts: CommunityPost[];
  showAll: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span
            className={`inline-flex items-center rounded-full bg-gradient-to-r ${category.accent} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f3f5f8]`}
          >
            {category.label}
          </span>
          <h2
            className="mt-2 text-[#0B1640]"
            style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            {category.description}
          </h2>
        </div>
        {showAll ? (
          <Link
            to={`/community/feed/${category.id}/`}
            className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-orange-600 hover:text-orange-600"
          >
            See all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="mt-5">
        <PostGrid posts={posts} />
      </div>
    </div>
  );
}

function PostGrid({ posts }: { posts: CommunityPost[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post, idx) => (
        <PostCard key={post.id} post={post} idx={idx} />
      ))}
    </div>
  );
}

function PostCard({ post, idx }: { post: CommunityPost; idx: number }) {
  const cat = CATEGORY_BY_ID[post.category];
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: Math.min(idx * 0.04, 0.3) }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#0B1640]/10 bg-[#232532] transition hover:border-orange-300/35 hover:bg-[#f3f5f8]"
    >
      <Link to={`/community/post/${post.slug}/`} className="flex h-full flex-col">
        <div className="aspect-[16/9] w-full overflow-hidden bg-white">
          {post.cover_url ? (
            <img
              src={post.cover_url}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${cat.accent}`}
            >
              <Sparkles className="h-8 w-8 text-[#f3f5f8]/70" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full bg-gradient-to-r ${cat.accent} px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#f3f5f8]`}
            >
              {cat.label}
            </span>
            <span className="text-[11px] text-[#0B1640]/55">
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : ""}
            </span>
          </div>
          <h3
            className="mt-3 text-[#0B1640] transition group-hover:text-orange-600"
            style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.005em", lineHeight: 1.3 }}
          >
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-[#0B1640]/75">
              {post.excerpt}
            </p>
          ) : null}
          <div className="mt-auto pt-4">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-orange-600">
              Read
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function EmptyState({ category }: { category: string | null }) {
  // Category-scoped view → short message + return link. Default view (no
  // category selected and zero posts in the whole feed) → 3-step welcome
  // checklist so new visitors have a concrete next action.
  if (category) {
    return (
      <div className="rounded-2xl border border-[#0B1640]/10 bg-[#232532] p-10 text-center">
        <p className="text-[15px] text-[#0B1640]/75">
          No {category.toLowerCase()} posts yet — check back soon.
        </p>
        <Link
          to="/community/"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-white"
        >
          Back to community
        </Link>
      </div>
    );
  }

  const steps = [
    {
      n: 1,
      title: "Join the community",
      body: "Sign in and tell us what you're building. Your profile becomes your portfolio.",
      cta: { label: "Sign in", to: "/login/" },
    },
    {
      n: 2,
      title: "Pick a starter project",
      body: "Six real-world AI projects, each finishable in a weekend. Pick one.",
      cta: { label: "See projects", to: "/proof/" },
    },
    {
      n: 3,
      title: "Ship your first build",
      body: "Post it in the feed. Mentors and peers review — every post gets read.",
      cta: { label: "How posting works", to: "/community/" },
    },
  ];

  return (
    <div className="rounded-2xl border border-[#0B1640]/10 bg-[#232532] p-6 md:p-10">
      <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
        Welcome
      </p>
      <h3 className="mt-2 text-2xl font-bold text-[#0B1640] md:text-3xl">
        Three steps to your first ONROL win
      </h3>
      <p className="mt-2 max-w-xl text-[14px] text-[#0B1640]/55">
        The feed is fresh. Here's the shortest path from landing on this page to
        having something deployed.
      </p>
      <ol className="mt-6 grid gap-3 md:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.n}
            className="flex flex-col rounded-xl border border-[#0B1640]/10 bg-white p-4"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-orange-500/15 text-[12px] font-bold text-orange-600 ring-1 ring-orange-300/30">
                {s.n}
              </span>
              <h4 className="text-[14px] font-semibold text-[#0B1640]">{s.title}</h4>
            </div>
            <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-[#0B1640]/55">
              {s.body}
            </p>
            <Link
              to={s.cta.to}
              className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-orange-600 hover:text-orange-600"
            >
              {s.cta.label} <ArrowRight className="h-3 w-3" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
