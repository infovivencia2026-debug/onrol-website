// Browser-side client for the Messenger + Notifications API
// (onrol.in /api/messenger/*). Hooks in src/hooks/taskManager/
// (useMessenger, useNotifications) call these functions instead of
// supabase.from(...).
//
// REALTIME: live events are delivered via Server-Sent Events from
// /api/messenger/stream (proxied to the CRM's Postgres LISTEN/NOTIFY
// fanout). Call msgOpenStream() to subscribe.

import { supabase } from "@/lib/supabase";

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function msgFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const auth = await authHeader();
  return fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...auth,
      ...(init.headers ?? {}),
    },
  });
}

async function msgJson<T>(r: Response, label: string): Promise<T> {
  const text = await r.text();
  let parsed: unknown = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* leave null */ }
  if (!r.ok) {
    const message = (parsed && typeof parsed === "object" && "error" in parsed && typeof (parsed as { error?: unknown }).error === "string")
      ? (parsed as { error: string }).error
      : `${label} failed (${r.status})`;
    const err = new Error(message);
    (err as Error & { status?: number }).status = r.status;
    throw err;
  }
  return (parsed ?? {}) as T;
}

// ── Notifications ────────────────────────────────────────────────────────

export async function msgListNotifications(opts: { unreadOnly?: boolean; severity?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.unreadOnly) params.set("unreadOnly", "1");
  if (opts.severity) params.set("severity", opts.severity);
  if (opts.limit) params.set("limit", String(opts.limit));
  const r = await msgFetch(`/api/messenger/notifications?${params.toString()}`);
  const { notifications } = await msgJson<{ ok: boolean; notifications: Array<Record<string, unknown>> }>(r, "list notifications");
  return notifications;
}

export async function msgInsertNotification(input: Record<string, unknown>) {
  const r = await msgFetch("/api/messenger/notifications", { method: "POST", body: JSON.stringify(input) });
  return msgJson<{ ok: boolean; id: string | null }>(r, "insert notification");
}

export async function msgMarkNotificationsRead(ids: string[]) {
  const r = await msgFetch("/api/messenger/notifications", {
    method: "POST",
    body: JSON.stringify({ action: "markRead", ids }),
  });
  return msgJson<{ ok: boolean; count: number }>(r, "mark read");
}

export async function msgMarkAllNotificationsRead() {
  const r = await msgFetch("/api/messenger/notifications", {
    method: "POST",
    body: JSON.stringify({ action: "markAllRead" }),
  });
  return msgJson<{ ok: boolean; count: number }>(r, "mark all read");
}

export async function msgDeleteAllNotifications() {
  const r = await msgFetch("/api/messenger/notifications", {
    method: "POST",
    body: JSON.stringify({ action: "deleteAllForUser" }),
  });
  return msgJson<{ ok: boolean; count: number }>(r, "delete all notifications");
}

// ── Conversations ────────────────────────────────────────────────────────

export interface MsgHydratedConversations {
  conversations: Array<Record<string, unknown>>;
  members: Array<Record<string, unknown>>;
  messages: Array<Record<string, unknown>>;
  messagePins: Array<{ conversation_id: string; message_id: string }>;
  announcementAcks: Array<Record<string, unknown>>;
  pinnedConversationIds: string[];
}

export async function msgListConversations() {
  const r = await msgFetch("/api/messenger/conversations");
  const { conversations } = await msgJson<{ ok: boolean; conversations: Array<Record<string, unknown>> }>(r, "list conversations");
  return conversations;
}

export async function msgListConversationsHydrated(): Promise<MsgHydratedConversations> {
  const r = await msgFetch("/api/messenger/conversations?hydrate=1");
  const out = await msgJson<{
    ok: boolean;
    conversations: Array<Record<string, unknown>>;
    members?: Array<Record<string, unknown>>;
    messages?: Array<Record<string, unknown>>;
    messagePins?: Array<{ conversation_id: string; message_id: string }>;
    announcementAcks?: Array<Record<string, unknown>>;
    pinnedConversationIds?: string[];
  }>(r, "list conversations hydrated");
  return {
    conversations: out.conversations ?? [],
    members: out.members ?? [],
    messages: out.messages ?? [],
    messagePins: out.messagePins ?? [],
    announcementAcks: out.announcementAcks ?? [],
    pinnedConversationIds: out.pinnedConversationIds ?? [],
  };
}

