-- User Management migration
--
-- Enables the admin panel's User Management screen to:
--   • Update any office_users row (name / role / department / is_active)
--   • Reassign tasks by updating office_tasks.user_id
--   • Keep realtime sync working for both tables
--
-- Also wires realtime publication for office_tasks so the earlier delete-sync
-- fix actually fires when admins delete rows.
--
-- Run in Supabase → SQL Editor.

-- ─────────────────────────────────────────────────────────────
-- 1. Realtime publication — office_tasks must be in supabase_realtime
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.office_tasks;
-- ignore the "already exists" error if it's already published.

-- ─────────────────────────────────────────────────────────────
-- 2. RLS: admins can update any office_users row; users can only read
-- ─────────────────────────────────────────────────────────────
alter table public.office_users enable row level security;

-- Drop old policies if you are re-running this script.
drop policy if exists "office_users_admin_update" on public.office_users;
drop policy if exists "office_users_self_read" on public.office_users;
drop policy if exists "office_users_admin_read_all" on public.office_users;

-- Everyone can read their own row.
create policy "office_users_self_read"
  on public.office_users
  for select
  using (id = auth.uid());

-- Admins can read every row.
create policy "office_users_admin_read_all"
  on public.office_users
  for select
  using (
    exists (
      select 1 from public.office_users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Admins can update any row (name, role, department, is_active).
-- Non-admins may update only their own non-privileged fields via a separate policy if you add one later.
create policy "office_users_admin_update"
  on public.office_users
  for update
  using (
    exists (
      select 1 from public.office_users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.office_users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. RLS: admins can reassign tasks (update user_id on office_tasks)
-- ─────────────────────────────────────────────────────────────
alter table public.office_tasks enable row level security;

drop policy if exists "office_tasks_admin_update_any" on public.office_tasks;

-- Admins can update any office_tasks row (includes reassigning via user_id).
create policy "office_tasks_admin_update_any"
  on public.office_tasks
  for update
  using (
    exists (
      select 1 from public.office_users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  )
  with check (true);

-- ─────────────────────────────────────────────────────────────
-- 4. Deactivated users should lose access — add a simple select gate on office_tasks.
-- ─────────────────────────────────────────────────────────────
-- If you have an existing select policy on office_tasks, this is a no-op; skip otherwise.

drop policy if exists "office_tasks_active_only_select" on public.office_tasks;
create policy "office_tasks_active_only_select"
  on public.office_tasks
  for select
  using (
    -- Admins see everything.
    exists (
      select 1 from public.office_users u
      where u.id = auth.uid() and u.role = 'admin'
    )
    -- Active employees see their own tasks only.
    or (
      user_id = auth.uid()
      and exists (
        select 1 from public.office_users u
        where u.id = auth.uid() and u.is_active is not false
      )
    )
  );

-- ─────────────────────────────────────────────────────────────
-- Done. Verify in Supabase → Database → Tables → office_users → Policies.
-- ─────────────────────────────────────────────────────────────
