-- ============================================================
-- MHIDA migration 11 — rename course_lessons.week to .day
-- The English course was reorganized from a 30-week to a 30-day
-- program; this renames the underlying column to match (values
-- 1-30 stay the same, only the column name/meaning changes).
-- Paste into Supabase SQL Editor and Run.
-- Run BEFORE re-running the updated course_seed.sql.
-- ============================================================

alter table public.course_lessons rename column week to day;
