# Drizzle migrations

- **Schema (source of truth):** `src/db/schema.ts`
- **Config:** `drizzle.config.ts` (loads `DATABASE_URL` from `.env.local`)

## Commands

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate a new migration from schema changes |
| `npm run db:migrate` | Apply pending migrations to Neon DB |
| `npm run db:verify` | Check connection and list tables |
| `npm run db:studio` | Open Drizzle Studio |

## Tables (from initial migration)

- `public.users` – id, email, password_hash, name, created_at, updated_at
- `public.sessions` – id, user_id, session_token, expires (FK → users)

Migration state is stored in `drizzle.__drizzle_migrations`.
