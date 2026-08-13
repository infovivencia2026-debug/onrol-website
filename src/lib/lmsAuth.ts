// Native LMS auth (replaces the previous Supabase Auth integration).
//
// Token + minimal user record live in localStorage so the SPA can
// short-circuit /api/lms/auth/me on subsequent visits. The token is an
// HS256 JWT minted by the CRM at /api/lms/auth/login. The CRM verifies
// it on every API call against AUTH_SECRET.

const STORAGE_KEY = "onrol.lms.session";

export interface LmsUser {
  id: string;
  email: string;
  full_name: string | null;
  last_sign_in_at?: string | null;
}

interface StoredSession {
  token: string;
  user: LmsUser;
}

const CRM_BASE = (import.meta.env.VITE_CRM_BASE as string | undefined) ?? "https://go.onrol.in";

export function getLmsToken(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession | null;
    return parsed?.token ?? null;
  } catch { return null; }
}

export function getLmsUser(): LmsUser | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession | null;
    return parsed?.user ?? null;
  } catch { return null; }
}

export function setLmsSession(input: StoredSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  window.dispatchEvent(new CustomEvent("lms-auth-change", { detail: input.user }));
}

export function clearLmsSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("lms-auth-change", { detail: null }));
}

export async function fetchLmsMe(token: string): Promise<LmsUser | null> {
  try {
    const r = await fetch(`${CRM_BASE}/api/lms/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "omit",
    });
    if (!r.ok) return null;
    const body = await r.json() as { user?: LmsUser };
    return body.user ?? null;
  } catch {
    return null;
  }
}

export async function lmsLogin(input: { email: string; password: string }): Promise<{ user: LmsUser }> {
  const r = await fetch(`${CRM_BASE}/api/lms/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    credentials: "omit",
  });
  const text = await r.text();
  let body: { message?: string; ok?: boolean; token?: string; user?: LmsUser } = {};
  try { body = text ? JSON.parse(text) : {}; } catch { /* leave empty */ }
  if (!r.ok || !body.token || !body.user) {
    throw new Error(body.message || `Sign-in failed (${r.status})`);
  }
  setLmsSession({ token: body.token, user: body.user });
  return { user: body.user };
}

export async function lmsRequestMagicLink(email: string): Promise<void> {
  await fetch(`${CRM_BASE}/api/lms/auth/magic-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "request", email }),
    credentials: "omit",
  });
}

export async function lmsExchangeMagicToken(token: string): Promise<{ user: LmsUser }> {
  const r = await fetch(`${CRM_BASE}/api/lms/auth/magic-link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "exchange", token }),
    credentials: "omit",
  });
  const text = await r.text();
  let body: { message?: string; token?: string; user?: LmsUser } = {};
  try { body = text ? JSON.parse(text) : {}; } catch { /* empty */ }
  if (!r.ok || !body.token || !body.user) {
    throw new Error(body.message || "Link is invalid or has expired.");
  }
  setLmsSession({ token: body.token, user: body.user });
  return { user: body.user };
}

export async function lmsRequestPasswordReset(email: string): Promise<void> {
  await fetch(`${CRM_BASE}/api/lms/auth/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "request", email }),
    credentials: "omit",
  });
}

export async function lmsConfirmPasswordReset(input: { token: string; password: string }): Promise<{ user: LmsUser }> {
  const r = await fetch(`${CRM_BASE}/api/lms/auth/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "confirm", ...input }),
    credentials: "omit",
  });
  const text = await r.text();
  let body: { message?: string; token?: string; user?: LmsUser } = {};
  try { body = text ? JSON.parse(text) : {}; } catch { /* empty */ }
  if (!r.ok || !body.token || !body.user) {
    throw new Error(body.message || "Could not reset password.");
  }
  setLmsSession({ token: body.token, user: body.user });
  return { user: body.user };
}
