-- ============================================================
-- MHIDA migration 3 — news posts + photo storage
-- Paste into Supabase SQL Editor and Run (after migration 2).
-- ============================================================

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null default '',
  image_urls text[] not null default '{}',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news enable row level security;

-- Anyone (including logged-out visitors) can read published posts.
drop policy if exists "public read published news" on public.news;
create policy "public read published news"
  on public.news for select
  using (published);

-- Admins can do everything (create, edit, unpublish, delete).
drop policy if exists "admins manage news" on public.news;
create policy "admins manage news"
  on public.news for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Photo storage ----------
insert into storage.buckets (id, name, public)
values ('news-photos', 'news-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read news photos" on storage.objects;
create policy "public read news photos"
  on storage.objects for select
  using (bucket_id = 'news-photos');

drop policy if exists "admins upload news photos" on storage.objects;
create policy "admins upload news photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'news-photos' and public.is_admin());

drop policy if exists "admins update news photos" on storage.objects;
create policy "admins update news photos"
  on storage.objects for update to authenticated
  using (bucket_id = 'news-photos' and public.is_admin());

drop policy if exists "admins delete news photos" on storage.objects;
create policy "admins delete news photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'news-photos' and public.is_admin());
