// Admin posts list page: /community/admin
// Shows all posts (drafts + published) with quick actions.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import Container from "@/components/shared/Container";
import AdminGate from "@/components/community/AdminGate";
import {
  adminListAllPosts,
  adminDeletePost,
  CATEGORY_BY_ID,
  type CommunityPost,
} from "@/lib/communityPosts";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

export default function AdminCommunityPosts() {
  return (
    <AdminGate>
      <PostsList />
    </AdminGate>
  );
}

function PostsList() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "draft" | "published">("all");

  const refresh = async () => {
    setLoading(true);
    setPosts(await adminListAllPosts());
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const visible = posts.filter((p) => filter === "all" || p.status === filter);
  const counts = {
    all: posts.length,
    draft: posts.filter((p) => p.status === "draft").length,
    published: posts.filter((p) => p.status === "published").length,
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post permanently? This cannot be undone.")) return;
    const ok = await adminDeletePost(id);
    if (ok) await refresh();
  };

  return (
    <main
      className="min-h-screen bg-[#f3f5f8] pt-24 text-white md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <section className="bg-[#f3f5f8] py-8 md:py-12">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-300">
                — Admin
              </p>
              <h1
                className="mt-2 text-white"
                style={{
                  fontSize: "clamp(28px, 4vw, 40px)",
                  fontWeight: 800,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.05,
                }}
              >
                Community posts
              </h1>
              <p className="mt-2 text-[14px] text-slate-400">
                {counts.published} published · {counts.draft} draft · {counts.all} total
              </p>
            </div>

            <Link
              to="/community/admin/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-[14px] font-bold uppercase tracking-wider text-white shadow-[0_14px_28px_-12px_rgba(255,107,71,0.55)] transition hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              New post
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {(["all", "published", "draft"] as const).map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
                    active
                      ? "bg-orange-500 text-white shadow-[0_10px_22px_-8px_rgba(255,107,71,0.55)]"
                      : "border border-white/12 bg-white/[0.03] text-slate-300 hover:border-orange-300/40 hover:bg-white/8"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      active ? "bg-white/20" : "bg-white/8 text-slate-400"
                    }`}
                  >
                    {counts[f]}
                  </span>
                </button>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="bg-[#f3f5f8] pb-20">
        <Container>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-orange-300" />
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#232532] p-10 text-center">
              <p className="text-[15px] text-slate-300">
                No posts {filter !== "all" ? `with status "${filter}"` : "yet"}.
              </p>
              <Link
                to="/community/admin/new"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-white"
              >
                <Plus className="h-4 w-4" />
                Create the first post
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {visible.map((post) => {
                const cat = CATEGORY_BY_ID[post.category];
                return (
                  <article
                    key={post.id}
                    className="grid gap-4 rounded-2xl border border-white/10 bg-[#232532] p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center sm:p-5"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/10 bg-white/[0.03] sm:w-[120px]">
                      {post.cover_url ? (
                        <img
                          src={post.cover_url}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          No cover
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full bg-gradient-to-r ${cat.accent} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f3f5f8]`}
                        >
                          {cat.label}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] ${
                            post.status === "published"
                              ? "border-emerald-300/35 bg-emerald-500/10 text-emerald-200"
                              : "border-amber-300/35 bg-amber-500/10 text-amber-200"
                          }`}
                        >
                          {post.status === "published" ? (
                            <>
                              <Eye className="mr-1 h-3 w-3" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="mr-1 h-3 w-3" />
                              Draft
                            </>
                          )}
                        </span>
                      </div>
                      <h3
                        className="mt-2 truncate text-white"
                        style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "-0.005em" }}
                      >
                        {post.title || <em className="text-slate-500">(untitled)</em>}
                      </h3>
                      <p className="mt-1 line-clamp-1 text-[13px] text-slate-400">
                        {post.excerpt || "No excerpt"}
                      </p>
                      <p className="mt-1 text-[11.5px] text-slate-500">
                        Updated{" "}
                        {new Date(post.updated_at).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 justify-self-start sm:justify-self-end">
                      <Link
                        to={`/community/admin/${post.id}`}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-3 text-[12px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-orange-300/40 hover:bg-white/8 hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(post.id)}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/[0.03] text-rose-300 transition hover:border-rose-300/40 hover:bg-rose-500/10"
                        aria-label="Delete post"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </Container>
      </section>
    </main>
  );
}
