"use client";

/**
 * Neon Auth client for browser-side auth (hooks, sign-in/out, session).
 * Pass to NeonAuthUIProvider and use in client components.
 */
import { createAuthClient } from "@neondatabase/auth/next";

export const authClient = createAuthClient();
