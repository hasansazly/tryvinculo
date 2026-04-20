create extension if not exists pgcrypto;

create table if not exists public.couple_date_plans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  vibe text not null default 'cozy',
  budget text not null default '$$',
  duration text not null default '2-3h',
  location_hint text not null default '',
  title text not null,
  summary text not null,
  plan_steps text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists couple_date_plans_couple_idx on public.couple_date_plans(couple_id, created_at desc);

create table if not exists public.couple_reminders (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) > 0 and length(title) <= 120),
  note text not null default '' check (length(note) <= 500),
  due_at timestamptz not null,
  completed boolean not null default false,
  completed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists couple_reminders_couple_due_idx on public.couple_reminders(couple_id, due_at asc);

alter table public.couple_date_plans enable row level security;
alter table public.couple_reminders enable row level security;

drop policy if exists couple_date_plans_select_participants on public.couple_date_plans;
create policy couple_date_plans_select_participants
on public.couple_date_plans
for select
to authenticated
using (
  exists (
    select 1
    from public.couples c
    where c.id = couple_date_plans.couple_id
      and c.status = 'confirmed'
      and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
  )
);

drop policy if exists couple_date_plans_insert_participants on public.couple_date_plans;
create policy couple_date_plans_insert_participants
on public.couple_date_plans
for insert
to authenticated
with check (
  auth.uid() = created_by_user_id
  and exists (
    select 1
    from public.couples c
    where c.id = couple_date_plans.couple_id
      and c.status = 'confirmed'
      and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
  )
);

drop policy if exists couple_reminders_select_participants on public.couple_reminders;
create policy couple_reminders_select_participants
on public.couple_reminders
for select
to authenticated
using (
  exists (
    select 1
    from public.couples c
    where c.id = couple_reminders.couple_id
      and c.status = 'confirmed'
      and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
  )
);

drop policy if exists couple_reminders_insert_participants on public.couple_reminders;
create policy couple_reminders_insert_participants
on public.couple_reminders
for insert
to authenticated
with check (
  auth.uid() = created_by_user_id
  and exists (
    select 1
    from public.couples c
    where c.id = couple_reminders.couple_id
      and c.status = 'confirmed'
      and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
  )
);

drop policy if exists couple_reminders_update_participants on public.couple_reminders;
create policy couple_reminders_update_participants
on public.couple_reminders
for update
to authenticated
using (
  exists (
    select 1
    from public.couples c
    where c.id = couple_reminders.couple_id
      and c.status = 'confirmed'
      and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
  )
)
with check (
  exists (
    select 1
    from public.couples c
    where c.id = couple_reminders.couple_id
      and c.status = 'confirmed'
      and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
  )
);
