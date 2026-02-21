import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bookings, unfulfilledDemand, users } from "@/db/schema";
import { eq, and, ne, gte, lte, sql, count } from "drizzle-orm";

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

  // Peak hours: GROUP BY hour, day of week from non-cancelled bookings
  const peakHours = await db
    .select({
      hour: sql<number>`extract(hour from ${bookings.startTime})`.as("hour"),
      dayOfWeek: sql<number>`extract(dow from ${bookings.startTime})`.as("day_of_week"),
      bookingCount: count().as("booking_count"),
    })
    .from(bookings)
    .where(
      and(
        ne(bookings.status, "cancelled"),
        gte(bookings.startTime, from),
        lte(bookings.startTime, to)
      )
    )
    .groupBy(
      sql`extract(hour from ${bookings.startTime})`,
      sql`extract(dow from ${bookings.startTime})`
    )
    .orderBy(sql`booking_count desc`);

  // Unfulfilled demand in range
  const unfulfilled = await db
    .select()
    .from(unfulfilledDemand)
    .where(
      and(
        gte(unfulfilledDemand.createdAt, from),
        lte(unfulfilledDemand.createdAt, to)
      )
    );

  const unfulfilledCount = unfulfilled.length;
  const unfulfilledByReason: Record<string, number> = {};
  for (const entry of unfulfilled) {
    unfulfilledByReason[entry.reason] = (unfulfilledByReason[entry.reason] ?? 0) + 1;
  }

  // Top unfulfilled slots
  const topUnfulfilledSlots = await db
    .select({
      hour: sql<number>`extract(hour from ${unfulfilledDemand.requestedStartTime})`.as("hour"),
      dayOfWeek: sql<number>`extract(dow from ${unfulfilledDemand.requestedStartTime})`.as("day_of_week"),
      count: count().as("count"),
    })
    .from(unfulfilledDemand)
    .where(
      and(
        gte(unfulfilledDemand.createdAt, from),
        lte(unfulfilledDemand.createdAt, to)
      )
    )
    .groupBy(
      sql`extract(hour from ${unfulfilledDemand.requestedStartTime})`,
      sql`extract(dow from ${unfulfilledDemand.requestedStartTime})`
    )
    .orderBy(sql`count desc`);

  return NextResponse.json({
    peakHours: peakHours.map((r) => ({
      hour: Number(r.hour),
      dayOfWeek: Number(r.dayOfWeek),
      bookingCount: Number(r.bookingCount),
    })),
    unfulfilledCount,
    unfulfilledByReason,
    topUnfulfilledSlots: topUnfulfilledSlots.map((r) => ({
      hour: Number(r.hour),
      dayOfWeek: Number(r.dayOfWeek),
      count: Number(r.count),
    })),
  });
}
