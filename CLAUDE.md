# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

AeroBook is a flight association management platform for aero clubs — aircraft booking, squawk management, billing, and fleet analytics. It targets clubs running 5–15 aircraft as a lighter alternative to Private-Radar. See `plans/prd.md` for full requirements and `plans/build-plan.md` for the phased implementation plan.

**Current status:** All 5 phases complete. Full feature set built and migrated.

## Commands

```bash
npm run dev          # Start dev server (webpack — do NOT use turbopack, see note below)
npm run build        # Production build
npm run lint         # ESLint

npm run db:generate  # Generate Drizzle migration files from schema
npm run db:migrate   # Run pending migrations
npm run db:studio    # Open Drizzle Studio (browser DB GUI)
npm run db:verify    # Verify DB connection (scripts/db-verify.mjs)
npm run db:aircraft-photos  # Fetch aircraft photos by tail number and update image_url (scripts/aircraft-photos.mjs)
```

No test runner is configured yet.

> **Windows/Turbopack bug:** `npm run dev` uses `--webpack` intentionally. Turbopack fails to resolve Tailwind CSS `@import` from the correct `node_modules` when the repo lives inside `D:\GitHub\` — do not switch to turbopack.

## Architecture

### Auth

Auth is provided by Neon Auth (`@neondatabase/auth`):

- `src/lib/auth/server.ts` — `auth` instance for Server Components, API routes, and proxy (middleware). Used to call `auth.getSession()` and `auth.middleware()`.
- `src/lib/auth/client.ts` — `authClient` for Client Components (hooks, sign-in/out).
- `src/app/layout.tsx` — wraps the app in `<NeonAuthUIProvider>` with `UserButton` in the header.
- `src/proxy.ts` — route protection (Next.js 16 uses `proxy.ts`, not `middleware.ts`). Redirects unauthenticated users to `/auth/sign-in` for `/dashboard` and `/account` routes.
- Auth UI pages live at `/auth/[path]` (sign-in, sign-up, sign-out) — rendered by Neon's `AuthView`.
- Account UI pages live at `/account/[path]` (e.g. `/account/settings`) — rendered by Neon's `AccountView`.
- Auth API is proxied at `/api/auth/[...path]`.

Env vars required: `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `DATABASE_URL`.

### Database

- `src/db/index.ts` — exports `db` (Drizzle client using `drizzle-orm/neon-http`).
- `src/db/schema.ts` — single source of truth for all tables. Tables: `users`, `sessions`, `aircraft`, `squawks`, `bookings`, `clubSettings`, `instructors`, `instructorAvailability`, `bookingInstructors`, `waitlist`, `backupPreferences`, `bills`, `billDisputes`, `payments`, `unfulfilledDemand`, `analyticsSnapshots`, `certificates`, `notificationPreferences`.
- `drizzle.config.ts` — points Drizzle Kit at `src/db/schema.ts`, outputs migrations to `./drizzle/`, loads `.env.local`.

When adding tables: edit `src/db/schema.ts`, then run `db:generate` → `db:migrate`.

### Data Access

Two patterns for querying data:

1. **Drizzle ORM** (`db` from `src/db/index.ts`) — preferred for type-safe queries in Server Components and API routes.
2. **PostgREST client** (`src/lib/neon-api.ts`) — typed helpers (`neonSelect`, `neonInsert`, `neonUpdate`, `neonDelete`) for the Neon REST API. Supports optional JWT Bearer token auth for row-level security via Neon Authorize.

### UI Components

shadcn/ui-style components live in `src/components/ui/`. Add new shadcn components with:
```bash
npx shadcn@latest add <component>
```

Tailwind CSS v4 is used. `src/lib/utils.ts` exports `cn()` (clsx + tailwind-merge).

### Additional dependencies

- `stripe` — billing / payment intents (`src/app/api/bills/[id]/pay/route.ts`, webhook at `src/app/api/stripe/webhook/route.ts`)
- `web-push` — Web Push notifications (`src/lib/push.ts`). Requires `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` env vars.
- `@anthropic-ai/claude-agent-sdk` — listed as a dependency for planned AI features, not yet wired into application code.

### PWA

- `public/manifest.json` — app manifest (standalone display, theme colour `#1d4ed8`)
- `public/sw.js` — service worker: cache-first for static assets, network-first for `/api/`, push notification handling
- `src/components/ServiceWorkerRegistrar.tsx` — client component registered in layout that activates the SW
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` env var required client-side for push subscription

### Route map

| Area | Routes |
|---|---|
| Aircraft | `/aircraft`, `/aircraft/[id]`, `/api/aircraft`, `/api/aircraft/[id]` |
| Bookings | `/bookings`, `/bookings/new`, `/bookings/[id]`, `/api/bookings`, `/api/bookings/[id]`, `/api/bookings/available-aircraft`, `/api/availability`, `/api/bookings/backup-options` |
| Squawks | `/api/squawks`, `/api/squawks/[id]` |
| Instructors | `/api/instructors`, `/api/instructors/[id]`, `/api/instructors/[id]/availability` |
| Waitlist | `/api/waitlist`, `/api/waitlist/[id]` |
| Settings | `/api/settings` |
| Billing | `/bills`, `/bills/[id]`, `/api/bills`, `/api/bills/[id]`, `/api/bills/[id]/pay`, `/api/bills/[id]/dispute`, `/api/stripe/webhook` |
| Admin billing | `/admin/bills`, `/admin/bills/[id]`, `/api/admin/bills`, `/api/admin/bills/[id]` |
| Analytics | `/admin/analytics`, `/api/admin/analytics/utilisation`, `/api/admin/analytics/demand`, `/api/admin/analytics/instructors`, `/api/admin/analytics/revenue` |
| Certificates | `/account/certificates`, `/api/certificates`, `/api/certificates/[id]`, `/api/admin/certificates` |
| Notifications | `/account/notifications`, `/api/notifications/preferences`, `/api/notifications/subscribe`, `/api/notifications/unsubscribe` |
| Admin | `/admin`, `/admin/certificates` |

### Key Conventions

- All timestamps stored in UTC.
- Protected pages do a server-side session check (`auth.getSession()`) in addition to proxy-level protection — see `src/app/dashboard/page.tsx` for the pattern.
- `export const dynamic = "force-dynamic"` on pages that read session data to prevent static caching.
- The `authClient` requires a type assertion in `NeonAuthUIProvider` (`authClient as Parameters<typeof NeonAuthUIProvider>[0]["authClient"]`) due to a duplicate `@better-fetch/fetch` resolution in node_modules — this is a known workaround, do not remove it.
