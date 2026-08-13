-- ONROL: Create First Admin Safely (avoid auth/admin mismatch)
--
-- Checklist
-- 1) In Supabase Dashboard -> Authentication -> Users:
--    - create/invite the admin user FIRST (or confirm it already exists)
--    - ensure email is confirmed
-- 2) Set target emails below and run this script in SQL Editor.
-- 3) Login from /task with that same auth email/password.
-- 4) If password is wrong, use "Reset password" from /task and complete update.
--
-- Notes
-- - This script does NOT create auth.users passwords.
-- - It links an existing auth user into public.office_users/admins safely.
-- - Re-running is safe (uses upsert/update logic).

begin;

do $$
declare
  target_email text;
  target_emails text[] := array[
    'admin@onrol.in',
    'neerajareddy@onrol.in'
  ]; -- TODO: replace with your real admin emails before running
  target_user_id uuid;
  missing_emails text[] := '{}';
  existing_office_user_id uuid;
begin
  foreach target_email in array target_emails loop
    -- 1) Verify auth user exists
    select id into target_user_id
    from auth.users
    where lower(trim(email)) = lower(trim(target_email))
    limit 1;

    if target_user_id is null then
      missing_emails := array_append(missing_emails, target_email);
      raise notice 'Skipped: no auth user found for email=%', target_email;
      continue;
    end if;

    -- 2) Ensure office_users role is admin (handles existing row by id OR by email)
    select id
      into existing_office_user_id
    from public.office_users
    where lower(trim(email)) = lower(trim(target_email))
    limit 1;

    if existing_office_user_id is not null and existing_office_user_id <> target_user_id then
      -- Email already mapped to another row id (common when invite/profile pre-created).
      -- Try to re-key that row to auth uid so auth.uid() checks work.
      update public.office_users
      set
        id = target_user_id,
        role = 'admin',
        is_active = true,
        department = coalesce(department, 'Operations'),
        full_name = coalesce(nullif(full_name, ''), coalesce((select nullif(raw_user_meta_data ->> 'full_name', '') from auth.users where id = target_user_id), split_part(target_email, '@', 1))),
        email = lower(target_email)
      where id = existing_office_user_id;
    elsif existing_office_user_id = target_user_id then
      update public.office_users
      set
        role = 'admin',
        is_active = true,
        department = coalesce(department, 'Operations'),
        full_name = coalesce(nullif(full_name, ''), coalesce((select nullif(raw_user_meta_data ->> 'full_name', '') from auth.users where id = target_user_id), split_part(target_email, '@', 1))),
        email = lower(target_email)
      where id = target_user_id;
    else
      insert into public.office_users (
        id, full_name, email, role, department, is_active
      ) values (
        target_user_id,
        coalesce((select nullif(raw_user_meta_data ->> 'full_name', '') from auth.users where id = target_user_id), split_part(target_email, '@', 1)),
        lower(target_email),
        'admin',
        'Operations',
        true
      )
      on conflict (id) do update
      set
        email = excluded.email,
        role = 'admin',
        is_active = true,
        department = coalesce(public.office_users.department, excluded.department),
        full_name = coalesce(nullif(public.office_users.full_name, ''), excluded.full_name);
    end if;

    -- 3) Ensure admins table entry (if table exists in this workspace)
    if to_regclass('public.admins') is not null then
      insert into public.admins (id, email, full_name, role)
      values (
        target_user_id,
        lower(target_email),
        coalesce((select full_name from public.office_users where id = target_user_id), split_part(target_email, '@', 1)),
        'super_admin'
      )
      on conflict (id) do update
      set
        email = excluded.email,
        full_name = excluded.full_name,
        role = 'super_admin';
    end if;

    -- 4) Ensure community_members admin row (if table exists)
    if to_regclass('public.community_members') is not null then
      insert into public.community_members (id, email, full_name, status, member_type, updated_at)
      values (
        target_user_id,
        lower(target_email),
        coalesce((select full_name from public.office_users where id = target_user_id), split_part(target_email, '@', 1)),
        'approved',
        'admin',
        now()
      )
      on conflict (id) do update
      set
        email = excluded.email,
        full_name = excluded.full_name,
        status = 'approved',
        member_type = 'admin',
        updated_at = now();
    end if;

    raise notice 'Admin linked successfully. auth_user_id=% email=%', target_user_id, lower(target_email);
  end loop;

  if coalesce(array_length(missing_emails, 1), 0) > 0 then
    raise warning 'Some emails were not found in auth.users: %', array_to_string(missing_emails, ', ');
  end if;
end $$;

commit;

-- Verification (run after commit)
-- select id, email, role, department, is_active from public.office_users where lower(email) = lower('admin@onrol.in');
-- select id, email, role from public.admins where lower(email) = lower('admin@onrol.in');
-- select id, email, member_type, status from public.community_members where lower(email) = lower('admin@onrol.in');
