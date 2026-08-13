import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Loader2, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2,
  PlayCircle, FileText as FileIcon, ClipboardList, Video as VideoIcon,
  Maximize2, Minimize2, Expand, Notebook, Link2, MessageSquare, List, X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { LearnShell } from "@/components/learn/LearnShell";
import { CourseSyllabusRail } from "@/components/learn/CourseSyllabusRail";
import { LessonDiscussionThread } from "@/components/learn/LessonDiscussionThread";
import { LessonPlayer, type PlaybackState } from "@/components/learn/LessonPlayer";
import {
  lmsGetCourse,
  lmsListMyProgress,
  lmsSaveProgress,
  lmsListLessonResources,
  lmsGetLessonNote,
  lmsSaveLessonNote,
  type LmsCourseDetail,
  type LmsLesson,
  type LmsLessonResource,
} from "@/lib/lmsClient";
import "@/styles/learn-shell.css";
import "@/styles/learn-lesson.css";

const LearnQuiz = lazy(() => import("./LearnQuiz"));
const LearnAssignment = lazy(() => import("./LearnAssignment"));
const LearnLive = lazy(() => import("./LearnLive"));

// Throttle progress saves to once every N seconds of watched time.
const SAVE_INTERVAL_SEC = 10;
// Auto-mark-complete threshold (% of duration).
const AUTO_COMPLETE_AT = 0.9;

function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function kindIcon(kind: string) {
  switch (kind) {
    case "quiz": return <ClipboardList size={12} aria-hidden />;
    case "assignment": return <FileIcon size={12} aria-hidden />;
    case "live": return <VideoIcon size={12} aria-hidden />;
    case "text": return <FileIcon size={12} aria-hidden />;
    default: return <PlayCircle size={12} aria-hidden />;
  }
}

