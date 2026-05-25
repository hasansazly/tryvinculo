# Vinculo

Vinculo is an intentional dating product built with Next.js App Router, React, TypeScript, Supabase, and optional AI provider integrations. The app focuses on curated matching, clear compatibility context, safer conversations, photo privacy before mutual interest, pre-date guidance, IRL date readiness, and couple-mode relationship tools.

The current codebase is a product prototype/MVP with real Supabase-backed routes and migrations, plus deterministic fallbacks where external services or optional tables are unavailable.

## Tech Stack

- Next.js `16.2.3` with the App Router under `src/app`
- React `19.2.4`
- TypeScript with `@/*` mapped to `src/*`
- Supabase Auth, database, storage, and RLS-backed application data
- Tailwind CSS v4 via PostCSS plus global CSS in `src/app/globals.css`
- OpenAI and Anthropic integrations for optional AI ranking, coaching, date planning, and couple intelligence
- Twilio integration for SMS notifications
- Node test files for IRL rendering and route smoke coverage

## Product Overview

Vinculo is organized around these user journeys:

- Public marketing and policy pages: landing page, privacy, terms, safety, contact, blog, and careers.
- Authentication and onboarding: email/password or OTP-style flows, Supabase callback handling, and compatibility profile collection.
- Matching: daily curated recommendations, compatibility scores, explanations, waitlist gating, and behavioral signal ingestion.
- Discovery and matches: profile browsing, match details, trust signals, no-photos-first privacy, and mutual match state.
- Messaging: conversation start flows, message pages, spark suggestions, and conversation guidance.
- Safety: block, unblock/list blocks, report, and unmatch routes.
- Connection track: daily micro-questions and relationship momentum state for matched users.
- AI pre-date briefing: cached or generated first-date context for mutual matches.
- IRL Date Track: unlocks after sustained connection activity, readiness signals, intention checks, activity suggestions, and post-date reflection.
- Couple mode: confirmed couples can opt in, answer daily/weekly prompts, generate date plans, love notes, reminders, and relationship intelligence.

## Repository Structure

```text
src/app/                         Next.js App Router pages, layouts, and API routes
src/app/app/                     Authenticated in-app surfaces
src/app/api/                     Backend route handlers
src/components/                  UI components grouped by feature
src/hooks/                       Client hooks
src/lib/                         Shared types, mock data, client helpers, feature utilities
src/lib/irl/                     IRL date-track domain helpers
src/server/                      Server-side domain services
src/server/matchmaking/          Matching engine, store, scoring, AI quality layer
src/server/couples/              Couple-mode state, planner, intelligence, reminders
src/server/connectionTrack/      Connection track helpers
src/server/ai/                   AI pre-date briefing service
src/server/sms/                  Twilio wrapper
utils/supabase/                  Supabase browser, server, admin, and env helpers
supabase/migrations/             Database schema and RLS migrations
docs/                            Manual test cases and feature specs
public/                          Static assets and Vinculo logo
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

At minimum, configure Supabase values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The app can boot without AI or Twilio keys, but most authenticated pages expect Supabase tables from the migrations.

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

Build for production:

```bash
npm run build
npm run start
```

Run linting:

```bash
npm run lint
```

## Environment Variables

Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

AI providers:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6
```

Feature flags:

```bash
APP_LOCKDOWN_ENABLED=true
NEXT_PUBLIC_AI_V2_ENABLED=true
NEXT_PUBLIC_AI_V2_PHASE=1
NEXT_PUBLIC_AI_V2_ROLLOUT=0.12
NO_PHOTOS_FIRST_ENABLED=true
AI_PRE_DATE_BRIEFING_ENABLED=true
COUPLE_MODE_ENABLED=true
IRL_FEATURE_ENABLED=false
```

Matchmaking waitlist controls:

```bash
MATCH_FORCE_WAITLIST=false
MATCH_WAITLIST_MIN_POOL_SIZE=20
MATCH_WAITLIST_RELEASE_USER_COUNT=50
MATCH_WAITLIST_EARLY_RELEASE_USER_COUNT=16
MATCH_WAITLIST_BALANCE_RATIO=0.72
```

