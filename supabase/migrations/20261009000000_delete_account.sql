-- Astro Life: let a signed-in user delete their own account.
-- Run this in the Supabase SQL editor after the charts migration.
-- Deleting the auth.users row removes the name, email and Google link that
-- Supabase holds, and cascades to every saved chart (charts.user_id ... on delete cascade).

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  delete from auth.users where id = uid;
end;
$$;

-- Only signed-in users may call it, and it can only ever delete the caller.
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
