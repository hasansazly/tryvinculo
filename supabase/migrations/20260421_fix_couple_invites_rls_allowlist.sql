-- Fix couple_invites RLS to match app-level QA allowlist emails.
-- Previous policy required @temple.edu and blocks Gmail test accounts.

drop policy if exists couple_invites_insert_inviter on public.couple_invites;
create policy couple_invites_insert_inviter
on public.couple_invites
for insert
with check (
  auth.uid() = inviter_user_id
  and lower(coalesce((auth.jwt() ->> 'email'), '')) in (
    'sarkarrony777@gmail.com',
    'sarkarronnie008@gmail.com'
  )
);
