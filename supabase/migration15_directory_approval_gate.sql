-- ============================================================
-- MHIDA migration 15 — admin approval gate for the member directory
-- Paste into Supabase SQL Editor and Run.
--
-- Problem (security review finding): any logged-in member — including
-- a brand-new, unvetted self-registration — could call
-- facility_members() for ANY workplace and get back full contact
-- details (email, phone) for every member there. Combined with the
-- public facility_stats() list of every workplace name, one throwaway
-- account could script a full scrape of the member directory.
--
-- Fix: new signups now start as status = 'pending' instead of
-- 'active' (the members table already had this status column and an
-- admin-only column-protection trigger — it just wasn't being used
-- yet). Only 'active' members can query facility_members(); pending
-- members can still log in and use their dashboard/courses as normal,
-- they just can't browse the member directory until an admin approves
-- them from the Member Management page.
--
-- Existing members are untouched (they already default to 'active'
-- from the column default) — this only changes behavior for new
-- registrations going forward.
-- ============================================================

-- New signups start pending, awaiting admin approval for directory access.
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
    upgrade_requested, status
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
    coalesce(new.raw_user_meta_data ->> 'membership', '') = 'professional',
    'pending'
  );
  return new;
end;
$$;

-- facility_members() now also requires the CALLER's own row to be
-- 'active' (or the caller to be an admin) — not just that the target
-- member being looked up is active. Server-side enforcement, so this
-- holds even if the client UI is bypassed.
create or replace function public.facility_members(p_workplace text)
returns table (
  member_id text, first_name text, last_name text,
  "position" text, membership text, email text, phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select member_id, first_name, last_name, "position", membership, email, phone
  from public.members
  where workplace = p_workplace
    and status = 'active'
    and (
      public.is_admin()
      or exists (
        select 1 from public.members caller
        where caller.id = auth.uid() and caller.status = 'active'
      )
    )
  order by member_id
$$;

grant execute on function public.facility_members(text) to authenticated;
