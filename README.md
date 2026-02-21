# AeroBook

A flight association management platform for aero clubs: aircraft booking, squawk management, billing, and fleet analytics. Built as a responsive web app with Next.js, Neon (PostgreSQL), Drizzle ORM, and Neon Auth.

## Stack

- **Next.js 16** — App Router, React 19, TypeScript
- **Tailwind CSS v4** — Styling
- **shadcn/ui** — UI components
- **Neon** — Serverless PostgreSQL
- **Drizzle ORM** — Type-safe database access
- **Neon Auth** — Authentication (sign-in/sign-up/account)
- **Stripe** — Billing and payments (optional)

## Getting Started

### 1. Environment variables

Copy `.env.example` to `.env.local` and set:

- `DATABASE_URL` — Neon PostgreSQL connection string
- `NEON_AUTH_BASE_URL` — Neon Auth server URL (Neon Console → Auth)
- `NEON_AUTH_COOKIE_SECRET` — At least 32 characters (e.g. `openssl rand -base64 32`)

Optional: `STRIPE_*`, `VAPID_*` for payments and push notifications.

### 2. Install and database

```bash
npm install
npm run db:generate
npm run db:migrate
```

### 3. Seed data (optional)

```bash
npm run db:seed-aircraft    # Seed aircraft (e.g. fleet from input/Vloot.md)
npm run db:vloot           # Load fleet specs into aircraft (engine, seats, speeds, etc.)
npm run db:aircraft-photos # Fetch aircraft photos by tail number
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use `/auth/sign-in` to sign in; protected routes include `/dashboard`, `/bookings`, `/aircraft`, `/account`.

## Project structure

```
src/
├── app/
│   ├── account/          # Account settings (Neon Auth)
│   ├── admin/            # Admin dashboard, bills, analytics, certificates
│   ├── aircraft/         # Fleet list, aircraft detail (with specs)
│   ├── api/              # API routes (bookings, aircraft, bills, squawks, etc.)
│   ├── auth/             # Sign-in, sign-up (Neon Auth)
│   ├── bills/            # Member bills and payment
│   ├── bookings/         # Booking list, new booking (4-step flow), booking detail
│   ├── dashboard/       # Protected home
│   └── layout.tsx
├── components/           # UI (shadcn + AircraftCard, InstructorCard, etc.)
├── db/                   # Drizzle schema and client
├── lib/                  # Auth, ensure-user, push, utils
├── proxy.ts              # Route protection (redirects to sign-in)
input/                    # Source data (e.g. Vloot.md for fleet specs)
scripts/                  # DB scripts (seed, vloot specs, aircraft photos)
plans/                    # PRD and build plan
```

## Booking flow

New bookings use a time-first flow:

1. **Date & time** — Pick slot and optional notes
2. **Aircraft** — Choose from aircraft available for that slot
3. **Instructor** — Optionally add an instructor
4. **Confirm** — Review and create booking

See `CLAUDE.md` for the full route map and conventions.

## Database scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Drizzle migrations from schema |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:studio` | Open Drizzle Studio (DB GUI) |
| `npm run db:verify` | Verify DB connection |
| `npm run db:seed-aircraft` | Seed aircraft table |
| `npm run db:vloot` | Load fleet specs from input/Vloot.md into aircraft |
| `npm run db:aircraft-photos` | Fetch aircraft photos and set `image_url` |

## Documentation

- **CLAUDE.md** — Commands, architecture, route map, conventions for contributors
- **plans/prd.md** — Product requirements
- **plans/build-plan.md** — Implementation plan and phase status
