-- Astro Life: paid chart credits.
-- Run this in the Supabase SQL editor after the earlier migrations.
--
-- Model: a user buys a pack of credits (1, 2, 3 or 5). Each credit unlocks the
-- full readings for one person's birth details, permanently. An unlocked chart
-- cannot be edited or reassigned, so one credit always means one person.
--
-- Security: browsers use the anon key and can only READ their own rows.
-- Purchases are written only by the payment Edge Functions (service role,
-- which Supabase injects into those functions; it is never in the website).
-- Unlocking goes through unlock_chart(), which checks the credit balance.

create table if not exists public.purchases (
  id                  uuid primary key default gen_random_uuid(),
  -- Kept (set null) if the user deletes their account: payment records are needed for accounts and tax.
  user_id             uuid references auth.users (id) on delete set null,
  pack                text not null check (pack in ('p1', 'p2', 'p3', 'p5', 'manual')),
  credits             int  not null check (credits between 1 and 100),
  amount_paise        int  not null check (amount_paise >= 0),
  currency            text not null default 'INR',
  provider            text not null default 'razorpay',
  provider_order_id   text unique,
  provider_payment_id text unique,
  status              text not null default 'created' check (status in ('created', 'paid', 'refunded')),
  created_at          timestamptz not null default now(),
  paid_at             timestamptz
);
create index if not exists purchases_user_idx on public.purchases (user_id, status);

create table if not exists public.unlocked_charts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  birth_key   text not null check (char_length(birth_key) between 10 and 200),
  label       text not null check (char_length(label) between 1 and 80),
  birth       jsonb not null check (
                jsonb_typeof(birth) = 'object'
                and pg_column_size(birth) < 2048
                and birth ? 'date' and birth ? 'latitude' and birth ? 'longitude' and birth ? 'timezone'
              ),
  created_at  timestamptz not null default now(),
  unique (user_id, birth_key)
);

alter table public.purchases enable row level security;
alter table public.unlocked_charts enable row level security;

-- Read-only for signed-in users, and only their own rows. No insert, update or delete from browsers.
revoke all on public.purchases from anon, authenticated;
revoke all on public.unlocked_charts from anon, authenticated;
grant select on public.purchases to authenticated;
grant select on public.unlocked_charts to authenticated;

drop policy if exists "purchases: read own" on public.purchases;
create policy "purchases: read own" on public.purchases
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "unlocked: read own" on public.unlocked_charts;
create policy "unlocked: read own" on public.unlocked_charts
  for select to authenticated using ((select auth.uid()) = user_id);

-- Credit balance for the signed-in user.
create or replace function public.chart_credits()
returns table (total int, used int, remaining int)
language sql
stable
security definer
set search_path = ''
as $$
  with t as (
    select coalesce(sum(credits), 0)::int as total
    from public.purchases where user_id = auth.uid() and status = 'paid'
  ), u as (
    select count(*)::int as used from public.unlocked_charts where user_id = auth.uid()
  )
  select t.total, u.used, greatest(t.total - u.used, 0) from t, u;
$$;

-- Spend one credit on one person's birth details. Idempotent for the same details.
create or replace function public.unlock_chart(p_birth_key text, p_label text, p_birth jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  existing uuid;
  balance int;
  new_id uuid;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;
  -- Serialise unlocks per user so two tabs cannot spend the same credit.
  perform pg_advisory_xact_lock(hashtext(uid::text));
  select id into existing from public.unlocked_charts where user_id = uid and birth_key = p_birth_key;
  if existing is not null then
    return existing;
  end if;
  select remaining into balance from public.chart_credits();
  if coalesce(balance, 0) < 1 then
    raise exception 'No chart credits left' using errcode = 'P0001';
  end if;
  insert into public.unlocked_charts (user_id, birth_key, label, birth)
  values (uid, p_birth_key, left(coalesce(nullif(trim(p_label), ''), 'Chart'), 80), p_birth)
  returning id into new_id;
  return new_id;
end;
$$;

revoke execute on function public.chart_credits() from public, anon;
revoke execute on function public.unlock_chart(text, text, jsonb) from public, anon;
grant execute on function public.chart_credits() to authenticated;
grant execute on function public.unlock_chart(text, text, jsonb) to authenticated;

-- To give credits by hand (for testing, gifts or support), run as the project owner:
--   insert into public.purchases (user_id, pack, credits, amount_paise, provider, status, paid_at)
--   values ('<user uuid>', 'manual', 1, 0, 'manual', 'paid', now());
