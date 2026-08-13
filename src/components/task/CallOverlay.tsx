import React, { useEffect } from "react";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Phone, SwitchCamera,
} from "lucide-react";
import type { CallState, CallSession } from "@/hooks/taskManager/useWebRTC";

interface CallOverlayProps {
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
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  switchCamera: () => Promise<void>;
}

const CallOverlay: React.FC<CallOverlayProps> = ({
  callState, callSession,
  localStream, remoteStream,
  localVideoRef, remoteVideoRef,
  isMuted, isCameraOff, isFrontCamera, canSwitchCamera,
  acceptCall, rejectCall, endCall, toggleMute, toggleCamera, switchCamera,
}) => {
  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, localVideoRef]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, remoteVideoRef]);

  if (callState === "idle" || !callSession) return null;

  const isVideo = callSession.callType === "video";
  const isActive = callState === "active";
  const isIncoming = callState === "incoming";
  const remoteName = callSession.remoteUser.full_name || callSession.remoteUser.email || "Unknown";

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-between bg-[#f3f5f8] p-4 sm:p-6 text-white">
      {/*
        Remote video — always in DOM so srcObject can be set at any time.
        Hidden when not in active video call (but audio still plays).
      */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={
          isVideo && isActive
            ? "absolute inset-0 h-full w-full object-contain bg-black"
            : "pointer-events-none absolute opacity-0"
        }
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#f3f5f8]/85 via-transparent to-[#f3f5f8]/95" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_45%)]" />

      {/* Caller / callee info */}
      <div className="relative z-10 mt-6 sm:mt-10 flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#f3f5f8]/45 px-5 py-4 backdrop-blur-md">
        <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-2xl sm:text-3xl font-bold shadow-lg shadow-cyan-600/30">
          {remoteName.slice(0, 1).toUpperCase()}
        </div>
        <p className="text-xl sm:text-2xl font-semibold">{remoteName}</p>
        <p className="text-xs sm:text-sm text-slate-300">
          {isIncoming
            ? `Incoming ${callSession.callType} call…`
            : callState === "outgoing"
            ? "Calling…"
            : "Connected"}
        </p>
        {isActive && (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        )}
      </div>

      {/*
        Local video PiP — always in DOM.
        Hidden via CSS until the call is active + video.
      */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={
          isVideo && isActive
            ? "absolute bottom-32 right-4 sm:bottom-36 sm:right-6 z-20 h-28 w-20 sm:h-36 sm:w-28 rounded-2xl border border-white/30 object-contain bg-black shadow-xl shadow-black/50"
            : "pointer-events-none absolute opacity-0"
        }
      />

      {/* Camera switch button — visible during active video call, top-right */}
      {isVideo && isActive && canSwitchCamera && (
        <button
          onClick={() => void switchCamera()}
          title={isFrontCamera ? "Switch to rear camera" : "Switch to front camera"}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/15 backdrop-blur hover:bg-white/25"
        >
          <SwitchCamera className="h-5 w-5 text-white" />
        </button>
      )}

      {/* Controls */}
      <div className="relative z-10 mb-4 sm:mb-8 flex items-center gap-3 sm:gap-5 rounded-2xl border border-white/10 bg-[#f3f5f8]/55 px-4 py-3 sm:px-5 sm:py-4 backdrop-blur-md">
        {isIncoming ? (
          <>
            <button
              onClick={rejectCall}
              title="Decline"
              className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-rose-500 shadow-xl transition hover:bg-rose-600 active:scale-95"
            >
              <PhoneOff className="h-7 w-7" />
            </button>
            <button
              onClick={() => void acceptCall()}
              title="Accept"
              className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-500 shadow-xl transition hover:bg-emerald-600 active:scale-95"
            >
              <Phone className="h-7 w-7" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
              className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition active:scale-95 ${
                isMuted ? "bg-rose-500" : "bg-white/20 hover:bg-white/30"
              }`}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>
            {isVideo && (
              <>
                <button
                  onClick={toggleCamera}
                  title={isCameraOff ? "Turn camera on" : "Turn camera off"}
                  className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition active:scale-95 ${
                    isCameraOff ? "bg-rose-500" : "bg-white/20 hover:bg-white/30"
                  }`}
                >
                  {isCameraOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                </button>
                <button
                  onClick={() => void switchCamera()}
                  title={isFrontCamera ? "Rear camera" : "Front camera"}
                  disabled={!canSwitchCamera}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 shadow-lg transition hover:bg-white/30 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <SwitchCamera className="h-6 w-6" />
                </button>
              </>
            )}
            <button
              onClick={endCall}
              title="End call"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500 shadow-xl transition hover:bg-rose-600 active:scale-95"
            >
              <PhoneOff className="h-7 w-7" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(CallOverlay);
