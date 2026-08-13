import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ArrowLeft, Video, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  lmsGetLiveSessionForLesson, lmsLiveAttendanceHeartbeat,
  lmsRegisterZohoSession,
  type LmsLiveSession,
} from "@/lib/lmsClient";
import { useLmsAuth } from "@/contexts/LmsAuthContext";
import LiveEngagementPanel from "@/components/learn/LiveEngagementPanel";
import LiveReactionsOverlay from "@/components/learn/LiveReactionsOverlay";
import LivePlayerControls from "@/components/learn/LivePlayerControls";
import { Bookmark } from "lucide-react";
import { lmsCreateBookmark, lmsListBookmarks, lmsDeleteBookmark, type LiveBookmark, lmsGetLivePermissions } from "@/lib/lmsClient";

interface Props {
  courseSlug: string;
  lessonId: string;
  lessonTitle: string;
}

const HEARTBEAT_MS = 30_000;

export default function LearnLive({ courseSlug, lessonId, lessonTitle }: Props) {
  const { user } = useLmsAuth();
  const [session, setSession] = useState<LmsLiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<LiveBookmark[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [bandwidthMode, setBandwidthMode] = useState<"auto" | "saver">("auto");
  const [canModerate, setCanModerate] = useState(false);

  useEffect(() => {
    if (!session) return;
    void (async () => {
      const p = await lmsGetLivePermissions(session.id);
      setCanModerate(p.canModerate);
    })();
  }, [session?.id]);

  // Hydrate bookmarks once the session is loaded. We compute the
  // "moment in video" client-side by subtracting started-watching time
  // from now() — accurate to within a few seconds for live; for replay
  // we'd ideally read the iframe's currentTime but Bunny doesn't expose
  // it. The relative-time bookmark is still useful for jump-to in replay.
  useEffect(() => {
    if (!session) return;
    startTimeRef.current = Date.now();
    void (async () => setBookmarks(await lmsListBookmarks(session.id)))();
  }, [session?.id]);

  async function bookmarkNow() {
    if (!session) return;
    const seconds = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
    const b = await lmsCreateBookmark(session.id, seconds, null);
    if (b) setBookmarks((prev) => [...prev, b].sort((a, b) => a.positionSeconds - b.positionSeconds));
  }
  async function removeBookmark(id: string) {
    if (!session) return;
    const ok = await lmsDeleteBookmark(session.id, id);
    if (ok) setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await lmsGetLiveSessionForLesson(lessonId);
        if (!cancelled) setSession(s);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Failed to load live session.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lessonId]);

  // Re-poll the session every 30s while the broadcast is configured but
  // not yet ended — flips iframe → VOD as soon as the recording is ready.
  useEffect(() => {
    if (!session || session.ended_at || session.provider !== "bunny") return;
    const id = window.setInterval(async () => {
      try {
        const s = await lmsGetLiveSessionForLesson(lessonId);
        if (s) setSession(s);
      } catch { /* swallow */ }
    }, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [session?.id, session?.ended_at, session?.provider, lessonId]);

  // Attendance heartbeat — fires on mount, then every 30s while the tab
  // is visible. Pauses when the tab is hidden so background tabs don't
  // skew "watch minutes" for users who walked away.
  useEffect(() => {
    if (!session) return;
    let id: number | null = null;
    function tick() {
      if (document.visibilityState !== "visible") return;
      void lmsLiveAttendanceHeartbeat(session!.id);
    }
    tick();
    id = window.setInterval(tick, HEARTBEAT_MS);
    return () => { if (id !== null) window.clearInterval(id); };
  }, [session?.id]);

  // Per-learner Zoho join URL — fetched JIT when the session is on Zoho.
  // These hooks MUST sit above the early returns below so React's hook
  // order stays stable across render cycles.
  const [zohoJoinUrl, setZohoJoinUrl] = useState<string | null>(null);
  const [zohoLoading, setZohoLoading] = useState(false);
  const [zohoClosed, setZohoClosed] = useState(false);
  useEffect(() => {
    if (session?.provider !== "zoho" || !session?.id || zohoJoinUrl) return;
    if (session.attendees_enabled === false) {
      setZohoClosed(true);
      return;
    }
    setZohoLoading(true);
    void lmsRegisterZohoSession(session.id)
      .then((url) => {
        if (url) setZohoJoinUrl(url);
        else setZohoClosed(true);
      })
      .finally(() => setZohoLoading(false));
  }, [session?.provider, session?.id, session?.attendees_enabled, zohoJoinUrl]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-orange-600" /></div>;
  }
  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center text-slate-500">
        <p>This live session hasn&apos;t been scheduled yet.</p>
        <Link to={`/learn/c/${courseSlug}`} className="mt-3 inline-block text-orange-600 hover:underline">Back to course</Link>
      </div>
    );
  }

  const joinUrl = session.meeting_code ? `/meeting/join/${session.meeting_code}` : null;
  const start = session.scheduled_start ? new Date(session.scheduled_start) : null;
  const end = session.scheduled_end ? new Date(session.scheduled_end) : null;
  const isLive = session.status === "live" || Boolean(session.went_live_at && !session.ended_at);
  const isEnded = session.status === "ended" || session.status === "cancelled" || Boolean(session.ended_at);
  const isBunny = session.provider === "bunny";
  const isZoho = session.provider === "zoho";
  const hasRecording = Boolean(session.recording_video_id);

  const showEngagement = isBunny && (isLive || hasRecording);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link to={`/learn/c/${courseSlug}`} className="inline-flex items-center gap-2 text-sm text-slate-500 mb-6 hover:text-slate-900 dark:hover:text-slate-100">
        <ArrowLeft className="h-4 w-4" /> Back to course
      </Link>

      <div style={{
        display: "grid",
        gridTemplateColumns: showEngagement ? "minmax(0, 1fr) 340px" : "1fr",
        gap: 16,
        alignItems: "start",
      }}>
      <div className="rounded-lg border border-slate-200 dark:border-[#404040] bg-white dark:bg-[#f3f5f8] p-6">
        <div className="flex items-center gap-3 mb-2">
          <Video className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold">{session.title}</h1>
          <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
            isLive ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
            : isEnded ? "bg-slate-200 dark:bg-[#404040] text-slate-700 dark:text-slate-300"
            : "bg-blue-100 text-orange-700 dark:bg-[#f3f5f8]/40 dark:text-orange-200"
          }`}>
            {isLive ? "● LIVE NOW" : isEnded ? (hasRecording ? "REPLAY" : "ENDED") : "SCHEDULED"}
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">Lesson: {lessonTitle}</p>

        {start && (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <Calendar className="h-4 w-4" />
            <span>{start.toLocaleString()}{end && ` → ${end.toLocaleString()}`}</span>
          </div>
        )}

        {/* Bunny iframe player — covers the live-stream and replay cases.
            We use Bunny's hosted player (iframe.mediadelivery.net) rather
            than rolling our own hls.js because it handles LL-HLS, autoplay
            policy, mobile fullscreen, and adaptive bitrate out of the box.
            For the replay state we also embed the iframe since Bunny
            promotes the live video to a VOD with the same guid. */}
        {isBunny && (isLive || hasRecording) && session.playback_iframe ? (
          <div className="mt-6 rounded-md overflow-hidden bg-black" style={{ position: "relative", aspectRatio: "16 / 9" }}>
            <iframe
              ref={iframeRef}
              src={bandwidthMode === "saver"
                ? `${session.playback_iframe}${session.playback_iframe.includes("?") ? "&" : "?"}preload=metadata&autoplay=true&quality=240p`
                : session.playback_iframe}
              loading="eager"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ border: 0, width: "100%", height: "100%" }}
              title={session.title}
            />
            {/* Reactions float over the player without intercepting clicks
                (pointer-events:none on the overlay, pointer-events:auto on
                the dock). Only enabled during live broadcasts — replays
                hide the dock so the recording doesn't get reaction spam. */}
            <LiveReactionsOverlay sessionId={session.id} canEmit={isLive} />
          </div>
        ) : null}

        {/* Zoho Webinar player. Zoho's webinar pages set X-Frame-Options
            depending on the org's "Embed Webinar" feature flag (visible
            on this account per /api/v2/user.json → embedWebinar:true). We
            always render the iframe with the per-learner join URL and
            ALSO show an "Open in new tab" fallback button just below in
            case the iframe gets sandboxed by Zoho. */}
        {isZoho ? (
          <div className="mt-6">
            {zohoJoinUrl ? (
              <div className="rounded-md overflow-hidden bg-black" style={{ position: "relative", aspectRatio: "16 / 9" }}>
                <iframe
                  src={zohoJoinUrl}
                  loading="eager"
                  allow="camera; microphone; autoplay; encrypted-media; display-capture; fullscreen"
                  allowFullScreen
                  style={{ border: 0, width: "100%", height: "100%" }}
                  title={session.title}
                />
              </div>
            ) : zohoClosed ? (
              <div className="rounded-md border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1c1c1c] p-8 text-center">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Registration closed for this session.</p>
                <p className="mt-1 text-xs text-slate-500">Your cohort administrator has paused new registrations. Reach out if you believe this is in error.</p>
              </div>
            ) : zohoLoading ? (
              <div className="rounded-md border border-slate-200 dark:border-[#404040] bg-slate-50 dark:bg-[#1c1c1c] p-12 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-orange-600" />
                <p className="mt-3 text-sm text-slate-500">Preparing your session…</p>
              </div>
            ) : (
              <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-6 text-center">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Couldn&rsquo;t prepare your seat. This usually means your account is missing an email — contact your admin if it persists.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {isBunny && (isLive || hasRecording) ? (
          <LivePlayerControls
            sessionId={session.id}
            iframeRef={iframeRef}
            onBandwidthChange={setBandwidthMode}
            canModerate={canModerate}
          />
        ) : null}

        {isBunny && (isLive || hasRecording) ? (
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
            <button
              type="button"
              onClick={bookmarkNow}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 12px",
                border: "1px solid var(--learn-border, #e5e7eb)",
                borderRadius: 999,
                background: "rgba(234, 88, 12, 0.06)",
                color: "var(--learn-accent-2, #ea580c)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
              title="Save this moment to your bookmarks"
            >
              <Bookmark size={12} /> Bookmark this moment
            </button>
            {bookmarks.length > 0 ? (
              <span style={{ fontSize: 11, color: "var(--learn-muted, #6b7280)", display: "inline-flex", flexWrap: "wrap", gap: 4 }}>
                {bookmarks.map((b) => {
                  const m = Math.floor(b.positionSeconds / 60);
                  const s = b.positionSeconds % 60;
                  const tc = `${m}:${s.toString().padStart(2, "0")}`;
                  return (
                    <span key={b.id} style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      padding: "2px 8px",
                      border: "1px solid var(--learn-border, #e5e7eb)",
                      borderRadius: 999, background: "var(--learn-surface, #fff)",
                    }}>
                      {tc}
                      <button type="button" onClick={() => removeBookmark(b.id)} aria-label="Remove" style={{ border: 0, background: "transparent", color: "var(--learn-muted, #6b7280)", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  );
                })}
              </span>
            ) : null}
          </div>
        ) : null}

        {isBunny && !isLive && !hasRecording ? (
          <div className="mt-6 rounded-md border border-dashed border-slate-300 dark:border-[#454545] p-8 text-center text-sm text-slate-500">
            The broadcaster hasn&apos;t started streaming yet. This page will switch to live video automatically the moment they go on air.
          </div>
        ) : null}

        {!isBunny && session.meeting_code && (
          <div className="mt-6 rounded-md border border-slate-200 dark:border-[#404040] p-4">
            <div className="text-xs text-slate-500 mb-1">Meeting code</div>
            <div className="font-mono text-lg font-semibold">{session.meeting_code}</div>
          </div>
        )}

        {/* Manual / Jitsi fallback for sessions without Bunny / Zoho providers.
            Suppressed for Zoho because the iframe block above already covers it. */}
        {!isBunny && !isZoho && (
          <div className="mt-6 flex flex-wrap gap-2">
            {joinUrl ? (
              <Link
                to={joinUrl}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-orange-600 text-white font-medium hover:bg-orange-700"
              >
                {isLive ? "Join live now" : "Open meeting room"}
              </Link>
            ) : (
              <div className="text-sm text-slate-500">A meeting link will appear here once the host generates it.</div>
            )}
          </div>
        )}
      </div>
      {showEngagement ? (
        <LiveEngagementPanel sessionId={session.id} displayName={user?.full_name ?? user?.email ?? null} />
      ) : null}
      </div>
    </div>
  );
}
