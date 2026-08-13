// Shared CRM client for the onrol.in Task Manager proxy handlers. All
// /api/tm/* server routes verify the Supabase JWT (via getAuthUserId)
// then call these functions to forward to the CRM with the shared
// service token.

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

// ── Tasks ────────────────────────────────────────────────────────────────

export async function crmListTasks(query: { assignedTo?: string; status?: string; institutionId?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (query.assignedTo) params.set("assignedTo", query.assignedTo);
  if (query.status) params.set("status", query.status);
  if (query.institutionId) params.set("institutionId", query.institutionId);
  if (query.limit) params.set("limit", String(query.limit));
  const r = await crmRequest(`/api/tm/tasks?${params.toString()}`, { method: "GET" });
  const { tasks } = await unwrap<{ ok: boolean; tasks: Array<Record<string, unknown>> }>(r, "/api/tm/tasks");
  return tasks;
}

export async function crmCreateTask(payload: Record<string, unknown>) {
  const r = await crmRequest("/api/tm/tasks", { method: "POST", body: JSON.stringify(payload) });
  const { task } = await unwrap<{ ok: boolean; task: Record<string, unknown> }>(r, "/api/tm/tasks");
  return task;
}

export async function crmUpdateTask(id: string, patch: Record<string, unknown>) {
  const r = await crmRequest(`/api/tm/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  const { task } = await unwrap<{ ok: boolean; task: Record<string, unknown> }>(r, "/api/tm/tasks/[id]");
  return task;
}

export async function crmDeleteTask(id: string) {
  const r = await crmRequest(`/api/tm/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
  return unwrap<{ ok: boolean }>(r, "/api/tm/tasks/[id]");
}

// ── Office users ─────────────────────────────────────────────────────────

export async function crmListOfficeUsers(opts: { activeOnly?: boolean } = {}) {
  const params = new URLSearchParams();
  if (opts.activeOnly) params.set("activeOnly", "1");
  const r = await crmRequest(`/api/tm/office-users?${params.toString()}`, { method: "GET" });
  const { users } = await unwrap<{ ok: boolean; users: Array<Record<string, unknown>> }>(r, "/api/tm/office-users");
  return users;
}

export async function crmGetOfficeUserByEmail(email: string) {
  const r = await crmRequest(`/api/tm/office-users?email=${encodeURIComponent(email)}`, { method: "GET" });
  if (r.status === 404) return null;
  const { user } = await unwrap<{ ok: boolean; user: Record<string, unknown> }>(r, "/api/tm/office-users by email");
  return user;
}

export async function crmUpsertOfficeUser(input: {
  userExternalId?: string;
  fullName?: string;
  email: string;
  phone?: string;
  role?: string;
  department?: string;
  isActive?: boolean;
  bio?: string | null;
  statusMessage?: string | null;
  linkedin?: string | null;
  avatarUrl?: string | null;
}) {
  const r = await crmRequest("/api/tm/office-users", { method: "PUT", body: JSON.stringify(input) });
  const { user } = await unwrap<{ ok: boolean; user: Record<string, unknown> }>(r, "/api/tm/office-users");
  return user;
}

// ── Office user invites ─────────────────────────────────────────────────

export async function crmListInvites(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const r = await crmRequest(`/api/tm/invites?${params.toString()}`, { method: "GET" });
  const { invites } = await unwrap<{ ok: boolean; invites: Array<Record<string, unknown>> }>(r, "/api/tm/invites");
  return invites;
}

export async function crmCreateInvite(input: { email: string; fullName?: string | null; department?: string | null; role?: string; invitedBy?: string | null }) {
  const r = await crmRequest("/api/tm/invites", { method: "POST", body: JSON.stringify(input) });
  const { invite } = await unwrap<{ ok: boolean; invite: Record<string, unknown> }>(r, "/api/tm/invites");
  return invite;
}

export async function crmUpdateInviteStatus(id: string, status: "pending" | "accepted" | "revoked") {
  const r = await crmRequest("/api/tm/invites", { method: "PATCH", body: JSON.stringify({ id, status }) });
  const { invite } = await unwrap<{ ok: boolean; invite: Record<string, unknown> }>(r, "/api/tm/invites");
  return invite;
}

// ── Task status audit + institution handlers ─────────────────────────────

export async function crmListTaskAudit(opts: { taskId?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.taskId) params.set("taskId", opts.taskId);
  if (opts.limit) params.set("limit", String(opts.limit));
  const r = await crmRequest(`/api/tm/task-audit?${params.toString()}`, { method: "GET" });
  const { audit } = await unwrap<{ ok: boolean; audit: Array<Record<string, unknown>> }>(r, "/api/tm/task-audit");
  return audit;
}

export async function crmListActivityEvents(opts: { actorUserId?: string; targetUserId?: string; visitTaskId?: string; eventType?: string; since?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(opts)) if (v != null) params.set(k, String(v));
  const r = await crmRequest(`/api/tm/activity-events?${params.toString()}`, { method: "GET" });
  const { events } = await unwrap<{ ok: boolean; events: Array<Record<string, unknown>> }>(r, "/api/tm/activity-events");
  return events;
}

export async function crmListInstitutionHandlers(institutionIds: string[]) {
  const r = await crmRequest("/api/tm/institution-handlers", { method: "POST", body: JSON.stringify({ institutionIds }) });
  const { handlers } = await unwrap<{ ok: boolean; handlers: Array<Record<string, unknown>> }>(r, "/api/tm/institution-handlers");
  return handlers;
}

// ── Institutions ─────────────────────────────────────────────────────────

export async function crmListInstitutions(limit = 500) {
  const r = await crmRequest(`/api/tm/institutions?limit=${limit}`, { method: "GET" });
  const { institutions } = await unwrap<{ ok: boolean; institutions: Array<Record<string, unknown>> }>(r, "/api/tm/institutions");
  return institutions;
}

export async function crmCreateInstitution(payload: Record<string, unknown>) {
  const r = await crmRequest("/api/tm/institutions", { method: "POST", body: JSON.stringify(payload) });
  const { institution } = await unwrap<{ ok: boolean; institution: Record<string, unknown> }>(r, "/api/tm/institutions");
  return institution;
}

export async function crmBulkUpsertInstitutions(rows: Array<Record<string, unknown>>) {
  const r = await crmRequest("/api/tm/institutions", {
    method: "POST",
    body: JSON.stringify({ action: "bulkUpsert", rows }),
  });
  return unwrap<{ ok: boolean; inserted: number }>(r, "/api/tm/institutions");
}

export async function crmUpdateInstitution(id: string, patch: Record<string, unknown>) {
  const r = await crmRequest("/api/tm/institutions", {
    method: "PATCH",
    body: JSON.stringify({ id, patch }),
  });
  const { institution } = await unwrap<{ ok: boolean; institution: Record<string, unknown> }>(r, "/api/tm/institutions PATCH");
  return institution;
}

// ── Activity events ──────────────────────────────────────────────────────

export async function crmInsertActivityEvent(input: {
  actorUserId?: string | null;
  targetUserId?: string | null;
  institutionId?: string | null;
  visitTaskId?: string | null;
  eventType: string;
  eventSummary?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const r = await crmRequest("/api/tm/activity-events", { method: "POST", body: JSON.stringify(input) });
  return unwrap<{ ok: boolean; id: string | null }>(r, "/api/tm/activity-events");
}

// ── Notification preferences ─────────────────────────────────────────────

export async function crmGetNotificationPrefs(userExternalId: string) {
  const r = await crmRequest(
    `/api/tm/notification-preferences?userExternalId=${encodeURIComponent(userExternalId)}`,
    { method: "GET" },
  );
  const { prefs } = await unwrap<{ ok: boolean; prefs: Record<string, unknown> | null }>(r, "/api/tm/notification-preferences");
  return prefs;
}

export async function crmUpsertNotificationPrefs(userExternalId: string, patch: Record<string, unknown>) {
  const r = await crmRequest("/api/tm/notification-preferences", {
    method: "PUT",
    body: JSON.stringify({ userExternalId, ...patch }),
  });
  const { prefs } = await unwrap<{ ok: boolean; prefs: Record<string, unknown> }>(r, "/api/tm/notification-preferences");
  return prefs;
}
