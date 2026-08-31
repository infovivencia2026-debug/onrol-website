import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, CalendarClock, ExternalLink, Loader2, Video, X } from "lucide-react";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import { lmsCancelBooking, lmsListMyBookings, type LmsMentorBooking } from "@/lib/lmsClient";

/**
 * Learner's "My 1:1 bookings" page. Shows upcoming bookings with the
 * meeting link (when the mentor has set one) and a Cancel action.
 */
export default function LearnMyBookings() {
  const { user, loading: authLoading } = useLmsAuth();
  const [bookings, setBookings] = useState<LmsMentorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPast, setShowPast] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    lmsListMyBookings({ role: "learner", upcoming: !showPast })
      .then((b) => { if (!cancelled) setBookings(b); })
      .catch(() => { if (!cancelled) setBookings([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, showPast]);

  async function doCancel(id: string) {
    if (!confirm("Cancel this booking? Your mentor will be notified.")) return;
    setCancelling(id);
    try {
      const updated = await lmsCancelBooking(id);
      setBookings((cur) => cur.map((b) => (b.id === id ? updated : b)));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Cancel failed.");
    } finally {
      setCancelling(null);
    }
  }

  if (!authLoading && !user) return <Navigate to="/learn/login" replace />;

  const upcoming = bookings.filter((b) => b.status === "confirmed");
  const past = bookings.filter((b) => b.status !== "confirmed");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/learn" className="text-sm text-slate-600 dark:text-slate-400 hover:text-orange-600 flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <CalendarClock className="h-5 w-5 text-orange-600" />
            My 1:1 bookings
          </div>
          <div className="w-12" />
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-end mb-4">
          <label className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <input type="checkbox" checked={showPast} onChange={(e) => setShowPast(e.target.checked)} />
            Show past
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-slate-300 dark:border-[#454545] bg-white dark:bg-[#f3f5f8]">
            <CalendarClock className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-700" />
            <h3 className="mt-3 font-semibold">No bookings yet</h3>
            <p className="text-sm text-slate-500 mt-1">Open a cohort on your home page and tap <strong>Book 1:1</strong> to schedule a session.</p>
            <Link to="/learn" className="inline-block mt-4 text-sm text-orange-600 hover:underline">Back to my learning</Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="mb-6">
                <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Upcoming</h2>
                <div className="space-y-3">
                  {upcoming.map((b) => <BookingCard key={b.id} b={b} cancelling={cancelling === b.id} onCancel={() => doCancel(b.id)} />)}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Past / cancelled</h2>
                <div className="space-y-3 opacity-70">
                  {past.map((b) => <BookingCard key={b.id} b={b} cancelling={false} onCancel={null} />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function BookingCard({ b, cancelling, onCancel }: { b: LmsMentorBooking; cancelling: boolean; onCancel: (() => void) | null }) {
  const when = new Date(b.startAt);
  const ends = new Date(b.endAt);
  return (
    <div className="rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{when.toLocaleString([], { weekday: "long", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
          <div className="text-xs text-slate-500">{Math.round((ends.getTime() - when.getTime()) / 60000)} min · {b.status}</div>
          {b.topic && <p className="text-sm mt-2 text-slate-700 dark:text-slate-300">{b.topic}</p>}
        </div>
        {b.status === "cancelled" && <X className="h-4 w-4 text-slate-400 shrink-0" />}
      </div>
      <div className="mt-3 flex items-center gap-3 text-sm">
        {b.meetingUrl ? (
          <a href={b.meetingUrl} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline flex items-center gap-1">
            <Video className="h-3.5 w-3.5" /> Join meeting <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          b.status === "confirmed" && <span className="text-xs text-slate-500">Meeting link will appear before the session.</span>
        )}
        {onCancel && (
          <button onClick={onCancel} disabled={cancelling} className="ml-auto text-xs text-red-600 hover:underline disabled:opacity-50">
            {cancelling ? "Cancelling…" : "Cancel"}
          </button>
        )}
      </div>
    </div>
  );
}
