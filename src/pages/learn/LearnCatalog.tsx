import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, BookOpen, PlayCircle, Search, ArrowLeft, Lock, Mail, X, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import {
  lmsListPublicCourses,
  lmsGetPublicCourse,
  lmsSubmitEnrollmentRequest,
  type PublicCatalogCourse,
  type PublicCatalogCourseDetail,
} from "@/lib/lmsClient";

/* ─── SEO helpers ────────────────────────────────────────────────────── */

function setMeta(name: string, content: string, kind: "name" | "property" = "name") {
  if (typeof document === "undefined") return;
  let el = document.querySelector<HTMLMetaElement>(`meta[${kind}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(kind, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setJsonLd(id: string, payload: unknown) {
  if (typeof document === "undefined") return;
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(payload);
}

function removeJsonLd(id: string) {
  if (typeof document === "undefined") return;
  document.getElementById(id)?.remove();
}

function enrollMailto(course: { title: string; slug: string }, email?: string | null): string {
  const subject = encodeURIComponent(`Enroll: ${course.title}`);
  const body = encodeURIComponent(
    `Hi,\n\nI'd like to enroll in "${course.title}".\n\n` +
    `Learner email: ${email ?? ""}\nCourse slug: ${course.slug}\n\nThanks!`,
  );
  return `mailto:info@onrol.in?subject=${subject}&body=${body}`;
}

