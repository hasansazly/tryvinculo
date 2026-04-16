-- Conversations + messages schema for Vinculo 1:1 chat

create extension if not exists "pgcrypto";

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind in ('direct', 'group')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.conversation_participants (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_body_not_empty check (length(trim(body)) > 0)
);

create index if not exists conversations_kind_created_at_idx on public.conversations(kind, created_at desc);
create index if not exists conversation_participants_user_id_idx on public.conversation_participants(user_id);
create index if not exists messages_conversation_id_created_at_idx on public.messages(conversation_id, created_at asc);
create index if not exists messages_sender_user_id_idx on public.messages(sender_user_id);

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Conversations policies
 drop policy if exists conversations_select_participant on public.conversations;
create policy conversations_select_participant
on public.conversations
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = conversations.id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists conversations_insert_owner on public.conversations;
create policy conversations_insert_owner
on public.conversations
for insert
to authenticated
with check (created_by = auth.uid());

-- Participants policies
 drop policy if exists conversation_participants_select_visible on public.conversation_participants;
create policy conversation_participants_select_visible
on public.conversation_participants
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.conversation_participants self_cp
    where self_cp.conversation_id = conversation_participants.conversation_id
      and self_cp.user_id = auth.uid()
  )
);

drop policy if exists conversation_participants_insert_allowed on public.conversation_participants;
create policy conversation_participants_insert_allowed
on public.conversation_participants
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.conversations c
    where c.id = conversation_participants.conversation_id
      and c.created_by = auth.uid()
  )
  or exists (
    select 1
    from public.conversation_participants self_cp
    where self_cp.conversation_id = conversation_participants.conversation_id
      and self_cp.user_id = auth.uid()
  )
);

-- Messages policies
 drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists messages_insert_sender_participant on public.messages;
create policy messages_insert_sender_participant
on public.messages
for insert
to authenticated
with check (
  sender_user_id = auth.uid()
  and exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = messages.conversation_id
      and cp.user_id = auth.uid()
  )
);
