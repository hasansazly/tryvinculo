create table if not exists public.couple_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_user_id uuid not null references auth.users(id) on delete cascade,
  partner_email text not null,
  invite_code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled', 'expired')),
  accepted_by_user_id uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default timezone('utc', now()) + interval '14 days',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint couple_invites_partner_email_nonempty check (length(trim(partner_email)) > 3),
  constraint couple_invites_not_self_acceptor check (
    accepted_by_user_id is null or accepted_by_user_id <> inviter_user_id
  )
);

create index if not exists couple_invites_inviter_status_idx
  on public.couple_invites (inviter_user_id, status, created_at desc);

create index if not exists couple_invites_partner_email_status_idx
  on public.couple_invites (lower(partner_email), status, created_at desc);

create or replace function public.couple_invites_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists couple_invites_set_updated_at on public.couple_invites;
create trigger couple_invites_set_updated_at
before update on public.couple_invites
for each row execute function public.couple_invites_touch_updated_at();

alter table public.couple_invites enable row level security;

drop policy if exists couple_invites_select_visible on public.couple_invites;
create policy couple_invites_select_visible
on public.couple_invites
for select
using (
  auth.uid() = inviter_user_id
  or auth.uid() = accepted_by_user_id
  or (
    status = 'pending'
    and lower(partner_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  )
);

drop policy if exists couple_invites_insert_inviter on public.couple_invites;
create policy couple_invites_insert_inviter
on public.couple_invites
for insert
with check (
  auth.uid() = inviter_user_id
  and lower(coalesce((auth.jwt() ->> 'email'), '')) like '%@temple.edu'
);

drop policy if exists couple_invites_update_participants on public.couple_invites;
create policy couple_invites_update_participants
on public.couple_invites
for update
using (
  auth.uid() = inviter_user_id
  or (
    status = 'pending'
    and lower(partner_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  )
)
with check (
  auth.uid() = inviter_user_id
  or (
    status = 'accepted'
    and auth.uid() = accepted_by_user_id
    and lower(partner_email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  )
);