// ─── Brand-themed enrollment-request modal ────────────────────────────────
function EnrollmentRequestModal({
  course,
  defaultEmail,
  defaultName,
  userExternalId,
  onClose,
}: {
  course: { title: string; slug: string };
  defaultEmail: string;
  defaultName: string;
  userExternalId?: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [fullName, setFullName] = useState(defaultName);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim()) { toast.error("Email is required."); return; }
    setBusy(true);
    try {
      const r = await lmsSubmitEnrollmentRequest({
        courseSlug: course.slug,
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        message: message.trim(),
        userExternalId,
      });
      setDone(r.message);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not submit.";
      toast.error(msg);
      if (msg.toLowerCase().includes("could not")) {
        window.location.href = enrollMailto(course, email);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#f3f5f8]/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-b from-[#3f3f3f] to-[#f3f5f8] border border-white/10 shadow-[0_20px_80px_-15px_rgba(255,106,0,0.35)]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Request enrollment</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {done ? (
          <div className="p-8 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#ff6a00] to-[#ff8a3d] text-white mb-4 shadow-lg shadow-orange-500/30">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-slate-200 leading-relaxed">{done}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#ff6a00] to-[#ff8a3d] text-white font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6 space-y-4">
            <p className="text-sm text-slate-400">
              Course: <strong className="text-white">{course.title}</strong>
            </p>
            <label className="block">
              <span className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
                Email <span className="text-[#ff6a00]">*</span>
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#f3f5f8] text-white placeholder-slate-500 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 transition"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">Full name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#f3f5f8] text-white placeholder-slate-500 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 transition"
              />
            </label>
            <label className="block">
              <span className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">Phone <span className="text-slate-500 normal-case">(optional)</span></span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#f3f5f8] text-white placeholder-slate-500 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 transition"
              />
            </label>
            <label className="block">
              <span className="block mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">Anything we should know? <span className="text-slate-500 normal-case">(optional)</span></span>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Cohort dates, your goals, group enrollment, etc."
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/10 bg-[#f3f5f8] text-white placeholder-slate-500 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/30 transition resize-y"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full inline-flex justify-center items-center gap-2 py-3 rounded-lg bg-gradient-to-r from-[#ff6a00] to-[#ff8a3d] text-white font-semibold hover:shadow-lg hover:shadow-orange-500/40 transition disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {busy ? "Submitting…" : "Send enrollment request"}
            </button>
            <p className="text-xs text-slate-500 text-center">
              We'll email you within 1 working day. No spam.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Shared shell ─────────────────────────────────────────────────────────
function CatalogShell({ children }: { children: React.ReactNode }) {
  const { user } = useLmsAuth();
  return (
    <div className="min-h-screen bg-[#f3f5f8] text-slate-100 font-sans">
      {/* Ambient orange glow at top — same gesture as marketing site hero */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[480px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,106,0,0.18)_0%,rgba(255,106,0,0.06)_40%,transparent_70%)]"
      />
      <header className="relative border-b border-white/10 backdrop-blur-md bg-[#f3f5f8]/80">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link to="/learn/catalog" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#ff6a00] to-[#ff8a3d] flex items-center justify-center shadow-md shadow-orange-500/30 group-hover:shadow-orange-500/50 transition">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold text-white text-base">ONROL Learn</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest">AI Execution School</div>
            </div>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <a href="https://onrol.in" className="text-slate-400 hover:text-white transition hidden sm:block">
              onrol.in
            </a>
            {user ? (
              <Link to="/learn" className="text-[#ff6a00] hover:text-[#ff8a3d] font-medium transition">
                My dashboard →
              </Link>
            ) : (
              <Link
                to="/learn/login"
                className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <div className="relative">{children}</div>
    </div>
  );
}

// ─── Catalog list ─────────────────────────────────────────────────────────
export function LearnCatalogList() {
  const [courses, setCourses] = useState<PublicCatalogCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await lmsListPublicCourses({ limit: 200 });
        if (!cancelled) setCourses(rows);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load courses.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) =>
      c.title.toLowerCase().includes(q) ||
      (c.summary ?? "").toLowerCase().includes(q) ||
      (c.category ?? "").toLowerCase().includes(q),
    );
  }, [courses, search]);

  return (
    <CatalogShell>
      <main className="max-w-6xl mx-auto px-5 py-16 sm:py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#ff6a00]/30 bg-[#ff6a00]/5 text-[#ff8a3d] text-xs font-semibold uppercase tracking-widest mb-5">
            <Sparkles className="h-3.5 w-3.5" />
            Course catalog
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
            Learn AI <span className="bg-gradient-to-r from-[#ff6a00] to-[#ff8a3d] bg-clip-text text-transparent">execution</span>,
            <br className="hidden sm:block" /> not theory.
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Bootcamps and short courses built for shipping. Browse the catalog, request enrollment in seconds.
          </p>
        </div>

        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <h2 className="text-lg font-semibold text-white">
            All courses {!loading && <span className="text-sm text-slate-500 font-normal">· {filtered.length}</span>}
          </h2>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses…"
              className="pl-10 pr-3.5 py-2.5 rounded-lg border border-white/10 bg-[#f3f5f8] text-white placeholder-slate-500 text-sm w-64 focus:border-[#ff6a00] focus:outline-none focus:ring-2 focus:ring-[#ff6a00]/20 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-7 w-7 animate-spin text-[#ff6a00]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#f3f5f8] p-16 text-center">
            <BookOpen className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500">No courses match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((c) => (
              <Link
                key={c.id}
                to={`/learn/catalog/${c.slug}`}
                className="group relative rounded-2xl border border-white/10 bg-gradient-to-b from-[#3f3f3f] to-[#f3f5f8] overflow-hidden transition hover:border-[#ff6a00]/40 hover:shadow-[0_20px_60px_-15px_rgba(255,106,0,0.25)] hover:-translate-y-0.5"
              >
                <div className="aspect-video bg-[#f3f5f8] relative overflow-hidden">
                  {c.thumbnail_url ? (
                    <img
                      src={c.thumbnail_url}
                      alt={c.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3f3f3f] to-[#f3f5f8]">
                      <PlayCircle className="h-12 w-12 text-slate-600" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#f3f5f8]/90 to-transparent" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#f3f5f8]/90 backdrop-blur text-slate-300 border border-white/10">
                    {c.level}
                  </span>
                  {c.category && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-[#ff6a00] text-white shadow-md shadow-orange-500/30">
                      {c.category}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <div className="font-semibold text-white text-base group-hover:text-[#ff8a3d] transition-colors">
                    {c.title}
                  </div>
                  {c.summary && (
                    <p className="text-sm text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{c.summary}</p>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-sm">
                    <span className="text-slate-500 text-xs">
                      {c.duration_minutes ? `${c.duration_minutes} min` : c.language.toUpperCase()}
                    </span>
                    {c.price_inr != null && (
                      <span className="font-bold text-white">
                        ₹{c.price_inr.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </CatalogShell>
  );
}

// ─── Catalog course detail ────────────────────────────────────────────────
export function LearnCatalogCourse() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useLmsAuth();
  const [data, setData] = useState<PublicCatalogCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const d = await lmsGetPublicCourse(slug);
        if (!cancelled) setData(d);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load course.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  // SEO: update title + meta tags dynamically when course data lands.
  useEffect(() => {
    if (!data?.course) return;
    const c = data.course;
    const title = `${c.title} · ONROL Learn`;
    const desc = c.summary?.slice(0, 158) ?? `${c.title} — a course on ONROL Learn. Get hands-on AI skills with real projects, mentor reviews, and a certificate on completion.`;
    document.title = title;
    setMeta("description", desc);
    setMeta("og:title", title, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:url", `https://learn.onrol.in/learn/catalog/${c.slug}`, "property");
    if (c.thumbnail_url) setMeta("og:image", c.thumbnail_url, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", desc);
    // JSON-LD Course schema for richer search results.
    setJsonLd("course-schema", {
      "@context": "https://schema.org",
      "@type": "Course",
      name: c.title,
      description: desc,
      provider: { "@type": "Organization", name: "ONROL", sameAs: "https://onrol.in" },
      url: `https://learn.onrol.in/learn/catalog/${c.slug}`,
      ...(c.thumbnail_url ? { image: c.thumbnail_url } : {}),
      ...(c.level ? { educationalLevel: c.level } : {}),
    });
    return () => {
      removeJsonLd("course-schema");
    };
  }, [data]);

  if (loading) {
    return (
      <CatalogShell>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-[#ff6a00]" />
        </div>
      </CatalogShell>
    );
  }

  if (!data) {
    return (
      <CatalogShell>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <p className="text-slate-400">Course not found.</p>
          <Link to="/learn/catalog" className="text-[#ff8a3d] hover:text-[#ff6a00] text-sm transition">Back to catalog</Link>
        </div>
      </CatalogShell>
    );
  }

  const { course, modules } = data;
  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
  const previewCount = modules.reduce((n, m) => n + m.lessons.filter((l) => l.is_free_preview).length, 0);

  return (
    <CatalogShell>
      <main className="max-w-6xl mx-auto px-5 py-10">
        <Link
          to="/learn/catalog"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 min-w-0">
            <CoursePreviewMedia course={course} />

            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#ff8a3d] font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              {course.category ?? "Course"}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight text-white leading-tight">
              {course.title}
            </h1>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-6 flex-wrap">
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 capitalize text-xs font-medium">
                {course.level}
              </span>
              {course.duration_minutes && (
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                  {course.duration_minutes} min
                </span>
              )}
              {course.language && (
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                  {course.language.toUpperCase()}
                </span>
              )}
              <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                {totalLessons} lessons
              </span>
              {previewCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-[#ff6a00]/10 border border-[#ff6a00]/30 text-[#ff8a3d] text-xs font-medium">
                  {previewCount} free preview{previewCount === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {course.summary && (
              <p className="text-lg text-slate-300 mb-6 leading-relaxed">{course.summary}</p>
            )}
            {course.description_md && (
              <div className="space-y-4 text-slate-300 leading-relaxed">
                {course.description_md.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}
          </section>

          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-[#3f3f3f] to-[#f3f5f8] p-5 sticky top-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
              {course.price_inr != null && (
                <div className="mb-4">
                  <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Tuition</div>
                  <div className="text-3xl font-bold text-white">₹{course.price_inr.toLocaleString()}</div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setRequestOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-[#ff6a00] to-[#ff8a3d] text-white font-semibold hover:shadow-lg hover:shadow-orange-500/40 transition"
              >
                <Mail className="h-4 w-4" />
                Request enrollment
              </button>
              {!user && (
                <Link
                  to="/learn/login"
                  className="mt-2 inline-flex w-full items-center justify-center py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm font-medium text-slate-200 transition"
                >
                  Sign in to track progress
                </Link>
              )}

              <div className="mt-7">
                <h3 className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-3">
                  Course content
                </h3>
                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
                  {modules.map((m) => (
                    <div key={m.id}>
                      <div className="font-semibold text-sm text-white mb-1.5">{m.title}</div>
                      <ul className="space-y-0.5">
                        {m.lessons.map((l) => (
                          <li key={l.id}>
                            <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm ${
                              l.is_free_preview
                                ? "text-slate-300"
                                : "text-slate-500"
                            }`}>
                              {l.is_free_preview ? (
                                <PlayCircle className="h-3.5 w-3.5 text-[#ff8a3d] shrink-0" />
                              ) : (
                                <Lock className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                              )}
                              <span className="flex-1 truncate">{l.title}</span>
                              {l.is_free_preview && (
                                <span className="text-[10px] uppercase tracking-wider text-[#ff8a3d] font-semibold">Preview</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      {requestOpen && (
        <EnrollmentRequestModal
          course={course}
          defaultEmail={user?.email ?? ""}
          defaultName={user?.user_metadata?.full_name ?? ""}
          userExternalId={user?.id}
          onClose={() => setRequestOpen(false)}
        />
      )}
    </CatalogShell>
  );
}

/* ─── Course preview media (trailer or thumbnail) ──────────────────────── */

function parseEmbedUrl(rawUrl: string): { kind: "youtube" | "vimeo" | "direct"; url: string } | null {
  try {
    const u = new URL(rawUrl);
    // YouTube — handle youtu.be, /watch?v=, /embed/, /shorts/
    if (u.hostname === "youtu.be") {
      return { kind: "youtube", url: `https://www.youtube.com/embed/${u.pathname.slice(1)}?autoplay=1&rel=0` };
    }
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      let id: string | null = null;
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else if (u.pathname.startsWith("/embed/")) id = u.pathname.slice(7).split("/")[0];
      else if (u.pathname.startsWith("/shorts/")) id = u.pathname.slice(8).split("/")[0];
      if (id) return { kind: "youtube", url: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` };
    }
    // Vimeo — vimeo.com/123456
    if (/(^|\.)vimeo\.com$/.test(u.hostname)) {
      const id = u.pathname.slice(1).split("/")[0];
      if (/^\d+$/.test(id)) return { kind: "vimeo", url: `https://player.vimeo.com/video/${id}?autoplay=1` };
    }
    // Direct .mp4 / .webm
    if (/\.(mp4|webm|mov)(\?|$)/i.test(u.pathname)) {
      return { kind: "direct", url: rawUrl };
    }
  } catch { /* fall through */ }
  return null;
}

function CoursePreviewMedia({ course }: { course: { title: string; thumbnail_url: string | null; trailer_url: string | null } }) {
  const [playing, setPlaying] = useState(false);
  const embed = course.trailer_url ? parseEmbedUrl(course.trailer_url) : null;
  const hasTrailer = embed !== null;

  if (playing && embed) {
    return (
      <div className="aspect-video rounded-2xl overflow-hidden bg-black mb-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] border border-white/10">
        {embed.kind === "direct" ? (
          <video src={embed.url} autoPlay controls className="w-full h-full object-cover" />
        ) : (
          <iframe
            src={embed.url}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="w-full h-full"
            title={`${course.title} preview`}
          />
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={hasTrailer ? () => setPlaying(true) : undefined}
      disabled={!hasTrailer}
      className={
        "relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 mb-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] " +
        (hasTrailer ? "cursor-pointer group" : "cursor-default")
      }
      aria-label={hasTrailer ? `Play preview of ${course.title}` : course.title}
    >
      {course.thumbnail_url ? (
        <img
          src={course.thumbnail_url}
          alt={course.title}
          className={
            "w-full h-full object-cover " +
            (hasTrailer ? "transition-transform duration-500 group-hover:scale-[1.03]" : "")
          }
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3f3f3f] to-[#f3f5f8]">
          <PlayCircle className="h-20 w-20 text-slate-700" />
        </div>
      )}
      {hasTrailer ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-[#ff6a00] shadow-2xl transition-transform group-hover:scale-110">
              <PlayCircle className="h-9 w-9 fill-current" strokeWidth={0} />
            </span>
          </div>
          <span className="absolute bottom-3 left-4 text-xs font-semibold uppercase tracking-widest text-white/90">
            Watch course preview
          </span>
        </>
      ) : null}
    </button>
  );
}

export default LearnCatalogList;
