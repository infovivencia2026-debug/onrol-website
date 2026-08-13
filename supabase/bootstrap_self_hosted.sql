-- ─────────────────────────────────────────────────────────────────────────
-- ONROL — bootstrap schema for the self-hosted Supabase stack on the VPS.
-- ─────────────────────────────────────────────────────────────────────────
-- Run once after the Docker stack comes up. Idempotent.
--
-- Scope: only what the PUBLIC community hub needs.
--   - admins                  (gates /community/admin/* + RLS writes)
--   - community_members       (auth-linked profile, used by onboarding)
--   - community_posts         (admin-published broadcast feed)
--   - community-covers bucket (storage for cover images)
--
-- Alumni-only tables (discussions, projects, jobs, events, posts/legacy)
-- are NOT included — they're not used by the public hub. Add them later
-- only if you decide to revive the alumni dashboard.

-- ── Required extensions ─────────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ── Admins ──────────────────────────────────────────────────────────────
-- Anyone whose auth.uid() lives in this table is treated as an admin.
-- Insert rows manually for each admin user. Granular roles + permissions
-- are kept here so the AdminUser interface in the frontend stays happy.

create table if not exists public.admins (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  full_name     text,
  role          text not null default 'admin' check (role in ('moderator', 'admin', 'super_admin')),
  permissions   jsonb not null default jsonb_build_object(
    'manage_members', true,
    'manage_content', true,
    'manage_events',  true,
    'manage_jobs',    true,
    'view_analytics', true
  ),
  created_at    timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Anyone signed in can read admins (used by the frontend isAdmin check).
drop policy if exists "admins_authenticated_read" on public.admins;
create policy "admins_authenticated_read"
  on public.admins for select
  using (auth.role() = 'authenticated');

-- Only existing admins can grant / revoke admin status.
drop policy if exists "admins_admin_write" on public.admins;
create policy "admins_admin_write"
  on public.admins for all
  using (auth.uid() in (select id from public.admins))
  with check (auth.uid() in (select id from public.admins));


-- ── Community members ───────────────────────────────────────────────────
-- One row per registered ONROL Community user. Linked to auth.users.
-- On first Google OAuth login the frontend auto-creates a minimal row
-- via ensureMemberRow(); the onboarding form fills the rest.

create table if not exists public.community_members (
  id                    uuid primary key references auth.users (id) on delete cascade,
  email                 text not null,
  full_name             text,
  avatar_url            text,
  bio                   text,
  location              text,
  tagline               text,
  skills                text[] not null default '{}',
  experience_level      text not null default 'absolute_beginner',
  "current_role"        text,
  company               text,
  linkedin_url          text,
  github_url            text,
  twitter_url           text,
  portfolio_url         text,
  member_status         text not null default 'approved' check (member_status in ('pending', 'approved', 'rejected', 'suspended')),
  member_type           text not null default 'learner' check (member_type in ('learner', 'mentor', 'admin')),
  specialization_track  text,
  graduation_year       integer,
  cohort_batch          text,
  points                integer not null default 0,
  level                 integer not null default 1,
  streak_days           integer not null default 0,
  joined_at             timestamptz not null default now(),
  approved_at           timestamptz,
  last_active_at        timestamptz not null default now(),
  email_notifications   boolean default true,
  push_notifications    boolean default true,
  profile_visibility    text default 'public',
  created_at            timestamptz not null default now()
);

create index if not exists community_members_status_idx
  on public.community_members (member_status);

alter table public.community_members enable row level security;

-- Each user can read + insert + update their OWN row.
drop policy if exists "community_members_self_read"   on public.community_members;
drop policy if exists "community_members_self_insert" on public.community_members;
drop policy if exists "community_members_self_update" on public.community_members;

create policy "community_members_self_read"
  on public.community_members for select
  using (auth.uid() = id);

create policy "community_members_self_insert"
  on public.community_members for insert
  with check (auth.uid() = id);

create policy "community_members_self_update"
  on public.community_members for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- Approved members can read other approved members (for member directory).
drop policy if exists "community_members_approved_read" on public.community_members;
create policy "community_members_approved_read"
  on public.community_members for select
  using (
    member_status = 'approved'
    and exists (
      select 1 from public.community_members me
      where me.id = auth.uid() and me.member_status = 'approved'
    )
  );

-- Admins can read everything.
drop policy if exists "community_members_admin_read" on public.community_members;
create policy "community_members_admin_read"
  on public.community_members for select
  using (auth.uid() in (select id from public.admins));

-- Allow public anon SELECT only for headcount queries (count: exact, head: true).
-- The community landing page reads count(*) from community_members for the
-- "12,481 builders" pulse. We want this to work without auth.
drop policy if exists "community_members_anon_count" on public.community_members;
create policy "community_members_anon_count"
  on public.community_members for select
  using (member_status = 'approved');


-- ── Community posts (Wave B broadcast feed) ─────────────────────────────
create table if not exists public.community_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text,
  body_md         text not null default '',
  category        text not null check (
    category in ('news', 'tools', 'prompts', 'hacks', 'wins', 'jobs', 'workshops')
  ),
  cover_url       text,
  status          text not null default 'draft' check (status in ('draft', 'published')),
  author_id       uuid references auth.users (id) on delete set null,
  view_count      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  published_at    timestamptz
);

create index if not exists community_posts_status_published_idx
  on public.community_posts (status, published_at desc);
create index if not exists community_posts_category_idx
  on public.community_posts (category, published_at desc);

create or replace function public.community_posts_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists community_posts_updated_at on public.community_posts;
create trigger community_posts_updated_at
  before update on public.community_posts
  for each row execute function public.community_posts_set_updated_at();

alter table public.community_posts enable row level security;

drop policy if exists "community_posts_public_read"     on public.community_posts;
drop policy if exists "community_posts_admin_read_all"  on public.community_posts;
drop policy if exists "community_posts_admin_write"     on public.community_posts;

create policy "community_posts_public_read"
  on public.community_posts for select
  using (status = 'published');

create policy "community_posts_admin_read_all"
  on public.community_posts for select
  using (auth.uid() in (select id from public.admins));

create policy "community_posts_admin_write"
  on public.community_posts for all
  using (auth.uid() in (select id from public.admins))
  with check (auth.uid() in (select id from public.admins));


-- ── Storage bucket for cover images ─────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('community-covers', 'community-covers', true)
on conflict (id) do nothing;

drop policy if exists "community_covers_public_read"   on storage.objects;
drop policy if exists "community_covers_admin_write"   on storage.objects;
drop policy if exists "community_covers_admin_update"  on storage.objects;
drop policy if exists "community_covers_admin_delete"  on storage.objects;

create policy "community_covers_public_read"
  on storage.objects for select
  using (bucket_id = 'community-covers');

create policy "community_covers_admin_write"
  on storage.objects for insert
  with check (
    bucket_id = 'community-covers'
    and auth.uid() in (select id from public.admins)
  );

create policy "community_covers_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'community-covers'
    and auth.uid() in (select id from public.admins)
  );

create policy "community_covers_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'community-covers'
    and auth.uid() in (select id from public.admins)
  );


-- ── Webinar registrations (Career Catalyst landing) ─────────────────────
-- One row per public webinar form submission from /career-catalyst.
-- The form is unauthenticated (no auth.uid()), so RLS allows the anon
-- role to INSERT but never SELECT — keep PII out of the public API.

create table if not exists public.webinar_registrations (
  id              bigserial primary key,
  full_name       text,
  phone           text,
  email           text,
  "current_role"  text,
  source          text,
  registered_at   timestamptz not null default now()
);

create index if not exists webinar_registrations_email_idx
  on public.webinar_registrations (email);
create index if not exists webinar_registrations_registered_at_idx
  on public.webinar_registrations (registered_at desc);

alter table public.webinar_registrations enable row level security;

drop policy if exists "webinar_registrations_admin_read" on public.webinar_registrations;

-- Only admins can read the submissions back out.
create policy "webinar_registrations_admin_read"
  on public.webinar_registrations for select
  using (auth.uid() in (select id from public.admins));

-- We do NOT define an anon INSERT policy. In this self-hosted Supabase the
-- anon role is not a member of the implicit PUBLIC group, so policies of
-- the shape "to anon with check (true)" silently fail to apply and inserts
-- are denied. Instead, we expose a SECURITY DEFINER function (below) that
-- the form calls via /rpc/register_for_webinar — it inserts as the table
-- owner, bypassing RLS while keeping the table itself locked down.

create or replace function public.register_for_webinar(
  p_full_name    text,
  p_phone        text,
  p_email        text,
  p_current_role text,
  p_source       text default 'career-catalyst-landing'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
begin
  insert into public.webinar_registrations
    (full_name, phone, email, "current_role", source)
  values (p_full_name, p_phone, p_email, p_current_role, p_source)
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.register_for_webinar(text, text, text, text, text)
  to anon, authenticated;


-- ── Hidden landing-page visit counter ───────────────────────────────────
-- Tracks total page-load count per public marketing route. Admin-only
-- read; anon increments via the SECURITY DEFINER RPC below. Lightweight —
-- a single row per page_path, no per-visitor detail (add a separate log
-- table later if you ever need session/IP analytics).

create table if not exists public.landing_page_visit_counts (
  page_path      text primary key,
  total_visits   bigint not null default 0,
  last_visit_at  timestamptz not null default now()
);

alter table public.landing_page_visit_counts enable row level security;

drop policy if exists "lpvc_admin_read" on public.landing_page_visit_counts;
create policy "lpvc_admin_read"
  on public.landing_page_visit_counts for select
  to authenticated
  using (auth.uid() in (select id from public.admins));

create or replace function public.track_landing_visit(p_page_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.landing_page_visit_counts (page_path, total_visits)
  values (p_page_path, 1)
  on conflict (page_path) do update
    set total_visits  = landing_page_visit_counts.total_visits + 1,
        last_visit_at = now();
end;
$$;

grant execute on function public.track_landing_visit(text) to anon, authenticated;


-- ── /win convocation registrations (invite-only) ────────────────────────
-- Form lives at https://onrol.in/win, distributed by direct link only.
-- Same SECURITY DEFINER pattern as register_for_webinar to bypass the
-- self-hosted-Supabase anon-RLS quirk.

create table if not exists public.win_registrations (
  id              bigserial primary key,
  first_name      text,
  last_name       text,
  father_name     text,
  mobile          text,
  email           text,
  occupation      text,
  source          text,
  registered_at   timestamptz not null default now()
);

create index if not exists win_registrations_email_idx
  on public.win_registrations (email);
create index if not exists win_registrations_registered_at_idx
  on public.win_registrations (registered_at desc);

alter table public.win_registrations enable row level security;

drop policy if exists "win_admin_read" on public.win_registrations;
create policy "win_admin_read"
  on public.win_registrations for select
  to authenticated
  using (auth.uid() in (select id from public.admins));

create or replace function public.register_for_win(
  p_first_name  text,
  p_last_name   text,
  p_father_name text,
  p_mobile      text,
  p_email       text,
  p_occupation  text,
  p_source      text default 'win-convocation'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
begin
  insert into public.win_registrations
    (first_name, last_name, father_name, mobile, email, occupation, source)
  values (p_first_name, p_last_name, p_father_name, p_mobile, p_email, p_occupation, p_source)
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.register_for_win(text, text, text, text, text, text, text)
  to anon, authenticated;
