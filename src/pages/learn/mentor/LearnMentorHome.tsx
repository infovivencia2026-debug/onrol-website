import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, GraduationCap, Users, BookOpen, ArrowLeft, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { lmsListCohorts, type LmsCohort } from "@/lib/lmsClient";

export default function LearnMentorHome() {
  const { user } = useLmsAuth();
  const [cohorts, setCohorts] = useState<LmsCohort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await lmsListCohorts({ mentorExternalId: user.id });
        if (!cancelled) setCohorts(rows);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load cohorts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        <Link to="/login" className="text-orange-600 hover:underline">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/learn" className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100">
            <ArrowLeft className="h-4 w-4" />
            Learner view
          </Link>
          <Link to="/learn/mentor" className="flex items-center gap-2 font-semibold">
            <GraduationCap className="h-5 w-5 text-purple-600" />
            ONROL Learn · Mentor
          </Link>
          <Link to="/learn/mentor/availability" className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-purple-600 font-medium">
            <CalendarClock className="h-4 w-4" />
            Availability
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1">My cohorts</h1>
        <p className="text-slate-500 mb-6">Track your learners, run live sessions, and message your cohort.</p>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>
        ) : cohorts.length === 0 ? (
          <div className="rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-12 text-center">
            <Users className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-500">No cohorts assigned to you yet.</p>
            <p className="text-xs text-slate-400 mt-1">Ask an admin to assign you as the mentor on a cohort.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cohorts.map((c) => (
              <Link
                key={c.id}
                to={`/learn/mentor/c/${c.id}`}
                className="rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-5 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-lg">{c.name}</div>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    c.status === "active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-slate-200 dark:bg-[#404040] text-slate-700 dark:text-slate-300"
                  }`}>{c.status}</span>
                </div>
                <div className="text-sm text-slate-500 mb-3 flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {c.course_title}
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-200 dark:border-[#404040]">
                  <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {c.member_count ?? 0} learners</span>
                  {c.start_date && <span className="text-xs text-slate-500">{new Date(c.start_date).toLocaleDateString()}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
