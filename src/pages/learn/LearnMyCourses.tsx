import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Loader2, BookOpen, Search, Clock, Calendar, PlayCircle, CheckCircle2, Sparkles,
} from "lucide-react";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { LearnShell } from "@/components/learn/LearnShell";
import {
  lmsListMyEnrollments,
  lmsGetProgressMap,
  type LmsEnrollment,
  type CourseProgressSummary,
} from "@/lib/lmsClient";
import "@/styles/learn-shell.css";
import "@/styles/learn-mycourses.css";

type Filter = "all" | "active" | "expired";

function relTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString();
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.ceil((t - Date.now()) / 86_400_000);
}

function totalMinutesFmt(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r > 0 ? `${h}h ${r}m` : `${h}h`;
}

export default function LearnMyCourses() {
  const { user, loading: authLoading } = useLmsAuth();
  const [enrollments, setEnrollments] = useState<LmsEnrollment[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, CourseProgressSummary>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const e = await lmsListMyEnrollments();
        if (cancelled) return;
        setEnrollments(e);
        if (e.length > 0) {
          lmsGetProgressMap(user.id, e.map((x) => x.course_id))
            .then((m) => { if (!cancelled) setProgressMap(m); })
            .catch(() => undefined);
        }
      } catch {
        if (!cancelled) setEnrollments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Hooks must run in the same order on every render. Compute these
  // before the auth-redirect early return below so hook order stays
  // stable when the user state flips from undefined → signed out.
  const counts = useMemo(() => ({
    all: enrollments.length,
    active: enrollments.filter((e) => e.status === "active").length,
    expired: enrollments.filter((e) => e.status !== "active").length,
  }), [enrollments]);

  const heroStats = useMemo(() => {
    const sums = Object.values(progressMap);
    const totalLessons = sums.reduce((n, p) => n + (p.totalLessons ?? 0), 0);
    const doneLessons = sums.reduce((n, p) => n + (p.completedLessons ?? 0), 0);
    const inProgress = sums.filter((p) => (p.percent ?? 0) > 0 && (p.percent ?? 0) < 100).length;
    return { totalLessons, doneLessons, inProgress };
  }, [progressMap]);

  if (!authLoading && !user) return <Navigate to="/learn/login" replace />;

  const visible = enrollments.filter((e) => {
    if (filter === "active" && e.status !== "active") return false;
    if (filter === "expired" && e.status === "active") return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!(e.course_title ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <LearnShell>
      {/* Hero strip — gradient panel with snapshot stats */}
      <section className="mc-hero">
        <div className="mc-hero-bg" aria-hidden>
          <span className="mc-hero-orb mc-hero-orb-1" />
          <span className="mc-hero-orb mc-hero-orb-2" />
        </div>
        <div className="mc-hero-inner">
          <div className="mc-hero-text">
            <span className="mc-hero-eyebrow">My Library</span>
            <h1 className="mc-hero-title">
              {counts.all === 0 ? "Your shelf is empty — for now" : `${counts.all} ${counts.all === 1 ? "course" : "courses"} on your shelf`}
            </h1>
            <p className="mc-hero-sub">
              {counts.all === 0
                ? "Once your admin activates a course, it lands here with progress tracking + lifetime access."
                : `${counts.active} active · ${heroStats.inProgress} in progress · ${heroStats.doneLessons}/${heroStats.totalLessons} lessons done. Pick up where you left off.`}
            </p>
          </div>
          {counts.all > 0 ? (
            <div className="mc-hero-snap" aria-label="At a glance">
              <div className="mc-snap-card">
                <span className="mc-snap-label">In progress</span>
                <span className="mc-snap-val">{heroStats.inProgress}</span>
              </div>
              <div className="mc-snap-card">
                <span className="mc-snap-label">Lessons done</span>
                <span className="mc-snap-val">{heroStats.doneLessons}</span>
              </div>
              <div className="mc-snap-card">
                <span className="mc-snap-label">Total lessons</span>
                <span className="mc-snap-val">{heroStats.totalLessons}</span>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Filter / search bar */}
      {enrollments.length > 0 ? (
        <div className="mc-toolbar">
          <div className="mc-segctl" role="tablist" aria-label="Filter">
            {(["all", "active", "expired"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                className={`mc-seg${filter === f ? " is-active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "All" : f === "active" ? "Active" : "Expired"}
                <span className="mc-seg-count">{counts[f]}</span>
              </button>
            ))}
          </div>
          <div className="mc-search">
            <Search size={14} className="mc-search-icon" aria-hidden />
            <input
              type="search"
              placeholder="Search your courses…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mc-search-input"
            />
          </div>
        </div>
      ) : null}

      {/* Body */}
      {loading ? (
        <div className="mc-grid mc-grid--skeleton" aria-busy>
          {[0, 1, 2].map((i) => <div key={i} className="mc-tile mc-tile--skeleton" />)}
        </div>
      ) : enrollments.length === 0 ? (
        <div className="mc-empty">
          <div className="mc-empty-illo" aria-hidden>
            <BookOpen size={36} />
          </div>
          <h3 className="mc-empty-title">No courses activated yet</h3>
          <p className="mc-empty-sub">Ask your admin to activate a course and it'll appear here — with progress tracking, Q&amp;A and a verified certificate at the finish line.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="mc-empty">
          <div className="mc-empty-illo" aria-hidden>
            <Search size={28} />
          </div>
          <h3 className="mc-empty-title">No matches</h3>
          <p className="mc-empty-sub">Clear the search or change the filter.</p>
        </div>
      ) : (
        <div className="mc-grid">
          {visible.map((e) => {
            const summary = progressMap[e.course_id];
            const pct = Math.max(0, Math.min(100, Math.round(summary?.percent ?? 0)));
            const isComplete = pct >= 100;
            const isFresh = pct === 0;
            const validity = daysUntil(e.expires_at);
            const isActive = e.status === "active";
            const hasThumb = Boolean(e.thumbnail_url);
            const initial = (e.course_title?.[0] ?? "C").toUpperCase();

            return (
              <Link
                key={e.id}
                to={`/learn/c/${e.course_slug ?? e.course_id}`}
                className={`mc-tile${isComplete ? " is-complete" : ""}${!isActive ? " is-inactive" : ""}`}
              >
                <div
                  className="mc-tile-thumb"
                  style={hasThumb ? { backgroundImage: `url(${e.thumbnail_url})` } : undefined}
                >
                  {!hasThumb ? <span className="mc-tile-thumb-initial">{initial}</span> : null}
                  <div className="mc-tile-thumb-overlay" aria-hidden />
                  <div className="mc-tile-badges">
                    {isComplete ? (
                      <span className="mc-badge mc-badge--complete">
                        <CheckCircle2 size={11} /> Completed
                      </span>
                    ) : !isActive ? (
                      <span className="mc-badge mc-badge--inactive">{e.status}</span>
                    ) : isFresh ? (
                      <span className="mc-badge mc-badge--new">
                        <Sparkles size={11} /> Just added
                      </span>
                    ) : null}
                    {validity != null && validity <= 14 && validity >= 0 && !isComplete ? (
                      <span className="mc-badge mc-badge--warn">
                        <Clock size={11} /> {validity}d left
                      </span>
                    ) : null}
                  </div>
                  <div className="mc-tile-play" aria-hidden>
                    <PlayCircle size={36} />
                  </div>
                </div>

                <div className="mc-tile-body">
                  <h3 className="mc-tile-title" title={e.course_title ?? "Untitled"}>
                    {e.course_title ?? "Untitled course"}
                  </h3>
                  <div className="mc-tile-meta">
                    {summary ? (
                      <span>
                        <BookOpen size={11} aria-hidden /> {summary.completedLessons}/{summary.totalLessons} lessons
                      </span>
                    ) : (
                      <span><BookOpen size={11} aria-hidden /> Course</span>
                    )}
                    {validity != null && validity > 14 ? (
                      <span>
                        <Calendar size={11} aria-hidden /> {validity}d remaining
                      </span>
                    ) : null}
                  </div>

                  <div className="mc-tile-progress" aria-label={`${pct}% complete`}>
                    <div className="mc-tile-progress-bar">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <span className="mc-tile-progress-text">{pct}%</span>
                  </div>

                  <div className="mc-tile-cta">
                    <span className="mc-tile-cta-eyebrow">
                      {isComplete ? "Course complete" : isFresh ? "Start now" : `Resume`}
                    </span>
                    <span className="mc-tile-cta-action">
                      {isComplete ? "Review again →" : isFresh ? "Open course →" : `Continue · ${pct}% →`}
                    </span>
                  </div>
                  <p className="mc-tile-foot">
                    Enrolled {relTime(e.enrolled_at)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </LearnShell>
  );
}
