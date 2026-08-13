-- ─────────────────────────────────────────────────────────────────────────
-- ONROL Community — let signed-in users write their OWN community_members row
-- ─────────────────────────────────────────────────────────────────────────
-- Run this once in Supabase SQL editor.
--
-- Why: the existing RLS policies on community_members only had SELECT rules.
-- Onboarding submits an upsert into community_members for the signed-in
-- user, which was being silently blocked — the upsert call returned
-- without rows changed, the form looked successful, but the row never got
-- the new fields. Result: every page load bounced the user back to
-- /onboarding/community because the dashboard's profile-completeness gate
-- saw an empty location/current_role/skills.
--
-- This migration adds two policies:
--   - INSERT: a logged-in user can insert their OWN row (id = auth.uid()).
--             Closes the gap where ensureMemberRow() failed silently for
--             first-time Google OAuth users.
--   - UPDATE: a logged-in user can update their OWN row only. Cannot
--             change the id, can only target the row whose id matches
--             auth.uid().
--
-- Idempotent — safe to re-run.

alter table public.community_members enable row level security;

-- Drop any prior versions of these policies so re-running is clean.
drop policy if exists "community_members_self_insert" on public.community_members;
drop policy if exists "community_members_self_update" on public.community_members;

-- A signed-in user can insert their own row.
create policy "community_members_self_insert"
  on public.community_members
  for insert
  with check (auth.uid() = id);

-- A signed-in user can update their own row.
create policy "community_members_self_update"
  on public.community_members
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Sanity: make sure SELECT-own-row exists too. Harmless if already present.
drop policy if exists "community_members_self_read" on public.community_members;
create policy "community_members_self_read"
  on public.community_members
  for select
  using (auth.uid() = id);
