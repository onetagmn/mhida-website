-- ============================================================
-- MHIDA migration 9 — partner/social logo links (homepage row)
-- Paste into Supabase SQL Editor and Run.
-- ============================================================

create table if not exists public.partner_links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text not null,
  url text not null,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

alter table public.partner_links enable row level security;

drop policy if exists "public read partner links" on public.partner_links;
create policy "public read partner links"
  on public.partner_links for select using (true);

drop policy if exists "admins manage partner links" on public.partner_links;
create policy "admins manage partner links"
  on public.partner_links for all
  using (public.is_admin()) with check (public.is_admin());
