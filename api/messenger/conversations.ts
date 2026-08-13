import { getAuthUserId, getErrorMessage } from "../meetings/_utils";
import { crmListConversations, crmCreateConversation, crmGetOrCreateDirect, crmCreateGroup, crmRemoveUserFromAllConversations } from "./_crm";

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
      const hydrate = req.query?.hydrate === "1" || req.query?.hydrate === "true";
      const payload = await crmListConversations(userId, { hydrate });
      return res.status(200).json(payload);
    }
    if (req.method === "POST") {
      const body = (typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {})) as {
        action?: string;
        kind?: string; title?: string | null; settings?: Record<string, unknown>;
        description?: string | null;
        memberIds?: string[];
        otherUserId?: string;
      };
      if (body.action === "direct") {
        if (!body.otherUserId) return res.status(400).json({ error: "otherUserId required" });
        const conversationId = await crmGetOrCreateDirect(userId, body.otherUserId);
        return res.status(200).json({ ok: true, conversationId });
      }
      if (body.action === "group" || body.action === "announcement") {
        if (!body.title) return res.status(400).json({ error: "title required" });
        const conversationId = await crmCreateGroup({
          title: body.title,
          description: body.description ?? null,
          createdBy: userId,
          memberIds: Array.isArray(body.memberIds) ? body.memberIds : [],
          settings: body.settings,
          kind: body.action === "announcement" ? "announcement" : "group",
        });
        return res.status(200).json({ ok: true, conversationId });
      }
      const conversation = await crmCreateConversation({
        kind: body.kind,
        title: body.title,
        createdBy: userId,
        settings: body.settings,
      });
      return res.status(200).json({ ok: true, conversation });
    }
    if (req.method === "DELETE") {
      const action = typeof req.query?.action === "string" ? req.query.action : undefined;
      const targetUserId = typeof req.query?.userExternalId === "string" ? req.query.userExternalId : undefined;
      if (action !== "removeUserFromAll" || !targetUserId) {
        return res.status(400).json({ error: "action=removeUserFromAll and userExternalId required" });
      }
      const out = await crmRemoveUserFromAllConversations(targetUserId);
      return res.status(200).json(out);
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    const status = (error as Error & { status?: number })?.status ?? 500;
    return res.status(status).json({ error: getErrorMessage(error, "Conversations request failed") });
  }
}
