-- ============================================================
-- MHIDA migration 8 — membership upgrade requests + partnership content
-- Paste into Supabase SQL Editor and Run.
-- ============================================================

-- Members can flag "I have paid" from their dashboard; admins see the
-- flag, verify the bank transfer, and toggle the tier.
alter table public.members
  add column if not exists upgrade_requested boolean not null default false;

-- Allow the 'partnership' section (About page TIHTC block) in content_items.
alter table public.content_items
  drop constraint if exists content_items_section_check;
alter table public.content_items
  add constraint content_items_section_check
  check (section in ('axis', 'ehealth', 'english', 'legal', 'partnership'));
