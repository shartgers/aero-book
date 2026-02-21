/**
 * Ensures the Neon Auth session user exists in the app's public.users table.
 * - Neon Auth stores users in its own schema (e.g. neon_auth); the app stores
 *   profile and role (member, admin, etc.) in public.users.
 * - Bookings, bills, certificates, etc. reference public.users.id, so we must
 *   sync the signed-in user into public.users on first use.
 * - Called from the dashboard (so every signed-in user gets a row on first load)
 *   and from APIs that write to user-scoped tables (bookings, logbook, etc.).
 * Uses insert + onConflictDoNothing so concurrent requests don't duplicate rows.
 */
import { db } from "@/db/index";
import { users } from "@/db/schema";

const PLACEHOLDER_PASSWORD = "";

/** Session user shape from auth.getSession() (id, email, name). */
export async function ensureNeonAuthUserInAppDb(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<void> {
  await db
    .insert(users)
    .values({
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      // User is authenticated via Neon Auth; we don't store their password here.
      passwordHash: PLACEHOLDER_PASSWORD,
    })
    .onConflictDoNothing({ target: users.id });
}
