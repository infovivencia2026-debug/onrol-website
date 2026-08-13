# ONROL — agent instructions

## Project shape
- **Type:** Vite + React + TypeScript SPA (static build → `dist/`)
- **Backend:** Supabase (Auth, Postgres, RLS, Realtime, Edge Functions, Storage)
- **Live URL:** https://onrol.in (workspace lives at https://onrol.in/tasks)
- **VPS:** Hostinger KVM4 (`76.13.242.93`, AlmaLinux 9, CyberPanel + OpenLiteSpeed)
- **Web root:** `/home/onrol.in/public_html` — served directly by OLS, no PM2 / Node process.
- **Mobile:** Capacitor wrapper → APK at `https://onrol.in/downloads/onrol.apk`
- **Desktop:** Electron → installer at `https://onrol.in/downloads/onrol-setup.exe`

## Deployment
The user has a Hostinger VPS at `root@76.13.242.93`. Port 22 SSH is the only inbound channel after the recent malware lockdown.

When the user says "deploy", "ship it", "push to live", or similar:

1. Run `npm run lint` first if the change touches >5 files. Skip for tiny edits.
2. Run `bash scripts/deploy.sh` (alias: `npm run deploy`). It:
   - Builds with Vite → `dist/`
   - Stamps `dist/version.json` with the package version
   - Tarballs `dist/` contents
   - `scp`s the tarball to `/tmp/` on the VPS
   - SSH-extracts into `/home/onrol.in/public_html` (wipes the dir first)
   - Uploads APK + Windows installer if present in `android/.../app-release.apk` and `release/`
   - `curl -I https://onrol.in` to confirm 200
3. After deploy, hard-refresh the live site to verify (the SW is set to skip-waiting on a new build).

### Fallback transports
- `npm run deploy:ftp` — original FTP path. Only works when port 21 is open (currently closed).
- `npm run deploy:ssh-ps` — older PowerShell-based SSH script, kept for Windows-without-bash.

### Required `.env` keys
```
SSH_HOST=76.13.242.93
SSH_USER=root
SSH_REMOTE_PATH=/home/onrol.in/public_html
SSH_KEY_PATH=C:\Users\lenovo\.ssh\id_ed25519     # Windows path; script auto-converts to /c/Users/...
SSH_PORT=22                                       # only set if non-default
```

Plus the existing app keys (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VAPID_*`, `MISTRAL_API_KEY`, etc.).

## Rules — what NOT to do
- **Never** `pm2 anything` on this VPS for onrol — it's static, no Node process.
- **Never** force-push to `main`. Don't bypass git hooks.
- **Never** edit files directly under `/home/onrol.in/public_html` on the VPS — they get wiped on next deploy.
- **Don't** commit `.env`, `release/`, `dist/`, or APK binaries.
- **Don't** run `deploy:ftp` unless the user explicitly asks — FTP is closed and may fail noisily.

## Supabase notes
- Project: `qcantdsmcrjfewcfpyej`
- Migrations live in `supabase/migrations/`. Apply them via Supabase → SQL Editor (no `supabase db push` workflow set up).
- Edge functions in `supabase/functions/` — deploy via `supabase functions deploy <name>` (requires Supabase CLI logged in).
- RLS is on for `office_users` and `office_tasks`. New tables MUST get RLS policies.

## Realtime
`office_tasks` is in the `supabase_realtime` publication so admin deletes propagate to employee sessions immediately. If a new table needs realtime sync, add it to that publication.
