// Admin post editor — markdown body + side-by-side live preview + cover upload.
// URL: /community/admin/new          → blank editor
//      /community/admin/<post-id>    → edit existing

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import Container from "@/components/shared/Container";
import AdminGate from "@/components/community/AdminGate";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import {
  CATEGORIES,
  type CommunityPost,
  type PostCategory,
  type PostStatus,
  adminCreatePost,
  adminDeletePost,
  adminGetPost,
  adminUpdatePost,
  slugify,
  uploadCoverImage,
} from "@/lib/communityPosts";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

export default function AdminCommunityPostEditor() {
  return (
    <AdminGate>
      <Editor />
    </AdminGate>
  );
}

function Editor() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { admin } = useCommunityAuth();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState("");
  const [original, setOriginal] = useState<CommunityPost | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState<PostCategory>("news");
  const [body, setBody] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<PostStatus>("draft");

  // Load existing post if editing.
  useEffect(() => {
    if (isNew) return;
    let active = true;
    (async () => {
      const post = await adminGetPost(id!);
      if (!active) return;
      if (!post) {
        setError("Post not found.");
        setLoading(false);
        return;
      }
      setOriginal(post);
      setTitle(post.title);
      setSlug(post.slug);
      setSlugTouched(true);
      setExcerpt(post.excerpt ?? "");
      setCategory(post.category);
      setBody(post.body_md);
      setCoverUrl(post.cover_url);
      setStatus(post.status);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [id, isNew]);

  // Auto-generate slug from title until user manually edits it.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const onCoverChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Cover image must be under 5MB.");
      return;
    }
    setUploadingCover(true);
    setError("");
    const url = await uploadCoverImage(file);
    setUploadingCover(false);
    if (!url) {
      setError("Cover upload failed. Try again or pick a smaller image.");
      return;
    }
    setCoverUrl(url);
  };

  const handleSave = async (publishMode: PostStatus) => {
    setError("");
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!slug.trim()) {
      setError("Slug is required.");
      return;
    }
    if (!body.trim()) {
      setError("Body cannot be empty.");
      return;
    }
    if (!admin?.id) {
      setError("Admin session missing — please refresh and sign in again.");
      return;
    }

    setSaving(true);
    const input = {
      title: title.trim(),
      slug: slugify(slug),
      excerpt: excerpt.trim(),
      body_md: body,
      category,
      cover_url: coverUrl,
      status: publishMode,
    };

    let result: CommunityPost | null;
    if (isNew) {
      result = await adminCreatePost(input, admin.id);
    } else {
      result = await adminUpdatePost(id!, {
        ...input,
        current_status: original?.status,
      });
    }
    setSaving(false);

    if (!result) {
      setError(
        "Save failed — usually a duplicate slug. Try a different slug, or check console for details.",
      );
      return;
    }

    navigate("/community/admin");
  };

  const handleDelete = async () => {
    if (isNew || !id) return;
    if (!confirm("Delete this post permanently? This cannot be undone.")) return;
    const ok = await adminDeletePost(id);
    if (ok) navigate("/community/admin");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f5f8] text-white">
        <Loader2 className="h-6 w-6 animate-spin text-orange-300" />
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#f3f5f8] pt-24 text-white md:pt-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <section className="bg-[#f3f5f8] pb-20">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              to="/community/admin"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.16em] text-slate-300 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              All posts
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void handleSave("draft")}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 text-[13px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-orange-300/40 hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save draft
              </button>
              <button
                type="button"
                onClick={() => void handleSave("published")}
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-5 text-[13px] font-bold uppercase tracking-wider text-white shadow-[0_14px_28px_-12px_rgba(255,107,71,0.55)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {status === "published" ? "Update" : "Publish"}
              </button>
              {!isNew ? (
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/[0.03] text-rose-300 transition hover:border-rose-300/40 hover:bg-rose-500/10"
                  aria-label="Delete post"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          </div>

          <h1
            className="mt-6 text-white"
            style={{
              fontSize: "clamp(26px, 3.6vw, 36px)",
              fontWeight: 800,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
          >
            {isNew ? "New post" : "Edit post"}
          </h1>

          {error ? (
            <p className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-[13px] font-medium text-rose-200">
              {error}
            </p>
          ) : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_minmax(0,420px)]">
            {/* ── Editor column ─────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              <Field label="Title">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Headline that earns the click"
                  className="h-12 w-full rounded-xl border border-white/12 bg-white/[0.03] px-3.5 text-[15.5px] font-semibold text-white placeholder:text-slate-500 focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Slug (URL)">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    placeholder="my-post-slug"
                    className="h-11 w-full rounded-xl border border-white/12 bg-white/[0.03] px-3.5 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    /community/posts/<span className="text-orange-300">{slug || "your-slug"}</span>/
                  </p>
                </Field>

                <Field label="Category">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as PostCategory)}
                    className="h-11 w-full rounded-xl border border-white/12 bg-white/[0.03] px-3.5 text-[14px] text-white focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#232532]">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Excerpt (1-line summary, used in feed + meta description)">
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  maxLength={200}
                  placeholder="One line that makes people click."
                  className="w-full rounded-xl border border-white/12 bg-white/[0.03] px-3.5 py-2.5 text-[14px] text-white placeholder:text-slate-500 focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {excerpt.length}/200
                </p>
              </Field>

              <Field label="Cover image">
                <CoverUploader
                  url={coverUrl}
                  uploading={uploadingCover}
                  onChange={onCoverChange}
                  onClear={() => setCoverUrl(null)}
                />
              </Field>

              <Field label="Body (Markdown)">
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={20}
                  placeholder="# Heading&#10;&#10;Write your post in markdown. Use **bold**, _italics_, `code`, lists, and [links](https://onrol.in).&#10;&#10;## Subheading&#10;&#10;Paragraph here."
                  className="w-full rounded-xl border border-white/12 bg-white/[0.03] px-3.5 py-3 font-mono text-[13.5px] leading-[1.7] text-white placeholder:text-slate-500 focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {body.length} chars · {body.split(/\s+/).filter(Boolean).length} words
                </p>
              </Field>
            </motion.div>

            {/* ── Live preview column ───────────────────────────── */}
            <motion.aside
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="lg:sticky lg:top-28 lg:self-start"
            >
              <div className="rounded-2xl border border-white/12 bg-[#232532] p-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-300">
                    Live preview
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      status === "published"
                        ? "border-emerald-300/35 bg-emerald-500/10 text-emerald-200"
                        : "border-amber-300/35 bg-amber-500/10 text-amber-200"
                    }`}
                  >
                    {status === "published" ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {status}
                  </span>
                </div>

                <PreviewBody
                  title={title}
                  excerpt={excerpt}
                  category={category}
                  coverUrl={coverUrl}
                  body={body}
                />
              </div>
            </motion.aside>
          </div>
        </Container>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function CoverUploader({
  url,
  uploading,
  onChange,
  onClear,
}: {
  url: string | null;
  uploading: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  if (url) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-white/12 bg-white/[0.03]">
        <img src={url} alt="" className="h-44 w-full object-cover" />
        <button
          type="button"
          onClick={onClear}
          aria-label="Remove cover"
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
      <ImageIcon className="mx-auto h-6 w-6 text-slate-500" />
      <p className="mt-2 text-[13px] text-slate-300">
        {uploading ? "Uploading…" : "Add a cover image (JPG/PNG, under 5MB)"}
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-4 text-[12px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-orange-300/40 hover:bg-white/8 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
        Upload image
      </button>
    </div>
  );
}

function PreviewBody({
  title,
  excerpt,
  category,
  coverUrl,
  body,
}: {
  title: string;
  excerpt: string;
  category: PostCategory;
  coverUrl: string | null;
  body: string;
}) {
  const cat = CATEGORIES.find((c) => c.id === category)!;
  const html = useMemo(() => renderMarkdown(body), [body]);

  return (
    <article className="mt-4">
      {coverUrl ? (
        <img src={coverUrl} alt="" className="aspect-video w-full rounded-lg object-cover" />
      ) : null}
      <span
        className={`mt-4 inline-flex items-center rounded-full bg-gradient-to-r ${cat.accent} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f3f5f8]`}
      >
        {cat.label}
      </span>
      <h2
        className="mt-3 text-white"
        style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.2 }}
      >
        {title || <em className="text-slate-500">(untitled)</em>}
      </h2>
      {excerpt ? (
        <p className="mt-2 text-[14px] leading-relaxed text-slate-300">{excerpt}</p>
      ) : null}
      <div
        className="prose-onrol mt-5 text-[14px] leading-[1.75] text-slate-200"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}

/**
 * Lightweight markdown renderer — no external dep.
 * Supports: # headings, **bold**, *italic*, `code`, ```fenced code```,
 * - bullets, 1. numbered lists, [links](url), paragraphs, blockquotes.
 *
 * Not a complete CommonMark — meant for blog-style admin output. The
 * output HTML is escaped for safety; admin authors can't inject script.
 */
function renderMarkdown(src: string): string {
  if (!src) return "";
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Pull fenced code blocks first to keep them safe from inline rules.
  const codeBlocks: string[] = [];
  let text = src.replace(/```([\s\S]*?)```/g, (_m, code: string) => {
    const idx = codeBlocks.length;
    codeBlocks.push(
      `<pre class="overflow-x-auto rounded-lg bg-[#f3f5f8] px-3 py-3 font-mono text-[12.5px] leading-snug text-slate-200"><code>${escape(code)}</code></pre>`,
    );
    return ` CODEBLOCK${idx} `;
  });

  // Escape remaining text.
  text = escape(text);

  // Headings.
  text = text.replace(/^###\s+(.*)$/gm, '<h3 class="mt-6 text-[18px] font-bold text-white">$1</h3>');
  text = text.replace(/^##\s+(.*)$/gm, '<h2 class="mt-6 text-[20px] font-bold text-white">$1</h2>');
  text = text.replace(/^#\s+(.*)$/gm, '<h1 class="mt-6 text-[24px] font-extrabold text-white">$1</h1>');

  // Blockquotes.
  text = text.replace(/^>\s+(.*)$/gm, '<blockquote class="border-l-2 border-orange-400 pl-3 text-slate-300">$1</blockquote>');

  // Lists — group consecutive list lines.
  text = text.replace(/(?:^|\n)((?:[-*]\s+.+(?:\n|$))+)/g, (_m, group: string) => {
    const items = group
      .trim()
      .split(/\n/)
      .map((l) => l.replace(/^[-*]\s+/, ""))
      .map((l) => `<li>${l}</li>`)
      .join("");
    return `\n<ul class="ml-5 list-disc space-y-1">${items}</ul>`;
  });
  text = text.replace(/(?:^|\n)((?:\d+\.\s+.+(?:\n|$))+)/g, (_m, group: string) => {
    const items = group
      .trim()
      .split(/\n/)
      .map((l) => l.replace(/^\d+\.\s+/, ""))
      .map((l) => `<li>${l}</li>`)
      .join("");
    return `\n<ol class="ml-5 list-decimal space-y-1">${items}</ol>`;
  });

  // Inline: bold, italic, code, links.
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");
  text = text.replace(/`([^`]+)`/g, '<code class="rounded bg-white/8 px-1 py-0.5 text-[12.5px]">$1</code>');
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="text-orange-300 underline underline-offset-2 hover:text-orange-200">$1</a>',
  );

  // Paragraphs — wrap remaining bare lines.
  text = text
    .split(/\n{2,}/)
    .map((block) => {
      const t = block.trim();
      if (!t) return "";
      if (/^<(h\d|ul|ol|pre|blockquote)/i.test(t)) return t;
      return `<p>${t.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  // Restore code blocks.
  text = text.replace(/ CODEBLOCK(\d+) /g, (_m, idx: string) => codeBlocks[Number(idx)]);

  return text;
}

export { renderMarkdown };
