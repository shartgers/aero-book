import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { aircraft, bookings, backupPreferences } from "@/db/schema";
import { eq, and, ne, lt, gt } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const aircraftId = searchParams.get("aircraftId");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");

  if (!aircraftId || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required query params: aircraftId, startTime, endTime" }, { status: 400 });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Find the type of the requested aircraft
  const [requestedAircraft] = await db
    .select({ type: aircraft.type })
    .from(aircraft)
    .where(eq(aircraft.id, aircraftId));

  if (!requestedAircraft) {
    return NextResponse.json({ error: "Aircraft not found" }, { status: 404 });
  }

  // Find all other aircraft of the same type
  const sameTypeAircraft = await db
    .select()
    .from(aircraft)
    .where(
      and(
        eq(aircraft.type, requestedAircraft.type),
        ne(aircraft.id, aircraftId),
        eq(aircraft.status, "available")
      )
    );

  // For each candidate, check for overlapping bookings
  const available: typeof sameTypeAircraft = [];
  for (const candidate of sameTypeAircraft) {
    const conflicts = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.aircraftId, candidate.id),
          ne(bookings.status, "cancelled"),
          lt(bookings.startTime, end),
          gt(bookings.endTime, start)
        )
      );

    if (conflicts.length === 0) {
      available.push(candidate);
    }
  }

  // Get user's backup preferences for sorting
  const prefs = await db
    .select()
    .from(backupPreferences)
    .where(
      and(
        eq(backupPreferences.userId, session.user.id),
        eq(backupPreferences.primaryAircraftId, aircraftId)
      )
    );

  const prefMap = new Map(prefs.map((p) => [p.backupAircraftId, p.priority]));

  // Sort: preferred aircraft first (by priority), then the rest
  available.sort((a, b) => {
    const aPrio = prefMap.get(a.id) ?? Infinity;
    const bPrio = prefMap.get(b.id) ?? Infinity;
    return aPrio - bPrio;
  });

  return NextResponse.json(available);
}
