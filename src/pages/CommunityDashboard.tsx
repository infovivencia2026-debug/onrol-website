// Signed-in dashboard — broadcast feed + sidebar navigation.
// Reads from the new community_posts table (Wave B), filterable by category.
// Replaces the old alumni dashboard which depended on tables that don't
// exist on the self-hosted Supabase stack.

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Inbox, ShieldCheck, Sparkles } from "lucide-react";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import {
  EmptyState,
  PageHeader,
  Skeleton,
  SkeletonCard,
} from "@/components/community/CommunityPrimitives";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  listPublishedPosts,
  type CommunityPost,
  type PostCategory,
} from "@/lib/communityPosts";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const isPostCategory = (v: string | null): v is PostCategory =>
  !!v && CATEGORIES.some((c) => c.id === v);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, member, loading: authLoading } = useCommunityAuth();
  const [searchParams] = useSearchParams();

  // ── Auth/profile gate ──────────────────────────────────────────────
  // Same logic as before but now non-bouncy: only redirect if member is
  // loaded AND confirmed-incomplete. Transient null is treated as "still
  // loading" (don't bounce).
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!member) return;
    const incomplete =
      !member.location ||
      !member.current_role ||
      (member.skills?.length ?? 0) === 0;
    if (incomplete) navigate("/onboarding/community", { replace: true });
  }, [authLoading, user, member, navigate]);

  // ── Filters ────────────────────────────────────────────────────────
  const categoryParam = searchParams.get("category");
  const category = isPostCategory(categoryParam) ? categoryParam : null;

  // ── Feed ───────────────────────────────────────────────────────────
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingFeed(true);
    listPublishedPosts({ category: category ?? undefined, limit: 60 })
      .then((data) => {
        if (!cancelled) setPosts(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingFeed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category]);

  const featured = posts[0] ?? null;
  const rest = posts.slice(1);

  const cat = category ? CATEGORY_BY_ID[category] : null;

  return (
    <CommunityLayout>
      <div style={{ fontFamily: INTER_STACK }} className="space-y-5">
        <PageHeader
          eyebrow={cat ? cat.label : "Latest"}
          title={cat ? cat.label : `Welcome back${member?.full_name ? `, ${member.full_name.split(" ")[0]}` : ""}`}
          description={cat ? `Latest ${cat.label.toLowerCase()} from the ONROL Community feed.` : "Daily AI updates from the ONROL Community broadcast feed."}
          actions={
            <>
              {isAdmin ? (
                <Link
                  to="/community/admin"
                  className="inline-flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-2 text-[12.5px] font-semibold text-white transition hover:bg-orange-400"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Link>
              ) : null}
              <Link
                to="/community/feed/"
                className="inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white px-3 py-2 text-[12.5px] font-medium text-zinc-300 transition hover:border-orange-500/30 hover:bg-white hover:text-zinc-100"
              >
                Public feed
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          }
        />

        {/* Category chips for quick switching (channel rail handles primary nav) */}
        <nav aria-label="Filter by category" className="flex flex-wrap gap-1.5">
          <CategoryChip to="/community/dashboard" label="All" active={!cat} />
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c.id}
              to={`/community/dashboard?category=${c.id}`}
              label={c.label}
              active={cat?.id === c.id}
            />
          ))}
        </nav>

        {/* Feed body */}
        {loadingFeed ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={cat ? `No ${cat.label.toLowerCase()} posts yet` : "Your feed is just getting started"}
            body={isAdmin
              ? "Publish the first post in this category from the admin panel."
              : "New AI updates land here daily. Check back soon, or follow #wins, #tools, and #prompts to keep the channel rail surfaced."}
            cta={isAdmin
              ? { label: "+ New post", href: "/community/admin/new" }
              : { label: "Browse all categories", href: "/community/feed/" }
            }
          />
        ) : (
          <>
            {featured ? <FeaturedPost post={featured} /> : null}
            {rest.length > 0 ? (
              <div>
                <h2 className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                  More updates
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post, idx) => (
                    <PostCard key={post.id} post={post} idx={idx} />
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </CommunityLayout>
  );
};

// ── Components ──────────────────────────────────────────────────────

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
      className={`inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-semibold transition ${
        active
          ? "bg-orange-500/20 text-orange-600 ring-1 ring-inset ring-orange-500/40"
          : "bg-white text-zinc-400 hover:bg-white hover:text-zinc-100"
      }`}
    >
      {label}
    </Link>
  );
}

function FeaturedPost({ post }: { post: CommunityPost }) {
  const cat = CATEGORY_BY_ID[post.category];
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="group overflow-hidden rounded-2xl border border-[#0B1640]/10 bg-[#232532] transition hover:border-orange-300/35"
    >
      <Link to={`/community/post/${post.slug}/`} className="grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="aspect-[16/9] w-full overflow-hidden bg-white lg:aspect-auto lg:min-h-[280px]">
          {post.cover_url ? (
            <img
              src={post.cover_url}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${cat.accent}`}>
              <Sparkles className="h-10 w-10 text-[#f3f5f8]/70" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center gap-3 p-5 sm:p-6 md:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600">
              Latest
            </span>
            <span
              className={`inline-flex items-center rounded-full bg-gradient-to-r ${cat.accent} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f3f5f8]`}
            >
              {cat.label}
            </span>
          </div>
          <h2
            className="text-[#0B1640] transition group-hover:text-orange-100"
            style={{ fontSize: "clamp(20px, 2.6vw, 26px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.15 }}
          >
            {post.title}
          </h2>
          {post.excerpt ? (
            <p className="text-[14px] leading-relaxed text-[#0B1640]/75">{post.excerpt}</p>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wider text-orange-600">
            Read post
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}

function PostCard({ post, idx }: { post: CommunityPost; idx: number }) {
  const cat = CATEGORY_BY_ID[post.category];
  const date = post.published_at ?? post.created_at;
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.32, delay: Math.min(idx * 0.04, 0.3) }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#0B1640]/10 bg-[#232532] transition hover:border-orange-300/35"
    >
      <Link to={`/community/post/${post.slug}/`} className="flex h-full flex-col">
        <div className="aspect-[16/9] w-full overflow-hidden bg-white">
          {post.cover_url ? (
            <img
              src={post.cover_url}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${cat.accent}`}>
              <Sparkles className="h-7 w-7 text-[#f3f5f8]/70" />
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${cat.accent} px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#f3f5f8]`}>
              {cat.label}
            </span>
            <span className="text-[11px] text-[#0B1640]/55">
              {new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </span>
          </div>
          <h3
            className="mt-3 text-[#0B1640] transition group-hover:text-orange-600"
            style={{ fontSize: "15.5px", fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.005em" }}
          >
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#0B1640]/75">{post.excerpt}</p>
          ) : null}
        </div>
      </Link>
    </motion.article>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="aspect-[2.4/1] w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

export default Dashboard;
