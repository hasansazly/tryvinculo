This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Matchmaking Backend API

The project now includes a full backend matchmaking engine under `src/server/matchmaking` and API routes under `src/app/api/matchmaking`.

### 1) Run matchmaking pipeline

`POST /api/matchmaking/recommendations`

Body:

```json
{
  "userId": "user-1",
  "limit": 10
}
```

Returns ranked recommendations with:
- compatibility score
- per-dimension breakdown
- human-readable reasons
- `whySignals` trust/explainability trace
- confidence level

### 2) Read latest recommendations

`GET /api/matchmaking/recommendations?userId=user-1&limit=10`

### 3) Ingest behavioral signals

`POST /api/matchmaking/signals`

Body:

```json
{
  "actorUserId": "user-1",
  "targetUserId": "p-1",
  "idempotencyKey": "evt-user-1-p-1-like-2026-04-14T19:00:00Z",
  "type": "like",
  "metadata": {
    "source": "discover"
  }
}
```

Supported signal types:
- `profile_view`
- `like`
- `pass`
- `message_sent`
- `message_received`
- `spark_answered`
- `date_planned`
- `report`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
