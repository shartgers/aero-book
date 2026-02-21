import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bills, bookings, aircraft, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id));
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status");

  let query = db
    .select({
      id: bills.id,
      bookingId: bills.bookingId,
      userId: bills.userId,
      userName: users.name,
      userEmail: users.email,
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
      aircraftTailNumber: aircraft.tailNumber,
      bookingStartTime: bookings.startTime,
      bookingEndTime: bookings.endTime,
    })
    .from(bills)
    .innerJoin(bookings, eq(bookings.id, bills.bookingId))
    .innerJoin(aircraft, eq(aircraft.id, bookings.aircraftId))
    .innerJoin(users, eq(users.id, bills.userId))
    .$dynamic();

  if (statusFilter) {
    query = query.where(eq(bills.status, statusFilter as "pending" | "paid" | "disputed" | "refunded"));
  }

  const results = await query.orderBy(desc(bills.createdAt));

  return NextResponse.json(results);
}
