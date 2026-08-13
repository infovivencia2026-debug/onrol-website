import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, Calendar, Heart, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import { seededPosts } from "@/lib/communitySeed";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import { copyText } from "@/lib/clipboard";
import { cardHover, cardReveal, sectionReveal } from "@/lib/motion";
import { communityCourses, inferCourseIdFromText } from "@/lib/communityCourses";
const ENABLE_SEED_FALLBACK = true;

type Post = {
  id: string;
  title: string;
  description: string;
  content_html?: string | null;
  category: string;
  created_at: string;
  cta_text?: string | null;
  cta_link?: string | null;
  thumbnail_emoji?: string | null;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  views_count: number;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
};

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useCommunityAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const safeHtml = useMemo(() => {
    if (!post?.content_html) return null;
    return { __html: sanitizeHtml(post.content_html) };
  }, [post?.content_html]);
  const isSeedPost = (postId?: string | null) => Boolean(postId?.startsWith("seed-"));
  const hasMeaningfulCta = useMemo(() => {
    if (!post?.cta_text) return false;
    const link = post.cta_link?.trim() ?? "";
    if (!link) return false;
    if (post.cta_text.toLowerCase() === "view") return false;
    if (link === "/community/dashboard" || link === "/community") return false;
    return true;
  }, [post?.cta_link, post?.cta_text]);

  const ctaIntent = useMemo(() => {
    if (!post) return "none" as const;
    const cta = (post.cta_text || "").toLowerCase().trim();
    const category = (post.category || "").toLowerCase().trim();
    if (category === "prompts" || /copy/.test(cta)) return "prompt" as const;
    if (category === "courses" || /course|enrol|enroll|start/.test(cta)) return "course" as const;
    if (category === "workshops" || /workshop|join|register/.test(cta)) return "workshop" as const;
    if (category === "training videos" || /watch|video/.test(cta)) return "video" as const;
    return "other" as const;
  }, [post]);

  const primaryCtaHref = useMemo(() => {
    if (!post) return "";
    if (ctaIntent === "course") {
      const targetCourseId = inferCourseIdFromText(`${post.title} ${post.description}`);
      const targetCourse = communityCourses.find((course) => course.id === targetCourseId) ?? communityCourses[0] ?? null;
      const targetModule = targetCourse?.modules[0]?.id ?? "";
      const params = new URLSearchParams({
        category: "Courses",
        course: targetCourse?.id ?? targetCourseId,
      });
      if (targetModule) params.set("module", targetModule);
      return `/community/dashboard?${params.toString()}`;
    }
    if (ctaIntent === "workshop") {
      const params = new URLSearchParams({
        category: "Workshops",
        workshopHint: post.title,
      });
      return `/community/dashboard?${params.toString()}`;
    }
    if (ctaIntent === "video") {
      const params = new URLSearchParams({
        category: "Training Videos",
        video: post.id,
      });
      return `/community/dashboard?${params.toString()}`;
    }
    return "";
  }, [ctaIntent, post]);

  const fetchPostData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("id,title,description,content_html,category,created_at,cta_text,cta_link,thumbnail_emoji,likes_count,comments_count,saves_count,views_count")
      .eq("id", id)
      .eq("is_published", true)
      .eq("is_hidden", false)
      .lte("created_at", new Date().toISOString())
      .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
      .maybeSingle();

    if (postError || !postData) {
      if (ENABLE_SEED_FALLBACK) {
        const seed = seededPosts.find((item) => item.id === id);
        if (seed) {
          setPost(seed as Post);
          setRelated(
            seededPosts
              .filter((item) => item.category === seed.category && item.id !== seed.id)
              .slice(0, 3) as Post[]
          );
          setComments([]);
          setLiked(false);
          setSaved(false);
          setLoading(false);
          return;
        }
      }
      setPost(null);
      setRelated([]);
      setComments([]);
      setLoading(false);
      toast.error("Live post not found.");
      return;
    }

    setPost(postData as Post);

    const [relatedResult, commentsResult] = await Promise.all([
      supabase
        .from("posts")
        .select("id,title,description,content_html,category,created_at,cta_text,cta_link,thumbnail_emoji,likes_count,comments_count,saves_count,views_count")
        .eq("category", postData.category)
        .neq("id", postData.id)
        .eq("is_published", true)
        .eq("is_hidden", false)
        .lte("created_at", new Date().toISOString())
        .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("post_comments")
        .select("id,content,created_at,user_id")
        .eq("post_id", postData.id)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false }),
    ]);

    setRelated((relatedResult.data ?? []) as Post[]);
    setComments((commentsResult.data ?? []) as Comment[]);

    if (user?.id) {
      const [likeState, saveState] = await Promise.all([
        supabase.from("post_likes").select("id").eq("post_id", postData.id).eq("user_id", user.id).maybeSingle(),
        supabase.from("post_saves").select("id").eq("post_id", postData.id).eq("user_id", user.id).maybeSingle(),
      ]);
      setLiked(Boolean(likeState.data));
      setSaved(Boolean(saveState.data));
    }

    if (!isSeedPost(postData.id)) {
      await supabase.rpc("increment_view_count", { post_id: postData.id });
    }
    setLoading(false);
  }, [id, user?.id]);

  useEffect(() => {
    void fetchPostData();
  }, [fetchPostData]);

  const handleLike = async () => {
    if (!post || !user?.id) return;
    const next = !liked;
    setLiked(next);
    setPost((prev) => (prev ? { ...prev, likes_count: Math.max(0, prev.likes_count + (next ? 1 : -1)) } : prev));

    if (isSeedPost(post.id)) return;

    if (next) {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
    } else {
      await supabase.from("post_likes").delete().match({ post_id: post.id, user_id: user.id });
    }
  };

  const handleSave = async () => {
    if (!post || !user?.id) return;
    const next = !saved;
    setSaved(next);
    setPost((prev) => (prev ? { ...prev, saves_count: Math.max(0, prev.saves_count + (next ? 1 : -1)) } : prev));

    if (isSeedPost(post.id)) {
      if (next) toast.success("Post saved.");
      return;
    }

    if (next) {
      await supabase.from("post_saves").insert({ post_id: post.id, user_id: user.id });
      toast.success("Post saved.");
    } else {
      await supabase.from("post_saves").delete().match({ post_id: post.id, user_id: user.id });
    }
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      const url = `${window.location.origin}/community/posts/${post.id}`;
      if (user?.id && !isSeedPost(post.id)) {
        await supabase.from("post_shares").insert({ post_id: post.id, user_id: user.id, share_platform: "copy_link" });
      }
      if (navigator.share) {
        await navigator.share({ title: post.title, text: post.description, url });
      } else {
        const copied = await copyText(url);
        if (copied) toast.success("Link copied.");
        else toast.error("Could not copy link.");
      }
    } catch { /* user cancelled or share failed */ }
  };

  const handlePrimaryCta = () => {
    if (!post) return;
    if (ctaIntent === "prompt") {
      const raw = post.content_html ? post.content_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : `${post.title}\n\n${post.description}`;
      copyText(raw).then((copied) => {
        if (copied) toast.success("Prompt copied.");
        else toast.error("Could not copy prompt.");
      });
      return;
    }
    if (primaryCtaHref) {
      window.location.assign(primaryCtaHref);
      return;
    }
    if (!post.cta_link) return;
    if (post.cta_link.startsWith("/")) {
      navigate(post.cta_link);
      return;
    }
    window.open(post.cta_link, "_blank", "noopener,noreferrer");
  };

  const handleComment = async () => {
    if (!post || !comment.trim() || !user?.id) return;
    if (isSeedPost(post.id)) {
      toast.success("Comment submitted for moderation.");
      setComment("");
      return;
    }

    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: post.id, user_id: user.id, content: comment.trim() })
      .select("id,content,created_at,user_id")
      .single();

    if (error) {
      toast.error("Could not post comment.");
      return;
    }

    setComments((prev) => [data as Comment, ...prev]);
    setPost((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev));
    setComment("");
    toast.success("Comment submitted for moderation.");
  };

  return (
    <CommunityLayout>
      {loading ? (
        <div className="rounded-2xl border border-[#0B1640]/10 bg-[#232532] p-8 text-center text-[#0B1640]/75">Loading post...</div>
      ) : !post ? (
        <div className="mx-auto max-w-3xl space-y-4 rounded-2xl border border-[#0B1640]/10 bg-[#232532] p-8 text-center">
          <p className="text-[#0B1640]/85">This post is not available or not published yet.</p>
          <button
            onClick={() => navigate("/community/dashboard")}
            className="rounded-xl bg-[#F5F5F4] px-4 py-2 text-sm font-semibold text-[#f3f5f8]"
          >
            Back to Community
          </button>
        </div>
      ) : (
        <motion.div {...sectionReveal} className="mx-auto max-w-5xl space-y-6 pb-16">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#0B1640]/12 bg-white px-3 py-2 text-sm text-[#0B1640]/85 transition-all duration-200 ease-out-premium hover:-translate-y-0.5 hover:bg-white/10 active:scale-[0.985]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <motion.article {...cardReveal(0)} {...cardHover} className="rounded-2xl border border-[#0B1640]/10 bg-[#232532] p-6 transition-shadow duration-300 hover:shadow-[0_18px_36px_rgba(2,6,23,0.44)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-orange-400/35 bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-100">
                {post.category}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-[#0B1640]/55">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(post.created_at).toLocaleString()}
              </span>
            </div>

            <h1 className="mt-3 text-3xl font-bold text-[#0B1640]">{post.title}</h1>
            <p className="mt-3 text-base text-[#0B1640]/85">{post.description}</p>

            <div className="mt-6 rounded-2xl border border-[#0B1640]/10 bg-white p-6">
              {safeHtml ? (
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={safeHtml} />
              ) : (
                <div className="space-y-3 text-sm leading-relaxed text-[#0B1640]/75">
                  <p>{post.description}</p>
                  <p>Detailed content for this post will appear here once published by the community admin team.</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {hasMeaningfulCta ? (
                ctaIntent === "prompt" ? (
                  <button
                    onClick={handlePrimaryCta}
                    className="rounded-xl bg-[#F5F5F4] px-4 py-2 text-sm font-semibold text-[#f3f5f8] transition-all duration-200 ease-out-premium hover:-translate-y-0.5 hover:bg-white active:scale-[0.985]"
                  >
                    {post?.cta_text}
                  </button>
                ) : primaryCtaHref ? (
                  <a
                    href={primaryCtaHref}
                    className="rounded-xl bg-[#F5F5F4] px-4 py-2 text-sm font-semibold text-[#f3f5f8] transition-all duration-200 ease-out-premium hover:-translate-y-0.5 hover:bg-white active:scale-[0.985]"
                  >
                    {post?.cta_text}
                  </a>
                ) : (
                  <button
                    onClick={handlePrimaryCta}
                    className="rounded-xl bg-[#F5F5F4] px-4 py-2 text-sm font-semibold text-[#f3f5f8] transition-all duration-200 ease-out-premium hover:-translate-y-0.5 hover:bg-white active:scale-[0.985]"
                  >
                    {post?.cta_text}
                  </button>
                )
              ) : null}

              <button onClick={handleLike} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${liked ? "text-rose-300" : "text-[#0B1640]/75 hover:text-rose-300"}`}>
                <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                {post.likes_count}
              </button>
              <button className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-[#0B1640]/75 transition-colors duration-200 hover:text-[#0B1640]">
                <MessageCircle className="h-4 w-4" />
                {post.comments_count}
              </button>
              <button onClick={handleSave} className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${saved ? "text-orange-100" : "text-[#0B1640]/75 hover:text-orange-100"}`}>
                <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                {post.saves_count}
              </button>
              <button onClick={handleShare} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-[#0B1640]/75 transition-colors duration-200 hover:text-[#0B1640]">
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </motion.article>

          <motion.section {...cardReveal(1)} {...cardHover} className="rounded-2xl border border-[#0B1640]/10 bg-[#232532] p-6 transition-shadow duration-300 hover:shadow-[0_18px_36px_rgba(2,6,23,0.44)]">
            <h3 className="text-lg font-semibold onrol-heading-gradient-dark">Comments</h3>
            <div className="mt-3 flex gap-2">
              <input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Add a comment..."
                className="h-10 flex-1 rounded-xl border border-[#0B1640]/12 bg-white px-3 text-sm text-slate-100 placeholder:text-[#0B1640]/55 focus:border-orange-300 focus:outline-none"
              />
              <button onClick={handleComment} className="rounded-xl bg-[#F5F5F4] px-4 text-sm font-semibold text-[#f3f5f8] transition-all duration-200 ease-out-premium hover:-translate-y-0.5 hover:bg-white active:scale-[0.985]">Post</button>
            </div>
            <div className="mt-4 space-y-2">
              {comments.length === 0 ? (
                <p className="text-sm text-[#0B1640]/75">No comments yet.</p>
              ) : (
                comments.map((entry) => (
                  <article key={entry.id} className="rounded-xl border border-[#0B1640]/10 bg-white p-3">
                    <p className="text-sm text-[#0B1640]/85">{entry.content}</p>
                    <p className="mt-1 text-xs text-[#0B1640]/55">{new Date(entry.created_at).toLocaleString()}</p>
                  </article>
                ))
              )}
            </div>
          </motion.section>

          <motion.section {...cardReveal(2)} {...cardHover} className="rounded-2xl border border-[#0B1640]/10 bg-[#232532] p-6 transition-shadow duration-300 hover:shadow-[0_18px_36px_rgba(2,6,23,0.44)]">
            <h3 className="text-lg font-semibold onrol-heading-gradient-dark">Related posts</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {related.length === 0 ? (
                <p className="text-sm text-[#0B1640]/75">No related posts available.</p>
              ) : (
                related.map((item) => (
                  <Link key={item.id} to={`/community/posts/${item.id}`} className="rounded-xl border border-[#0B1640]/10 bg-white p-3 transition-all duration-200 ease-out-premium hover:-translate-y-0.5 hover:border-orange-400/40">
                    <p className="text-sm font-semibold text-[#0B1640] line-clamp-2">{item.title}</p>
                    <p className="mt-1 text-xs text-[#0B1640]/55">{item.category}</p>
                  </Link>
                ))
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </CommunityLayout>
  );
};

export default PostDetail;


