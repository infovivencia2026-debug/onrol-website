"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  Download,
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  Loader2,
  Pause,
  Play,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileTransferProps {
  officeUser: { id: string; full_name: string };
  uiTheme?: "light" | "dark";
  // Injected from global presence hook (TaskManager level) so users are visible
  // even when not on the File Transfer screen
  presenceOnlineUsers?: OnlineUser[];
  presenceSessionId?: string;
  presenceDeviceType?: "mobile" | "tablet" | "desktop";
  presenceBroadcast?: (msg: SignalMsg) => void;
  presenceAddSignalListener?: (handler: (msg: SignalMsg) => void) => () => void;
}

// from/to are sessionIds (not userIds) — enables same-user cross-device transfer
type SignalMsg =
  | {
      type: "offer";
      from: string;      // sessionId
      fromName: string;
      fromDevice: "mobile" | "tablet" | "desktop";
      to: string;        // sessionId
      sdp: RTCSessionDescriptionInit;
      fileName: string;
      fileSize: number;
      fileType: string;
    }
  | { type: "answer"; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; from: string; to: string; candidate: RTCIceCandidateInit }
  | { type: "decline"; from: string; to: string }
  | { type: "cancel"; from: string; to: string };

interface OnlineUser {
  id: string;          // userId
  sessionId: string;   // unique per device/tab — used for signal routing
  full_name: string;
  deviceType: "mobile" | "tablet" | "desktop";
  isSelf: boolean;     // same user, different device
}

interface IncomingOffer {
  from: string;  // sessionId
  fromName: string;
  fromDevice: "mobile" | "tablet" | "desktop";
  fileName: string;
  fileSize: number;
  fileType: string;
  sdp: RTCSessionDescriptionInit;
}

interface TransferState {
  direction: "sending" | "receiving";
  peerName: string;
  fileName: string;
  fileSize: number;
  transferred: number;
  status: "connecting" | "transferring" | "paused" | "done" | "error";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHUNK_SIZE = 64 * 1024; // 64 KB
const MAX_BUFFERED = 64 * 1024; // backpressure threshold

// STUN helps on same network. TURN relays traffic across different networks/carriers.
const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // Open TURN relay — works across WiFi ↔ 4G / different office networks
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turns:openrelay.metered.ca:443",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

const CHANNEL_NAME = "file-transfer-signals";

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|windows phone/i.test(ua)) return "mobile";
  return "desktop";
}

