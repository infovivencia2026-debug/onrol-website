// Thin client for the CRM's /api/meetings/* endpoints. Mirrors the
// patterns already in api/push/_crm.ts. The onrol.in server handlers
// (create.ts, list.ts, join.ts, leave.ts) validate the Supabase JWT
// locally then call these functions to forward to the CRM.
//
// Required env:
//   CRM_EVENT_URL      — e.g. https://crm.onrol.in/api/event
//   ONROL_EVENT_SECRET — shared service token

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

async function crmFetch(path: string, init: RequestInit): Promise<Response> {
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

async function unwrap<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    const err = new Error(`CRM error ${r.status}: ${detail.slice(0, 200)}`);
    (err as Error & { status?: number }).status = r.status;
    throw err;
  }
  return r.json() as Promise<T>;
}

// ── Meeting CRUD ─────────────────────────────────────────────────────────

export async function crmCreateMeeting(input: {
  hostExternalId: string;
  title: string;
  description?: string;
  meetingType: "instant" | "scheduled";
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  maxParticipants?: number;
}) {
  const r = await crmFetch("/api/meetings", { method: "POST", body: JSON.stringify(input) });
  const { meeting } = await unwrap<{ ok: boolean; meeting: Record<string, unknown> }>(r);
  return meeting;
}

export async function crmListMeetingsForUser(userExternalId: string, includePublicOngoing = false) {
  const params = new URLSearchParams({ userExternalId });
  if (includePublicOngoing) params.set("includePublicOngoing", "1");
  const r = await crmFetch(`/api/meetings?${params.toString()}`, { method: "GET" });
  const { meetings } = await unwrap<{ ok: boolean; meetings: Array<Record<string, unknown>> }>(r);
  return meetings;
}

export async function crmListMeetingsAndInvitesForUser(userExternalId: string, includePublicOngoing = false) {
  const params = new URLSearchParams({ userExternalId, includeInvites: "1" });
  if (includePublicOngoing) params.set("includePublicOngoing", "1");
  const r = await crmFetch(`/api/meetings?${params.toString()}`, { method: "GET" });
  return unwrap<{ ok: boolean; meetings: Array<Record<string, unknown>>; invites: Array<Record<string, unknown>> }>(r);
}

export async function crmGetMeeting(id: string) {
  const r = await crmFetch(`/api/meetings/${encodeURIComponent(id)}`, { method: "GET" });
  if (r.status === 404) return null;
  const { meeting } = await unwrap<{ ok: boolean; meeting: Record<string, unknown> }>(r);
  return meeting;
}

export async function crmGetMeetingByCode(code: string) {
  const r = await crmFetch(`/api/meetings?code=${encodeURIComponent(code)}`, { method: "GET" });
  if (r.status === 404) return null;
  const { meeting } = await unwrap<{ ok: boolean; meeting: Record<string, unknown> }>(r);
  return meeting;
}

export async function crmEndMeeting(id: string) {
  const r = await crmFetch(`/api/meetings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "end" }),
  });
  return unwrap<{ ok: boolean; meeting: Record<string, unknown> }>(r);
}

// ── Participants ─────────────────────────────────────────────────────────

export async function crmJoinMeeting(id: string, userExternalId: string, isPresenter = false) {
  const r = await crmFetch(`/api/meetings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "join", userExternalId, isPresenter }),
  });
  return unwrap<{ ok: boolean }>(r);
}

export async function crmLeaveMeeting(id: string, userExternalId: string) {
  const r = await crmFetch(`/api/meetings/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "leave", userExternalId }),
  });
  return unwrap<{ ok: boolean }>(r);
}

export async function crmListParticipants(id: string) {
  const r = await crmFetch(`/api/meetings/${encodeURIComponent(id)}?include=participants`, { method: "GET" });
  const { participants } = await unwrap<{ ok: boolean; participants: Array<Record<string, unknown>> }>(r);
  return participants;
}

// ── Invites ──────────────────────────────────────────────────────────────

export async function crmBulkCreateInvites(
  meetingId: string,
  invites: Array<{
    invitedUserId?: string | null;
    invitedEmail?: string | null;
    invitedUserName?: string | null;
    invitedBy?: string | null;
  }>,
) {
  const r = await crmFetch(`/api/meetings/${encodeURIComponent(meetingId)}/invites`, {
    method: "POST",
    body: JSON.stringify({ invites }),
  });
  return unwrap<{ ok: boolean; count: number }>(r);
}
