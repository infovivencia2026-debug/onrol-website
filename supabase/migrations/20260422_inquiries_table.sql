-- Captures public homepage inquiries from the contact + application forms.
--
-- Run once in Supabase → SQL Editor.

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null,                     -- "contact" | "video_application" | "hero" | etc.
  full_name text,
  email text,
  phone text,
  role text,                                -- free-text (Student / Professional / Founder)
  occupation text,                          -- from the hero application form select
  city text,
  interest text,                            -- which program / option they're interested in
  message text,
  status text not null default 'new',       -- 'new' | 'contacted' | 'converted' | 'closed'
  metadata jsonb default '{}'::jsonb,       -- user agent, page, utm, etc.
  handled_by uuid references public.office_users(id) on delete set null,
  handled_at timestamptz
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_status_idx on public.inquiries (status);
create index if not exists inquiries_email_idx on public.inquiries (email);

-- RLS: anonymous + authenticated can INSERT; only admins can SELECT/UPDATE/DELETE.
alter table public.inquiries enable row level security;

drop policy if exists "inquiries_public_insert" on public.inquiries;
create policy "inquiries_public_insert"
  on public.inquiries
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "inquiries_admin_select" on public.inquiries;
create policy "inquiries_admin_select"
  on public.inquiries
  for select
  using (public.is_admin());

drop policy if exists "inquiries_admin_update" on public.inquiries;
create policy "inquiries_admin_update"
  on public.inquiries
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "inquiries_admin_delete" on public.inquiries;
create policy "inquiries_admin_delete"
  on public.inquiries
  for delete
  using (public.is_admin());

select 'inquiries table ready.' as status;
