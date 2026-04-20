create extension if not exists pgcrypto;

create table if not exists public.couple_mode_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.couple_mode_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('enabled', 'disabled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists couple_mode_events_couple_idx on public.couple_mode_events(couple_id, created_at desc);

create or replace function public.couple_mode_preferences_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists couple_mode_preferences_set_updated_at on public.couple_mode_preferences;
create trigger couple_mode_preferences_set_updated_at
before update on public.couple_mode_preferences
for each row execute function public.couple_mode_preferences_touch_updated_at();

alter table public.couple_mode_preferences enable row level security;
alter table public.couple_mode_events enable row level security;

drop policy if exists couple_mode_preferences_select_self_or_partner on public.couple_mode_preferences;
create policy couple_mode_preferences_select_self_or_partner
on public.couple_mode_preferences
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.couples c
    where c.status = 'confirmed'
      and (
        (c.user_one_id = auth.uid() and c.user_two_id = couple_mode_preferences.user_id)
        or (c.user_two_id = auth.uid() and c.user_one_id = couple_mode_preferences.user_id)
      )
  )
);

drop policy if exists couple_mode_preferences_insert_self on public.couple_mode_preferences;
create policy couple_mode_preferences_insert_self
on public.couple_mode_preferences
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists couple_mode_preferences_update_self on public.couple_mode_preferences;
create policy couple_mode_preferences_update_self
on public.couple_mode_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists couple_mode_events_select_participants on public.couple_mode_events;
create policy couple_mode_events_select_participants
on public.couple_mode_events
for select
to authenticated
using (
  exists (
    select 1
    from public.couples c
    where c.id = couple_mode_events.couple_id
      and c.status = 'confirmed'
      and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
  )
);

drop policy if exists couple_mode_events_insert_participants on public.couple_mode_events;
create policy couple_mode_events_insert_participants
on public.couple_mode_events
for insert
to authenticated
with check (
  auth.uid() = actor_user_id
  and exists (
    select 1
    from public.couples c
    where c.id = couple_mode_events.couple_id
      and c.status = 'confirmed'
      and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
  )
);
