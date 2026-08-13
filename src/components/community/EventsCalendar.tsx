import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import { Calendar, Plus, Clock, MapPin, Video, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type EventItem = {
  id: string;
  title: string;
  start_time: string;
  event_type: string;
  location?: string | null;
  attendees_count?: number | null;
};

const EventsCalendar = () => {
  const { member } = useCommunityAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null);
  const [rsvpedIds, setRsvpedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await supabase
        .from("events")
        .select("*")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString("default", { month: "short" }),
      weekday: date.toLocaleString("default", { weekday: "short" }),
      time: date.toLocaleString("default", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const handleRsvp = async (eventId: string) => {
    if (!member?.id) { toast.error("Please log in to RSVP"); return; }
    if (rsvpedIds.has(eventId)) { toast.info("You already RSVPed!"); return; }
    setRsvpLoading(eventId);
    const { error } = await supabase.from("event_rsvps").upsert(
      { event_id: eventId, member_id: member.id },
      { onConflict: "event_id,member_id" }
    );
    setRsvpLoading(null);
    if (error) { toast.error("RSVP failed: " + error.message); return; }
    setRsvpedIds((prev) => new Set(prev).add(eventId));
    toast.success("You're going! ðŸŽ‰");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-[#0B1640] flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary" />
            Events
          </h2>
          <p className="text-xs text-muted-foreground/80 mt-1">Networking, workshops, and demo days</p>
        </div>
        <Link
          to="/community/events/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs text-[#0B1640] transition-all hover:scale-[1.02]"
          style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
        >
          <Plus className="w-3 h-3" />
          Create Event
        </Link>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground/70">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="glass-card rounded-2xl border border-white/5 p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground/80 mb-2 text-sm">No upcoming events</p>
          </div>
        ) : (
          events.map((event) => {
            const date = formatDate(event.start_time);
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl border border-white/5 overflow-hidden flex flex-col md:flex-row"
              >
                {/* Date vertical bar */}
                <div className="w-full md:w-24 bg-primary/10 border-b md:border-b-0 md:border-r border-white/5 flex flex-col items-center justify-center p-4">
                  <span className="text-xs font-bold text-primary uppercase">{date.month}</span>
                  <span className="text-3xl font-display font-bold text-[#0B1640]">{date.day}</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase">{date.weekday}</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        event.event_type === "online" ? "bg-orange-500/10 text-orange-400" : "bg-purple-500/10 text-purple-400"
                      } capitalize`}>
                        {event.event_type}
                      </span>
                    </div>

                    <h3 className="text-xl font-display font-bold text-[#0B1640] leading-tight">
                      {event.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground/80">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {date.time}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {event.event_type === "online" ? (
                          <><Video className="w-4 h-4" /> Virtual Event</>
                        ) : (
                          <><MapPin className="w-4 h-4" /> {event.location || "TBA"}</>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        {event.attendees_count || 0} attending
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRsvp(event.id)}
                      disabled={rsvpLoading === event.id || rsvpedIds.has(event.id)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-[#0B1640] transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                      style={{ background: rsvpedIds.has(event.id) ? "linear-gradient(145deg,#22c55e,#16a34a)" : "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
                    >
                      {rsvpedIds.has(event.id) ? (
                        <><CheckCircle className="w-4 h-4" /> RSVPed!</>
                      ) : rsvpLoading === event.id ? (
                        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                      ) : "RSVP Now"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EventsCalendar;

