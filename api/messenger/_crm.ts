// Shared CRM client for the onrol.in Messenger proxy handlers.
//
// Realtime: see /api/messenger/stream (proxied to the CRM's SSE
// endpoint backed by Postgres LISTEN/NOTIFY).

function getCrmBase(): { base: string; secret: string } | null {
  const url = process.env.CRM_EVENT_URL;
  const secret = process.env.ONROL_EVENT_SECRET;
  if (!url || !secret) return null;
  try {
    const u = new URL(url);
    return { base: `${u.protocol}//${u.host}`, secret };
  } catch {
    return null;
  }
}

async function crmRequest(path: string, init: RequestInit): Promise<Response> {
  const cfg = getCrmBase();
  if (!cfg) throw new Error("CRM_EVENT_URL / ONROL_EVENT_SECRET not configured.");
  return fetch(`${cfg.base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.secret}`,
      ...(init.headers ?? {}),
    },
  });
}

async function unwrap<T>(r: Response, path: string): Promise<T> {
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    const err = new Error(`CRM ${path} failed (${r.status}): ${detail.slice(0, 200)}`);
    (err as Error & { status?: number }).status = r.status;
    throw err;
  }
  return r.json() as Promise<T>;
}

// ── Notifications ────────────────────────────────────────────────────────

export async function crmListNotifications(userExternalId: string, opts: { unreadOnly?: boolean; severity?: string; limit?: number } = {}) {
  const params = new URLSearchParams({ userExternalId });
  if (opts.unreadOnly) params.set("unreadOnly", "1");
  if (opts.severity) params.set("severity", opts.severity);
  if (opts.limit) params.set("limit", String(opts.limit));
  const r = await crmRequest(`/api/messenger/notifications?${params.toString()}`, { method: "GET" });
  const { notifications } = await unwrap<{ ok: boolean; notifications: Array<Record<string, unknown>> }>(r, "/api/messenger/notifications");
  return notifications;
}

export async function crmInsertNotification(input: Record<string, unknown>) {
  const r = await crmRequest("/api/messenger/notifications", { method: "POST", body: JSON.stringify(input) });
  return unwrap<{ ok: boolean; id: string | null }>(r, "/api/messenger/notifications");
}

export async function crmBulkInsertNotifications(rows: Array<Record<string, unknown>>) {
  const r = await crmRequest("/api/messenger/notifications", {
    method: "POST",
    body: JSON.stringify({ action: "bulkInsert", rows }),
  });
  return unwrap<{ ok: boolean; inserted: number }>(r, "/api/messenger/notifications");
}

export async function crmMarkNotificationsRead(userExternalId: string, ids: string[]) {
  const r = await crmRequest("/api/messenger/notifications", {
    method: "POST",
    body: JSON.stringify({ action: "markRead", userExternalId, ids }),
  });
  return unwrap<{ ok: boolean; count: number }>(r, "/api/messenger/notifications");
}

export async function crmMarkAllNotificationsRead(userExternalId: string) {
  const r = await crmRequest("/api/messenger/notifications", {
    method: "POST",
    body: JSON.stringify({ action: "markAllRead", userExternalId }),
  });
  return unwrap<{ ok: boolean; count: number }>(r, "/api/messenger/notifications");
}

export async function crmDeleteAllNotificationsForUser(userExternalId: string) {
  const r = await crmRequest("/api/messenger/notifications", {
    method: "POST",
    body: JSON.stringify({ action: "deleteAllForUser", userExternalId }),
  });
  return unwrap<{ ok: boolean; count: number }>(r, "/api/messenger/notifications");
}

// ── Conversations ────────────────────────────────────────────────────────

export async function crmListConversations(userExternalId: string, opts: { hydrate?: boolean } = {}) {
  const params = new URLSearchParams({ userExternalId });
  if (opts.hydrate) params.set("hydrate", "1");
  const r = await crmRequest(`/api/messenger/conversations?${params.toString()}`, { method: "GET" });
  return unwrap<{
    ok: boolean;
    conversations: Array<Record<string, unknown>>;
    members?: Array<Record<string, unknown>>;
    messages?: Array<Record<string, unknown>>;
    messagePins?: Array<{ conversation_id: string; message_id: string }>;
    announcementAcks?: Array<Record<string, unknown>>;
    pinnedConversationIds?: string[];
  }>(r, "/api/messenger/conversations");
}

