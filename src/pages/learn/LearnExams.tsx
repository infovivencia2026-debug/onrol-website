import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { Loader2, ClipboardList, CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { LearnShell } from "@/components/learn/LearnShell";
import { lmsListMyAttempts, type LmsQuizAttemptWithContext } from "@/lib/lmsClient";
import "@/styles/learn-shell.css";

/**
 * `/learn/me/exams` — student-facing quiz attempt history.
 * Lists every quiz attempt for the signed-in learner, joined with the
 * quiz / lesson / course it belongs to so each row is self-contained
 * (no per-row fetch). Sorted newest-first by `started_at`.
 *
 * Pass/fail badge uses `pass_pct` from the quiz (defaults to 70 if the
 * server didn't return one, matching the existing quiz model default).
 */
export default function LearnExams() {
  const { user, loading: authLoading } = useLmsAuth();
  const [attempts, setAttempts] = useState<LmsQuizAttemptWithContext[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const rows = await lmsListMyAttempts(user.id);
        if (!cancelled) setAttempts(rows);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!authLoading && !user) return <Navigate to="/learn/login" replace />;

  const submitted = attempts.filter((a) => a.submitted_at != null);
  const inProgress = attempts.filter((a) => a.submitted_at == null);
  const passed = submitted.filter((a) => a.passed === true).length;
  const failed = submitted.filter((a) => a.passed === false).length;
  const avgScore = submitted.length > 0
    ? Math.round(submitted.reduce((s, a) => s + (a.score_pct ?? 0), 0) / submitted.length)
    : 0;

  return (
    <LearnShell>
      <header className="lh-exams-head">
        <div>
          <h1>Exams</h1>
          <p>Your quiz attempt history — pass status, scores and details.</p>
        </div>
      </header>

      {loading ? (
        <div className="lh-stub" style={{ padding: 40 }}>
          <Loader2 className="animate-spin" />
        </div>
      ) : attempts.length === 0 ? (
        <div className="lh-stub">
          <div className="lh-stub-icon"><ClipboardList /></div>
          <h2>No exams attempted yet</h2>
          <p>Quiz attempts will appear here once you take a quiz inside one of your lessons.</p>
        </div>
      ) : (
        <>
          <section className="lh-exams-kpis">
            <KpiBlock label="Attempts" value={submitted.length} sub={inProgress.length > 0 ? `${inProgress.length} in progress` : "submitted"} />
            <KpiBlock label="Passed" value={passed} sub={`${submitted.length > 0 ? Math.round((passed / submitted.length) * 100) : 0}% pass rate`} tone="green" />
            <KpiBlock label="Failed" value={failed} sub="retake to improve" tone="red" />
            <KpiBlock label="Avg score" value={`${avgScore}%`} sub="across submitted" tone="orange" />
          </section>

          <section className="lh-exams-list">
            {attempts.map((a) => <ExamRow key={a.id} a={a} />)}
          </section>
        </>
      )}
    </LearnShell>
  );
}

function KpiBlock({ label, value, sub, tone }: {
  label: string;
  value: string | number;
  sub: string;
  tone?: "green" | "red" | "orange";
}) {
  return (
    <div className={`lh-exams-kpi${tone ? ` lh-exams-kpi--${tone}` : ""}`}>
      <div className="lh-exams-kpi-value">{value}</div>
      <div className="lh-exams-kpi-label">{label}</div>
      <div className="lh-exams-kpi-sub">{sub}</div>
    </div>
  );
}

function ExamRow({ a }: { a: LmsQuizAttemptWithContext }) {
  const inProgress = a.submitted_at == null;
  const passPct = a.pass_pct ?? 70;
  const tone = inProgress ? "pending" : a.passed ? "pass" : "fail";
  const Icon = inProgress ? AlertCircle : a.passed ? CheckCircle2 : XCircle;
  const statusLabel = inProgress ? "In progress" : a.passed ? "Passed" : "Failed";
  const date = new Date(a.submitted_at ?? a.started_at).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
  return (
    <article className={`lh-exam lh-exam--${tone}`}>
      <div className="lh-exam-status">
        <span className="lh-exam-icon"><Icon /></span>
        <span className="lh-exam-status-label">{statusLabel}</span>
      </div>
      <div className="lh-exam-body">
        <h4>{a.quiz_title || a.lesson_title || "Quiz"}</h4>
        <p>
          {a.course_title || "Course"} · {date}
          {a.time_taken_sec != null && !inProgress
            ? ` · ${Math.round(a.time_taken_sec / 60)} min`
            : ""}
        </p>
      </div>
      <div className="lh-exam-score">
        {inProgress ? (
          <span className="lh-exam-score-pending">—</span>
        ) : (
          <>
            <span className="lh-exam-score-value">{a.score_pct ?? 0}%</span>
            <span className="lh-exam-score-pass">pass {passPct}%</span>
          </>
        )}
      </div>
      {a.course_slug ? (
        <Link to={`/learn/c/${a.course_slug}`} className="lh-exam-cta" aria-label={`Open ${a.course_title}`}>
          <ArrowRight size={16} />
        </Link>
      ) : null}
    </article>
  );
}
