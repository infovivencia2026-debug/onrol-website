-- Webinar registrations — Career Catalyst landing form.
-- Run on the self-hosted Postgres (supabase-db container).
-- Idempotent — safe to re-run.

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

drop policy if exists "webinar_registrations_anon_insert" on public.webinar_registrations;
drop policy if exists "webinar_registrations_admin_read" on public.webinar_registrations;

-- Anyone (anon) can submit the form.
create policy "webinar_registrations_anon_insert"
  on public.webinar_registrations for insert
  to anon, authenticated
  with check (true);

-- Only admins can read the submissions back out.
create policy "webinar_registrations_admin_read"
  on public.webinar_registrations for select
  using (auth.uid() in (select id from public.admins));

-- Grant explicit permissions to the anon and authenticated roles
-- (PostgREST relies on these alongside RLS).
grant insert on public.webinar_registrations to anon, authenticated;
grant usage, select on sequence public.webinar_registrations_id_seq to anon, authenticated;
grant select on public.webinar_registrations to authenticated;
