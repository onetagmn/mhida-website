-- ============================================================
-- MHIDA — bulk import of members from MHIDA_Register20260821_09_53_03.xlsx
-- Paste into Supabase SQL Editor and Run.
--
-- What this does, per person:
--   1. Skips them entirely if a member with that email already exists
--      in auth.users — safe to re-run, will never create duplicates.
--   2. Creates a real, email-confirmed login account with no password
--      set — matches the site's magic-link login, so they can sign in
--      right away with "Send sign-in link" using this exact email.
--   3. The site's existing on_auth_user_created trigger fires
--      automatically and creates their public.members profile row —
--      status = 'pending' (they'll show up in Member Management for
--      you to approve, same as any normal signup) and
--      membership = 'regular' for everyone.
--   4. Re-numbers member_no to match their original MD### club ID from
--      the spreadsheet, IF that number isn't already taken by an
--      existing member — otherwise leaves the auto-assigned number
--      and raises a NOTICE so you can see it and fix it by hand.
--
-- Notes on the source data:
--   - Rows for MD214 and MD215 in the sheet were the same person
--     (Уранчимэг Цэдэн-Иш — identical email/phone), submitted twice.
--     Only the later, more complete submission is imported, as MD215.
--     MD214 is skipped entirely.
--   - Энхжаргал Бэлэгбадрах (MD219) selected the paid "Мэргэжлийн"
--     tier. Per the site's existing payment-gate logic, this does NOT
--     grant professional membership automatically — it's recorded as
--     an upgrade request (the same amber "pending upgrade" badge used
--     everywhere else), so you confirm the payment and approve the
--     upgrade from the admin page like any other request.
-- ============================================================

create extension if not exists pgcrypto;

do $$
declare
  v_email text;
  v_user_id uuid;
  v_target_no int;
begin

  -- ---------- Уранчимэг Цэдэн-Иш — MD215 ----------
  v_email := 'urnaa.0911urnaa@gmail.com';
  v_target_no := 215;
  if not exists (select 1 from auth.users where lower(email) = v_email) then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'first_name', 'Уранчимэг', 'last_name', 'Цэдэн-Иш',
        'birth_date', '1985-09-11', 'gender', 'female',
        'workplace', 'ГТЭМТ', 'position', 'Даатгалын эмч',
        'years_worked', 'Одоо', 'facebook', 'Uranchimeg TsedenIsh',
        'phone', '9964-6419', 'membership', 'regular'
      ),
      now(), now(), '', '', '', ''
    );
    if not exists (select 1 from public.members where member_no = v_target_no) then
      update public.members set member_no = v_target_no where id = v_user_id;
    else
      raise notice 'MD% already taken — % kept its auto-assigned number.', v_target_no, v_email;
    end if;
  else
    raise notice 'Skipped % — already exists.', v_email;
  end if;

  -- ---------- Солонго Ганхуяг — MD216 ----------
  v_email := 'soko6525@gmail.com';
  v_target_no := 216;
  if not exists (select 1 from auth.users where lower(email) = v_email) then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'first_name', 'Солонго', 'last_name', 'Ганхуяг',
        'birth_date', '1992-07-02', 'gender', 'female',
        'workplace', 'Налайх эрүүл мэндийн төв', 'position', 'Даатгалын эмч',
        'years_worked', '2026.07.01', 'facebook', 'Solongo ganaa',
        'phone', '8044-2002', 'membership', 'regular'
      ),
      now(), now(), '', '', '', ''
    );
    if not exists (select 1 from public.members where member_no = v_target_no) then
      update public.members set member_no = v_target_no where id = v_user_id;
    else
      raise notice 'MD% already taken — % kept its auto-assigned number.', v_target_no, v_email;
    end if;
  else
    raise notice 'Skipped % — already exists.', v_email;
  end if;

  -- ---------- Байгалмаа Бадамханд — MD217 ----------
  v_email := 'b.badamkhand4@gmail.com';
  v_target_no := 217;
  if not exists (select 1 from auth.users where lower(email) = v_email) then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'first_name', 'Байгалмаа', 'last_name', 'Бадамханд',
        'birth_date', '1977-09-06', 'gender', 'female',
        'workplace', 'БЗДЭМТ', 'position', 'Даатгалын их эмч',
        'years_worked', '2.5', 'facebook', 'Б.Байгалмаа',
        'phone', '9919-6975', 'membership', 'regular'
      ),
      now(), now(), '', '', '', ''
    );
    if not exists (select 1 from public.members where member_no = v_target_no) then
      update public.members set member_no = v_target_no where id = v_user_id;
    else
      raise notice 'MD% already taken — % kept its auto-assigned number.', v_target_no, v_email;
    end if;
  else
    raise notice 'Skipped % — already exists.', v_email;
  end if;

  -- ---------- Сүхбаатар Бямбацогт — MD218 ----------
  v_email := 'ertilruulegbzd@gmail.com';
  v_target_no := 218;
  if not exists (select 1 from auth.users where lower(email) = v_email) then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'first_name', 'Сүхбаатар', 'last_name', 'Бямбацогт',
        'birth_date', '1992-08-28', 'gender', 'male',
        'workplace', 'БЗДЭМТ', 'position', 'Даатгалын их эмч',
        'years_worked', '1', 'facebook', 'Б.Сүхээ',
        'phone', '9955-8395', 'membership', 'regular'
      ),
      now(), now(), '', '', '', ''
    );
    if not exists (select 1 from public.members where member_no = v_target_no) then
      update public.members set member_no = v_target_no where id = v_user_id;
    else
      raise notice 'MD% already taken — % kept its auto-assigned number.', v_target_no, v_email;
    end if;
  else
    raise notice 'Skipped % — already exists.', v_email;
  end if;

  -- ---------- Энхжаргал Бэлэгбадрах — MD219 (requested Professional) ----------
  v_email := 'jagaadalai@yahoo.com';
  v_target_no := 219;
  if not exists (select 1 from auth.users where lower(email) = v_email) then
    v_user_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, crypt(gen_random_uuid()::text, gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'first_name', 'Энхжаргал', 'last_name', 'Бэлэгбадрах',
        'birth_date', '1973-11-01', 'gender', 'female',
        'workplace', 'УАУТХ', 'position', 'эмдсмз- ийн хэлтсийн дарга',
        'years_worked', '17', 'facebook', 'Enkhjargal Belegbadrakh',
        'phone', '9916-0125', 'membership', 'professional'
      ),
      now(), now(), '', '', '', ''
    );
    if not exists (select 1 from public.members where member_no = v_target_no) then
      update public.members set member_no = v_target_no where id = v_user_id;
    else
      raise notice 'MD% already taken — % kept its auto-assigned number.', v_target_no, v_email;
    end if;
  else
    raise notice 'Skipped % — already exists.', v_email;
  end if;

end $$;

-- Quick check afterward — see supabase/migration20_bulk_import_aug21.sql results:
select member_id, first_name, last_name, email, status, membership, upgrade_requested
from public.members
where email in (
  'urnaa.0911urnaa@gmail.com', 'soko6525@gmail.com', 'b.badamkhand4@gmail.com',
  'ertilruulegbzd@gmail.com', 'jagaadalai@yahoo.com'
)
order by member_no;
