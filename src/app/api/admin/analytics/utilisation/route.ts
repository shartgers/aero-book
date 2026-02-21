import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { aircraft, bookings, bills, users } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

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
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : defaultFrom;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : now;

  // Days in range
  const daysInRange = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
  const availableHoursPerDay = 14; // 06:00-20:00
  const totalAvailableHours = daysInRange * availableHoursPerDay;

  // Get all aircraft
  const allAircraft = await db.select().from(aircraft);

  // Get completed bookings in range per aircraft
  const completedBookings = await db
    .select({
      aircraftId: bookings.aircraftId,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      actualStartTime: bookings.actualStartTime,
      actualEndTime: bookings.actualEndTime,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "completed"),
        gte(bookings.startTime, from),
        lte(bookings.startTime, to)
      )
    );

  // Get revenue from bills
  const billResults = await db
    .select({
      aircraftId: bookings.aircraftId,
      totalAmount: bills.totalAmount,
    })
    .from(bills)
    .innerJoin(bookings, eq(bookings.id, bills.bookingId))
    .where(
      and(
        gte(bookings.startTime, from),
        lte(bookings.startTime, to),
        eq(bookings.status, "completed")
      )
    );

  const results = allAircraft.map((ac) => {
    const acBookings = completedBookings.filter((b) => b.aircraftId === ac.id);
    const totalBookedHours = acBookings.reduce((sum, b) => {
      const s = (b.actualStartTime ?? b.startTime).getTime();
      const e = (b.actualEndTime ?? b.endTime).getTime();
      return sum + (e - s) / (1000 * 60 * 60);
    }, 0);

    const acBills = billResults.filter((b) => b.aircraftId === ac.id);
    const revenueTotal = acBills.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);

    return {
      aircraftId: ac.id,
      tailNumber: ac.tailNumber,
      type: ac.type,
      totalAvailableHours,
      totalBookedHours: Math.round(totalBookedHours * 100) / 100,
      utilisationRate: Math.round((totalBookedHours / totalAvailableHours) * 1000) / 1000,
      completedFlights: acBookings.length,
      revenueTotal: revenueTotal.toFixed(2),
    };
  });

  return NextResponse.json(results);
}
