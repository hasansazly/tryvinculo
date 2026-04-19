# No Photos First - Test Cases

## Preconditions
- `NO_PHOTOS_FIRST_ENABLED=true`
- Two users exist: `userA`, `userB`
- `userB` has at least one uploaded profile photo

## 1) Non-matched user cannot see photos
1. Log in as `userA`.
2. Ensure there is no active reciprocal match with `userB`.
3. Open match/discover surfaces where `userB` appears.
4. Verify main profile photo is hidden and fallback UI is shown.
5. Verify no gallery thumbnails are shown.

Expected: Photos are not visible.

## 2) One-sided like does not reveal photos
1. Create only one directional active match row (`userA -> userB`).
2. Log in as `userA` and open `/matches` and `/matches/[id]`.

Expected: Photos remain hidden; unlock copy is shown.

## 3) Mutual match reveals photos
1. Create reciprocal active rows (`userA -> userB` and `userB -> userA`).
2. Log in as `userA` and open `/matches` and `/matches/[id]`.

Expected: Main photo and gallery display normally.

## 4) Self-view still shows own photos
1. Log in as any user with uploaded photos.
2. Open profile page `/app/profile`.

Expected: Own photos remain visible and manageable.

## 5) Admin/moderator/internal behavior
- Current codebase has no explicit admin/moderator view path for these match pages.
- Verify any existing internal tools continue to function unchanged.

## 6) Page stability when photos are hidden
1. Repeat tests 1 and 2.
2. Verify `/matches`, `/matches/[id]`, and `/app/discover` render without crashes or broken image containers.

Expected: No runtime errors, no broken image elements.

## 7) Match flow regression
1. From `/matches/[id]`, click "Message This Match".
2. Ensure conversation starts/opens as before.

Expected: Chat/messaging flow unchanged.
