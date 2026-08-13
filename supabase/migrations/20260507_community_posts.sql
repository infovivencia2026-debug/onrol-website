-- ─────────────────────────────────────────────────────────────────────────
-- ONROL Community — admin-published posts
-- ─────────────────────────────────────────────────────────────────────────
-- Run this once in Supabase SQL editor.
--
-- Schema:
--   community_posts — admin-authored posts (one row per article).
--
-- Storage:
--   community-covers — public bucket for cover images. Created below.
--
-- Permissions:
--   - SELECT: anyone (anonymous + authenticated). Public feed.
--   - INSERT/UPDATE/DELETE: only authenticated users in the `admins` table.

-- ── Table ───────────────────────────────────────────────────────────────
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

-- Indexes for common queries.
create index if not exists community_posts_status_published_idx
  on public.community_posts (status, published_at desc);
create index if not exists community_posts_category_idx
  on public.community_posts (category, published_at desc);

-- Auto-update updated_at on row edit.
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

-- ── Row-Level Security ──────────────────────────────────────────────────
alter table public.community_posts enable row level security;

-- Anyone can read published posts (public feed).
drop policy if exists "community_posts_public_read" on public.community_posts;
create policy "community_posts_public_read"
  on public.community_posts for select
  using (status = 'published');

-- Admins can read any post (including drafts).
drop policy if exists "community_posts_admin_read_all" on public.community_posts;
create policy "community_posts_admin_read_all"
  on public.community_posts for select
  using (
    auth.uid() in (select id from public.admins)
  );

-- Admins can insert / update / delete.
drop policy if exists "community_posts_admin_write" on public.community_posts;
create policy "community_posts_admin_write"
  on public.community_posts for all
  using (auth.uid() in (select id from public.admins))
  with check (auth.uid() in (select id from public.admins));

-- ── Storage bucket for cover images ─────────────────────────────────────
-- (Idempotent — won't error if bucket already exists.)
insert into storage.buckets (id, name, public)
values ('community-covers', 'community-covers', true)
on conflict (id) do nothing;

-- Storage policies: public read, admin-only write.
drop policy if exists "community_covers_public_read" on storage.objects;
create policy "community_covers_public_read"
  on storage.objects for select
  using (bucket_id = 'community-covers');

drop policy if exists "community_covers_admin_write" on storage.objects;
create policy "community_covers_admin_write"
  on storage.objects for insert
  with check (
    bucket_id = 'community-covers'
    and auth.uid() in (select id from public.admins)
  );

drop policy if exists "community_covers_admin_update" on storage.objects;
create policy "community_covers_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'community-covers'
    and auth.uid() in (select id from public.admins)
  );

drop policy if exists "community_covers_admin_delete" on storage.objects;
create policy "community_covers_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'community-covers'
    and auth.uid() in (select id from public.admins)
  );
