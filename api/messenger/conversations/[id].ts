import { getAuthUserId, getErrorMessage } from "../../meetings/_utils";
import {
  crmUpdateConversationSettings, crmSetConversationArchived, crmDeleteConversation,
  crmUpsertMembers, crmRemoveMember, crmMarkRead,
  crmSetMemberMuted, crmSetMemberHidden, crmSetConversationPin, crmAckAnnouncement,
} from "../_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const id = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
    if (!id) return res.status(400).json({ error: "id required" });

    if (req.method === "PATCH") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
        action?: string;
        settings?: Record<string, unknown>;
        archived?: boolean;
        members?: Array<{ userExternalId: string; role?: string }>;
        userExternalId?: string;
        lastReadMessageId?: string | null;
        muted?: boolean;
        hidden?: boolean;
        pinned?: boolean;
        status?: "seen" | "understood";
        messageId?: string;
      };
      switch (body.action) {
        case "settings":
          if (!body.settings) return res.status(400).json({ error: "settings required" });
          return res.status(200).json(await crmUpdateConversationSettings(id, body.settings));
        case "archive":
          await crmSetConversationArchived(id, !!body.archived);
          return res.status(200).json({ ok: true });
        case "addMembers":
          if (!Array.isArray(body.members)) return res.status(400).json({ error: "members[] required" });
          return res.status(200).json(await crmUpsertMembers(id, body.members));
        case "removeMember":
          if (!body.userExternalId) return res.status(400).json({ error: "userExternalId required" });
          return res.status(200).json(await crmRemoveMember(id, body.userExternalId));
        case "markRead":
          await crmMarkRead(id, userId, body.lastReadMessageId ?? null);
          return res.status(200).json({ ok: true });
        case "mute":
          await crmSetMemberMuted(id, userId, !!body.muted);
          return res.status(200).json({ ok: true });
        case "hide":
          await crmSetMemberHidden(id, userId, !!body.hidden);
          return res.status(200).json({ ok: true });
        case "pin":
          await crmSetConversationPin(id, userId, !!body.pinned);
          return res.status(200).json({ ok: true });
        case "ack":
          return res.status(200).json(await crmAckAnnouncement(id, userId, body.status ?? "understood", body.messageId));
        default:
          return res.status(400).json({ error: "Unknown action" });
      }
    }
    if (req.method === "DELETE") {
      return res.status(200).json(await crmDeleteConversation(id));
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Conversation request failed") });
  }
}
