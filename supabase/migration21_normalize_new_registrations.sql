-- ============================================================
-- MHIDA migration 21 — normalize name capitalization & phone format
-- for all NEW member registrations, going forward only.
-- Paste into Supabase SQL Editor and Run.
--
-- What this changes:
--   - first_name / last_name are automatically UPPERCASED at signup,
--     no matter what casing the person typed on the registration form.
--   - phone has every non-digit character stripped (spaces, dashes,
--     parentheses, +976, etc.) so it's stored as plain digits only,
--     e.g. "9964-6419" -> "99646419".
--
-- What this does NOT do:
--   - It does not touch any existing member row. This only redefines
--     the trigger that runs when a brand-new auth user is created
--     (i.e. only fires on NEW registrations from now on).
--   - It does not change updated_at on anyone, existing or new — this
--     is an INSERT-time trigger, completely separate from the
--     protect_member_columns() trigger that stamps updated_at on
--     UPDATEs. No existing row is read, written, or touched at all.
--   - Everything else about signup (status starts 'pending', 'regular'
--     membership with upgrade_requested flag for Professional
--     selections, etc.) is unchanged from migration15 — only the two
--     formatting rules above are added.
--
-- This is safe to run any time; it only affects people who register
-- AFTER you run it.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.members (
    id, member_no, last_name, first_name, birth_date, gender, province,
    workplace, "position", years_worked, facebook, email, phone, membership,
    upgrade_requested, status
  )
  values (
    new.id,
    nextval('public.member_no_seq'),
    upper(coalesce(new.raw_user_meta_data ->> 'last_name', '')),
    upper(coalesce(new.raw_user_meta_data ->> 'first_name', '')),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    nullif(new.raw_user_meta_data ->> 'gender', ''),
    nullif(new.raw_user_meta_data ->> 'province', ''),
    nullif(new.raw_user_meta_data ->> 'workplace', ''),
    nullif(new.raw_user_meta_data ->> 'position', ''),
    nullif(new.raw_user_meta_data ->> 'years_worked', ''),
    nullif(new.raw_user_meta_data ->> 'facebook', ''),
    new.email,
    nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'phone', ''), '\D', '', 'g'), ''),
    'regular',
    coalesce(new.raw_user_meta_data ->> 'membership', '') = 'professional',
    'pending'
  );
  return new;
end;
$$;
