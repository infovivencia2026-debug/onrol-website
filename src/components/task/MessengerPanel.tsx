/**
 * MessengerPanel — CRM-grade messenger panel
 *
 * Mobile: Show either conversation list or chat.
 * Desktop: Two-column workspace with consistent CRM surfaces.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCheck,
  Contact,
  CornerUpLeft,
  Copy,
  Download,
  FileImage,
  FileVideo,
  Forward,
  Info,
  Link,
  Loader2,
  MapPin,
  Megaphone,
  Mic,
  MoreVertical,
  Paperclip,
  Pencil,
  Palette,
  Phone,
  Pin,
  Plus,
  RefreshCw,
  School,
  Search,
  Send,
  Share2,
  SmilePlus,
  Square,
  Star,
  StopCircle,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getNativePosition } from "@/lib/capacitorNative";
import type {
  UiTheme,
  OfficeUser,
  OfficeTask,
  Institution,
  MessengerConversation,
  MessengerMessage,
  AnnouncementAckStatus,
  PresenceStatus,
} from "@/types/taskManager";

// ---------------------------------------------------------------------------
// Props (unchanged from before so parent doesn't need updates)
// ---------------------------------------------------------------------------
export interface MessengerPanelProps {
  uiTheme: UiTheme;
  messengerMode: "inbox" | "teams" | "announcements" | "directory";
  openMessengerSection: (section: "inbox" | "teams" | "announcements" | "directory") => void;
  navigate: (path: string, options?: { replace?: boolean }) => void;
  officeUser: OfficeUser;
  messengerConversationQuery: string;
  setMessengerConversationQuery: React.Dispatch<React.SetStateAction<string>>;
  messengerFilteredConversations: MessengerConversation[];
  selectedMessengerConversation: MessengerConversation | null;
  setMessengerConversationId: React.Dispatch<React.SetStateAction<string | null>>;
  messengerMessagesByConversation: Record<string, MessengerMessage[]>;
  markMessengerConversationRead: (conversationId: string, messages: MessengerMessage[]) => Promise<void>;
  pinnedConversationIds: string[];
  toggleConversationPin: (conversationId: string) => Promise<void>;
  toggleConversationMute: (conversationId: string, mute: boolean) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  messengerDirectoryQuery: string;
  setMessengerDirectoryQuery: React.Dispatch<React.SetStateAction<string>>;
  messengerDirectory: OfficeUser[];
  presenceByUserId: Record<string, PresenceStatus>;
  openOrCreateDirectConversation: (member: OfficeUser) => Promise<void>;
  messengerActionBusy: string | null;
  selectedConversationMessagesFiltered: MessengerMessage[];
  selectedConversationMessagesById: Record<string, MessengerMessage>;
  selectedConversationPinnedMessageIds: string[];
  selectedConversationCanModerate: boolean;
  messengerMessageQuery: string;
  setMessengerMessageQuery: React.Dispatch<React.SetStateAction<string>>;
  messengerLoading: boolean;
  messengerError: string | null;
  selectedMessageId: string | null;
  setSelectedMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedMessageForActions: MessengerMessage | null;
  selectedMessagePinned: boolean;
  selectedMessageCanEdit: boolean;
  selectedMessageMine: boolean;
  messengerReplyToId: string | null;
  setMessengerReplyToId: React.Dispatch<React.SetStateAction<string | null>>;
  messengerEditMessageId: string | null;
  setMessengerEditMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  messengerEditBody: string;
  setMessengerEditBody: React.Dispatch<React.SetStateAction<string>>;
  toggleMessagePin: (conversationId: string, messageId: string) => Promise<void>;
  startEditingMessage: (message: MessengerMessage) => void;
  saveEditedMessage: () => Promise<void>;
  initiateCall: (callType: import("@/hooks/taskManager/useWebRTC").CallType, conversationId: string, remoteUser: import("@/types/taskManager").OfficeUser) => Promise<void>;
  softDeleteMessage: (messageId: string) => Promise<void>;
  moderateDeleteMessage: (message: MessengerMessage) => Promise<void>;
  forwardMessages: (messageIds: string[], targetConversationId: string) => Promise<void>;
  messengerConversations: MessengerConversation[];
  messengerComposer: string;
  setMessengerComposer: React.Dispatch<React.SetStateAction<string>>;
  sendMessengerPayload: (payload: {
    body?: string;
    messageType?: "text" | "system" | "linked_record" | "announcement";
    metadata?: Record<string, unknown>;
    replyToMessageId?: string | null;
    linkedEntityType?: "task" | "visit" | "institution" | null;
    linkedEntityId?: string | null;
  }) => Promise<void>;
  uploadMessengerFile: (file: File) => Promise<{
    bucket: string;
    path: string;
    publicUrl: string;
    mimeType: string;
    size: number;
    name: string;
  }>;
  latestGeneralTask: OfficeTask | null;
  latestJourneyTask: OfficeTask | null;
  selectedInstitution: Institution | null;
  sendLinkedRecordMessage: (entityType: "task" | "visit" | "institution", entityId: string, label: string, targetConversationId?: string) => Promise<void>;
  createTeamName: string;
  setCreateTeamName: React.Dispatch<React.SetStateAction<string>>;
  createTeamDescription: string;
  setCreateTeamDescription: React.Dispatch<React.SetStateAction<string>>;
  createTeamMemberIds: string[];
  setCreateTeamMemberIds: React.Dispatch<React.SetStateAction<string[]>>;
  createTeamGroupConversation: () => Promise<void>;
  selectedTeamAddMemberId: string;
  setSelectedTeamAddMemberId: React.Dispatch<React.SetStateAction<string>>;
  addMemberToSelectedTeam: () => Promise<void>;
  removeMemberFromSelectedTeam: (userId: string) => Promise<void>;
  selectedGroupAddableMembers: OfficeUser[];
  selectedConversationMemberUsers: Array<{ user_id: string; role: string; user: OfficeUser | null }>;
  showAnnouncementComposer: boolean;
  setShowAnnouncementComposer: React.Dispatch<React.SetStateAction<boolean>>;
  announcementTitle: string;
  setAnnouncementTitle: React.Dispatch<React.SetStateAction<string>>;
  announcementBody: string;
  setAnnouncementBody: React.Dispatch<React.SetStateAction<string>>;
  createAnnouncementConversation: () => Promise<void>;
  announcementAcks: Record<string, { status: AnnouncementAckStatus; acknowledged_at: string }>;
  announcementRepliesLocked: boolean;
  acknowledgeAnnouncement: (conversationId: string, status: AnnouncementAckStatus) => Promise<void>;
  toggleAnnouncementReplies: (currentlyLocked: boolean) => Promise<void>;
  loadMessengerData: () => Promise<void>;
  markAllMessengerConversationsRead: () => Promise<void>;
  // CSS class strings (kept for compatibility — no longer used internally)
  messengerPanelBorder: string;
  messengerSoftPanel: string;
  messengerGhostBtnClass: string;
  messengerInlineBtnClass: string;
  messengerPrimaryBtnClass: string;
  messengerDangerBtnClass: string;
  messengerInputClass: string;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Avatar circle with initials */
