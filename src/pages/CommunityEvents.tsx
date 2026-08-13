import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCommunityAuth } from "@/contexts/CommunityAuthContext";
import { communitySupabase as supabase } from "@/lib/communitySupabase";
import { CommunityLayout } from "@/components/community/CommunityLayout";
import { Calendar, Plus, Clock, MapPin, Video, Users, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type EventItem = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location_type: string;
  venue_name?: string | null;
  venue_address?: string | null;
  meeting_url?: string | null;
  location?: string | null;
  rsvp_count?: number | null;
  attendee_limit?: number | null;
  is_featured?: boolean | null;
  community_members?: { full_name: string | null } | null;
};

const Events = () => {
  const { member, isAdmin } = useCommunityAuth();
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
        .select(`
          *,
          community_members (
            full_name,
            avatar_url
          )
        `)
        .eq("is_cancelled", false)
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });
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
    try {
      const { error } = await supabase.from("event_rsvps").upsert(
        { event_id: eventId, member_id: member.id },
        { onConflict: "event_id,member_id" }
      );
      if (error) { toast.error("RSVP failed: " + error.message); return; }
      setRsvpedIds((prev) => new Set(prev).add(eventId));
      toast.success("You're going!");
    } catch {
      toast.error("RSVP failed. Please try again.");
    } finally {
      setRsvpLoading(null);
    }
  };

  return (
    <CommunityLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0B1640] flex items-center gap-3">
              <Calendar className="w-7 h-7 text-orange-600" />
              Events
            </h1>
            <p className="text-zinc-400 mt-1">Workshops, meetups, and community gatherings</p>
          </div>
          {isAdmin ? (
            <Link
              to="/community/events/new"
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-[#0B1640] transition-all hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(255,140,0,0.5)]"
              style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
            >
              <Plus className="w-4 h-4" />
              Create Event
            </Link>
          ) : null}
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-zinc-400">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="bg-[#232532] rounded-2xl border border-white/5 p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-zinc-400/30" />
              <p className="text-zinc-400 mb-4">No upcoming events</p>
              <p className="text-sm text-zinc-500 mb-6">Upcoming events will be announced by the ONROL team.</p>
              {isAdmin ? (
                <Link
                  to="/community/events/new"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-[#0B1640]"
                  style={{ background: "linear-gradient(145deg, #ff9c30 0%, #ff5500 100%)" }}
                >
                  <Plus className="w-4 h-4" />
                  Create Event
                </Link>
              ) : null}
            </div>
          ) : (
            events.map((event) => {
              const dateInfo = formatDate(event.event_date);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-[#232532] rounded-2xl border border-white/5 overflow-hidden hover:border-orange-500/25 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Date Card */}
                    <div className="bg-gradient-to-br from-primary/20 to-orange-300/10 p-6 flex flex-col items-center justify-center min-w-[120px]">
                      <span className="text-sm font-bold text-orange-600/70 uppercase">{dateInfo.weekday}</span>
                      <span className="text-4xl font-bold text-[#0B1640]">{dateInfo.day}</span>
                      <span className="text-sm font-bold text-orange-600/70 uppercase">{dateInfo.month}</span>
                      <span className="text-xs text-zinc-400 mt-2">{dateInfo.time}</span>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-2 mb-2">
                        {event.is_featured && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/10 text-yellow-400">
                            Featured
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-600 capitalize">
                          {event.location_type}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[#0B1640] mb-2">{event.title}</h3>
                      <p className="text-sm text-zinc-400 line-clamp-2 mb-4">{event.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 mb-4">
                        {event.location_type === "online" ? (
                          <span className="flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5" />
                            Online Event
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.venue_name || event.venue_address}
                          </span>
                        )}
                        {event.rsvp_count !== null && (
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            {event.rsvp_count} going
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Hosted by {event.community_members?.full_name || "Member"}
                        </span>
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
                        {event.meeting_url && (
                          <a
                            href={event.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-xl font-bold text-sm text-[#0B1640]/70 border border-[#0B1640]/10 hover:bg-white transition-colors"
                          >
                            Join Link
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </CommunityLayout>
  );
};

export default Events;

