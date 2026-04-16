-- Vinculo Connection Track MVP

create extension if not exists "pgcrypto";

create table if not exists public.connection_tracks (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  user_one_id uuid not null references auth.users(id) on delete cascade,
  user_two_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connection_tracks_not_self check (user_one_id <> user_two_id)
);

create unique index if not exists connection_tracks_active_pair_unique
on public.connection_tracks ((least(user_one_id, user_two_id)), (greatest(user_one_id, user_two_id)))
where status = 'active';

create index if not exists connection_tracks_user_one_idx on public.connection_tracks(user_one_id);
create index if not exists connection_tracks_user_two_idx on public.connection_tracks(user_two_id);
create index if not exists connection_tracks_match_id_idx on public.connection_tracks(match_id);
create index if not exists connection_tracks_conversation_id_idx on public.connection_tracks(conversation_id);

create table if not exists public.connection_track_questions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('daily_micro_question', 'weekly_pulse', 'pre_date_check')),
  question_text text not null,
  category text not null default 'general',
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint connection_track_questions_unique unique (type, question_text)
);

create index if not exists connection_track_questions_type_active_idx
on public.connection_track_questions(type, is_active);

create table if not exists public.connection_track_responses (
  id uuid primary key default gen_random_uuid(),
  connection_track_id uuid not null references public.connection_tracks(id) on delete cascade,
  question_id uuid not null references public.connection_track_questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  cycle_key text not null,
  response_text text,
  response_value jsonb,
  created_at timestamptz not null default now(),
  constraint connection_track_responses_unique unique (connection_track_id, question_id, user_id, cycle_key)
);

create index if not exists connection_track_responses_track_idx on public.connection_track_responses(connection_track_id);
create index if not exists connection_track_responses_cycle_idx on public.connection_track_responses(connection_track_id, cycle_key);

create table if not exists public.connection_track_events (
  id uuid primary key default gen_random_uuid(),
  connection_track_id uuid not null references public.connection_tracks(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists connection_track_events_track_idx on public.connection_track_events(connection_track_id, created_at desc);
create index if not exists connection_track_events_type_idx on public.connection_track_events(event_type);

create or replace function public.connection_tracks_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists connection_tracks_set_updated_at on public.connection_tracks;
create trigger connection_tracks_set_updated_at
before update on public.connection_tracks
for each row execute function public.connection_tracks_touch_updated_at();

create or replace function public.connection_tracks_sync_from_matches()
returns trigger
language plpgsql
as $$
declare
  pair_user_one uuid;
  pair_user_two uuid;
  active_pair_count int;
begin
  pair_user_one := least(new.user_id, new.matched_user_id);
  pair_user_two := greatest(new.user_id, new.matched_user_id);

  if tg_op = 'INSERT' then
    if new.status = 'active' then
      insert into public.connection_tracks (match_id, user_one_id, user_two_id, status)
      values (new.id, pair_user_one, pair_user_two, 'active')
      on conflict do nothing;
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if new.status = 'active' then
      insert into public.connection_tracks (match_id, user_one_id, user_two_id, status)
      values (new.id, pair_user_one, pair_user_two, 'active')
      on conflict do nothing;

      update public.connection_tracks
      set match_id = coalesce(match_id, new.id)
      where user_one_id = pair_user_one
        and user_two_id = pair_user_two
        and status = 'active';
    elsif old.status = 'active' and new.status <> 'active' then
      select count(*)
      into active_pair_count
      from public.matches m
      where m.status = 'active'
        and least(m.user_id, m.matched_user_id) = pair_user_one
        and greatest(m.user_id, m.matched_user_id) = pair_user_two;

      if active_pair_count = 0 then
        update public.connection_tracks
        set status = 'inactive'
        where user_one_id = pair_user_one
          and user_two_id = pair_user_two
          and status = 'active';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists connection_tracks_sync_from_matches_trigger on public.matches;
create trigger connection_tracks_sync_from_matches_trigger
after insert or update on public.matches
for each row execute function public.connection_tracks_sync_from_matches();

alter table public.connection_tracks enable row level security;
alter table public.connection_track_questions enable row level security;
alter table public.connection_track_responses enable row level security;
alter table public.connection_track_events enable row level security;

drop policy if exists connection_tracks_select_participants on public.connection_tracks;
create policy connection_tracks_select_participants
on public.connection_tracks
for select
to authenticated
using (auth.uid() = user_one_id or auth.uid() = user_two_id);

drop policy if exists connection_tracks_insert_participants on public.connection_tracks;
create policy connection_tracks_insert_participants
on public.connection_tracks
for insert
to authenticated
with check (auth.uid() = user_one_id or auth.uid() = user_two_id);

drop policy if exists connection_tracks_update_participants on public.connection_tracks;
create policy connection_tracks_update_participants
on public.connection_tracks
for update
to authenticated
using (auth.uid() = user_one_id or auth.uid() = user_two_id)
with check (auth.uid() = user_one_id or auth.uid() = user_two_id);

drop policy if exists connection_track_questions_select_auth on public.connection_track_questions;
create policy connection_track_questions_select_auth
on public.connection_track_questions
for select
to authenticated
using (true);

drop policy if exists connection_track_responses_select_participants on public.connection_track_responses;
create policy connection_track_responses_select_participants
on public.connection_track_responses
for select
to authenticated
using (
  exists (
    select 1
    from public.connection_tracks ct
    where ct.id = connection_track_responses.connection_track_id
      and (ct.user_one_id = auth.uid() or ct.user_two_id = auth.uid())
  )
);

drop policy if exists connection_track_responses_insert_own on public.connection_track_responses;
create policy connection_track_responses_insert_own
on public.connection_track_responses
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.connection_tracks ct
    where ct.id = connection_track_responses.connection_track_id
      and (ct.user_one_id = auth.uid() or ct.user_two_id = auth.uid())
      and ct.status = 'active'
  )
);

