import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft, BookOpen, CalendarClock, ExternalLink, GraduationCap,
  Loader2, MessageSquare, Users, Video,
} from "lucide-react";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { lmsGetCohortCalendar, type LmsCohortCalendar } from "@/lib/lmsClient";

function relativeFromNow(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const min = Math.round(abs / 60_000);
  if (min < 60) return diff < 0 ? `${min}m ago` : `in ${min}m`;
  const hr = Math.round(abs / 3_600_000);
  if (hr < 24) return diff < 0 ? `${hr}h ago` : `in ${hr}h`;
  const day = Math.round(abs / 86_400_000);
  return diff < 0 ? `${day}d ago` : `in ${day}d`;
}

export default function LearnCohortCalendar() {
  const { cohortId } = useParams<{ cohortId: string }>();
  const { user, loading: authLoading } = useLmsAuth();
  const [data, setData] = useState<LmsCohortCalendar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cohortId || !user) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    lmsGetCohortCalendar(cohortId)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [cohortId, user]);

  if (!authLoading && !user) return <Navigate to="/learn/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8]">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link to="/learn" className="text-sm text-slate-600 dark:text-slate-400 hover:text-orange-600 flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <CalendarClock className="h-5 w-5 text-orange-600" />
            <span className="hidden sm:inline">Cohort calendar</span>
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-orange-600" /></div>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : !data ? (
          <p className="text-slate-500 text-sm">Cohort not found.</p>
        ) : (
          <>
            <section className="mb-6 rounded-xl bg-gradient-to-br from-orange-50 to-indigo-50 dark:from-[#f3f5f8] dark:to-[#404040] border border-slate-200 dark:border-[#404040] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{data.cohort.name}</h1>
                  <div className="mt-1.5 flex items-center gap-3 text-sm flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <BookOpen className="h-4 w-4" /> {data.cohort.courseTitle}
                    </span>
                    {data.cohort.mentorName ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <GraduationCap className="h-4 w-4" /> {data.cohort.mentorName}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/learn/c/${data.cohort.courseSlug}`} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-white dark:bg-[#f3f5f8] border border-slate-300 dark:border-[#454545] hover:border-slate-400 transition">
                    <BookOpen className="h-3.5 w-3.5" /> Course
                  </Link>
                  {data.cohort.conversationId ? (
                    <Link to={`/messenger/chat/${data.cohort.conversationId}`} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-700 transition">
                      <MessageSquare className="h-3.5 w-3.5" /> Open chat
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Video className="h-4 w-4 text-rose-500" />
                Live sessions ({data.liveSessions.length})
              </h2>
              {data.liveSessions.length === 0 ? (
                <p className="text-sm text-slate-500 p-4 rounded-lg border border-dashed border-slate-300 dark:border-[#454545]">
                  No upcoming live sessions for this cohort. Your mentor will schedule them as the program progresses.
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.liveSessions.map((s) => (
                    <li key={s.id} className="rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-4 flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{s.title}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {s.scheduledStart ? (
                            <>{new Date(s.scheduledStart).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {relativeFromNow(s.scheduledStart)}</>
                          ) : "Time TBA"}
                          <span className="ml-2">· status: <strong>{s.status}</strong></span>
                        </div>
                      </div>
                      <Link
                        to={`/learn/c/${data.cohort.courseSlug}/l/${s.lessonId}`}
                        className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-rose-600 text-white hover:bg-rose-700 transition shrink-0"
                      >
                        <Video className="h-3.5 w-3.5" /> Join lesson
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                Upcoming 1:1 sessions ({data.bookings.length})
              </h2>
              {data.bookings.length === 0 ? (
                <p className="text-sm text-slate-500 p-4 rounded-lg border border-dashed border-slate-300 dark:border-[#454545]">
                  No 1:1 sessions booked. Cohort members can book one from the home page (look for &quot;Book 1:1&quot;).
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.bookings.map((b) => {
                    const dur = Math.round((new Date(b.endAt).getTime() - new Date(b.startAt).getTime()) / 60000);
                    const isMine = user && b.learnerExternalId === user.id;
                    return (
                      <li key={b.id} className={`rounded-lg border p-4 flex items-start justify-between gap-3 flex-wrap ${isMine ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800" : "border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8]"}`}>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm">
                            {new Date(b.startAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {dur} min · {isMine ? <strong className="text-emerald-700 dark:text-emerald-400">you</strong> : (b.learnerName || `learner ${b.learnerExternalId.slice(0, 8)}`)}
                            <span className="ml-2">· {relativeFromNow(b.startAt)}</span>
                          </div>
                          {b.topic ? <p className="text-sm mt-2 text-slate-700 dark:text-slate-300">{b.topic}</p> : null}
                        </div>
                        {b.meetingUrl ? (
                          <a href={b.meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition shrink-0">
                            <Video className="h-3.5 w-3.5" /> Join <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
