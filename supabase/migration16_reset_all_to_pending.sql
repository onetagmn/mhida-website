-- ============================================================
-- MHIDA migration 16 — one-time reset: every existing member starts
-- 'pending' too, same as new signups now do.
-- Paste into Supabase SQL Editor and Run.
--
-- Run this AFTER migration15_directory_approval_gate.sql. This is a
-- one-time DATA change, not something you'd re-run — it flips every
-- current member's directory access off, so you approve each one
-- fresh from the Member Management page's new status buttons (⏳ / ✓ / ✕)
-- rather than everyone being grandfathered in as already-approved.
--
-- Admin accounts (is_admin = true) are left alone — is_admin() already
-- bypasses the directory-access check regardless of status, so
-- resetting an admin's own row would only be confusing to look at in
-- the admin table, not change anything functionally.
-- ============================================================

update public.members
set status = 'pending'
where is_admin = false;
