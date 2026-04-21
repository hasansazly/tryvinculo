-- Restore couple invite insert policy to Temple-only.

drop policy if exists couple_invites_insert_inviter on public.couple_invites;
create policy couple_invites_insert_inviter
on public.couple_invites
for insert
with check (
  auth.uid() = inviter_user_id
  and lower(coalesce((auth.jwt() ->> 'email'), '')) like '%@temple.edu'
);
