# ONROL Community Content Pipeline Deployment

This enables a real admin workflow:
- Queue sources
- Create reviewed drafts
- Publish now or schedule
- Auto-release due scheduled posts

## 1) Apply SQL

Run this file in Supabase SQL Editor:

- `supabase/community-content-pipeline.sql`

It creates:
- `community_content_sources`
- `community_content_drafts`
- `publish_content_draft(...)` RPC
- `publish_due_posts()` RPC
- Admin-only RLS policies

## 2) Ensure admin account exists

Run:
- `supabase/admin-account-setup.sql`

Use your real admin email in that script before executing.

## 3) App behavior now

- Community dashboard shows **Admin Content Pipeline** panel only for admins.
- Admin can queue source URLs and create drafts.
- Admin can publish instantly or schedule.
- Dashboard executes `publish_due_posts()` to release due content.
- Feed queries only show `is_published = true` and `published_at <= now()`.

## 4) Optional next step (recommended)

For automatic content ingestion from URL pages, add a Supabase Edge Function that:
- fetches source URL HTML
- extracts clean text/title
- writes into `community_content_sources.raw_text`
- proposes structured `community_content_drafts`

This repo currently implements the production-safe admin workflow and scheduling layer in DB + UI.

