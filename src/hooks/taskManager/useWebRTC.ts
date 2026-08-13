import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { OfficeUser } from "@/types/taskManager";
import {
  playCallRingtone,
  stopRingtone,
  playCallConnectedTone,
  playCallEndedTone,
} from "@/lib/soundNotifications";

// ─── ICE servers: more STUN servers + note for TURN ─────────────────────────
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478" },
];

export type CallState = "idle" | "outgoing" | "incoming" | "active";
export type CallType = "audio" | "video";

export interface CallSession {
  callType: CallType;
  conversationId: string;
  remoteUser: OfficeUser;
}

type SignalMsg =
  | { type: "call-invite"; from: string; fromName: string; callType: CallType; conversationId: string }
  | { type: "call-offer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "call-answer"; from: string; sdp: RTCSessionDescriptionInit }
  | { type: "call-reject"; from: string }
  | { type: "call-end"; from: string }
  | { type: "ice-candidate"; from: string; candidate: RTCIceCandidateInit };

export interface UseWebRTCReturn {
  callState: CallState;
  callSession: CallSession | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  isMuted: boolean;
  isCameraOff: boolean;
  isFrontCamera: boolean;
  canSwitchCamera: boolean;
  initiateCall: (callType: CallType, conversationId: string, remoteUser: OfficeUser) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  switchCamera: () => Promise<void>;
}

/** Subscribe a channel and resolve once SUBSCRIBED (or timeout after 5s). */
function subscribeAndWait(ch: RealtimeChannel): Promise<RealtimeChannel> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(ch), 5000);
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve(ch);
      }
    });
  });
}

/** Send a broadcast on an already-subscribed channel. */
function broadcast(ch: RealtimeChannel, msg: SignalMsg) {
  void ch.send({ type: "broadcast", event: "signal", payload: msg });
}

/** One-shot: subscribe, send, then remove the channel. Used for invite. */
async function broadcastOnce(channelName: string, msg: SignalMsg) {
  const ch = supabase.channel(channelName);
  await subscribeAndWait(ch);
  broadcast(ch, msg);
  await new Promise((r) => setTimeout(r, 200));
  void supabase.removeChannel(ch);
}

/** Post a message to the service worker (if registered). */
function postToSW(msg: Record<string, unknown>): void {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(msg);
  }
}

/** Get audio constraints with quality improvements. */
function audioConstraints() {
  return {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1,
    },
  };
}

