import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { LearnShell } from "@/components/learn/LearnShell";
import { lmsGetMyCalendar, type LmsCalendarEvent } from "@/lib/lmsClient";
import "@/styles/learn-shell.css";

/* ---------- helpers ---------------------------------------------------- */

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59); }
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type View = "day" | "week" | "month" | "list";

/* ---------- page ------------------------------------------------------- */

export default function LearnCalendar() {
  const { user, loading: authLoading } = useLmsAuth();
  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState<View>("month");
  const [events, setEvents] = useState<LmsCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const monthStart = startOfMonth(anchor);
  const monthEnd   = endOfMonth(anchor);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        // Pull a window that covers the visible grid (prev/next month days are
        // shown faded, but events on those dates should still appear).
        const padStart = new Date(monthStart);
        padStart.setDate(padStart.getDate() - 14);
        const padEnd = new Date(monthEnd);
        padEnd.setDate(padEnd.getDate() + 14);
        const r = await lmsGetMyCalendar({ fromIso: padStart.toISOString(), toIso: padEnd.toISOString() });
        if (!cancelled) setEvents(r);
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, monthStart.getTime(), monthEnd.getTime()]);

  if (!authLoading && !user) return <Navigate to="/learn/login" replace />;

  /* ---------- grid construction (6 rows × 7 cols, fills prev/next) ----- */
  const firstWeekday = monthStart.getDay();           // 0 = Sun
  const cells: Date[] = [];
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - firstWeekday);
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    cells.push(d);
  }

  const eventsByDay = useMemo(() => {
    const m = new Map<string, LmsCalendarEvent[]>();
    for (const e of events) {
      const d = new Date(e.startsAt);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = m.get(k) ?? [];
      arr.push(e);
      m.set(k, arr);
    }
    return m;
  }, [events]);

  // Prev/Next step depends on the active view — month, week or day.
  const goPrev = () => {
    if (view === "day")  return setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - 1));
    if (view === "week") return setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() - 7));
    return setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1));
  };
  const goNext = () => {
    if (view === "day")  return setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 1));
    if (view === "week") return setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 7));
    return setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1));
  };
  const goToday = () => setAnchor(new Date());

  // Header label changes per view: "May 2026" | "May 26 – Jun 1" | "Wed, May 28"
  const headerLabel = (() => {
    if (view === "day")  return anchor.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    if (view === "week") {
      const w0 = new Date(anchor); w0.setDate(anchor.getDate() - anchor.getDay());
      const w6 = new Date(w0); w6.setDate(w0.getDate() + 6);
      const sameMonth = w0.getMonth() === w6.getMonth();
      const left  = w0.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const right = w6.toLocaleDateString(undefined, sameMonth ? { day: "numeric", year: "numeric" } : { month: "short", day: "numeric", year: "numeric" });
      return `${left} – ${right}`;
    }
    return `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
  })();

  return (
    <LearnShell>
      {/* Orange gradient hero (Ref #6) */}
      <section className="learn-page-hero">
        <div className="learn-page-hero-text">
          <p className="learn-page-hero-eyebrow">Calendar</p>
          <h1 className="learn-page-hero-title">Your schedule at a glance</h1>
          <p className="learn-page-hero-sub">View your upcoming classes, exams and important events.</p>
        </div>
        <div className="learn-page-hero-icon" aria-hidden>
          <CalendarIcon size={32} />
        </div>
      </section>

      {/* Toolbar — Back / period label / Forward + Today/List + Day/Week/Month */}
      <div className="learn-cal-toolbar">
        <div className="learn-cal-nav">
          <button type="button" className="learn-cal-iconbtn" onClick={goPrev} aria-label="Previous">
            <ChevronLeft size={16} />
          </button>
          <span className="learn-cal-month">{headerLabel}</span>
          <button type="button" className="learn-cal-iconbtn" onClick={goNext} aria-label="Next">
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ display: "inline-flex", gap: 10 }}>
          <div className="learn-cal-toggle-group learn-cal-toggle-outlined">
            <button type="button" className={isSameDay(anchor, today) ? "is-active" : ""} onClick={goToday}>Today</button>
            <button type="button" className={view === "list" ? "is-active" : ""} onClick={() => setView("list")}>List</button>
          </div>
          <div className="learn-cal-toggle-group">
            <button type="button" className={view === "day"   ? "is-active" : ""} onClick={() => setView("day")}>Day</button>
            <button type="button" className={view === "week"  ? "is-active" : ""} onClick={() => setView("week")}>Week</button>
            <button type="button" className={view === "month" ? "is-active" : ""} onClick={() => setView("month")}>Month</button>
          </div>
        </div>
      </div>

      {/* ── Month view ──────────────────────────────────────────────── */}
      {view === "month" ? (
        <div className="learn-cal-grid">
          <div className="learn-cal-row learn-cal-row-head">
            {DAY_NAMES.map((d) => <div key={d} className="learn-cal-day-head">{d}</div>)}
          </div>
          {Array.from({ length: 6 }).map((_, week) => (
            <div key={week} className="learn-cal-row">
              {Array.from({ length: 7 }).map((_, dow) => {
                const cell = cells[week * 7 + dow];
                const otherMonth = cell.getMonth() !== anchor.getMonth();
                const isToday = isSameDay(cell, today);
                const key = `${cell.getFullYear()}-${cell.getMonth()}-${cell.getDate()}`;
                const dayEvents = eventsByDay.get(key) ?? [];
                return (
                  <div
                    key={`${week}-${dow}`}
                    className={`learn-cal-cell ${otherMonth ? "is-other-month" : ""} ${isToday ? "is-today" : ""}`}
                    onClick={() => { setAnchor(new Date(cell)); setView("day"); }}
                    style={{ cursor: "pointer" }}
                    role="button"
                    tabIndex={0}
                  >
                    <span>{cell.getDate()}</span>
                    {dayEvents.length > 0 ? (
                      <ul className="learn-cal-cell-events">
                        {dayEvents.slice(0, 2).map((e) => (
                          <li key={e.id} title={e.title} className={`learn-cal-cell-event learn-cal-cell-event--${e.kind}`}>
                            {e.title}
                          </li>
                        ))}
                        {dayEvents.length > 2 ? (
                          <li className="learn-cal-cell-more">+{dayEvents.length - 2} more</li>
                        ) : null}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      {/* ── Week view — 7 column day list, full events per column ──── */}
      {view === "week" ? (() => {
        const w0 = new Date(anchor); w0.setDate(anchor.getDate() - anchor.getDay());
        const days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(w0); d.setDate(w0.getDate() + i); return d;
        });
        return (
          <div className="learn-cal-week">
            {days.map((d, i) => {
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
              const evs = eventsByDay.get(key) ?? [];
              const isToday = isSameDay(d, today);
              return (
                <div key={i} className={`learn-cal-week-col ${isToday ? "is-today" : ""}`}>
                  <div className="learn-cal-week-head">
                    <span className="learn-cal-week-dow">{DAY_NAMES[i]}</span>
                    <span className="learn-cal-week-day">{d.getDate()}</span>
                  </div>
                  <div className="learn-cal-week-body">
                    {evs.length === 0 ? (
                      <p className="learn-cal-week-empty">—</p>
                    ) : evs.map((e) => (
                      <div key={e.id} className={`learn-cal-week-event learn-cal-week-event--${e.kind}`}>
                        <span className="learn-cal-week-time">
                          {new Date(e.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="learn-cal-week-title">{e.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })() : null}

      {/* ── Day view — single column, full event details ──────────── */}
      {view === "day" ? (() => {
        const key = `${anchor.getFullYear()}-${anchor.getMonth()}-${anchor.getDate()}`;
        const evs = eventsByDay.get(key) ?? [];
        return (
          <div className="learn-cal-day">
            <h2 className="learn-cal-day-heading">{anchor.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</h2>
            {evs.length === 0 ? (
              <div className="lh-rail-empty">
                <div className="lh-rail-empty-icon"><CalendarIcon size={22} /></div>
                <p className="lh-rail-empty-body">Nothing scheduled for this day.</p>
              </div>
            ) : (
              <ul className="learn-cal-upcoming">
                {evs.map((e) => {
                  const d = new Date(e.startsAt);
                  return (
                    <li key={e.id} className="learn-cal-upcoming-item">
                      <div className="learn-cal-upcoming-date">
                        <span className="learn-cal-upcoming-mon">{d.toLocaleString(undefined, { month: "short" }).toUpperCase()}</span>
                        <span className="learn-cal-upcoming-day">{d.getDate()}</span>
                      </div>
                      <div className="learn-cal-upcoming-text">
                        <span className={`learn-cal-upcoming-kind learn-cal-upcoming-kind--${e.kind}`}>
                          {e.kind === "class" ? "Live class" : e.kind === "exam" ? "Exam" : e.kind === "assignment" ? "Assignment" : e.kind === "holiday" ? "Holiday" : "Event"}
                        </span>
                        <strong>{e.title}</strong>
                        {e.description ? <p>{e.description}</p> : null}
                      </div>
                      <div className="learn-cal-upcoming-time">
                        {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {e.url ? <a href={e.url} target="_blank" rel="noreferrer" className="learn-cal-upcoming-join">Join →</a> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })() : null}

      {/* ── List view — flat chronological list, every event in window ─ */}
      {view === "list" ? (() => {
        const sorted = [...events].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        return (
          <div>
            {sorted.length === 0 ? (
              <div className="lh-rail-empty">
                <div className="lh-rail-empty-icon"><CalendarIcon size={22} /></div>
                <p className="lh-rail-empty-body">No events in this window. Your mentor will add classes &amp; exams here.</p>
              </div>
            ) : (
              <ul className="learn-cal-upcoming">
                {sorted.map((e) => {
                  const d = new Date(e.startsAt);
                  return (
                    <li key={e.id} className="learn-cal-upcoming-item">
                      <div className="learn-cal-upcoming-date">
                        <span className="learn-cal-upcoming-mon">{d.toLocaleString(undefined, { month: "short" }).toUpperCase()}</span>
                        <span className="learn-cal-upcoming-day">{d.getDate()}</span>
                      </div>
                      <div className="learn-cal-upcoming-text">
                        <span className={`learn-cal-upcoming-kind learn-cal-upcoming-kind--${e.kind}`}>
                          {e.kind === "class" ? "Live class" : e.kind === "exam" ? "Exam" : e.kind === "assignment" ? "Assignment" : e.kind === "holiday" ? "Holiday" : "Event"}
                        </span>
                        <strong>{e.title}</strong>
                        {e.description ? <p>{e.description}</p> : null}
                      </div>
                      <div className="learn-cal-upcoming-time">
                        {d.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                        {" · "}
                        {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {e.url ? <a href={e.url} target="_blank" rel="noreferrer" className="learn-cal-upcoming-join">Join →</a> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })() : null}

      {/* Upcoming list — only in month view, so day/week/list don't duplicate. */}
      {view !== "month" ? null : (<>
      <h2 className="lh-section-title" style={{ marginTop: 28 }}>Upcoming</h2>
      {loading ? (
        <p style={{ color: "#64748b", fontSize: 13.5 }}>Loading…</p>
      ) : (() => {
        const now = new Date();
        const horizon = new Date(now); horizon.setDate(now.getDate() + 14);
        const upcoming = events
          .filter((e) => new Date(e.startsAt) >= now && new Date(e.startsAt) < horizon)
          .slice(0, 6);
        if (upcoming.length === 0) {
          return (
            <div className="lh-rail-empty">
              <div className="lh-rail-empty-icon"><CalendarIcon size={22} /></div>
              <p className="lh-rail-empty-body">No upcoming events. Your mentor will add classes &amp; exams here.</p>
            </div>
          );
        }
        return (
          <ul className="learn-cal-upcoming">
            {upcoming.map((e) => {
              const d = new Date(e.startsAt);
              return (
                <li key={e.id} className="learn-cal-upcoming-item">
                  <div className="learn-cal-upcoming-date">
                    <span className="learn-cal-upcoming-mon">{d.toLocaleString(undefined, { month: "short" }).toUpperCase()}</span>
                    <span className="learn-cal-upcoming-day">{d.getDate()}</span>
                  </div>
                  <div className="learn-cal-upcoming-text">
                    <span className={`learn-cal-upcoming-kind learn-cal-upcoming-kind--${e.kind}`}>
                      {e.kind === "class" ? "Live class" : e.kind === "exam" ? "Exam" : e.kind === "assignment" ? "Assignment" : e.kind === "holiday" ? "Holiday" : "Event"}
                    </span>
                    <strong>{e.title}</strong>
                    {e.description ? <p>{e.description}</p> : null}
                  </div>
                  <div className="learn-cal-upcoming-time">
                    {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {e.url ? (
                      <a href={e.url} target="_blank" rel="noreferrer" className="learn-cal-upcoming-join">Join →</a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        );
      })()}
      </>)}
    </LearnShell>
  );
}
