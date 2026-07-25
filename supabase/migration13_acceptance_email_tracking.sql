-- ============================================================
-- MHIDA migration 13 — track training-acceptance emails
-- Prevents the congratulations email from firing more than once per
-- application unless an admin explicitly clicks "Resend".
-- Paste into Supabase SQL Editor and Run.
-- ============================================================

alter table public.training_applications
  add column if not exists acceptance_email_sent_at timestamptz;
