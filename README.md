# Aero Book

A Next.js 15 boilerplate with Tailwind CSS, shadcn/ui, Neon (PostgreSQL) + Drizzle ORM, and **Neon Auth** for authentication.

## Stack

- **Next.js 15** — App Router, TypeScript
- **Tailwind CSS v4**
- **shadcn/ui** — UI components
- **Neon** — Serverless PostgreSQL
- **Drizzle ORM** — Type-safe database queries
- **Neon Auth** — Email/password and optional social sign-in (Better Auth, hosted on Neon)

## Getting Started

### 1. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

- `DATABASE_URL` — Your Neon connection string (from [neon.tech](https://neon.tech))
- `NEON_AUTH_BASE_URL` — Neon Auth server URL (Neon Console → Project → Branch → Auth → Configuration)
- `NEON_AUTH_COOKIE_SECRET` — At least 32 characters (e.g. `openssl rand -base64 32`)

### 2. Install dependencies

```bash
npm install
```

### 3. Push database schema

```bash
npm run db:generate
npm run db:migrate
```

Or push directly (for development):

```bash
npx drizzle-kit push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── account/[path]/  # Account settings (Neon Auth UI)
│   ├── api/auth/[...path]  # Neon Auth API proxy
│   ├── auth/[path]/     # Sign-in, sign-up, sign-out (Neon Auth UI)
│   └── dashboard/       # Protected page
├── components/ui/       # shadcn/ui components
├── db/                  # Drizzle client & schema
├── lib/
│   └── auth/            # Neon Auth server & client
└── proxy.ts              # Route protection (redirect to /auth/sign-in)
```

## Database Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio |
