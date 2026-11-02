# lari-watch

Lari exchange rates from the National Bank of Georgia, with history and a converter. English and Georgian.

Live: https://lari-watch.vercel.app

[![CI](https://github.com/samsonidze/lari-watch/actions/workflows/ci.yml/badge.svg)](https://github.com/samsonidze/lari-watch/actions/workflows/ci.yml)

![screenshot](docs/screenshot.png)

I kept opening nbg.gov.ge to check the dollar and euro, and the official page is a plain table for one day with no chart. This is the version I wanted: today's rate for every currency, how it moved over the last month/quarter/year, and a quick converter. Rates shown per 1 unit even where the bank quotes per 100 or 1000 (JPY, KRW, UZS...).

Pick a date to see rates for any past day. `?cur=EUR&date=2026-03-01` links straight to it.

## Stack

React 18, TypeScript, Vite, Tailwind 4, TanStack Query, Recharts. Vitest for tests. Two small Vercel functions for the API.

## The API part

NBG's endpoint returns one day per request and has no history call. A one-year chart means ~260 requests (business days only), which I didn't want every visitor's browser doing against a government API. So:

- `api/history` fans the requests out with a concurrency limit, lines every currency up on one date axis (missing days stay missing, no interpolation) and gets cached at Vercel's edge for 6 hours.
- `api/rates` just proxies one day. Today is cached for 30 min, past days for a day, since they never change.

Both handlers live in `server/` as plain functions with an injectable `fetch`. `api/*.ts` are thin Vercel adapters, and a tiny Vite plugin mounts the same handlers in `npm run dev`, so there's one implementation and no `vercel dev` needed.

"Today" on the server is the date in Tbilisi, not UTC. The bank publishes against local time and late in the evening those differ.

## Running it

```
npm install
npm run dev     # localhost:5173, /api/* served by the vite plugin
npm test
```

Deploys to Vercel with no settings and no env vars.

## Data

[nbg.gov.ge](https://nbg.gov.ge/en/monetary-policy/currency). Rates are set each business day and come into force the next day.
