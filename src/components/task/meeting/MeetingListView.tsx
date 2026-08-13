"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Lock, Play, Plus, Search, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Meeting, MeetingFilter } from "@/types/meeting";
import type { OfficeUser } from "@/types/taskManager";

const MEETING_CACHE_KEY = "task-meetings-cache-v1";

type InviteStatus = "pending" | "accepted" | "declined" | "no_response";
type InvitationFilter = "pending" | "accepted" | "declined";
type InviteMeta = {
  status: InviteStatus;
  invitedById?: string;
  invitedAt?: string;
};

interface MeetingListViewProps {
  officeUser: OfficeUser;
  accessToken?: string | null;
  publicTeamOngoingEnabled?: boolean;
  onSelectMeeting?: (meeting: Meeting) => void;
  onCreateMeeting?: () => void;
}

export const MeetingListView: React.FC<MeetingListViewProps> = ({
  officeUser,
  accessToken,
  publicTeamOngoingEnabled = false,
  onSelectMeeting,
  onCreateMeeting,
}) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MeetingFilter>("upcoming");
  const [invitationFilter, setInvitationFilter] = useState<InvitationFilter>("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCachedMode, setIsCachedMode] = useState(false);
  const [principalUserId, setPrincipalUserId] = useState<string>(officeUser.id);
  const [inviteStatusByMeetingId, setInviteStatusByMeetingId] = useState<Record<string, InviteStatus>>({});
  const [inviteMetaByMeetingId, setInviteMetaByMeetingId] = useState<Record<string, InviteMeta>>({});
  const [inviterNameById, setInviterNameById] = useState<Record<string, string>>({});
  const [inviteActionBusyMeetingId, setInviteActionBusyMeetingId] = useState<string | null>(null);

  const readMeetingCache = (): Meeting[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(MEETING_CACHE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Meeting[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeMeetingCache = (all: Meeting[]) => {
    if (typeof window === "undefined") return;
    try {
      const deduped = Array.from(new Map(all.map((meeting) => [meeting.id, meeting])).values()).slice(0, 200);
      window.localStorage.setItem(MEETING_CACHE_KEY, JSON.stringify(deduped));
    } catch {
      // Ignore cache write failures.
    }
  };

  const loadFromCache = () => {
    const cached = readMeetingCache();
    setMeetings(cached);
    return cached.length > 0;
  };

  const resolvePrincipalUserId = useCallback(async () => {
    let resolved = officeUser.id;
    if (accessToken) {
      try {
        const { data } = await supabase.auth.getUser(accessToken);
        if (data?.user?.id) resolved = data.user.id;
      } catch {
        // Keep officeUser.id fallback
      }
    }
    setPrincipalUserId(resolved);
    return resolved;
  }, [accessToken, officeUser.id]);

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      await resolvePrincipalUserId();
      if (!accessToken) {
        loadFromCache();
        return;
      }
      const response = await fetch("/api/meetings/list?withInvites=1", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Meetings API returned a non-JSON response.");
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const msg = typeof (payload as { error?: unknown })?.error === "string"
          ? (payload as { error: string }).error
          : "Failed to load meetings";
        throw new Error(msg);
      }
      const body = (await response.json()) as { meetings: Meeting[]; invites: Array<Record<string, unknown>> };
      const all = body.meetings ?? [];
      const invites = body.invites ?? [];
      setIsCachedMode(false);
      writeMeetingCache(all);
      setMeetings(all);

      const statusMap: Record<string, InviteStatus> = {};
      const metaMap: Record<string, InviteMeta> = {};
      const nameMap: Record<string, string> = {};
      for (const row of invites) {
        const meetingId = String(row.meeting_id ?? "");
        if (!meetingId) continue;
        const status = ((row.invite_status as string) || "pending") as InviteStatus;
        statusMap[meetingId] = status;
        metaMap[meetingId] = {
          status,
          invitedById: typeof row.invited_by_id === "string" ? row.invited_by_id : undefined,
          invitedAt: typeof row.invite_sent_at === "string" ? row.invite_sent_at : undefined,
        };
        if (typeof row.invited_by_id === "string" && typeof row.inviter_name === "string") {
          nameMap[row.invited_by_id] = row.inviter_name;
        }
      }
      setInviteStatusByMeetingId(statusMap);
      setInviteMetaByMeetingId(metaMap);
      setInviterNameById(nameMap);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      const loaded = loadFromCache();
      if (!loaded) {
        const message = error instanceof Error && error.message ? error.message : "Failed to load meetings";
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken, resolvePrincipalUserId]);

  // SSE-based realtime would belong here once /api/messenger/stream
  // emits meeting:update events. For now, refresh on tab focus to catch
  // edits from other devices.
  useEffect(() => {
    void fetchMeetings();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void fetchMeetings();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchMeetings]);

  const invitationCounts = useMemo(() => {
    const counts = { pending: 0, accepted: 0, declined: 0 };
    Object.values(inviteStatusByMeetingId).forEach((status) => {
      if (status === "accepted") counts.accepted += 1;
      else if (status === "declined") counts.declined += 1;
      else counts.pending += 1;
    });
    return counts;
  }, [inviteStatusByMeetingId]);

  const filteredMeetings = useMemo(() => {
    const now = new Date();
    const text = searchTerm.trim().toLowerCase();
    let next = meetings;

    if (filter === "upcoming") {
      next = meetings.filter((m) => m.status === "scheduled" && (!!m.scheduled_start && new Date(m.scheduled_start) >= now));
      next = [...next].sort((a, b) => (a.scheduled_start || "").localeCompare(b.scheduled_start || ""));
    } else if (filter === "ongoing") {
      const min = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      next = meetings.filter((m) => m.status === "ongoing" && (!m.actual_start || new Date(m.actual_start) >= min));
      next = [...next].sort((a, b) => (b.actual_start || "").localeCompare(a.actual_start || ""));
    } else if (filter === "past") {
      next = meetings.filter((m) => m.status === "ended");
      next = [...next].sort((a, b) => (b.actual_end || "").localeCompare(a.actual_end || "")).slice(0, 30);
    } else if (filter === "invitations") {
      next = meetings.filter((m) => {
        const inviteStatus = inviteStatusByMeetingId[m.id];
        if (!inviteStatus) return false;
        if (invitationFilter === "pending") return inviteStatus === "pending" || inviteStatus === "no_response";
        return inviteStatus === invitationFilter;
      });
      next = [...next].sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
    }

    if (!text) return next;
    return next.filter((m) => {
      const haystack = `${m.title || ""} ${m.code || ""} ${m.description || ""}`.toLowerCase();
      return haystack.includes(text);
    });
  }, [filter, invitationFilter, inviteStatusByMeetingId, meetings, searchTerm]);

  const updateInviteStatus = async (meeting: Meeting, status: "accepted" | "declined", joinAfterAccept = false) => {
    if (!principalUserId) {
      toast.error("Unable to resolve current user. Please refresh and try again.");
      return;
    }
    try {
      setInviteActionBusyMeetingId(meeting.id);
      const { error } = await supabase
        .from("meeting_invites")
        .update({
          invite_status: status,
          response_at: new Date().toISOString(),
        })
        .eq("meeting_id", meeting.id)
        .eq("invited_user_id", principalUserId);
      if (error) throw error;

      setInviteStatusByMeetingId((prev) => ({ ...prev, [meeting.id]: status }));
      toast.success(status === "accepted" ? "Invitation accepted." : "Invitation declined.");
      if (status === "accepted" && joinAfterAccept) {
        onSelectMeeting?.(meeting);
      }
    } catch (error) {
      console.error("Failed to update invitation status:", error);
      toast.error("Unable to update invitation. Please retry.");
    } finally {
      setInviteActionBusyMeetingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["upcoming", "ongoing", "past", "invitations"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {f === "invitations" ? `Invitations (${invitationCounts.pending + invitationCounts.accepted + invitationCounts.declined})` : `${f.charAt(0).toUpperCase()}${f.slice(1)}`}
            </button>
          ))}
        </div>
        <button
          onClick={() => onCreateMeeting?.()}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
        >
          <Plus size={14} /> New Meeting
        </button>
      </div>

      {filter === "invitations" && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
          {([
            { key: "pending", label: `Pending (${invitationCounts.pending})` },
            { key: "accepted", label: `Accepted (${invitationCounts.accepted})` },
            { key: "declined", label: `Declined (${invitationCounts.declined})` },
          ] as const).map((item) => (
            <button
              key={item.key}
              onClick={() => setInvitationFilter(item.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                invitationFilter === item.key
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {isCachedMode && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Running in cached mode until DB patch is applied. Meeting data may be slightly delayed.
        </div>
      )}
      {publicTeamOngoingEnabled && (
        <div className="rounded-lg border border-orange-200 bg-sky-50 px-3 py-2 text-xs text-orange-800">
          Public team ongoing meetings enabled by admin. Non-invited internal users can discover live rooms.
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        <input
          placeholder={filter === "invitations" ? "Search invitations..." : "Search meetings..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
            Loading meetings...
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
            {searchTerm ? "No meetings match your search" : filter === "invitations" ? `No ${invitationFilter} invitations` : `No ${filter} meetings`}
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              filter={filter}
              inviteStatus={inviteStatusByMeetingId[meeting.id]}
              inviteMeta={inviteMetaByMeetingId[meeting.id]}
              invitedByName={inviteMetaByMeetingId[meeting.id]?.invitedById ? inviterNameById[inviteMetaByMeetingId[meeting.id]?.invitedById || ""] : undefined}
              inviteActionBusy={inviteActionBusyMeetingId === meeting.id}
              onJoin={() => onSelectMeeting?.(meeting)}
              onAccept={() => void updateInviteStatus(meeting, "accepted", true)}
              onDecline={() => void updateInviteStatus(meeting, "declined")}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface MeetingCardProps {
  meeting: Meeting;
  filter: MeetingFilter;
  inviteStatus?: InviteStatus;
  inviteMeta?: InviteMeta;
  invitedByName?: string;
  inviteActionBusy?: boolean;
  onJoin: () => void;
  onAccept: () => void;
  onDecline: () => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  filter,
  inviteStatus,
  inviteMeta,
  invitedByName,
  inviteActionBusy = false,
  onJoin,
  onAccept,
  onDecline,
}) => {
  const isOngoing = meeting.status === "ongoing";
  const isScheduled = meeting.status === "scheduled";
  const isPast = meeting.status === "ended";
  const isInvitationsView = filter === "invitations";
  const inviteState = inviteStatus || "pending";

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isInvitationsView
          ? inviteState === "accepted"
            ? "border-emerald-200 bg-emerald-50/50"
            : inviteState === "declined"
              ? "border-slate-300 bg-slate-100/70"
              : "border-indigo-200 bg-indigo-50/70"
          : isOngoing
            ? "border-emerald-200 bg-emerald-50/50"
            : isScheduled
              ? "border-orange-200 bg-blue-50/50"
              : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-slate-900">{meeting.title}</p>
            {meeting.is_locked ? <Lock size={12} className="shrink-0 text-amber-600" /> : null}
            {isOngoing ? (
              <span className="shrink-0 flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            ) : null}
            {isInvitationsView ? (
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                  inviteState === "accepted"
                    ? "bg-emerald-100 text-emerald-700"
                    : inviteState === "declined"
                      ? "bg-slate-200 text-slate-700"
                      : "bg-indigo-100 text-indigo-700"
                }`}
              >
                {inviteState === "no_response" ? "pending" : inviteState}
              </span>
            ) : null}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-slate-600">
            {isScheduled && meeting.scheduled_start ? (
              <>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{formatDate(meeting.scheduled_start)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatTime(meeting.scheduled_start)}</span>
                </div>
              </>
            ) : null}
            {isOngoing && meeting.actual_start ? (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>Started {formatTime(meeting.actual_start)}</span>
              </div>
            ) : null}
            {isPast ? (
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{getDuration(meeting.actual_start, meeting.actual_end)}</span>
              </div>
            ) : null}
            <div className="flex items-center gap-1">
              <Users size={12} />
              <span>Code {meeting.code}</span>
            </div>
          </div>

          {meeting.description ? (
            <p className="mt-2 line-clamp-2 text-xs text-slate-600">{meeting.description}</p>
          ) : null}
          {isInvitationsView ? (
            <>
              <p className="mt-2 text-[11px] text-slate-600">
                Invited by{" "}
                <span className="font-medium text-slate-800">
                  {invitedByName || (inviteMeta?.invitedById ? "Team member" : "Unknown")}
                </span>
                {" · "}
                <span>{inviteMeta?.invitedAt ? new Date(inviteMeta.invitedAt).toLocaleString() : "time unknown"}</span>
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                <a
                  href={`/meeting/join/${meeting.code}`}
                  className="rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  Live invite link
                </a>
                <button
                  type="button"
                  onClick={() => {
                    const link = `${window.location.origin}/meeting/join/${meeting.code}`;
                    void navigator.clipboard.writeText(link);
                    toast.success("Invite link copied.");
                  }}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Copy link
                </button>
              </div>
            </>
          ) : null}
        </div>

        <div className="shrink-0">
          {!isInvitationsView ? (
            <button
              onClick={onJoin}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                isOngoing
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : isScheduled
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {isOngoing ? (
                <span className="flex items-center gap-1">
                  <Play size={12} /> Join
                </span>
              ) : isScheduled ? (
                "View"
              ) : (
                "Details"
              )}
            </button>
          ) : inviteState === "pending" || inviteState === "no_response" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onDecline}
                disabled={inviteActionBusy}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Decline
              </button>
              <button
                onClick={onAccept}
                disabled={inviteActionBusy}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                Accept & Join
              </button>
            </div>
          ) : inviteState === "accepted" ? (
            <button
              onClick={onJoin}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500"
            >
              Join
            </button>
          ) : (
            <button
              onClick={onAccept}
              disabled={inviteActionBusy}
              className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
            >
              Accept
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatTime(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getDuration(start: string | undefined, end: string | undefined): string {
  if (!start || !end) return "-";
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const minutes = Math.floor((e - s) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default MeetingListView;
