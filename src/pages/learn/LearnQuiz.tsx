import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import {
  lmsGetQuizForLesson,
  lmsStartQuizAttempt,
  lmsSubmitQuizAttempt,
  type LmsQuiz,
  type LmsQuizQuestion,
  type LmsQuizAttempt,
} from "@/lib/lmsClient";

interface Props {
  courseSlug: string;
  lessonId: string;
  lessonTitle: string;
}

export default function LearnQuiz({ courseSlug, lessonId, lessonTitle }: Props) {
  const { user } = useLmsAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<LmsQuiz | null>(null);
  const [questions, setQuestions] = useState<LmsQuizQuestion[]>([]);
  const [attempt, setAttempt] = useState<LmsQuizAttempt | null>(null);
  const [answers, setAnswers] = useState<Record<string, { selected?: string[]; text?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<LmsQuizAttempt | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await lmsGetQuizForLesson(lessonId);
        if (cancelled) return;
        if (!r) {
          toast.error("Quiz not configured for this lesson yet.");
          return;
        }
        setQuiz(r.quiz);
        setQuestions(r.questions);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load quiz.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lessonId]);

  const startAttempt = async () => {
    if (!quiz || !user) return;
    try {
      const a = await lmsStartQuizAttempt(quiz.id, user.id);
      setAttempt(a);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start attempt.");
    }
  };

  const toggle = (qId: string, choiceId: string, multi: boolean) => {
    setAnswers((prev) => {
      const cur = prev[qId]?.selected ?? [];
      if (multi) {
        const next = cur.includes(choiceId) ? cur.filter((x) => x !== choiceId) : [...cur, choiceId];
        return { ...prev, [qId]: { selected: next } };
      }
      return { ...prev, [qId]: { selected: [choiceId] } };
    });
  };

  const setText = (qId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: { text } }));
  };

  const submit = async () => {
    if (!attempt || !user) return;
    setSubmitting(true);
    try {
      const finished = await lmsSubmitQuizAttempt({
        attemptId: attempt.id,
        userExternalId: user.id,
        answers,
      });
      setResult(finished);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-orange-600" /></div>;
  if (!quiz) return <div className="min-h-[60vh] flex items-center justify-center text-slate-500">Quiz not available.</div>;

  // Result screen
  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        {result.passed ? (
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-3" />
        ) : (
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-3" />
        )}
        <h2 className="text-2xl font-bold">{result.passed ? "Passed!" : "Not quite — try again"}</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Your score: <span className="font-semibold">{result.score_pct}%</span>{" "}
          (passing {quiz.passing_score_pct}%)
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link to={`/learn/c/${courseSlug}`} className="px-4 py-2 rounded-md border border-slate-300 dark:border-[#454545] text-sm">
            Back to course
          </Link>
          {!result.passed && (
            <button onClick={() => { setResult(null); setAttempt(null); setAnswers({}); }} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm">
              Try again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Pre-attempt screen
  if (!attempt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link to={`/learn/c/${courseSlug}`} className="inline-flex items-center gap-2 text-sm text-slate-500 mb-6 hover:text-slate-900 dark:hover:text-slate-100">
          <ArrowLeft className="h-4 w-4" /> Back to course
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="h-6 w-6 text-orange-600" /> {quiz.title}</h1>
        {quiz.description_md && <p className="mt-3 text-slate-700 dark:text-slate-300">{quiz.description_md}</p>}
        <ul className="mt-6 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li>{questions.length} questions</li>
          <li>Pass at {quiz.passing_score_pct}%</li>
          {quiz.attempts_allowed != null && <li>Attempts allowed: {quiz.attempts_allowed}</li>}
          {quiz.time_limit_sec && <li>Time limit: {Math.round(quiz.time_limit_sec / 60)} min</li>}
        </ul>
        <button onClick={startAttempt} className="mt-6 px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700">
          Start quiz
        </button>
      </div>
    );
  }

  // Quiz UI
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">{quiz.title}</h1>
      <ol className="space-y-8">
        {questions.map((q, i) => (
          <li key={q.id} className="rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-5">
            <div className="text-xs text-slate-500 mb-2">Question {i + 1} of {questions.length} · {q.points} pt{q.points === 1 ? "" : "s"}</div>
            <div className="font-medium text-base mb-3">{q.prompt}</div>
            {(q.kind === "single_choice" || q.kind === "true_false") && (
              <div className="space-y-2">
                {q.choices.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 px-3 py-2 rounded border border-slate-200 dark:border-[#454545] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#404040]">
                    <input
                      type="radio"
                      name={q.id}
                      checked={(answers[q.id]?.selected ?? []).includes(c.id)}
                      onChange={() => toggle(q.id, c.id, false)}
                    />
                    <span className="text-sm">{c.text}</span>
                  </label>
                ))}
              </div>
            )}
            {q.kind === "multi_choice" && (
              <div className="space-y-2">
                {q.choices.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 px-3 py-2 rounded border border-slate-200 dark:border-[#454545] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#404040]">
                    <input
                      type="checkbox"
                      checked={(answers[q.id]?.selected ?? []).includes(c.id)}
                      onChange={() => toggle(q.id, c.id, true)}
                    />
                    <span className="text-sm">{c.text}</span>
                  </label>
                ))}
              </div>
            )}
            {q.kind === "short_text" && (
              <input
                value={answers[q.id]?.text ?? ""}
                onChange={(e) => setText(q.id, e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 dark:border-[#454545] bg-white dark:bg-[#f3f5f8]"
                placeholder="Your answer"
              />
            )}
          </li>
        ))}
      </ol>
      <div className="mt-6 flex justify-end gap-2">
        <button onClick={() => navigate(`/learn/c/${courseSlug}`)} className="px-4 py-2 rounded-md border border-slate-300 dark:border-[#454545] text-sm">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting || Object.keys(answers).length === 0}
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Submitting…" : `Submit (${lessonTitle})`}
        </button>
      </div>
    </div>
  );
}
