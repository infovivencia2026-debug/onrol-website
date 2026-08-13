import { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, GraduationCap, ArrowLeft, MessageSquare, Video, BookOpen, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  lmsGetCohort, lmsGetCourse, lmsListCohortLiveSessions, lmsScheduleLiveSession,
  type LmsCohort, type LmsCohortMember, type LmsCohortLearnerProgress,
  type LmsLiveSession, type LmsLesson,
} from "@/lib/lmsClient";

function toLocalDateTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}
function fromLocalDateTimeInput(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default function LearnMentorCohort() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const [cohort, setCohort] = useState<LmsCohort | null>(null);
  const [members, setMembers] = useState<LmsCohortMember[]>([]);
  const [progress, setProgress] = useState<LmsCohortLearnerProgress[]>([]);
  const [liveSessions, setLiveSessions] = useState<LmsLiveSession[]>([]);
  const [liveLessons, setLiveLessons] = useState<LmsLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleErr, setScheduleErr] = useState<string | null>(null);
  const [draft, setDraft] = useState({ lessonId: "", title: "", start: "", end: "" });

  const load = useCallback(async () => {
    if (!cohortId) return;
    setLoading(true);
    try {
      const detail = await lmsGetCohort(cohortId, "progress");
      if (!detail) {
        toast.error("Cohort not found.");
        return;
      }
      setCohort(detail.cohort);
      setMembers(detail.members ?? []);
      setProgress(detail.progress ?? []);
      // Also fetch the course outline (to find kind=live lessons) + existing sessions.
      const courseSlug = detail.cohort.course_slug;
      if (courseSlug) {
        const [course, sessions] = await Promise.all([
          lmsGetCourse(courseSlug, { includeOutline: true }).catch(() => null),
          lmsListCohortLiveSessions(detail.cohort.id).catch(() => []),
        ]);
        if (course?.modules) {
          const liveOnly = course.modules.flatMap((m) => m.lessons).filter((l) => l.kind === "live");
          setLiveLessons(liveOnly);
        }
        setLiveSessions(sessions);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, [cohortId]);

  useEffect(() => { void load(); }, [load]);

  const openSchedule = () => {
    setShowSchedule(true);
    setScheduleErr(null);
    setDraft({
      lessonId: liveLessons[0]?.id ?? "",
      title: "",
      start: "",
      end: "",
    });
  };

  const submitSchedule = async () => {
    if (!cohort || !draft.lessonId || !draft.title.trim()) {
      setScheduleErr("Pick a lesson and enter a title.");
      return;
    }
    setScheduling(true);
    setScheduleErr(null);
    try {
      await lmsScheduleLiveSession({
        lessonId: draft.lessonId,
        courseId: cohort.course_id,
        cohortId: cohort.id,
        title: draft.title.trim(),
        scheduledStart: fromLocalDateTimeInput(draft.start),
        scheduledEnd: fromLocalDateTimeInput(draft.end),
      });
      setShowSchedule(false);
      toast.success("Live session scheduled.");
      await load();
    } catch (error) {
      setScheduleErr(error instanceof Error ? error.message : "Schedule failed.");
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>;
  }
  if (!cohort) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Cohort not found.</div>;
  }

  const avgPct = progress.length
    ? Math.round(progress.reduce((sum, p) => sum + (p.total > 0 ? (p.completed / p.total) * 100 : 0), 0) / progress.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/learn/mentor" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
            <ArrowLeft className="h-4 w-4" />
            All cohorts
          </Link>
          <Link to="/learn/mentor" className="flex items-center gap-2 font-semibold text-sm">
            <GraduationCap className="h-4 w-4 text-purple-600" />
            ONROL Learn · Mentor
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-5">
            <h1 className="text-2xl font-bold mb-1">{cohort.name}</h1>
            <div className="text-sm text-slate-500 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              {cohort.course_title}
            </div>
            {cohort.description && <p className="mt-3 text-slate-700 dark:text-slate-300">{cohort.description}</p>}
            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-[#404040]">
              <div>
                <div className="text-2xl font-bold">{members.length}</div>
                <div className="text-xs text-slate-500">Learners</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{avgPct}%</div>
                <div className="text-xs text-slate-500">Avg progress</div>
              </div>
              <div>
                <div className="text-2xl font-bold capitalize">{cohort.status}</div>
                <div className="text-xs text-slate-500">Status</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-5">
            <h2 className="text-lg font-semibold mb-4">Learner progress</h2>
            {members.length === 0 ? (
              <p className="text-sm text-slate-500">No learners yet. Ask an admin to add learners to this cohort.</p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-[#404040]">
                {members
                  .filter((m) => m.role === "learner")
                  .map((m) => {
                    const p = progress.find((pr) => pr.user_external_id === m.user_external_id);
                    const total = p?.total ?? 0;
                    const completed = p?.completed ?? 0;
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                    return (
                      <li key={m.user_external_id} className="py-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{m.full_name || m.email}</div>
                          <div className="text-xs text-slate-500 truncate">{m.email}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs text-slate-500 mb-1">{completed}/{total} · {pct}%</div>
                          <div className="w-32 h-1.5 bg-slate-200 dark:bg-[#404040] rounded-full overflow-hidden">
                            <div className="h-full bg-purple-600" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        </section>

        <aside className="lg:col-span-1 space-y-4">
          {cohort.conversation_id && (
            <Link
              to={`/messenger/chat/${cohort.conversation_id}`}
              className="block rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 p-4 hover:bg-purple-100 dark:hover:bg-purple-900 transition"
            >
              <div className="flex items-center gap-2 font-medium text-purple-900 dark:text-purple-100">
                <MessageSquare className="h-4 w-4" />
                Open cohort chat
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                Reach all {members.length} members in one thread.
              </p>
            </Link>
          )}

          <button
            onClick={openSchedule}
            disabled={liveLessons.length === 0}
            className="w-full text-left block rounded-lg border border-orange-200 dark:border-[#454545] bg-blue-50 dark:bg-[#f3f5f8] p-4 hover:bg-blue-100 dark:hover:bg-[#f3f5f8] transition disabled:opacity-60 disabled:cursor-not-allowed"
            title={liveLessons.length === 0 ? "Ask an admin to add a live-kind lesson to the course first." : ""}
          >
            <div className="flex items-center gap-2 font-medium text-orange-900 dark:text-orange-200">
              <Video className="h-4 w-4" />
              Schedule live session
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              {liveLessons.length > 0
                ? "Books a meeting link and notifies the cohort chat."
                : "Add a kind=live lesson to this course first (admin)."}
            </p>
          </button>

          {liveSessions.length > 0 && (
            <div className="rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-4">
              <div className="font-medium text-sm mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-600" /> Upcoming live sessions
              </div>
              <ul className="space-y-2">
                {liveSessions.map((s) => (
                  <li key={s.id} className="text-sm">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      {s.scheduled_start && <span>{new Date(s.scheduled_start).toLocaleString()}</span>}
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#404040]">{s.status}</span>
                    </div>
                    {s.meeting_code && (
                      <Link
                        to={`/meeting/join/${s.meeting_code}`}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-orange-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Join ({s.meeting_code})
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-4 text-sm space-y-2 text-slate-700 dark:text-slate-300">
            <div><span className="text-slate-500">Mentor:</span> {cohort.mentor_name || "—"}</div>
            {cohort.start_date && (
              <div><span className="text-slate-500">Starts:</span> {new Date(cohort.start_date).toLocaleDateString()}</div>
            )}
            {cohort.end_date && (
              <div><span className="text-slate-500">Ends:</span> {new Date(cohort.end_date).toLocaleDateString()}</div>
            )}
            {cohort.capacity && <div><span className="text-slate-500">Capacity:</span> {cohort.capacity}</div>}
          </div>
        </aside>
      </main>

      {showSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSchedule(false)}>
          <div className="bg-white dark:bg-[#f3f5f8] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Schedule live session</h2>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="font-medium">Which lesson slot</span>
                <select
                  value={draft.lessonId}
                  onChange={(e) => setDraft((d) => ({ ...d, lessonId: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300 dark:border-[#454545] bg-white dark:bg-[#404040]"
                >
                  {liveLessons.map((l) => (<option key={l.id} value={l.id}>{l.title}</option>))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="font-medium">Title</span>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300 dark:border-[#454545] bg-white dark:bg-[#404040]"
                  placeholder="e.g. Week 3 Q&amp;A"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-sm">
                  <span className="font-medium">Start</span>
                  <input
                    type="datetime-local"
                    value={draft.start}
                    onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300 dark:border-[#454545] bg-white dark:bg-[#404040]"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium">End</span>
                  <input
                    type="datetime-local"
                    value={draft.end}
                    onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-slate-300 dark:border-[#454545] bg-white dark:bg-[#404040]"
                  />
                </label>
              </div>
              {scheduleErr && <p className="text-sm text-red-600">{scheduleErr}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowSchedule(false)} className="px-4 py-2 rounded-md border border-slate-300 dark:border-[#454545] text-sm">Cancel</button>
              <button
                onClick={submitSchedule}
                disabled={scheduling}
                className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {scheduling ? "Scheduling…" : "Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
