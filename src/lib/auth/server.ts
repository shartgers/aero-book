/**
 * Neon Auth server instance.
 * Used in Server Components, Server Actions, API routes, and middleware.
 * Requires NEON_AUTH_BASE_URL and NEON_AUTH_COOKIE_SECRET in env.
 */
import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});
