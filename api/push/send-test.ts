import { getAuthUserId, getErrorMessage } from "./_utils";
import { crmSendPush } from "./_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

/**
 * POST /api/push/send-test
 *
 * Validates the user via Supabase JWT, then asks the CRM to fan out a
 * test notification to every subscription this user has. VAPID + the
 * subscription store live on the CRM now.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const result = await crmSendPush({
      userExternalIds: [userId],
      title: "ONROL Task Manager",
      body: "Test notification delivered successfully.",
      url: "/task/app",
      icon: "/icons/icon-192.png",
    });

    if (result.sent === 0 && result.expired === 0 && result.failed === 0) {
      return res.status(400).json({ error: "No push subscription found for this user. Enable notifications first." });
    }

    return res.status(200).json({
      ok: true,
      delivered: result.sent,
      failed: result.failed,
      expired: result.expired,
    });
  } catch (error: unknown) {
    return res.status(500).json({ error: getErrorMessage(error, "Failed to send test notification") });
  }
}
