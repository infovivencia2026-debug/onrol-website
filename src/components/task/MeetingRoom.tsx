"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
  PhoneOff, Copy, Check, Users, Grid2X2, LayoutTemplate,
  Clock, Signal, Wifi, WifiOff, Smile, ChevronRight,
  SwitchCamera, Share2, RefreshCw, UserPlus, MailCheck,
} from "lucide-react";
import { shareViaWhatsApp, buildMeetingShareText } from "@/lib/whatsappShare";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { OfficeUser } from "@/types/taskManager";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
];

interface MeetingRoomProps {
  officeUser: OfficeUser;
  uiTheme: "dark" | "light";
  initialJoinCode?: string | null;
  teamMembers?: OfficeUser[];
  onMeetingSessionSaved?: (session: MeetingSessionSnapshot) => void;
  onExitMeeting?: () => void;
}
interface RemoteStreamEntry { userId: string; name: string; stream: MediaStream; }
interface PresenceState { userId: string; name: string; joinedAt: string; }
type SignalMsg =
  | { type: "offer";  from: string; to: string; payload: RTCSessionDescriptionInit }
  | { type: "answer"; from: string; to: string; payload: RTCSessionDescriptionInit }
  | { type: "ice";    from: string; to: string; payload: RTCIceCandidateInit };
type ViewMode = "gallery" | "spotlight";
interface ActiveMeeting { roomCode: string; roomName: string; hostName: string; hostId: string; startedAt: string; }
export interface MeetingSessionSnapshot {
  roomCode: string;
  roomName: string;
  hostName: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  participantPeak: number;
  transcript: string;
  summary: string;
  actionItems: string[];
  decisions: string[];
}

