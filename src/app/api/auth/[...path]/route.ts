/**
 * Proxies all auth requests to Neon Auth (sign-in, sign-up, sign-out, session, etc.).
 */
import { auth } from "@/lib/auth/server";

export const { GET, POST, PUT, DELETE, PATCH } = auth.handler();
