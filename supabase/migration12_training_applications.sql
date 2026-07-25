-- ============================================================
-- MHIDA migration 12 — training applications (TIHTC etc.)
-- Lets Professional members apply to a "Partnership & News" training
-- post (e.g. the Taipei trainings) via a form on the site, and lets
-- admins review submissions.
-- Paste into Supabase SQL Editor and Run.
-- ============================================================

create table if not exists public.training_applications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  news_post_id uuid references public.news (id) on delete set null,
  -- Copied at submission time so the application still reads sensibly
  -- even if the news post is later edited or removed.
  training_title text not null,

  -- Personal information
  first_name text not null,
  middle_name text,
  last_name text not null,
  gender text,
  date_of_birth date,
  email text not null,
  official_email text,
  alternative_email text,
  mobile_phone text,
  facebook text,
  linkedin text,
  whatsapp text,
  medical_history text,
  food_allergies text,
  postal_address text,
  emergency_contact text,

  -- Occupation
  current_institution text,
  institution_category text,
  institution_type text,
  institution_description text,
  institution_website text,
  department text,
  current_position text,
  other_positions text,
  main_duties text,

  -- Education / language ability
  education_institution text,
  education_country text,
  major text,
  year_attained text,
  language_english text,
  language_mandarin text,

  status text not null default 'submitted'
    check (status in ('submitted', 'reviewed', 'accepted', 'declined')),
  created_at timestamptz not null default now(),

  unique (member_id, news_post_id)
);

alter table public.training_applications enable row level security;

-- Only Professional members can apply, and only for themselves.
drop policy if exists "professional members insert own application" on public.training_applications;
create policy "professional members insert own application"
  on public.training_applications for insert
  to authenticated
  with check (
    member_id = auth.uid()
    and exists (
      select 1 from public.members m
      where m.id = auth.uid() and m.membership = 'professional'
    )
  );

drop policy if exists "members read own applications" on public.training_applications;
create policy "members read own applications"
  on public.training_applications for select
  to authenticated
  using (member_id = auth.uid());

drop policy if exists "admins manage applications" on public.training_applications;
create policy "admins manage applications"
  on public.training_applications for all
  using (public.is_admin())
  with check (public.is_admin());
