# PUZO Dashboard

Web frontend for the PUZO smart desk companion backend — **user app + admin dashboard** in one Next.js project.

- **Users**: Supabase Auth login, profile, devices (provision/transfer/remove), pairing codes, relationships, interactions, subscriptions/plans, scheduled interactions.
- **Admins** (role `admin`/`super_admin`): fleet devices + send commands, firmware releases, OTA jobs, users & roles, subscriptions, audit log.

## Stack

Next.js (App Router) + TypeScript · Tailwind v4 (Puzo Cassettine theme) · TanStack Query · Zustand · Recharts-ready · @supabase/ssr · SSE realtime feed.

## Setup

```bash
npm install
cp .env.example .env.local
# fill in: PUZO_API_BASE, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#          SUPABASE_SERVICE_ROLE_KEY (server-only, for realtime), ADMIN_API_KEY
npm run dev          # http://localhost:3000
```

## How it works

- **Auth** is Supabase Auth. The browser talks only to same-origin Next.js routes.
- **BFF proxy** (`src/app/api/proxy/[...path]/route.ts`) forwards requests to the PUZO backend, attaching the user's Supabase access token server-side. The token never reaches the browser; admin routes also get the legacy `x-admin-key` from the server env.
- **Realtime** (`src/app/api/events/route.ts`): the server subscribes to Supabase Realtime (postgres_changes on `devices`, `device_events`, `ota_jobs`, `firmware_releases`, `interactions`, `schedules`) using the service-role key and streams events to the browser over SSE. If Realtime isn't enabled, the app falls back to refetching.
  - To enable: in Supabase → Database → Replication, add those tables to the `supabase_realtime` publication.
- **Design**: the `Puzo Cassettine` theme lives in `src/app/globals.css` (tokens from the backend's `docs/DESIGN_SYSTEM.md`).

## Scripts

```bash
npm run dev         # development
npm run build       # production build
npm run start       # serve the build
npm run typecheck   # tsc --noEmit
```

## Deploy

The Dockerfile builds Next's `output: 'standalone'`. On Coolify: import repo → use Dockerfile → internal port `3000` → set env vars → point the frontend at the PUZO backend with `PUZO_API_BASE`.

## Notes / limits

- Pairing/interaction/schedule screens need the target partner's device ID (the backend has no "list a partner's devices" endpoint yet).
- The SSE feed is served to any authenticated session and forwards all rows — fine for a personal/admin deployment, not for a public multi-tenant one.
- Account "email confirm" behaviour depends on your Supabase Auth settings.