export async function crmCreateConversation(input: { kind?: string; title?: string | null; createdBy?: string | null; settings?: Record<string, unknown> }) {
  const r = await crmRequest("/api/messenger/conversations", { method: "POST", body: JSON.stringify(input) });
  const { conversation } = await unwrap<{ ok: boolean; conversation: Record<string, unknown> }>(r, "/api/messenger/conversations");
  return conversation;
}

export async function crmRemoveUserFromAllConversations(userExternalId: string) {
  const r = await crmRequest(
    `/api/messenger/conversations?action=removeUserFromAll&userExternalId=${encodeURIComponent(userExternalId)}`,
    { method: "DELETE" },
  );
  return unwrap<{ ok: boolean; count: number }>(r, "/api/messenger/conversations DELETE");
}

export async function crmGetOrCreateDirect(userA: string, userB: string) {
  const r = await crmRequest("/api/messenger/conversations", {
    method: "POST",
    body: JSON.stringify({ action: "direct", userA, userB }),
  });
  const { conversationId } = await unwrap<{ ok: boolean; conversationId: string }>(r, "/api/messenger/conversations");
  return conversationId;
}

export async function crmCreateGroup(input: {
  title: string;
  description?: string | null;
  createdBy: string;
  memberIds: string[];
  settings?: Record<string, unknown>;
  kind?: "group" | "announcement";
}) {
  const r = await crmRequest("/api/messenger/conversations", {
    method: "POST",
    body: JSON.stringify({
      action: input.kind === "announcement" ? "announcement" : "group",
      title: input.title,
      description: input.description ?? null,
      createdBy: input.createdBy,
      memberIds: input.memberIds,
      settings: input.settings,
    }),
  });
  const { conversationId } = await unwrap<{ ok: boolean; conversationId: string }>(r, "/api/messenger/conversations");
  return conversationId;
}

export async function crmUpdateConversationSettings(id: string, settings: Record<string, unknown>) {
  const r = await crmRequest(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "settings", settings }),
  });
  return unwrap<{ ok: boolean; conversation: Record<string, unknown> }>(r, "/api/messenger/conversations/[id]");
}

export async function crmSetConversationArchived(id: string, archived: boolean) {
  const r = await crmRequest(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "archive", archived }),
  });
  return unwrap<{ ok: boolean }>(r, "/api/messenger/conversations/[id]");
}

export async function crmDeleteConversation(id: string) {
  const r = await crmRequest(`/api/messenger/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
  return unwrap<{ ok: boolean }>(r, "/api/messenger/conversations/[id]");
}

export async function crmUpsertMembers(id: string, members: Array<{ userExternalId: string; role?: string }>) {
  const r = await crmRequest(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "addMembers", members }),
  });
  return unwrap<{ ok: boolean; count: number }>(r, "/api/messenger/conversations/[id]");
}

export async function crmRemoveMember(id: string, userExternalId: string) {
  const r = await crmRequest(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "removeMember", userExternalId }),
  });
  return unwrap<{ ok: boolean }>(r, "/api/messenger/conversations/[id]");
}

export async function crmMarkRead(id: string, userExternalId: string, lastReadMessageId?: string | null) {
  const r = await crmRequest(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "markRead", userExternalId, lastReadMessageId: lastReadMessageId ?? null }),
  });
  return unwrap<{ ok: boolean }>(r, "/api/messenger/conversations/[id]");
}

export async function crmSetMemberMuted(id: string, userExternalId: string, muted: boolean) {
  const r = await crmRequest(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "mute", userExternalId, muted }),
  });
  return unwrap<{ ok: boolean }>(r, "/api/messenger/conversations/[id]");
}

export async function crmSetMemberHidden(id: string, userExternalId: string, hidden: boolean) {
  const r = await crmRequest(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "hide", userExternalId, hidden }),
  });
  return unwrap<{ ok: boolean }>(r, "/api/messenger/conversations/[id]");
}

export async function crmSetConversationPin(id: string, userExternalId: string, pinned: boolean) {
  const r = await crmRequest(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "pin", userExternalId, pinned }),
  });
  return unwrap<{ ok: boolean }>(r, "/api/messenger/conversations/[id]");
}

export async function crmAckAnnouncement(id: string, userExternalId: string, status: "seen" | "understood", messageId?: string) {
  const r = await crmRequest(`/api/messenger/conversations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "ack", userExternalId, status, messageId }),
  });
  return unwrap<{ ok: boolean; messageId?: string | null }>(r, "/api/messenger/conversations/[id]");
}

