import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  msgListConversationsHydrated,
  msgGetOrCreateDirect,
  msgCreateGroup,
  msgUpsertMembers,
  msgRemoveMember,
  msgDeleteConversation,
  msgSetConversationArchived,
  msgMarkRead,
  msgSetMemberMuted,
  msgSetConversationPin,
  msgAckAnnouncement,
  msgInsertMessage,
  msgEditMessage,
  msgSoftDeleteMessage,
  msgModerateDeleteMessage,
  msgPinMessage,
  msgUnpinMessage,
  msgUpdateConversationSettings,
  msgListPresence,
  msgUpsertPresence,
  msgGetSettings,
  msgUpsertSettings,
  msgOpenStream,
  msgInsertNotification,
  type MsgStreamHandle,
} from "@/lib/messengerClient";
import { tmListOfficeUsers } from "@/lib/tmClient";
import type {
  OfficeUser,
  TaskSection,
  ConversationType,
  ConversationMemberRole,
  PresenceStatus,
  AnnouncementAckStatus,
  MessengerConversation,
  MessengerMessage,
  MessengerConversationMember,
} from "@/types/taskManager";
import {
  getErrorMessage,
} from "@/utils/taskManager";

// ── Row adapters: map CRM column names to the legacy shape the rest of the
// hook (and the rendering components) already use.
function adaptConversation(row: Record<string, unknown>): MessengerConversation {
  const settings = (row.settings as Record<string, unknown> | null) ?? {};
  return {
    id: String(row.id ?? ""),
    type: ((row.kind as ConversationType | undefined) ?? "direct"),
    name: (row.title as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
    is_active: row.is_active == null ? true : Boolean(row.is_active),
    is_archived: Boolean(row.is_archived),
    my_member_role: ((row.my_member_role as ConversationMemberRole | undefined) ?? "member"),
    my_last_read_message_id: (row.last_read_message_id as string | null) ?? null,
    my_is_muted: Boolean(row.my_is_muted),
    member_user_ids: [],
    unread_count: 0,
    last_message_body: null,
    last_message_at: (row.last_message_at as string | null) ?? null,
    last_message_sender_id: null,
    settings: settings,
  };
}

function adaptMember(row: Record<string, unknown>): MessengerConversationMember {
  return {
    conversation_id: String(row.conversation_id ?? ""),
    user_id: String(row.user_external_id ?? ""),
    role: ((row.role as ConversationMemberRole | undefined) ?? "member"),
    is_muted: Boolean(row.is_muted),
    last_read_message_id: (row.last_read_message_id as string | null) ?? null,
  } as MessengerConversationMember;
}

function adaptMessage(row: Record<string, unknown>): MessengerMessage {
  return {
    id: String(row.id ?? ""),
    conversation_id: String(row.conversation_id ?? ""),
    sender_id: (row.sender_external_id as string | null) ?? "",
    message_type: ((row.message_type as MessengerMessage["message_type"] | undefined) ?? "text"),
    body: String(row.body ?? ""),
    created_at: String(row.created_at ?? new Date().toISOString()),
    edited_at: (row.edited_at as string | null) ?? null,
    reply_to_message_id: (row.reply_to_message_id as string | null) ?? null,
    linked_entity_type: (row.linked_entity_type as MessengerMessage["linked_entity_type"] | null) ?? null,
    linked_entity_id: (row.linked_entity_id as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    deleted_at: (row.deleted_at as string | null) ?? null,
  } as MessengerMessage;
}

const withUiTimeout = async <T,>(promise: PromiseLike<T>, timeoutMs: number, timeoutLabel: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(timeoutLabel)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

export interface UseMessengerReturn {
  // State: conversations, messages, members, directory
  messengerConversations: MessengerConversation[];
  setMessengerConversations: React.Dispatch<React.SetStateAction<MessengerConversation[]>>;
  messengerMessagesByConversation: Record<string, MessengerMessage[]>;
  setMessengerMessagesByConversation: React.Dispatch<React.SetStateAction<Record<string, MessengerMessage[]>>>;
  messengerMembersByConversation: Record<string, MessengerConversationMember[]>;
  setMessengerMembersByConversation: React.Dispatch<React.SetStateAction<Record<string, MessengerConversationMember[]>>>;
  messengerDirectory: OfficeUser[];
  setMessengerDirectory: React.Dispatch<React.SetStateAction<OfficeUser[]>>;
  messengerLoading: boolean;
  setMessengerLoading: React.Dispatch<React.SetStateAction<boolean>>;
  messengerError: string | null;
  setMessengerError: React.Dispatch<React.SetStateAction<string | null>>;
  messengerSchemaReady: boolean;
  setMessengerSchemaReady: React.Dispatch<React.SetStateAction<boolean>>;

  // State: composers and queries
  messengerComposer: string;
  setMessengerComposer: React.Dispatch<React.SetStateAction<string>>;
  messengerConversationQuery: string;
  setMessengerConversationQuery: React.Dispatch<React.SetStateAction<string>>;
  messengerMessageQuery: string;
  setMessengerMessageQuery: React.Dispatch<React.SetStateAction<string>>;
  messengerDirectoryQuery: string;
  setMessengerDirectoryQuery: React.Dispatch<React.SetStateAction<string>>;
  messengerActionBusy: string | null;
  setMessengerActionBusy: React.Dispatch<React.SetStateAction<string | null>>;

  // State: reply and edit
  messengerReplyToId: string | null;
  setMessengerReplyToId: React.Dispatch<React.SetStateAction<string | null>>;
  messengerEditMessageId: string | null;
  setMessengerEditMessageId: React.Dispatch<React.SetStateAction<string | null>>;
  messengerEditBody: string;
  setMessengerEditBody: React.Dispatch<React.SetStateAction<string>>;
  selectedMessageId: string | null;
  setSelectedMessageId: React.Dispatch<React.SetStateAction<string | null>>;

  // State: pins, acks, presence
  pinnedConversationIds: string[];
  setPinnedConversationIds: React.Dispatch<React.SetStateAction<string[]>>;
  pinnedMessageIdsByConversation: Record<string, string[]>;
  setPinnedMessageIdsByConversation: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  announcementAcks: Record<string, { status: AnnouncementAckStatus; acknowledged_at: string }>;
  setAnnouncementAcks: React.Dispatch<React.SetStateAction<Record<string, { status: AnnouncementAckStatus; acknowledged_at: string }>>>;
  presenceByUserId: Record<string, PresenceStatus>;
  setPresenceByUserId: React.Dispatch<React.SetStateAction<Record<string, PresenceStatus>>>;
  myPresenceStatus: PresenceStatus;
  setMyPresenceStatus: React.Dispatch<React.SetStateAction<PresenceStatus>>;

  // State: messenger settings
  messengerSettings: {
    push_dm: boolean;
    push_mentions: boolean;
    push_announcements: boolean;
    mute_general_groups: boolean;
    show_read_receipts: boolean;
    show_presence: boolean;
  };
  setMessengerSettings: React.Dispatch<React.SetStateAction<{
    push_dm: boolean;
    push_mentions: boolean;
    push_announcements: boolean;
    mute_general_groups: boolean;
    show_read_receipts: boolean;
    show_presence: boolean;
  }>>;

  // State: team creation
  createTeamName: string;
  setCreateTeamName: React.Dispatch<React.SetStateAction<string>>;
  createTeamDescription: string;
  setCreateTeamDescription: React.Dispatch<React.SetStateAction<string>>;
  createTeamMemberIds: string[];
  setCreateTeamMemberIds: React.Dispatch<React.SetStateAction<string[]>>;
  selectedTeamAddMemberId: string;
  setSelectedTeamAddMemberId: React.Dispatch<React.SetStateAction<string>>;

  // State: announcement composer
  showAnnouncementComposer: boolean;
  setShowAnnouncementComposer: React.Dispatch<React.SetStateAction<boolean>>;
  announcementTitle: string;
  setAnnouncementTitle: React.Dispatch<React.SetStateAction<string>>;
  announcementBody: string;
  setAnnouncementBody: React.Dispatch<React.SetStateAction<string>>;

  // State: selected conversation id
  messengerConversationId: string | null;
  setMessengerConversationId: React.Dispatch<React.SetStateAction<string | null>>;

  // Derived
  messengerMode: "inbox" | "teams" | "announcements" | "directory";
  messengerFilteredConversations: MessengerConversation[];
  selectedMessengerConversation: MessengerConversation | null;

  // Refs
  messengerReloadTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
  messengerLoadInFlightRef: React.MutableRefObject<Promise<void> | null>;

  // Functions
  loadMessengerData: () => Promise<void>;
  sendMessengerMessage: () => Promise<void>;
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
  markMessengerConversationRead: (conversationId: string, messages?: MessengerMessage[]) => Promise<void>;
  markAllMessengerConversationsRead: () => Promise<void>;
  openOrCreateDirectConversation: (member: OfficeUser) => Promise<void>;
  createTeamGroupConversation: () => Promise<void>;
  addMemberToSelectedTeam: (memberId?: string) => Promise<void>;
  removeMemberFromSelectedTeam: (memberId: string) => Promise<void>;
  createAnnouncementConversation: () => Promise<void>;
  acknowledgeAnnouncement: (conversationId: string, status: AnnouncementAckStatus) => Promise<void>;
  toggleAnnouncementReplies: (enabled: boolean) => Promise<void>;
  toggleConversationPin: (conversationId: string) => Promise<void>;
  toggleConversationMute: (conversationId: string, muted: boolean) => Promise<void>;
  toggleMessagePin: (conversationId: string, messageId: string) => Promise<void>;
  startEditingMessage: (message: MessengerMessage) => void;
  saveEditedMessage: () => Promise<void>;
  softDeleteMessage: (messageId: string) => Promise<void>;
  moderateDeleteMessage: (message: MessengerMessage) => Promise<void>;
  forwardMessages: (messageIds: string[], targetConversationId: string) => Promise<void>;
  sendLinkedRecordMessage: (linkedType: "task" | "visit" | "institution", linkedId: string, title: string, targetConversationId?: string) => Promise<void>;
  openMessengerSection: (section: "inbox" | "teams" | "announcements" | "directory") => void;
  scheduleMessengerReload: (delayMs?: number) => void;
  updatePresenceStatus: (status: PresenceStatus) => Promise<void>;
  saveMessengerSettings: () => Promise<void>;
  toggleConversationArchived: (conversationId: string, archived: boolean) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  parseMentionUserIds: (body: string, conversation?: MessengerConversation | null) => string[];
  ensureDefaultTeamGroups: () => Promise<void>;
  getOrCreateOperationalConversation: () => Promise<string | null>;
  openInternalDiscussionForRecord: (linkedType: "task" | "visit" | "institution", linkedId: string, title: string) => Promise<void>;
}

function pathToMessengerSection(pathname: string): TaskSection {
  if (pathname.startsWith("/messenger/teams")) return "messenger_teams";
  if (pathname.startsWith("/messenger/announcements")) return "messenger_announcements";
  if (pathname.startsWith("/messenger/directory")) return "messenger_directory";
  if (pathname.startsWith("/messenger/")) return "messenger_inbox";
  return "messenger_inbox";
}

export default function useMessenger(
  officeUser: OfficeUser | null,
  { playMessageTone }: { playMessageTone?: () => void } = {},
): UseMessengerReturn {
  const navigate = useNavigate();

  // State: conversations, messages, members, directory
  const [messengerConversations, setMessengerConversations] = useState<MessengerConversation[]>([]);
  const [messengerMessagesByConversation, setMessengerMessagesByConversation] = useState<Record<string, MessengerMessage[]>>({});
  const [messengerMembersByConversation, setMessengerMembersByConversation] = useState<Record<string, MessengerConversationMember[]>>({});
  const [messengerDirectory, setMessengerDirectory] = useState<OfficeUser[]>([]);
  const [messengerLoading, setMessengerLoading] = useState(false);
  const [messengerError, setMessengerError] = useState<string | null>(null);
  const [messengerSchemaReady, setMessengerSchemaReady] = useState(true);

  // State: composers and queries
  const [messengerComposer, setMessengerComposer] = useState("");
  const [messengerConversationQuery, setMessengerConversationQuery] = useState("");
  const [messengerMessageQuery, setMessengerMessageQuery] = useState("");
  const [messengerDirectoryQuery, setMessengerDirectoryQuery] = useState("");
  const [messengerActionBusy, setMessengerActionBusy] = useState<string | null>(null);

  // State: reply and edit
  const [messengerReplyToId, setMessengerReplyToId] = useState<string | null>(null);
  const [messengerEditMessageId, setMessengerEditMessageId] = useState<string | null>(null);
  const [messengerEditBody, setMessengerEditBody] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  // State: pins, acks, presence
  const [pinnedConversationIds, setPinnedConversationIds] = useState<string[]>([]);
  const [pinnedMessageIdsByConversation, setPinnedMessageIdsByConversation] = useState<Record<string, string[]>>({});
  const [announcementAcks, setAnnouncementAcks] = useState<Record<string, { status: AnnouncementAckStatus; acknowledged_at: string }>>({});
  const [presenceByUserId, setPresenceByUserId] = useState<Record<string, PresenceStatus>>({});
  const [myPresenceStatus, setMyPresenceStatus] = useState<PresenceStatus>("available");

  // State: messenger settings
  const [messengerSettings, setMessengerSettings] = useState({
    push_dm: true,
    push_mentions: true,
    push_announcements: true,
    mute_general_groups: false,
    show_read_receipts: true,
    show_presence: true,
  });

  // State: team creation
  const [createTeamName, setCreateTeamName] = useState("");
  const [createTeamDescription, setCreateTeamDescription] = useState("");
  const [createTeamMemberIds, setCreateTeamMemberIds] = useState<string[]>([]);
  const [selectedTeamAddMemberId, setSelectedTeamAddMemberId] = useState("");

  // State: announcement composer
  const [showAnnouncementComposer, setShowAnnouncementComposer] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");

  // State: selected conversation id
  const [messengerConversationId, setMessengerConversationId] = useState<string | null>(null);

  // Refs
  const messengerReloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messengerLoadInFlightRef = useRef<Promise<void> | null>(null);
  // Tracks message IDs already seen so we can detect genuinely new incoming messages
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const messageTonePrimedRef = useRef(false);

  // Derived: messengerMode — initialised from URL so page refresh / direct navigation works
  const [activeSection, setActiveSection] = useState<TaskSection>(
    pathToMessengerSection(typeof window !== "undefined" ? window.location.pathname : "/messenger/inbox"),
  );
  const isMessengerSection = activeSection.startsWith("messenger_");
  const messengerMode = useMemo<"inbox" | "teams" | "announcements" | "directory">(() => {
    if (activeSection === "messenger_teams") return "teams";
    if (activeSection === "messenger_announcements") return "announcements";
    if (activeSection === "messenger_directory") return "directory";
    return "inbox";
  }, [activeSection]);

  // Derived: filtered conversations
  const messengerFilteredConversations = useMemo(
    () =>
      messengerConversations
        .filter((conversation) => {
          if (conversation.is_archived) return false;
          if (messengerMode === "inbox") return conversation.type === "direct";
          if (messengerMode === "teams") return conversation.type === "group";
          if (messengerMode === "announcements") return conversation.type === "announcement";
          return true;
        })
        .filter((conversation) => {
          const query = messengerConversationQuery.trim().toLowerCase();
          if (!query) return true;
          const haystack = `${conversation.name || ""} ${conversation.description || ""} ${conversation.last_message_body || ""}`.toLowerCase();
          return haystack.includes(query);
        })
        .sort((a, b) => {
          const aPinned = pinnedConversationIds.includes(a.id) ? 1 : 0;
          const bPinned = pinnedConversationIds.includes(b.id) ? 1 : 0;
          if (aPinned !== bPinned) return bPinned - aPinned;
          const aDate = a.last_message_at || a.updated_at;
          const bDate = b.last_message_at || b.updated_at;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }),
    [messengerConversations, messengerMode, messengerConversationQuery, pinnedConversationIds],
  );

  const selectedMessengerConversation = useMemo(
    () =>
      messengerFilteredConversations.find((c) => c.id === messengerConversationId) ||
      messengerFilteredConversations[0] ||
      null,
    [messengerFilteredConversations, messengerConversationId],
  );

  // Helper: need teamMembers for some operations (passed via closure or fetched separately)
  const [teamMembers, setTeamMembers] = useState<OfficeUser[]>([]);

  // openMessengerSection
  const openMessengerSection = useCallback((section: "inbox" | "teams" | "announcements" | "directory") => {
    const pathMap: Record<typeof section, string> = {
      inbox: "/messenger/inbox",
      teams: "/messenger/teams",
      announcements: "/messenger/announcements",
      directory: "/messenger/directory",
    };
    setActiveSection(pathToMessengerSection(pathMap[section]));
    setMessengerConversationId(null);
    navigate(pathMap[section], { replace: true });
  }, [navigate]);

  // loadMessengerData
  const loadMessengerData = useCallback(async () => {
    if (!officeUser) return;
    if (messengerLoadInFlightRef.current) return messengerLoadInFlightRef.current;

    const run = (async () => {
      setMessengerLoading(true);
      setMessengerError(null);
      setMessengerSchemaReady(true);
      try {
        const [hydrated, directoryRows, presenceRows, settingsRow] = await Promise.all([
          msgListConversationsHydrated(),
          tmListOfficeUsers(true).catch(() => [] as Array<Record<string, unknown>>),
          msgListPresence().catch(() => [] as Array<Record<string, unknown>>),
          msgGetSettings().catch(() => null),
        ]);

        const baseConversations = hydrated.conversations.map(adaptConversation);

        if (baseConversations.length > 0) {
          const membersByConversation: Record<string, MessengerConversationMember[]> = {};
          const memberIdsByConversation = new Map<string, string[]>();
          for (const row of hydrated.members) {
            const adapted = adaptMember(row);
            (membersByConversation[adapted.conversation_id] ||= []).push(adapted);
            const list = memberIdsByConversation.get(adapted.conversation_id) ?? [];
            list.push(adapted.user_id);
            memberIdsByConversation.set(adapted.conversation_id, list);
          }

          const directoryFromQuery = directoryRows.map((row) => ({
            id: String(row.user_external_id ?? row.id ?? ""),
            full_name: String(row.full_name ?? row.email ?? "Member"),
            email: String(row.email ?? ""),
            role: String(row.role ?? "member"),
            department: (row.department as string | null) ?? null,
            is_active: row.is_active == null ? true : Boolean(row.is_active),
          })) as OfficeUser[];
          const directoryFallback = (teamMembers || []).filter((member) => member.is_active ?? true);
          const directory =
            directoryFromQuery.length > 0
              ? directoryFromQuery
              : directoryFallback.length > 0
                ? directoryFallback
                : [officeUser];
          const directoryById = new Map(directory.map((member) => [member.id, member]));

          const grouped: Record<string, MessengerMessage[]> = {};
          const firstByConversation = new Map<string, MessengerMessage>();
          // CRM returns messages newest-first; reverse to oldest-first per conversation
          // so the rendering layer doesn't need to flip them again.
          const adaptedMessages = hydrated.messages.map(adaptMessage);
          for (const row of adaptedMessages) {
            (grouped[row.conversation_id] ||= []).push(row);
            if (!firstByConversation.has(row.conversation_id)) {
              firstByConversation.set(row.conversation_id, row);
            }
          }
          for (const list of Object.values(grouped)) {
            list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          }

          setMessengerMessagesByConversation(grouped);
          setMessengerMembersByConversation(membersByConversation);

          const hydratedConversations = baseConversations
            .map((conv) => {
              const memberIds = memberIdsByConversation.get(conv.id) || [];
              const last = firstByConversation.get(conv.id);
              const nameFromParticipants =
                conv.type === "direct" && !conv.name
                  ? directoryById.get(memberIds.find((memberId) => memberId !== officeUser.id) || "")?.full_name || "Direct Chat"
                  : conv.name;

              let unreadCount = 0;
              const myLastReadMessageId = conv.my_last_read_message_id;
              const messages = grouped[conv.id] || [];
              if (messages.length > 0) {
                const lastReadIndex = myLastReadMessageId
                  ? messages.findIndex((message) => message.id === myLastReadMessageId)
                  : -1;
                unreadCount = messages.slice(lastReadIndex + 1).filter((message) => message.sender_id !== officeUser.id).length;
              }
              return {
                ...conv,
                name: nameFromParticipants || conv.name,
                member_user_ids: memberIds,
                unread_count: unreadCount,
                last_message_body: last?.body || null,
                last_message_at: last?.created_at || conv.last_message_at,
                last_message_sender_id: last?.sender_id || null,
              };
            })
            .sort((a, b) => {
              const aDate = a.last_message_at || a.updated_at;
              const bDate = b.last_message_at || b.updated_at;
              return new Date(bDate).getTime() - new Date(aDate).getTime();
            });
          setMessengerConversations(hydratedConversations);
          if (!messengerConversationId && hydratedConversations.length > 0) {
            setMessengerConversationId(hydratedConversations[0].id);
          }

          // message pins
          const nextMessagePins: Record<string, string[]> = {};
          for (const row of hydrated.messagePins) {
            (nextMessagePins[row.conversation_id] ||= []).push(row.message_id);
          }
          setPinnedMessageIdsByConversation(nextMessagePins);

          // announcement acks
          const nextAck: Record<string, { status: AnnouncementAckStatus; acknowledged_at: string }> = {};
          for (const row of hydrated.announcementAcks) {
            const conversationId = String((row as { conversation_id?: unknown }).conversation_id ?? "");
            if (!conversationId) continue;
            nextAck[conversationId] = {
              status: ((row as { status?: AnnouncementAckStatus }).status ?? "seen") as AnnouncementAckStatus,
              acknowledged_at: String((row as { acknowledged_at?: unknown }).acknowledged_at ?? ""),
            };
          }
          setAnnouncementAcks(nextAck);
        } else {
          setMessengerConversations([]);
          setMessengerMessagesByConversation({});
          setMessengerMembersByConversation({});
          setPinnedMessageIdsByConversation({});
          setAnnouncementAcks({});
        }

        // conversation-level pins
        setPinnedConversationIds(hydrated.pinnedConversationIds);

        const directoryFromQuery2 = directoryRows.map((row) => ({
          id: String(row.user_external_id ?? row.id ?? ""),
          full_name: String(row.full_name ?? row.email ?? "Member"),
          email: String(row.email ?? ""),
          role: String(row.role ?? "member"),
          department: (row.department as string | null) ?? null,
          is_active: row.is_active == null ? true : Boolean(row.is_active),
        })) as OfficeUser[];
        const directoryFallback = (teamMembers || []).filter((member) => member.is_active ?? true);
        setMessengerDirectory(
          directoryFromQuery2.length > 0
            ? directoryFromQuery2
            : directoryFallback.length > 0
              ? directoryFallback
              : [officeUser],
        );

        const nextPresence: Record<string, PresenceStatus> = {};
        for (const row of presenceRows) {
          const id = String((row as { user_external_id?: unknown }).user_external_id ?? "");
          if (!id) continue;
          nextPresence[id] = ((row as { status?: PresenceStatus }).status ?? "offline") as PresenceStatus;
        }
        setPresenceByUserId(nextPresence);
        if (nextPresence[officeUser.id]) setMyPresenceStatus(nextPresence[officeUser.id]);

        if (settingsRow) {
          setMessengerSettings({
            push_dm: Boolean(settingsRow.push_dm),
            push_mentions: Boolean(settingsRow.push_mentions),
            push_announcements: Boolean(settingsRow.push_announcements),
            mute_general_groups: Boolean(settingsRow.mute_general_groups),
            show_read_receipts: Boolean(settingsRow.show_read_receipts),
            show_presence: Boolean(settingsRow.show_presence),
          });
        }
      } catch (error: unknown) {
        setMessengerError(getErrorMessage(error, "Unable to load messenger workspace."));
      } finally {
        setMessengerLoading(false);
      }
    })();

    messengerLoadInFlightRef.current = run;
    try {
      await run;
    } finally {
      messengerLoadInFlightRef.current = null;
    }
  }, [officeUser, messengerConversationId, teamMembers]);

  // scheduleMessengerReload
  const scheduleMessengerReload = useCallback(
    (delayMs = 250) => {
      if (messengerReloadTimerRef.current) clearTimeout(messengerReloadTimerRef.current);
      messengerReloadTimerRef.current = setTimeout(() => {
        void loadMessengerData();
      }, delayMs);
    },
    [loadMessengerData],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (messengerReloadTimerRef.current) clearTimeout(messengerReloadTimerRef.current);
    };
  }, []);

  // markMessengerConversationRead
  const markMessengerConversationRead = useCallback(
    async (conversationId: string, messages: MessengerMessage[] = []) => {
      if (!officeUser || !conversationId) return;
      const sortedMessages = messages
        .slice()
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const lastMessage = sortedMessages[sortedMessages.length - 1];
      if (!lastMessage) return;
      try {
        await msgMarkRead(conversationId, lastMessage.id);
        setMessengerConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  my_last_read_message_id: lastMessage.id,
                  unread_count: 0,
                }
              : conversation,
          ),
        );
      } catch {
        // keep UI responsive if read-marker update fails
      }
    },
    [officeUser],
  );

  // markAllMessengerConversationsRead
  const markAllMessengerConversationsRead = useCallback(async () => {
    if (!officeUser) return;
    const targetConversations = messengerConversations.filter((conversation) => {
      if (conversation.is_archived) return false;
      if (messengerMode === "inbox") return conversation.type === "direct";
      if (messengerMode === "teams") return conversation.type === "group";
      if (messengerMode === "announcements") return conversation.type === "announcement";
      return false;
    });
    if (!targetConversations.length) return;
    setMessengerActionBusy("mark-read-section");
    try {
      await Promise.all(
        targetConversations.map(async (conversation) => {
          const messages = messengerMessagesByConversation[conversation.id] || [];
          await markMessengerConversationRead(conversation.id, messages);
        }),
      );
      toast.success("Section marked as read.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to mark section as read."));
    } finally {
      setMessengerActionBusy(null);
    }
  }, [markMessengerConversationRead, messengerConversations, messengerMessagesByConversation, messengerMode, officeUser]);

  // openOrCreateDirectConversation
  const openOrCreateDirectConversation = useCallback(
    async (member: OfficeUser) => {
      if (!officeUser || member.id === officeUser.id) return;
      setMessengerActionBusy(member.id);
      try {
        const existingDirect = messengerConversations.find(
          (conversation) =>
            conversation.type === "direct" &&
            conversation.member_user_ids.includes(officeUser.id) &&
            conversation.member_user_ids.includes(member.id),
        );

        if (existingDirect) {
          setMessengerConversationId(existingDirect.id);
          navigate(`/messenger/chat/${existingDirect.id}`, { replace: true });
          const existingMessages = messengerMessagesByConversation[existingDirect.id] || [];
          void markMessengerConversationRead(existingDirect.id, existingMessages);
          return;
        }

        const directConversationId = await withUiTimeout(
          msgGetOrCreateDirect(member.id),
          8000,
          "Timed out while opening direct conversation.",
        );
        if (!directConversationId || typeof directConversationId !== "string") {
          throw new Error("Direct chat conversation could not be created.");
        }

        setMessengerConversationId(directConversationId);
        navigate(`/messenger/chat/${directConversationId}`, { replace: true });
        scheduleMessengerReload(100);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to open direct chat."));
      } finally {
        setMessengerActionBusy(null);
      }
    },
    [
      markMessengerConversationRead,
      messengerConversations,
      messengerMessagesByConversation,
      navigate,
      officeUser,
      scheduleMessengerReload,
      withUiTimeout,
    ],
  );

  // ensureDefaultTeamGroups — only admins seed system default groups
  const ensureDefaultTeamGroups = useCallback(async () => {
    if (!officeUser || officeUser.role !== "admin") return;
    const defaultGroups = [
      { name: "Sales", description: "Sales coordination and field execution" },
      { name: "Vivencia", description: "Vivencia product and school visit updates" },
      { name: "ONROL", description: "ONROL operations and product communication" },
      { name: "Operations", description: "Daily operations, blockers, and escalations" },
      { name: "Management", description: "Leadership updates and priorities" },
    ];
    try {
      const existingNames = new Set(
        messengerConversations
          .filter((conversation) => conversation.type === "group")
          .map((conversation) => (conversation.name || "").trim().toLowerCase()),
      );
      const usersToAdd = (messengerDirectory.length ? messengerDirectory : teamMembers).map((member) => member.id);

      for (const group of defaultGroups) {
        const key = group.name.toLowerCase();
        if (existingNames.has(key)) continue;
        try {
          await msgCreateGroup({
            title: group.name,
            description: group.description,
            memberIds: usersToAdd,
            kind: "group",
          });
        } catch {
          // best effort
        }
      }
    } catch {
      // best effort; manual group creation remains available
    }
  }, [messengerConversations, messengerDirectory, officeUser, teamMembers]);

  // createTeamGroupConversation — available to all users
  const createTeamGroupConversation = useCallback(async () => {
    if (!officeUser) return;
    const trimmedName = createTeamName.trim();
    if (!trimmedName) {
      toast.error("Team name is required.");
      return;
    }
    setMessengerActionBusy("create-team");
    try {
      const memberIds = Array.from(
        new Set([officeUser.id, ...(messengerDirectory.length ? messengerDirectory : teamMembers).map((m) => m.id)]),
      );
      const conversationId = await msgCreateGroup({
        title: trimmedName,
        description: createTeamDescription.trim() || null,
        memberIds,
        kind: "group",
      });

      setCreateTeamName("");
      setCreateTeamDescription("");
      setCreateTeamMemberIds([]);
      await loadMessengerData();
      if (conversationId) {
        setMessengerConversationId(conversationId);
        navigate(`/messenger/chat/${conversationId}`, { replace: true });
      }
      toast.success("Group chat created.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to create group chat."));
    } finally {
      setMessengerActionBusy(null);
    }
  }, [createTeamDescription, createTeamName, loadMessengerData, messengerDirectory, navigate, officeUser, teamMembers]);

  // addMemberToSelectedTeam — if memberId is passed, adds that user directly;
  // otherwise falls back to the legacy single-select dropdown state.
  const addMemberToSelectedTeam = useCallback(async (memberId?: string) => {
    const idToAdd = memberId ?? selectedTeamAddMemberId;
    if (!officeUser || !messengerConversationId || !idToAdd) return;
    const selectedConversation = messengerConversations.find((conversation) => conversation.id === messengerConversationId);
    if (!selectedConversation || selectedConversation.type !== "group") return;
    setMessengerActionBusy(`add-team-member-${idToAdd}`);
    try {
      await msgUpsertMembers(selectedConversation.id, [{ userExternalId: idToAdd, role: "member" }]);
      if (!memberId) setSelectedTeamAddMemberId("");
      await loadMessengerData();
      toast.success("Member added.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to add member."));
    } finally {
      setMessengerActionBusy(null);
    }
  }, [loadMessengerData, messengerConversationId, messengerConversations, officeUser, selectedTeamAddMemberId]);

  // removeMemberFromSelectedTeam
  const removeMemberFromSelectedTeam = useCallback(
    async (memberId: string) => {
      if (!officeUser || !messengerConversationId) return;
      const selectedConversation = messengerConversations.find((conversation) => conversation.id === messengerConversationId);
      if (!selectedConversation || selectedConversation.type !== "group") return;
      if (memberId === officeUser.id) {
        toast.error("You cannot remove yourself from this team.");
        return;
      }
      setMessengerActionBusy(`remove-team-member-${memberId}`);
      try {
        await msgRemoveMember(selectedConversation.id, memberId);
        await loadMessengerData();
        toast.success("Member removed.");
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to remove member."));
      } finally {
        setMessengerActionBusy(null);
      }
    },
    [loadMessengerData, messengerConversationId, messengerConversations, officeUser],
  );

  // parseMentionUserIds
  const parseMentionUserIds = useCallback(
    (body: string, conversation?: MessengerConversation | null) => {
      const text = body.toLowerCase();
      const directMentions = messengerDirectory
        .filter((member) => {
          const fullNameKey = member.full_name.trim().toLowerCase().replace(/\s+/g, " ");
          const firstNameKey = fullNameKey.split(" ")[0];
          return text.includes(`@${fullNameKey}`) || text.includes(`@${firstNameKey}`);
        })
        .map((member) => member.id);

      if (!conversation || !officeUser) return directMentions;
      const isTeamMention = /(^|\s)@(team|all)\b/i.test(text);
      if (!isTeamMention) return directMentions;

      const conversationMemberIds = (messengerMembersByConversation[conversation.id] || [])
        .map((member) => member.user_id)
        .filter((id) => id !== officeUser.id);

      return Array.from(new Set([...directMentions, ...conversationMemberIds]));
    },
    [messengerDirectory, messengerMembersByConversation, officeUser],
  );

  // pushMessengerNotifications (internal helper)
  const pushMessengerNotifications = useCallback(
    async (
      conversation: MessengerConversation,
      messageBody: string,
      options?: { mentionUserIds?: string[]; announcement?: boolean; recipientIds?: string[] },
    ) => {
      if (!officeUser) return;
      const members = messengerMembersByConversation[conversation.id] || [];
      const memberIds = (options?.recipientIds && options.recipientIds.length
        ? options.recipientIds
        : members.map((member) => member.user_id)
      ).filter((id) => id !== officeUser.id);
      if (!memberIds.length) return;

      const mentionSet = new Set(options?.mentionUserIds || []);
      const rows = memberIds
        .map((userId) => {
          const isMention = mentionSet.has(userId);
          const safeConversationName = conversation.name || "team chat";
          const title = options?.announcement
            ? `${safeConversationName}: new announcement`
            : isMention
              ? `${officeUser.full_name} mentioned you`
              : conversation.type === "direct"
                ? `${officeUser.full_name} sent you a message`
                : `New message in ${safeConversationName}`;
          const priority = options?.announcement || isMention || conversation.type === "direct";
          if (conversation.type === "group" && !priority) return null;
          const summary = messageBody.trim();
          const bodyPreview = summary
            ? summary.slice(0, 220)
            : options?.announcement
              ? "Open chat to review the announcement."
              : "Open chat to view the latest message.";
          return {
            user_id: userId,
            title,
            message: bodyPreview,
            type: options?.announcement ? "system" : "task",
            related_type: "messenger",
            related_id: conversation.id,
            metadata: {
              category: "messenger",
              conversation_id: conversation.id,
              conversation_type: conversation.type,
              mention: isMention,
            },
          };
        })
        .filter(Boolean);

      if (rows.length) {
        await Promise.all(
          rows
            .filter((row): row is NonNullable<typeof row> => row != null)
            .map((row) =>
              msgInsertNotification({
                userExternalId: row.user_id,
                type: row.type,
                title: row.title,
                message: row.message,
                metadata: row.metadata,
              }).catch(() => undefined),
            ),
        );
      }
    },
    [messengerMembersByConversation, officeUser],
  );

  // createAnnouncementConversation
  const createAnnouncementConversation = useCallback(async () => {
    if (!officeUser || officeUser.role !== "admin") return;
    const title = announcementTitle.trim();
    const body = announcementBody.trim();
    if (!title || !body) {
      toast.error("Announcement title and message are required.");
      return;
    }
    setMessengerActionBusy("create-announcement");
    try {
      const memberIds = Array.from(new Set([officeUser.id, ...messengerDirectory.map((member) => member.id)]));
      const conversationId = await msgCreateGroup({
        title,
        description: "Management announcement",
        memberIds,
        settings: { replies_enabled: false },
        kind: "announcement",
      });

      await msgInsertMessage({
        conversationId,
        body,
        messageType: "announcement",
      });

      const syntheticConversation: MessengerConversation = {
        id: conversationId,
        type: "announcement",
        name: title,
        description: "Management announcement",
        created_by: officeUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        is_archived: false,
        my_member_role: "admin",
        my_last_read_message_id: null,
        member_user_ids: memberIds,
        unread_count: 0,
        last_message_body: body,
        last_message_at: new Date().toISOString(),
        last_message_sender_id: officeUser.id,
        settings: { replies_enabled: false },
      };
      await pushMessengerNotifications(syntheticConversation, body, { announcement: true, recipientIds: memberIds });

      setAnnouncementTitle("");
      setAnnouncementBody("");
      setShowAnnouncementComposer(false);
      await loadMessengerData();
      setMessengerConversationId(conversationId);
      navigate(`/messenger/chat/${conversationId}`, { replace: true });
      toast.success("Announcement posted.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to post announcement."));
    } finally {
      setMessengerActionBusy(null);
    }
  }, [announcementBody, announcementTitle, loadMessengerData, messengerDirectory, navigate, officeUser, pushMessengerNotifications]);

  // acknowledgeAnnouncement
  const acknowledgeAnnouncement = useCallback(
    async (conversationId: string, status: AnnouncementAckStatus) => {
      if (!officeUser) return;
      try {
        await msgAckAnnouncement(conversationId, status);
        const nowIso = new Date().toISOString();
        setAnnouncementAcks((prev) => ({ ...prev, [conversationId]: { status, acknowledged_at: nowIso } }));
        toast.success(status === "understood" ? "Acknowledged as understood." : "Marked as seen.");
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to record acknowledgement."));
      }
    },
    [officeUser],
  );

  // updatePresenceStatus
  const updatePresenceStatus = useCallback(
    async (status: PresenceStatus) => {
      if (!officeUser) return;
      try {
        await msgUpsertPresence(status as "online" | "away" | "dnd" | "offline");
        setMyPresenceStatus(status);
        setPresenceByUserId((prev) => ({ ...prev, [officeUser.id]: status }));
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to update status."));
      }
    },
    [officeUser],
  );

  // saveMessengerSettings
  const saveMessengerSettings = useCallback(async () => {
    if (!officeUser) return;
    try {
      await msgUpsertSettings(messengerSettings as unknown as Record<string, unknown>);
      toast.success("Messenger settings saved.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to save messenger settings."));
    }
  }, [messengerSettings, officeUser]);

  // toggleConversationPin
  const toggleConversationPin = useCallback(
    async (conversationId: string) => {
      if (!officeUser) return;
      const pinned = pinnedConversationIds.includes(conversationId);
      try {
        await msgSetConversationPin(conversationId, !pinned);
        if (pinned) {
          setPinnedConversationIds((prev) => prev.filter((id) => id !== conversationId));
        } else {
          setPinnedConversationIds((prev) => Array.from(new Set([...prev, conversationId])));
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to update pin."));
      }
    },
    [officeUser, pinnedConversationIds],
  );

  // toggleConversationMute
  const toggleConversationMute = useCallback(
    async (conversationId: string, muted: boolean) => {
      if (!officeUser) return;
      try {
        await msgSetMemberMuted(conversationId, muted);
        setMessengerConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  my_is_muted: muted,
                }
              : conversation,
          ),
        );
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to update mute setting."));
      }
    },
    [officeUser],
  );

  // deleteConversation — wipes all messages and removes the conversation entirely.
  // For direct (1:1) chats, only a participant can run it. For groups/announcements,
  // only admins/moderators.
  const deleteConversation = useCallback(
    async (conversationId: string) => {
      if (!officeUser) return;
      const convo = messengerConversations.find((c) => c.id === conversationId);
      if (!convo) return;
      const isPrivilegedRole = convo.my_member_role === "admin" || convo.my_member_role === "moderator";
      if (convo.type !== "direct" && !isPrivilegedRole) {
        toast.error("Only admins/moderators can delete this conversation.");
        return;
      }
      const confirmed = window.confirm(
        convo.type === "direct"
          ? "Delete this entire chat? All messages will be permanently removed for both of you."
          : "Delete this conversation? All messages will be permanently removed for everyone.",
      );
      if (!confirmed) return;
      try {
        await msgDeleteConversation(conversationId);
        setMessengerMessagesByConversation((prev) => {
          const next = { ...prev };
          delete next[conversationId];
          return next;
        });
        setMessengerConversations((prev) => prev.filter((c) => c.id !== conversationId));
        if (messengerConversationId === conversationId) setMessengerConversationId(null);
        toast.success("Chat deleted.");
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to delete conversation."));
      }
    },
    [messengerConversationId, messengerConversations, officeUser],
  );

  // toggleConversationArchived
  const toggleConversationArchived = useCallback(
    async (conversationId: string, archived: boolean) => {
      if (!officeUser) return;
      const activeConversation = messengerConversations.find((item) => item.id === conversationId);
      if (!activeConversation) return;
      if (!(activeConversation.my_member_role === "admin" || activeConversation.my_member_role === "moderator")) {
        toast.error("Only admins/moderators can archive this conversation.");
        return;
      }
      try {
        await msgSetConversationArchived(conversationId, archived);
        setMessengerConversations((prev) =>
          prev.map((conversation) => (conversation.id === conversationId ? { ...conversation, is_archived: archived } : conversation)),
        );
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to update archive state."));
      }
    },
    [messengerConversations, officeUser],
  );

  // toggleMessagePin
  const toggleMessagePin = useCallback(
    async (conversationId: string, messageId: string) => {
      if (!officeUser) return;
      const pinned = (pinnedMessageIdsByConversation[conversationId] || []).includes(messageId);
      try {
        if (pinned) {
          await msgUnpinMessage(conversationId, messageId);
          setPinnedMessageIdsByConversation((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).filter((id) => id !== messageId),
          }));
        } else {
          await msgPinMessage(conversationId, messageId);
          setPinnedMessageIdsByConversation((prev) => ({
            ...prev,
            [conversationId]: Array.from(new Set([...(prev[conversationId] || []), messageId])),
          }));
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to update message pin."));
      }
    },
    [officeUser, pinnedMessageIdsByConversation],
  );

  // startEditingMessage
  const startEditingMessage = useCallback((message: MessengerMessage) => {
    setMessengerEditMessageId(message.id);
    setMessengerEditBody(message.body || "");
  }, []);

  // saveEditedMessage
  const saveEditedMessage = useCallback(async () => {
    if (!messengerEditMessageId || !messengerEditBody.trim()) return;
    try {
      await msgEditMessage(messengerEditMessageId, messengerEditBody.trim());
      setMessengerMessagesByConversation((prev) => {
        const next: Record<string, MessengerMessage[]> = {};
        for (const [conversationId, rows] of Object.entries(prev)) {
          next[conversationId] = rows.map((row) =>
            row.id === messengerEditMessageId ? { ...row, body: messengerEditBody.trim(), edited_at: new Date().toISOString() } : row,
          );
        }
        return next;
      });
      setMessengerEditMessageId(null);
      setMessengerEditBody("");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to save message edit."));
    }
  }, [messengerEditBody, messengerEditMessageId]);

  // softDeleteMessage
  const softDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await msgSoftDeleteMessage(messageId, "[message deleted]");
      setMessengerMessagesByConversation((prev) => {
        const next: Record<string, MessengerMessage[]> = {};
        for (const [conversationId, rows] of Object.entries(prev)) {
          next[conversationId] = rows.map((row) => (row.id === messageId ? { ...row, deleted_at: new Date().toISOString(), body: "[message deleted]" } : row));
        }
        return next;
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to delete message."));
    }
  }, []);

  // moderateDeleteMessage
  const moderateDeleteMessage = useCallback(
    async (message: MessengerMessage) => {
      if (!officeUser || !messengerConversationId) return;
      const activeConversation = messengerConversations.find((conversation) => conversation.id === messengerConversationId);
      if (!activeConversation) return;
      const isModerator =
        activeConversation.my_member_role === "admin" || activeConversation.my_member_role === "moderator";
      if (!isModerator) {
        toast.error("Only admins/moderators can delete this message.");
        return;
      }
      if (message.sender_id === officeUser.id) {
        await softDeleteMessage(message.id);
        return;
      }
      try {
        await msgModerateDeleteMessage(message.id, "[message removed by moderator]");
        setMessengerMessagesByConversation((prev) => {
          const next: Record<string, MessengerMessage[]> = {};
          for (const [conversationId, rows] of Object.entries(prev)) {
            next[conversationId] = rows.map((row) =>
              row.id === message.id
                ? { ...row, deleted_at: new Date().toISOString(), body: "[message removed by moderator]" }
                : row,
            );
          }
          return next;
        });
        toast.success("Message removed.");
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to moderate message."));
      }
    },
    [messengerConversationId, messengerConversations, officeUser, softDeleteMessage],
  );

  // toggleAnnouncementReplies
  const toggleAnnouncementReplies = useCallback(
    async (enabled: boolean) => {
      if (!messengerConversationId) return;
      const activeConversation = messengerConversations.find((conversation) => conversation.id === messengerConversationId);
      if (!activeConversation || activeConversation.type !== "announcement") return;
      const isModerator =
        activeConversation.my_member_role === "admin" || activeConversation.my_member_role === "moderator";
      if (!isModerator) {
        toast.error("Only admins/moderators can change announcement reply settings.");
        return;
      }
      setMessengerActionBusy("toggle-announcement-replies");
      try {
        const settings = {
          ...(activeConversation.settings || {}),
          replies_enabled: enabled,
        };
        await msgUpdateConversationSettings(activeConversation.id, settings);
        setMessengerConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === activeConversation.id
              ? { ...conversation, settings }
              : conversation,
          ),
        );
        toast.success(enabled ? "Announcement replies enabled." : "Announcement replies locked.");
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to update announcement settings."));
      } finally {
        setMessengerActionBusy(null);
      }
    },
    [messengerConversationId, messengerConversations],
  );

  const sendMessengerPayload = useCallback(async (payload: {
    body?: string;
    messageType?: "text" | "system" | "linked_record" | "announcement";
    metadata?: Record<string, unknown>;
    replyToMessageId?: string | null;
    linkedEntityType?: "task" | "visit" | "institution" | null;
    linkedEntityId?: string | null;
  }) => {
    if (!officeUser || !messengerConversationId) return;
    const activeConversation = messengerConversations.find((conversation) => conversation.id === messengerConversationId);
    if (!activeConversation) return;

    const body = String(payload.body ?? "").trim();
    const messageType = payload.messageType || "text";
    if (!body && messageType === "text") return;

    const isAnnouncement = activeConversation.type === "announcement";
    const repliesEnabled = (activeConversation.settings?.replies_enabled as boolean | undefined) === true;
    const canModerate = activeConversation.my_member_role === "admin" || activeConversation.my_member_role === "moderator";
    if (isAnnouncement && !repliesEnabled && !canModerate) {
      toast.error("Replies are locked for this announcement.");
      return;
    }

    const replyToMessageId = payload.replyToMessageId ?? messengerReplyToId;
    const tempId = `tmp-${Date.now()}`;
    const optimisticMessage: MessengerMessage = {
      id: tempId,
      conversation_id: messengerConversationId,
      sender_id: officeUser.id,
      message_type: messageType,
      body,
      created_at: new Date().toISOString(),
      edited_at: null,
      reply_to_message_id: replyToMessageId,
      linked_entity_type: payload.linkedEntityType ?? null,
      linked_entity_id: payload.linkedEntityId ?? null,
      metadata: payload.metadata || {},
      deleted_at: null,
    };

    setMessengerMessagesByConversation((prev) => ({
      ...prev,
      [messengerConversationId]: [...(prev[messengerConversationId] || []), optimisticMessage],
    }));
    setMessengerConversations((prev) =>
      prev
        .map((conv) =>
          conv.id === messengerConversationId
            ? {
                ...conv,
                my_last_read_message_id: optimisticMessage.id,
                unread_count: 0,
                last_message_body: optimisticMessage.body || `[${messageType}]`,
                last_message_at: optimisticMessage.created_at,
                last_message_sender_id: optimisticMessage.sender_id,
              }
            : conv,
        )
        .sort((a, b) => {
          const aDate = a.last_message_at || a.updated_at;
          const bDate = b.last_message_at || b.updated_at;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }),
    );

    try {
      const insertedRow = await msgInsertMessage({
        conversationId: messengerConversationId,
        body,
        metadata: payload.metadata || {},
        messageType,
        replyToMessageId: replyToMessageId ?? null,
        linkedEntityType: payload.linkedEntityType ?? null,
        linkedEntityId: payload.linkedEntityId ?? null,
      });
      const insertedMessage = insertedRow ? adaptMessage(insertedRow) : null;
      if (insertedMessage) {
        setMessengerMessagesByConversation((prev) => ({
          ...prev,
          [messengerConversationId]: (prev[messengerConversationId] || []).map((m) =>
            m.id === tempId ? insertedMessage : m,
          ),
        }));
      }

      void markMessengerConversationRead(messengerConversationId, [
        ...(messengerMessagesByConversation[messengerConversationId] || []),
        optimisticMessage,
      ]);
      if (messageType === "text" && body) {
        const mentionUserIds = parseMentionUserIds(body, activeConversation);
        void pushMessengerNotifications(activeConversation, body, { mentionUserIds }).catch(() => {
          // Notification failures should not block chat sending.
        });
      } else {
        void pushMessengerNotifications(activeConversation, `New ${messageType} message`, {}).catch(() => {});
      }
      scheduleMessengerReload(150);
    } catch (error: unknown) {
      setMessengerMessagesByConversation((prev) => ({
        ...prev,
        [messengerConversationId]: (prev[messengerConversationId] || []).filter((m) => m.id !== tempId),
      }));
      toast.error(getErrorMessage(error, "Unable to send message."));
    }
  }, [
    markMessengerConversationRead,
    messengerConversationId,
    messengerConversations,
    messengerMessagesByConversation,
    messengerReplyToId,
    officeUser,
    parseMentionUserIds,
    pushMessengerNotifications,
    scheduleMessengerReload,
  ]);

  const uploadMessengerFile = useCallback(async (file: File) => {
    if (!officeUser || !messengerConversationId) {
      throw new Error("Choose a conversation before uploading.");
    }

    // Ensure a valid auth session exists before attempting a storage write.
    // Supabase returns "Bucket not found" (instead of Unauthorized) when the
    // request reaches the storage API with the anon key (no session).
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      // Try a silent token refresh first
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (!refreshData.session) {
        throw new Error("Your session has expired. Please log in again to send attachments.");
      }
    }

    const maxBytes = 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error("File exceeds 50 MB limit.");
    }

    // Upload to Cloudinary (unsigned preset — no secret needed on client)
    const CLOUDINARY_CLOUD = "dumpn4wcq";
    const CLOUDINARY_PRESET = "onrol_hub_unsigned";
    const resourceType = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : "raw";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    formData.append("folder", "onrol_hub_uploads/chat");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`,
      { method: "POST", body: formData }
    );
    if (!res.ok) {
      let errMsg = "Cloudinary upload failed";
      try { const j = await res.json() as { error?: { message?: string } }; errMsg = j.error?.message ?? errMsg; } catch { /* ignore */ }
      throw new Error(`Upload failed: ${errMsg}`);
    }
    const result = await res.json() as { secure_url: string; public_id: string };
    return {
      bucket: "cloudinary",
      path: result.public_id,
      publicUrl: result.secure_url,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      name: file.name,
    };
  }, [messengerConversationId, officeUser]);

  // sendMessengerMessage
  const sendMessengerMessage = async () => {
    if (!officeUser || !messengerConversationId) return;
    const body = messengerComposer.trim();
    if (!body && !messengerReplyToId) return;
    setMessengerComposer("");
    setMessengerReplyToId(null);
    await sendMessengerPayload({
      body,
      messageType: "text",
      replyToMessageId: messengerReplyToId,
    });
  };

  // forwardMessages
  const forwardMessages = useCallback(
    async (messageIds: string[], targetConversationId: string) => {
      if (!officeUser) return;
      const allMessages = Object.values(messengerMessagesByConversation).flat();
      const msgsToForward = messageIds
        .map((id) => allMessages.find((m) => m.id === id))
        .filter((m): m is MessengerMessage => Boolean(m));
      for (const msg of msgsToForward) {
        await msgInsertMessage({
          conversationId: targetConversationId,
          body: msg.body ? `⟩ ${msg.body}` : "[forwarded message]",
          messageType: "text",
        });
      }
      scheduleMessengerReload(200);
      toast.success(messageIds.length > 1 ? `Forwarded ${messageIds.length} messages.` : "Message forwarded.");
    },
    [messengerMessagesByConversation, officeUser, scheduleMessengerReload],
  );

  // sendLinkedRecordMessage
  const sendLinkedRecordMessage = useCallback(
    async (linkedType: "task" | "visit" | "institution", linkedId: string, title: string, targetConversationId?: string) => {
      if (!officeUser) return;
      const conversationId = targetConversationId || messengerConversationId;
      if (!conversationId) return;
      const activeConversation = messengerConversations.find((conversation) => conversation.id === conversationId);
      const body = `Linked ${linkedType}: ${title}`;
      try {
        const tempId = `tmp-linked-${Date.now()}`;
        const optimisticMessage: MessengerMessage = {
          id: tempId,
          conversation_id: conversationId,
          sender_id: officeUser.id,
          message_type: "linked_record",
          body,
          created_at: new Date().toISOString(),
          edited_at: null,
          reply_to_message_id: null,
          linked_entity_type: linkedType,
          linked_entity_id: linkedId,
          deleted_at: null,
        };
        setMessengerMessagesByConversation((prev) => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), optimisticMessage],
        }));

        try {
          await msgInsertMessage({
            conversationId,
            body,
            messageType: "linked_record",
            linkedEntityType: linkedType,
            linkedEntityId: linkedId,
          });
        } catch (sendError) {
          setMessengerMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: (prev[conversationId] || []).filter((m) => m.id !== tempId),
          }));
          throw sendError;
        }

        setMessengerConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId
              ? {
                  ...conversation,
                  last_message_body: body,
                  last_message_at: optimisticMessage.created_at,
                  last_message_sender_id: officeUser.id,
                }
              : conversation,
          ),
        );
        scheduleMessengerReload(150);
        if (activeConversation) {
          void pushMessengerNotifications(activeConversation, body, {}).catch(() => {
            // Notification failures should not block linked record messages.
          });
        }
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to share linked record."));
      }
    },
    [messengerConversationId, messengerConversations, officeUser, pushMessengerNotifications, scheduleMessengerReload],
  );

  // getOrCreateOperationalConversation
  const getOrCreateOperationalConversation = useCallback(async (): Promise<string | null> => {
    if (!officeUser) return null;
    const localOpsConversation = messengerConversations.find(
      (conversation) => conversation.type === "group" && (conversation.name || "").trim().toLowerCase() === "operations",
    );
    if (localOpsConversation) return localOpsConversation.id;

    // Only admins can seed the operations conversation.
    if (officeUser.role !== "admin") return null;

    const usersToAdd = Array.from(
      new Set([officeUser.id, ...(messengerDirectory.length ? messengerDirectory : teamMembers).map((member) => member.id)]),
    );
    const conversationId = await msgCreateGroup({
      title: "Operations",
      description: "Task, visit, and institution internal discussions",
      memberIds: usersToAdd,
      kind: "group",
    });
    return conversationId;
  }, [messengerConversations, messengerDirectory, officeUser, teamMembers]);

  // openInternalDiscussionForRecord
  const openInternalDiscussionForRecord = useCallback(
    async (linkedType: "task" | "visit" | "institution", linkedId: string, title: string) => {
      if (!officeUser) return;
      setMessengerActionBusy("open-record-discussion");
      try {
        const conversationId = await getOrCreateOperationalConversation();
        if (!conversationId) {
          toast.error("Internal discussion is only available to admins.");
          return;
        }
        openMessengerSection("teams");
        setMessengerConversationId(conversationId);
        navigate(`/messenger/chat/${conversationId}`, { replace: true });
        await sendLinkedRecordMessage(linkedType, linkedId, title, conversationId);
        toast.success("Internal discussion opened.");
        scheduleMessengerReload(120);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Unable to open internal discussion."));
      } finally {
        setMessengerActionBusy(null);
      }
    },
    [getOrCreateOperationalConversation, navigate, officeUser, openMessengerSection, scheduleMessengerReload, sendLinkedRecordMessage],
  );

  // Effect: Auto-reload when entering messenger section
  useEffect(() => {
    if (!officeUser) return;
    if (!isMessengerSection) return;
    scheduleMessengerReload(50);
  }, [officeUser, isMessengerSection, scheduleMessengerReload]);

  // Effect: Ensure default team groups when in teams mode
  useEffect(() => {
    if (!officeUser) return;
    if (messengerMode !== "teams") return;
    if (!messengerSchemaReady) return;
    if (messengerLoading) return;
    if (messengerConversations.some((conversation) => conversation.type === "group")) return;
    void ensureDefaultTeamGroups().then(() => {
      scheduleMessengerReload(120);
    });
  }, [ensureDefaultTeamGroups, messengerConversations, messengerLoading, messengerMode, messengerSchemaReady, officeUser, scheduleMessengerReload]);

  // Effect: Mark conversation read when selected
  useEffect(() => {
    if (!officeUser || !messengerConversationId) return;
    const conversationMessages = messengerMessagesByConversation[messengerConversationId] || [];
    void markMessengerConversationRead(messengerConversationId, conversationMessages);
  }, [markMessengerConversationRead, messengerConversationId, messengerMessagesByConversation, officeUser]);

  // Effect: Clear selected message when conversation changes
  useEffect(() => {
    setSelectedMessageId(null);
  }, [messengerConversationId]);

  // Effect: Play sound on new incoming messages from other users
  useEffect(() => {
    if (!officeUser || !playMessageTone) return;
    const allMessages = Object.values(messengerMessagesByConversation).flat();
    if (!messageTonePrimedRef.current) {
      // Prime the ref with all current messages; don't play on first load
      allMessages.forEach((msg) => seenMessageIdsRef.current.add(msg.id));
      messageTonePrimedRef.current = true;
      return;
    }
    let played = false;
    for (const msg of allMessages) {
      if (!seenMessageIdsRef.current.has(msg.id)) {
        seenMessageIdsRef.current.add(msg.id);
        // Only play for messages sent by someone else
        if (msg.sender_id !== officeUser.id && !played) {
          playMessageTone();
          played = true; // play once per batch, not once per message
          // Show browser notification when tab is not in focus
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
            try {
              const senderName = messengerDirectory.find((u) => u.id === msg.sender_id)?.full_name ?? "Someone";
              const body = msg.body ? (msg.body.length > 80 ? msg.body.slice(0, 77) + "…" : msg.body) : "Sent an attachment";
              new Notification(`💬 ${senderName}`, { body, tag: `chat-${msg.id}` });
            } catch { /* ignore */ }
          }
        }
      }
    }
  }, [messengerMessagesByConversation, officeUser, playMessageTone]);

  // Effect: Reset seen message refs when user changes
  useEffect(() => {
    seenMessageIdsRef.current = new Set();
    messageTonePrimedRef.current = false;
  }, [officeUser?.id]);

  // Effect: messenger realtime via SSE. New message events trigger a fast
  // reload; presence events update the presence map directly without a
  // re-fetch.
  useEffect(() => {
    if (!officeUser || !isMessengerSection || !messengerSchemaReady) return undefined;
    let stream: MsgStreamHandle | null = null;
    try {
      stream = msgOpenStream((event) => {
        if (event.type === "message") {
          scheduleMessengerReload(150);
          return;
        }
        if (event.type === "presence") {
          setPresenceByUserId((prev) => ({
            ...prev,
            [event.userExternalId]: event.status as PresenceStatus,
          }));
          return;
        }
        // notifications are handled by useNotifications; other event types are no-ops here
      });
    } catch {
      // EventSource may be unavailable; the polling effect below is the fallback.
    }
    return () => {
      stream?.close();
    };
  }, [isMessengerSection, messengerSchemaReady, officeUser, scheduleMessengerReload]);

  // Effect: safety-net poll. SSE drives realtime; this catches any events
  // that race the stream reconnect.
  useEffect(() => {
    if (!officeUser || !isMessengerSection || !messengerSchemaReady) return undefined;
    const poller = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void loadMessengerData();
    }, 15000);
    return () => clearInterval(poller);
  }, [isMessengerSection, loadMessengerData, messengerSchemaReady, officeUser]);

  // Effect: Presence tracking
  useEffect(() => {
    if (!officeUser || !isMessengerSection) return undefined;
    void updatePresenceStatus(myPresenceStatus);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void updatePresenceStatus(myPresenceStatus);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isMessengerSection, myPresenceStatus, officeUser, updatePresenceStatus]);

  return {
    // State: conversations, messages, members, directory
    messengerConversations,
    setMessengerConversations,
    messengerMessagesByConversation,
    setMessengerMessagesByConversation,
    messengerMembersByConversation,
    setMessengerMembersByConversation,
    messengerDirectory,
    setMessengerDirectory,
    messengerLoading,
    setMessengerLoading,
    messengerError,
    setMessengerError,
    messengerSchemaReady,
    setMessengerSchemaReady,

    // State: composers and queries
    messengerComposer,
    setMessengerComposer,
    messengerConversationQuery,
    setMessengerConversationQuery,
    messengerMessageQuery,
    setMessengerMessageQuery,
    messengerDirectoryQuery,
    setMessengerDirectoryQuery,
    messengerActionBusy,
    setMessengerActionBusy,

    // State: reply and edit
    messengerReplyToId,
    setMessengerReplyToId,
    messengerEditMessageId,
    setMessengerEditMessageId,
    messengerEditBody,
    setMessengerEditBody,
    selectedMessageId,
    setSelectedMessageId,

    // State: pins, acks, presence
    pinnedConversationIds,
    setPinnedConversationIds,
    pinnedMessageIdsByConversation,
    setPinnedMessageIdsByConversation,
    announcementAcks,
    setAnnouncementAcks,
    presenceByUserId,
    setPresenceByUserId,
    myPresenceStatus,
    setMyPresenceStatus,

    // State: messenger settings
    messengerSettings,
    setMessengerSettings,

    // State: team creation
    createTeamName,
    setCreateTeamName,
    createTeamDescription,
    setCreateTeamDescription,
    createTeamMemberIds,
    setCreateTeamMemberIds,
    selectedTeamAddMemberId,
    setSelectedTeamAddMemberId,

    // State: announcement composer
    showAnnouncementComposer,
    setShowAnnouncementComposer,
    announcementTitle,
    setAnnouncementTitle,
    announcementBody,
    setAnnouncementBody,

    // State: selected conversation id
    messengerConversationId,
    setMessengerConversationId,

    // Derived
    messengerMode,
    messengerFilteredConversations,
    selectedMessengerConversation,

    // Refs
    messengerReloadTimerRef,
    messengerLoadInFlightRef,

    // Functions
    loadMessengerData,
    sendMessengerMessage,
    sendMessengerPayload,
    uploadMessengerFile,
    markMessengerConversationRead,
    markAllMessengerConversationsRead,
    openOrCreateDirectConversation,
    createTeamGroupConversation,
    addMemberToSelectedTeam,
    removeMemberFromSelectedTeam,
    createAnnouncementConversation,
    acknowledgeAnnouncement,
    toggleAnnouncementReplies,
    toggleConversationPin,
    toggleConversationMute,
    toggleMessagePin,
    startEditingMessage,
    saveEditedMessage,
    softDeleteMessage,
    moderateDeleteMessage,
    forwardMessages,
    sendLinkedRecordMessage,
    openMessengerSection,
    scheduleMessengerReload,
    updatePresenceStatus,
    saveMessengerSettings,
    toggleConversationArchived,
    deleteConversation,
    parseMentionUserIds,
    ensureDefaultTeamGroups,
    getOrCreateOperationalConversation,
    openInternalDiscussionForRecord,
  };
}
