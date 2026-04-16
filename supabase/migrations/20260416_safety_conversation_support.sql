-- Safety + conversation support MVP layer

create extension if not exists "pgcrypto";

-- Optional trust-signal fields for match cards/detail.
alter table public.matches
  add column if not exists compatibility_score int,
  add column if not exists tier_label text,
  add column if not exists conversation_disabled boolean not null default false,
  add column if not exists conversation_disabled_reason text;

alter table public.profiles
  add column if not exists is_verified boolean not null default false;

-- User-initiated unmatch events (pair history).
create table if not exists public.unmatches (
  id uuid primary key default gen_random_uuid(),
  initiated_by_user_id uuid not null references auth.users(id) on delete cascade,
  unmatched_user_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint unmatches_not_self check (initiated_by_user_id <> unmatched_user_id)
);

create index if not exists unmatches_initiated_by_idx on public.unmatches(initiated_by_user_id);
create index if not exists unmatches_unmatched_user_idx on public.unmatches(unmatched_user_id);
create index if not exists unmatches_created_at_idx on public.unmatches(created_at desc);
create index if not exists matches_pair_status_created_idx on public.matches(user_id, matched_user_id, status, created_at desc);

alter table public.unmatches enable row level security;

drop policy if exists unmatches_select_own on public.unmatches;
create policy unmatches_select_own
on public.unmatches
for select
to authenticated
using (auth.uid() = initiated_by_user_id or auth.uid() = unmatched_user_id);

drop policy if exists unmatches_insert_own on public.unmatches;
create policy unmatches_insert_own
on public.unmatches
for insert
to authenticated
with check (auth.uid() = initiated_by_user_id);

-- Ensure blocks/reports inserts are explicitly scoped to authenticated users.
drop policy if exists blocks_insert_own on public.blocks;
create policy blocks_insert_own
on public.blocks
for insert
to authenticated
with check (auth.uid() = blocker_user_id);

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own
on public.reports
for insert
to authenticated
with check (auth.uid() = reporter_user_id);
