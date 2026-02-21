/**
 * GET /api/bookings/available-aircraft?startTime=ISO&endTime=ISO
 * Returns aircraft that are available for the given time slot (not grounded, no overlapping booking).
 * Uses the same overlap window logic as POST /api/bookings.
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { aircraft, bookings, clubSettings } from "@/db/schema";
import { eq, and, ne, lt, gt } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");

  if (!startTime || !endTime) {
    return NextResponse.json(
      { error: "Missing required query params: startTime, endTime (ISO strings)" },
      { status: 400 }
    );
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format for startTime or endTime" }, { status: 400 });
  }

  if (end <= start) {
    return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 });
  }

  // Same overlap window as POST /api/bookings
  const settings = await db.select().from(clubSettings);
  const overlapWindowMs = (settings[0]?.overlapWindowMinutes ?? 15) * 60 * 1000;
  const adjustedStart = new Date(start.getTime() + overlapWindowMs);
  const adjustedEnd = new Date(end.getTime() - overlapWindowMs);

  // All aircraft that are not grounded
  const allAircraft = await db
    .select({
      id: aircraft.id,
      tailNumber: aircraft.tailNumber,
      type: aircraft.type,
      hourlyRate: aircraft.hourlyRate,
    })
    .from(aircraft)
    .where(ne(aircraft.status, "grounded"));

  // Bookings that overlap the slot (any aircraft)
  const conflictingBookings = await db
    .select({ aircraftId: bookings.aircraftId })
    .from(bookings)
    .where(
      and(
        ne(bookings.status, "cancelled"),
        lt(bookings.startTime, adjustedEnd),
        gt(bookings.endTime, adjustedStart)
      )
    );

  const bookedAircraftIds = new Set(conflictingBookings.map((b) => b.aircraftId));

  const available = allAircraft.filter((ac) => !bookedAircraftIds.has(ac.id));

  return NextResponse.json(available);
}
