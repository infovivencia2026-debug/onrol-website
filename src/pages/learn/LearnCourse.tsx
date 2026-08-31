import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Loader2, PlayCircle, ArrowLeft, MessageSquare, FileText, BookOpen, Clock,
  Globe, Sparkles, CheckCircle2, ChevronDown, GraduationCap, ClipboardList, Video, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { LearnShell } from "@/components/learn/LearnShell";
import { CourseSyllabusRail } from "@/components/learn/CourseSyllabusRail";
import {
  lmsGetCourse,
  lmsListMyProgress,
  lmsListDiscussionsForCourse,
  lmsCreateDiscussionPost,
  type LmsCourseDetail,
  type LmsDiscussion,
} from "@/lib/lmsClient";
import "@/styles/learn-shell.css";
import "@/styles/learn-course.css";
// CourseSyllabusRail styles (.lr-*) live in learn-lesson.css — without
// this import the rail renders unstyled in the course-page sidebar.
import "@/styles/learn-lesson.css";

function fmtDuration(min?: number | null): string | null {
  if (!min || min <= 0) return null;
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

function lessonKindIcon(kind: string) {
  switch (kind) {
    case "quiz": return <ClipboardList size={11} aria-hidden />;
    case "assignment": return <FileText size={11} aria-hidden />;
    case "live": return <Video size={11} aria-hidden />;
    case "text": return <FileText size={11} aria-hidden />;
    default: return <PlayCircle size={11} aria-hidden />;
  }
}

export default function LearnCourse() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useLmsAuth();
  const [data, setData] = useState<LmsCourseDetail | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "qa">("overview");
  const [courseDiscussions, setCourseDiscussions] = useState<Array<LmsDiscussion & { lesson_title: string }>>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(false);
  const [askLesson, setAskLesson] = useState("");
  const [askBody, setAskBody] = useState("");
  const [asking, setAsking] = useState(false);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const detail = await lmsGetCourse(slug, { includeOutline: true });
        if (cancelled) return;
        setData(detail);
        if (detail && user) {
          const p = await lmsListMyProgress(user.id, detail.course.id).catch(() => []);
          if (!cancelled) {
            const map: Record<string, boolean> = {};
            for (const row of p) {
              if (row.completed_at) map[String(row.lesson_id)] = true;
            }
            setProgress(map);
          }
        }
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : "Failed to load course.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, user]);

  const allLessons = useMemo(
    () => (data?.modules ?? []).flatMap((m) => m.lessons).map((l) => ({ id: l.id, title: l.title })),
    [data],
  );

  // Auto-open the first module on first render
  useEffect(() => {
    if (!data) return;
    const first = data.modules?.[0];
    if (first && openModules[first.id] === undefined) {
      setOpenModules((prev) => ({ ...prev, [first.id]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (tab !== "qa" || allLessons.length === 0) return;
    let cancelled = false;
    setDiscussionsLoading(true);
    (async () => {
      const list = await lmsListDiscussionsForCourse(allLessons);
      if (cancelled) return;
      list.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setCourseDiscussions(list);
      setDiscussionsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tab, allLessons]);

  async function submitAsk() {
    if (!askLesson || !askBody.trim() || asking) return;
    setAsking(true);
    try {
      const created = await lmsCreateDiscussionPost({ lessonId: askLesson, bodyMd: askBody.trim() });
      if (created) {
        const lesson = allLessons.find((l) => l.id === askLesson);
        setCourseDiscussions((prev) => [{ ...created, lesson_title: lesson?.title ?? "" }, ...prev]);
        setAskBody("");
        toast.success("Question posted.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not post.");
    } finally {
      setAsking(false);
    }
  }

  if (loading) {
    return (
      <LearnShell>
        <div className="lc-skel lc-skel-back" />
        <div className="lc-skel lc-skel-hero" />
        <div className="lc-skel-stats">
          {[0, 1, 2, 3].map((i) => <div key={i} className="lc-skel lc-skel-stat" />)}
        </div>
        <div className="lc-skel lc-skel-tabs" />
        <div className="lc-skel lc-skel-mod" />
        <div className="lc-skel lc-skel-mod" />
        <div className="lc-skel lc-skel-mod" />
      </LearnShell>
    );
  }
  if (!data) {
    return (
      <LearnShell>
        <div className="learn-empty">
          <h3>Course not found</h3>
          <p>Ask your admin to activate it for you.</p>
        </div>
      </LearnShell>
    );
  }

  const { course, modules = [], enrolled } = data;
  const allFlat = modules.flatMap((m) => m.lessons);
  const totalLessons = allFlat.length;
  const completedLessons = allFlat.filter((l) => progress[l.id]).length;
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const firstLesson = allFlat[0];
  // Resume: next incomplete lesson, else first lesson
  const resumeLesson = allFlat.find((l) => !progress[l.id]) ?? firstLesson;
  const durationLabel = fmtDuration(course.duration_minutes);

  return (
    <LearnShell
      sidebarExtras={
        <CourseSyllabusRail
          courseTitle={course.title}
          courseSlug={course.slug}
          modules={modules}
          progress={progress}
          enrolled={enrolled}
        />
      }
    >
      <Link to="/learn/me/courses" className="lc-back">
        <ArrowLeft size={12} aria-hidden /> Back to my courses
      </Link>

      {/* Cinematic hero */}
      <section className="lc-hero" aria-label={course.title}>
        <div
          className="lc-hero-bg"
          style={course.thumbnail_url ? { backgroundImage: `url(${course.thumbnail_url})` } : undefined}
          aria-hidden
        />
        <div className="lc-hero-tint" aria-hidden />
        <div className="lc-hero-inner">
          <div className="lc-hero-text">
            <div className="lc-hero-chips">
              <span className="lc-chip lc-chip--level">{course.level.toUpperCase()}</span>
              {course.language ? <span className="lc-chip"><Globe size={11} aria-hidden /> {course.language.toUpperCase()}</span> : null}
              {durationLabel ? <span className="lc-chip"><Clock size={11} aria-hidden /> {durationLabel}</span> : null}
              <span className="lc-chip"><BookOpen size={11} aria-hidden /> {totalLessons} lessons</span>
            </div>
            <h1 className="lc-hero-title">{course.title}</h1>
            {course.summary ? <p className="lc-hero-summary">{course.summary}</p> : null}
            <div className="lc-hero-cta-row">
              {enrolled && resumeLesson ? (
                <button
                  type="button"
                  className="lc-cta lc-cta--primary"
                  onClick={() => navigate(`/learn/c/${course.slug}/l/${resumeLesson.id}`)}
                >
                  <PlayCircle size={16} aria-hidden />
                  <span>{pct === 0 ? "Start Day 1" : pct >= 100 ? "Review course" : `Resume · ${pct}% done`}</span>
                </button>
              ) : !enrolled ? (
                <a
                  href={`mailto:info@onrol.in?subject=${encodeURIComponent(`Enroll: ${course.title}`)}&body=${encodeURIComponent(`Hi,\n\nI'd like to enroll in "${course.title}".\n\nLearner email: ${user?.email ?? ""}\nCourse slug: ${course.slug}\n\nThanks!`)}`}
                  className="lc-cta lc-cta--primary"
                >
                  <Sparkles size={16} aria-hidden /> Request enrollment
                </a>
              ) : null}
              {enrolled && pct > 0 ? (
                <div className="lc-hero-progress" aria-label={`${pct}% complete`}>
                  <span className="lc-hero-progress-text">
                    <strong>{completedLessons}</strong> / {totalLessons} lessons
                  </span>
                  <div className="lc-hero-progress-bar">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="lc-stats" aria-label="Course at a glance">
        <div className="lc-stat">
          <span className="lc-stat-icon" aria-hidden><BookOpen size={16} /></span>
          <div className="lc-stat-text">
            <span className="lc-stat-val">{totalLessons}</span>
            <span className="lc-stat-lbl">Lessons</span>
          </div>
        </div>
        <div className="lc-stat">
          <span className="lc-stat-icon" aria-hidden><Clock size={16} /></span>
          <div className="lc-stat-text">
            <span className="lc-stat-val">{durationLabel ?? "Self-paced"}</span>
            <span className="lc-stat-lbl">Total time</span>
          </div>
        </div>
        <div className="lc-stat">
          <span className="lc-stat-icon" aria-hidden><GraduationCap size={16} /></span>
          <div className="lc-stat-text">
            <span className="lc-stat-val">{course.level}</span>
            <span className="lc-stat-lbl">Level</span>
          </div>
        </div>
        <div className="lc-stat">
          <span className="lc-stat-icon" aria-hidden><CheckCircle2 size={16} /></span>
          <div className="lc-stat-text">
            <span className="lc-stat-val">{pct}%</span>
            <span className="lc-stat-lbl">Your progress</span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="lc-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "overview"}
          className={`lc-tab${tab === "overview" ? " is-active" : ""}`}
          onClick={() => setTab("overview")}
        >
          <FileText size={14} aria-hidden /> Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "qa"}
          className={`lc-tab${tab === "qa" ? " is-active" : ""}`}
          onClick={() => setTab("qa")}
        >
          <MessageSquare size={14} aria-hidden /> Q&amp;A
          {courseDiscussions.length > 0 ? (
            <span className="lc-tab-count">{courseDiscussions.filter((d) => !d.parent_id).length}</span>
          ) : null}
        </button>
      </div>

      {tab === "overview" ? (
        <>
          {course.description_md ? (
            <section className="lc-section">
              <h2 className="lc-section-title">About this course</h2>
              <div className="lc-prose">
                {course.description_md.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ) : null}

          {/* Module accordion */}
          <section className="lc-section">
            <h2 className="lc-section-title">Curriculum</h2>
            <div className="lc-modules">
              {modules.map((m, mi) => {
                const open = openModules[m.id] ?? false;
                const moduleDone = m.lessons.filter((l) => progress[l.id]).length;
                return (
                  <div key={m.id} className={`lc-mod${open ? " is-open" : ""}`}>
                    <button
                      type="button"
                      className="lc-mod-head"
                      onClick={() => setOpenModules((prev) => ({ ...prev, [m.id]: !prev[m.id] }))}
                      aria-expanded={open}
                    >
                      <span className="lc-mod-num">{String(mi + 1).padStart(2, "0")}</span>
                      <div className="lc-mod-titlewrap">
                        <span className="lc-mod-title">{m.title}</span>
                        <span className="lc-mod-meta">{m.lessons.length} {m.lessons.length === 1 ? "lesson" : "lessons"} · {moduleDone} done</span>
                      </div>
                      <ChevronDown size={16} className="lc-mod-chev" aria-hidden />
                    </button>
                    {open ? (
                      <ul className="lc-mod-lessons">
                        {m.lessons.map((l, li) => {
                          const canPlay = enrolled || l.is_free_preview;
                          const done = progress[l.id];
                          return (
                            <li key={l.id}>
                              {canPlay ? (
                                <Link
                                  to={`/learn/c/${course.slug}/l/${l.id}`}
                                  className={`lc-lesson${done ? " is-done" : ""}`}
                                >
                                  <span className="lc-lesson-num">{li + 1}</span>
                                  <span className="lc-lesson-icon">
                                    {done ? <CheckCircle2 size={13} className="lc-icon-done" /> : lessonKindIcon(l.kind)}
                                  </span>
                                  <span className="lc-lesson-title">{l.title}</span>
                                  {l.is_free_preview && !enrolled ? (
                                    <span className="lc-lesson-tag">Free preview</span>
                                  ) : null}
                                  <span className="lc-lesson-action">{done ? "Re-watch" : "Open"} →</span>
                                </Link>
                              ) : (
                                <div className="lc-lesson is-locked">
                                  <span className="lc-lesson-num">{li + 1}</span>
                                  <span className="lc-lesson-icon"><Lock size={12} aria-hidden /></span>
                                  <span className="lc-lesson-title">{l.title}</span>
                                  <span className="lc-lesson-tag lc-lesson-tag--locked">Enrol to unlock</span>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <CourseQATab
          loading={discussionsLoading}
          posts={courseDiscussions}
          lessons={allLessons}
          askLesson={askLesson}
          setAskLesson={setAskLesson}
          askBody={askBody}
          setAskBody={setAskBody}
          asking={asking}
          onSubmit={submitAsk}
          canPost={!!user && enrolled}
          courseSlug={course.slug}
        />
      )}
    </LearnShell>
  );
}

/* ------------------- Course Q&A tab ------------------- */

function CourseQATab({
  loading, posts, lessons, askLesson, setAskLesson, askBody, setAskBody, asking, onSubmit, canPost, courseSlug,
}: {
  loading: boolean;
  posts: Array<LmsDiscussion & { lesson_title: string }>;
  lessons: Array<{ id: string; title: string }>;
  askLesson: string;
  setAskLesson: (v: string) => void;
  askBody: string;
  setAskBody: (v: string) => void;
  asking: boolean;
  onSubmit: () => void;
  canPost: boolean;
  courseSlug: string;
}) {
  function initialsOf(name: string): string {
    return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }
  function relTime(iso: string): string {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
  }
  const tops = posts.filter((p) => !p.parent_id);

  return (
    <div className="lc-section">
      {canPost ? (
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          className="lc-qa-form"
        >
          <h3 className="lc-qa-form-title"><MessageSquare size={14} aria-hidden /> Ask a question</h3>
          <p className="lc-qa-form-help">Pick the lesson it relates to. The mentor and other learners can answer.</p>

          <label className="lc-field">
            <span className="lc-field-label">Lesson</span>
            <select
              value={askLesson}
              onChange={(e) => setAskLesson(e.target.value)}
              className="lc-input"
            >
              <option value="">— pick a lesson —</option>
              {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </label>

          <label className="lc-field">
            <span className="lc-field-label">Question</span>
            <textarea
              value={askBody}
              onChange={(e) => setAskBody(e.target.value)}
              rows={3}
              placeholder="What's confusing you?"
              className="lc-input lc-input--textarea"
            />
          </label>

          <div className="lc-qa-actions">
            <button
              type="submit"
              disabled={!askLesson || !askBody.trim() || asking}
              className="lc-cta lc-cta--primary lc-cta--sm"
            >
              {asking ? "Posting…" : "Post question"}
            </button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <p className="lc-muted">Loading questions…</p>
      ) : tops.length === 0 ? (
        <div className="mc-empty">
          <div className="mc-empty-illo" aria-hidden><MessageSquare size={28} /></div>
          <h3 className="mc-empty-title">No questions yet</h3>
          <p className="mc-empty-sub">Be the first to ask — the mentor watches this thread.</p>
        </div>
      ) : (
        <ul className="lc-qa-list">
          {tops.map((p) => {
            const replyCount = posts.filter((r) => r.parent_id === p.id).length;
            const isStaff = p.author_kind === "mentor" || p.author_kind === "admin";
            return (
              <li key={p.id} className={`lc-post${isStaff ? " is-staff" : ""}`}>
                <div className="lc-post-head">
                  <span className="lc-post-avatar">{initialsOf(p.author_display_name)}</span>
                  <div className="lc-post-meta">
                    <span className="lc-post-author">
                      {p.author_display_name}
                      {isStaff ? <span className="lc-post-tag">{p.author_kind === "mentor" ? "Mentor" : "Staff"}</span> : null}
                    </span>
                    <span className="lc-post-when">
                      <Link to={`/learn/c/${courseSlug}/l/${p.lesson_id}`} className="lc-post-link">{p.lesson_title}</Link>
                      {" · "}{relTime(p.created_at)}
                    </span>
                  </div>
                </div>
                <p className="lc-post-body">{p.body_md}</p>
                <div className="lc-post-foot">
                  <span>{replyCount} {replyCount === 1 ? "reply" : "replies"}</span>
                  <Link to={`/learn/c/${courseSlug}/l/${p.lesson_id}#discussion`} className="lc-post-link" style={{ marginLeft: "auto" }}>
                    Open in lesson →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
