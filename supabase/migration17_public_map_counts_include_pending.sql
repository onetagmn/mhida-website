-- ============================================================
-- MHIDA migration 17 — fix map coloring going blank after the
-- directory-approval reset (migration15/16).
-- Paste into Supabase SQL Editor and Run.
--
-- Problem: facility_stats() (the public, no-login-required function
-- that powers the province color-shading and member-count numbers on
-- the Map page and homepage) has always filtered to status = 'active'
-- — that was harmless while every member was 'active' by default, but
-- now that new/reset members start 'pending', the map went blank for
-- everyone until each member gets individually approved.
--
-- facility_stats() returns NO personal data (just province/workplace/
-- count), so it was never part of the actual security concern —
-- only facility_members() (names, emails, phones) needed the
-- approval gate, and that one is untouched by this migration.
--
-- Fix: facility_stats() now counts every member who isn't suspended
-- (i.e. both 'active' and 'pending' count), so map coloring works
-- immediately for everyone again regardless of approval status.
-- ============================================================

create or replace function public.facility_stats()
returns table (province text, workplace text, member_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select province, workplace, count(*)::bigint
  from public.members
  where workplace is not null and status <> 'suspended'
  group by province, workplace
$$;

grant execute on function public.facility_stats() to anon, authenticated;
