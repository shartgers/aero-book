import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bookings, clubSettings, aircraft, unfulfilledDemand, certificates } from "@/db/schema";
import { ensureNeonAuthUserInAppDb } from "@/lib/ensure-user";
import { eq, and, ne, lt, gt, desc, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await db
    .select()
    .from(bookings)
    .where(eq(bookings.userId, session.user.id))
    .orderBy(desc(bookings.startTime));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  try {
    const { data: session } = await auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure session user exists in public.users (Neon Auth users live in neon_auth schema).
    // Bookings.userId references public.users.id; without this, INSERT would fail with FK violation.
    await ensureNeonAuthUserInAppDb(session.user);

    const body = await request.json();
    const { aircraftId, startTime, endTime, notes } = body;

  if (!aircraftId || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields: aircraftId, startTime, endTime" }, { status: 400 });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format for startTime or endTime" }, { status: 400 });
  }

  if (end <= start) {
    return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 });
  }

  // Check for expired medical or license certificates
  const now = new Date();
  const expiredCerts = await db
    .select()
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, session.user.id),
        or(
          eq(certificates.type, "medical"),
          eq(certificates.type, "license")
        ),
        lt(certificates.expiryDate, now)
      )
    );

  if (expiredCerts.length > 0) {
    // Look up aircraft type for unfulfilled demand logging
    const [craft] = await db
      .select({ type: aircraft.type })
      .from(aircraft)
      .where(eq(aircraft.id, aircraftId));

    if (craft) {
      await db.insert(unfulfilledDemand).values({
        userId: session.user.id,
        aircraftType: craft.type,
        requestedStartTime: start,
        requestedEndTime: end,
        reason: "full_fleet",
      });
    }

    return NextResponse.json(
      { error: "Your medical or licence certificate has expired. Please update it before booking." },
      { status: 403 }
    );
  }

  // Read overlap window from club settings
  const settings = await db.select().from(clubSettings);
  const overlapWindowMs = (settings[0]?.overlapWindowMinutes ?? 15) * 60 * 1000;

  // Apply overlap window: shrink the conflict zone by the window amount
  // A booking is allowed if the gap to the adjacent booking is within the overlap window
  const adjustedStart = new Date(start.getTime() + overlapWindowMs);
  const adjustedEnd = new Date(end.getTime() - overlapWindowMs);

  // Check for overlapping bookings with overlap window applied
  const conflicts = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.aircraftId, aircraftId),
        ne(bookings.status, "cancelled"),
        lt(bookings.startTime, adjustedEnd),
        gt(bookings.endTime, adjustedStart)
      )
    );

  if (conflicts.length > 0) {
    // Log unfulfilled demand
    const [craft] = await db
      .select({ type: aircraft.type })
      .from(aircraft)
      .where(eq(aircraft.id, aircraftId));

    if (craft) {
      await db.insert(unfulfilledDemand).values({
        userId: session.user.id,
        aircraftType: craft.type,
        requestedStartTime: start,
        requestedEndTime: end,
        reason: "full_fleet",
      });
    }

    return NextResponse.json({ error: "Time slot conflicts with an existing booking" }, { status: 409 });
  }

  // Check if aircraft is grounded
  const [targetAircraft] = await db
    .select({ status: aircraft.status, type: aircraft.type })
    .from(aircraft)
    .where(eq(aircraft.id, aircraftId));

  if (targetAircraft?.status === "grounded") {
    await db.insert(unfulfilledDemand).values({
      userId: session.user.id,
      aircraftType: targetAircraft.type,
      requestedStartTime: start,
      requestedEndTime: end,
      reason: "aircraft_grounded",
    });

    return NextResponse.json({ error: "Aircraft is currently grounded" }, { status: 409 });
  }

  const [created] = await db
    .insert(bookings)
    .values({
      aircraftId,
      userId: session.user.id,
      startTime: start,
      endTime: end,
      notes: notes ?? null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
  } catch (e) {
    // Log full error server-side; return a safe message to the client (no raw SQL).
    console.error("POST /api/bookings error:", e);
    const message = e instanceof Error ? e.message : "";
    const safeMessage =
      message && !message.toLowerCase().includes("insert") && !message.toLowerCase().includes("select")
        ? message
        : "Failed to create booking. Please try again.";
    return NextResponse.json({ error: safeMessage }, { status: 500 });
  }
}