/** Get video constraints for front or back camera. */
function videoConstraints(front: boolean) {
  return {
    video: {
      facingMode: front ? "user" : { exact: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
  };
}

export default function useWebRTC(officeUser: OfficeUser | null): UseWebRTCReturn {
  const [callState, setCallState] = useState<CallState>("idle");
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const iceCandidateBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoInputIdsRef = useRef<string[]>([]);
  const activeVideoDeviceIdRef = useRef<string | null>(null);
  // Track whether this instance started the ringtone
  const ringingRef = useRef(false);

  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);

  // ─── cleanup ─────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallState("idle");
    setCallSession(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setIsFrontCamera(true);
    setCanSwitchCamera(false);
    videoInputIdsRef.current = [];
    activeVideoDeviceIdRef.current = null;
    pendingOfferRef.current = null;
    iceCandidateBufferRef.current = [];
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    // Stop ringtone and play end tone
    if (ringingRef.current) {
      stopRingtone();
      ringingRef.current = false;
    } else {
      playCallEndedTone();
    }
  }, []);

  // ─── peer factory ─────────────────────────────────────────────────────────
  const createPeer = useCallback(
    (conversationId: string, getChannel: () => RealtimeChannel | null) => {
      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        // Prefer UDP for lower latency
        iceTransportPolicy: "all",
        bundlePolicy: "max-bundle",
        rtcpMuxPolicy: "require",
      });

      pc.onicecandidate = (e) => {
        if (!e.candidate || !officeUser) return;
        const ch = getChannel();
        if (ch) broadcast(ch, { type: "ice-candidate", from: officeUser.id, candidate: e.candidate.toJSON() });
      };

      pc.ontrack = (e) => {
        const [stream] = e.streams;
        setRemoteStream(stream);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      };

      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") {
          setCallState("active");
          stopRingtone();
          ringingRef.current = false;
          playCallConnectedTone();
        }
        if (s === "disconnected" || s === "failed" || s === "closed") cleanup();
      };

      // Enable bandwidth optimizations
      pc.onnegotiationneeded = async () => {
        try {
          const senders = pc.getSenders();
          for (const sender of senders) {
            if (sender.track?.kind === "audio") {
              const params = sender.getParameters();
              if (!params.encodings) params.encodings = [{}];
              params.encodings[0].maxBitrate = 64000; // 64kbps audio
              await sender.setParameters(params);
            }
            if (sender.track?.kind === "video") {
              const params = sender.getParameters();
              if (!params.encodings) params.encodings = [{}];
              params.encodings[0].maxBitrate = 800000; // 800kbps video
              params.encodings[0].maxFramerate = 30;
              await sender.setParameters(params);
            }
          }
        } catch {
          // non-critical
        }
      };

      peerRef.current = pc;
      void conversationId;
      return pc;
    },
    [officeUser, cleanup],
  );

  // ─── media ────────────────────────────────────────────────────────────────
  const refreshVideoInputs = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const ids = devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => device.deviceId)
        .filter(Boolean);
      videoInputIdsRef.current = ids;
      setCanSwitchCamera(ids.length > 1);
      return ids;
    } catch {
      videoInputIdsRef.current = [];
      setCanSwitchCamera(false);
      return [] as string[];
    }
  }, []);

  const syncActiveVideoDevice = useCallback((stream: MediaStream | null) => {
    const track = stream?.getVideoTracks?.()[0];
    activeVideoDeviceIdRef.current = track?.getSettings?.().deviceId ?? null;
  }, []);

  const getMedia = useCallback(async (callType: CallType, frontCamera = true): Promise<MediaStream> => {
    const constraints = {
      ...audioConstraints(),
      ...(callType === "video" ? videoConstraints(frontCamera) : {}),
    };

    // On mobile, fallback to basic video if exact facingMode fails
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
      if (callType === "video") {
        // Fallback: basic video without facingMode constraint
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      }
    }

    setLocalStream(stream);
    localStreamRef.current = stream;
    syncActiveVideoDevice(stream);
    void refreshVideoInputs();
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }, [refreshVideoInputs, syncActiveVideoDevice]);

  // ─── switchCamera (mid-call or pre-call) ─────────────────────────────────
  const switchCamera = useCallback(async () => {
    if (callSession?.callType !== "video") return;
    if (!localStreamRef.current?.getVideoTracks().length) return;
    const currentTrack = localStreamRef.current.getVideoTracks()[0];
    const newFront = !isFrontCamera;

    try {
      const ids = await refreshVideoInputs();
      const activeId = activeVideoDeviceIdRef.current;
      let nextDeviceId: string | null = null;
      if (ids.length > 1 && activeId && ids.includes(activeId)) {
        const idx = ids.indexOf(activeId);
        nextDeviceId = ids[(idx + 1) % ids.length];
      } else if (ids.length > 1) {
        nextDeviceId = ids[1];
      }

      let newStream: MediaStream;
      if (nextDeviceId) {
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            deviceId: { exact: nextDeviceId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        });
      } else {
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            ...videoConstraints(newFront),
          });
        } catch {
          newStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });
        }
      }
      const [newVideoTrack] = newStream.getVideoTracks();
      if (!newVideoTrack) return;
      const shouldEnable = currentTrack.enabled;

      // Replace track in peer connection
      if (peerRef.current) {
        const sender = peerRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      // Stop old video track and replace in local stream
      localStreamRef.current?.getVideoTracks().forEach((t) => t.stop());
      const currentStream = localStreamRef.current;
      if (currentStream) {
        currentStream.getVideoTracks().forEach((t) => {
          currentStream.removeTrack(t);
        });
        currentStream.addTrack(newVideoTrack);
        newVideoTrack.enabled = shouldEnable;
        syncActiveVideoDevice(currentStream);
        if (localVideoRef.current) localVideoRef.current.srcObject = currentStream;
      }

      setIsFrontCamera(newFront);
    } catch (err) {
      console.error("switchCamera error", err);
    }
  }, [callSession, isFrontCamera, refreshVideoInputs, syncActiveVideoDevice]);

  useEffect(() => {
    void refreshVideoInputs();
  }, [refreshVideoInputs]);

  // ─── Show call notification via service worker ────────────────────────────
  const showCallNotification = useCallback((session: CallSession, callerName: string) => {
    postToSW({
      type: "SHOW_CALL_NOTIFICATION",
      callerName,
      callType: session.callType,
      conversationId: session.conversationId,
    });
  }, []);

  const dismissCallNotification = useCallback((conversationId: string) => {
    postToSW({ type: "DISMISS_CALL_NOTIFICATION", conversationId });
  }, []);

  // ─── initiateCall (caller side) ──────────────────────────────────────────
  const initiateCall = useCallback(
    async (callType: CallType, conversationId: string, remoteUser: OfficeUser) => {
      if (!officeUser || callState !== "idle") return;
      try {
        setCallState("outgoing");
        const session: CallSession = { callType, conversationId, remoteUser };
        setCallSession(session);

        const stream = await getMedia(callType, isFrontCamera);
        const pc = createPeer(conversationId, () => channelRef.current);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const ch = supabase
          .channel(`rtc-${conversationId}`)
          .on("broadcast", { event: "signal" }, ({ payload }: { payload: SignalMsg }) => {
            if (payload.from === officeUser.id) return;
            if (payload.type === "call-answer") {
              void pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            } else if (payload.type === "ice-candidate") {
              void pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } else if (payload.type === "call-reject" || payload.type === "call-end") {
              cleanup();
            }
          });
        channelRef.current = await subscribeAndWait(ch);

        await broadcastOnce(`rtc-incoming-${remoteUser.id}`, {
          type: "call-invite",
          from: officeUser.id,
          fromName: officeUser.full_name || officeUser.email,
          callType,
          conversationId,
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (channelRef.current) broadcast(channelRef.current, { type: "call-offer", from: officeUser.id, sdp: offer });
      } catch (err) {
        console.error("initiateCall error", err);
        cleanup();
      }
    },
    [officeUser, callState, getMedia, createPeer, cleanup, isFrontCamera],
  );

  // ─── acceptCall (callee side) ─────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!officeUser || !callSession || !pendingOfferRef.current) return;
    try {
      stopRingtone();
      ringingRef.current = false;
      dismissCallNotification(callSession.conversationId);

      const stream = await getMedia(callSession.callType, isFrontCamera);
      const pc = createPeer(callSession.conversationId, () => channelRef.current);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));

      const buffered = iceCandidateBufferRef.current.splice(0);
      for (const c of buffered) {
        void pc.addIceCandidate(new RTCIceCandidate(c));
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (channelRef.current) {
        broadcast(channelRef.current, { type: "call-answer", from: officeUser.id, sdp: answer });
      }
      setCallState("active");
      playCallConnectedTone();
    } catch (err) {
      console.error("acceptCall error", err);
      cleanup();
    }
  }, [officeUser, callSession, getMedia, createPeer, cleanup, dismissCallNotification, isFrontCamera]);

  // ─── rejectCall ───────────────────────────────────────────────────────────
  const rejectCall = useCallback(() => {
    if (!officeUser || !callSession) return;
    stopRingtone();
    ringingRef.current = false;
    dismissCallNotification(callSession.conversationId);
    if (channelRef.current) broadcast(channelRef.current, { type: "call-reject", from: officeUser.id });
    cleanup();
  }, [officeUser, callSession, cleanup, dismissCallNotification]);

  // ─── endCall ──────────────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    if (!officeUser || !callSession) return;
    if (channelRef.current) broadcast(channelRef.current, { type: "call-end", from: officeUser.id });
    cleanup();
  }, [officeUser, callSession, cleanup]);

  // ─── toggles ──────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsMuted((p) => !p);
  }, []);

  const toggleCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setIsCameraOff((p) => !p);
  }, []);

  // ─── Listen for SW notification action (accept/decline from lock screen) ──
  useEffect(() => {
    if (!officeUser) return;
    const handleSwMessage = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg) return;
      if (msg.type === "CALL_NOTIFICATION_ACTION") {
        if (msg.action === "accept") {
          void acceptCall();
        } else if (msg.action === "decline") {
          rejectCall();
        }
      }
      if (msg.type === "CALL_NOTIFICATION_DISMISSED") {
        // User swiped away the notification — treat as reject
        if (callState === "incoming") rejectCall();
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleSwMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
  }, [officeUser, callState, acceptCall, rejectCall]);

  // ─── global incoming-call listener ───────────────────────────────────────
  useEffect(() => {
    if (!officeUser) return;

    const incomingCh = supabase
      .channel(`rtc-incoming-${officeUser.id}`)
      .on("broadcast", { event: "signal" }, ({ payload }: { payload: SignalMsg }) => {
        if (payload.from === officeUser.id) return;

        if (payload.type === "call-invite" && callState === "idle") {
          const { from, fromName, callType, conversationId } = payload;
          const session: CallSession = {
            callType,
            conversationId,
            remoteUser: {
              id: from,
              full_name: fromName,
              email: "",
              role: "employee",
              department: "",
              is_active: true,
            },
          };
          setCallState("incoming");
          setCallSession(session);

          // Start ringtone
          playCallRingtone();
          ringingRef.current = true;

          // Show system notification (works even if app is backgrounded)
          showCallNotification(session, fromName);

          if (channelRef.current) void supabase.removeChannel(channelRef.current);
          const convCh = supabase
            .channel(`rtc-${conversationId}`)
            .on("broadcast", { event: "signal" }, ({ payload: sig }: { payload: SignalMsg }) => {
              if (sig.from === officeUser.id) return;
              if (sig.type === "call-offer") {
                pendingOfferRef.current = sig.sdp;
              } else if (sig.type === "ice-candidate") {
                if (peerRef.current) {
                  void peerRef.current.addIceCandidate(new RTCIceCandidate(sig.candidate));
                } else {
                  iceCandidateBufferRef.current.push(sig.candidate);
                }
              } else if (sig.type === "call-end" || sig.type === "call-reject") {
                cleanup();
              }
            });
          void subscribeAndWait(convCh).then((ch) => { channelRef.current = ch; });
        }
      });

    void incomingCh.subscribe();
    return () => { void supabase.removeChannel(incomingCh); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officeUser?.id, callState === "idle"]);

  return {
    callState, callSession, localStream, remoteStream,
    localVideoRef, remoteVideoRef, isMuted, isCameraOff, isFrontCamera, canSwitchCamera,
    initiateCall, acceptCall, rejectCall, endCall, toggleMute, toggleCamera, switchCamera,
  };
}
