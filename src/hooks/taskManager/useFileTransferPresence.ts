/**
 * useFileTransferPresence
 *
 * Runs at TaskManager level (always mounted) so all your devices appear
 * in the online users list even when not on the File Transfer screen.
 *
 * Passes the live channel + online users down to FileTransfer component.
 */

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

const CHANNEL_NAME = "file-transfer-signals";

function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|windows phone/i.test(ua)) return "mobile";
  return "desktop";
}

export interface FTOnlineUser {
  id: string;
  sessionId: string;
  full_name: string;
  deviceType: "mobile" | "tablet" | "desktop";
  isSelf: boolean;
}

export type FTSignalMsg =
  | {
      type: "offer";
      from: string;
      fromName: string;
      fromDevice: "mobile" | "tablet" | "desktop";
      to: string;
      sdp: RTCSessionDescriptionInit;
      fileName: string;
      fileSize: number;
      fileType: string;
    }
  | { type: "answer"; from: string; to: string; sdp: RTCSessionDescriptionInit }
  | { type: "ice"; from: string; to: string; candidate: RTCIceCandidateInit }
  | { type: "decline"; from: string; to: string }
  | { type: "cancel"; from: string; to: string };

export interface UseFileTransferPresenceReturn {
  onlineUsers: FTOnlineUser[];
  sessionId: string;
  deviceType: "mobile" | "tablet" | "desktop";
  broadcast: (msg: FTSignalMsg) => void;
  addSignalListener: (handler: (msg: FTSignalMsg) => void) => () => void;
}

export function useFileTransferPresence(
  officeUser: { id: string; full_name: string } | null,
): UseFileTransferPresenceReturn {
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const deviceTypeRef = useRef<"mobile" | "tablet" | "desktop">(getDeviceType());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const signalListenersRef = useRef<Set<(msg: FTSignalMsg) => void>>(new Set());

  const [onlineUsers, setOnlineUsers] = useState<FTOnlineUser[]>([]);

  useEffect(() => {
    if (!officeUser?.id) return;

    const channel = supabase.channel(CHANNEL_NAME, {
      config: {
        presence: { key: sessionIdRef.current },
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{
        userId: string;
        sessionId: string;
        full_name: string;
        deviceType: "mobile" | "tablet" | "desktop";
      }>();

      const users: FTOnlineUser[] = [];
      for (const presences of Object.values(state)) {
        for (const p of presences as Array<{
          userId: string;
          sessionId: string;
          full_name: string;
          deviceType: "mobile" | "tablet" | "desktop";
        }>) {
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

    // Route incoming signals to all registered listeners
    channel.on(
      "broadcast",
      { event: "signal" },
      ({ payload }: { payload: FTSignalMsg }) => {
        if (payload.to !== sessionIdRef.current) return;
        signalListenersRef.current.forEach((handler) => handler(payload));
      },
    );

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          userId: officeUser.id,
          sessionId: sessionIdRef.current,
          full_name: officeUser.full_name,
          deviceType: deviceTypeRef.current,
        });
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setOnlineUsers([]);
    };
  }, [officeUser?.id, officeUser?.full_name]);

  const broadcast = (msg: FTSignalMsg) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "signal",
      payload: msg,
    });
  };

  const addSignalListener = (handler: (msg: FTSignalMsg) => void) => {
    signalListenersRef.current.add(handler);
    return () => signalListenersRef.current.delete(handler);
  };

  return {
    onlineUsers,
    sessionId: sessionIdRef.current,
    deviceType: deviceTypeRef.current,
    broadcast,
    addSignalListener,
  };
}
