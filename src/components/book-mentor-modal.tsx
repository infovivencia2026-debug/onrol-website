import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Loader2, X } from "lucide-react";
import { lmsCreateBooking, lmsListMentorSlots, type LmsMentorSlot } from "@/lib/lmsClient";

/**
 * Learner-facing "Book a 1:1" modal.
 *
 * Fetches the next 14 days of available slots for `mentorExternalId`,
 * groups them by date, and lets the learner pick + confirm one. Cohort
 * scope is optional — if passed, the mentor's cohort-scoped availability
 * rules are honored too.
 */
export function BookMentorModal({
  mentorExternalId,
  mentorName,
  cohortId,
  courseId,
  onClose,
  onBooked,
}: {
  mentorExternalId: string;
  mentorName: string;
  cohortId?: string | null;
  courseId?: string | null;
  onClose: () => void;
  onBooked?: () => void;
}) {
  const [slots, setSlots] = useState<LmsMentorSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LmsMentorSlot | null>(null);
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    lmsListMentorSlots(mentorExternalId, { cohortId, days: 14 })
      .then((s) => { if (!cancelled) setSlots(s); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load slots."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mentorExternalId, cohortId]);

  // Group slots by local calendar date.
  const grouped = useMemo(() => {
    const map = new Map<string, LmsMentorSlot[]>();
    for (const s of slots) {
      const d = new Date(s.startAt);
      const key = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [slots]);

  async function confirm() {
    if (!selected || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const b = await lmsCreateBooking({
        mentorExternalId,
        startAt: selected.startAt,
        endAt: selected.endAt,
        cohortId: cohortId ?? null,
        courseId: courseId ?? null,
        topic: topic.trim() || null,
      });
      setSuccess(`Booked ${new Date(b.startAt).toLocaleString()}. Check your bookings page.`);
      onBooked?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f3f5f8]/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#f3f5f8] rounded-xl shadow-2xl border border-slate-200 dark:border-[#404040] w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-[#404040]">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarClock className="h-5 w-5 text-orange-600 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-base font-semibold truncate">Book a 1:1 with {mentorName || "your mentor"}</h3>
              <p className="text-xs text-slate-500">Pick a 30-min slot in the next 14 days.</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-[#404040] text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-auto px-5 py-4">
          {success ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 mb-3">
                <CalendarClock className="h-6 w-6" />
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200">{success}</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 dark:text-red-400 py-4">{error}</p>
          ) : grouped.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No open slots in the next 14 days. Check back soon — or message your mentor in cohort chat.</p>
          ) : (
            <>
              <div className="space-y-4">
                {grouped.map(([day, daySlots]) => (
                  <div key={day}>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{day}</div>
                    <div className="flex flex-wrap gap-2">
                      {daySlots.map((s) => {
                        const isSel = selected?.startAt === s.startAt;
                        return (
                          <button
                            key={s.startAt}
                            onClick={() => setSelected(s)}
                            className={[
                              "px-3 py-1.5 rounded-md text-sm border transition",
                              isSel
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white dark:bg-[#404040] border-slate-300 dark:border-[#454545] hover:border-orange-400 hover:bg-blue-50 dark:hover:bg-[#454545]",
                            ].join(" ")}
                          >
                            {new Date(s.startAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              {selected && (
                <div className="mt-5 pt-5 border-t border-slate-200 dark:border-[#404040]">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Topic (optional)</span>
                    <textarea
                      rows={2}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="What would you like to cover?"
                      className="mt-1 w-full rounded-md border border-slate-300 dark:border-[#454545] bg-white dark:bg-[#f3f5f8] px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {!success && (
          <footer className="px-5 py-3 border-t border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#f3f5f8]/60 flex items-center justify-end gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border border-slate-300 dark:border-[#454545] hover:bg-white dark:hover:bg-[#404040]">
              Cancel
            </button>
            <button
              onClick={confirm}
              disabled={!selected || submitting}
              className="px-4 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {selected ? `Book ${new Date(selected.startAt).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}` : "Pick a slot"}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
