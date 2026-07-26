-- ============================================================
-- MHIDA migration 18 — fix facility_members() so approved members
-- (and admins) can actually see the directory again.
-- Paste into Supabase SQL Editor and Run.
--
-- Problem: migration15 added a CALLER-side check to facility_members()
-- (only admins or callers with status = 'active' may call it at all)
-- — that part was correct and is unchanged here. But the function's
-- pre-existing TARGET-row filter was still "status = 'active'", i.e.
-- it only ever returned members who are themselves active. Once
-- migration16 flipped everyone to 'pending', that filter started
-- matching almost nobody — so even an admin, or a freshly-approved
-- active member, calling facility_members() got back an empty list.
-- That's why personal info stopped showing up, with no message either
-- (the caller-side gate passed, the query itself just returned nothing).
--
-- Fix: same change as migration17 made to facility_stats() — the
-- target-row filter becomes "status <> 'suspended'" instead of
-- "status = 'active'", so approved callers see both active AND
-- pending members in the directory (only suspended members are
-- hidden). The caller-side approval gate is untouched: you still must
-- be an admin, or be 'active' yourself, to call this at all.
-- ============================================================

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
    and status <> 'suspended'
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
