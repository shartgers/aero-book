import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bills, bookings, aircraft } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await db
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
    .where(eq(bills.userId, session.user.id))
    .orderBy(desc(bills.createdAt));

  return NextResponse.json(results);
}
