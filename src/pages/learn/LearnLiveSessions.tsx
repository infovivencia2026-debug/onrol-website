import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2, CalendarClock, Users, Video, ExternalLink } from "lucide-react";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { LearnShell } from "@/components/learn/LearnShell";
import {
  lmsListMyCohorts,
  lmsListCohortLiveSessions,
  type LmsCohort,
  type LmsLiveSession,
} from "@/lib/lmsClient";
import "@/styles/learn-shell.css";

type Bucket = "upcoming" | "live" | "past";

type Enriched = LmsLiveSession & {
  cohort_name?: string;
  cohort_id_resolved: string;
};

function classify(s: LmsLiveSession): Bucket {
  if (s.status === "live") return "live";
  if (s.status === "ended" || s.status === "cancelled") return "past";
  if (s.scheduled_end && new Date(s.scheduled_end).getTime() < Date.now()) return "past";
  return "upcoming";
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const date = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

function countdownTo(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const m = Math.floor(ms / 60000);
  if (m < 60) return `in ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `in ${h}h`;
  const d = Math.floor(h / 24);
  return `in ${d}d`;
}

export default function LearnLiveSessions() {
  const { user, loading: authLoading } = useLmsAuth();
  const [sessions, setSessions] = useState<Enriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [bucket, setBucket] = useState<Bucket>("upcoming");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const cohorts = await lmsListMyCohorts().catch(() => [] as LmsCohort[]);
        const lists = await Promise.all(
          cohorts.map((c) =>
            lmsListCohortLiveSessions(c.id).then(
              (sessions) => sessions.map<Enriched>((s) => ({ ...s, cohort_name: c.name, cohort_id_resolved: c.id })),
            ).catch(() => [] as Enriched[]),
          ),
        );
        if (cancelled) return;
        const flat = lists.flat().sort((a, b) => {
          const ax = a.scheduled_start ? new Date(a.scheduled_start).getTime() : 0;
          const bx = b.scheduled_start ? new Date(b.scheduled_start).getTime() : 0;
          return ax - bx;
        });
        setSessions(flat);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!authLoading && !user) return <Navigate to="/learn/login" replace />;

  const counts = {
    upcoming: sessions.filter((s) => classify(s) === "upcoming").length,
    live: sessions.filter((s) => classify(s) === "live").length,
    past: sessions.filter((s) => classify(s) === "past").length,
  };

  const visible = sessions.filter((s) => classify(s) === bucket);

  return (
    <LearnShell>
      <section className="lh-hero" style={{ minHeight: 160 }}>
        <div className="lh-hero-bg" aria-hidden />
        <div className="lh-hero-inner">
          <div className="lh-hero-text">
            <span className="lh-hero-eyebrow">Live sessions</span>
            <h1 className="lh-hero-title" style={{ fontSize: 24 }}>
              {counts.live > 0 ? `${counts.live} happening now` : counts.upcoming > 0 ? `${counts.upcoming} upcoming` : "No scheduled sessions"}
            </h1>
            <p className="lh-hero-sub">
              {counts.live > 0
                ? "Jump in — a session is live right now."
                : counts.upcoming > 0
                ? "Add them to your calendar so you don't miss a thing."
                : "When your mentor schedules a session, it'll show up here."}
            </p>
          </div>
          <div className="lh-hero-side">
            <div className="lh-hero-avatar" aria-hidden style={{ width: 72, height: 72, fontSize: 28, background: "rgba(255, 255, 255, 0.18)" }}>
              <CalendarClock size={32} />
            </div>
          </div>
        </div>
      </section>

      <div className="filter-bar" style={{ margin: "0 0 10px" }}>
        <select
          aria-label="Filter sessions"
          className="filter-dropdown"
          value={bucket}
          onChange={(e) => setBucket(e.target.value as Bucket)}
          style={{ width: 180 }}
        >
          <option value="upcoming">Upcoming ({counts.upcoming})</option>
          <option value="live">Live now ({counts.live})</option>
          <option value="past">Past ({counts.past})</option>
        </select>
        <Link to="/learn/me/bookings" className="filter-dropdown" style={{ display: "inline-flex", alignItems: "center", gap: 6, width: "auto", textDecoration: "none" }}>
          <Users size={13} /> 1:1 mentor bookings
        </Link>
      </div>

      {loading ? (
        <div className="learn-empty">
          <Loader2 className="h-5 w-5 animate-spin" style={{ display: "inline" }} />
          <h3>Loading sessions…</h3>
        </div>
      ) : visible.length === 0 ? (
        <div className="learn-empty">
          <CalendarClock className="h-6 w-6" style={{ display: "inline", color: "var(--learn-muted)" }} />
          <h3>{bucket === "upcoming" ? "No upcoming sessions" : bucket === "live" ? "No sessions live right now" : "No past sessions"}</h3>
          <p>
            {bucket === "upcoming"
              ? "Your mentor will schedule sessions — they'll show up here."
              : bucket === "past"
              ? "Recordings, if any, will appear on each session."
              : "Sessions appear here the moment they go live. Refresh to check."}
          </p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {visible.map((s) => {
            const isLive = classify(s) === "live";
            const countdown = isLive ? null : countdownTo(s.scheduled_start);
            return (
              <li key={s.id} className="learn-post" style={{ marginBottom: 0 }}>
                <div className="learn-post-head">
                  <span className="learn-post-avatar" style={{ background: isLive ? "linear-gradient(135deg, #16a34a, #065f46)" : undefined }}>
                    {isLive ? <Video size={16} /> : <CalendarClock size={16} />}
                  </span>
                  <div className="learn-post-meta">
                    <span className="learn-post-author">{s.title}</span>
                    <span className="learn-post-when">
                      {s.cohort_name ? `${s.cohort_name} · ` : ""}{formatDateTime(s.scheduled_start)}
                    </span>
                  </div>
                  {isLive ? (
                    <span className="learn-post-pin" style={{ background: "rgba(22, 163, 74, 0.15)", color: "#15803d" }}>● Live</span>
                  ) : countdown ? (
                    <span className="learn-post-pin">{countdown}</span>
                  ) : null}
                </div>
                {s.meeting_code ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, padding: "8px 10px", background: "var(--learn-bg)", borderRadius: 10 }}>
                    <code style={{ fontSize: 12, color: "var(--learn-ink-2)" }}>Meeting code: {s.meeting_code}</code>
                    {isLive || classify(s) === "upcoming" ? (
                      <a
                        href={`https://meet.jit.si/${s.meeting_code}`}
                        target="_blank"
                        rel="noreferrer"
                        className="filter-dropdown"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, width: "auto", textDecoration: "none", color: isLive ? "#15803d" : "var(--learn-accent-2)", fontWeight: 600 }}
                      >
                        {isLive ? "Join now" : "Open"} <ExternalLink size={12} />
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </LearnShell>
  );
}
