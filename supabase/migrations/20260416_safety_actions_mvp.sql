-- Safety actions MVP hardening (post-messaging)

-- Allow users to update their own match rows for unmatch/block flow.
drop policy if exists matches_update_own on public.matches;
create policy matches_update_own
on public.matches
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Optional cleanup policy for user-owned blocks (if user unblocks later).
drop policy if exists blocks_delete_own on public.blocks;
create policy blocks_delete_own
on public.blocks
for delete
to authenticated
using (auth.uid() = blocker_user_id);

-- Helpful indexes for pair checks used by match/chat safety guards.
create index if not exists blocks_pair_idx on public.blocks(blocker_user_id, blocked_user_id);
create index if not exists reports_pair_idx on public.reports(reporter_user_id, reported_user_id);
create index if not exists unmatches_pair_idx on public.unmatches(initiated_by_user_id, unmatched_user_id);
