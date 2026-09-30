-- Astro Life: saved charts.
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- Security model: the browser uses the public anon key, and Row Level Security
-- guarantees each signed-in user can only ever touch their own rows.

create table if not exists public.charts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label       text not null check (char_length(label) between 1 and 80),
  birth       jsonb not null check (
                jsonb_typeof(birth) = 'object'
                and pg_column_size(birth) < 2048
                and birth ? 'date' and birth ? 'latitude' and birth ? 'longitude' and birth ? 'timezone'
              ),
  created_at  timestamptz not null default now()
);

create index if not exists charts_user_created_idx on public.charts (user_id, created_at desc);

alter table public.charts enable row level security;
alter table public.charts force row level security;

-- Anonymous visitors get nothing; signed-in users get only their rows.
-- (Revoke first: Supabase grants ALL by default, and TRUNCATE is not covered by RLS.)
revoke all on public.charts from anon, authenticated;
grant select, insert, delete on public.charts to authenticated;

drop policy if exists "charts: read own" on public.charts;
create policy "charts: read own" on public.charts
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "charts: insert own" on public.charts;
create policy "charts: insert own" on public.charts
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "charts: delete own" on public.charts;
create policy "charts: delete own" on public.charts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Abuse guard: cap saved charts per user.
create or replace function public.enforce_chart_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.charts where user_id = new.user_id) >= 100 then
    raise exception 'Chart limit reached (100). Delete some charts to save new ones.';
  end if;
  return new;
end;
$$;

drop trigger if exists charts_limit on public.charts;
create trigger charts_limit
  before insert on public.charts
  for each row execute function public.enforce_chart_limit();

revoke execute on function public.enforce_chart_limit() from public, anon, authenticated;
