-- KasukuGames — server-authoritative token wallet
-- Run once in the Kasuku Supabase project (ujokjnfdhtswomhgjkfp). Idempotent.
-- Balance lives server-side; spends are funds-checked and earns are per-call capped,
-- so a forged local balance can't buy shop items and tokens can't be minted in one
-- shot. All writes go through SECURITY DEFINER functions; direct writes revoked.
-- NOTE: fully tamper-proof earning needs server-authoritative gameplay (a later P0);
-- this closes the spend/forge hole and makes balance durable across devices.

create extension if not exists "pgcrypto";

create table if not exists public.kg_wallet (
  id           uuid primary key references auth.users(id) on delete cascade,
  balance      bigint not null default 0,
  total_earned bigint not null default 0,
  total_spent  bigint not null default 0,
  updated_at   timestamptz not null default now()
);
alter table public.kg_wallet enable row level security;

-- Owner may READ their wallet directly; all writes go through the functions below.
drop policy if exists kg_wallet_select on public.kg_wallet;
create policy kg_wallet_select on public.kg_wallet
  for select using (auth.uid() = id);

-- First-touch migration: seed the server balance from the local balance ONCE.
-- Capped so nobody seeds an absurd starting balance.
create or replace function public.kg_wallet_init(p_balance bigint)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_bal bigint;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select balance into v_bal from public.kg_wallet where id = v_uid;
  if found then return v_bal; end if;
  v_bal := greatest(0, least(coalesce(p_balance, 0), 1000000));
  insert into public.kg_wallet(id, balance, total_earned, updated_at)
    values (v_uid, v_bal, v_bal, now());
  return v_bal;
end $$;

-- Credit tokens (per-call capped to block one-shot minting).
create or replace function public.kg_wallet_earn(p_amount integer, p_reason text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_amt integer; v_bal bigint;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  v_amt := greatest(0, least(coalesce(p_amount, 0), 100000));
  insert into public.kg_wallet(id, balance, total_earned, updated_at)
    values (v_uid, v_amt, v_amt, now())
  on conflict (id) do update
    set balance = public.kg_wallet.balance + v_amt,
        total_earned = public.kg_wallet.total_earned + v_amt,
        updated_at = now()
  returning balance into v_bal;
  return v_bal;
end $$;

-- Spend tokens — funds-checked. Returns the new balance, or -1 if insufficient.
create or replace function public.kg_wallet_spend(p_amount integer, p_item text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_amt integer; v_bal bigint;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  v_amt := greatest(0, coalesce(p_amount, 0));
  select balance into v_bal from public.kg_wallet where id = v_uid;
  if not found or v_bal < v_amt then return -1; end if;
  update public.kg_wallet
    set balance = balance - v_amt, total_spent = total_spent + v_amt, updated_at = now()
    where id = v_uid
  returning balance into v_bal;
  return v_bal;
end $$;

revoke all on function public.kg_wallet_init(bigint)          from public;
revoke all on function public.kg_wallet_earn(integer, text)   from public;
revoke all on function public.kg_wallet_spend(integer, text)  from public;
grant execute on function public.kg_wallet_init(bigint)         to authenticated;
grant execute on function public.kg_wallet_earn(integer, text)  to authenticated;
grant execute on function public.kg_wallet_spend(integer, text) to authenticated;

revoke insert, update, delete, truncate on public.kg_wallet from anon, authenticated, public;