const DEVICE_ICONS: Record<"mobile" | "tablet" | "desktop", string> = {
  mobile: "📱",
  tablet: "📟",
  desktop: "💻",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(
  mimeType: string,
  className: string
): React.ReactElement {
  if (mimeType.startsWith("image/"))
    return <FileImage className={className} />;
  if (mimeType.startsWith("video/"))
    return <FileVideo className={className} />;
  if (mimeType.startsWith("audio/"))
    return <FileAudio className={className} />;
  if (
    mimeType.startsWith("text/") ||
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  )
    return <FileText className={className} />;
  return <File className={className} />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FileTransfer({
  officeUser,
  uiTheme = "light",
  presenceOnlineUsers,
  presenceSessionId,
  presenceDeviceType,
  presenceBroadcast,
  presenceAddSignalListener,
}: FileTransferProps) {
  const dark = uiTheme === "dark";

  // ---- Session identity — use injected from global hook if available ----
  const sessionIdRef = useRef<string>(presenceSessionId ?? crypto.randomUUID());
  const myDeviceType = useRef<"mobile" | "tablet" | "desktop">(presenceDeviceType ?? getDeviceType());

  // ---- Selected file ----
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Online users ----
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  // ---- Transfer state ----
  const [transfer, setTransfer] = useState<TransferState | null>(null);

  // ---- Incoming offer ----
  const [incomingOffer, setIncomingOffer] = useState<IncomingOffer | null>(
    null
  );

  // ---- Sending state per session button ----
  const [sendingTo, setSendingTo] = useState<string | null>(null); // sessionId

  // ---- Transfer speed ----
  const [transferSpeed, setTransferSpeed] = useState<number>(0);
  const speedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTransferredRef = useRef<number>(0);

  // ---- WebRTC refs (single connection at a time) ----
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const iceQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);

  // ---- Pause/Resume refs ----
  const pausedRef = useRef(false);
  const resumeResolverRef = useRef<(() => void) | null>(null);

  // ---- Receive accumulator ----
  const receiveHeaderRef = useRef<{
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const receiveChunksRef = useRef<ArrayBuffer[]>([]);
  const receivedBytesRef = useRef(0);

  // ---- Supabase realtime channel ref ----
  const realtimeChannelRef = useRef<ReturnType<
    typeof supabase.channel
  > | null>(null);

  // ---- Signal handler ref (always fresh, no stale closure) ----
  const handleSignalRef = useRef<((msg: SignalMsg) => void) | null>(null);

  // ---------------------------------------------------------------------------
  // Speed tracker
  // ---------------------------------------------------------------------------

  const startSpeedTracker = useCallback((getTransferred: () => number) => {
    if (speedTimerRef.current) clearInterval(speedTimerRef.current);
    lastTransferredRef.current = getTransferred();
    speedTimerRef.current = setInterval(() => {
      const current = getTransferred();
      const delta = current - lastTransferredRef.current;
      lastTransferredRef.current = current;
      setTransferSpeed(delta);
    }, 1000);
  }, []);

  const stopSpeedTracker = useCallback(() => {
    if (speedTimerRef.current) {
      clearInterval(speedTimerRef.current);
      speedTimerRef.current = null;
    }
    setTransferSpeed(0);
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup helper
  // ---------------------------------------------------------------------------

  const closePeer = useCallback(() => {
    pausedRef.current = false;
    if (resumeResolverRef.current) {
      resumeResolverRef.current();
      resumeResolverRef.current = null;
    }
    stopSpeedTracker();

    if (dcRef.current) {
      dcRef.current.onopen = null;
      dcRef.current.onmessage = null;
      dcRef.current.onerror = null;
      dcRef.current.onclose = null;
      try {
        dcRef.current.close();
      } catch (_) {
        // ignore
      }
      dcRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ondatachannel = null;
      pcRef.current.onconnectionstatechange = null;
      try {
        pcRef.current.close();
      } catch (_) {
        // ignore
      }
      pcRef.current = null;
    }
    iceQueueRef.current = [];
    remoteDescSetRef.current = false;
    receiveHeaderRef.current = null;
    receiveChunksRef.current = [];
    receivedBytesRef.current = 0;
  }, [stopSpeedTracker]);

  // ---------------------------------------------------------------------------
  // Drain ICE queue after remote description is set
  // ---------------------------------------------------------------------------

  const drainIceQueue = useCallback(async () => {
    if (!pcRef.current) return;
    for (const candidate of iceQueueRef.current) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("Failed to add queued ICE candidate", e);
      }
    }
    iceQueueRef.current = [];
  }, []);

  // ---------------------------------------------------------------------------
  // Broadcast helper
  // ---------------------------------------------------------------------------

  const broadcast = useCallback((msg: SignalMsg) => {
    if (presenceBroadcast) {
      presenceBroadcast(msg);
    } else {
      realtimeChannelRef.current?.send({
        type: "broadcast",
        event: "signal",
        payload: msg,
      });
    }
  }, [presenceBroadcast]);

  // ---------------------------------------------------------------------------
  // Send file over data channel (with pause/resume support)
  // ---------------------------------------------------------------------------

  const sendFileOverChannel = useCallback(
    (file: File, dc: RTCDataChannel) => {
      // Send header first
      const header = JSON.stringify({
        name: file.name,
        size: file.size,
        type: file.type,
      });
      dc.send(header);

      let offset = 0;

      // Keep a ref to transferred for the speed tracker
      const getTransferred = () => offset;
      startSpeedTracker(getTransferred);

      const waitIfPaused = (): Promise<void> => {
        if (!pausedRef.current) return Promise.resolve();
        return new Promise<void>((resolve) => {
          resumeResolverRef.current = resolve;
        });
      };

      const sendNextChunk = async () => {
        while (offset < file.size) {
          // Pause check
          await waitIfPaused();

          if (dc.bufferedAmount > MAX_BUFFERED) {
            // Wait for bufferedamountlow
            await new Promise<void>((resolve) => {
              dc.onbufferedamountlow = () => {
                dc.onbufferedamountlow = null;
                resolve();
              };
            });
            continue;
          }

          const slice = file.slice(offset, offset + CHUNK_SIZE);
          const arrayBuffer = await new Promise<ArrayBuffer>(
            (resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                if (!e.target?.result || typeof e.target.result === "string") {
                  reject(new Error("Invalid read result"));
                  return;
                }
                resolve(e.target.result);
              };
              reader.onerror = () => reject(reader.error);
              reader.readAsArrayBuffer(slice);
            }
          );

          try {
            dc.send(arrayBuffer);
          } catch (err) {
            console.error("DataChannel send error", err);
            setTransfer((prev) =>
              prev ? { ...prev, status: "error" } : null
            );
            stopSpeedTracker();
            toast.error("Transfer failed: connection error");
            return;
          }

          const currentOffset = offset;
          offset += CHUNK_SIZE;

          setTransfer((prev) => {
            if (!prev) return null;
            const transferred = Math.min(currentOffset + CHUNK_SIZE, file.size);
            if (transferred >= file.size) {
              return { ...prev, transferred: file.size, status: "done" };
            }
            return { ...prev, transferred };
          });

          if (offset >= file.size) {
            stopSpeedTracker();
            toast.success(`${file.name} sent successfully`);
          }
        }
      };

      sendNextChunk();
    },
    [startSpeedTracker, stopSpeedTracker]
  );

  // ---------------------------------------------------------------------------
  // Pause transfer
  // ---------------------------------------------------------------------------

  const pauseTransfer = useCallback(() => {
    pausedRef.current = true;
    stopSpeedTracker();
    setTransfer((prev) =>
      prev && prev.status === "transferring"
        ? { ...prev, status: "paused" }
        : prev
    );
  }, [stopSpeedTracker]);

  // ---------------------------------------------------------------------------
  // Resume transfer
  // ---------------------------------------------------------------------------

  const resumeTransfer = useCallback(() => {
    pausedRef.current = false;
    setTransfer((prev) => {
      if (prev && prev.status === "paused") {
        return { ...prev, status: "transferring" };
      }
      return prev;
    });
    // Restart speed tracker using current transfer state
    lastTransferredRef.current = 0;
    if (speedTimerRef.current) clearInterval(speedTimerRef.current);
    // We can't easily pass getTransferred here, so we track via setTransfer diffs
    speedTimerRef.current = setInterval(() => {
      setTransfer((prev) => {
        if (prev) {
          const current = prev.transferred;
          const delta = current - lastTransferredRef.current;
          lastTransferredRef.current = current;
          setTransferSpeed(delta);
        }
        return prev;
      });
    }, 1000);

    if (resumeResolverRef.current) {
      resumeResolverRef.current();
      resumeResolverRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Setup data channel handlers (receiver side)
  // ---------------------------------------------------------------------------

  const setupReceiverChannel = useCallback(
    (dc: RTCDataChannel, peerName: string) => {
      dcRef.current = dc;
      dc.binaryType = "arraybuffer";

      dc.onmessage = (event) => {
        if (typeof event.data === "string") {
          // JSON header
          try {
            const header = JSON.parse(event.data) as {
              name: string;
              size: number;
              type: string;
            };
            receiveHeaderRef.current = header;
            receiveChunksRef.current = [];
            receivedBytesRef.current = 0;
            lastTransferredRef.current = 0;
            setTransfer({
              direction: "receiving",
              peerName,
              fileName: header.name,
              fileSize: header.size,
              transferred: 0,
              status: "transferring",
            });
            // Start speed tracker for receiver
            if (speedTimerRef.current) clearInterval(speedTimerRef.current);
            speedTimerRef.current = setInterval(() => {
              const current = receivedBytesRef.current;
              const delta = current - lastTransferredRef.current;
              lastTransferredRef.current = current;
              setTransferSpeed(delta);
            }, 1000);
          } catch (e) {
            console.error("Failed to parse header", e);
          }
        } else if (event.data instanceof ArrayBuffer) {
          const chunk = event.data;
          receiveChunksRef.current.push(chunk);
          receivedBytesRef.current += chunk.byteLength;

          const header = receiveHeaderRef.current;
          if (!header) return;

          setTransfer((prev) => {
            if (!prev) return null;
            return { ...prev, transferred: receivedBytesRef.current };
          });

          if (receivedBytesRef.current >= header.size) {
            stopSpeedTracker();
            // Assemble and download
            const blob = new Blob(receiveChunksRef.current, {
              type: header.type || "application/octet-stream",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = header.name;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 1000);

            setTransfer((prev) =>
              prev ? { ...prev, status: "done" } : null
            );
            toast.success(`${header.name} received and downloaded`);
          }
        }
      };

      dc.onerror = (e) => {
        console.error("DataChannel error", e);
        stopSpeedTracker();
        setTransfer((prev) =>
          prev ? { ...prev, status: "error" } : null
        );
        toast.error("Transfer failed");
      };

      dc.onclose = () => {
        stopSpeedTracker();
        // Clean up after a short delay so progress bar shows done
        setTimeout(() => {
          setTransfer(null);
        }, 3000);
      };
    },
    [stopSpeedTracker]
  );

  // ---------------------------------------------------------------------------
  // Initiate send (sender creates offer)
  // ---------------------------------------------------------------------------

  const initiateTransfer = useCallback(
    async (targetUser: OnlineUser) => {
      if (!selectedFile) {
        toast.error("Please select a file first");
        return;
      }
      if (transfer) {
        toast.error("A transfer is already in progress");
        return;
      }

      setSendingTo(targetUser.sessionId);

      closePeer();

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      // Create data channel on sender side
      const dc = pc.createDataChannel("file-transfer");
      dc.bufferedAmountLowThreshold = MAX_BUFFERED;
      dc.binaryType = "arraybuffer";
      dcRef.current = dc;

      dc.onopen = () => {
        setTransfer((prev) =>
          prev ? { ...prev, status: "transferring" } : null
        );
        sendFileOverChannel(selectedFile!, dc);
      };

      dc.onerror = (e) => {
        console.error("DataChannel error", e);
        stopSpeedTracker();
        setTransfer((prev) =>
          prev ? { ...prev, status: "error" } : null
        );
        toast.error("Transfer failed");
        setSendingTo(null);
      };

      dc.onclose = () => {
        stopSpeedTracker();
        setTimeout(() => {
          setTransfer(null);
          setSendingTo(null);
        }, 3000);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          broadcast({
            type: "ice",
            from: sessionIdRef.current,
            to: targetUser.sessionId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "disconnected"
        ) {
          stopSpeedTracker();
          setTransfer((prev) => {
            // Don't flip to error if transfer already completed successfully
            if (!prev || prev.status === "done") return prev;
            toast.error("Connection lost");
            return { ...prev, status: "error" };
          });
          setSendingTo(null);
        }
      };

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        setTransfer({
          direction: "sending",
          peerName: targetUser.isSelf ? `My ${targetUser.deviceType}` : targetUser.full_name,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          transferred: 0,
          status: "connecting",
        });

        broadcast({
          type: "offer",
          from: sessionIdRef.current,
          fromName: officeUser.full_name,
          fromDevice: myDeviceType.current,
          to: targetUser.sessionId,
          sdp: pc.localDescription!,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
        });
      } catch (e) {
        console.error("Failed to create offer", e);
        toast.error("Failed to initiate transfer");
        closePeer();
        setSendingTo(null);
        setTransfer(null);
      }
    },
    [
      selectedFile,
      transfer,
      officeUser,
      broadcast,
      closePeer,
      sendFileOverChannel,
      stopSpeedTracker,
    ]
  );

  // ---------------------------------------------------------------------------
  // Accept incoming offer
  // ---------------------------------------------------------------------------

  const acceptOffer = useCallback(async () => {
    if (!incomingOffer) return;
    const offer = incomingOffer;
    setIncomingOffer(null);

    closePeer();

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.ondatachannel = (event) => {
      setupReceiverChannel(event.channel, offer.fromName);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        broadcast({
          type: "ice",
          from: sessionIdRef.current,
          to: offer.from,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        stopSpeedTracker();
        setTransfer((prev) => {
          // Don't flip to error if transfer already completed successfully
          if (!prev || prev.status === "done") return prev;
          toast.error("Connection lost");
          return { ...prev, status: "error" };
        });
      }
    };

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer.sdp));
      remoteDescSetRef.current = true;
      await drainIceQueue();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      setTransfer({
        direction: "receiving",
        peerName: offer.fromName,
        fileName: offer.fileName,
        fileSize: offer.fileSize,
        transferred: 0,
        status: "connecting",
      });

      broadcast({
        type: "answer",
        from: sessionIdRef.current,
        to: offer.from,
        sdp: pc.localDescription!,
      });
    } catch (e) {
      console.error("Failed to accept offer", e);
      toast.error("Failed to accept transfer");
      closePeer();
      setTransfer(null);
    }
  }, [
    incomingOffer,
    officeUser,
    broadcast,
    closePeer,
    drainIceQueue,
    setupReceiverChannel,
    stopSpeedTracker,
  ]);

  // ---------------------------------------------------------------------------
  // Decline incoming offer
  // ---------------------------------------------------------------------------

  const declineOffer = useCallback(() => {
    if (!incomingOffer) return;
    broadcast({
      type: "decline",
      from: sessionIdRef.current,
      to: incomingOffer.from,
    });
    setIncomingOffer(null);
  }, [incomingOffer, broadcast]);

  // ---------------------------------------------------------------------------
  // Cancel ongoing transfer
  // ---------------------------------------------------------------------------

  const cancelTransfer = useCallback(() => {
    if (transfer) {
      const peerSessionId = onlineUsers.find(
        (u) => (u.isSelf ? `My ${u.deviceType}` : u.full_name) === transfer.peerName
      )?.sessionId;
      if (peerSessionId) {
        broadcast({ type: "cancel", from: sessionIdRef.current, to: peerSessionId });
      }
    }
    closePeer();
    setTransfer(null);
    setSendingTo(null);
    toast.info("Transfer cancelled");
  }, [transfer, onlineUsers, broadcast, closePeer]);

  // ---------------------------------------------------------------------------
  // Supabase Realtime setup
  // ---------------------------------------------------------------------------

  // Sync online users from global presence hook
  useEffect(() => {
    if (presenceOnlineUsers) {
      setOnlineUsers(presenceOnlineUsers);
    }
  }, [presenceOnlineUsers]);

  // Register signal listener on global presence hook
  useEffect(() => {
    if (!presenceAddSignalListener) return;
    const unsubscribe = presenceAddSignalListener((payload) => {
      handleSignalRef.current?.(payload);
    });
    return unsubscribe;
  }, [presenceAddSignalListener]);

  useEffect(() => {
    // Skip own channel setup if global presence is injected
    if (presenceOnlineUsers !== undefined) return;

    const channel = supabase.channel(CHANNEL_NAME, {
      config: {
        // Use sessionId as key so same user on multiple devices appears separately
        presence: { key: sessionIdRef.current },
        broadcast: { self: false },
      },
    });

    realtimeChannelRef.current = channel;

    // Presence: track online users (including own other devices)
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{
        userId: string;
        sessionId: string;
        full_name: string;
        deviceType: "mobile" | "tablet" | "desktop";
      }>();
      const users: OnlineUser[] = [];
      for (const presences of Object.values(state)) {
        for (const p of presences as Array<{
          userId: string;
          sessionId: string;
          full_name: string;
          deviceType: "mobile" | "tablet" | "desktop";
        }>) {
          // Exclude the exact current session but include own other devices
          if (p.sessionId && p.sessionId !== sessionIdRef.current) {
            users.push({
              id: p.userId,
              sessionId: p.sessionId,
              full_name: p.full_name,
              deviceType: p.deviceType ?? "desktop",
              isSelf: p.userId === officeUser.id,
            });
          }
        }
      }
      setOnlineUsers(users);
    });

    // Signals — forward to the ref handler so it's always fresh
    channel.on(
      "broadcast",
      { event: "signal" },
      ({ payload }: { payload: SignalMsg }) => {
        if (payload.to !== sessionIdRef.current) return;
        handleSignalRef.current?.(payload);
      },
    );

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          userId: officeUser.id,
          sessionId: sessionIdRef.current,
          full_name: officeUser.full_name,
          deviceType: myDeviceType.current,
        });
      }
    });

    return () => {
      channel.unsubscribe();
      realtimeChannelRef.current = null;
      closePeer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [officeUser.id, officeUser.full_name]);

  // Keep handleSignalRef current so closures inside are always fresh
  useEffect(() => {
    handleSignalRef.current = async (payload: SignalMsg) => {
      switch (payload.type) {
        case "offer": {
          if (transfer || incomingOffer) {
            broadcast({
              type: "decline",
              from: sessionIdRef.current,
              to: payload.from,
            });
            return;
          }
          setIncomingOffer({
            from: payload.from,
            fromName: payload.fromName,
            fromDevice: payload.fromDevice ?? "desktop",
            fileName: payload.fileName,
            fileSize: payload.fileSize,
            fileType: payload.fileType,
            sdp: payload.sdp,
          });
          break;
        }
        case "answer": {
          const pc = pcRef.current;
          if (!pc) return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            remoteDescSetRef.current = true;
            await drainIceQueue();
          } catch (e) {
            console.error("Failed to set remote description", e);
            toast.error("Connection setup failed");
          }
          break;
        }
        case "ice": {
          const pc = pcRef.current;
          if (!pc) return;
          if (remoteDescSetRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              console.warn("Failed to add ICE candidate", e);
            }
          } else {
            iceQueueRef.current.push(payload.candidate);
          }
          break;
        }
        case "decline": {
          toast.info("Transfer was declined");
          closePeer();
          setTransfer(null);
          setSendingTo(null);
          break;
        }
        case "cancel": {
          toast.info("Transfer was cancelled by the other side");
          closePeer();
          setTransfer(null);
          break;
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transfer, incomingOffer, broadcast, closePeer, drainIceQueue]);

  // ---------------------------------------------------------------------------
  // File drag & drop handlers
  // ---------------------------------------------------------------------------

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  // ---------------------------------------------------------------------------
  // Theme classes
  // ---------------------------------------------------------------------------

  const bg = dark ? "bg-[#f3f5f8] text-slate-100" : "bg-white text-slate-900";
  const card = dark ? "bg-[#404040]" : "bg-slate-50";
  const border = dark ? "border-[#454545]" : "border-slate-200";
  const subtext = dark ? "text-slate-400" : "text-slate-500";
  const dropzoneBorder = dragging
    ? "border-blue-500 bg-orange-500/10"
    : dark
    ? "border-slate-600 hover:border-slate-400 hover:bg-[#404040]/60"
    : "border-slate-300 hover:border-orange-400 hover:bg-blue-50/50";
  const btnPrimary =
    "bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const btnDanger =
    "bg-red-600 hover:bg-red-700 text-white font-medium py-1.5 px-3 rounded-lg text-sm transition-colors";
  const btnGhost = dark
    ? "bg-[#454545] hover:bg-slate-600 text-slate-200 font-medium py-1.5 px-3 rounded-lg text-sm transition-colors"
    : "bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-1.5 px-3 rounded-lg text-sm transition-colors";
  const btnAmber =
    "bg-amber-500 hover:bg-amber-600 text-white font-medium py-1.5 px-3 rounded-lg text-sm transition-colors flex items-center gap-1";
  const btnEmerald =
    "bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-1.5 px-3 rounded-lg text-sm transition-colors flex items-center gap-1";

  // ---------------------------------------------------------------------------
  // Progress calculation
  // ---------------------------------------------------------------------------

  const progressPct =
    transfer && transfer.fileSize > 0
      ? Math.round((transfer.transferred / transfer.fileSize) * 100)
      : 0;

  const isActiveTransfer =
    transfer?.status === "transferring" || transfer?.status === "paused";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div
      className={`${bg} rounded-2xl shadow-lg overflow-hidden w-full max-w-2xl mx-auto`}
    >
      {/* ---- Incoming offer modal ---- */}
      {incomingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className={`${dark ? "bg-[#404040] text-slate-100" : "bg-white text-slate-900"} rounded-2xl shadow-2xl p-6 w-full max-w-sm`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Download className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Incoming File Transfer</h3>
                <p className={`text-sm ${subtext}`}>
                  Review and accept or decline
                </p>
              </div>
            </div>

            <div
              className={`rounded-xl p-4 mb-5 space-y-2 ${dark ? "bg-[#454545]" : "bg-slate-50"}`}
            >
              <div className="flex justify-between text-sm">
                <span className={subtext}>From</span>
                <span className="font-medium">
                  {incomingOffer.fromName === officeUser.full_name
                    ? `${DEVICE_ICONS[incomingOffer.fromDevice ?? "desktop"]} My ${incomingOffer.fromDevice ?? "device"}`
                    : incomingOffer.fromName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={subtext}>File</span>
                <span className="font-medium max-w-[180px] truncate text-right">
                  {incomingOffer.fileName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={subtext}>Size</span>
                <span className="font-medium">
                  {formatBytes(incomingOffer.fileSize)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={acceptOffer}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Accept
              </button>
              <button
                onClick={declineOffer}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-xl transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Header ---- */}
      <div
        className={`px-6 py-4 border-b ${border} flex items-center justify-between`}
      >
        <div>
          <h2 className="font-semibold text-lg">Live File Transfer</h2>
          <p className={`text-sm ${subtext}`}>
            Send files instantly — no server storage
          </p>
        </div>
        <div
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${dark ? "bg-[#f3f5f8]/50 text-orange-300" : "bg-blue-50 text-orange-700"}`}
        >
          P2P WebRTC
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* ---- Drop zone ---- */}
        <div>
          <div
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${dropzoneBorder}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                {getFileIcon(
                  selectedFile.type,
                  `w-8 h-8 flex-shrink-0 ${dark ? "text-orange-400" : "text-orange-600"}`
                )}
                <div className="text-left">
                  <p className="font-medium text-sm truncate max-w-[280px]">
                    {selectedFile.name}
                  </p>
                  <p className={`text-xs ${subtext}`}>
                    {formatBytes(selectedFile.size)}
                  </p>
                </div>
                <button
                  className={`ml-2 p-1 rounded-full ${dark ? "hover:bg-slate-600" : "hover:bg-slate-200"} transition-colors`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  aria-label="Clear file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div
                  className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${dark ? "bg-[#454545]" : "bg-slate-100"}`}
                >
                  <Upload
                    className={`w-7 h-7 ${dark ? "text-slate-400" : "text-slate-500"}`}
                  />
                </div>
                <div>
                  <p className={`text-sm font-medium ${dark ? "text-slate-300" : "text-slate-600"}`}>
                    Drop a file here or{" "}
                    <span className="text-orange-500 underline">browse</span>
                  </p>
                  <p className={`text-xs mt-1 ${subtext}`}>
                    Any file type, any size
                  </p>
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />
        </div>

        {/* ---- Online users ---- */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className={`w-4 h-4 ${subtext}`} />
            <span className="text-sm font-medium">
              Online{" "}
              <span className={subtext}>({onlineUsers.length})</span>
            </span>
          </div>

          {onlineUsers.length === 0 ? (
            <div className={`${card} border ${border} rounded-2xl p-4 text-center text-sm ${subtext}`}>
              No one else online — open this app on another device to send to yourself
            </div>
          ) : (
            <div className="space-y-3">
              {/* My other devices */}
              {onlineUsers.filter((u) => u.isSelf).length > 0 && (
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-wide mb-2 ${subtext}`}>My Devices</p>
                  <div className="flex flex-wrap gap-3">
                    {onlineUsers.filter((u) => u.isSelf).map((user) => (
                      <div
                        key={user.sessionId}
                        className={`${card} border-2 ${dark ? "border-emerald-700" : "border-emerald-200"} rounded-2xl p-3 flex flex-col items-center gap-2 min-w-[100px]`}
                      >
                        <div className="text-2xl">{DEVICE_ICONS[user.deviceType]}</div>
                        <span className="text-xs font-semibold capitalize">{user.deviceType}</span>
                        <button
                          className={btnEmerald}
                          disabled={!selectedFile || !!transfer || sendingTo === user.sessionId}
                          onClick={() => initiateTransfer(user)}
                        >
                          {sendingTo === user.sessionId ? (
                            <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Sending</span>
                          ) : (
                            <span className="flex items-center gap-1"><Upload className="w-3 h-3" />Send</span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Other team members */}
              {onlineUsers.filter((u) => !u.isSelf).length > 0 && (
                <div>
                  {onlineUsers.filter((u) => u.isSelf).length > 0 && (
                    <p className={`text-[11px] font-semibold uppercase tracking-wide mb-2 ${subtext}`}>Team Members</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    {onlineUsers.filter((u) => !u.isSelf).map((user) => (
                      <div
                        key={user.sessionId}
                        className={`${card} border ${border} rounded-2xl p-3 flex flex-col items-center gap-2 min-w-[100px]`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm ${dark ? "bg-[#404040] text-orange-200" : "bg-blue-100 text-orange-700"}`}>
                          {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-medium truncate max-w-[80px] block">
                            {user.full_name.split(" ")[0]}
                          </span>
                          <span className={`text-[10px] ${subtext}`}>{DEVICE_ICONS[user.deviceType]} {user.deviceType}</span>
                        </div>
                        <button
                          className={btnPrimary}
                          disabled={!selectedFile || !!transfer || sendingTo === user.sessionId}
                          onClick={() => initiateTransfer(user)}
                        >
                          {sendingTo === user.sessionId ? (
                            <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Sending</span>
                          ) : (
                            <span className="flex items-center gap-1"><Upload className="w-3 h-3" />Send</span>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ---- Transfer progress ---- */}
        {transfer && (
          <div
            className={`${card} border ${border} rounded-2xl p-4 space-y-3`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {transfer.direction === "sending" ? (
                  <Upload
                    className={`w-4 h-4 flex-shrink-0 ${dark ? "text-orange-400" : "text-orange-600"}`}
                  />
                ) : (
                  <Download
                    className={`w-4 h-4 flex-shrink-0 ${dark ? "text-emerald-400" : "text-emerald-600"}`}
                  />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate max-w-[220px]">
                    {transfer.fileName}
                  </p>
                  <p className={`text-xs ${subtext}`}>
                    {transfer.direction === "sending" ? "→" : "←"}{" "}
                    {transfer.peerName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Status badges */}
                {transfer.status === "connecting" && (
                  <span
                    className={`text-xs ${dark ? "text-yellow-400" : "text-yellow-600"} flex items-center gap-1`}
                  >
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Connecting
                  </span>
                )}
                {transfer.status === "done" && (
                  <span
                    className={`text-xs ${dark ? "text-emerald-400" : "text-emerald-600"} flex items-center gap-1`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Done
                  </span>
                )}
                {transfer.status === "error" && (
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    Error
                  </span>
                )}
                {transfer.status === "paused" && (
                  <span className="text-xs text-amber-500 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                    Paused
                  </span>
                )}

                {/* Pause / Resume buttons (sender only) */}
                {transfer.direction === "sending" &&
                  transfer.status === "transferring" && (
                    <button
                      onClick={pauseTransfer}
                      className={btnAmber}
                      title="Pause transfer"
                    >
                      <Pause className="w-3 h-3" />
                      Pause
                    </button>
                  )}
                {transfer.direction === "sending" &&
                  transfer.status === "paused" && (
                    <button
                      onClick={resumeTransfer}
                      className={btnEmerald}
                      title="Resume transfer"
                    >
                      <Play className="w-3 h-3" />
                      Resume
                    </button>
                  )}

                {/* Cancel button */}
                {(transfer.status === "transferring" ||
                  transfer.status === "paused" ||
                  transfer.status === "connecting") && (
                  <button
                    onClick={cancelTransfer}
                    className={btnGhost}
                    title="Cancel transfer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                {(transfer.status === "done" ||
                  transfer.status === "error") && (
                  <button
                    onClick={() => setTransfer(null)}
                    className={btnGhost}
                    title="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div>
              <div
                className={`h-1.5 rounded-full overflow-hidden ${dark ? "bg-[#454545]" : "bg-slate-200"}`}
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 relative overflow-hidden ${
                    transfer.status === "done"
                      ? "bg-emerald-500"
                      : transfer.status === "error"
                      ? "bg-red-500"
                      : transfer.status === "paused"
                      ? "bg-amber-400"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${progressPct}%` }}
                >
                  {transfer.status === "transferring" && (
                    <span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]"
                      style={{
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s infinite linear",
                      }}
                    />
                  )}
                </div>
              </div>
              <div className={`flex justify-between mt-1.5 text-xs ${subtext}`}>
                <span>
                  {formatBytes(transfer.transferred)} /{" "}
                  {formatBytes(transfer.fileSize)}
                </span>
                <span className="flex items-center gap-2">
                  {transfer.status === "transferring" &&
                    transferSpeed > 0 && (
                      <span className={`${dark ? "text-slate-400" : "text-slate-500"}`}>
                        {formatBytes(transferSpeed)}/s
                      </span>
                    )}
                  <span>{progressPct}%</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shimmer keyframe (injected inline for portability) */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
