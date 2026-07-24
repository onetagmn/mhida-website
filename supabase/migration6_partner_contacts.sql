-- ============================================================
-- MHIDA migration 6 — partner news category + PDFs, richer map contacts
-- Paste into Supabase SQL Editor and Run.
-- ============================================================

-- News gains a category (regular news vs partner/training announcements)
-- and downloadable PDF attachments.
alter table public.news
  add column if not exists category text not null default 'news'
    check (category in ('news', 'partner')),
  add column if not exists pdf_urls text[] not null default '{}';

-- Seed the two existing TIHTC announcements as editable partner posts
-- (only if they haven't been created yet).
insert into public.news (title, body, category, pdf_urls, published)
select 'Healthcare Management & National Health Insurance Project Training',
  E'October 12–23, 2026 · Taipei, Taiwan\nӨргөдлийн эцсийн хугацаа / Application deadline: September 12, 2026\n\nMHIDA–TIHTC хамтын ажиллагааны хүрээнд гишүүн эмч нарт зориулсан сургалт.',
  'partner',
  array['docs/TIHTC_Healthcare_Management_2026.pdf'],
  true
where not exists (select 1 from public.news where category = 'partner');

insert into public.news (title, body, category, pdf_urls, published)
select 'Smart Healthcare & Sustainable Hospital Project Training',
  E'November 30 – December 5, 2026 · Taipei, Taiwan\nӨргөдлийн эцсийн хугацаа / Application deadline: October 30, 2026\n\nMHIDA–TIHTC хамтын ажиллагааны хүрээнд гишүүн эмч нарт зориулсан сургалт.',
  'partner',
  array['docs/TIHTC_Smart_Healthcare_2026.pdf'],
  true
where (select count(*) from public.news where category = 'partner') < 2;

-- Map: logged-in members can now also see each member's email + phone.
drop function if exists public.facility_members(text);
create function public.facility_members(p_workplace text)
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
    and auth.uid() is not null
  order by member_id
$$;

grant execute on function public.facility_members(text) to authenticated;
