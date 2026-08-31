# ONROL PWA + Push Setup

## 1) Run SQL migration
Run this in Supabase SQL editor:

- `supabase/push_notifications.sql`

This creates `public.push_subscriptions` for storing push endpoints.

## 2) Configure environment variables
Set these in your environment (and deployment platform):

- `VITE_VAPID_PUBLIC_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (example: `mailto:info@onrol.in`)

## 3) Generate VAPID keys
Use `web-push` CLI once:

```bash
npx web-push generate-vapid-keys
```

Copy:
- public key -> `VITE_VAPID_PUBLIC_KEY` and `VAPID_PUBLIC_KEY`
- private key -> `VAPID_PRIVATE_KEY`

## 4) Deploy notes
- PWA installability and push require `https` in production.
- `localhost` works for local development.
- `/api/push/subscribe` and `/api/push/send-test` are server routes (for platforms like Vercel that support Node serverless functions).

## 5) In-app usage
Go to:
- `Task Manager -> User Settings -> Notifications & Reminders -> Web Push`

Use:
- **Enable Notifications**
- **Send Test Notification**

## 6) iPhone behavior (important)
- On iPhone, web push works only after:
1. Add to Home Screen
2. Open the installed app icon
3. Grant notification permission from the installed app context