// ── Messages ─────────────────────────────────────────────────────────────

export async function crmListMessages(conversationId: string, opts: { limit?: number; before?: string } = {}) {
  const params = new URLSearchParams({ conversationId });
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.before) params.set("before", opts.before);
  const r = await crmRequest(`/api/messenger/messages?${params.toString()}`, { method: "GET" });
  const { messages } = await unwrap<{ ok: boolean; messages: Array<Record<string, unknown>> }>(r, "/api/messenger/messages");
  return messages;
}

export async function crmInsertMessage(input: {
  conversationId: string;
  senderExternalId?: string | null;
  body: string;
  attachments?: unknown[];
  metadata?: Record<string, unknown> | null;
  messageType?: string;
  replyToMessageId?: string | null;
  linkedEntityType?: string | null;
  linkedEntityId?: string | null;
}) {
  const r = await crmRequest("/api/messenger/messages", { method: "POST", body: JSON.stringify(input) });
  const { message } = await unwrap<{ ok: boolean; message: Record<string, unknown> }>(r, "/api/messenger/messages");
  return message;
}

export async function crmEditMessage(messageId: string, body: string) {
  const r = await crmRequest("/api/messenger/messages", {
    method: "POST",
    body: JSON.stringify({ action: "edit", messageId, body }),
  });
  return unwrap<{ ok: boolean; message: Record<string, unknown> }>(r, "/api/messenger/messages");
}

export async function crmSoftDeleteMessage(messageId: string, newBody?: string) {
  const r = await crmRequest("/api/messenger/messages", {
    method: "POST",
    body: JSON.stringify({ action: "softDelete", messageId, newBody }),
  });
  return unwrap<{ ok: boolean }>(r, "/api/messenger/messages");
}

export async function crmModerateDeleteMessage(messageId: string, moderatedBy: string, newBody?: string) {
  const r = await crmRequest("/api/messenger/messages", {
    method: "POST",
    body: JSON.stringify({ action: "moderateDelete", messageId, moderatedBy, newBody }),
  });
  return unwrap<{ ok: boolean }>(r, "/api/messenger/messages");
}

export async function crmPinMessage(conversationId: string, messageId: string, pinnedBy?: string | null) {
  const r = await crmRequest("/api/messenger/messages", {
    method: "POST",
    body: JSON.stringify({ action: "pin", conversationId, messageId, pinnedBy }),
  });
  return unwrap<{ ok: boolean; pin: Record<string, unknown> | null }>(r, "/api/messenger/messages");
}

export async function crmUnpinMessage(conversationId: string, messageId: string) {
  const r = await crmRequest("/api/messenger/messages", {
    method: "POST",
    body: JSON.stringify({ action: "unpin", conversationId, messageId }),
  });
  return unwrap<{ ok: boolean }>(r, "/api/messenger/messages");
}

// ── Messenger settings ───────────────────────────────────────────────────

export async function crmGetMessengerSettings(userExternalId: string) {
  const r = await crmRequest(`/api/messenger/settings?userExternalId=${encodeURIComponent(userExternalId)}`, { method: "GET" });
  const { settings } = await unwrap<{ ok: boolean; settings: Record<string, unknown> | null }>(r, "/api/messenger/settings");
  return settings;
}

export async function crmUpsertMessengerSettings(userExternalId: string, settings: Record<string, unknown>) {
  const r = await crmRequest("/api/messenger/settings", {
    method: "PUT",
    body: JSON.stringify({ userExternalId, settings }),
  });
  const { settings: out } = await unwrap<{ ok: boolean; settings: Record<string, unknown> }>(r, "/api/messenger/settings");
  return out;
}

// ── Presence ─────────────────────────────────────────────────────────────

export async function crmListPresence(users?: string[]) {
  const params = new URLSearchParams();
  if (users && users.length) params.set("users", users.join(","));
  const r = await crmRequest(`/api/messenger/presence?${params.toString()}`, { method: "GET" });
  const { presence } = await unwrap<{ ok: boolean; presence: Array<Record<string, unknown>> }>(r, "/api/messenger/presence");
  return presence;
}

export async function crmUpsertPresence(userExternalId: string, status: string, device?: string | null) {
  const r = await crmRequest("/api/messenger/presence", {
    method: "PUT",
    body: JSON.stringify({ userExternalId, status, device }),
  });
  return unwrap<{ ok: boolean }>(r, "/api/messenger/presence");
}
