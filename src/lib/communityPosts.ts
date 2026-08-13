// ONROL Community posts — admin-published, user-consumed.
// Schema lives in supabase/migrations/20260507_community_posts.sql

import { communitySupabase as supabase } from "@/lib/communitySupabase";

export type PostCategory =
  | "news"
  | "tools"
  | "prompts"
  | "hacks"
  | "wins"
  | "jobs"
  | "workshops";

export type PostStatus = "draft" | "published";

export interface CommunityPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string;
  category: PostCategory;
  cover_url: string | null;
  status: PostStatus;
  author_id: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

// ── Category metadata for the UI ─────────────────────────────────────────
export const CATEGORIES: { id: PostCategory; label: string; description: string; accent: string }[] = [
  { id: "news",      label: "AI News",   description: "What changed this week in AI.",         accent: "from-orange-400 to-amber-300" },
  { id: "tools",     label: "Tools",     description: "New AI tools worth your time.",         accent: "from-orange-400 to-orange-300" },
  { id: "prompts",   label: "Prompts",   description: "Battle-tested prompt patterns.",        accent: "from-violet-400 to-fuchsia-300" },
  { id: "hacks",     label: "Daily Hacks", description: "5-minute AI tricks you can ship today.", accent: "from-emerald-400 to-teal-300" },
  { id: "wins",      label: "Wins",      description: "Builder stories from cohorts + alumni.", accent: "from-pink-400 to-rose-300" },
  { id: "jobs",      label: "Jobs",      description: "AI-builder roles, internships, gigs.",  accent: "from-orange-400 to-orange-300" },
  { id: "workshops", label: "Workshops", description: "Live sessions, masterclasses, demos.",  accent: "from-yellow-400 to-amber-300" },
];

export const CATEGORY_BY_ID: Record<PostCategory, (typeof CATEGORIES)[number]> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<PostCategory, (typeof CATEGORIES)[number]>;

// ── Slug helpers ─────────────────────────────────────────────────────────
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// ── Queries ──────────────────────────────────────────────────────────────
export async function listPublishedPosts(opts: {
  category?: PostCategory;
  limit?: number;
  offset?: number;
} = {}): Promise<CommunityPost[]> {
  let q = supabase
    .from("community_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  if (opts.category) q = q.eq("category", opts.category);
  if (opts.limit) q = q.limit(opts.limit);
  if (opts.offset) q = q.range(opts.offset, opts.offset + (opts.limit ?? 20) - 1);
  const { data, error } = await q;
  if (error) {
    console.warn("[community-posts] list failed:", error.message);
    return [];
  }
  return (data ?? []) as CommunityPost[];
}

export async function getPostBySlug(slug: string): Promise<CommunityPost | null> {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return data as CommunityPost;
}

// ── Admin queries ────────────────────────────────────────────────────────
export async function adminListAllPosts(): Promise<CommunityPost[]> {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) {
    console.warn("[community-posts] admin list failed:", error.message);
    return [];
  }
  return (data ?? []) as CommunityPost[];
}

export async function adminGetPost(id: string): Promise<CommunityPost | null> {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data as CommunityPost;
}

export interface PostInput {
  title: string;
  slug: string;
  excerpt: string;
  body_md: string;
  category: PostCategory;
  cover_url: string | null;
  status: PostStatus;
}

export async function adminCreatePost(
  input: PostInput,
  authorId: string,
): Promise<CommunityPost | null> {
  const payload = {
    ...input,
    author_id: authorId,
    published_at: input.status === "published" ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase
    .from("community_posts")
    .insert(payload)
    .select("*")
    .single();
  if (error) {
    console.warn("[community-posts] create failed:", error.message);
    return null;
  }
  return data as CommunityPost;
}

export async function adminUpdatePost(
  id: string,
  input: Partial<PostInput> & { current_status?: PostStatus },
): Promise<CommunityPost | null> {
  const payload: Record<string, unknown> = { ...input };
  delete payload.current_status;
  // Set published_at when transitioning draft → published for the first time.
  if (
    input.status === "published" &&
    input.current_status !== "published"
  ) {
    payload.published_at = new Date().toISOString();
  }
  const { data, error } = await supabase
    .from("community_posts")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) {
    console.warn("[community-posts] update failed:", error.message);
    return null;
  }
  return data as CommunityPost;
}

export async function adminDeletePost(id: string): Promise<boolean> {
  const { error } = await supabase.from("community_posts").delete().eq("id", id);
  if (error) {
    console.warn("[community-posts] delete failed:", error.message);
    return false;
  }
  return true;
}

// ── Cover image upload ───────────────────────────────────────────────────
export async function uploadCoverImage(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("community-covers")
    .upload(name, file, { upsert: false, contentType: file.type });
  if (error) {
    console.warn("[community-posts] upload failed:", error.message);
    return null;
  }
  const { data } = supabase.storage.from("community-covers").getPublicUrl(name);
  return data.publicUrl;
}
