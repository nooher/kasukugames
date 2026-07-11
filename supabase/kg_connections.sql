-- KasukuGames — reciprocal relationships ("People")
-- Run once in the Supabase SQL editor (shared Kasuku project ujokjnfdhtswomhgjkfp),
-- same as kg_scores.sql. Additive and idempotent — safe to re-run.
--
-- One row per relationship between two Kasuku users. `relation` is stored from the
-- REQUESTER's side: it is what the addressee IS to the requester (e.g. 'wife' means
-- the addressee is the requester's wife). Each party renders the other from their own
-- side by flipping to the reciprocal in the client. Because a single row is visible
-- to BOTH parties, an accepted row makes each person appear on the other's People list
-- automatically — no manual re-adding.

create extension if not exists "pgcrypto";

create table if not exists public.kg_connections (
  id                uuid primary key default gen_random_uuid(),
  requester_id      uuid not null references auth.users(id) on delete cascade,
  requester_handle  text not null,
  addressee_id      uuid not null references auth.users(id) on delete cascade,
  addressee_handle  text not null,
  relation          text not null,
  status            text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

create index if not exists kg_conn_addressee_idx on public.kg_connections (addressee_id, status);
create index if not exists kg_conn_requester_idx on public.kg_connections (requester_id, status);

alter table public.kg_connections enable row level security;

-- Either party can read the row.
drop policy if exists kg_conn_select on public.kg_connections;
create policy kg_conn_select on public.kg_connections
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Requester creates the request; the addressee can also self-create an accepted row
-- when they open an external (WhatsApp/Instagram) invite link.
drop policy if exists kg_conn_insert on public.kg_connections;
create policy kg_conn_insert on public.kg_connections
  for insert with check (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Either party can update (addressee accepts/declines; requester can re-invite).
drop policy if exists kg_conn_update on public.kg_connections;
create policy kg_conn_update on public.kg_connections
  for update using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Either party can remove the relationship.
drop policy if exists kg_conn_delete on public.kg_connections;
create policy kg_conn_delete on public.kg_connections
  for delete using (auth.uid() = requester_id or auth.uid() = addressee_id);
