-- ============================================================
-- MHIDA member database — initial schema (Phase 2)
-- Paste this whole file into Supabase: SQL Editor → New query → Run
-- Safe to run once on a fresh project.
-- ============================================================

-- Member numbers for NEW website registrations start at 250, leaving
-- room below for the historical import (MD001–MD218 existing members
-- plus MD219–MD245 proposed for members currently without an ID).
create sequence if not exists public.member_no_seq start 250;

create table if not exists public.members (
  id uuid primary key references auth.users (id) on delete cascade,
  member_no integer unique not null,
  member_id text generated always as ('MD' || lpad(member_no::text, 3, '0')) stored,
  last_name text not null default '',
  first_name text not null default '',
  birth_date date,
  gender text,
  province text,
  workplace text,
  "position" text,
  years_worked text,
  facebook text,
  email text,
  phone text,
  membership text not null default 'regular' check (membership in ('regular', 'professional')),
  membership_paid_until date,          -- set once QPay payments exist
  status text not null default 'active' check (status in ('active', 'pending', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.members is 'MHIDA member profiles; one row per auth user. member_id (MD###) is derived from member_no.';

-- ---------- Row Level Security ----------
alter table public.members enable row level security;

-- Members can read their own profile.
create policy "members read own row"
  on public.members for select
  using (auth.uid() = id);

-- Members can update their own contact details (not their ID/membership).
-- Column-level restriction is enforced by the trigger below.
create policy "members update own row"
  on public.members for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert/delete policies: rows are created only by the signup trigger
-- (which runs as definer) and removed only via auth user deletion.

-- Prevent members from changing protected columns.
create or replace function public.protect_member_columns()
returns trigger
language plpgsql
as $$
begin
  if new.member_no is distinct from old.member_no
     or new.membership is distinct from old.membership
     or new.membership_paid_until is distinct from old.membership_paid_until
     or new.status is distinct from old.status then
    raise exception 'protected column';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_protect_member_columns on public.members;
create trigger trg_protect_member_columns
  before update on public.members
  for each row execute function public.protect_member_columns();

-- ---------- Auto-create a member row on signup ----------
-- The registration form passes all profile fields as user metadata;
-- this trigger turns each new auth user into a member row and assigns
-- the next member number automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- NOTE: this is the original bootstrap version of this trigger, kept
  -- here for historical reference. The live database redefines this
  -- function via migration14_registration_payment_gate.sql, which stops
  -- trusting the client-supplied "membership" value and routes
  -- Professional signups through admin payment verification instead —
  -- apply the migrations in order rather than running this file alone.
  insert into public.members (
    id, member_no, last_name, first_name, birth_date, gender, province,
    workplace, "position", years_worked, facebook, email, phone, membership
  )
  values (
    new.id,
    nextval('public.member_no_seq'),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'birth_date', '')::date,
    nullif(new.raw_user_meta_data ->> 'gender', ''),
    nullif(new.raw_user_meta_data ->> 'province', ''),
    nullif(new.raw_user_meta_data ->> 'workplace', ''),
    nullif(new.raw_user_meta_data ->> 'position', ''),
    nullif(new.raw_user_meta_data ->> 'years_worked', ''),
    nullif(new.raw_user_meta_data ->> 'facebook', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case
      when new.raw_user_meta_data ->> 'membership' = 'professional' then 'professional'
      else 'regular'
    end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
