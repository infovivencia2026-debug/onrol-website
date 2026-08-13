-- Admin cascade: lets admins remove members from conversations (needed by
-- "Remove from group" + "Deactivate user" flows), and keeps inactive users
-- hidden from any RLS-protected surface.
--
-- Run once in Supabase → SQL Editor.

-- ─────────────────────────────────────────────────────────────
-- 1. conversation_members: admin can delete any row
-- ─────────────────────────────────────────────────────────────
alter table public.conversation_members enable row level security;

drop policy if exists "conversation_members_admin_delete" on public.conversation_members;
create policy "conversation_members_admin_delete"
  on public.conversation_members
  for delete
  using (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 2. Auto-clean on deactivation — a trigger, so future deactivations
--    via any path (UI, SQL, Edge Function) stay consistent.
-- ─────────────────────────────────────────────────────────────
create or replace function public.cascade_user_deactivation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only fire when is_active flips from true/null to false.
  if (coalesce(old.is_active, true) = true) and (new.is_active is false) then
    delete from public.conversation_members where user_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cascade_user_deactivation on public.office_users;
create trigger trg_cascade_user_deactivation
  after update of is_active on public.office_users
  for each row
  execute function public.cascade_user_deactivation();

-- ─────────────────────────────────────────────────────────────
-- 3. Optional: one-time backfill — if any already-inactive users
--    still linger in conversation_members, clean them now.
-- ─────────────────────────────────────────────────────────────
delete from public.conversation_members cm
using public.office_users u
where cm.user_id = u.id and u.is_active is false;

-- ─────────────────────────────────────────────────────────────
-- Verify
-- ─────────────────────────────────────────────────────────────
select
  (select count(*) from public.office_users where is_active is false) as inactive_users,
  (select count(*) from public.conversation_members cm
     join public.office_users u on u.id = cm.user_id
     where u.is_active is false) as orphan_memberships;
-- Expected: orphan_memberships = 0 after this script.
