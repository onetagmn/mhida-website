-- ============================================================
-- MHIDA migration 5 — interactive map data functions
-- Paste into Supabase SQL Editor and Run.
-- ============================================================

-- Public (no login needed): facilities per province with member COUNTS
-- only — no personal data crosses this boundary.
create or replace function public.facility_stats()
returns table (province text, workplace text, member_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select province, workplace, count(*)::bigint
  from public.members
  where workplace is not null and status = 'active'
  group by province, workplace
$$;

grant execute on function public.facility_stats() to anon, authenticated;

-- Members-only: who works at a given facility. Returns nothing unless
-- the caller is logged in.
create or replace function public.facility_members(p_workplace text)
returns table (member_id text, first_name text, last_name text, "position" text, membership text)
language sql
stable
security definer
set search_path = public
as $$
  select member_id, first_name, last_name, "position", membership
  from public.members
  where workplace = p_workplace
    and status = 'active'
    and auth.uid() is not null
  order by member_id
$$;

grant execute on function public.facility_members(text) to authenticated;