function Avatar({ name, size = "md", color = "emerald" }: { name: string; size?: "sm" | "md" | "lg"; color?: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const sz = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";
  const bg = color === "emerald" ? "bg-emerald-500" : color === "indigo" ? "bg-indigo-500" : color === "amber" ? "bg-amber-500" : "bg-slate-400";
  return (
    <div className={`${sz} ${bg} shrink-0 rounded-full flex items-center justify-center font-bold text-white`}>
      {initials || "?"}
    </div>
  );
}

/** Presence dot */
function PresenceDot({ status }: { status: PresenceStatus | undefined }) {
  const color =
    status === "available" ? "bg-emerald-500" :
    status === "busy" ? "bg-amber-500" :
    status === "in_meeting" ? "bg-violet-500" :
    status === "in_field" ? "bg-sky-500" :
    "bg-slate-300";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white ${color}`} />;
}

/** Format a message timestamp concisely */
function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const diff = now.getTime() - d.getTime();
  if (diff < 7 * 86400000)
    return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

/** Conversation avatar colour from type */
function convColor(type: string) {
  return type === "direct" ? "indigo" : type === "group" ? "emerald" : "amber";
}

/**
 * AttachmentImage — tries the public URL first, falls back to a Supabase
 * signed URL if the bucket is private (HTTP 403 / CORS error on load).
 */
function AttachmentImage({
  src,
  bucket,
  path,
  alt,
  className,
}: {
  src: string;
  bucket?: string;
  path?: string;
  alt?: string;
  className?: string;
}) {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  const handleError = async () => {
    if (!bucket || !path || failed) { setFailed(true); return; }
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const sbUrl = (import.meta as Record<string, unknown> & { env: Record<string, string> }).env.VITE_SUPABASE_URL as string;
      const sbKey = (import.meta as Record<string, unknown> & { env: Record<string, string> }).env.VITE_SUPABASE_ANON_KEY as string;
      if (!sbUrl || !sbKey) { setFailed(true); return; }
      const sb = createClient(sbUrl, sbKey);
      const { data } = await sb.storage.from(bucket).createSignedUrl(path, 3600);
      if (data?.signedUrl) {
        setResolvedSrc(data.signedUrl);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    }
  };

  if (failed) {
    return (
      <div className={`flex items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400 ${className ?? "h-28 w-full"}`}>
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt ?? "Attachment"}
      className={className}
      onError={() => void handleError()}
    />
  );
}

// ---------------------------------------------------------------------------
// Image compression utility
// ---------------------------------------------------------------------------
async function compressImage(file: File, maxDimension = 1280, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (Math.max(width, height) > maxDimension) {
        if (width >= height) { height = Math.round((height * maxDimension) / width); width = maxDimension; }
        else { width = Math.round((width * maxDimension) / height); height = maxDimension; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); resolve(file); return; }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
          resolve(compressed.size < file.size ? compressed : file);
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const MessengerPanel: React.FC<MessengerPanelProps> = (props) => {
  const {
    uiTheme, messengerMode, openMessengerSection, navigate, officeUser,
    messengerConversationQuery, setMessengerConversationQuery,
    messengerFilteredConversations, selectedMessengerConversation,
    setMessengerConversationId, messengerMessagesByConversation,
    markMessengerConversationRead, pinnedConversationIds,
    toggleConversationPin, toggleConversationMute, deleteConversation,
    messengerDirectoryQuery, setMessengerDirectoryQuery,
    messengerDirectory, presenceByUserId,
    openOrCreateDirectConversation, messengerActionBusy,
    selectedConversationMessagesFiltered, selectedConversationMessagesById,
    selectedConversationPinnedMessageIds, selectedConversationCanModerate,
    messengerMessageQuery, setMessengerMessageQuery,
    messengerLoading, messengerError,
    messengerReplyToId, setMessengerReplyToId,
    messengerEditMessageId, setMessengerEditMessageId,
    messengerEditBody, setMessengerEditBody,
    toggleMessagePin, startEditingMessage, saveEditedMessage,
    initiateCall, softDeleteMessage, forwardMessages,
    messengerConversations, messengerComposer, setMessengerComposer,
    sendMessengerPayload, uploadMessengerFile,
    latestGeneralTask, latestJourneyTask, selectedInstitution,
    sendLinkedRecordMessage,
    createTeamName, setCreateTeamName, createTeamDescription, setCreateTeamDescription,
    createTeamGroupConversation, selectedTeamAddMemberId, setSelectedTeamAddMemberId,
    addMemberToSelectedTeam, removeMemberFromSelectedTeam,
    selectedGroupAddableMembers, selectedConversationMemberUsers,
    showAnnouncementComposer, setShowAnnouncementComposer,
    announcementTitle, setAnnouncementTitle, announcementBody, setAnnouncementBody,
    createAnnouncementConversation, announcementAcks, announcementRepliesLocked,
    acknowledgeAnnouncement, toggleAnnouncementReplies,
    loadMessengerData, markAllMessengerConversationsRead,
  } = props;

  const dark = uiTheme === "dark";

  // ── Mobile: "list" shows sidebar, "chat" shows chat pane ──────────────────
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // When a conversation is selected on mobile, slide to chat
  const openConversation = async (conv: MessengerConversation) => {
    setMessengerConversationId(conv.id);
    navigate(`/messenger/chat/${conv.id}`, { replace: true });
    const msgs = messengerMessagesByConversation[conv.id] || [];
    await markMessengerConversationRead(conv.id, msgs);
    setMobileView("chat");
  };

  // ── Auto-scroll messages ───────────────────────────────────────────────────
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [selectedConversationMessagesFiltered]);

  // ── WhatsApp interaction state ────────────────────────────────────────────
  const [ctxMsg, setCtxMsg] = useState<MessengerMessage | null>(null);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardMsgIds, setForwardMsgIds] = useState<string[]>([]);
  const [forwardQuery, setForwardQuery] = useState("");
  const [forwardTargetId, setForwardTargetId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [composerColor, setComposerColor] = useState("#f3f5f8");
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [voiceDurationSec, setVoiceDurationSec] = useState(0);
  const ctxMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [moreMenuPos, setMoreMenuPos] = useState<{ top: number; right: number } | null>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const photoInputRef  = useRef<HTMLInputElement>(null);
  const videoInputRef  = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const docInputRef    = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<BlobPart[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);

  const [starredIds, setStarredIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`starred-msgs-${officeUser.id}`) ?? "[]") as string[]); }
    catch { return new Set(); }
  });
  const [hiddenMsgIds, setHiddenMsgIds] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(`hidden-msgs-${officeUser.id}`) ?? "[]") as string[]); }
    catch { return new Set(); }
  });

  // ── Reactions (client-side, persisted per conversation in localStorage) ──
  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, string[]>>>({});
  const [showReactionPickerFor, setShowReactionPickerFor] = useState<string | null>(null);
  const convId = selectedMessengerConversation?.id ?? "";

  // Load reactions when conversation changes
  useEffect(() => {
    if (!convId) { setMessageReactions({}); return; }
    try {
      const raw = localStorage.getItem(`msg-reactions-${convId}`);
      setMessageReactions(raw ? (JSON.parse(raw) as Record<string, Record<string, string[]>>) : {});
    } catch { setMessageReactions({}); }
  }, [convId]);

  // Persist reactions
  useEffect(() => {
    if (!convId) return;
    localStorage.setItem(`msg-reactions-${convId}`, JSON.stringify(messageReactions));
  }, [messageReactions, convId]);

  const toggleReaction = (messageId: string, emoji: string) => {
    setMessageReactions((prev) => {
      const msgR = prev[messageId] ?? {};
      const users = msgR[emoji] ?? [];
      const updated = users.includes(officeUser.id)
        ? users.filter((id) => id !== officeUser.id)
        : [...users, officeUser.id];
      return { ...prev, [messageId]: { ...msgR, [emoji]: updated } };
    });
    setShowReactionPickerFor(null);
  };

  const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎯", "🔥", "✅"];

  useEffect(() => {
    localStorage.setItem(`starred-msgs-${officeUser.id}`, JSON.stringify([...starredIds]));
  }, [starredIds, officeUser.id]);
  useEffect(() => {
    localStorage.setItem(`hidden-msgs-${officeUser.id}`, JSON.stringify([...hiddenMsgIds]));
  }, [hiddenMsgIds, officeUser.id]);

  // Close menus on outside click
  useEffect(() => {
    if (!ctxMsg && !showMoreMenu && !showAttachMenu) return;
    const handler = (e: MouseEvent) => {
      if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node)) { setCtxMsg(null); setCtxPos(null); }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
        setMoreMenuPos(null);
        setShowEmojiPicker(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ctxMsg, showMoreMenu, showAttachMenu]);

  useEffect(() => {
    if (!recordingVoice) {
      setVoiceDurationSec(0);
      return;
    }
    const timer = setInterval(() => {
      if (!recordingStartedAtRef.current) return;
      setVoiceDurationSec(Math.max(0, Math.floor((Date.now() - recordingStartedAtRef.current) / 1000)));
    }, 250);
    return () => clearInterval(timer);
  }, [recordingVoice]);

  useEffect(() => {
    return () => {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  // Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCtxMsg(null); setCtxPos(null);
        setMultiSelect(false); setSelectedIds(new Set());
        setShowMoreMenu(false);
        setMoreMenuPos(null);
        setShowEmojiPicker(false);
        setShowAttachMenu(false);
        setShowMentionMenu(false); setMentionQuery("");
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const hideMessageLocally = (id: string) => {
    setHiddenMsgIds((p) => new Set([...p, id]));
    setCtxMsg(null); setCtxPos(null);
  };

  const openCtxMenu = (e: React.MouseEvent | React.TouchEvent, msg: MessengerMessage) => {
    e.preventDefault();
    e.stopPropagation();
    if (multiSelect) { toggleSelectId(msg.id); return; }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuW = 200;
    const estMenuH = 460; // max 9 items × ~48px + padding
    const x = Math.min(rect.left, window.innerWidth - menuW - 8);
    // Flip upward if not enough space below
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const y = spaceBelow >= estMenuH
      ? rect.bottom + 4
      : Math.max(8, rect.top - estMenuH);
    setCtxMsg(msg); setCtxPos({ x, y });
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const enterMultiSelect = (msg: MessengerMessage) => {
    setCtxMsg(null); setCtxPos(null);
    setMultiSelect(true); setSelectedIds(new Set([msg.id]));
  };

  const exitMultiSelect = () => { setMultiSelect(false); setSelectedIds(new Set()); };

  // ── Long-press timer for multi-select (mobile) ────────────────────────────
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startLongPress = (msg: MessengerMessage) => {
    longPressTimer.current = setTimeout(() => enterMultiSelect(msg), 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const toggleStar = (id: string) => {
    setStarredIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
    setCtxMsg(null); setCtxPos(null);
  };

  const openForward = (ids: string[]) => {
    setForwardMsgIds(ids); setForwardOpen(true);
    setForwardQuery(""); setForwardTargetId(null);
    setCtxMsg(null); setCtxPos(null);
  };

  const doForward = async () => {
    if (!forwardTargetId || !forwardMsgIds.length) return;
    await forwardMessages(forwardMsgIds, forwardTargetId);
    setForwardOpen(false); setForwardMsgIds([]); setForwardQuery(""); setForwardTargetId(null);
    exitMultiSelect();
  };

  const wrapComposerSelection = (prefix: string, suffix = prefix) => {
    const el = composerRef.current;
    if (!el) return;
    const start = el.selectionStart ?? messengerComposer.length;
    const end = el.selectionEnd ?? messengerComposer.length;
    const selected = messengerComposer.slice(start, end);
    const nextValue = `${messengerComposer.slice(0, start)}${prefix}${selected}${suffix}${messengerComposer.slice(end)}`;
    setMessengerComposer(nextValue);
    requestAnimationFrame(() => {
      el.focus();
      const cursor = end + prefix.length + suffix.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const insertEmoji = (emoji: string) => {
    const current = messengerComposer.trimEnd();
    const next = current ? `${current} ${emoji}` : emoji;
    setMessengerComposer(next);
    setShowEmojiPicker(false);
    requestAnimationFrame(() => composerRef.current?.focus());
  };

  const insertMention = (member: OfficeUser) => {
    const el = composerRef.current;
    const cursor = el?.selectionStart ?? messengerComposer.length;
    const beforeCursor = messengerComposer.slice(0, cursor);
    const afterCursor = messengerComposer.slice(cursor);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    if (!mentionMatch) { setShowMentionMenu(false); return; }
    const before = beforeCursor.slice(0, beforeCursor.length - mentionMatch[0].length);
    const mention = `@${member.full_name.split(" ")[0]} `;
    setMessengerComposer(before + mention + afterCursor);
    setShowMentionMenu(false);
    setMentionQuery("");
    requestAnimationFrame(() => {
      if (el) { const pos = before.length + mention.length; el.focus(); el.setSelectionRange(pos, pos); }
    });
  };

  const sendAttachment = async (
    rawFile: File,
    options?: { body?: string; extraMetadata?: Record<string, unknown> },
  ) => {
    if (!selectedMessengerConversation) return;
    setUploadingAttachment(true);
    setShowAttachMenu(false);
    try {
      // Auto-compress images before upload
      let file = rawFile;
      if (rawFile.type.startsWith("image/") && rawFile.size > 200 * 1024) {
        toast.message("Compressing image…");
        file = await compressImage(rawFile);
        const saved = Math.round((1 - file.size / rawFile.size) * 100);
        if (saved > 5) toast.success(`Image compressed ${saved}% smaller`);
      }
      // Video size warning (no client-side compression without ffmpeg)
      if (rawFile.type.startsWith("video/") && rawFile.size > 50 * 1024 * 1024) {
        toast.warning("Video is large (>50 MB). Consider trimming before sharing.");
      }

      const uploaded = await uploadMessengerFile(file);
      const isImage = uploaded.mimeType.startsWith("image/");
      const isVideo = uploaded.mimeType.startsWith("video/");
      const isAudio = uploaded.mimeType.startsWith("audio/");
      await sendMessengerPayload({
        messageType: "text",
        body: options?.body || (isImage ? "📷 Photo" : isVideo ? "🎥 Video" : isAudio ? "🎤 Voice note" : `📎 ${uploaded.name}`),
        metadata: {
          attachment: {
            kind: isImage ? "image" : isVideo ? "video" : isAudio ? "audio" : "file",
            name: uploaded.name,
            size: uploaded.size,
            mimeType: uploaded.mimeType,
            bucket: uploaded.bucket,
            path: uploaded.path,
            url: uploaded.publicUrl,
          },
          ...(options?.extraMetadata || {}),
        },
      });
      toast.success("Shared successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const shareLocation = async () => {
    if (!selectedMessengerConversation) return;
    setSharingLocation(true);
    setShowAttachMenu(false);
    try {
      const pos = await getNativePosition();
      const mapsUrl = `https://maps.google.com/?q=${pos.latitude},${pos.longitude}`;
      const label = `📍 My Location (±${Math.round(pos.accuracy)}m)`;
      await sendMessengerPayload({
        messageType: "text",
        body: label,
        metadata: {
          location: {
            latitude: pos.latitude,
            longitude: pos.longitude,
            accuracy: pos.accuracy,
            mapsUrl,
          },
        },
      });
      toast.success("Location shared.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not get location.");
    } finally {
      setSharingLocation(false);
    }
  };

  const shareContact = async (member: OfficeUser) => {
    if (!selectedMessengerConversation) return;
    setShowAttachMenu(false);
    try {
      await sendMessengerPayload({
        messageType: "text",
        body: `👤 Contact: ${member.full_name}`,
        metadata: {
          contact_card: {
            user_id: member.id,
            full_name: member.full_name,
            email: member.email,
            department: member.department ?? "",
            role: member.role,
          },
        },
      });
      toast.success("Contact shared.");
    } catch {
      toast.error("Could not share contact.");
    }
  };

  const startVoiceRecording = async () => {
    if (recordingVoice) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          mediaChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        const duration = voiceDurationSec;
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(mediaChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        mediaChunksRef.current = [];
        setRecordingVoice(false);
        recordingStartedAtRef.current = null;
        if (!blob.size) return;
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || "audio/webm" });
        await sendAttachment(file, {
          body: "Voice message",
          extraMetadata: {
            voice: {
              durationSec: duration,
              mimeType: file.type || "audio/webm",
            },
          },
        });
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      recordingStartedAtRef.current = Date.now();
      setRecordingVoice(true);
      toast.success("Recording started.");
    } catch {
      toast.error("Microphone access is required for voice messages.");
    }
  };

  const stopVoiceRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      setRecordingVoice(false);
    }
  };

  const handleSendComposer = async () => {
    const hasBody = messengerComposer.trim().length > 0;
    if (!hasBody) return;
    const payloadBody = messengerComposer;
    setMessengerComposer("");
    setMessengerReplyToId(null);
    await sendMessengerPayload({
      messageType: "text",
      body: payloadBody,
      metadata: {
        format: {
          textColor: composerColor,
        },
      },
    });
  };

  const bulkDelete = async () => {
    for (const id of Array.from(selectedIds)) {
      const msg = visibleMessages.find((m) => m.id === id);
      if (!msg) continue;
      if (msg.sender_id === officeUser.id) await softDeleteMessage(id);
      else hideMessageLocally(id);
    }
    exitMultiSelect();
  };

  const copySelected = async () => {
    const text = visibleMessages.filter((m) => selectedIds.has(m.id)).map((m) => m.body ?? "").join("\n---\n");
    try { await navigator.clipboard.writeText(text); toast.success("Copied."); } catch { toast.error("Unable to copy."); }
    exitMultiSelect();
  };

  const visibleMessages = selectedConversationMessagesFiltered.filter((m) => !hiddenMsgIds.has(m.id));

  // Reply count per message (thread depth indicator)
  const replyCountByMessageId = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const msg of visibleMessages) {
      if (msg.reply_to_message_id) {
        counts[msg.reply_to_message_id] = (counts[msg.reply_to_message_id] ?? 0) + 1;
      }
    }
    return counts;
  }, [visibleMessages]);

  const filteredForwardConvs = messengerConversations.filter((c) => {
    if (c.id === selectedMessengerConversation?.id) return false;
    const q = forwardQuery.toLowerCase();
    return !q || (c.name ?? "").toLowerCase().includes(q);
  });

  // Remote user for calls
  const remoteCallUser = selectedMessengerConversation
    ? messengerDirectory.find((u) => u.id !== officeUser.id && selectedMessengerConversation.member_user_ids.includes(u.id)) ?? null
    : null;

  // ── Section tab labels ────────────────────────────────────────────────────
  const TABS: { key: "inbox" | "teams" | "announcements" | "directory"; label: string }[] = [
    { key: "inbox",         label: "Chat" },
    { key: "teams",         label: "Teams" },
    { key: "announcements", label: "Announce" },
    { key: "directory",     label: "People" },
  ];

  // ── Theme tokens ─────────────────────────────────────────────────────────
  // WhatsApp-inspired palette
  const bg      = dark ? "bg-[#f3f5f8]" : "bg-[#f0f2f5]"; // sidebar bg
  const bgChat  = dark ? "bg-[#0b141a]" : "bg-[#efeae2]"; // chat background
  const bgCard  = dark ? "bg-[#f3f5f8]" : "bg-white";      // card / header
  const border  = dark ? "border-[#404040]" : "border-slate-200";
  const subText = dark ? "text-[#8696a0]" : "text-slate-500";
  const headText= dark ? "text-[#e9edef]" : "text-slate-900";
  const inputCls= `crm-input-soft w-full rounded-2xl border ${dark ? "border-[#404040] bg-[#404040] text-[#d1d7db] placeholder-[#8696a0]" : "border-slate-200 bg-white text-slate-900 placeholder-slate-400"} px-4 py-2.5 text-sm focus:outline-none`;
  const ghostBtn= `crm-btn-secondary inline-flex items-center justify-center gap-1.5 rounded-lg border ${dark ? "border-[#404040] bg-[#f3f5f8] text-[#8696a0] hover:bg-[#404040]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"} px-3 py-1.5 text-xs font-medium transition`;
  const iconBtn = `flex h-9 w-9 items-center justify-center rounded-full transition ${dark ? "text-[#aebac1] hover:bg-[#404040] active:bg-[#404040]" : "text-slate-600 hover:bg-slate-100 active:bg-slate-200"}`;
  const primaryBtn = `crm-btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50`;

  // ── Conversation list sidebar ─────────────────────────────────────────────
  const SidebarContent = (
    <div className={`flex h-full flex-col ${bg}`}>
      {/* Tab bar */}
      <div className={`flex border-b ${border} shrink-0`}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => openMessengerSection(t.key)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              messengerMode === t.key
                ? dark ? "border-b-2 border-[#00a884] text-[#00a884]" : "border-b-2 border-[#128C7E] text-[#128C7E]"
                : subText + " hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className={`shrink-0 px-4 py-3 border-b ${border}`}>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${subText}`} />
            <input
              value={messengerMode === "directory" ? messengerDirectoryQuery : messengerConversationQuery}
              onChange={(e) =>
                messengerMode === "directory"
                  ? setMessengerDirectoryQuery(e.target.value)
                  : setMessengerConversationQuery(e.target.value)
              }
              placeholder={messengerMode === "directory" ? "Search people…" : "Search conversations…"}
              className={`${inputCls} pl-9 w-full`}
            />
          </div>
          {messengerMode === "teams" && officeUser.role === "admin" ? (
            <button
              type="button"
              onClick={() => setShowCreateGroup(true)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white ${dark ? "bg-emerald-600 hover:bg-emerald-500" : "bg-[#008069] hover:bg-[#006e5a]"}`}
              title="Create group"
            >
              + New Group
            </button>
          ) : null}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {messengerMode !== "directory" ? (
          <>
            {messengerFilteredConversations.length === 0 && (
              <div className="flex flex-col items-center px-4 py-14 text-center">
                <div className="mb-3 text-5xl">{messengerMode === "inbox" ? "💬" : messengerMode === "teams" ? "👥" : "📢"}</div>
                <p className={`text-sm font-semibold ${headText}`}>
                  {messengerMode === "inbox" ? "No chats yet" : messengerMode === "teams" ? "No groups yet" : "No announcements"}
                </p>
                <p className={`mt-1 text-xs leading-relaxed ${subText}`}>
                  {messengerMode === "inbox" ? "Go to People tab to start a conversation." : "Ask an admin to create one for your team."}
                </p>
              </div>
            )}
            {messengerFilteredConversations.map((conv) => {
              const isSelected = selectedMessengerConversation?.id === conv.id;
              const lastMsgTime = conv.last_message_at ? fmtTime(conv.last_message_at) : "";
              return (
                <button
                  key={conv.id}
                  onClick={() => void openConversation(conv)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? dark ? "bg-[#404040]" : "bg-[#f0f2f5]"
                      : dark ? "hover:bg-[#f3f5f8]" : "hover:bg-[#f5f6f6]"
                  }`}
                >
                  <Avatar
                    name={conv.name ?? "?"}
                    color={convColor(conv.type)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <p className={`truncate text-sm font-semibold ${headText}`}>{conv.name || "Untitled"}</p>
                      {lastMsgTime && <span className={`shrink-0 text-[11px] ${subText}`}>{lastMsgTime}</span>}
                    </div>
                    <p className={`mt-0.5 truncate text-xs ${subText}`}>
                      {conv.last_message_body || "No messages yet"}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#25D366] px-1.5 text-[11px] font-bold text-white">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              );
            })}
          </>
        ) : (
          // Directory
          <>
            {messengerDirectory
              .filter((m) => {
                const q = messengerDirectoryQuery.trim().toLowerCase();
                return !q || m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || (m.department ?? "").toLowerCase().includes(q);
              })
              .map((member) => (
                <button
                  key={member.id}
                  onClick={() => member.id !== officeUser.id && void openOrCreateDirectConversation(member)}
                  disabled={member.id === officeUser.id || messengerActionBusy === member.id}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${dark ? "hover:bg-[#f3f5f8]" : "hover:bg-slate-50"} disabled:cursor-default`}
                >
                  <div className="relative">
                    <Avatar name={member.full_name} color="indigo" />
                    <span className="absolute -bottom-0.5 -right-0.5">
                      <PresenceDot status={presenceByUserId[member.id]} />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${headText}`}>{member.full_name}</p>
                    <p className={`truncate text-xs ${subText}`}>{member.department || "Operations"}</p>
                  </div>
                  {member.id !== officeUser.id && (
                    <span className={`text-xs ${subText}`}>
                      {messengerActionBusy === member.id ? "…" : "Message"}
                    </span>
                  )}
                </button>
              ))}
          </>
        )}
      </div>

      {/* Sidebar footer actions */}
      <div className={`shrink-0 flex items-center gap-2 border-t ${border} px-4 py-3`}>
        <button onClick={() => void loadMessengerData()} className={ghostBtn} title="Refresh">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
        {messengerMode !== "directory" && (
          <button onClick={() => void markAllMessengerConversationsRead()} className={ghostBtn} title="Mark all read">
            <CheckCheck className="h-3.5 w-3.5" />
          </button>
        )}
        {messengerMode === "inbox" && (
          <button onClick={() => openMessengerSection("directory")} className={`ml-auto ${ghostBtn}`}>
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        )}
        {messengerMode === "announcements" && officeUser.role === "admin" && (
          <button onClick={() => setShowAnnouncementComposer(true)} className={`ml-auto ${ghostBtn}`}>
            <Megaphone className="h-3.5 w-3.5" /> New
          </button>
        )}
        {messengerLoading && <Loader2 className={`h-3.5 w-3.5 animate-spin ${subText} ml-auto`} />}
      </div>
    </div>
  );

  // ── Chat pane ─────────────────────────────────────────────────────────────
  const ChatPane = (
    <div className={`flex h-full flex-col ${bgChat}`}>

      {/* Chat header */}
      <div className={`shrink-0 flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-b ${border} shadow-sm`} style={{ background: dark ? "#f3f5f8" : "#128C7E" }}>
        {/* Back button — mobile only */}
        <button
          onClick={() => setMobileView("list")}
          className={`md:hidden ${iconBtn}`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {selectedMessengerConversation ? (
          <>
            <Avatar name={selectedMessengerConversation.name ?? "?"} color={convColor(selectedMessengerConversation.type)} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{selectedMessengerConversation.name || "Conversation"}</p>
              {selectedMessengerConversation.type === "group" ? (
                <button
                  type="button"
                  onClick={() => setShowMembersPanel((v) => !v)}
                  className="truncate text-xs text-white/80 hover:text-white underline-offset-2 hover:underline"
                >
                  {selectedConversationMemberUsers.length} members {showMembersPanel ? "▾" : "▸"}
                </button>
              ) : (
                <p className="truncate text-xs text-white/70">
                  {selectedMessengerConversation.type === "direct" ? "tap for contact info" : "Announcement channel"}
                </p>
              )}
            </div>
            {/* Action icons — white on green/dark header */}
            <div className="flex items-center gap-0.5">
              {messengerMode === "inbox" && remoteCallUser && (
                <>
                  <button onClick={() => void initiateCall("audio", selectedMessengerConversation.id, remoteCallUser)} className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10 active:bg-white/20" title="Voice call">
                    <Phone className="h-4.5 w-4.5" />
                  </button>
                  <button onClick={() => void initiateCall("video", selectedMessengerConversation.id, remoteCallUser)} className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10 active:bg-white/20" title="Video call">
                    <Video className="h-4.5 w-4.5" />
                  </button>
                </>
              )}
              <button onClick={() => setShowSearch((p) => !p)} className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10 active:bg-white/20" title="Search">
                <Search className="h-4 w-4" />
              </button>
              {/* More menu */}
              <div className="relative">
                <button
                  ref={moreButtonRef}
                  onClick={() => {
                    if (showMoreMenu) {
                      setShowMoreMenu(false);
                      setMoreMenuPos(null);
                    } else {
                      const rect = moreButtonRef.current?.getBoundingClientRect();
                      if (rect) {
                        setMoreMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                      }
                      setShowMoreMenu(true);
                    }
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10 active:bg-white/20"
                  title="More"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {showMoreMenu && moreMenuPos && (
                  <div
                    ref={moreMenuRef}
                    style={{ position: "fixed", top: moreMenuPos.top, right: moreMenuPos.right, zIndex: 9999 }}
                    className={`w-48 overflow-hidden rounded-2xl border shadow-xl ${dark ? "border-[#404040] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}
                  >
                    {[
                      { label: pinnedConversationIds.includes(selectedMessengerConversation.id) ? "Unpin" : "Pin conversation", action: () => void toggleConversationPin(selectedMessengerConversation.id), danger: false },
                      { label: selectedMessengerConversation.my_is_muted ? "Unmute" : "Mute", action: () => void toggleConversationMute(selectedMessengerConversation.id, !selectedMessengerConversation.my_is_muted), danger: false },
                      ...(messengerMode === "teams" && officeUser.role === "admin" ? [{ label: "Create group", action: () => { setShowCreateGroup(true); setShowMoreMenu(false); setMoreMenuPos(null); }, danger: false }] : []),
                      ...((selectedMessengerConversation.type === "direct" ||
                           selectedMessengerConversation.my_member_role === "admin" ||
                           selectedMessengerConversation.my_member_role === "moderator")
                        ? [{ label: "Delete chat", action: () => void deleteConversation(selectedMessengerConversation.id), danger: true }] : []),
                    ].map((item) => (
                      <button key={item.label} onClick={() => { item.action(); setShowMoreMenu(false); setMoreMenuPos(null); }}
                        className={`flex w-full items-center px-4 py-3 text-sm transition-colors ${item.danger ? (dark ? "text-rose-400 hover:bg-rose-900/30" : "text-rose-600 hover:bg-rose-50") : (dark ? "text-[#d1d7db] hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-50")}`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-white/70">Select a conversation</p>
        )}
      </div>

      {/* Search bar (toggleable) */}
      {showSearch && (
        <div className={`shrink-0 px-3 py-2 border-b ${border} ${bgCard}`}>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${subText}`} />
            <input
              value={messengerMessageQuery}
              onChange={(e) => setMessengerMessageQuery(e.target.value)}
              placeholder="Search in conversation…"
              className={`${inputCls} pl-9`}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Admin panel: group creation — centered modal, opened via "+ New Group" or ⋯ menu */}
      {messengerMode === "teams" && officeUser.role === "admin" && showCreateGroup && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4" onClick={() => setShowCreateGroup(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-sm font-bold ${headText}`}>Create Group Chat</p>
              <button onClick={() => setShowCreateGroup(false)} className={iconBtn}><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-3 space-y-2">
              <input value={createTeamName} onChange={(e) => setCreateTeamName(e.target.value)} placeholder="Group name" className={inputCls} autoFocus />
              <input value={createTeamDescription} onChange={(e) => setCreateTeamDescription(e.target.value)} placeholder="Description (optional)" className={inputCls} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowCreateGroup(false)} className={ghostBtn}>Cancel</button>
              <button
                onClick={async () => {
                  await createTeamGroupConversation();
                  setShowCreateGroup(false);
                }}
                disabled={!createTeamName.trim() || messengerActionBusy !== null}
                className={primaryBtn}>
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {messengerMode === "announcements" && showAnnouncementComposer && officeUser.role === "admin" && (
        <div className={`shrink-0 border-b ${border} px-4 py-3 ${bgCard} space-y-2`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold uppercase tracking-widest ${subText}`}>New Announcement</p>
            <button onClick={() => setShowAnnouncementComposer(false)} className={iconBtn}><X className="h-4 w-4" /></button>
          </div>
          <input value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} placeholder="Title" className={inputCls} />
          <textarea value={announcementBody} onChange={(e) => setAnnouncementBody(e.target.value)} placeholder="Message…" rows={3} className={`${inputCls} resize-none`} />
          <button onClick={() => void createAnnouncementConversation()} disabled={!announcementTitle.trim()}
            className={`${primaryBtn} w-full justify-center`}>
            Send Announcement
          </button>
        </div>
      )}

      {/* Group member panel — checkbox list for multi-add/remove */}
      {messengerMode === "teams" && selectedMessengerConversation?.type === "group" && showMembersPanel && (() => {
        const memberIds = new Set(selectedConversationMemberUsers.map((m) => m.user_id));
        // Combined list: every directory user (including existing members), sorted by name.
        const combined = [
          ...selectedConversationMemberUsers
            .filter((m) => m.user)
            .map((m) => ({ id: m.user_id, full_name: m.user!.full_name, email: m.user!.email, role: m.user!.role, isMember: true })),
          ...selectedGroupAddableMembers.map((u) => ({ id: u.id, full_name: u.full_name, email: u.email, role: u.role, isMember: false })),
        ].sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email));
        const canEdit = officeUser.role === "admin";
        return (
          <div className={`shrink-0 border-b ${border} px-4 py-3 ${bgCard}`}>
            <div className="flex items-center justify-between">
              <p className={`text-xs font-semibold uppercase tracking-widest ${subText}`}>
                Members — {memberIds.size} of {combined.length}
              </p>
              <button onClick={() => setShowMembersPanel(false)} className={iconBtn} title="Close"><X className="h-4 w-4" /></button>
            </div>
            <p className={`mt-1 text-[11px] ${subText}`}>
              {canEdit ? "Check to add · uncheck to remove." : "You are a member. Admins can add or remove others."}
            </p>
            <div className={`mt-2 max-h-64 overflow-y-auto rounded-lg border ${dark ? "border-[#454545]" : "border-slate-200"}`}>
              {combined.map((u) => {
                const isMe = u.id === officeUser.id;
                const busy = messengerActionBusy === `add-team-member-${u.id}` || messengerActionBusy === `remove-team-member-${u.id}`;
                const toggle = () => {
                  if (!canEdit || isMe || busy) return;
                  if (u.isMember) void removeMemberFromSelectedTeam(u.id);
                  else void addMemberToSelectedTeam(u.id);
                };
                return (
                  <label
                    key={u.id}
                    onClick={toggle}
                    className={`flex items-center gap-2.5 border-b px-3 py-2 text-xs last:border-b-0 ${dark ? "border-[#454545] hover:bg-[#404040]/60" : "border-slate-100 hover:bg-slate-50"} ${canEdit && !isMe ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <input
                      type="checkbox"
                      checked={u.isMember}
                      disabled={!canEdit || isMe || busy}
                      onChange={() => {}}
                      className="h-3.5 w-3.5 shrink-0 accent-emerald-600"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-medium ${headText}`}>
                        {u.full_name || u.email}
                        {isMe ? <span className="ml-1 text-[10px] font-semibold uppercase text-emerald-500">you</span> : null}
                      </p>
                      <p className={`truncate text-[10px] ${subText}`}>{u.role}{u.email ? ` · ${u.email}` : ""}</p>
                    </div>
                    {busy ? <span className={`text-[10px] ${subText}`}>working…</span> : null}
                  </label>
                );
              })}
              {combined.length === 0 ? (
                <p className={`px-3 py-4 text-center text-xs ${subText}`}>Directory is empty.</p>
              ) : null}
            </div>
          </div>
        );
      })()}

      {/* Error banner */}
      {messengerError && (
        <div className="shrink-0 mx-3 mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{messengerError}</div>
      )}

      {/* ── Message list ── */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1">
        {visibleMessages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-16 text-center px-6">
            {selectedMessengerConversation ? (
              <>
                <div className="mb-3 text-5xl">👋</div>
                <p className={`text-sm font-semibold ${headText}`}>
                  Say hello to {selectedMessengerConversation.name ?? "the team"}!
                </p>
                <p className={`mt-1 text-xs leading-relaxed ${subText}`}>
                  No messages yet. Be the first to break the ice.
                </p>
              </>
            ) : (
              <>
                <div className="mb-3 text-5xl">💬</div>
                <p className={`text-sm font-semibold ${headText}`}>
                  {messengerMode === "teams" ? "Pick a group" :
                   messengerMode === "announcements" ? "Pick an announcement" :
                   "Open a conversation"}
                </p>
                <p className={`mt-1 text-xs ${subText}`}>Select from the list on the left</p>
              </>
            )}
          </div>
        )}

        {/* Typing indicator — shown at the bottom of the message list */}
        {visibleMessages.length > 0 && (
          <div className={`flex items-end gap-2 px-1 py-1 opacity-0 pointer-events-none select-none`} aria-hidden="true" />
        )}

        {visibleMessages.map((message) => {
          const mine = message.sender_id === officeUser.id;
          const pinned = selectedConversationPinnedMessageIds.includes(message.id);
          const starred = starredIds.has(message.id);
          const replySource = message.reply_to_message_id ? selectedConversationMessagesById[message.reply_to_message_id] : null;
          const isDeleted = !!message.deleted_at;
          const metadata = (message.metadata || {}) as Record<string, unknown>;
          const attachment = (metadata.attachment as {
            kind?: string;
            name?: string;
            url?: string;
            mimeType?: string;
            size?: number;
          } | undefined) || null;
          const voiceMeta = (metadata.voice as { durationSec?: number } | undefined) || null;
          const textColor = String((metadata.format as { textColor?: string } | undefined)?.textColor || "");
          const locationMeta = (metadata.location as { latitude?: number; longitude?: number; accuracy?: number; mapsUrl?: string } | undefined) || null;
          const contactCard = (metadata.contact_card as { user_id?: string; full_name?: string; email?: string; department?: string; role?: string } | undefined) || null;

          return (
            <div key={message.id} className={`group flex items-end gap-2 msg-animate ${mine ? "flex-row-reverse" : ""}`}>
              {/* Multi-select checkbox */}
              {multiSelect && (
                <button onClick={() => toggleSelectId(message.id)} className="shrink-0 self-center">
                  {selectedIds.has(message.id) ? (
                    <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  ) : (
                    <Square className={`h-5 w-5 ${subText}`} />
                  )}
                </button>
              )}

              {/* Avatar for received messages */}
              {!mine && (
                <div className="shrink-0 self-end mb-1">
                  <Avatar
                    name={messengerDirectory.find((u) => u.id === message.sender_id)?.full_name ?? "?"}
                    size="sm"
                    color="indigo"
                  />
                </div>
              )}

              {/* Bubble */}
              <div
                onContextMenu={(e) => openCtxMenu(e, message)}
                onMouseDown={() => startLongPress(message)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onTouchStart={() => startLongPress(message)}
                onTouchEnd={cancelLongPress}
                onTouchCancel={cancelLongPress}
                onClick={(e) => { cancelLongPress(); if (multiSelect) { toggleSelectId(message.id); return; } openCtxMenu(e, message); }}
                className={`max-w-[80%] sm:max-w-[72%] cursor-pointer select-none shadow-sm transition-all ${
                  mine
                    ? dark
                      ? "rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm bg-[#005c4b] text-[#e9edef]"
                      : "rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm bg-[#d9fdd3] text-[#f3f5f8]"
                    : dark
                    ? "rounded-tr-2xl rounded-br-2xl rounded-bl-2xl rounded-tl-sm bg-[#f3f5f8] text-[#e9edef]"
                    : "rounded-tr-2xl rounded-br-2xl rounded-bl-2xl rounded-tl-sm bg-white text-[#f3f5f8]"
                } px-3.5 py-2.5 ${multiSelect && selectedIds.has(message.id) ? "ring-2 ring-[#25D366] opacity-90" : ""}
                ${ctxMsg?.id === message.id ? "ring-2 ring-[#25D366]/60" : ""}`}
              >
                {replySource && (
                  <div className={`mb-2 rounded-lg border-l-2 pl-2 text-xs ${mine ? "border-white/50 text-white/80" : "border-orange-400 text-slate-500"}`}>
                    <p className="truncate">{replySource.body || "Message"}</p>
                  </div>
                )}
                {message.linked_entity_type && (
                  <div className={`mb-1.5 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] ${mine ? "border-white/20 bg-white/10" : dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-100 bg-slate-50 text-slate-500"}`}>
                    <Pin className="h-3 w-3" />
                    Linked {message.linked_entity_type}
                  </div>
                )}
                {isDeleted ? (
                  <p className={`text-xs italic ${mine ? "text-white/60" : subText}`}>This message was deleted.</p>
                ) : messengerEditMessageId === message.id ? (
                  <div className="space-y-1.5">
                    <input
                      value={messengerEditBody}
                      onChange={(e) => setMessengerEditBody(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
                      autoFocus
                    />
                    <div className="flex gap-1.5">
                      <button onClick={() => void saveEditedMessage()} className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] text-white">Save</button>
                      <button onClick={() => { setMessengerEditMessageId(null); setMessengerEditBody(""); }} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachment ? (
                      <div className={`rounded-lg border p-2 ${mine ? "border-white/30 bg-white/10" : dark ? "border-[#454545] bg-[#f3f5f8]/60" : "border-slate-200 bg-slate-50"}`}>
                        {attachment.kind === "image" && attachment.url ? (
                          <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
                            <AttachmentImage
                              src={attachment.url}
                              bucket={(attachment as Record<string, unknown>).bucket as string | undefined}
                              path={(attachment as Record<string, unknown>).path as string | undefined}
                              alt={attachment.name ?? "Attachment"}
                              className="max-h-44 w-full rounded-md object-cover"
                            />
                            <p className={`mt-1 text-xs font-medium ${mine ? "text-white/80" : subText}`}>📷 Photo</p>
                          </a>
                        ) : null}
                        {attachment.kind === "video" && attachment.url ? (
                          <>
                            <video controls src={attachment.url} className="max-h-44 w-full rounded-md" />
                            <p className={`mt-1 text-xs font-medium ${mine ? "text-white/80" : subText}`}>🎥 Video</p>
                          </>
                        ) : null}
                        {attachment.kind === "audio" && attachment.url ? (
                          <audio controls src={attachment.url} className="w-full" />
                        ) : null}
                        {attachment.url && attachment.kind !== "image" && attachment.kind !== "video" && attachment.kind !== "audio" ? (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-2 text-xs font-semibold underline ${mine ? "text-white" : dark ? "text-orange-300" : "text-orange-700"}`}
                          >
                            <Paperclip className="h-3 w-3 shrink-0" />
                            {attachment.name || "Open attachment"}
                          </a>
                        ) : null}
                        {attachment.size ? (
                          <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : subText}`}>
                            {(attachment.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        ) : null}
                        {voiceMeta?.durationSec ? (
                          <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : subText}`}>
                            Voice note · {voiceMeta.durationSec}s
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {/* Location card */}
                    {locationMeta?.latitude !== undefined ? (
                      <div className={`rounded-xl overflow-hidden border ${mine ? "border-white/20" : dark ? "border-slate-600" : "border-slate-200"}`}>
                        <img
                          src={`https://maps.googleapis.com/maps/api/staticmap?center=${locationMeta.latitude},${locationMeta.longitude}&zoom=15&size=300x120&markers=color:red%7C${locationMeta.latitude},${locationMeta.longitude}&key=`}
                          alt="Map"
                          className="w-full h-20 object-cover bg-slate-200"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div className={`flex items-center gap-2 px-3 py-2 ${mine ? "bg-white/10" : dark ? "bg-[#f3f5f8]" : "bg-white"}`}>
                          <MapPin className={`h-4 w-4 shrink-0 ${mine ? "text-white/80" : "text-[#00a884]"}`} />
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold ${mine ? "text-white" : headText}`}>My Location</p>
                            {locationMeta.accuracy && (
                              <p className={`text-[10px] ${mine ? "text-white/60" : subText}`}>±{Math.round(locationMeta.accuracy)}m accuracy</p>
                            )}
                          </div>
                          {locationMeta.mapsUrl && (
                            <a
                              href={locationMeta.mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${mine ? "bg-white/20 text-white" : "bg-[#00a884] text-white"}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open
                            </a>
                          )}
                        </div>
                      </div>
                    ) : null}

                    {/* Contact card */}
                    {contactCard?.full_name ? (
                      <div className={`rounded-xl border overflow-hidden ${mine ? "border-white/20" : dark ? "border-slate-600" : "border-slate-200"}`}>
                        <div className={`flex items-center gap-3 px-3 py-2.5 ${mine ? "bg-white/10" : dark ? "bg-[#f3f5f8]" : "bg-white"}`}>
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#128C7E] text-white font-bold text-sm">
                            {contactCard.full_name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-semibold ${mine ? "text-white" : headText}`}>{contactCard.full_name}</p>
                            <p className={`text-[11px] ${mine ? "text-white/60" : subText}`}>{contactCard.department || contactCard.role || "Team member"}</p>
                          </div>
                        </div>
                        <div className={`border-t px-3 py-1.5 ${mine ? "border-white/10 bg-white/5" : dark ? "border-[#454545] bg-[#f3f5f8]/30" : "border-slate-100 bg-slate-50"}`}>
                          <button
                            onClick={() => {
                              const member = messengerDirectory.find((u) => u.id === contactCard.user_id);
                              if (member) void openOrCreateDirectConversation(member);
                            }}
                            className={`text-[11px] font-semibold ${mine ? "text-white/80" : "text-[#128C7E]"}`}
                          >
                            Message
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {message.body && !locationMeta && !contactCard ? (
                      <p
                        className="text-sm leading-relaxed whitespace-pre-wrap break-words"
                        style={!mine && textColor ? { color: textColor } : undefined}
                      >
                        {message.body}
                      </p>
                    ) : message.body && (locationMeta || contactCard) ? (
                      <p className={`text-xs ${mine ? "text-white/70" : subText} whitespace-pre-wrap break-words`}>
                        {message.body}
                      </p>
                    ) : null}
                  </div>
                )}
                {/* Timestamp + status — WhatsApp style: aligned bottom-right */}
                <div className="mt-1 flex items-center justify-end gap-1">
                  {message.edited_at && <span className="text-[10px] opacity-60">edited</span>}
                  {pinned && <Pin className="h-2.5 w-2.5 opacity-60" />}
                  {starred && <Star className="h-2.5 w-2.5 text-amber-400" />}
                  <span className="text-[10px] opacity-60">{fmtTime(message.created_at)}</span>
                  {mine && !isDeleted && (
                    <CheckCheck className="h-3.5 w-3.5 opacity-60 text-white" />
                  )}
                </div>
              </div>

              {/* ── Reactions + reply count row ─────────────────────── */}
              {!isDeleted && (
                <div className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
                  {/* Reaction pills */}
                  {(() => {
                    const rxns = messageReactions[message.id];
                    const entries = rxns ? Object.entries(rxns).filter(([, users]) => users.length > 0) : [];
                    return entries.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {entries.map(([emoji, users]) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleReaction(message.id, emoji)}
                            className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] transition-all active:scale-95 ${
                              users.includes(officeUser.id)
                                ? dark ? "border-blue-500/50 bg-orange-500/20 text-orange-200" : "border-orange-400 bg-blue-100 text-orange-700"
                                : dark ? "border-slate-600 bg-[#404040] text-slate-300 hover:bg-[#454545]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="font-semibold">{users.length}</span>
                          </button>
                        ))}
                        {/* Add more reaction */}
                        <button
                          type="button"
                          onClick={() => setShowReactionPickerFor(showReactionPickerFor === message.id ? null : message.id)}
                          className={`rounded-full border px-1.5 py-0.5 text-[11px] ${dark ? "border-slate-600 bg-[#404040] text-slate-400 hover:bg-[#454545]" : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"}`}
                        >
                          +
                        </button>
                      </div>
                    ) : null;
                  })()}

                  {/* Quick reaction picker (shown on hover via group or toggle) */}
                  {showReactionPickerFor === message.id && (
                    <div className={`flex gap-0.5 rounded-2xl border p-1.5 shadow-lg ${dark ? "border-[#454545] bg-[#404040]" : "border-slate-200 bg-white"}`}>
                      {QUICK_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => toggleReaction(message.id, emoji)}
                          className="rounded-xl p-1 text-base transition hover:scale-125 hover:bg-slate-100 dark:hover:bg-[#454545]"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Hover reaction trigger (shown when no reactions exist) */}
                  {(!messageReactions[message.id] || Object.values(messageReactions[message.id]).every(u => u.length === 0)) &&
                   showReactionPickerFor !== message.id && (
                    <button
                      type="button"
                      onClick={() => setShowReactionPickerFor(message.id)}
                      className={`mt-0.5 rounded-full border px-1.5 py-0.5 text-[11px] opacity-0 transition group-hover:opacity-100 ${
                        dark ? "border-slate-600 bg-[#404040] text-slate-400 hover:bg-[#454545]" : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      😊+
                    </button>
                  )}

                  {/* Reply thread count */}
                  {(replyCountByMessageId[message.id] ?? 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => setMessengerReplyToId(message.id)}
                      className={`mt-0.5 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition hover:underline ${
                        dark ? "border-slate-600 bg-[#404040]/60 text-orange-400 hover:bg-[#454545]" : "border-slate-200 bg-slate-50 text-orange-600 hover:bg-slate-100"
                      }`}
                    >
                      <CornerUpLeft className="h-3 w-3" />
                      {replyCountByMessageId[message.id]} {replyCountByMessageId[message.id] === 1 ? "reply" : "replies"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Multi-select action bar */}
      {multiSelect && (
        <div className={`shrink-0 flex items-center justify-between gap-2 border-t ${border} px-4 py-3 ${bgCard}`}>
          <span className={`text-sm font-semibold ${headText}`}>{selectedIds.size} selected</span>
          <div className="flex items-center gap-1.5">
            {[
              { icon: <Copy className="h-4 w-4" />, action: () => void copySelected(), label: "Copy" },
              { icon: <Forward className="h-4 w-4" />, action: () => openForward([...selectedIds]), label: "Forward" },
              { icon: <Star className="h-4 w-4" />, action: () => { [...selectedIds].forEach(toggleStar); exitMultiSelect(); }, label: "Star" },
              { icon: <Trash2 className="h-4 w-4 text-rose-500" />, action: () => void bulkDelete(), label: "Delete" },
              { icon: <X className="h-4 w-4" />, action: exitMultiSelect, label: "Cancel" },
            ].map((a) => (
              <button key={a.label} onClick={a.action} disabled={selectedIds.size === 0 && a.label !== "Cancel"}
                title={a.label} className={iconBtn + " disabled:opacity-40"}>
                {a.icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reply preview */}
      {messengerReplyToId && selectedMessengerConversation && (
        <div className={`shrink-0 flex items-center gap-3 border-t ${border} px-3 py-2 ${bgCard}`}>
          <CornerUpLeft className="h-4 w-4 shrink-0 text-orange-500" />
          <p className={`flex-1 truncate text-xs ${subText}`}>
            {selectedConversationMessagesById[messengerReplyToId]?.body?.slice(0, 80) ?? "Message"}
          </p>
          <button onClick={() => setMessengerReplyToId(null)} className={iconBtn}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Quick share chips */}
      {selectedMessengerConversation && (latestGeneralTask || latestJourneyTask || selectedInstitution) && (
        <div className={`shrink-0 flex gap-2 overflow-x-auto border-t ${border} px-3 py-2 ${bgCard}`}>
          {latestGeneralTask && (
            <button onClick={() => void sendLinkedRecordMessage("task", latestGeneralTask.id, latestGeneralTask.task_title)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium ${dark ? "border-[#454545] text-slate-300" : "border-slate-200 text-slate-600"}`}>
              Share Task
            </button>
          )}
          {latestJourneyTask && (
            <button onClick={() => void sendLinkedRecordMessage("visit", latestJourneyTask.id, latestJourneyTask.institution_name || latestJourneyTask.task_title)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium ${dark ? "border-[#454545] text-slate-300" : "border-slate-200 text-slate-600"}`}>
              Share Visit
            </button>
          )}
          {selectedInstitution && (
            <button onClick={() => void sendLinkedRecordMessage("institution", selectedInstitution.id, selectedInstitution.name)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium ${dark ? "border-[#454545] text-slate-300" : "border-slate-200 text-slate-600"}`}>
              Share Institution
            </button>
          )}
        </div>
      )}

      {/* Composer — WhatsApp style */}
      {selectedMessengerConversation && (
        <div className={`shrink-0 px-2 py-2 ${dark ? "bg-[#f3f5f8]" : "bg-[#f0f2f5]"}`}>
          {/* Emoji picker */}
          {showEmojiPicker ? (
            <div className={`mb-2 flex flex-wrap gap-1.5 rounded-xl border p-2 ${dark ? "border-[#404040] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
              {["😀", "👍", "🎯", "✅", "🔥", "📌", "🙏", "🤝", "🚀", "💬", "😂", "❤️"].map((emoji) => (
                <button key={`emoji-${emoji}`} type="button" onClick={() => insertEmoji(emoji)} className="rounded-md px-2 py-1 text-lg transition-transform active:scale-90">
                  {emoji}
                </button>
              ))}
            </div>
          ) : null}

          {/* Voice recording indicator */}
          {recordingVoice ? (
            <div className={`mb-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${dark ? "border-rose-800/50 bg-rose-950/30 text-rose-300" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
              Voice note · {voiceDurationSec}s
              <button onClick={stopVoiceRecording} className="ml-auto text-rose-500"><StopCircle className="h-4 w-4" /></button>
            </div>
          ) : null}

          {/* Hidden file inputs — always mounted so refs stay valid */}
          <input ref={photoInputRef}  type="file" accept="image/*"                   className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void sendAttachment(f); e.target.value = ""; }} />
          <input ref={videoInputRef}  type="file" accept="video/*"                   className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void sendAttachment(f); e.target.value = ""; }} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void sendAttachment(f); e.target.value = ""; }} />
          <input ref={docInputRef}    type="file" accept="*/*"                        className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void sendAttachment(f); e.target.value = ""; }} />

          {/* Attachment menu popup.
              onMouseDown stopPropagation prevents the document-level outside-click handler
              from seeing the programmatic click on hidden inputs and closing the menu. */}
          {showAttachMenu && (
            <div
              ref={attachMenuRef}
              onMouseDown={(e) => e.stopPropagation()}
              className={`mb-2 rounded-2xl border shadow-2xl px-4 py-4 ${dark ? "border-[#404040] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}
            >
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: <FileImage className="h-6 w-6" />, label: "Photo",    bg: "bg-[#5B7FFF]", action: () => photoInputRef.current?.click()  },
                  { icon: <FileVideo className="h-6 w-6" />, label: "Video",    bg: "bg-[#CC3F54]", action: () => videoInputRef.current?.click()  },
                  { icon: <Camera    className="h-6 w-6" />, label: "Camera",   bg: "bg-[#BF59CF]", action: () => cameraInputRef.current?.click() },
                  { icon: <Paperclip className="h-6 w-6" />, label: "Document", bg: "bg-[#1976D2]", action: () => docInputRef.current?.click()    },
                  { icon: sharingLocation ? <Loader2 className="h-6 w-6 animate-spin" /> : <MapPin className="h-6 w-6" />, label: "Location", bg: "bg-[#009688]", action: () => void shareLocation() },
                  { icon: <Contact className="h-6 w-6" />, label: "Contact", bg: "bg-[#00BCD4]", action: () => { setShowAttachMenu(false); setShowContactPicker(true); } },
                  ...(selectedInstitution ? [{ icon: <School className="h-6 w-6" />, label: "College", bg: "bg-[#FF8F00]", action: () => { setShowAttachMenu(false); void sendLinkedRecordMessage("institution", selectedInstitution.id, selectedInstitution.name); } }] : []),
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={item.action}
                    disabled={uploadingAttachment || (item.label === "Location" && sharingLocation)}
                    className="flex flex-col items-center gap-1.5 disabled:opacity-50 active:scale-95 transition-transform"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md ${item.bg}`}>
                      {item.icon}
                    </div>
                    <span className={`text-[11px] font-medium ${dark ? "text-[#aebac1]" : "text-slate-600"}`}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* @ Mention menu */}
          {showMentionMenu && (
            <div className={`mb-2 max-h-48 overflow-y-auto rounded-xl border shadow-xl ${dark ? "border-[#404040] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
              {messengerDirectory
                .filter((m) => {
                  const q = mentionQuery.toLowerCase();
                  return !q || m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
                })
                .slice(0, 8)
                .map((member) => (
                  <button key={member.id} type="button" onClick={() => insertMention(member)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${dark ? "hover:bg-[#404040]" : "hover:bg-slate-50"}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#128C7E] text-white text-xs font-bold`}>
                      {member.full_name.split(" ").slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("")}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${dark ? "text-[#e9edef]" : "text-slate-900"}`}>{member.full_name}</p>
                      <p className={`text-xs ${dark ? "text-[#8696a0]" : "text-slate-500"}`}>{member.department || member.role}</p>
                    </div>
                  </button>
                ))}
              {messengerDirectory.filter((m) => {
                const q = mentionQuery.toLowerCase();
                return !q || m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
              }).length === 0 && (
                <p className={`px-4 py-3 text-xs ${dark ? "text-[#8696a0]" : "text-slate-500"}`}>No matches for "@{mentionQuery}"</p>
              )}
            </div>
          )}

          {/* Main composer row */}
          <div className="flex items-end gap-2">
            {/* Left icons */}
            <div className="flex shrink-0 items-center gap-0.5">
              <button type="button" onClick={() => setShowEmojiPicker((prev) => !prev)}
                className={`flex h-10 w-10 items-center justify-center rounded-full ${showEmojiPicker ? "text-[#25D366]" : dark ? "text-[#aebac1]" : "text-slate-500"}`} title="Emoji">
                <SmilePlus className="h-5 w-5" />
              </button>
              <button type="button" onClick={() => { setShowEmojiPicker(false); setShowAttachMenu((p) => !p); }}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition ${showAttachMenu ? "bg-[#00a884] text-white" : dark ? "text-[#aebac1]" : "text-slate-500"}`} title="Attach">
                {showAttachMenu ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </button>
            </div>

            {/* Text area */}
            <textarea
              ref={composerRef}
              rows={1}
              value={messengerComposer}
              onChange={(e) => {
                const value = e.target.value;
                setMessengerComposer(value);
                const cursor = e.target.selectionStart ?? value.length;
                const beforeCursor = value.slice(0, cursor);
                const mentionMatch = beforeCursor.match(/@(\w*)$/);
                if (mentionMatch) { setMentionQuery(mentionMatch[1]); setShowMentionMenu(true); }
                else { setShowMentionMenu(false); setMentionQuery(""); }
              }}
              disabled={announcementRepliesLocked && !selectedConversationCanModerate}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleSendComposer(); }
              }}
              placeholder={announcementRepliesLocked && !selectedConversationCanModerate ? "Replies locked" : "Message"}
              style={{ resize: "none", maxHeight: "96px", overflowY: "auto" }}
              className={`min-h-[42px] flex-1 rounded-2xl border-0 px-4 py-2.5 text-sm focus:outline-none focus:ring-0 ${
                dark ? "bg-[#404040] text-[#d1d7db] placeholder-[#8696a0]" : "bg-white text-slate-900 placeholder-slate-400"
              } disabled:opacity-50`}
            />

            {/* Send / Mic button */}
            {messengerComposer.trim() ? (
              <button
                onClick={() => void handleSendComposer()}
                disabled={(announcementRepliesLocked && !selectedConversationCanModerate) || uploadingAttachment}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white shadow-md transition active:scale-95 disabled:opacity-40"
              >
                <Send className="h-4.5 w-4.5 -translate-x-px" />
              </button>
            ) : (
              <button
                type="button"
                onClick={recordingVoice ? stopVoiceRecording : () => void startVoiceRecording()}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md transition active:scale-95 ${recordingVoice ? "bg-rose-500" : "bg-[#00a884]"}`}
                title={recordingVoice ? "Stop recording" : "Voice message"}
              >
                {recordingVoice ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ── Context menu ──────────────────────────────────────────────────────────
  const ContextMenu = ctxMsg && ctxPos ? (
    <div
      ref={ctxMenuRef}
      style={{ position: "fixed", left: ctxPos.x, top: ctxPos.y, zIndex: 9999 }}
      className={`w-48 overflow-hidden rounded-2xl border shadow-2xl ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}
    >
      {[
        { icon: <CornerUpLeft className="h-4 w-4" />, label: "Reply", hidden: announcementRepliesLocked && !selectedConversationCanModerate, action: () => { setMessengerReplyToId(ctxMsg.id); setCtxMsg(null); setCtxPos(null); } },
        { icon: <Copy className="h-4 w-4" />, label: "Copy text", hidden: !ctxMsg.body || !!ctxMsg.deleted_at, action: async () => { try { await navigator.clipboard.writeText(ctxMsg.body ?? ""); toast.success("Copied."); } catch { toast.error("Failed."); } setCtxMsg(null); setCtxPos(null); } },
        {
          icon: <Link className="h-4 w-4" />, label: "Copy link",
          hidden: !(ctxMsg.metadata as Record<string,unknown> | null | undefined)?.attachment,
          action: async () => {
            const url = ((ctxMsg.metadata as Record<string,unknown>)?.attachment as Record<string,unknown> | undefined)?.url as string | undefined;
            if (url) { try { await navigator.clipboard.writeText(url); toast.success("Link copied."); } catch { toast.error("Failed."); } }
            setCtxMsg(null); setCtxPos(null);
          },
        },
        {
          icon: <Download className="h-4 w-4" />, label: "Download",
          hidden: !(ctxMsg.metadata as Record<string,unknown> | null | undefined)?.attachment,
          action: () => {
            const att = ((ctxMsg.metadata as Record<string,unknown>)?.attachment as Record<string,unknown> | undefined);
            const url = att?.url as string | undefined;
            const name = att?.name as string | undefined;
            if (url) { const a = document.createElement("a"); a.href = url; a.download = name ?? "attachment"; a.target = "_blank"; a.click(); }
            setCtxMsg(null); setCtxPos(null);
          },
        },
        { icon: <Forward className="h-4 w-4" />, label: "Forward", action: () => openForward([ctxMsg.id]) },
        { icon: <Share2 className="h-4 w-4" />, label: "Share", hidden: !navigator.share, action: async () => { try { await navigator.share({ text: ctxMsg.body ?? "" }); } catch { /* dismissed */ } setCtxMsg(null); setCtxPos(null); } },
        { icon: <Star className="h-4 w-4" />, label: starredIds.has(ctxMsg.id) ? "Unstar" : "Star", action: () => toggleStar(ctxMsg.id) },
        { icon: <Square className="h-4 w-4" />, label: "Select", action: () => enterMultiSelect(ctxMsg) },
        { icon: <Pencil className="h-4 w-4" />, label: "Edit", hidden: !(ctxMsg.sender_id === officeUser.id && !ctxMsg.deleted_at), action: () => { startEditingMessage(ctxMsg); setCtxMsg(null); setCtxPos(null); } },
        { icon: <Pin className="h-4 w-4" />, label: selectedConversationPinnedMessageIds.includes(ctxMsg.id) ? "Unpin" : "Pin", hidden: !selectedMessengerConversation, action: () => { if (selectedMessengerConversation) void toggleMessagePin(selectedMessengerConversation.id, ctxMsg.id); setCtxMsg(null); setCtxPos(null); } },
        { icon: <Info className="h-4 w-4" />, label: "Message info", hidden: ctxMsg.sender_id !== officeUser.id, action: () => { toast.info(`Sent at ${new Date(ctxMsg.created_at ?? "").toLocaleTimeString()}`); setCtxMsg(null); setCtxPos(null); } },
        { icon: <Trash2 className="h-4 w-4" />, label: "Delete for everyone", danger: true, hidden: ctxMsg.sender_id !== officeUser.id, action: () => { void softDeleteMessage(ctxMsg.id); setCtxMsg(null); setCtxPos(null); } },
        { icon: <Trash2 className="h-4 w-4" />, label: "Delete for me", danger: true, action: () => hideMessageLocally(ctxMsg.id) },
      ].filter((i) => !i.hidden).map((item) => (
        <button
          key={item.label}
          onClick={() => void item.action()}
          className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
            item.danger
              ? "text-rose-600 hover:bg-rose-50"
              : dark ? "text-slate-200 hover:bg-[#404040]" : "text-slate-700 hover:bg-slate-50"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  ) : null;

  // ── Contact Picker dialog ──────────────────────────────────────────────────
  const [contactPickerQuery, setContactPickerQuery] = useState("");
  const ContactPickerDialog = showContactPicker ? (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className={`w-full max-w-sm rounded-t-2xl sm:rounded-2xl border shadow-2xl ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className={`text-base font-bold ${headText}`}>Share Contact</p>
          <button onClick={() => { setShowContactPicker(false); setContactPickerQuery(""); }} className={iconBtn}><X className="h-5 w-5" /></button>
        </div>
        <div className="px-4 py-3">
          <input value={contactPickerQuery} onChange={(e) => setContactPickerQuery(e.target.value)} placeholder="Search people…" className={inputCls} autoFocus />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {messengerDirectory
            .filter((m) => {
              const q = contactPickerQuery.toLowerCase();
              return !q || m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
            })
            .map((member) => (
              <button key={member.id} onClick={() => { void shareContact(member); setShowContactPicker(false); setContactPickerQuery(""); }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${dark ? "hover:bg-[#404040]" : "hover:bg-slate-50"}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#128C7E] text-white font-bold text-sm">
                  {member.full_name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${headText}`}>{member.full_name}</p>
                  <p className={`truncate text-xs ${subText}`}>{member.department || member.role}</p>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  ) : null;

  // ── Forward dialog ────────────────────────────────────────────────────────
  const ForwardDialog = forwardOpen ? (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className={`w-full max-w-sm rounded-t-2xl sm:rounded-2xl border shadow-2xl ${dark ? "border-[#454545] bg-[#f3f5f8]" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className={`text-base font-bold ${headText}`}>Forward to…</p>
          <button onClick={() => setForwardOpen(false)} className={iconBtn}><X className="h-5 w-5" /></button>
        </div>
        <div className="px-4 py-3">
          <input value={forwardQuery} onChange={(e) => setForwardQuery(e.target.value)} placeholder="Search…" className={inputCls} autoFocus />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filteredForwardConvs.map((c) => (
            <button key={c.id} onClick={() => setForwardTargetId(c.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                forwardTargetId === c.id
                  ? dark ? "bg-[#f3f5f8]/40" : "bg-blue-50"
                  : dark ? "hover:bg-[#404040]" : "hover:bg-slate-50"
              }`}>
              <Avatar name={c.name ?? "?"} color={convColor(c.type)} size="sm" />
              <span className={`flex-1 truncate text-sm ${headText}`}>{c.name ?? "(unnamed)"}</span>
              {forwardTargetId === c.id && <Check className="h-4 w-4 text-orange-500" />}
            </button>
          ))}
          {filteredForwardConvs.length === 0 && (
            <p className={`py-6 text-center text-xs ${subText}`}>No conversations found</p>
          )}
        </div>
        <div className={`flex gap-2 border-t ${border} px-4 py-3`}>
          <button onClick={() => setForwardOpen(false)} className={`flex-1 ${ghostBtn} justify-center`}>Cancel</button>
          <button onClick={() => void doForward()} disabled={!forwardTargetId} className={`flex-1 ${primaryBtn} justify-center disabled:opacity-40`}>
            <Forward className="h-4 w-4" /> Forward
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ── Final layout ──────────────────────────────────────────────────────────
  return (
    <>
      {/* Desktop: two columns */}
      <section className={`crm-messenger-shell hidden md:grid h-[calc(100vh-132px)] overflow-hidden rounded-[28px] border shadow-[0_18px_60px_-28px_rgba(2,6,23,0.45)] ${dark ? "border-[#404040]/80" : "border-slate-200"} md:grid-cols-[340px_minmax(0,1fr)]`}>
        <div className={`h-full min-h-0 border-r ${border}`}>{SidebarContent}</div>
        <div className="h-full min-h-0">{ChatPane}</div>
      </section>

      {/* Mobile: single panel, toggles between list and chat */}
      <section className={`crm-messenger-shell md:hidden h-[calc(100dvh-120px)] overflow-hidden rounded-2xl border shadow-lg ${dark ? "border-[#404040]" : "border-slate-200"}`}>
        <div className={`h-full transition-all duration-200 ${mobileView === "list" ? "block" : "hidden"}`}>
          {SidebarContent}
        </div>
        <div className={`h-full ${mobileView === "chat" ? "block" : "hidden"}`}>
          {ChatPane}
        </div>
      </section>

      {ContextMenu}
      {ForwardDialog}
      {ContactPickerDialog}
    </>
  );
};

export default React.memo(MessengerPanel);