export async function msgCreateConversation(input: { kind?: string; title?: string | null; settings?: Record<string, unknown> }) {
  const r = await msgFetch("/api/messenger/conversations", { method: "POST", body: JSON.stringify(input) });
  const { conversation } = await msgJson<{ ok: boolean; conversation: Record<string, unknown> }>(r, "create conversation");
  return conversation;
}

export async function msgGetOrCreateDirect(otherUserId: string): Promise<string> {
  const r = await msgFetch("/api/messenger/conversations", {
    method: "POST",
    body: JSON.stringify({ action: "direct", otherUserId }),
  });
  const { conversationId } = await msgJson<{ ok: boolean; conversationId: string }>(r, "direct conversation");
  return conversationId;
}

export async function msgCreateGroup(input: {
  title: string;
  description?: string | null;
  memberIds: string[];
  settings?: Record<string, unknown>;
  kind?: "group" | "announcement";
}): Promise<string> {
  const r = await msgFetch("/api/messenger/conversations", {
    method: "POST",
    body: JSON.stringify({
      action: input.kind === "announcement" ? "announcement" : "group",
      title: input.title,
      description: input.description ?? null,
      memberIds: input.memberIds,
      settings: input.settings,
    }),
  });
  const { conversationId } = await msgJson<{ ok: boolean; conversationId: string }>(r, "create group");
  return conversationId;
}

export async function msgUpdateConversationSettings(id: string, settings: Record<string, unknown>) {
  const r = await msgFetch(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "settings", settings }),
  });
  return msgJson<{ ok: boolean; conversation: Record<string, unknown> }>(r, "update conversation settings");
}

export async function msgSetConversationArchived(id: string, archived: boolean) {
  const r = await msgFetch(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "archive", archived }),
  });
  return msgJson<{ ok: boolean }>(r, "archive conversation");
}

