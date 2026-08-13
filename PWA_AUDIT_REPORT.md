# PWA Audit Report — ONROL Task Manager

Audit date: 2026-04-02

## Summary
- **Initial state (before this pass): NOT a proper PWA**
- **Current state (after this pass): PWA-ready with push pipeline**

## Checklist (PASS / FAIL)

| Item | Before | After | Notes |
|---|---|---|---|
| Valid web app manifest exists | FAIL | PASS | Added `public/manifest.webmanifest` |
| App links to manifest correctly | FAIL | PASS | Added `<link rel="manifest" ...>` in `index.html` |
| Required manifest fields exist (`name`, `short_name`, `start_url`, `display`, `theme_color`, `background_color`, `icons`) | FAIL | PASS | Present in manifest |
| Suitable app icons in required sizes | FAIL | PASS | Added `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png` |
| Service worker exists and is registered on client | FAIL | PASS | Added `public/sw.js` + registration in `src/main.tsx` |
| Offline shell/basic asset caching | FAIL | PASS | SW handles install/activate/fetch + offline fallback page |
| App installable (manifest + SW + HTTPS/localhost) | FAIL | PASS* | `*` Requires HTTPS in production and proper SPA routing fallback |
| HTTPS/localhost assumptions documented | FAIL | PASS | Documented in `PWA_SETUP.md` |
| Notification permission flow exists | FAIL | PASS | Added “Enable Notifications” in Task Settings |
| Push API subscription flow exists | FAIL | PASS | Added client subscribe flow + `/api/push/subscribe` |
| Server-side storage for push subscriptions exists | FAIL | PASS | Added SQL table migration `supabase/push_notifications.sql` |
| Push sending endpoint exists | FAIL | PASS | Added `/api/push/send-test` (uses `web-push`) |
| SW handles `push` and `notificationclick` | FAIL | PASS | Implemented in `public/sw.js` |

## Notes
- This codebase is Vite + React (not Next.js App Router).
- Push endpoint files are under `api/push/*` and are intended for serverless Node runtimes (e.g., Vercel).
- If deployed as pure static hosting without serverless API support, push send/subscribe endpoints must be moved to Supabase Edge Functions or another backend.

