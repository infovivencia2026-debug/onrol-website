// Thin client for the CRM's push notification endpoints. Replaces
// the direct Supabase reads/writes the API handlers used to make.
//
// Required env:
//   CRM_EVENT_URL      — e.g. https://crm.onrol.in/api/event (we strip
//                         the trailing path; this is the same value used
//                         by the federation event bus).
//   ONROL_EVENT_SECRET — shared server-to-server bearer secret.

function getCrmBase(): { base: string; secret: string } | null {
  const url = process.env.CRM_EVENT_URL;
  const secret = process.env.ONROL_EVENT_SECRET;
  if (!url || !secret) return null;
  // CRM_EVENT_URL points at /api/event by convention. Strip the path
  // and rebuild — we hit /api/push/* and /api/fcm/* on the same host.
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

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string | null;
  auth: string | null;
  expirationTime: number | null;
}

export async function crmUpsertSubscription(input: {
  userExternalId: string;
  subscription: PushSubscriptionPayload;
  userAgent?: string | null;
}): Promise<void> {
  const r = await crmFetch("/api/push/subscribe", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`CRM /api/push/subscribe failed (${r.status}): ${detail}`);
  }
}

export async function crmDeleteSubscription(endpoint: string): Promise<void> {
  await crmFetch("/api/push/subscribe", {
    method: "DELETE",
    body: JSON.stringify({ endpoint }),
  });
}

export interface CrmSendInput {
  userExternalIds: string[];
  title: string;
  body?: string;
  url?: string;
  icon?: string;
  data?: Record<string, unknown>;
}

export async function crmSendPush(input: CrmSendInput): Promise<{ sent: number; failed: number; expired: number }> {
  const r = await crmFetch("/api/push/send", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`CRM /api/push/send failed (${r.status}): ${detail}`);
  }
  return (await r.json()) as { sent: number; failed: number; expired: number };
}

export async function crmRegisterFcm(input: {
  userExternalId: string;
  token: string;
  platform: "android" | "ios" | "web";
  deviceId?: string;
}): Promise<void> {
  const r = await crmFetch("/api/fcm/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => "");
    throw new Error(`CRM /api/fcm/register failed (${r.status}): ${detail}`);
  }
}
