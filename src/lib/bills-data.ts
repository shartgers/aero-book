/**
 * Shared bills data access. Used by the bills API route and the bills page
 * so the page can read bills in the same request context as auth.getSession(),
 * avoiding 401s from internal fetch() where session cookies may not be forwarded.
 */
import { db } from "@/db/index";
import { bills, bookings, aircraft, users } from "@/db/schema";
import { eq, desc, or } from "drizzle-orm";

/** Minimal user shape from Neon Auth session */
interface SessionUser {
  id: string;
  email?: string | null;
}

/**
 * Returns bills for the given user. Matches by user id or by email so seeded
 * data tied to public.users by email still shows when the same person is logged in.
 */
export async function getBillsForUser(user: SessionUser) {
  return db
    .select({
      id: bills.id,
      bookingId: bills.bookingId,
      userId: bills.userId,
      aircraftHours: bills.aircraftHours,
      aircraftCost: bills.aircraftCost,
      instructorHours: bills.instructorHours,
      instructorCost: bills.instructorCost,
      landingFees: bills.landingFees,
      surcharges: bills.surcharges,
      totalAmount: bills.totalAmount,
      status: bills.status,
      paymentIntentId: bills.paymentIntentId,
      paidAt: bills.paidAt,
      createdAt: bills.createdAt,
      updatedAt: bills.updatedAt,
      aircraftTailNumber: aircraft.tailNumber,
      bookingStartTime: bookings.startTime,
    })
    .from(bills)
    .innerJoin(bookings, eq(bookings.id, bills.bookingId))
    .innerJoin(aircraft, eq(aircraft.id, bookings.aircraftId))
    .innerJoin(users, eq(users.id, bills.userId))
    .where(
      or(
        eq(bills.userId, user.id),
        eq(users.email, user.email ?? "")
      )
    )
    .orderBy(desc(bills.createdAt));
}
