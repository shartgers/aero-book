/**
 * Shared certificates data access. Used by the certificates API route and
 * the dashboard page so the page can read certificates in the same request
 * context as auth.getSession(), avoiding 401s from internal fetch() where
 * session cookies may not be forwarded.
 */
import { db } from "@/db/index";
import { certificates } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

/**
 * Returns certificates for the given user id, ordered by expiry date.
 */
export async function getCertificatesForUser(userId: string) {
  return db
    .select()
    .from(certificates)
    .where(eq(certificates.userId, userId))
    .orderBy(asc(certificates.expiryDate));
}