export default function LearnLesson() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user } = useLmsAuth();
  const [data, setData] = useState<LmsCourseDetail | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState>({ currentTime: 0, duration: 0, isPlaying: false, ended: false });
  const [theatreMode, setTheatreMode] = useState(false);
  const [outlineSheetOpen, setOutlineSheetOpen] = useState(false);
  const [lessonTab, setLessonTab] = useState<"notes" | "resources" | "discussion">("notes");
  const [resources, setResources] = useState<LmsLessonResource[]>([]);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(true);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const lastSavedAtRef = useRef(0);
  const autoCompletedRef = useRef(false);
  const notesSaveTimer = useRef<number | null>(null);

  // Theatre-mode: dim the rest of the page and pin the player to fill the
  // viewport. ESC exits. We toggle a body class so the CSS can hide page
  // scroll without us touching React state in document listeners.
  useEffect(() => {
    if (!theatreMode) {
      document.body.classList.remove("ll-theatre-on");
      return;
    }
    document.body.classList.add("ll-theatre-on");
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setTheatreMode(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("ll-theatre-on");
      window.removeEventListener("keydown", onKey);
    };
  }, [theatreMode]);

  const requestFullscreen = () => {
    const el = frameRef.current;
    if (!el) return;
    // Try the wrapper first (player + chrome); fall back to the iframe so
    // YouTube/Vimeo native controls still work in their own fullscreen.
    const target = (el.querySelector("iframe, video") as HTMLElement | null) ?? el;
    const req = (target as unknown as { requestFullscreen?: () => Promise<void>; webkitRequestFullscreen?: () => void }).requestFullscreen
      ?? (target as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen;
    try { void req?.call(target); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const detail = await lmsGetCourse(slug, { includeOutline: true });
        if (cancelled) return;
        setData(detail);
        if (detail && user) {
          const rows = await lmsListMyProgress(user.id, detail.course.id).catch(() => []);
          if (cancelled) return;
          const map: Record<string, boolean> = {};
          for (const row of rows) {
            const id = (row as { lesson_id?: string }).lesson_id;
            const done = Boolean((row as { completed_at?: string | null }).completed_at);
            if (id) map[id] = done;
          }
          setProgressMap(map);
        }
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load lesson.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, user]);

  // Reset lesson-scoped refs whenever the user navigates to a new lesson.
  useEffect(() => {
    lastSavedAtRef.current = 0;
    autoCompletedRef.current = false;
    setPlayback({ currentTime: 0, duration: 0, isPlaying: false, ended: false });
    setLessonTab("notes");
    // Restore notes from localStorage for this lesson.
    if (lessonId) {
      try {
        const raw = window.localStorage.getItem(`learn.notes.${lessonId}`);
        setNotes(raw ?? "");
      } catch { setNotes(""); }
      setNotesSaved(true);
    }
  }, [lessonId]);

  // Load lesson resources (links / files attached by the mentor).
  useEffect(() => {
    if (!lessonId) { setResources([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const rows = await lmsListLessonResources(lessonId);
        if (!cancelled) setResources(rows);
      } catch {
        if (!cancelled) setResources([]);
      }
    })();
    return () => { cancelled = true; };
  }, [lessonId]);

  // Hydrate notes from the server. Falls back to the localStorage cache so
  // offline learners still see their last text; server write-back kicks in
  // as soon as the network returns.
  useEffect(() => {
    if (!lessonId || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { body } = await lmsGetLessonNote(lessonId);
        if (cancelled) return;
        if (body) setNotes(body);
      } catch { /* keep the localStorage value */ }
    })();
    return () => { cancelled = true; };
  }, [lessonId, user]);

  // Debounced autosave — write to localStorage immediately, then PUT to the
  // server. Server failures are non-fatal; the local cache remains source
  // of truth so the textarea never blocks on the network.
  useEffect(() => {
    if (!lessonId) return;
    setNotesSaved(false);
    if (notesSaveTimer.current) window.clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = window.setTimeout(async () => {
      try { window.localStorage.setItem(`learn.notes.${lessonId}`, notes); } catch { /* ignore */ }
      try {
        if (user) await lmsSaveLessonNote(lessonId, notes);
      } catch { /* swallow */ }
      setNotesSaved(true);
    }, 700);
    return () => {
      if (notesSaveTimer.current) window.clearTimeout(notesSaveTimer.current);
    };
  }, [notes, lessonId, user]);

  const allLessons: LmsLesson[] = useMemo(() => (data?.modules ?? []).flatMap((m) => m.lessons), [data]);
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const currentLesson = currentIndex >= 0 ? allLessons[currentIndex] : null;
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const currentModule = useMemo(
    () => (data?.modules ?? []).find((m) => m.lessons.some((l) => l.id === lessonId)) ?? null,
    [data, lessonId],
  );
  const upNextInModule = useMemo(() => {
    if (!currentModule) return [];
    const i = currentModule.lessons.findIndex((l) => l.id === lessonId);
    if (i < 0) return [];
    return currentModule.lessons.slice(i + 1, i + 4);
  }, [currentModule, lessonId]);

  const watchedPct = playback.duration > 0
    ? Math.max(0, Math.min(100, (playback.currentTime / playback.duration) * 100))
    : 0;
  const isDone = currentLesson ? progressMap[currentLesson.id] === true : false;

  const handleProgress = useCallback((s: PlaybackState) => {
    setPlayback(s);
    if (!currentLesson || !data) return;
    const sec = Math.floor(s.currentTime);
    if (sec - lastSavedAtRef.current >= SAVE_INTERVAL_SEC) {
      lastSavedAtRef.current = sec;
      void lmsSaveProgress({
        lessonId: currentLesson.id,
        courseId: data.course.id,
        watchedSec: sec,
        lastPositionSec: sec,
      }).catch(() => undefined);
    }
    // Auto-complete once the learner reaches the threshold.
    if (
      !autoCompletedRef.current
      && !isDone
      && s.duration > 0
      && s.currentTime / s.duration >= AUTO_COMPLETE_AT
    ) {
      autoCompletedRef.current = true;
      void lmsSaveProgress({
        lessonId: currentLesson.id,
        courseId: data.course.id,
        watchedSec: Math.floor(s.currentTime),
        lastPositionSec: Math.floor(s.currentTime),
        completed: true,
      }).then(() => {
        setProgressMap((prev) => ({ ...prev, [currentLesson.id]: true }));
        toast.success("Lesson auto-marked complete.");
      }).catch(() => undefined);
    }
  }, [currentLesson, data, isDone]);

  const handleEnded = useCallback(() => {
    if (!currentLesson || !data) return;
    void lmsSaveProgress({
      lessonId: currentLesson.id,
      courseId: data.course.id,
      watchedSec: Math.floor(playback.duration || 0),
      lastPositionSec: Math.floor(playback.duration || 0),
      completed: true,
    }).then(() => {
      setProgressMap((prev) => ({ ...prev, [currentLesson.id]: true }));
    }).catch(() => undefined);
  }, [currentLesson, data, playback.duration]);

  const markComplete = async () => {
    if (!currentLesson || !data) return;
    setCompleting(true);
    try {
      await lmsSaveProgress({
        lessonId: currentLesson.id,
        courseId: data.course.id,
        completed: true,
      });
      setProgressMap((prev) => ({ ...prev, [currentLesson.id]: true }));
      toast.success("Lesson marked complete.");
      if (nextLesson) navigate(`/learn/c/${slug}/l/${nextLesson.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save progress.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <LearnShell>
        <div className="ll-skel-top">
          <span className="ll-skel ll-skel-crumb" />
          <span className="ll-skel ll-skel-chip" />
        </div>
        <div className="ll-skel ll-skel-theatre" />
        <div className="ll-skel ll-skel-title" />
        <div className="ll-skel ll-skel-prose" />
        <div className="ll-skel ll-skel-prose ll-skel-prose--short" />
        <div className="ll-skel-nav">
          <div className="ll-skel ll-skel-navbtn" />
          <div className="ll-skel ll-skel-navcta" />
          <div className="ll-skel ll-skel-navbtn" />
        </div>
      </LearnShell>
    );
  }
  if (!data || !currentLesson) {
    return (
      <LearnShell>
        <div className="learn-empty">
          <h3>Lesson not found</h3>
          <Link to="/learn/me/courses" style={{ color: "var(--learn-accent-2)" }}>Back to my courses</Link>
        </div>
      </LearnShell>
    );
  }
  const canAccess = data.enrolled || currentLesson.is_free_preview;
  if (!canAccess) {
    return (
      <LearnShell>
        <div className="learn-empty">
          <h3>Locked</h3>
          <p>You need to be enrolled to access this lesson.</p>
          <Link to={`/learn/c/${slug}`} style={{ color: "var(--learn-accent-2)" }}>Back to course</Link>
        </div>
      </LearnShell>
    );
  }

  // Quiz / assignment / live lessons render their own dedicated UI.
  if (currentLesson.kind === "quiz") {
    return (
      <Suspense fallback={<div className="ll-fallback"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
        <LearnQuiz courseSlug={slug!} lessonId={currentLesson.id} lessonTitle={currentLesson.title} />
      </Suspense>
    );
  }
  if (currentLesson.kind === "assignment") {
    return (
      <Suspense fallback={<div className="ll-fallback"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
        <LearnAssignment courseSlug={slug!} lessonId={currentLesson.id} />
      </Suspense>
    );
  }
  if (currentLesson.kind === "live") {
    return (
      <Suspense fallback={<div className="ll-fallback"><Loader2 className="h-6 w-6 animate-spin" /></div>}>
        <LearnLive courseSlug={slug!} lessonId={currentLesson.id} lessonTitle={currentLesson.title} />
      </Suspense>
    );
  }
  if (!currentLesson.video_url && currentLesson.kind === "video") {
    return (
      <LearnShell>
        <div className="learn-empty">
          <h3>Video not uploaded yet</h3>
          <Link to={`/learn/c/${slug}`} style={{ color: "var(--learn-accent-2)" }}>Back to course</Link>
        </div>
      </LearnShell>
    );
  }

  return (
    <LearnShell
      sidebarExtras={
        <CourseSyllabusRail
          courseTitle={data.course.title}
          courseSlug={slug ?? ""}
          modules={data.modules ?? []}
          activeLessonId={currentLesson.id}
          progress={progressMap}
          enrolled={data.enrolled}
        />
      }
    >
      {/* Crumb + module label */}
      <div className="ll-top">
        <Link to={`/learn/c/${slug}`} className="ll-crumb">
          <ArrowLeft size={12} aria-hidden /> <span>{data.course.title}</span>
        </Link>
        {currentModule ? (
          <span className="ll-module-chip">{currentModule.title}</span>
        ) : null}
        {/* Mobile-only: tap to open the full outline as a bottom sheet.
            Hidden on desktop where the syllabus is always visible in
            the sidebar rail. */}
        <button
          type="button"
          className="ll-outline-trigger"
          onClick={() => setOutlineSheetOpen(true)}
          aria-label="Open course outline"
        >
          <List size={13} aria-hidden />
          <span>
            Lesson <strong>{currentIndex + 1}</strong> of {allLessons.length}
          </span>
        </button>
      </div>

      {/* Theatre band — dark frame around the player */}
      <section
        className={`ll-theatre${theatreMode ? " is-theatre" : ""}`}
        aria-label="Lesson video"
      >
        <div className="ll-theatre-glow" aria-hidden />
        <div ref={frameRef} className="ll-theatre-frame">
          {currentLesson.video_url ? (
            <LessonPlayer
              videoUrl={currentLesson.video_url}
              title={currentLesson.title}
              onProgress={handleProgress}
              onEnded={handleEnded}
            />
          ) : (
            <div className="ll-theatre-empty">No media</div>
          )}
        </div>
        <div className="ll-theatre-meta">
          <div className="ll-theatre-meta-left">
            <span className="ll-kind-chip">
              {kindIcon(currentLesson.kind)} <span>{currentLesson.kind.toUpperCase()}</span>
            </span>
            <span className="ll-time">
              {fmtTime(playback.currentTime)} <span className="ll-time-sep">/</span> {playback.duration > 0 ? fmtTime(playback.duration) : "—"}
            </span>
          </div>
          <div className="ll-theatre-meta-right">
            <div className="ll-player-tools">
              <button
                type="button"
                className="ll-tool"
                onClick={() => setTheatreMode((v) => !v)}
                aria-label={theatreMode ? "Exit theatre mode" : "Enter theatre mode"}
                title={theatreMode ? "Exit theatre (Esc)" : "Theatre mode"}
              >
                {theatreMode ? <Minimize2 size={12} aria-hidden /> : <Expand size={12} aria-hidden />}
                <span>{theatreMode ? "Exit theatre" : "Theatre"}</span>
              </button>
              <button
                type="button"
                className="ll-tool"
                onClick={requestFullscreen}
                aria-label="Enter fullscreen"
                title="Fullscreen"
              >
                <Maximize2 size={12} aria-hidden />
                <span>Fullscreen</span>
              </button>
            </div>
            {isDone ? (
              <span className="ll-done-pill">
                <CheckCircle2 size={13} aria-hidden /> Completed
              </span>
            ) : (
              <span className="ll-progress-pill" aria-label={`${Math.round(watchedPct)} percent watched`}>
                <span className="ll-progress-bar"><span style={{ width: `${watchedPct}%` }} /></span>
                <span className="ll-progress-pct">{Math.round(watchedPct)}%</span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Lesson title + body */}
      <header className="ll-head">
        <h1 className="ll-title">{currentLesson.title}</h1>
        {currentLesson.body_md ? (
          <div className="ll-prose">
            {currentLesson.body_md.split("\n\n").map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : null}
      </header>

      {/* Lesson position indicator — visible on mobile only */}
      <div className="ll-mob-position" aria-hidden>
        <span className="ll-mob-position-eyebrow">{currentModule?.title ?? "Module"}</span>
        <span className="ll-mob-position-text">
          Lesson <strong>{currentIndex + 1}</strong> of {allLessons.length}
        </span>
      </div>

      {/* Prev / Complete / Next — desktop inline row */}
      <div className="ll-nav">
        <button
          type="button"
          disabled={!prevLesson}
          onClick={() => prevLesson && navigate(`/learn/c/${slug}/l/${prevLesson.id}`)}
          className="ll-nav-side"
          aria-label="Previous lesson"
        >
          <ChevronLeft size={16} aria-hidden />
          <span className="ll-nav-side-text">
            <span className="ll-nav-side-eyebrow">Previous</span>
            <span className="ll-nav-side-title">{prevLesson?.title ?? "—"}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={markComplete}
          disabled={completing || isDone}
          className={`ll-nav-cta${isDone ? " is-done" : ""}`}
        >
          <CheckCircle2 size={16} aria-hidden />
          <span>{isDone ? "Completed" : completing ? "Saving…" : nextLesson ? "Mark complete & next" : "Mark complete"}</span>
        </button>
        <button
          type="button"
          disabled={!nextLesson}
          onClick={() => nextLesson && navigate(`/learn/c/${slug}/l/${nextLesson.id}`)}
          className="ll-nav-side ll-nav-side--right"
          aria-label="Next lesson"
        >
          <span className="ll-nav-side-text ll-nav-side-text--right">
            <span className="ll-nav-side-eyebrow">Up next</span>
            <span className="ll-nav-side-title">{nextLesson?.title ?? "—"}</span>
          </span>
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>

      {/* Up next in this module */}
      {upNextInModule.length > 0 ? (
        <section className="ll-upnext" aria-label="Up next in this module">
          <h2 className="ll-section-title">Up next in {currentModule?.title ?? "this module"}</h2>
          <div className="ll-upnext-grid">
            {upNextInModule.map((l, i) => {
              const done = progressMap[l.id] === true;
              return (
                <Link key={l.id} to={`/learn/c/${slug}/l/${l.id}`} className={`ll-upnext-tile${done ? " is-done" : ""}`}>
                  <div className="ll-upnext-num">{currentIndex + 2 + i}</div>
                  <div className="ll-upnext-body">
                    <div className="ll-upnext-kind">
                      {kindIcon(l.kind)}
                      <span>{l.kind.toUpperCase()}</span>
                      {done ? <CheckCircle2 size={11} className="ll-upnext-done" aria-hidden /> : null}
                    </div>
                    <div className="ll-upnext-title">{l.title}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Lesson tabs — Notes / Resources / Q&A */}
      <section className="ll-tabs-section" aria-label="Lesson tabs">
        <div className="ll-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={lessonTab === "notes"}
            className={`ll-tab${lessonTab === "notes" ? " is-active" : ""}`}
            onClick={() => setLessonTab("notes")}
          >
            <Notebook size={14} aria-hidden /> Notes
            {notes.trim().length > 0 ? <span className="ll-tab-dot" aria-hidden /> : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={lessonTab === "resources"}
            className={`ll-tab${lessonTab === "resources" ? " is-active" : ""}`}
            onClick={() => setLessonTab("resources")}
          >
            <Link2 size={14} aria-hidden /> Resources
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={lessonTab === "discussion"}
            className={`ll-tab${lessonTab === "discussion" ? " is-active" : ""}`}
            onClick={() => setLessonTab("discussion")}
          >
            <MessageSquare size={14} aria-hidden /> Q&amp;A
          </button>
        </div>

        {lessonTab === "notes" ? (
          <div className="ll-tab-panel">
            <div className="ll-notes-head">
              <span className="ll-notes-eyebrow">Your private notes</span>
              <span className={`ll-notes-status${notesSaved ? " is-saved" : ""}`}>
                {notesSaved ? "✓ Saved" : "Saving…"}
              </span>
            </div>
            <textarea
              className="ll-notes-area"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Jot down what stuck from this lesson…\n\nWhat surprised you?\nWhat would you build next?\nQuestion to ask the mentor?`}
              rows={8}
            />
            <p className="ll-notes-foot">
              Private to you — synced to your ONROL account so they survive cache clears and roam across devices.
            </p>
          </div>
        ) : lessonTab === "resources" ? (
          <div className="ll-tab-panel">
            {resources.length === 0 ? (
              <div className="ll-resources-empty">
                <Link2 size={20} aria-hidden />
                <p className="ll-resources-title">No resources attached yet</p>
                <p className="ll-resources-sub">When the mentor uploads slides, PDFs, code samples or external links for this lesson, they land here.</p>
              </div>
            ) : (
              <ul className="ll-resources-list">
                {resources.map((r) => (
                  <li key={r.id}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ll-resource-row"
                    >
                      <span className={`ll-resource-kind ll-resource-kind--${r.kind}`}>
                        {r.kind === "file" ? <FileIcon size={13} aria-hidden /> :
                         r.kind === "video" ? <VideoIcon size={13} aria-hidden /> :
                         r.kind === "code" ? <ClipboardList size={13} aria-hidden /> :
                         r.kind === "doc" ? <FileIcon size={13} aria-hidden /> :
                         <Link2 size={13} aria-hidden />}
                        <span>{r.kind.toUpperCase()}</span>
                      </span>
                      <span className="ll-resource-label">{r.label}</span>
                      <span className="ll-resource-open" aria-hidden>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="ll-tab-panel">
            <LessonDiscussionThread lessonId={currentLesson.id} />
          </div>
        )}
      </section>

      {/* Mobile bottom action bar — fixed above the global bottomnav */}
      <div className="ll-mob-bar" role="navigation" aria-label="Lesson navigation">
        <button
          type="button"
          disabled={!prevLesson}
          onClick={() => prevLesson && navigate(`/learn/c/${slug}/l/${prevLesson.id}`)}
          className="ll-mob-bar-side"
          aria-label="Previous lesson"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={markComplete}
          disabled={completing || isDone}
          className={`ll-mob-bar-cta${isDone ? " is-done" : ""}`}
        >
          <CheckCircle2 size={15} aria-hidden />
          <span>{isDone ? "Completed" : completing ? "Saving…" : nextLesson ? "Complete & next" : "Mark complete"}</span>
        </button>
        <button
          type="button"
          disabled={!nextLesson}
          onClick={() => nextLesson && navigate(`/learn/c/${slug}/l/${nextLesson.id}`)}
          className="ll-mob-bar-side"
          aria-label="Next lesson"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>

      {/* Mobile bottom sheet — full course outline. Hidden on desktop
          (the rail is always in the sidebar there). Backdrop dismisses
          the sheet; tapping any lesson navigates and auto-closes. */}
      {outlineSheetOpen ? (
        <div
          className="ll-outline-sheet-wrap"
          role="dialog"
          aria-modal="true"
          aria-label="Course outline"
          onClick={(e) => { if (e.target === e.currentTarget) setOutlineSheetOpen(false); }}
        >
          <div className="ll-outline-sheet">
            <div className="ll-outline-sheet-handle" aria-hidden />
            <div className="ll-outline-sheet-head">
              <h3 className="ll-outline-sheet-title">Course outline</h3>
              <button
                type="button"
                className="ll-outline-sheet-close"
                onClick={() => setOutlineSheetOpen(false)}
                aria-label="Close"
              >
                <XIcon size={16} />
              </button>
            </div>
            <div className="ll-outline-sheet-body" onClick={() => setOutlineSheetOpen(false)}>
              <CourseSyllabusRail
                courseTitle={data.course.title}
                courseSlug={slug ?? ""}
                modules={data.modules ?? []}
                activeLessonId={currentLesson.id}
                progress={progressMap}
                enrolled={data.enrolled}
              />
            </div>
          </div>
        </div>
      ) : null}
    </LearnShell>
  );
}
