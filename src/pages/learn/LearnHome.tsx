import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Loader2, BookOpen, Bell, Brain, Workflow, Bot, RefreshCw, Calendar,
  ChevronRight, ClipboardCheck, Award, Settings, ArrowRight, Clock,
} from "lucide-react";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { LearnShell } from "@/components/learn/LearnShell";
import {
  lmsListMyEnrollments,
  lmsListMyCohorts,
  lmsListAnnouncements,
  lmsListCohortLiveSessions,
  type LmsEnrollment,
  type LmsCohort,
  type LmsAnnouncement,
  type LmsLiveSession,
} from "@/lib/lmsClient";
import "@/styles/learn-shell.css";

/* ---------- helpers --------------------------------------------------- */

function todayWindow(): { start: Date; end: Date } {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0);
  return { start, end };
}

function formatTimeRange(startIso: string | null, endIso: string | null): string {
  if (!startIso) return "Time TBD";
  const fmt = (d: Date) =>
    d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const start = new Date(startIso);
  if (!endIso) return fmt(start);
  return `${fmt(start)} - ${fmt(new Date(endIso))}`;
}

/* ---------- page ----------------------------------------------------- */

export default function LearnHome() {
  const { user, loading: authLoading } = useLmsAuth();
  const [enrollments, setEnrollments] = useState<LmsEnrollment[]>([]);
  const [, setCohorts] = useState<LmsCohort[]>([]);
  const [announcements, setAnnouncements] = useState<LmsAnnouncement[]>([]);
  const [liveSessions, setLiveSessions] = useState<Array<LmsLiveSession & { cohort_name?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const [e, co, an] = await Promise.all([
          lmsListMyEnrollments().catch(() => []),
          lmsListMyCohorts().catch(() => []),
          lmsListAnnouncements().catch(() => []),
        ]);
        if (cancelled) return;
        setEnrollments(e);
        setCohorts(co);
        setAnnouncements(an);
        if (co.length > 0) {
          const lists = await Promise.all(co.map((c) =>
            lmsListCohortLiveSessions(c.id).then((s) => s.map((x) => ({ ...x, cohort_name: c.name }))).catch(() => []),
          ));
          if (!cancelled) {
            const { start, end } = todayWindow();
            const todayOnly = lists.flat()
              .filter((s) => s.status !== "ended" && s.status !== "cancelled")
              .filter((s) => {
                if (!s.scheduled_start) return s.status === "live";
                const t = new Date(s.scheduled_start);
                return t >= start && t < end;
              })
              .sort((a, b) => {
                const ax = a.scheduled_start ? new Date(a.scheduled_start).getTime() : Infinity;
                const bx = b.scheduled_start ? new Date(b.scheduled_start).getTime() : Infinity;
                return ax - bx;
              });
            setLiveSessions(todayOnly.slice(0, 4));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!authLoading && !user) return <Navigate to="/learn/login" replace />;

  const firstName = ((user?.full_name ?? user?.email ?? "").split(/[@. ]/)[0] || "there");
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  // Profile-completion proxy: 5 fields we know we want filled
  // (name, email, phone, avatar, bio). Each missing field = -20%.
  const profilePct = (() => {
    const u = user as { full_name?: string; email?: string; phone?: string; avatar_url?: string; bio?: string } | null;
    if (!u) return 0;
    const have = [u.full_name, u.email, u.phone, u.avatar_url, u.bio].filter(Boolean).length;
    return Math.round((have / 5) * 100);
  })();

  // Featured course = the enrollment with the highest priority (first one we got).
  const featured = enrollments[0] ?? null;
  const otherCourses = enrollments.slice(1, 4);

  return (
    <LearnShell
      rightRail={
        <HomeRightRail
          displayName={displayName}
          profilePct={profilePct}
          liveSessions={liveSessions}
          announcements={announcements}
        />
      }
    >
      {loading ? (
        <div className="learn-empty" style={{ marginTop: 14 }}>
          <Loader2 className="h-5 w-5 animate-spin" style={{ display: "inline" }} />
          <h3>Loading your space…</h3>
        </div>
      ) : (
        <>
          {/* Welcome hero — soft cream background with 3D blocks art (Ref #3) */}
          <section className="lh-feat" aria-label="Welcome">
            <div className="lh-feat-text">
              <p className="lh-feat-eyebrow">Welcome back,</p>
              <strong className="lh-feat-title">
                {displayName}!{" "}
                <span style={{ display: "inline-block", fontSize: "0.9em", verticalAlign: "0.05em" }} aria-hidden>👋</span>
              </strong>
              <p className="lh-feat-sub">Keep learning. Keep growing with ONROL.</p>
            </div>
            <div className="lh-feat-art" aria-hidden>
              <OrangeBlocks3D />
            </div>
          </section>

          {/* My Courses header */}
          <div className="lh-section-head">
            <h2 className="lh-section-title">My Courses</h2>
            <Link to="/learn/me/courses" className="lh-link-orange">
              View all courses <ChevronRight size={14} />
            </Link>
          </div>

          <section className="lh-tiles" aria-label="Programs">
            {enrollments.length === 0 ? (
              <article className="lh-tile" style={{ gridColumn: "1 / -1" }}>
                <div className="lh-tile-body" style={{ padding: "32px 24px", textAlign: "center" }}>
                  <h3 className="lh-tile-title">No active courses yet</h3>
                  <p className="lh-tile-meta" style={{ justifyContent: "center" }}>Browse the catalog to find your next program.</p>
                  <div className="lh-tile-cta" style={{ justifyContent: "center" }}>
                    <Link to="/learn/catalog" className="lh-tile-cta-primary">Browse catalog</Link>
                  </div>
                </div>
              </article>
            ) : (
              tilesFromEnrollments([featured!, ...otherCourses].filter(Boolean) as LmsEnrollment[]).map((t, idx) => (
                <CourseTile key={t.key} tone={TILE_TONES[idx % TILE_TONES.length]} tile={t} />
              ))
            )}
          </section>

          {/* Quick action 4-card strip */}
          <section className="lh-quick" aria-label="Quick actions">
            <Link to="/learn/me/calendar" className="lh-quick-card">
              <span className="lh-quick-card-icon" aria-hidden><Calendar size={20} /></span>
              <div className="lh-quick-card-text">
                <p className="lh-quick-card-title">Calendar</p>
                <p className="lh-quick-card-desc">View upcoming classes and events</p>
              </div>
              <ArrowRight size={14} className="lh-quick-card-chev" aria-hidden />
            </Link>
            <Link to="/learn/me/exams" className="lh-quick-card">
              <span className="lh-quick-card-icon" aria-hidden><ClipboardCheck size={20} /></span>
              <div className="lh-quick-card-text">
                <p className="lh-quick-card-title">Exams</p>
                <p className="lh-quick-card-desc">Check your upcoming exams and results</p>
              </div>
              <ArrowRight size={14} className="lh-quick-card-chev" aria-hidden />
            </Link>
            <Link to="/learn/me/certificates" className="lh-quick-card">
              <span className="lh-quick-card-icon" aria-hidden><Award size={20} /></span>
              <div className="lh-quick-card-text">
                <p className="lh-quick-card-title">Certificates</p>
                <p className="lh-quick-card-desc">Download your earned certificates</p>
              </div>
              <ArrowRight size={14} className="lh-quick-card-chev" aria-hidden />
            </Link>
            <Link to="/learn/me/profile" className="lh-quick-card">
              <span className="lh-quick-card-icon" aria-hidden><Settings size={20} /></span>
              <div className="lh-quick-card-text">
                <p className="lh-quick-card-title">Settings</p>
                <p className="lh-quick-card-desc">Manage your profile and preferences</p>
              </div>
              <ArrowRight size={14} className="lh-quick-card-chev" aria-hidden />
            </Link>
          </section>
        </>
      )}
    </LearnShell>
  );
}

/* ---------- featured hero ------------------------------------------- */

function FeaturedHero({ title, summary, href }: { title: string; summary: string; href: string }) {
  return (
    <Link to={href} className="lh-feat" aria-label={`Open ${title}`}>
      <div className="lh-feat-art" aria-hidden>
        <Brain strokeWidth={1.5} />
      </div>
      <div className="lh-feat-text">
        <h2 className="lh-feat-title">{title}</h2>
        <p className="lh-feat-sub">{summary}</p>
      </div>
    </Link>
  );
}

/* ---------- course tiles -------------------------------------------- */

type TileTone = "orange" | "purple" | "teal";
const TILE_TONES: TileTone[] = ["orange", "purple", "teal"];

interface Tile {
  key: string;
  title: string;
  desc: string;
  icon: "brain" | "workflow" | "bot";
  lessons: number;
  href: string;
  /** Optional cover image from the course record. When set, the tile renders
   *  the image instead of the generic SVG icon — same look as MyCourses. */
  thumbnail?: string | null;
}

const PLACEHOLDER_TILES: Tile[] = [
  { key: "ai-foundation", title: "AI Foundation", desc: "Learn AI basics, LLMs, prompt engineering, diffusion models and AI tools for content creation.", icon: "brain", lessons: 5, href: "/learn/me/courses" },
  { key: "automation",    title: "Automation",    desc: "Learn automation concepts, workflows, tools like n8n, Zapier, Make and real-world automations.", icon: "workflow", lessons: 4, href: "/learn/me/courses" },
  { key: "ai-agent",      title: "AI Agent",      desc: "Build single & multi-agent systems, RAG workflows and align with modern AI frameworks.", icon: "bot", lessons: 4, href: "/learn/me/courses" },
];

function tilesFromEnrollments(rows: LmsEnrollment[]): Tile[] {
  const icons: Tile["icon"][] = ["brain", "workflow", "bot"];
  return rows.slice(0, 3).map((e, idx) => ({
    key: e.id,
    title: e.course_title ?? "Course",
    desc: "Resume this program — your live cohort, lessons and assignments.",
    icon: icons[idx % icons.length],
    lessons: 0,
    href: `/learn/c/${e.course_slug ?? e.course_id}`,
    // Pull cover image from enrolment. The actual field on LmsEnrollment is
    // `thumbnail_url` — earlier guesses (course_thumbnail / course_image_url)
    // never resolved which is why the home tile fell back to the SVG icon
    // while MyCourses (which uses the right field name) rendered the cover.
    thumbnail: e.thumbnail_url
      ?? (e as LmsEnrollment & { thumbnail?: string | null }).thumbnail
      ?? (e as LmsEnrollment & { course_thumbnail?: string | null }).course_thumbnail
      ?? (e as LmsEnrollment & { course_image_url?: string | null }).course_image_url
      ?? null,
  }));
}

function CourseTile({ tile, tone }: { tile: Tile; tone: TileTone }) {
  void tone;
  // Pick a course-specific illustration via the icon label OR a hash of title.
  // Five distinct hand-drawn SVGs so tiles never repeat (Ref #1 had 6, we
  // cycle five and that's plenty for the typical learner).
  const variant: CourseVariant =
    /python/i.test(tile.title) ? "python"
    : /react|web/i.test(tile.title) ? "react"
    : /sql|data/i.test(tile.title) ? "sql"
    : /power\s*bi|analytics|chart/i.test(tile.title) ? "powerbi"
    : /automat|workflow|n8n/i.test(tile.title) ? "automation"
    : /agent|bot|rag/i.test(tile.title) ? "agent"
    : /foundation|essentials|generalist|ai/i.test(tile.title)
      ? (["ai", "spark", "neural"] as const)[tile.title.length % 3]
      : "ai";
  return (
    <article className={`lh-tile lh-tile--${variant}`}>
      <div className="lh-tile-art" aria-hidden>
        {tile.thumbnail ? (
          <img
            src={tile.thumbnail}
            alt=""
            className="lh-tile-cover"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <CourseArt variant={variant} />
        )}
        <span className="lh-tile-badge">In Progress</span>
        <span className="lh-tile-watermark" aria-hidden>ONROL</span>
      </div>
      <div className="lh-tile-body">
        <h3 className="lh-tile-title">{tile.title}</h3>
        <p className="lh-tile-meta">
          <BookOpen size={11} /> {tile.lessons} {tile.lessons === 1 ? "Lesson" : "Lessons"}
          {tile.desc ? <> &nbsp;·&nbsp; <Clock size={11} /> Self-paced</> : null}
        </p>
        <div className="lh-tile-progress">
          <div className="lh-tile-progress-fill" style={{ width: `${Math.min(100, tile.lessons > 0 ? 40 : 0)}%` }} />
        </div>
        <div className="lh-tile-progress-row">
          <span>Continue your journey</span>
          <strong>{tile.lessons > 0 ? "40%" : "0%"}</strong>
        </div>
        <div className="lh-tile-cta">
          <Link to={tile.href} className="lh-tile-cta-primary">Continue</Link>
          <Link to={tile.href} className="lh-tile-cta-chev" aria-label={`Open ${tile.title}`}>
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ---------- Course art per variant ---------------------------------- */
type CourseVariant = "ai" | "spark" | "neural" | "python" | "react" | "sql" | "powerbi" | "automation" | "agent";

function CourseArt({ variant }: { variant: CourseVariant }) {
  const c = {
    accent: "#f2742a",
    bright: "#fbbf24",
    deep:   "#c2410c",
    pale:   "rgba(242,116,42,0.18)",
  };
  switch (variant) {
    case "ai":
      return (
        <svg viewBox="0 0 100 100" fill="none" className="lh-art">
          <defs>
            <linearGradient id="ai-chip" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={c.accent} /><stop offset="100%" stopColor={c.deep} />
            </linearGradient>
          </defs>
          <rect x="28" y="28" width="44" height="44" rx="10" fill="url(#ai-chip)" />
          <text x="50" y="58" textAnchor="middle" fontWeight="900" fontSize="20" fill="#fff">AI</text>
          {[
            [50, 22], [50, 78], [22, 50], [78, 50],
            [30, 30], [70, 30], [30, 70], [70, 70],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="3" fill={c.bright} />
          ))}
          <g stroke={c.pale} strokeWidth="1.2">
            <line x1="50" y1="28" x2="50" y2="22" />
            <line x1="50" y1="72" x2="50" y2="78" />
            <line x1="28" y1="50" x2="22" y2="50" />
            <line x1="72" y1="50" x2="78" y2="50" />
          </g>
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 100 100" fill="none" className="lh-art">
          <path d="M50 14 L56 42 L84 50 L56 58 L50 86 L44 58 L16 50 L44 42 Z" fill={c.accent} />
          <path d="M50 28 L54 44 L70 50 L54 56 L50 72 L46 56 L30 50 L46 44 Z" fill={c.bright} />
          <circle cx="50" cy="50" r="4" fill="#fff" />
        </svg>
      );
    case "neural":
      return (
        <svg viewBox="0 0 100 100" fill="none" className="lh-art">
          {[[20, 30], [20, 50], [20, 70], [50, 25], [50, 50], [50, 75], [80, 40], [80, 60]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="5" fill={i % 3 === 0 ? c.bright : c.accent} />
          ))}
          <g stroke={c.pale} strokeWidth="1.5">
            {[
              [20, 30, 50, 25], [20, 30, 50, 50], [20, 50, 50, 25], [20, 50, 50, 50], [20, 50, 50, 75],
              [20, 70, 50, 50], [20, 70, 50, 75],
              [50, 25, 80, 40], [50, 50, 80, 40], [50, 50, 80, 60], [50, 75, 80, 60],
            ].map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />)}
          </g>
        </svg>
      );
    case "python":
      return (
        <svg viewBox="0 0 100 100" fill="none" className="lh-art">
          <path d="M50 12c-13 0-17 5-17 13v10h18v3H26c-7 0-13 4-13 16s6 16 13 16h6V60c0-7 6-13 13-13h14c7 0 13-6 13-13V25c0-7-6-13-13-13zm-11 7a4 4 0 110 8 4 4 0 010-8z" fill="#3776ab" />
          <path d="M50 88c13 0 17-5 17-13V65H49v-3h25c7 0 13-4 13-16s-6-16-13-16h-6v10c0 7-6 13-13 13H41c-7 0-13 6-13 13v12c0 7 6 13 13 13zm11-7a4 4 0 110-8 4 4 0 010 8z" fill="#ffd43b" />
        </svg>
      );
    case "react":
      return (
        <svg viewBox="0 0 100 100" fill="none" className="lh-art">
          <circle cx="50" cy="50" r="6" fill="#61dafb" />
          <ellipse cx="50" cy="50" rx="32" ry="12" stroke="#61dafb" strokeWidth="2.5" fill="none" />
          <ellipse cx="50" cy="50" rx="32" ry="12" stroke="#61dafb" strokeWidth="2.5" fill="none" transform="rotate(60 50 50)" />
          <ellipse cx="50" cy="50" rx="32" ry="12" stroke="#61dafb" strokeWidth="2.5" fill="none" transform="rotate(120 50 50)" />
        </svg>
      );
    case "sql":
      return (
        <svg viewBox="0 0 100 100" fill="none" className="lh-art">
          <defs>
            <linearGradient id="sql-db" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>
          {[28, 48, 68].map((y, i) => (
            <g key={i}>
              <ellipse cx="50" cy={y} rx="28" ry="8" fill="url(#sql-db)" />
              <rect x="22" y={y} width="56" height="10" fill="url(#sql-db)" />
              <ellipse cx="50" cy={y + 10} rx="28" ry="8" fill="#0d1b3a" />
            </g>
          ))}
        </svg>
      );
    case "powerbi":
      return (
        <svg viewBox="0 0 100 100" fill="none" className="lh-art">
          <rect x="20" y="58" width="14" height="28" rx="3" fill="#f2c811" />
          <rect x="40" y="42" width="14" height="44" rx="3" fill="#f2c811" />
          <rect x="60" y="22" width="14" height="64" rx="3" fill="#f2c811" />
          <circle cx="78" cy="22" r="5" fill={c.accent} />
        </svg>
      );
    case "automation":
      return (
        <svg viewBox="0 0 100 100" fill="none" className="lh-art">
          {[[25, 30], [75, 30], [50, 60], [25, 80], [75, 80]].map(([x, y], i) => (
            <rect key={i} x={x - 10} y={y - 8} width="20" height="16" rx="3" fill={c.accent} />
          ))}
          <g stroke={c.pale} strokeWidth="1.8" fill="none">
            <path d="M25 38 Q25 50 50 52" />
            <path d="M75 38 Q75 50 50 52" />
            <path d="M50 68 Q40 75 25 72" />
            <path d="M50 68 Q60 75 75 72" />
          </g>
        </svg>
      );
    case "agent":
      return (
        <svg viewBox="0 0 100 100" fill="none" className="lh-art">
          <defs>
            <linearGradient id="agent-head" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.accent} /><stop offset="100%" stopColor={c.deep} />
            </linearGradient>
          </defs>
          <rect x="30" y="32" width="40" height="34" rx="9" fill="url(#agent-head)" />
          <circle cx="42" cy="48" r="4" fill="#fff" />
          <circle cx="58" cy="48" r="4" fill="#fff" />
          <rect x="44" y="58" width="12" height="3" rx="1.5" fill="#fff" />
          <rect x="48" y="20" width="4" height="12" rx="2" fill={c.bright} />
          <circle cx="50" cy="18" r="3" fill={c.bright} />
          <rect x="26" y="48" width="6" height="14" rx="3" fill={c.deep} />
          <rect x="68" y="48" width="6" height="14" rx="3" fill={c.deep} />
        </svg>
      );
  }
}

