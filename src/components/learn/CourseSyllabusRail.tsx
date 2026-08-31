import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2, PlayCircle, Lock, FileText, ClipboardList, Video, ChevronDown,
} from "lucide-react";
import type { LmsModule } from "@/lib/lmsClient";

/**
 * Course syllabus rail rendered inside the LearnShell sidebar. Used by
 * LearnCourse + LearnLesson via the shell's `sidebarExtras` slot so the
 * outline travels with the learner.
 *
 * Each module is collapsible. The current lesson's module starts open;
 * if no active lesson, the first module starts open. Persisted to
 * sessionStorage per-course so reload restores the user's last view.
 *
 * Progress is shown three ways:
 *   - inline checkmarks on completed lessons
 *   - per-module "n / total" pill
 *   - course-level circular ring + percent in the rail header
 */

function lessonIcon(kind: string, done: boolean, active: boolean) {
  if (done) return <CheckCircle2 size={13} className="lr-icon lr-icon--done" />;
  if (active) return <PlayCircle size={13} className="lr-icon lr-icon--active" />;
  switch (kind) {
    case "quiz": return <ClipboardList size={13} className="lr-icon" />;
    case "assignment": return <FileText size={13} className="lr-icon" />;
    case "live": return <Video size={13} className="lr-icon" />;
    case "text": return <FileText size={13} className="lr-icon" />;
    default: return <PlayCircle size={13} className="lr-icon" />;
  }
}

function ProgressRing({ pct, size = 36 }: { pct: number; size?: number }) {
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.max(0, Math.min(100, pct)) / 100) * c;
  return (
    <svg width={size} height={size} className="lr-ring" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} className="lr-ring-track" strokeWidth={stroke} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        className="lr-ring-fill"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        fill="none"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export function CourseSyllabusRail({
  courseTitle,
  courseSlug,
  modules,
  activeLessonId,
  progress,
  enrolled,
}: {
  courseTitle: string;
  courseSlug: string;
  modules: LmsModule[];
  activeLessonId?: string;
  progress?: Record<string, boolean>;
  enrolled: boolean;
}) {
  // Totals for the header ring.
  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (n, m) => n + m.lessons.filter((l) => progress?.[l.id] === true).length,
    0,
  );
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Collapsed-state per module (session-scoped so reload restores).
  const storageKey = `learn.syllabus.collapsed.${courseSlug}`;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem(storageKey) : null;
      if (raw) return JSON.parse(raw) as Record<string, boolean>;
    } catch { /* ignore */ }
    // Default: keep open the module containing the active lesson; if no
    // active lesson, open the first module only.
    const def: Record<string, boolean> = {};
    const activeModule = modules.find((m) => m.lessons.some((l) => l.id === activeLessonId));
    modules.forEach((m, i) => {
      def[m.id] = activeModule ? m.id !== activeModule.id : i !== 0;
    });
    return def;
  });
  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <div className="lr" aria-label="Course content">
      <header className="lr-head">
        <Link to="/learn/me/courses" className="lr-back">← All courses</Link>
        <div className="lr-head-row">
          <div className="lr-head-text">
            <p className="lr-eyebrow">In this course</p>
            <Link to={`/learn/c/${courseSlug}`} className="lr-title" title={courseTitle}>
              {courseTitle}
            </Link>
            <p className="lr-progress-text">
              <strong>{completedLessons}</strong> / {totalLessons} lessons
              {pct > 0 ? <> · <span className="lr-progress-pct">{pct}%</span></> : null}
            </p>
          </div>
          <div className="lr-ring-wrap" aria-label={`${pct} percent complete`}>
            <ProgressRing pct={pct} />
            <span className="lr-ring-text">{pct}%</span>
          </div>
        </div>
      </header>

      <div className="lr-scroll">
        {modules.map((m, mi) => {
          const isCollapsed = collapsed[m.id] ?? false;
          const doneCount = m.lessons.filter((l) => progress?.[l.id] === true).length;
          return (
            <div key={m.id} className={`lr-mod${isCollapsed ? " is-collapsed" : ""}`}>
              <button type="button" className="lr-mod-head" onClick={() => toggle(m.id)} aria-expanded={!isCollapsed}>
                <span className="lr-mod-num">{String(mi + 1).padStart(2, "0")}</span>
                <span className="lr-mod-title">{m.title}</span>
                <span className="lr-mod-count">{doneCount}/{m.lessons.length}</span>
                <ChevronDown size={14} className="lr-mod-chev" aria-hidden />
              </button>
              {!isCollapsed ? (
                <ul className="lr-lessons">
                  {m.lessons.map((l, li) => {
                    const canPlay = enrolled || l.is_free_preview;
                    const done = progress?.[l.id] === true;
                    const active = activeLessonId === l.id;
                    return (
                      <li key={l.id}>
                        {canPlay ? (
                          <Link
                            to={`/learn/c/${courseSlug}/l/${l.id}`}
                            className={`lr-lesson${active ? " is-active" : ""}${done ? " is-done" : ""}`}
                            title={l.title}
                          >
                            <span className="lr-lesson-num">{li + 1}</span>
                            {lessonIcon(l.kind, done, active)}
                            <span className="lr-lesson-title">{l.title}</span>
                            {l.is_free_preview && !enrolled ? (
                              <span className="lr-tag">Preview</span>
                            ) : null}
                          </Link>
                        ) : (
                          <span className="lr-lesson is-locked" title={`${l.title} — enrol to unlock`}>
                            <span className="lr-lesson-num">{li + 1}</span>
                            <Lock size={12} className="lr-icon" aria-hidden />
                            <span className="lr-lesson-title">{l.title}</span>
                          </span>
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
    </div>
  );
}
