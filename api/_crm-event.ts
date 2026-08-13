// Fire-and-forget emit to the CRM federation bus. Mirrors
// tools-onrol/api/src/services/crmEvent.js — kept in TS here so it slots
// into the existing onrol.in Vercel-style handler files.
//
// Required env:
//   CRM_EVENT_URL      — e.g. https://crm.onrol.in/api/event
//   ONROL_EVENT_SECRET — shared with the CRM
//
// Usage:
//   import { emitCrmEvent } from "@/api/_crm-event";
//   emitCrmEvent({ kind: "meeting_booked", userEmail, payload: { meetingId } });

const SOURCE = "onrol.in";

export interface CrmEventInput {
  kind: string;
  userEmail?: string | null;
  userPhone?: string | null;
  userExternalId?: string | null;
  payload?: Record<string, unknown>;
}

export function emitCrmEvent(input: CrmEventInput): void {
  const url = process.env.CRM_EVENT_URL;
  const secret = process.env.ONROL_EVENT_SECRET;
  if (!url || !secret) return;

  const body = JSON.stringify({
    source: SOURCE,
    kind: input.kind,
    userEmail: input.userEmail ?? null,
    userPhone: input.userPhone ?? null,
    userExternalId: input.userExternalId ?? null,
    payload: input.payload ?? {},
  });

  fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${secret}`,
    },
    body,
  }).catch((err) => {
    console.warn(`[crm-event] ${input.kind} emit failed:`, err instanceof Error ? err.message : err);
  });
}
