import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bills, bookings, aircraft, users } from "@/db/schema";
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

  // Get all bills in range
  const allBills = await db
    .select({
      totalAmount: bills.totalAmount,
      status: bills.status,
      aircraftId: bookings.aircraftId,
      tailNumber: aircraft.tailNumber,
      createdAt: bills.createdAt,
    })
    .from(bills)
    .innerJoin(bookings, eq(bookings.id, bills.bookingId))
    .innerJoin(aircraft, eq(aircraft.id, bookings.aircraftId))
    .where(
      and(
        gte(bills.createdAt, from),
        lte(bills.createdAt, to)
      )
    );

  const totalRevenue = allBills.reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
  const paidRevenue = allBills
    .filter((b) => b.status === "paid")
    .reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);
  const pendingRevenue = allBills
    .filter((b) => b.status === "pending")
    .reduce((sum, b) => sum + parseFloat(b.totalAmount), 0);

  // Revenue by aircraft
  const byAircraftMap = new Map<string, { tailNumber: string; revenue: number }>();
  for (const b of allBills) {
    const existing = byAircraftMap.get(b.aircraftId) ?? { tailNumber: b.tailNumber, revenue: 0 };
    existing.revenue += parseFloat(b.totalAmount);
    byAircraftMap.set(b.aircraftId, existing);
  }
  const byAircraft = Array.from(byAircraftMap.values()).map((v) => ({
    tailNumber: v.tailNumber,
    revenue: v.revenue.toFixed(2),
  }));

  // Revenue by month
  const byMonthMap = new Map<string, number>();
  for (const b of allBills) {
    const month = b.createdAt.toISOString().slice(0, 7); // "YYYY-MM"
    byMonthMap.set(month, (byMonthMap.get(month) ?? 0) + parseFloat(b.totalAmount));
  }
  const byMonth = Array.from(byMonthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({
      month,
      revenue: revenue.toFixed(2),
    }));

  return NextResponse.json({
    totalRevenue: totalRevenue.toFixed(2),
    paidRevenue: paidRevenue.toFixed(2),
    pendingRevenue: pendingRevenue.toFixed(2),
    byAircraft,
    byMonth,
  });
}
