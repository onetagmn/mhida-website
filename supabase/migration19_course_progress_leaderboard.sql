-- ============================================================
-- MHIDA migration 19 — English course progress leaderboard
-- Paste into Supabase SQL Editor and Run.
--
-- Adds two read-only functions for the new homepage widget +
-- detailed progress table:
--
-- 1. course_progress_stats() — AGGREGATE ONLY (no names), public
--    (anon + authenticated). Powers the small homepage infographic
--    card: how many members are enrolled, how many finished, and the
--    average day reached out of the 30-day course.
--
-- 2. course_progress_table() — full per-member breakdown (MD number,
--    name, days completed, last activity), granted to `authenticated`
--    ONLY — so the detailed table behind the homepage widget requires
--    being logged in, same pattern as course_progress itself. This is
--    not gated on approval status (unlike facility_members) since
--    course progress isn't the kind of personal contact info that
--    prompted the directory approval gate — any logged-in member can
--    see it, matching what was asked for.
-- ============================================================

create or replace function public.course_progress_stats()
returns table (
  total_lessons bigint,
  enrolled_members bigint,
  completed_members bigint,
  avg_completed numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with totals as (
    select count(*) as n from public.course_lessons
  ),
  per_member as (
    select cp.member_id as uid, count(*) filter (where cp.completed) as cnt
    from public.course_progress cp
    group by cp.member_id
  )
  select
    (select n from totals) as total_lessons,
    (select count(*) from per_member where cnt > 0) as enrolled_members,
    (select count(*) from per_member where cnt = (select n from totals) and (select n from totals) > 0) as completed_members,
    (select coalesce(round(avg(cnt), 1), 0) from per_member where cnt > 0) as avg_completed
$$;

grant execute on function public.course_progress_stats() to anon, authenticated;

create or replace function public.course_progress_table()
returns table (
  member_code text,
  first_name text,
  last_name text,
  completed_count bigint,
  total_lessons bigint,
  last_completed_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    m.member_id as member_code,
    m.first_name,
    m.last_name,
    coalesce(cp.cnt, 0) as completed_count,
    (select count(*) from public.course_lessons) as total_lessons,
    cp.last_at as last_completed_at
  from public.members m
  left join (
    select member_id as uid,
           count(*) filter (where completed) as cnt,
           max(completed_at) as last_at
    from public.course_progress
    group by member_id
  ) cp on cp.uid = m.id
  where m.status <> 'suspended'
  order by completed_count desc nulls last, m.member_id
$$;

grant execute on function public.course_progress_table() to authenticated;