function generateCode() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }
function subscribeAndWait(ch: RealtimeChannel): Promise<RealtimeChannel> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(ch), 5000);
    ch.subscribe((s) => { if (s === "SUBSCRIBED") { clearTimeout(t); resolve(ch); } });
  });
}
function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) { setSecs(0); return; }
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-orange-500 to-orange-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-fuchsia-500 to-purple-600",
];
function avatarGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}
function initials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ── Video tile ─────────────────────────────────────────────────────────────────
function VideoTile({
  stream, name, muted = false, isLocal = false, pinned = false,
  onPin, large = false,
}: {
  stream: MediaStream | null; name: string; muted?: boolean;
  isLocal?: boolean; pinned?: boolean; onPin?: () => void; large?: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const grad = avatarGradient(name);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.srcObject = stream;
    const check = () => setHasVideo(
      (stream?.getVideoTracks().some(t => t.enabled && t.readyState === "live")) ?? false
    );
    check();
    // Some browsers need an explicit play() call even with autoPlay.
    void ref.current.play?.().catch(() => undefined);

    const tracks = stream?.getVideoTracks() ?? [];
    const unsubs: Array<() => void> = [];
    tracks.forEach((track) => {
      const onStateChange = () => check();
      track.addEventListener("mute", onStateChange);
      track.addEventListener("unmute", onStateChange);
      track.addEventListener("ended", onStateChange);
      unsubs.push(() => {
        track.removeEventListener("mute", onStateChange);
        track.removeEventListener("unmute", onStateChange);
        track.removeEventListener("ended", onStateChange);
      });
    });

    stream?.addEventListener("addtrack", check);
    stream?.addEventListener("removetrack", check);
    return () => {
      unsubs.forEach((fn) => fn());
      stream?.removeEventListener("addtrack", check);
      stream?.removeEventListener("removetrack", check);
    };
  }, [stream]);

  return (
    <div
      onClick={onPin}
      className={`relative rounded-xl overflow-hidden bg-[#3c4043] flex items-center justify-center cursor-pointer select-none transition-all duration-200
        ${large ? "w-full h-full" : "aspect-video w-full"}
        ${pinned ? "ring-2 ring-blue-500" : ""}
        ${onPin ? "hover:ring-2 hover:ring-white/20" : ""}
      `}
    >
      {/* Video — object-contain so nothing is cropped */}
      <video
        ref={ref} autoPlay playsInline muted={isLocal}
        className={`w-full h-full object-contain transition-opacity duration-300 ${hasVideo ? "opacity-100" : "opacity-0"}`}
      />

      {/* Avatar fallback */}
      {!hasVideo && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br ${grad}`}>
          <span className={`font-bold text-white ${large ? "text-6xl" : "text-3xl"}`}>
            {initials(name)}
          </span>
          <span className={`mt-2 text-white/70 ${large ? "text-base" : "text-xs"}`}>{name}</span>
        </div>
      )}

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      {/* Name tag */}
      <div className="absolute bottom-2 left-2.5 flex items-center gap-1.5 pointer-events-none">
        {muted && <div className="rounded-full bg-red-500/90 p-0.5"><MicOff size={10} className="text-white" /></div>}
        <span className="text-white text-[11px] font-medium drop-shadow-sm bg-black/40 rounded px-1.5 py-0.5">
          {isLocal ? "You" : name}
        </span>
      </div>

      {/* Pinned badge */}
      {pinned && (
        <div className="absolute top-2 left-2 rounded-full bg-orange-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white pointer-events-none">
          Pinned
        </div>
      )}
    </div>
  );
}

// ── Reaction bubble ────────────────────────────────────────────────────────────
function ReactionBubble({ emoji, name }: { emoji: string; name: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => { const t = setTimeout(() => setVisible(false), 3500); return () => clearTimeout(t); }, []);
  if (!visible) return null;
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 text-white animate-bounce pointer-events-none">
      <span className="text-lg">{emoji}</span>
      <span className="text-xs font-medium">{name}</span>
    </div>
  );
}

// ── Control button ─────────────────────────────────────────────────────────────
function Ctrl({ active, danger = false, highlight = false, onClick, label, children, small = false }: {
  active: boolean; danger?: boolean; highlight?: boolean;
  onClick: () => void; label: string; children: React.ReactNode; small?: boolean;
}) {
  return (
    <button onClick={onClick} title={label}
      className="flex flex-col items-center gap-1 group transition-all">
      <div className={`${small ? "h-9 w-9" : "h-11 w-11"} rounded-full flex items-center justify-center transition-colors
        ${danger    ? "bg-red-600 hover:bg-red-500 text-white"
        : highlight ? "bg-blue-600 hover:bg-blue-500 text-white"
        : active    ? "bg-[#3c4043] hover:bg-[#4a4d51] text-white"
        :             "bg-[#3c4043] hover:bg-[#4a4d51] text-[#bdc1c6]"}`}>
        {children}
      </div>
      <span className={`${small ? "text-[9px]" : "text-[10px]"} text-[#9aa0a6] group-hover:text-[#bdc1c6] transition-colors hidden sm:block leading-tight`}>
        {label}
      </span>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function MeetingRoom({ officeUser, uiTheme, initialJoinCode, teamMembers = [], onMeetingSessionSaved, onExitMeeting }: MeetingRoomProps) {
  // Phase
  const [phase, setPhase] = useState<"lobby" | "room">("lobby");
  const [lobbyTab, setLobbyTab] = useState<"create" | "join">(() => initialJoinCode ? "join" : "create");

  // Lobby state (no camera stream in lobby)
  const [roomCode, setRoomCode] = useState(() => generateCode());
  const [joinCode, setJoinCode] = useState(() => initialJoinCode ?? "");
  const [roomName, setRoomName] = useState("");
  const [lobbyMuted, setLobbyMuted] = useState(false);
  const [lobbyCamOff, setLobbyCamOff] = useState(false);

  // Room controls
  const [isMuted, setIsMuted]               = useState(false);
  const [isCameraOff, setIsCameraOff]       = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [viewMode, setViewMode]             = useState<ViewMode>("gallery");
  const [pinnedId, setPinnedId]             = useState<string | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showReactions, setShowReactions]   = useState(false);
  const [reactions, setReactions]           = useState<{ id: number; emoji: string; name: string }[]>([]);
  const [codeCopied, setCodeCopied]         = useState(false);
  const [remoteStreams, setRemoteStreams]    = useState<RemoteStreamEntry[]>([]);
  const [connState, setConnState]           = useState<"connecting" | "connected" | "poor">("connecting");
  const [videoDevices, setVideoDevices]     = useState<MediaDeviceInfo[]>([]);
  const [camDeviceIdx, setCamDeviceIdx]     = useState(0);
  const [activeMeetings, setActiveMeetings] = useState<ActiveMeeting[]>([]);
  const autoJoinAttemptedRef = useRef(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviteQuery, setInviteQuery] = useState("");
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<string[]>([]);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [transcriptChunks, setTranscriptChunks] = useState<string[]>([]);
  const [transcriptionActive, setTranscriptionActive] = useState(false);

  // Refs
  const localStreamRef   = useRef<MediaStream | null>(null);
  const localVideoRef    = useRef<HTMLVideoElement>(null);
  const peersRef         = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef       = useRef<RealtimeChannel | null>(null);
  const lobbyChannelRef  = useRef<RealtimeChannel | null>(null);
  const iceBufRef        = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const roomCodeRef      = useRef("");
  const reactionIdRef    = useRef(0);
  const sessionStartedAtRef = useRef<string | null>(null);
  const participantPeakRef = useRef(1);
  const recognitionRef = useRef<unknown>(null);
  const manualStopRecognitionRef = useRef(false);

  const timer = useTimer(phase === "room");
  const participantCount = 1 + remoteStreams.length;
  const myName = officeUser.full_name || officeUser.email;
  const dark = uiTheme === "dark";

  const buildMeetingSummary = useCallback((transcript: string, durationSeconds: number, participantPeak: number) => {
    const minutes = Math.max(1, Math.round(durationSeconds / 60));
    const text = transcript.replace(/\s+/g, " ").trim();
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const line1 = `Duration ${minutes} min with peak ${participantPeak} participant${participantPeak > 1 ? "s" : ""}.`;
    const line2 = sentences[0] || "Discussion recap was limited due to low transcript capture.";
    const line3 = sentences[1] || "Open the transcript for complete details and context.";
    return `${line1}\n${line2}\n${line3}`;
  }, []);

  const extractActionItemsAndDecisions = useCallback((transcript: string) => {
    const normalized = transcript.replace(/\s+/g, " ").trim();
    if (!normalized) {
      return {
        actionItems: [] as string[],
        decisions: [] as string[],
      };
    }

    const statements = normalized
      .split(/(?<=[.!?])\s+/)
      .map((row) => row.trim())
      .filter(Boolean);

    const actionSignals = /\b(will|should|need to|needs to|must|assign|assigned|follow up|todo|action|next step|prepare|send|share|schedule|review|complete)\b/i;
    const decisionSignals = /\b(decided|decision|agreed|approved|finalized|confirmed|resolved|we chose|locked)\b/i;

    const actionItems = statements
      .filter((line) => actionSignals.test(line))
      .slice(0, 8)
      .map((line) => line.replace(/\s+/g, " ").trim());
    const decisions = statements
      .filter((line) => decisionSignals.test(line))
      .slice(0, 8)
      .map((line) => line.replace(/\s+/g, " ").trim());

    return {
      actionItems: Array.from(new Set(actionItems)),
      decisions: Array.from(new Set(decisions)),
    };
  }, []);

  // ── Enumerate cameras ──────────────────────────────────────────────────────
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      setVideoDevices(devices.filter(d => d.kind === "videoinput"));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (phase !== "room") return;
    participantPeakRef.current = Math.max(participantPeakRef.current, participantCount);
  }, [participantCount, phase]);

  // ── Active meetings lobby channel ──────────────────────────────────────────
  useEffect(() => {
    const ch = supabase.channel("onrol-active-meetings", {
      config: { presence: { key: officeUser.id } },
    });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState() as Record<string, ActiveMeeting[]>;
      const meetings = Object.values(state).flat().filter(m => m.roomCode && m.hostId !== officeUser.id);
      // Deduplicate by roomCode (keep latest)
      const seen = new Map<string, ActiveMeeting>();
      Object.values(state).flat().forEach(m => { if (m.roomCode) seen.set(m.roomCode, m); });
      setActiveMeetings(Array.from(seen.values()).filter(m => m.hostId !== officeUser.id));
      void meetings;
    });
    ch.subscribe();
    lobbyChannelRef.current = ch;
    return () => { void supabase.removeChannel(ch); lobbyChannelRef.current = null; };
  }, [officeUser.id]);

  useEffect(() => {
    if (phase !== "room") return;
    const ctor = (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;
    if (!ctor) {
      setTranscriptionActive(false);
      return;
    }

    manualStopRecognitionRef.current = false;
    const recognition = new ctor() as {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      const rows = event.results;
      if (!rows) return;
      const nextParts: string[] = [];
      for (let i = 0; i < rows.length; i += 1) {
        const line = rows[i]?.[0]?.transcript?.trim();
        if (line) nextParts.push(line);
      }
      if (nextParts.length) {
        setTranscriptChunks((prev) => [...prev, ...nextParts].slice(-300));
      }
    };
    recognition.onerror = () => {
      setTranscriptionActive(false);
    };
    recognition.onend = () => {
      if (manualStopRecognitionRef.current || phase !== "room") {
        setTranscriptionActive(false);
        return;
      }
      try {
        recognition.start();
        setTranscriptionActive(true);
      } catch {
        setTranscriptionActive(false);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setTranscriptionActive(true);
    } catch {
      setTranscriptionActive(false);
    }

    return () => {
      manualStopRecognitionRef.current = true;
      try {
        (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
      } catch {}
      recognitionRef.current = null;
      setTranscriptionActive(false);
    };
  }, [phase]);

  // ── Peer factory ──────────────────────────────────────────────────────────
  const createPeer = useCallback((remoteUserId: string, remoteName: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, bundlePolicy: "max-bundle" });
    pc.onicecandidate = (e) => {
      if (!e.candidate || !channelRef.current) return;
      void channelRef.current.send({ type: "broadcast", event: "signal",
        payload: { type: "ice", from: officeUser.id, to: remoteUserId, payload: e.candidate.toJSON() } as SignalMsg });
    };
    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (!stream) return;
      setRemoteStreams(prev => {
        const ex = prev.find(r => r.userId === remoteUserId);
        return ex ? prev.map(r => r.userId === remoteUserId ? { ...r, stream } : r)
                  : [...prev, { userId: remoteUserId, name: remoteName, stream }];
      });
      setConnState("connected");
    };
    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") setConnState("connected");
      if (s === "disconnected" || s === "failed" || s === "closed") {
        peersRef.current.delete(remoteUserId);
        setRemoteStreams(prev => prev.filter(r => r.userId !== remoteUserId));
      }
    };
    if (localStreamRef.current)
      localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current!));
    peersRef.current.set(remoteUserId, pc);
    return pc;
  }, [officeUser.id]);

  // ── Signal handler ────────────────────────────────────────────────────────
  const handleSignal = useCallback(async (msg: SignalMsg) => {
    if (msg.to !== officeUser.id || msg.from === officeUser.id) return;
    if (msg.type === "offer") {
      let pc = peersRef.current.get(msg.from);
      if (!pc) {
        const ps = channelRef.current?.presenceState() as Record<string, PresenceState[]> | undefined;
        const name = ps ? Object.values(ps).flat().find(p => p.userId === msg.from)?.name ?? msg.from : msg.from;
        pc = createPeer(msg.from, name);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
      for (const c of iceBufRef.current.get(msg.from) ?? []) void pc.addIceCandidate(new RTCIceCandidate(c));
      iceBufRef.current.delete(msg.from);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      void channelRef.current?.send({ type: "broadcast", event: "signal",
        payload: { type: "answer", from: officeUser.id, to: msg.from, payload: answer } as SignalMsg });
    } else if (msg.type === "answer") {
      const pc = peersRef.current.get(msg.from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(msg.payload));
        for (const c of iceBufRef.current.get(msg.from) ?? []) void pc.addIceCandidate(new RTCIceCandidate(c));
        iceBufRef.current.delete(msg.from);
      }
    } else if (msg.type === "ice") {
      const pc = peersRef.current.get(msg.from);
      if (pc?.remoteDescription) void pc.addIceCandidate(new RTCIceCandidate(msg.payload));
      else {
        const buf = iceBufRef.current.get(msg.from) ?? [];
        buf.push(msg.payload); iceBufRef.current.set(msg.from, buf);
      }
    }
  }, [officeUser.id, createPeer]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const cleanupRoom = useCallback(() => {
    peersRef.current.forEach(pc => pc.close()); peersRef.current.clear();
    localStreamRef.current?.getTracks().forEach(t => t.stop()); localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (channelRef.current) { void supabase.removeChannel(channelRef.current); channelRef.current = null; }
    iceBufRef.current.clear();
    setRemoteStreams([]); setIsMuted(false); setIsCameraOff(false); setIsScreenSharing(false);
    setConnState("connecting"); setPinnedId(null);
  }, []);
  useEffect(() => () => { cleanupRoom(); }, [cleanupRoom]);

  // ── Join room (camera starts HERE, not in lobby) ──────────────────────────
  const joinRoom = useCallback(async (code: string) => {
    let stream: MediaStream;
    const camConstraints = videoDevices[camDeviceIdx]
      ? { deviceId: { exact: videoDevices[camDeviceIdx].deviceId } }
      : { facingMode: "user" };
    // Try with video first, progressively fall back if camera unavailable
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: { ...camConstraints, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } catch {
          stream = new MediaStream(); // no devices at all — join silently
        }
      }
    }

    if (lobbyMuted) stream.getAudioTracks().forEach(t => { t.enabled = false; });
    if (lobbyCamOff) stream.getVideoTracks().forEach(t => { t.enabled = false; });

    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;

    const ch = supabase.channel(`meeting-room:${code}`, { config: { presence: { key: officeUser.id } } })
      .on("broadcast", { event: "signal" }, ({ payload }: { payload: SignalMsg }) => void handleSignal(payload))
      .on("presence", { event: "join" }, ({ newPresences }: { newPresences: PresenceState[] }) => {
        newPresences.forEach(async (p) => {
          if (p.userId === officeUser.id) return;
          if (officeUser.id < p.userId) {
            const pc = createPeer(p.userId, p.name);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            void channelRef.current?.send({ type: "broadcast", event: "signal",
              payload: { type: "offer", from: officeUser.id, to: p.userId, payload: offer } as SignalMsg });
          }
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }: { leftPresences: PresenceState[] }) => {
        leftPresences.forEach(p => {
          peersRef.current.get(p.userId)?.close(); peersRef.current.delete(p.userId);
          setRemoteStreams(prev => prev.filter(r => r.userId !== p.userId));
        });
      });

    channelRef.current = await subscribeAndWait(ch); roomCodeRef.current = code;
    await channelRef.current.track({ userId: officeUser.id, name: myName, joinedAt: new Date().toISOString() } satisfies PresenceState);

    const existing = Object.values(channelRef.current.presenceState() as Record<string, PresenceState[]>)
      .flat().filter(p => p.userId !== officeUser.id);
    for (const p of existing) {
      if (officeUser.id < p.userId) {
        const pc = createPeer(p.userId, p.name);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        void channelRef.current.send({ type: "broadcast", event: "signal",
          payload: { type: "offer", from: officeUser.id, to: p.userId, payload: offer } as SignalMsg });
      }
    }
    setIsMuted(lobbyMuted);
    setIsCameraOff(lobbyCamOff);

    // Announce this meeting in the lobby channel so others can see it
    if (lobbyChannelRef.current) {
      void lobbyChannelRef.current.track({
        roomCode: code,
        roomName: roomName || "Meeting",
        hostName: myName,
        hostId: officeUser.id,
        startedAt: new Date().toISOString(),
      } satisfies ActiveMeeting);
    }

    sessionStartedAtRef.current = new Date().toISOString();
    participantPeakRef.current = 1;
    setTranscriptChunks([]);
    setPhase("room");
  }, [officeUser, handleSignal, createPeer, myName, lobbyMuted, lobbyCamOff, videoDevices, camDeviceIdx, roomName]);

  const leaveRoom = useCallback(() => {
    manualStopRecognitionRef.current = true;
    try {
      (recognitionRef.current as { stop?: () => void } | null)?.stop?.();
    } catch {}
    recognitionRef.current = null;
    setTranscriptionActive(false);

    const endedAtIso = new Date().toISOString();
    const startedAtIso = sessionStartedAtRef.current;
    const durationSeconds = startedAtIso
      ? Math.max(0, Math.floor((new Date(endedAtIso).getTime() - new Date(startedAtIso).getTime()) / 1000))
      : 0;
    const transcript = transcriptChunks.join(" ").replace(/\s+/g, " ").trim();
    const summary = buildMeetingSummary(transcript, durationSeconds, participantPeakRef.current);
    const { actionItems, decisions } = extractActionItemsAndDecisions(transcript);
    onMeetingSessionSaved?.({
      roomCode,
      roomName: roomName || "Meeting",
      hostName: myName,
      startedAt: startedAtIso || endedAtIso,
      endedAt: endedAtIso,
      durationSeconds,
      participantPeak: Math.max(1, participantPeakRef.current),
      transcript,
      summary,
      actionItems,
      decisions,
    });

    // Untrack from lobby announcements
    if (lobbyChannelRef.current) void lobbyChannelRef.current.untrack();
    cleanupRoom();
    setPhase("lobby");
    setRoomCode(generateCode());
    setJoinCode("");
    onExitMeeting?.();
  }, [buildMeetingSummary, cleanupRoom, extractActionItemsAndDecisions, myName, onExitMeeting, onMeetingSessionSaved, roomCode, roomName, transcriptChunks]);

  useEffect(() => {
    if (!initialJoinCode || autoJoinAttemptedRef.current) return;
    const code = initialJoinCode.trim().toUpperCase();
    if (code.length !== 6) return;
    autoJoinAttemptedRef.current = true;
    setJoinCode(code);
    setRoomCode(code);
    void joinRoom(code);
  }, [initialJoinCode, joinRoom]);

  useEffect(() => {
    if (phase === "room" && localVideoRef.current && localStreamRef.current)
      localVideoRef.current.srcObject = localStreamRef.current;
  }, [phase]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleMute   = () => { localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; }); setIsMuted(p => !p); };
  const toggleCamera = useCallback(async () => {
    const stream = localStreamRef.current;
    if (!stream) {
      toast.error("Camera is unavailable right now. Rejoin the meeting and try again.");
      return;
    }

    const existingVideoTracks = stream.getVideoTracks();
    const currentlyOff = isCameraOff;

    // If no video track exists (audio-only fallback join), acquire one now.
    if (currentlyOff && existingVideoTracks.length === 0) {
      try {
        const preferred = videoDevices[camDeviceIdx];
        const newCam = await navigator.mediaDevices.getUserMedia({
          video: preferred
            ? { deviceId: { exact: preferred.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        const [newTrack] = newCam.getVideoTracks();
        if (!newTrack) throw new Error("No camera track available");

        peersRef.current.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) void sender.replaceTrack(newTrack);
          else void pc.addTrack(newTrack, stream);
        });

        stream.addTrack(newTrack);
        newTrack.enabled = true;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsCameraOff(false);
        return;
      } catch (error) {
        console.error("Failed to start camera track:", error);
        toast.error("Unable to start camera. Please check browser camera permissions.");
        return;
      }
    }

    stream.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCameraOff((p) => !p);
  }, [camDeviceIdx, isCameraOff, videoDevices]);

  // ── Camera switch (flip front/back or cycle cameras) ──────────────────────
  const switchCamera = useCallback(async () => {
    if (videoDevices.length < 2 || isScreenSharing) return;
    const nextIdx = (camDeviceIdx + 1) % videoDevices.length;
    setCamDeviceIdx(nextIdx);
    try {
      const newCam = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: videoDevices[nextIdx].deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      const [newTrack] = newCam.getVideoTracks();
      if (!newTrack || !localStreamRef.current) return;
      // Replace in all peer connections
      peersRef.current.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) void sender.replaceTrack(newTrack);
      });
      // Swap in local stream
      localStreamRef.current.getVideoTracks().forEach(v => { localStreamRef.current!.removeTrack(v); v.stop(); });
      localStreamRef.current.addTrack(newTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      if (isCameraOff) newTrack.enabled = false;
    } catch { /* ignore */ }
  }, [videoDevices, camDeviceIdx, isScreenSharing, isCameraOff]);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      try {
        const cam = await navigator.mediaDevices.getUserMedia({ video: true });
        const [t] = cam.getVideoTracks();
        if (t && localStreamRef.current) {
          peersRef.current.forEach(pc => { const s = pc.getSenders().find(s => s.track?.kind === "video"); if (s) void s.replaceTrack(t); });
          localStreamRef.current.getVideoTracks().forEach(v => { localStreamRef.current!.removeTrack(v); v.stop(); });
          localStreamRef.current.addTrack(t);
          if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        }
      } catch { /* ignore */ }
      setIsScreenSharing(false);
    } else {
      try {
        const disp = await (navigator.mediaDevices as MediaDevices & { getDisplayMedia(c?: object): Promise<MediaStream> }).getDisplayMedia({ video: true });
        const [t] = disp.getVideoTracks();
        if (!t) return;
        t.onended = () => setIsScreenSharing(false);
        peersRef.current.forEach(pc => { const s = pc.getSenders().find(s => s.track?.kind === "video"); if (s) void s.replaceTrack(t); });
        if (localStreamRef.current) {
          localStreamRef.current.getVideoTracks().forEach(v => { localStreamRef.current!.removeTrack(v); v.stop(); });
          localStreamRef.current.addTrack(t);
          if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
        }
        setIsScreenSharing(true);
      } catch { /* ignore */ }
    }
  }, [isScreenSharing]);

  const copyCode = () => {
    void navigator.clipboard.writeText(roomCode).then(() => { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); });
  };

  const meetingLink = `${window.location.origin}/meeting/join/${roomCode}`;
  const inviteCandidates = teamMembers
    .filter((member) => member.id !== officeUser.id)
    .filter((member) => {
      const q = inviteQuery.trim().toLowerCase();
      if (!q) return true;
      const haystack = `${member.full_name || ""} ${member.email || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  const selectedInvitees = teamMembers.filter((member) => selectedInviteeIds.includes(member.id));

  const toggleInvitee = (userId: string) => {
    setSelectedInviteeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const shareWhatsApp = () => {
    shareViaWhatsApp(buildMeetingShareText({
      roomCode,
      roomName: roomName || "Team Meeting",
      hostName: myName,
      meetingLink,
    }));
  };

  const copyLink = () => {
    void navigator.clipboard.writeText(meetingLink).then(() => {
      setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000);
    });
  };

  const copyInviteDetails = () => {
    const text = `Join my ONROL meeting\n\nJoin link: ${meetingLink}\nRoom code: ${roomCode}`;
    void navigator.clipboard.writeText(text).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    });
  };

  const sendInternalInvites = async () => {
    if (!selectedInviteeIds.length || inviteBusy) return;
    setInviteBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Sign-in required to send invites.");
      const response = await fetch("/api/meetings/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          meetingCode: roomCode,
          inviteeIds: selectedInviteeIds,
          hostName: myName,
          roomName: roomName || "Team Meeting",
          meetingLink,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const msg = typeof (payload as { error?: unknown })?.error === "string"
          ? (payload as { error: string }).error
          : "Meeting invites write failed";
        throw new Error(msg);
      }
      toast.success(`Invites sent to ${selectedInviteeIds.length} participant${selectedInviteeIds.length === 1 ? "" : "s"}.`);
      setSelectedInviteeIds([]);
      setInviteQuery("");
      setShowInvitePanel(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send meeting invites right now. Please retry.");
    } finally {
      setInviteBusy(false);
    }
  };

  const sendReaction = (emoji: string) => {
    const id = reactionIdRef.current++;
    setReactions(p => [...p, { id, emoji, name: myName }]);
    setShowReactions(false);
  };

  // ── Grid ──────────────────────────────────────────────────────────────────
  const allParticipants = [
    { userId: "local", name: myName, stream: localStreamRef.current, isLocal: true },
    ...remoteStreams.map(r => ({ userId: r.userId, name: r.name, stream: r.stream, isLocal: false })),
  ];
  const pinnedParticipant = pinnedId ? allParticipants.find(p => p.userId === pinnedId) : null;
  const otherParticipants = pinnedParticipant ? allParticipants.filter(p => p.userId !== pinnedId) : [];

  function gridCols(n: number) {
    if (n === 1) return "grid-cols-1 max-w-2xl mx-auto w-full";
    if (n === 2) return "grid-cols-2";
    if (n <= 4) return "grid-cols-2";
    if (n <= 6) return "grid-cols-3";
    return "grid-cols-3 xl:grid-cols-4";
  }

  // ══════════════════════════════════════════════════════════════════════════
  // LOBBY — Google Meet style dark card, no camera auto-start
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === "lobby") {
    const lobbyTextPrimary = dark ? "text-white" : "text-slate-900";
    const lobbyTextSecondary = dark ? "text-[#9aa0a6]" : "text-slate-500";
    const lobbySoftSurface = dark
      ? "bg-[#3c4043] border-[#5f6368]/60 text-[#bdc1c6] hover:bg-[#4a4d51]"
      : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200";
    const lobbyInput = dark
      ? "bg-[#3c4043] border-[#5f6368]/60 text-white placeholder-[#5f6368]"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";
    const lobbyPanel = dark
      ? "border-[#5f6368]/40 bg-[#3c4043]/60"
      : "border-slate-300 bg-slate-50";
    return (
      <div className={`crm-meeting-shell h-full min-h-0 overflow-auto flex flex-col items-stretch justify-start rounded-2xl p-2 sm:p-4 md:p-6 ${dark ? "bg-[#1a1a1a]" : "bg-slate-50"}`}>
        <div className="w-full max-w-lg mx-auto md:max-w-6xl">

          {/* Brand header — compact on mobile */}
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Video size={14} className="text-white" />
            </div>
            <div>
              <span className={`${lobbyTextPrimary} font-semibold text-base`}>ONROL Meet</span>
              <span className={`ml-2 text-xs ${lobbyTextSecondary} hidden sm:inline`}>Secure video calls for your team</span>
            </div>
          </div>

          {/* Main card */}
          <div className={`rounded-2xl border overflow-hidden shadow-xl ${dark ? "border-[#454545]/50 bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>

            {/* Desktop header row with avatar + mic/cam toggles */}
            <div className={`hidden md:flex items-center justify-between gap-3 border-b px-5 py-3 ${dark ? "border-[#5f6368]/40 bg-[#f3f5f8]/70" : "border-slate-200 bg-slate-50/70"}`}>
              <div className="flex min-w-0 items-center gap-3">
                <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatarGradient(myName)} flex items-center justify-center`}>
                  <span className="text-sm font-bold text-white">{initials(myName)}</span>
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-sm font-semibold ${lobbyTextPrimary}`}>{myName}</p>
                  <p className={`text-xs ${lobbyTextSecondary}`}>Ready to host or join</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setLobbyMuted(p => !p)}
                  className={`flex items-center gap-2 h-9 rounded-full px-4 text-sm font-medium transition-colors border ${lobbyMuted ? "bg-red-600 border-red-500 text-white" : lobbySoftSurface}`}>
                  {lobbyMuted ? <MicOff size={14} /> : <Mic size={14} />}
                  {lobbyMuted ? "Mic off" : "Mic on"}
                </button>
                <button onClick={() => setLobbyCamOff(p => !p)}
                  className={`flex items-center gap-2 h-9 rounded-full px-4 text-sm font-medium transition-colors border ${lobbyCamOff ? "bg-red-600 border-red-500 text-white" : lobbySoftSurface}`}>
                  {lobbyCamOff ? <VideoOff size={14} /> : <Video size={14} />}
                  {lobbyCamOff ? "Cam off" : "Cam on"}
                </button>
              </div>
            </div>

            {/* Mobile: compact user row + mic/cam toggles inline */}
            <div className={`md:hidden flex items-center justify-between gap-2 px-3 py-2 border-b ${dark ? "border-[#5f6368]/40 bg-[#f3f5f8]/70" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className={`h-7 w-7 flex-shrink-0 rounded-full bg-gradient-to-br ${avatarGradient(myName)} flex items-center justify-center`}>
                  <span className="text-[10px] font-bold text-white">{initials(myName)}</span>
                </div>
                <span className={`text-xs font-semibold truncate max-w-[100px] ${lobbyTextPrimary}`}>{myName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setLobbyMuted(p => !p)}
                  className={`flex items-center gap-1 h-7 rounded-full px-2.5 text-xs font-medium transition-colors border ${lobbyMuted ? "bg-red-600 border-red-500 text-white" : lobbySoftSurface}`}>
                  {lobbyMuted ? <MicOff size={11} /> : <Mic size={11} />}
                  {lobbyMuted ? "Off" : "On"}
                </button>
                <button onClick={() => setLobbyCamOff(p => !p)}
                  className={`flex items-center gap-1 h-7 rounded-full px-2.5 text-xs font-medium transition-colors border ${lobbyCamOff ? "bg-red-600 border-red-500 text-white" : lobbySoftSurface}`}>
                  {lobbyCamOff ? <VideoOff size={11} /> : <Video size={11} />}
                  {lobbyCamOff ? "Off" : "On"}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${dark ? "border-[#5f6368]/40" : "border-slate-200"}`}>
              {(["create", "join"] as const).map(t => (
                <button key={t} onClick={() => setLobbyTab(t)}
                  className={`flex-1 py-2.5 sm:py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                    lobbyTab === t
                      ? dark ? "border-blue-500 text-orange-400" : "border-blue-600 text-orange-600"
                      : dark ? "border-transparent text-[#9aa0a6] hover:text-[#bdc1c6]" : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}>
                  {t === "create" ? "New Meeting" : "Join Meeting"}
                </button>
              ))}
            </div>

            <div className="p-3 sm:p-5">
              {lobbyTab === "create" ? (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Meeting title */}
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${lobbyTextSecondary}`}>Meeting title (optional)</label>
                    <input value={roomName} onChange={e => setRoomName(e.target.value)}
                      placeholder="e.g. Weekly Standup"
                      className={`w-full h-9 sm:h-10 rounded-xl border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${lobbyInput}`} />
                  </div>

                  {/* Room code section */}
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${lobbyTextSecondary}`}>Room code — share with others</label>

                    {/* Code display + actions in one row */}
                    <div className={`flex items-center gap-1.5 h-10 rounded-xl border px-3 ${lobbyInput}`}>
                      <span className="font-mono font-bold text-orange-400 tracking-[0.2em] text-sm flex-1">{roomCode}</span>
                      <button onClick={() => setRoomCode(generateCode())} title="Generate new code"
                        className={`p-1 transition-colors rounded ${dark ? "text-[#9aa0a6] hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                        <RefreshCw size={13} />
                      </button>
                      <button onClick={copyCode} title="Copy code"
                        className={`p-1 transition-colors rounded ${dark ? "text-[#9aa0a6] hover:text-white hover:bg-white/10" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"}`}>
                        {codeCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                      <button onClick={shareWhatsApp} title="Share via WhatsApp"
                        className="p-1 rounded text-[#25D366] hover:bg-[#25D366]/10 transition-colors">
                        <Share2 size={13} />
                      </button>
                    </div>

                    {/* Link row — collapsible on mobile */}
                    <div className={`mt-1.5 flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${dark ? "border-[#5f6368]/30 bg-[#2d2e30]" : "border-slate-200 bg-slate-50"}`}>
                      <span className={`text-[11px] truncate flex-1 font-mono ${lobbyTextSecondary}`}>{meetingLink}</span>
                      <button onClick={copyLink} title="Copy link"
                        className={`flex-shrink-0 transition-colors ${dark ? "text-[#9aa0a6] hover:text-white" : "text-slate-500 hover:text-slate-700"}`}>
                        {codeCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Invite teammates */}
                  <div className={`rounded-xl border p-2.5 sm:p-3 ${lobbyPanel}`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#bdc1c6]" : "text-slate-700"}`}>Invite</p>
                      <button type="button" onClick={copyInviteDetails}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors ${dark ? "border-[#5f6368]/50 text-[#bdc1c6] hover:bg-[#4a4d51]" : "border-slate-300 text-slate-600 hover:bg-slate-100"}`}>
                        {inviteCopied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                        Copy invite
                      </button>
                    </div>
                    <input value={inviteQuery} onChange={(e) => setInviteQuery(e.target.value)}
                      placeholder="Search by name or email"
                      className={`h-8 w-full rounded-lg border px-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? "border-[#5f6368]/60 bg-[#2d2e30] text-white placeholder-[#7e8389]" : "border-slate-300 bg-white text-slate-900 placeholder-slate-400"}`}
                    />
                    <div className={`mt-1.5 max-h-28 overflow-y-auto rounded-lg border ${dark ? "border-[#5f6368]/40 bg-[#2d2e30]" : "border-slate-300 bg-white"}`}>
                      {inviteCandidates.length ? inviteCandidates.map((member) => {
                        const selected = selectedInviteeIds.includes(member.id);
                        return (
                          <button key={member.id} type="button" onClick={() => toggleInvitee(member.id)}
                            className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${
                              selected ? "bg-orange-600/20" : dark ? "hover:bg-[#3c4043]" : "hover:bg-slate-100"
                            }`}>
                            <div className={`h-5 w-5 flex-shrink-0 rounded-full bg-gradient-to-br ${avatarGradient(member.full_name || member.email || "")} flex items-center justify-center`}>
                              <span className="text-[9px] font-bold text-white">{initials(member.full_name || member.email || "?")}</span>
                            </div>
                            <span className={`text-xs truncate flex-1 ${selected ? "text-orange-300 font-medium" : dark ? "text-[#bdc1c6]" : "text-slate-700"}`}>
                              {member.full_name || member.email}
                            </span>
                            <span className={`text-[10px] truncate max-w-[80px] hidden sm:block ${dark ? "text-[#9aa0a6]" : "text-slate-400"}`}>{member.email}</span>
                            {selected && <Check size={11} className="text-orange-400 flex-shrink-0" />}
                          </button>
                        );
                      }) : (
                        <p className={`px-3 py-2 text-xs ${dark ? "text-[#7e8389]" : "text-slate-500"}`}>No teammates found.</p>
                      )}
                    </div>
                    {selectedInviteeIds.length > 0 && (
                      <button type="button" onClick={() => void sendInternalInvites()} disabled={inviteBusy}
                        className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50">
                        <MailCheck size={12} />
                        {inviteBusy ? "Sending…" : `Send invite${selectedInviteeIds.length === 1 ? "" : "s"} (${selectedInviteeIds.length})`}
                      </button>
                    )}
                  </div>

                  <button onClick={() => void joinRoom(roomCode)}
                    className="w-full h-10 sm:h-11 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg">
                    <Video size={15} /> Start Meeting
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div>
                    <label className={`text-xs font-medium mb-1.5 block ${lobbyTextSecondary}`}>Enter the 6-character room code</label>
                    <input
                      value={joinCode}
                      onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                      placeholder="AB12CD"
                      maxLength={6}
                      className={`w-full h-12 rounded-xl border px-4 text-xl font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center ${lobbyInput}`} />
                  </div>
                  <button
                    onClick={() => { if (joinCode.trim().length === 6) { setRoomCode(joinCode.trim()); void joinRoom(joinCode.trim()); } }}
                    disabled={joinCode.trim().length !== 6}
                    className="w-full h-10 sm:h-11 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg">
                    <ChevronRight size={16} /> Join Meeting
                  </button>
                  <p className={`text-[11px] text-center ${dark ? "text-[#5f6368]" : "text-slate-500"}`}>Ask the meeting host for their room code</p>
                </div>
              )}
            </div>
          </div>

          {/* Info pills */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {["WebRTC encrypted", "No recording", "Up to 10 participants"].map(f => (
              <span key={f} className={`text-[10px] rounded-full px-2 py-0.5 border ${dark ? "text-[#5f6368] bg-[#2d2e30] border-[#5f6368]/30" : "text-slate-500 bg-white border-slate-300"}`}>{f}</span>
            ))}
          </div>
        </div>

        {/* ── Active Meetings List ─────────────────────────────────────────── */}
        {activeMeetings.length > 0 && (
          <div className="w-full max-w-lg md:max-w-6xl mt-4">
            <p className={`text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5 ${dark ? "text-[#9aa0a6]" : "text-slate-500"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Active Meetings ({activeMeetings.length})
            </p>
            <div className="flex flex-col gap-2">
              {activeMeetings.map(m => (
                <div key={m.roomCode} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${dark ? "bg-[#2d2e30] border-[#5f6368]/40" : "bg-white border-slate-300"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${avatarGradient(m.hostName)} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xs font-bold text-white">{initials(m.hostName)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${lobbyTextPrimary}`}>{m.roomName}</p>
                      <p className={`text-[11px] ${lobbyTextSecondary}`}>
                        Started by {m.hostName} - {new Date(m.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setJoinCode(m.roomCode); setLobbyTab("join"); void joinRoom(m.roomCode); }}
                    className="flex-shrink-0 ml-3 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // IN-ROOM VIEW — Google Meet / Zoom dark aesthetic, fixed height
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className={`crm-meeting-shell relative h-full min-h-0 flex flex-col rounded-2xl overflow-hidden ${dark ? "bg-[#1a1a1a]" : "bg-slate-50"}`}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-4 py-2 border-b flex-shrink-0 ${dark ? "bg-[#1a1a1a] border-[#404040]" : "bg-white border-slate-200"}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Video size={13} className="text-white" />
          </div>
          <span className="text-white font-semibold text-sm truncate max-w-[120px]">
            {roomName || "Meeting"}
          </span>
          <div className="flex items-center gap-1 text-[#9aa0a6] text-xs">
            <Clock size={11} />
            <span className="font-mono">{timer}</span>
          </div>
          <div className={`flex items-center gap-1 text-xs ${connState === "connected" ? "text-emerald-400" : connState === "poor" ? "text-amber-400" : "text-[#5f6368]"}`}>
            {connState === "connected" ? <Signal size={11} /> : connState === "poor" ? <Wifi size={11} /> : <WifiOff size={11} />}
            <span className="hidden sm:inline capitalize text-[11px]">{connState}</span>
          </div>
          <span className={`hidden sm:inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            transcriptionActive ? "bg-violet-900/40 text-violet-300" : "bg-[#454545]/50 text-slate-300"
          }`}>
            {transcriptionActive ? "Transcript ON" : "Transcript OFF"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Room code + copy link */}
          <button onClick={copyLink} title="Copy join link"
            className="flex items-center gap-1.5 bg-[#3c4043] hover:bg-[#4a4d51] rounded-full px-3 py-1 transition-colors border border-[#5f6368]/40">
            <span className="font-mono text-orange-400 text-xs font-bold tracking-wider">{roomCode}</span>
            {codeCopied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} className="text-[#9aa0a6]" />}
          </button>

          {/* WhatsApp share */}
          <button onClick={shareWhatsApp} title="Share via WhatsApp"
            className="h-7 w-7 flex items-center justify-center rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/30 transition-colors">
            <Share2 size={13} />
          </button>

          {/* Participants */}
          <button onClick={() => setShowParticipants(p => !p)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-xs font-medium transition-colors ${
              showParticipants ? "bg-blue-600 border-blue-500 text-white" : "bg-[#3c4043] border-[#5f6368]/40 text-[#bdc1c6] hover:bg-[#4a4d51]"
            }`}>
            <Users size={11} />
            <span>{participantCount}</span>
          </button>

          {/* View toggle */}
          <button onClick={() => setViewMode(v => v === "gallery" ? "spotlight" : "gallery")}
            className="h-7 w-7 flex items-center justify-center rounded-full bg-[#3c4043] border border-[#5f6368]/40 text-[#9aa0a6] hover:text-white transition-colors"
            title={viewMode === "gallery" ? "Spotlight view" : "Gallery view"}>
            {viewMode === "gallery" ? <LayoutTemplate size={12} /> : <Grid2X2 size={12} />}
          </button>

          <button
            onClick={() => setShowInvitePanel((prev) => !prev)}
            className={`h-7 rounded-full px-2.5 inline-flex items-center gap-1 border text-xs font-medium transition-colors ${
              showInvitePanel
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-[#3c4043] border-[#5f6368]/40 text-[#bdc1c6] hover:bg-[#4a4d51]"
            }`}
            title="Invite teammates"
          >
            <UserPlus size={11} />
            <span className="hidden sm:inline">Invite</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      {showInvitePanel ? (
        <div className="border-b border-[#3c4043] bg-[#2d2e30] px-4 py-3">
          <div className="mx-auto w-full max-w-3xl rounded-xl border border-[#5f6368]/40 bg-[#3c4043]/70 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#bdc1c6]">Invite participants</p>
              <button
                type="button"
                onClick={copyInviteDetails}
                className="inline-flex items-center gap-1 rounded-full border border-[#5f6368]/50 px-2.5 py-1 text-[11px] text-[#bdc1c6] hover:bg-[#4a4d51] transition-colors"
              >
                {inviteCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                Copy invite
              </button>
            </div>
            <input
              value={inviteQuery}
              onChange={(e) => setInviteQuery(e.target.value)}
              placeholder="Search teammate name or email"
              className="mt-2 h-9 w-full rounded-lg border border-[#5f6368]/60 bg-[#2d2e30] px-3 text-sm text-white placeholder-[#7e8389] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-[#5f6368]/40 bg-[#2d2e30]">
              {inviteCandidates.length ? inviteCandidates.map((member) => {
                const selected = selectedInviteeIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleInvitee(member.id)}
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                      selected ? "bg-orange-600/20 text-orange-200" : "text-[#bdc1c6] hover:bg-[#3c4043]"
                    }`}
                  >
                    <span className="truncate">{member.full_name || member.email}</span>
                    <span className="ml-2 text-[11px] text-[#9aa0a6]">{member.email}</span>
                  </button>
                );
              }) : (
                <p className="px-3 py-2 text-xs text-[#7e8389]">No teammates found.</p>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[11px] text-[#9aa0a6]">
                Selected: <span className="text-[#e8eaed]">{selectedInvitees.length}</span>
              </p>
              <button
                type="button"
                onClick={() => void sendInternalInvites()}
                disabled={!selectedInviteeIds.length || inviteBusy}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MailCheck size={13} />
                {inviteBusy ? "Sending..." : `Send invite${selectedInviteeIds.length === 1 ? "" : "s"} (${selectedInviteeIds.length})`}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 overflow-hidden">

        {/* Video area */}
        <div className="flex-1 p-3 overflow-y-auto">
          {viewMode === "spotlight" && pinnedParticipant ? (
            <div className="flex flex-col gap-2 h-full">
              <div className="flex-1 min-h-0">
                <VideoTile
                  stream={pinnedParticipant.stream}
                  name={pinnedParticipant.name}
                  muted={pinnedParticipant.isLocal ? isMuted : false}
                  isLocal={pinnedParticipant.isLocal}
                  pinned large
                  onPin={() => setPinnedId(null)}
                />
              </div>
              {otherParticipants.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
                  {otherParticipants.map(p => (
                    <div key={p.userId} className="flex-shrink-0 w-32">
                      <VideoTile
                        stream={p.stream} name={p.name}
                        muted={p.isLocal ? isMuted : false}
                        isLocal={p.isLocal}
                        onPin={() => setPinnedId(p.userId)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={`grid gap-2 ${gridCols(allParticipants.length)}`}>
              {allParticipants.map(p => (
                <VideoTile
                  key={p.userId}
                  stream={p.stream} name={p.name}
                  muted={p.isLocal ? isMuted : false}
                  isLocal={p.isLocal}
                  pinned={pinnedId === p.userId}
                  onPin={() => { setPinnedId(pinnedId === p.userId ? null : p.userId); setViewMode("spotlight"); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Participants sidebar */}
        {showParticipants && (
          <div className="w-52 flex-shrink-0 bg-[#2d2e30] border-l border-[#3c4043] flex flex-col">
            <div className="px-3 py-2.5 border-b border-[#3c4043]">
              <p className="text-xs font-semibold text-[#bdc1c6] uppercase tracking-wide">In this call ({participantCount})</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {allParticipants.map(p => (
                <div key={p.userId} className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-[#3c4043] transition-colors">
                  <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${avatarGradient(p.name)} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-xs font-bold text-white">{initials(p.name)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#e8eaed] truncate">{p.isLocal ? `${p.name} (you)` : p.name}</p>
                  </div>
                  {p.isLocal && isMuted && <MicOff size={11} className="text-red-400 flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reactions overlay */}
      <div className="absolute bottom-20 left-4 flex flex-col-reverse gap-1.5 pointer-events-none z-10">
        {reactions.slice(-5).map(r => (
          <ReactionBubble key={r.id} emoji={r.emoji} name={r.name} />
        ))}
      </div>

      {/* ── Control bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 px-4 py-3 bg-[#202124] border-t border-[#3c4043] flex-shrink-0">

        <Ctrl active={!isMuted} danger={isMuted} onClick={toggleMute} label={isMuted ? "Unmute" : "Mute"}>
          {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
        </Ctrl>

        <Ctrl active={!isCameraOff} danger={isCameraOff} onClick={() => { void toggleCamera(); }} label={isCameraOff ? "Start cam" : "Stop cam"}>
          {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
        </Ctrl>

        {/* Camera switch — only shown when ≥2 cameras detected */}
        {videoDevices.length >= 2 && (
          <Ctrl active onClick={switchCamera} label="Flip camera" small>
            <SwitchCamera size={15} />
          </Ctrl>
        )}

        <Ctrl active={!isScreenSharing} highlight={isScreenSharing} onClick={() => void toggleScreenShare()} label={isScreenSharing ? "Stop share" : "Share screen"}>
          {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
        </Ctrl>

        {/* Reactions */}
        <div className="relative">
          <Ctrl active onClick={() => setShowReactions(p => !p)} label="React">
            <Smile size={18} />
          </Ctrl>
          {showReactions && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 bg-[#3c4043] border border-[#5f6368]/50 rounded-2xl px-3 py-2 shadow-2xl z-20">
              {["\u{1F44D}", "\u{1F389}", "\u270B", "\u2764\uFE0F", "\u{1F602}", "\u{1F525}"].map(e => (
                <button key={e} onClick={() => sendReaction(e)}
                  className="text-xl hover:scale-125 transition-transform active:scale-110">{e}</button>
              ))}
            </div>
          )}
        </div>

        <Ctrl active={!showParticipants} highlight={showParticipants} onClick={() => setShowParticipants(p => !p)} label="People">
          <Users size={18} />
        </Ctrl>

        {/* Spacer */}
        <div className="flex-1 sm:flex-none sm:w-4" />

        {/* Leave button */}
        <button onClick={leaveRoom}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-semibold text-sm transition-colors shadow-lg">
          <PhoneOff size={15} />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </div>
  );
}