Twilio SMS:

```bash
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_MESSAGING_SERVICE_SID=
```

Cron and policy links:

```bash
CRON_SECRET=
NEXT_PUBLIC_POLICY_PROVIDER=
NEXT_PUBLIC_TERMLY_PRIVACY_URL=
NEXT_PUBLIC_IUBENDA_PRIVACY_URL=
NEXT_PUBLIC_PRIVACY_POLICY_URL=
NEXT_PUBLIC_PRIVACY_LAST_UPDATED=
```

## Auth and Access Control

Route protection lives in `src/proxy.ts`.

- Public routes include `/`, auth pages, privacy, terms, safety, contact, blog, and careers.
- Protected routes include `/dashboard`, `/onboarding`, `/app/*`, `/matches/*`, and `/messages/*`.
- Users without onboarding data are redirected to `/onboarding` for most protected app pages.
- When `APP_LOCKDOWN_ENABLED` is on, non-tester users are restricted to launch-safe areas like matches, couples, profile, and settings.
- Tester access is determined by `isQaAccessEmail` in `src/lib/utils.ts`.

## Database and Supabase

Supabase clients are centralized in `utils/supabase`.

- `client.ts` creates the browser client.
- `server.ts` creates the cookie-aware server client.
- `admin.ts` creates the service-role client for privileged operations.
- `env.ts` normalizes accepted Supabase env var names.

The `supabase/migrations` folder contains schema/RLS changes for onboarding, matches, conversations, safety actions, profile photo storage, matchmaking signals and waitlist, AI pre-date briefings, couple mode, couple invites, message photos, and IRL date track.

Apply these migrations to your Supabase project before testing the full app.

## Matching System

The matching backend is in `src/server/matchmaking`.

Core behavior:

- Pulls the current user and candidate profiles from Supabase, falling back to `src/lib/mockData.ts` where appropriate.
- Applies hard filters for relationship intent, age range, distance, gender preferences, dealbreakers, incomplete profiles, missing photos, blocks, reports, unmatches, and recent shown history.
- Scores values, communication style, dating pace, lifestyle, interests, goals, and emotional fit.
- Produces compatibility score, ranking score, explanation, reason list, confidence, and explainability signals.
- Applies optional AI ranking deltas through OpenAI or Anthropic without changing hard eligibility.
- Limits daily recommendations and records shown history.
- Can gate users behind a waitlist until pool-size and balance thresholds are met.

Important routes:

```text
GET  /api/matchmaking/recommendations?userId=user-1&limit=10
POST /api/matchmaking/recommendations
POST /api/matchmaking/signals
```

Recommendation POST body:

```json
{
  "userId": "user-1",
  "limit": 10,
  "tier": "free"
}
```

Signal POST body:

```json
{
  "actorUserId": "user-1",
  "targetUserId": "p-1",
  "idempotencyKey": "evt-user-1-p-1-like-001",
  "type": "like",
  "metadata": {
    "source": "discover"
  }
}
```

Supported signal types are `profile_view`, `like`, `pass`, `message_sent`, `message_received`, `spark_answered`, `date_planned`, and `report`.

## Photo Privacy

The no-photos-first feature lives in `src/lib/photoAccess.ts`.

By default, other users' photos stay locked until there is a mutual match. Self views and admin/moderator contexts can still view photos. Disable the behavior with:

```bash
NO_PHOTOS_FIRST_ENABLED=false
```

## AI Features

The app has several optional AI-assisted features. Each has deterministic fallbacks if API keys are missing or provider calls fail.

- AI chat route: `POST /api/ai`
- AI v2 rollout state: `src/lib/aiV2.ts` and `src/hooks/useAiV2.ts`
- Matchmaking quality layer: `src/server/matchmaking/ai.ts`
- Pre-date briefing: `src/server/ai/preDateBriefing.ts`
- Message spark suggestions: `POST /api/messages/spark-suggestions`
- Couple date planner: `POST /api/couples/planner`
- Couple intelligence: `POST /api/couples/intelligence`

