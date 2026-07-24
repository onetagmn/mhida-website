-- ============================================================
-- MHIDA migration 2 — admin role + admin permissions
-- Paste into Supabase SQL Editor and Run (after schema.sql).
-- ============================================================

alter table public.members
  add column if not exists is_admin boolean not null default false;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.members where id = auth.uid()), false)
$$;

-- Admins can read and update every member row.
drop policy if exists "admins read all" on public.members;
create policy "admins read all"
  on public.members for select
  using (public.is_admin());

drop policy if exists "admins update all" on public.members;
create policy "admins update all"
  on public.members for update
  using (public.is_admin())
  with check (public.is_admin());

-- Loosen the protected-columns trigger for admins: an admin may change
-- membership / status / paid-until; ordinary members still cannot.
create or replace function public.protect_member_columns()
returns trigger
language plpgsql
as $$
begin
  if not public.is_admin() then
    if new.member_no is distinct from old.member_no
       or new.membership is distinct from old.membership
       or new.membership_paid_until is distinct from old.membership_paid_until
       or new.status is distinct from old.status
       or new.is_admin is distinct from old.is_admin then
      raise exception 'protected column';
    end if;
  else
    -- even admins cannot change member numbers or grant admin via the API
    if new.member_no is distinct from old.member_no
       or new.is_admin is distinct from old.is_admin then
      raise exception 'protected column';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- AFTER RUNNING THIS: make your own account the admin.
-- Replace the email below with the email you registered with
-- on the website, then run this single line:
--
--   update public.members set is_admin = true
--   where email = 'hida.mng@gmail.com';
-- ============================================================
