import { getAuthUserId, getErrorMessage, parseSubscriptionKeys } from "./_utils";
import { crmUpsertSubscription } from "./_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: {
    subscription?: {
      endpoint?: string;
      expirationTime?: number | null;
      keys?: {
        p256dh?: string;
        auth?: string;
      };
      toJSON?: () => {
        keys?: {
          p256dh?: string;
          auth?: string;
        };
      };
    };
  };
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

/**
 * POST /api/push/subscribe
 *
 * Browser-facing. Validates the caller's Supabase JWT, then forwards the
 * subscription to the CRM (own-Postgres) via the shared service token.
 *
 * Supabase Auth stays as the IDP — only the data tier moved.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const subscription = req.body?.subscription;
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: "Invalid subscription payload" });
    }

    const { p256dh, auth } = parseSubscriptionKeys(subscription);
    const userAgentRaw = req.headers?.["user-agent"];
    const userAgent = Array.isArray(userAgentRaw) ? userAgentRaw[0] : userAgentRaw ?? null;

    await crmUpsertSubscription({
      userExternalId: userId,
      subscription: {
        endpoint: subscription.endpoint,
        p256dh: p256dh ?? null,
        auth: auth ?? null,
        expirationTime: subscription.expirationTime ?? null,
      },
      userAgent,
    });

    return res.status(200).json({ ok: true });
  } catch (error: unknown) {
    return res.status(500).json({ error: getErrorMessage(error, "Subscription save failed") });
  }
}
