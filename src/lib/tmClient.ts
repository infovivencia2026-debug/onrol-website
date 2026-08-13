// Browser-side client for the Task Manager API (onrol.in /api/tm/*).
//
// Auth: every call attaches the Supabase JWT (which the onrol.in server
// validates before forwarding to the CRM). The hooks in
// src/hooks/taskManager/* call these functions instead of
// supabase.from("office_tasks") etc.

import { supabase } from "@/lib/supabase";

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const t = data.session?.access_token;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function tmFetch(path: string, init: RequestInit = {}): Promise<Response> {
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

async function tmJson<T>(r: Response, label: string): Promise<T> {
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

// ── Tasks ────────────────────────────────────────────────────────────────

export interface TmTaskQuery {
  assignedTo?: string;
  status?: string;
  institutionId?: string;
  limit?: number;
}

export async function tmListTasks(query: TmTaskQuery = {}): Promise<Array<Record<string, unknown>>> {
  const params = new URLSearchParams();
  if (query.assignedTo) params.set("assignedTo", query.assignedTo);
  if (query.status) params.set("status", query.status);
  if (query.institutionId) params.set("institutionId", query.institutionId);
  if (query.limit) params.set("limit", String(query.limit));
  const r = await tmFetch(`/api/tm/tasks?${params.toString()}`);
  const { tasks } = await tmJson<{ ok: boolean; tasks: Array<Record<string, unknown>> }>(r, "list tasks");
  return tasks;
}

export async function tmCreateTask(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const r = await tmFetch("/api/tm/tasks", { method: "POST", body: JSON.stringify(payload) });
  const { task } = await tmJson<{ ok: boolean; task: Record<string, unknown> }>(r, "create task");
  return task;
}

export async function tmUpdateTask(id: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
  const r = await tmFetch(`/api/tm/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  const { task } = await tmJson<{ ok: boolean; task: Record<string, unknown> }>(r, "update task");
  return task;
}

export async function tmDeleteTask(id: string): Promise<void> {
  const r = await tmFetch(`/api/tm/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
  await tmJson(r, "delete task");
}

// ── Office users ─────────────────────────────────────────────────────────

export async function tmListOfficeUsers(activeOnly = false): Promise<Array<Record<string, unknown>>> {
  const params = new URLSearchParams();
  if (activeOnly) params.set("activeOnly", "1");
  const r = await tmFetch(`/api/tm/office-users?${params.toString()}`);
  const { users } = await tmJson<{ ok: boolean; users: Array<Record<string, unknown>> }>(r, "list office-users");
  return users;
}

export async function tmGetOfficeUserByEmail(email: string): Promise<Record<string, unknown> | null> {
  const r = await tmFetch(`/api/tm/office-users?email=${encodeURIComponent(email)}`);
  if (r.status === 404) return null;
  const { user } = await tmJson<{ ok: boolean; user: Record<string, unknown> | null }>(r, "get office-user by email");
  return user;
}

export async function tmUpsertOfficeUser(input: {
  email: string;
  userExternalId?: string;
  fullName?: string;
  phone?: string;
  role?: string;
  department?: string;
  isActive?: boolean;
  bio?: string | null;
  statusMessage?: string | null;
  linkedin?: string | null;
  avatarUrl?: string | null;
}): Promise<Record<string, unknown>> {
  const r = await tmFetch("/api/tm/office-users", { method: "PUT", body: JSON.stringify(input) });
  const { user } = await tmJson<{ ok: boolean; user: Record<string, unknown> }>(r, "upsert office-user");
  return user;
}

// ── Invites ──────────────────────────────────────────────────────────────

export async function tmListInvites(status?: string): Promise<Array<Record<string, unknown>>> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const r = await tmFetch(`/api/tm/invites?${params.toString()}`);
  const { invites } = await tmJson<{ ok: boolean; invites: Array<Record<string, unknown>> }>(r, "list invites");
  return invites;
}

export async function tmCreateInvite(input: { email: string; fullName?: string | null; department?: string | null; role?: string }): Promise<Record<string, unknown>> {
  const r = await tmFetch("/api/tm/invites", { method: "POST", body: JSON.stringify(input) });
  const { invite } = await tmJson<{ ok: boolean; invite: Record<string, unknown> }>(r, "create invite");
  return invite;
}

export async function tmUpdateInviteStatus(id: string, status: "pending" | "accepted" | "revoked"): Promise<void> {
  const r = await tmFetch("/api/tm/invites", { method: "PATCH", body: JSON.stringify({ id, status }) });
  await tmJson(r, "update invite");
}

// ── Task status audit ────────────────────────────────────────────────────

export async function tmListTaskAudit(opts: { taskId?: string; limit?: number } = {}): Promise<Array<Record<string, unknown>>> {
  const params = new URLSearchParams();
  if (opts.taskId) params.set("taskId", opts.taskId);
  if (opts.limit) params.set("limit", String(opts.limit));
  const r = await tmFetch(`/api/tm/task-audit?${params.toString()}`);
  const { audit } = await tmJson<{ ok: boolean; audit: Array<Record<string, unknown>> }>(r, "list task-audit");
  return audit;
}

// ── Activity events listing ──────────────────────────────────────────────

export async function tmListActivityEvents(opts: { actorUserId?: string; targetUserId?: string; visitTaskId?: string; eventType?: string; since?: string; limit?: number } = {}): Promise<Array<Record<string, unknown>>> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(opts)) if (v != null) params.set(k, String(v));
  const r = await tmFetch(`/api/tm/activity-events?${params.toString()}`);
  const { events } = await tmJson<{ ok: boolean; events: Array<Record<string, unknown>> }>(r, "list activity-events");
  return events;
}

