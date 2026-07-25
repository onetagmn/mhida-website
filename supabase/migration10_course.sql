-- ============================================================
-- MHIDA migration 10 — English course: lessons + member progress
-- Paste into Supabase SQL Editor and Run.
-- (Lesson CONTENT is seeded separately by course_seed.sql)
-- ============================================================

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  week int not null,
  lesson_no int not null default 1,
  title text not null,
  title_mn text not null default '',
  video_url text,
  content jsonb not null default '{}',
  published boolean not null default true,
  unique (week, lesson_no)
);

alter table public.course_lessons enable row level security;

-- Lessons are for logged-in members only (the whole point of the login).
drop policy if exists "members read lessons" on public.course_lessons;
create policy "members read lessons"
  on public.course_lessons for select
  to authenticated
  using (published);

drop policy if exists "admins manage lessons" on public.course_lessons;
create policy "admins manage lessons"
  on public.course_lessons for all
  using (public.is_admin()) with check (public.is_admin());

-- Per-member progress: one row per (member, lesson).
create table if not exists public.course_progress (
  member_id uuid not null references public.members (id) on delete cascade,
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  completed boolean not null default false,
  quiz_score int,
  quiz_total int,
  completed_at timestamptz,
  primary key (member_id, lesson_id)
);

alter table public.course_progress enable row level security;

drop policy if exists "members manage own progress" on public.course_progress;
create policy "members manage own progress"
  on public.course_progress for all
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

drop policy if exists "admins read all progress" on public.course_progress;
create policy "admins read all progress"
  on public.course_progress for select
  using (public.is_admin());
