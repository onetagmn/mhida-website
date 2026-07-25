-- ============================================================
-- MHIDA migration 14 — close the "free Professional membership" gap
-- Paste into Supabase SQL Editor and Run.
--
-- Problem: the signup trigger (handle_new_user) trusted the client-
-- supplied "membership" value directly, so anyone selecting
-- "Professional" on the registration form (or calling the signup API
-- directly) became a paid-tier member instantly — with no payment
-- verification — which also made them eligible for the free
-- professional courses and the funded Taipei trainings for free.
--
-- Fix: every new signup is now always created as 'regular'. If the
-- person selected "Professional" at registration, we instead mark
-- upgrade_requested = true, so it shows up in the admin dashboard's
-- existing "pending upgrade" flow (the same amber badge used when an
-- existing member later requests an upgrade) — an admin must verify
-- the payment and confirm the tier via the existing toggle, exactly
-- like every other professional-tier upgrade.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.members (
    id, member_no, last_name, first_name, birth_date, gender, province,
    workplace, "position", years_worked, facebook, email, phone, membership,
    upgrade_requested
  )
  values (
    new.id,
    nextval('public.member_no_seq'),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    nullif(new.raw_user_meta_data ->> 'gender', ''),
    nullif(new.raw_user_meta_data ->> 'province', ''),
    nullif(new.raw_user_meta_data ->> 'workplace', ''),
    nullif(new.raw_user_meta_data ->> 'position', ''),
    nullif(new.raw_user_meta_data ->> 'years_worked', ''),
    nullif(new.raw_user_meta_data ->> 'facebook', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'regular',
    coalesce(new.raw_user_meta_data ->> 'membership', '') = 'professional'
  );
  return new;
end;
$$;
