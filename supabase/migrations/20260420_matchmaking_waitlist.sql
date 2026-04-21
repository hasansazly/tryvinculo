create table if not exists public.matchmaking_waitlist (
  user_id uuid primary key references auth.users(id) on delete cascade,
  segment text not null,
  status text not null default 'waiting' check (status in ('waiting', 'ready', 'released')),
  score_snapshot jsonb not null default '{}'::jsonb,
  joined_at timestamptz not null default now(),
  released_at timestamptz
);

create index if not exists idx_matchmaking_waitlist_segment_status
  on public.matchmaking_waitlist(segment, status, joined_at);

alter table public.matchmaking_waitlist enable row level security;

create policy "Users can view own waitlist row"
  on public.matchmaking_waitlist
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Service role manages waitlist rows"
  on public.matchmaking_waitlist
  for all
  to service_role
  using (true)
  with check (true);
