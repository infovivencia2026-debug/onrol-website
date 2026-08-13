import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import {
  crmListMessages, crmInsertMessage, crmPinMessage, crmUnpinMessage,
  crmEditMessage, crmSoftDeleteMessage, crmModerateDeleteMessage,
} from "./_crm";

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

    if (req.method === "GET") {
      const conversationId = stringQ(req.query?.conversationId);
      if (!conversationId) return res.status(400).json({ error: "conversationId required" });
      const messages = await crmListMessages(conversationId, {
        limit: Number(stringQ(req.query?.limit) ?? "100"),
        before: stringQ(req.query?.before),
      });
      return res.status(200).json({ ok: true, messages });
    }
    if (req.method === "POST") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
        action?: string;
        conversationId?: string;
        body?: string;
        attachments?: unknown[];
        metadata?: Record<string, unknown> | null;
        messageId?: string;
        messageType?: string;
        replyToMessageId?: string | null;
        linkedEntityType?: string | null;
        linkedEntityId?: string | null;
        newBody?: string;
      };
      if (body.action === "pin" && body.conversationId && body.messageId) {
        return res.status(200).json(await crmPinMessage(body.conversationId, body.messageId, userId));
      }
      if (body.action === "unpin" && body.conversationId && body.messageId) {
        return res.status(200).json(await crmUnpinMessage(body.conversationId, body.messageId));
      }
      if (body.action === "edit" && body.messageId && typeof body.body === "string") {
        return res.status(200).json(await crmEditMessage(body.messageId, body.body));
      }
      if (body.action === "softDelete" && body.messageId) {
        return res.status(200).json(await crmSoftDeleteMessage(body.messageId, body.newBody));
      }
      if (body.action === "moderateDelete" && body.messageId) {
        return res.status(200).json(await crmModerateDeleteMessage(body.messageId, userId, body.newBody));
      }
      if (!body.conversationId || typeof body.body !== "string") {
        return res.status(400).json({ error: "conversationId + body required" });
      }
      const message = await crmInsertMessage({
        conversationId: body.conversationId,
        senderExternalId: userId,
        body: body.body,
        attachments: body.attachments,
        metadata: body.metadata,
        messageType: body.messageType,
        replyToMessageId: body.replyToMessageId,
        linkedEntityType: body.linkedEntityType,
        linkedEntityId: body.linkedEntityId,
      });
      return res.status(200).json({ ok: true, message });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Messages request failed") });
  }
}

function stringQ(v: string | string[] | undefined): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}
