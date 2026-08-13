import { getAdminSupabase, getAuthUserId, getErrorMessage } from "./_utils";
import { crmSendPush } from "./_crm";

type NotificationRow = {
  id: string;
  user_id: string;
  related_visit_task_id: string | null;
  related_institution_id: string | null;
  type: string;
  title: string;
  message: string;
  action_url: string | null;
};

type ApiRequest = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

const isMissingColumn = (error: unknown, columnName: string) => {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? (error as { code?: unknown }).code : undefined;
  const message = "message" in error ? (error as { message?: unknown }).message : undefined;
  return code === "42703" || (typeof message === "string" && message.includes(columnName));
};

/**
 * POST /api/push/send-reminders
 *
 * Hybrid during the migration window:
 *   - Notifications + user prefs + activity log STILL on Supabase
 *     (those tables migrate in Phase 8 / Phase 9).
 *   - Push subscriptions + the actual send fan-out are on CRM.
 *
 * Once the notifications domain moves over, this handler becomes a thin
 * caller to the CRM cron — no more Supabase reads here.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const supabaseAdmin = getAdminSupabase();

    const loadPendingNotifications = async () => {
      const primary = await supabaseAdmin
        .from("notifications")
        .select("id,user_id,related_visit_task_id,related_institution_id,type,title,message,action_url")
        .eq("user_id", userId)
        .eq("is_push_sent", false)
        .eq("is_read", false)
        .eq("severity", "high")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!primary.error) return primary;
      if (!isMissingColumn(primary.error, "user_id")) return primary;

      return supabaseAdmin
        .from("notifications")
        .select("id,related_visit_task_id,related_institution_id,type,title,message,action_url")
        .eq("recipient_id", userId)
        .eq("is_push_sent", false)
        .eq("is_read", false)
        .eq("severity", "high")
        .order("created_at", { ascending: false })
        .limit(5);
    };

    const [
      { data: notifications, error: notifError },
      { data: prefRow },
    ] = await Promise.all([
      loadPendingNotifications(),
      supabaseAdmin
        .from("user_notification_preferences")
        .select("push_enabled")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (notifError) return res.status(500).json({ error: notifError.message });

    const rows = (notifications || []) as NotificationRow[];
    const pushEnabled = (prefRow as { push_enabled?: boolean } | null)?.push_enabled ?? false;
    if (!pushEnabled) return res.status(200).json({ ok: true, delivered: 0, total: 0, skipped: "push_disabled" });
    if (!rows.length) return res.status(200).json({ ok: true, delivered: 0, total: 0 });

    let delivered = 0;
    let failed = 0;

    for (const notification of rows) {
      try {
        const result = await crmSendPush({
          userExternalIds: [userId],
          title: notification.title,
          body: notification.message,
          url: notification.action_url || "/task/app",
          icon: "/icons/icon-192.png",
          data: {
            notificationId: notification.id,
            type: notification.type,
            taskId: notification.related_visit_task_id,
            institutionId: notification.related_institution_id,
          },
        });
        if (result.sent > 0) {
          delivered += result.sent;
          await supabaseAdmin
            .from("notifications")
            .update({ is_push_sent: true, push_sent_at: new Date().toISOString() })
            .eq("id", notification.id);
        }
        failed += result.failed;
      } catch (err) {
        failed += 1;
        console.warn(`[send-reminders] CRM send failed for ${notification.id}:`, getErrorMessage(err, "unknown"));
      }
    }

    return res.status(200).json({ ok: true, delivered, total: rows.length, failed });
  } catch (error: unknown) {
    return res.status(500).json({ error: getErrorMessage(error, "Failed to send reminder notifications") });
  }
}
