-- ============================================================
-- MHIDA migration 4 — admin tools: delete member
-- Paste into Supabase SQL Editor and Run (after migration 2).
-- ============================================================

-- Admins can delete a member (removes the auth account; the member
-- row cascades). Admins cannot delete themselves.
create or replace function public.admin_delete_member(target_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  if target_id = auth.uid() then
    raise exception 'cannot delete your own account';
  end if;
  delete from auth.users where id = target_id;
end;
$$;

revoke execute on function public.admin_delete_member(uuid) from public, anon;
grant execute on function public.admin_delete_member(uuid) to authenticated;
