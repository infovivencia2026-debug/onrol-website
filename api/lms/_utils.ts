// Shared helpers for LMS proxy handlers: JWT auth + role check.
//
// The CRM is the source of truth for role assignment (office_users.role).
// We do a single GET to /api/tm/office-users?userExternalId=X then cache
// the result in-memory per cold start; admin/mentor lookups are rare.

const ROLE_CACHE = new Map<string, { role: string; expiresAt: number }>();
const ROLE_TTL_MS = 60_000;

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

export async function getOfficeRole(userExternalId: string): Promise<string | null> {
  const cached = ROLE_CACHE.get(userExternalId);
  if (cached && cached.expiresAt > Date.now()) return cached.role;
  const cfg = getCrmBase();
  if (!cfg) return null;
  try {
    const r = await fetch(`${cfg.base}/api/tm/office-users?userExternalId=${encodeURIComponent(userExternalId)}`, {
      headers: { authorization: `Bearer ${cfg.secret}` },
    });
    if (!r.ok) return null;
    const body = await r.json() as { ok: boolean; user?: { role?: string } };
    const role = String(body?.user?.role ?? "").toLowerCase() || null;
    if (role) ROLE_CACHE.set(userExternalId, { role, expiresAt: Date.now() + ROLE_TTL_MS });
    return role;
  } catch {
    return null;
  }
}

export function isAdmin(role: string | null): boolean {
  return role === "admin";
}

export function isMentorOrAdmin(role: string | null): boolean {
  return role === "admin" || role === "mentor";
}
