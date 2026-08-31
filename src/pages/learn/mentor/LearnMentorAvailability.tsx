import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, CalendarClock, Loader2, Plus, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import {
  lmsCancelBooking,
  lmsDeleteMentorAvailability,
  lmsListMentorAvailability,
  lmsListMyBookings,
  lmsSetBookingMeetingUrl,
  lmsUpsertMentorAvailability,
  type LmsMentorAvailabilityRule,
  type LmsMentorBooking,
} from "@/lib/lmsClient";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function mmToLabel(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function labelToMm(label: string): number {
  const [h, m] = label.split(":").map((s) => Number(s));
  return (h || 0) * 60 + (m || 0);
}

/** Mentor's "Availability + upcoming bookings" page (/learn/mentor/availability). */
export default function LearnMentorAvailability() {
  const { user, loading: authLoading } = useLmsAuth();
  const [rules, setRules] = useState<LmsMentorAvailabilityRule[]>([]);
  const [bookings, setBookings] = useState<LmsMentorBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<{ dayOfWeek: number; start: string; end: string; slot: number }>({
    dayOfWeek: 2, start: "18:00", end: "20:00", slot: 30,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all([
      lmsListMentorAvailability(user.id).catch(() => []),
      lmsListMyBookings({ role: "mentor", upcoming: true }).catch(() => []),
    ]).then(([r, b]) => {
      if (!cancelled) { setRules(r); setBookings(b); }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  async function addRule() {
    if (!user) return;
    const startMinute = labelToMm(draft.start);
    const endMinute = labelToMm(draft.end);
    if (endMinute <= startMinute) { toast.error("End must be after start."); return; }
    setSaving(true);
    try {
      const r = await lmsUpsertMentorAvailability(user.id, {
        dayOfWeek: draft.dayOfWeek,
        startMinute,
        endMinute,
        slotMinutes: draft.slot,
      });
      setRules((cur) => [...cur, r]);
      toast.success("Availability added.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add availability.");
    } finally { setSaving(false); }
  }

  async function delRule(id: string) {
    if (!user) return;
    if (!confirm("Remove this weekly availability window? Existing bookings stay.")) return;
    try {
      await lmsDeleteMentorAvailability(user.id, id);
      setRules((cur) => cur.filter((r) => r.id !== id));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    }
  }

  async function setMeeting(bookingId: string) {
    const url = prompt("Paste meeting link (https://…)");
    if (!url) return;
    try {
      const b = await lmsSetBookingMeetingUrl(bookingId, url);
      setBookings((cur) => cur.map((x) => (x.id === bookingId ? b : x)));
      toast.success("Meeting link saved.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    }
  }

  async function cancel(bookingId: string) {
    if (!confirm("Cancel this booking? Your learner will be notified.")) return;
    try {
      const b = await lmsCancelBooking(bookingId, "Mentor cancelled");
      setBookings((cur) => cur.map((x) => (x.id === bookingId ? b : x)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed.");
    }
  }

  if (!authLoading && !user) return <Navigate to="/learn/login" replace />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/learn/mentor" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Mentor panel
          </Link>
          <div className="flex items-center gap-2 font-semibold">
            <CalendarClock className="h-5 w-5 text-purple-600" />
            Availability &amp; bookings
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-10">
        <section>
          <h2 className="text-lg font-semibold mb-3">Weekly availability</h2>
          <p className="text-sm text-slate-500 mb-4">Learners pick from these windows when they tap <strong>Book 1:1</strong>. Times are in Asia/Kolkata.</p>

          <div className="rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <label className="block text-sm">
                <span className="block text-xs font-semibold text-slate-500 mb-1">Day</span>
                <select value={draft.dayOfWeek} onChange={(e) => setDraft({ ...draft, dayOfWeek: Number(e.target.value) })} className="w-full rounded-md border border-slate-300 dark:border-[#454545] bg-white dark:bg-[#f3f5f8] px-2 py-1.5 text-sm">
                  {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                <span className="block text-xs font-semibold text-slate-500 mb-1">Start</span>
                <input type="time" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} className="w-full rounded-md border border-slate-300 dark:border-[#454545] bg-white dark:bg-[#f3f5f8] px-2 py-1.5 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="block text-xs font-semibold text-slate-500 mb-1">End</span>
                <input type="time" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} className="w-full rounded-md border border-slate-300 dark:border-[#454545] bg-white dark:bg-[#f3f5f8] px-2 py-1.5 text-sm" />
              </label>
              <label className="block text-sm">
                <span className="block text-xs font-semibold text-slate-500 mb-1">Slot length</span>
                <select value={draft.slot} onChange={(e) => setDraft({ ...draft, slot: Number(e.target.value) })} className="w-full rounded-md border border-slate-300 dark:border-[#454545] bg-white dark:bg-[#f3f5f8] px-2 py-1.5 text-sm">
                  {[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
                </select>
              </label>
              <button
                onClick={addRule}
                disabled={saving}
                className="rounded-md bg-purple-600 text-white text-sm font-medium px-3 py-2 hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add window
              </button>
            </div>

            <div className="mt-5">
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-purple-600" /></div>
              ) : rules.length === 0 ? (
                <p className="text-sm text-slate-500">No windows yet. Add one to start accepting bookings.</p>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-[#404040]">
                  {rules.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                      <span>
                        <strong>{DAYS[r.dayOfWeek]}</strong> &middot; {mmToLabel(r.startMinute)} – {mmToLabel(r.endMinute)} &middot; {r.slotMinutes} min slots
                      </span>
                      <button onClick={() => delRule(r.id)} className="text-red-600 hover:underline flex items-center gap-1">
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3">Upcoming 1:1 sessions</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-purple-600" /></div>
          ) : bookings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-[#454545] bg-white dark:bg-[#f3f5f8] p-8 text-center text-sm text-slate-500">
              No upcoming sessions. Learners will appear here once they book.
            </div>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => (
                <li key={b.id} className="rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="font-semibold">{new Date(b.startAt).toLocaleString([], { weekday: "long", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                      <div className="text-xs text-slate-500">{Math.round((new Date(b.endAt).getTime() - new Date(b.startAt).getTime()) / 60000)} min &middot; learner {b.learnerExternalId.slice(0, 8)} &middot; {b.status}</div>
                      {b.topic && <p className="text-sm mt-2 text-slate-700 dark:text-slate-300">Topic: {b.topic}</p>}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {b.meetingUrl ? (
                        <a href={b.meetingUrl} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline flex items-center gap-1">
                          <Video className="h-3.5 w-3.5" /> Join
                        </a>
                      ) : (
                        <button onClick={() => setMeeting(b.id)} className="text-purple-600 hover:underline">Add meeting link</button>
                      )}
                      <button onClick={() => cancel(b.id)} className="text-red-600 hover:underline">Cancel</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