export async function msgDeleteConversation(id: string) {
  const r = await msgFetch(`/api/messenger/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
  return msgJson<{ ok: boolean }>(r, "delete conversation");
}

// Admin-only helper: scrubs a user from every conversation they belong
// to. Used by UserManagement when an admin deactivates a teammate so the
// directories/group lists hide them immediately.
export async function msgRemoveUserFromAllConversations(userExternalId: string) {
  const r = await msgFetch(
    `/api/messenger/conversations?action=removeUserFromAll&userExternalId=${encodeURIComponent(userExternalId)}`,
    { method: "DELETE" },
  );
  return msgJson<{ ok: boolean; count: number }>(r, "remove user from all conversations");
}

export async function msgUpsertMembers(id: string, members: Array<{ userExternalId: string; role?: string }>) {
  const r = await msgFetch(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "addMembers", members }),
  });
  return msgJson<{ ok: boolean; count: number }>(r, "upsert members");
}

export async function msgRemoveMember(id: string, userExternalId: string) {
  const r = await msgFetch(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "removeMember", userExternalId }),
  });
  return msgJson<{ ok: boolean }>(r, "remove member");
}

export async function msgMarkRead(id: string, lastReadMessageId?: string | null) {
  const r = await msgFetch(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "markRead", lastReadMessageId: lastReadMessageId ?? null }),
  });
  return msgJson<{ ok: boolean }>(r, "mark conversation read");
}

export async function msgSetMemberMuted(id: string, muted: boolean) {
  const r = await msgFetch(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "mute", muted }),
  });
  return msgJson<{ ok: boolean }>(r, "mute conversation");
}

export async function msgSetMemberHidden(id: string, hidden: boolean) {
  const r = await msgFetch(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "hide", hidden }),
  });
  return msgJson<{ ok: boolean }>(r, "hide conversation");
}

export async function msgSetConversationPin(id: string, pinned: boolean) {
  const r = await msgFetch(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "pin", pinned }),
  });
  return msgJson<{ ok: boolean }>(r, "pin conversation");
}

export async function msgAckAnnouncement(id: string, status: "seen" | "understood", messageId?: string) {
  const r = await msgFetch(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "ack", status, messageId }),
  });
  return msgJson<{ ok: boolean; messageId?: string | null }>(r, "ack announcement");
}

// ── Messages ─────────────────────────────────────────────────────────────

export async function msgListMessages(conversationId: string, opts: { limit?: number; before?: string } = {}) {
  const params = new URLSearchParams({ conversationId });
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.before) params.set("before", opts.before);
  const r = await msgFetch(`/api/messenger/messages?${params.toString()}`);
  const { messages } = await msgJson<{ ok: boolean; messages: Array<Record<string, unknown>> }>(r, "list messages");
  return messages;
}

export async function msgInsertMessage(input: {
  conversationId: string;
  body: string;
  attachments?: unknown[];
  metadata?: Record<string, unknown> | null;
  messageType?: string;
  replyToMessageId?: string | null;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
}) {
  const r = await msgFetch("/api/messenger/messages", { method: "POST", body: JSON.stringify(input) });
  const { message } = await msgJson<{ ok: boolean; message: Record<string, unknown> }>(r, "insert message");
  return message;
}

export async function msgEditMessage(messageId: string, body: string) {
  const r = await msgFetch("/api/messenger/messages", {
    method: "POST",
    body: JSON.stringify({ action: "edit", messageId, body }),
  });
  return msgJson<{ ok: boolean; message: Record<string, unknown> }>(r, "edit message");
}

export async function msgSoftDeleteMessage(messageId: string, newBody?: string) {
  const r = await msgFetch("/api/messenger/messages", {
    method: "POST",
    body: JSON.stringify({ action: "softDelete", messageId, newBody }),
  });
  return msgJson<{ ok: boolean }>(r, "soft-delete message");
}

export async function msgModerateDeleteMessage(messageId: string, newBody?: string) {
  const r = await msgFetch("/api/messenger/messages", {
    method: "POST",
    body: JSON.stringify({ action: "moderateDelete", messageId, newBody }),
  });
  return msgJson<{ ok: boolean }>(r, "moderate-delete message");
}

export async function msgPinMessage(conversationId: string, messageId: string) {
  const r = await msgFetch("/api/messenger/messages", {
    method: "POST",
    body: JSON.stringify({ action: "pin", conversationId, messageId }),
  });
  return msgJson<{ ok: boolean; pin: Record<string, unknown> | null }>(r, "pin message");
}

export async function msgUnpinMessage(conversationId: string, messageId: string) {
  const r = await msgFetch("/api/messenger/messages", {
    method: "POST",
    body: JSON.stringify({ action: "unpin", conversationId, messageId }),
  });
  return msgJson<{ ok: boolean }>(r, "unpin message");
}

// ── Messenger settings ───────────────────────────────────────────────────

export async function msgGetSettings(): Promise<Record<string, unknown> | null> {
  const r = await msgFetch("/api/messenger/settings");
  const { settings } = await msgJson<{ ok: boolean; settings: Record<string, unknown> | null }>(r, "get settings");
  return settings;
}

export async function msgUpsertSettings(patch: Record<string, unknown>) {
  const r = await msgFetch("/api/messenger/settings", { method: "PUT", body: JSON.stringify(patch) });
  const { settings } = await msgJson<{ ok: boolean; settings: Record<string, unknown> }>(r, "upsert settings");
  return settings;
}

// ── Presence ─────────────────────────────────────────────────────────────

export async function msgListPresence(users?: string[]) {
  const params = new URLSearchParams();
  if (users && users.length) params.set("users", users.join(","));
  const r = await msgFetch(`/api/messenger/presence?${params.toString()}`);
  const { presence } = await msgJson<{ ok: boolean; presence: Array<Record<string, unknown>> }>(r, "list presence");
  return presence;
}

export async function msgUpsertPresence(status: "online" | "away" | "dnd" | "offline", device?: string | null) {
  const r = await msgFetch("/api/messenger/presence", {
    method: "PUT",
    body: JSON.stringify({ status, device }),
  });
  return msgJson<{ ok: boolean }>(r, "upsert presence");
}

// ── Realtime stream (SSE) ────────────────────────────────────────────────

export type MsgStreamEvent =
  | { type: "ready"; userExternalId: string }
  | { type: "message"; conversationId: string; messageId: string; senderExternalId: string | null; createdAt: string }
  | { type: "notification"; id: string; notificationType: string; severity: string }
  | { type: "presence"; userExternalId: string; status: string }
  | { type: "error"; message: string };

export interface MsgStreamHandle {
  close: () => void;
}

/**
 * Open a Server-Sent Events stream for live messenger + notification
 * events. EventSource cannot set Authorization headers, so the Supabase
 * access token is passed via the `access_token` query param. Auto-
 * reconnects with exponential backoff on disconnect.
 */
export function msgOpenStream(onEvent: (event: MsgStreamEvent) => void): MsgStreamHandle {
  let es: EventSource | null = null;
  let closed = false;
  let backoffMs = 1000;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const dispatch = (raw: MessageEvent | null, type: MsgStreamEvent["type"]) => {
    if (!raw?.data) return;
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(raw.data) as Record<string, unknown>; }
    catch { return; }
    switch (type) {
      case "ready":
        onEvent({ type: "ready", userExternalId: String(parsed.userExternalId ?? "") });
        return;
      case "message":
        onEvent({
          type: "message",
          conversationId: String(parsed.conversationId ?? ""),
          messageId: String(parsed.messageId ?? ""),
          senderExternalId: parsed.senderExternalId == null ? null : String(parsed.senderExternalId),
          createdAt: String(parsed.createdAt ?? new Date().toISOString()),
        });
        return;
      case "notification":
        onEvent({
          type: "notification",
          id: String(parsed.id ?? ""),
          notificationType: String(parsed.type ?? ""),
          severity: String(parsed.severity ?? "normal"),
        });
        return;
      case "presence":
        onEvent({
          type: "presence",
          userExternalId: String(parsed.userExternalId ?? ""),
          status: String(parsed.status ?? "offline"),
        });
        return;
      case "error":
        onEvent({ type: "error", message: String(parsed.message ?? "stream error") });
    }
  };

  const connect = async () => {
    if (closed) return;
    let token: string | null = null;
    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token ?? null;
    } catch { /* ignore */ }
    if (!token) {
      reconnectTimer = setTimeout(connect, Math.min(backoffMs, 30_000));
      backoffMs = Math.min(backoffMs * 2, 30_000);
      return;
    }
    try {
      es = new EventSource(`/api/messenger/stream?access_token=${encodeURIComponent(token)}`);
    } catch {
      reconnectTimer = setTimeout(connect, Math.min(backoffMs, 30_000));
      backoffMs = Math.min(backoffMs * 2, 30_000);
      return;
    }
    es.addEventListener("ready", (e) => { backoffMs = 1000; dispatch(e as MessageEvent, "ready"); });
    es.addEventListener("message", (e) => dispatch(e as MessageEvent, "message"));
    es.addEventListener("notification", (e) => dispatch(e as MessageEvent, "notification"));
    es.addEventListener("presence", (e) => dispatch(e as MessageEvent, "presence"));
    es.addEventListener("error", (e) => dispatch(e as MessageEvent, "error"));
    es.onerror = () => {
      try { es?.close(); } catch { /* ignore */ }
      es = null;
      if (closed) return;
      reconnectTimer = setTimeout(connect, Math.min(backoffMs, 30_000));
      backoffMs = Math.min(backoffMs * 2, 30_000);
    };
  };

  void connect();

  return {
    close: () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { es?.close(); } catch { /* ignore */ }
      es = null;
    },
  };
}