/* ---------- 3D Orange Blocks illustration (welcome hero art) -------- */

function OrangeBlocks3D() {
  return (
    <svg viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Orange cubes illustration">
      <defs>
        <linearGradient id="oc-front" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f2742a" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>
        <linearGradient id="oc-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id="oc-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
        <radialGradient id="oc-shadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(242,116,42,0.18)" />
          <stop offset="100%" stopColor="rgba(242,116,42,0)" />
        </radialGradient>
      </defs>

      {/* Orbital ring */}
      <ellipse cx="180" cy="130" rx="160" ry="46" fill="none" stroke="#fed7aa" strokeWidth="1.2" opacity="0.7" />
      <ellipse cx="180" cy="130" rx="160" ry="46" fill="url(#oc-shadow)" />

      {/* Cluster of isometric cubes — 5 cubes, stacked + offset */}
      <g transform="translate(120,55)">
        {/* Cube 1 — large center */}
        <g transform="translate(40,30)">
          <polygon points="0,30 30,15 60,30 30,45" fill="url(#oc-top)" />
          <polygon points="0,30 0,60 30,75 30,45" fill="url(#oc-front)" />
          <polygon points="30,45 30,75 60,60 60,30" fill="url(#oc-side)" />
        </g>
        {/* Cube 2 — top right */}
        <g transform="translate(85,5)">
          <polygon points="0,30 30,15 60,30 30,45" fill="url(#oc-top)" />
          <polygon points="0,30 0,60 30,75 30,45" fill="url(#oc-front)" />
          <polygon points="30,45 30,75 60,60 60,30" fill="url(#oc-side)" />
        </g>
        {/* Cube 3 — bottom left */}
        <g transform="translate(0,75)">
          <polygon points="0,30 30,15 60,30 30,45" fill="url(#oc-top)" />
          <polygon points="0,30 0,60 30,75 30,45" fill="url(#oc-front)" />
          <polygon points="30,45 30,75 60,60 60,30" fill="url(#oc-side)" />
        </g>
        {/* Cube 4 — bottom right */}
        <g transform="translate(85,75)">
          <polygon points="0,30 30,15 60,30 30,45" fill="url(#oc-top)" />
          <polygon points="0,30 0,60 30,75 30,45" fill="url(#oc-front)" />
          <polygon points="30,45 30,75 60,60 60,30" fill="url(#oc-side)" />
        </g>
        {/* Cube 5 — small floating */}
        <g transform="translate(130,40) scale(0.5)">
          <polygon points="0,30 30,15 60,30 30,45" fill="url(#oc-top)" />
          <polygon points="0,30 0,60 30,75 30,45" fill="url(#oc-front)" />
          <polygon points="30,45 30,75 60,60 60,30" fill="url(#oc-side)" />
        </g>
      </g>

      {/* Floating dots */}
      <circle cx="55"  cy="70"  r="3" fill="#f2742a" />
      <circle cx="320" cy="180" r="4" fill="#fbbf24" />
      <circle cx="40"  cy="180" r="2.5" fill="#c2410c" />
      <circle cx="305" cy="60"  r="3"   fill="#fb923c" />
    </svg>
  );
}