drop policy if exists connection_track_responses_update_own on public.connection_track_responses;
create policy connection_track_responses_update_own
on public.connection_track_responses
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists connection_track_events_select_participants on public.connection_track_events;
create policy connection_track_events_select_participants
on public.connection_track_events
for select
to authenticated
using (
  exists (
    select 1
    from public.connection_tracks ct
    where ct.id = connection_track_events.connection_track_id
      and (ct.user_one_id = auth.uid() or ct.user_two_id = auth.uid())
  )
);

drop policy if exists connection_track_events_insert_participants on public.connection_track_events;
create policy connection_track_events_insert_participants
on public.connection_track_events
for insert
to authenticated
with check (
  exists (
    select 1
    from public.connection_tracks ct
    where ct.id = connection_track_events.connection_track_id
      and (ct.user_one_id = auth.uid() or ct.user_two_id = auth.uid())
  )
);

insert into public.connection_track_questions (type, question_text, category, metadata)
values
  ('daily_micro_question','What does a good week look like for you right now?','pace','{}'::jsonb),
  ('daily_micro_question','What helps you feel comfortable getting to know someone?','comfort','{}'::jsonb),
  ('daily_micro_question','What kind of communication feels best early on?','communication','{}'::jsonb),
  ('daily_micro_question','What makes you feel seen in conversation?','connection','{}'::jsonb),
  ('daily_micro_question','What is one simple thing that helps you trust someone more?','trust','{}'::jsonb),
  ('daily_micro_question','What does consistency look like to you this month?','values','{}'::jsonb),
  ('daily_micro_question','When do you feel most open in a conversation?','communication','{}'::jsonb),
  ('daily_micro_question','What kind of pace feels respectful when getting to know someone?','pace','{}'::jsonb),
  ('daily_micro_question','What is one green flag you pay attention to early?','values','{}'::jsonb),
  ('daily_micro_question','How do you like to reconnect after a busy day?','communication','{}'::jsonb),
  ('daily_micro_question','What helps a conversation feel natural instead of forced?','connection','{}'::jsonb),
  ('daily_micro_question','What kind of curiosity do you appreciate from someone new?','connection','{}'::jsonb),
  ('daily_micro_question','What does emotional clarity mean to you?','values','{}'::jsonb),
  ('daily_micro_question','How do you usually show interest when you are serious about someone?','intentionality','{}'::jsonb),
  ('daily_micro_question','What balance of texting and real-life plans feels good to you?','pace','{}'::jsonb),
  ('daily_micro_question','What usually helps you move from small talk to real talk?','communication','{}'::jsonb),
  ('daily_micro_question','What does a calm, healthy connection feel like day to day?','values','{}'::jsonb),
  ('daily_micro_question','How do you like to handle misunderstandings early on?','repair','{}'::jsonb),
  ('daily_micro_question','What makes you feel respected while dating?','values','{}'::jsonb),
  ('daily_micro_question','What would make this week feel like progress for you?','intentionality','{}'::jsonb),

  ('weekly_pulse','How is the conversation flow feeling so far?','flow','{"input_type":"single_choice","options":["Easy and natural","Mostly good","Mixed","Feels stuck"]}'::jsonb),
  ('weekly_pulse','Do you feel aligned on pace right now?','pace','{"input_type":"single_choice","options":["Yes","Mostly","Not sure yet","Not really"]}'::jsonb),
  ('weekly_pulse','Would you like to keep exploring this connection?','direction','{"input_type":"single_choice","options":["Yes","Yes, slowly","Not sure","No"]}'::jsonb),
  ('weekly_pulse','How clear has communication felt this week?','communication','{"input_type":"scale","min":1,"max":5}'::jsonb),
  ('weekly_pulse','How supported do you feel in this connection right now?','support','{"input_type":"scale","min":1,"max":5}'::jsonb),
  ('weekly_pulse','What tone best describes this week together?','tone','{"input_type":"single_choice","options":["Warm","Playful","Steady","Unclear"]}'::jsonb),
  ('weekly_pulse','How well does your current rhythm fit your energy?','pace','{"input_type":"single_choice","options":["Great fit","Decent fit","Needs adjustment","Not fitting"]}'::jsonb),
  ('weekly_pulse','How much curiosity do you feel from each other this week?','curiosity','{"input_type":"scale","min":1,"max":5}'::jsonb),
  ('weekly_pulse','Do you feel emotionally safe in this connection so far?','trust','{"input_type":"single_choice","options":["Yes","Mostly","Still building","Not really"]}'::jsonb),
  ('weekly_pulse','Would a small next step make sense this week?','momentum','{"input_type":"single_choice","options":["Yes","Maybe","Not yet"]}'::jsonb),

  ('pre_date_check','What kind of date are you hoping for?','date_style','{}'::jsonb),
  ('pre_date_check','Are you looking for something casual, exploratory, or serious here?','intent','{}'::jsonb),
  ('pre_date_check','How do you usually like first dates to feel?','date_style','{}'::jsonb),
  ('pre_date_check','What helps you feel at ease when meeting someone in person?','comfort','{}'::jsonb),
  ('pre_date_check','What kind of setting sounds best for a first meet?','logistics','{}'::jsonb),
  ('pre_date_check','What is one boundary that helps first dates feel respectful?','boundaries','{}'::jsonb),
  ('pre_date_check','What would make this date feel like a good use of your time?','intentionality','{}'::jsonb),
  ('pre_date_check','How long do you usually prefer a first date to be?','logistics','{}'::jsonb),
  ('pre_date_check','What kind of follow-up feels best after a first date?','communication','{}'::jsonb),
  ('pre_date_check','What is one thing you hope to learn about each other on a first date?','connection','{}'::jsonb)
on conflict (type, question_text) do nothing;
