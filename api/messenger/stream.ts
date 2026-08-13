// Server-Sent Events proxy for the messenger + notifications realtime
// stream. Validates the caller's Supabase JWT, then opens an authenticated
// upstream SSE connection to the CRM's /api/messenger/stream endpoint
// (Bearer ONROL_EVENT_SECRET, with ?userExternalId=<authedUserId>) and
// pipes each event back to the browser unchanged.
//
// Browser EventSources cannot send custom headers, so this handler accepts
// the JWT via the standard Authorization header (when reachable behind a
// fetch+ReadableStream consumer) OR via ?access_token=<jwt> for vanilla
// EventSource usage. We accept either path and resolve to the same uuid.

import type { IncomingMessage, ServerResponse } from "node:http";
import { getAdminSupabase, getAuthUserId, getErrorMessage } from "../meetings/_utils";

export const config = { runtime: "nodejs" };

type ReqLike = IncomingMessage & {
  query?: Record<string, string | string[] | undefined>;
  headers: IncomingMessage["headers"];
};

function readQuery(req: ReqLike, key: string): string | undefined {
  const fromQuery = req.query?.[key];
  if (typeof fromQuery === "string") return fromQuery;
  if (Array.isArray(fromQuery)) return fromQuery[0];
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const value = url.searchParams.get(key);
    return value ?? undefined;
  } catch {
    return undefined;
  }
}

async function resolveUserId(req: ReqLike): Promise<string | null> {
  const direct = await getAuthUserId({ headers: req.headers as Record<string, string | string[] | undefined> });
  if (direct) return direct;
  const token = readQuery(req, "access_token");
  if (!token) return null;
  try {
    const supabaseAdmin = getAdminSupabase();
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

export default async function handler(req: ReqLike, res: ServerResponse) {
  try {
    if ((req.method ?? "GET").toUpperCase() !== "GET") {
      res.statusCode = 405;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const userId = await resolveUserId(req);
    if (!userId) {
      res.statusCode = 401;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    const crmUrl = process.env.CRM_EVENT_URL;
    const secret = process.env.ONROL_EVENT_SECRET;
    if (!crmUrl || !secret) {
      res.statusCode = 503;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "CRM_EVENT_URL / ONROL_EVENT_SECRET not configured." }));
      return;
    }
    const base = (() => {
      try { const u = new URL(crmUrl); return `${u.protocol}//${u.host}`; }
      catch { return null; }
    })();
    if (!base) {
      res.statusCode = 503;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: "CRM_EVENT_URL is not a valid URL." }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const upstreamUrl = `${base}/api/messenger/stream?userExternalId=${encodeURIComponent(userId)}`;
    const upstreamController = new AbortController();
    const cleanup = () => { try { upstreamController.abort(); } catch { /* ignore */ } };
    req.on("close", cleanup);
    req.on("aborted", cleanup);

    const upstream = await fetch(upstreamUrl, {
      headers: { Authorization: `Bearer ${secret}`, accept: "text/event-stream" },
      signal: upstreamController.signal,
    });

    if (!upstream.ok || !upstream.body) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: `Upstream ${upstream.status}` })}\n\n`);
      res.end();
      return;
    }

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        res.write(decoder.decode(value, { stream: true }));
      }
    } catch {
      // Upstream closed or aborted — drop through.
    } finally {
      try { res.end(); } catch { /* already ended */ }
    }
  } catch (error) {
    try {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: getErrorMessage(error, "stream proxy failed") }));
      } else {
        res.write(`event: error\ndata: ${JSON.stringify({ message: getErrorMessage(error, "stream proxy failed") })}\n\n`);
        res.end();
      }
    } catch { /* ignore */ }
  }
}
