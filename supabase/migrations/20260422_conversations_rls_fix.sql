-- Fixes the "infinite recursion detected in policy for relation 'conversation_members'"
-- error. The select/update policies queried conversation_members inside conversation_members's
-- own policy — Postgres aborts to prevent infinite loops.
--
-- Solution: move the "is member of conversation" check into a SECURITY DEFINER
-- function that bypasses RLS on its internal query.
--
-- Run once in Supabase → SQL Editor.

-- ─────────────────────────────────────────────────────────────
-- 1. Helper function (runs as function-owner, bypasses RLS internally).
-- ─────────────────────────────────────────────────────────────
create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_conversation_moderator(p_conversation_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.conversation_members
    where conversation_id = p_conversation_id
      and user_id = auth.uid()
      and role in ('admin', 'moderator')
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. Rebuild conversation_members policies using the helpers.
-- ─────────────────────────────────────────────────────────────
drop policy if exists "conversation_members_select" on public.conversation_members;
drop policy if exists "conversation_members_update_admin" on public.conversation_members;

create policy "conversation_members_select"
  on public.conversation_members
  for select
  using (
    public.is_admin()
    or user_id = auth.uid()
    or public.is_conversation_member(conversation_id)
  );

create policy "conversation_members_update_admin"
  on public.conversation_members
  for update
  using (
    public.is_admin()
    or user_id = auth.uid()
    or public.is_conversation_moderator(conversation_id)
  )
  with check (true);

-- ─────────────────────────────────────────────────────────────
-- 3. Also fix conversations policies — they had the same self-referencing
--    shape. Replace exists(...) with the helper.
-- ─────────────────────────────────────────────────────────────
drop policy if exists "conversations_select_member" on public.conversations;
drop policy if exists "conversations_update_admin_or_owner" on public.conversations;
drop policy if exists "conversations_delete_admin_or_owner" on public.conversations;

create policy "conversations_select_member"
  on public.conversations
  for select
  using (
    created_by = auth.uid()
    or public.is_admin()
    or public.is_conversation_member(id)
  );

create policy "conversations_update_admin_or_owner"
  on public.conversations
  for update
  using (
    created_by = auth.uid()
    or public.is_admin()
    or public.is_conversation_moderator(id)
  )
  with check (true);

create policy "conversations_delete_admin_or_owner"
  on public.conversations
  for delete
  using (
    created_by = auth.uid()
    or public.is_admin()
    or public.is_conversation_moderator(id)
  );

-- ─────────────────────────────────────────────────────────────
-- Verify
-- ─────────────────────────────────────────────────────────────
select 'Recursive policies replaced. Reload the app.' as status;
