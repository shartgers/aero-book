/**
 * Ensures the Neon Auth session user exists in the app's public.users table.
 * Bookings and other tables reference public.users.id; Neon Auth stores users
 * in neon_auth schema, so we sync the signed-in user into public.users on first use.
 *
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
