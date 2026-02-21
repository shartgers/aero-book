/**
 * Protects /dashboard and /account; redirects unauthenticated users to sign-in.
 * Next.js 16 uses the "proxy" file convention (replaces deprecated "middleware").
 * Session refresh is handled by Neon Auth.
 * File must be named proxy.ts (not middleware.ts) to avoid the deprecation warning.
 */
import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/logbook",
    "/logbook/:path*",
    "/safety",
    "/safety/:path*",
    "/training",
    "/training/:path*",
  ],
};
