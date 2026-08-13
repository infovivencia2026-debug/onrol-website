import { getAuthUserId, getErrorMessage } from "../push/_utils";
import { crmRegisterFcm } from "../push/_crm";

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: {
    token?: string;
    platform?: "android" | "ios" | "web";
    deviceId?: string;
  };
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

/**
 * POST /api/fcm/register
 *
 * Capacitor mobile clients post their FCM registration token here.
 * Validates the Supabase JWT, forwards the token to the CRM for storage.
 * Replaces the previous direct `supabase.rpc("upsert_my_fcm_token", …)`
 * call that ran in the browser.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { token, platform, deviceId } = req.body ?? {};
    if (!token || !platform) {
      return res.status(400).json({ error: "token and platform required" });
    }
    if (!["android", "ios", "web"].includes(platform)) {
      return res.status(400).json({ error: "Invalid platform" });
    }

    await crmRegisterFcm({
      userExternalId: userId,
      token,
      platform,
      deviceId,
    });

    return res.status(200).json({ ok: true });
  } catch (error: unknown) {
    return res.status(500).json({ error: getErrorMessage(error, "FCM register failed") });
  }
}
