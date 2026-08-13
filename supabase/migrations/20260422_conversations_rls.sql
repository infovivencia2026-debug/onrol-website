-- Fixes the 403 on POST /conversations by letting any authenticated user
-- create conversations they own (RLS check: created_by = auth.uid()).
-- Also unblocks admin moderation on conversation_members (insert + update).
--
-- Run once in Supabase → SQL Editor.

-- ─────────────────────────────────────────────────────────────
-- conversations: authenticated users can INSERT their own row,
-- members can SELECT / UPDATE rows they belong to, admins can do anything.
-- ─────────────────────────────────────────────────────────────
alter table public.conversations enable row level security;

drop policy if exists "conversations_insert_own" on public.conversations;
drop policy if exists "conversations_select_member" on public.conversations;
drop policy if exists "conversations_update_admin_or_owner" on public.conversations;
drop policy if exists "conversations_delete_admin_or_owner" on public.conversations;

-- INSERT: anyone authenticated can create a conversation as long as they're the creator.
create policy "conversations_insert_own"
  on public.conversations
  for insert
  with check (created_by = auth.uid() or public.is_admin());

-- SELECT: the creator, any member of the conversation, or an admin.
create policy "conversations_select_member"
  on public.conversations
  for select
  using (
    created_by = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = id and cm.user_id = auth.uid()
    )
  );

-- UPDATE: creator, admin, or moderator of that conversation.
create policy "conversations_update_admin_or_owner"
  on public.conversations
  for update
  using (
    created_by = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = id
        and cm.user_id = auth.uid()
        and cm.role in ('admin', 'moderator')
    )
  )
  with check (true);

-- DELETE: creator, admin, or moderator of that conversation.
create policy "conversations_delete_admin_or_owner"
  on public.conversations
  for delete
  using (
    created_by = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = id
        and cm.user_id = auth.uid()
        and cm.role in ('admin', 'moderator')
    )
  );

-- ─────────────────────────────────────────────────────────────
-- conversation_members: creator of a conversation can seed members,
-- admins can manage anyone, existing members can see each other.
-- ─────────────────────────────────────────────────────────────
alter table public.conversation_members enable row level security;

drop policy if exists "conversation_members_insert" on public.conversation_members;
drop policy if exists "conversation_members_select" on public.conversation_members;
drop policy if exists "conversation_members_update_admin" on public.conversation_members;
-- delete policy was already created in 20260422_admin_cascade.sql — keep it.

create policy "conversation_members_insert"
  on public.conversation_members
  for insert
  with check (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.created_by = auth.uid()
    )
  );

create policy "conversation_members_select"
  on public.conversation_members
  for select
  using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.conversation_members me
      where me.conversation_id = conversation_members.conversation_id
        and me.user_id = auth.uid()
    )
  );

create policy "conversation_members_update_admin"
  on public.conversation_members
  for update
  using (
    public.is_admin()
    or user_id = auth.uid()
    or exists (
      select 1 from public.conversation_members me
      where me.conversation_id = conversation_members.conversation_id
        and me.user_id = auth.uid()
        and me.role in ('admin', 'moderator')
    )
  )
  with check (true);

-- ─────────────────────────────────────────────────────────────
-- Verify: admin should be able to insert a test conversation.
-- (Safe no-op test you can run as admin.)
-- ─────────────────────────────────────────────────────────────
select 'RLS policies applied. Reload the app and try Create Group again.' as status;