The pre-date briefing route only returns guidance for mutual matches and caches briefings in `pre_date_briefings` when the table exists.

```text
POST /api/ai/pre-date-briefing
```

## Connection Track and IRL Date Track

Connection track services create and maintain active relationship tracks for matched pairs.

```text
GET  /api/connection-track/state
POST /api/connection-track/respond
POST /api/connection-track/pre-date/start
```

IRL Date Track is controlled by:

```bash
IRL_FEATURE_ENABLED=true
```

IRL behavior:

- Finds an active match for the viewer.
- Counts consecutive days where both participants answered daily micro-questions.
- Unlocks IRL flow after three complete connection-track days.
- Tracks readiness from both users.
- Suggests a date style from shared values and communication style.
- Reveals intention answers only after both users submit.
- Prompts post-date reflection after the configured due time.

Routes:

```text
POST /api/irl/ready
GET  /api/irl/ready/[matchId]
POST /api/irl/intention
GET  /api/irl/intention/[matchId]
POST /api/irl/reflection
POST /api/irl/jobs/reflection-prompt
```

## Couple Mode

Couple mode lives in `src/server/couples` and `src/app/app/couples`.

Behavior:

- Resolves a confirmed couple for the signed-in user.
- Lets both partners opt in through couple-mode preferences.
- Disables the pair if either user has blocked or unmatched the other.
- Picks deterministic daily and weekly questions with rotation rules.
- Supports date planning, reminders, love notes, invites, and couple intelligence.

Routes:

```text
GET/POST /api/couples/mode
GET      /api/couples/state
POST     /api/couples/respond
POST     /api/couples/planner
POST     /api/couples/intelligence
POST     /api/couples/reminders
POST     /api/couples/love-notes
POST     /api/couples/invite
POST     /api/couples/invite/accept
```

## Messaging and Safety

Messaging routes:

```text
POST /api/messages/start
POST /api/messages/spark-suggestions
```

Safety routes:

```text
POST /api/safety/block
DELETE /api/safety/block
GET  /api/safety/blocks
POST /api/safety/report
POST /api/safety/unmatch
```

Safety actions are designed to affect matching, match visibility, conversation availability, connection tracks, and couple state where relevant.

## SMS

Twilio SMS is available through:

```text
POST /api/sms/send
```

Body:

```json
{
  "to": "+15551234567",
  "body": "Your Vinculo date plan is set for Friday at 7:30 PM."
}
```

The matchmaking signal route can also send an SMS when a `date_planned` signal includes `metadata.smsTo` and `metadata.smsBody`.

## Test and QA Notes

Manual QA docs live in `docs/`:

- `docs/matchmaking-v1-test-cases.md`
- `docs/no-photos-first-test-cases.md`
- `docs/couple-mode-v1-test-cases.md`
- `docs/ai-pre-date-briefing-test-cases.md`

Automated test files currently live in `src/tests`, but `package.json` does not define a test script yet. The available validation command is:

```bash
npm run lint
```

Useful smoke areas after feature work:

- Public landing page: `/`
- Auth: `/auth/login`, `/auth/signup`
- Onboarding: `/onboarding`
- App shell: `/app/matches`, `/app/discover`, `/app/messages`, `/app/couples`
- Match details: `/matches/[id]` and `/app/journey/[matchId]`
- Settings and blocked users: `/app/settings`, `/app/settings/blocked-users`

## Development Notes

- This repo uses Next.js App Router conventions. The local agent instruction says to consult `node_modules/next/dist/docs/` before changing Next-specific code because this installed Next version may differ from older conventions.
- Keep secrets out of git. Use `.env.local` for real keys.
- Prefer adding migrations for schema changes instead of relying on manual Supabase edits.
- Most optional AI and cache tables are written defensively so missing providers or optional tables fall back rather than breaking the whole flow.
- The app currently mixes mock/demo data and Supabase data in some server paths. Check each feature's store/service before assuming it is fully production-backed.