/* ---------- right rail ---------------------------------------------- */

function HomeRightRail({
  displayName,
  profilePct,
  liveSessions,
  announcements,
}: {
  displayName: string;
  profilePct: number;
  liveSessions: Array<LmsLiveSession & { cohort_name?: string }>;
  announcements: LmsAnnouncement[];
}) {
  return (
    <>
      <GreetCard name={displayName} percent={profilePct} />
      <TodaysClassesCard sessions={liveSessions} />
      <GlanceCard hasAny={announcements.length > 0} />
    </>
  );
}

function GreetCard({ name, percent }: { name: string; percent: number }) {
  const pct = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className="lh-rail-greet">
      <div className="lh-rail-greet-head">
        <div className="lh-rail-greet-text">
          <h3>Hey, {name}!</h3>
          <p>Get a Personalised<br />Experience</p>
        </div>
        <div className="lh-rail-greet-ring" style={{ ["--pct" as unknown as string]: pct } as React.CSSProperties}>
          <span>{pct}%</span>
        </div>
      </div>
      <Link to="/learn/me/profile" className="lh-rail-greet-cta">
        <span>Complete your profile</span>
        <span aria-hidden>›</span>
      </Link>
    </div>
  );
}

function TodaysClassesCard({ sessions }: { sessions: Array<LmsLiveSession & { cohort_name?: string }> }) {
  return (
    <div className="lh-rail-classes">
      <div className="lh-rail-classes-head">
        <h3>Today&rsquo;s Classes</h3>
        <div className="lh-rail-classes-actions">
          <button type="button" aria-label="Refresh"><RefreshCw size={14} /></button>
          <Link to="/learn/me/sessions" aria-label="Open calendar"><Calendar size={14} /></Link>
        </div>
      </div>
      {sessions.length === 0 ? (
        <p className="lh-rail-empty">No classes scheduled for today.</p>
      ) : (
        sessions.map((s) => {
          const isLive = s.status === "live";
          return (
            <div key={s.id} className="lh-rail-class">
              <div className="lh-rail-class-time">
                <span>{formatTimeRange(s.scheduled_start, s.scheduled_end ?? null)}</span>
                {isLive && <span className="lh-rail-class-live">Live</span>}
              </div>
              {s.cohort_name && <div className="lh-rail-class-code">{s.cohort_name}</div>}
              <div className="lh-rail-class-title">{s.title || "Live session"}</div>
              {s.meeting_code && (
                <a
                  className="lh-rail-class-join"
                  href={`https://meet.jit.si/${s.meeting_code}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Join Now ›
                </a>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

function GlanceCard({ hasAny }: { hasAny: boolean }) {
  return (
    <div className="lh-rail-glance">
      <h3>At a Glance</h3>
      <div className="lh-rail-glance-body">
        <div className="lh-rail-glance-icon"><Bell /></div>
        <p className="lh-rail-glance-line">{hasAny ? "You have new updates" : "You are all caught up"}</p>
        <p className="lh-rail-glance-sub">{hasAny ? "Check announcements for details." : "Check back later for the latest updates!"}</p>
      </div>
    </div>
  );
}

export type { LmsAnnouncement };
