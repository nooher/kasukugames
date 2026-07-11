-- KasukuGames — trust & safety: blocks + reports
-- Run once in the Kasuku Supabase project (ujokjnfdhtswomhgjkfp). Idempotent.
-- Owner-scoped tables (you can only act as yourself), so plain RLS is enough — no
-- SECURITY DEFINER needed. Reports are write-from-client; moderators review via the
-- service role / dashboard.

create extension if not exists "pgcrypto";

-- ── Blocks ───────────────────────────────────────────────────────────────────
create table if not exists public.kg_blocks (
  blocker_id     uuid not null references auth.users(id) on delete cascade,
  blocked_id     uuid not null references auth.users(id) on delete cascade,
  blocked_handle text,
  created_at     timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table public.kg_blocks enable row level security;

drop policy if exists kg_blocks_select on public.kg_blocks;
create policy kg_blocks_select on public.kg_blocks
  for select using (auth.uid() = blocker_id);
drop policy if exists kg_blocks_insert on public.kg_blocks;
create policy kg_blocks_insert on public.kg_blocks
  for insert with check (auth.uid() = blocker_id);
drop policy if exists kg_blocks_delete on public.kg_blocks;
create policy kg_blocks_delete on public.kg_blocks
  for delete using (auth.uid() = blocker_id);

-- ── Reports ──────────────────────────────────────────────────────────────────
create table if not exists public.kg_reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references auth.users(id) on delete cascade,
  target_kind   text not null check (target_kind in ('user','room','message')),
  target_id     uuid,
  target_handle text,
  room_code     text,
  reason        text not null,
  detail        text,
  created_at    timestamptz not null default now()
);
alter table public.kg_reports enable row level security;

drop policy if exists kg_reports_insert on public.kg_reports;
create policy kg_reports_insert on public.kg_reports
  for insert with check (auth.uid() = reporter_id);
-- Reporters can see only their own reports; moderators use the service role.
drop policy if exists kg_reports_select on public.kg_reports;
create policy kg_reports_select on public.kg_reports
  for select using (auth.uid() = reporter_id);

create index if not exists kg_reports_created_idx on public.kg_reports (created_at desc);