// ── Institution active-handlers (legacy RPC replacement) ─────────────────

export async function tmListInstitutionHandlers(institutionIds: string[]): Promise<Array<Record<string, unknown>>> {
  const r = await tmFetch("/api/tm/institution-handlers", { method: "POST", body: JSON.stringify({ institutionIds }) });
  const { handlers } = await tmJson<{ ok: boolean; handlers: Array<Record<string, unknown>> }>(r, "institution-handlers");
  return handlers;
}

// ── Institutions ─────────────────────────────────────────────────────────

export async function tmListInstitutions(limit = 500): Promise<Array<Record<string, unknown>>> {
  const r = await tmFetch(`/api/tm/institutions?limit=${limit}`);
  const { institutions } = await tmJson<{ ok: boolean; institutions: Array<Record<string, unknown>> }>(r, "list institutions");
  return institutions;
}

export async function tmCreateInstitution(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const r = await tmFetch("/api/tm/institutions", { method: "POST", body: JSON.stringify(payload) });
  const { institution } = await tmJson<{ ok: boolean; institution: Record<string, unknown> }>(r, "create institution");
  return institution;
}

export async function tmBulkUpsertInstitutions(rows: Array<Record<string, unknown>>): Promise<number> {
  const r = await tmFetch("/api/tm/institutions", {
    method: "POST",
    body: JSON.stringify({ action: "bulkUpsert", rows }),
  });
  const out = await tmJson<{ ok: boolean; inserted: number }>(r, "bulk upsert institutions");
  return out.inserted;
}

export async function tmUpdateInstitution(id: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
  const r = await tmFetch("/api/tm/institutions", {
    method: "PATCH",
    body: JSON.stringify({ id, patch }),
  });
  const { institution } = await tmJson<{ ok: boolean; institution: Record<string, unknown> }>(r, "update institution");
  return institution;
}

// ── Activity events ──────────────────────────────────────────────────────

export interface TmActivityEvent {
  actorUserId?: string | null;
  targetUserId?: string | null;
  institutionId?: string | null;
  visitTaskId?: string | null;
  eventType: string;
  eventSummary?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function tmInsertActivityEvent(input: TmActivityEvent): Promise<string | null> {
  const r = await tmFetch("/api/tm/activity-events", { method: "POST", body: JSON.stringify(input) });
  const { id } = await tmJson<{ ok: boolean; id: string | null }>(r, "insert activity-event");
  return id;
}

// ── Notification preferences ─────────────────────────────────────────────

export async function tmGetNotificationPrefs(): Promise<Record<string, unknown> | null> {
  const r = await tmFetch("/api/tm/notification-preferences");
  const { prefs } = await tmJson<{ ok: boolean; prefs: Record<string, unknown> | null }>(r, "get notification prefs");
  return prefs;
}

export async function tmUpsertNotificationPrefs(patch: Record<string, unknown>): Promise<Record<string, unknown>> {
  const r = await tmFetch("/api/tm/notification-preferences", {
    method: "PUT",
    body: JSON.stringify(patch),
  });
  const { prefs } = await tmJson<{ ok: boolean; prefs: Record<string, unknown> }>(r, "upsert notification prefs");
  return prefs;
}
