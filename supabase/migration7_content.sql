-- ============================================================
-- MHIDA migration 7 — leadership + editable page content
-- Paste into Supabase SQL Editor and Run.
-- ============================================================

-- Board / leadership members shown on the About page.
create table if not exists public.leadership (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null default '',
  photo_url text,
  is_president boolean not null default false,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

alter table public.leadership enable row level security;

drop policy if exists "public read leadership" on public.leadership;
create policy "public read leadership"
  on public.leadership for select using (true);

drop policy if exists "admins manage leadership" on public.leadership;
create policy "admins manage leadership"
  on public.leadership for all
  using (public.is_admin()) with check (public.is_admin());

-- Editable content items for AXIS, e-Health, English course, and
-- Legal acts pages: title + text (YouTube links auto-embed) + PDFs.
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('axis', 'ehealth', 'english', 'legal')),
  title text not null,
  body text not null default '',
  pdf_urls text[] not null default '{}',
  sort_order int not null default 100,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.content_items enable row level security;

drop policy if exists "public read published content" on public.content_items;
create policy "public read published content"
  on public.content_items for select using (published);

drop policy if exists "admins manage content" on public.content_items;
create policy "admins manage content"
  on public.content_items for all
  using (public.is_admin()) with check (public.is_admin());
