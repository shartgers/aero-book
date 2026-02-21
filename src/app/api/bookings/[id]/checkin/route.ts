export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bookings, techLogEntries, squawks, aircraft, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { id } = await params;
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  if (booking.status !== "dispatched") {
    return NextResponse.json({ error: "Booking must be dispatched to check in" }, { status: 400 });
  }

  // Auth: booking owner or instructor/admin
  const role = await getUserRole(userId);
  if (booking.userId !== userId && role !== "instructor" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { hobbsIn, fuelPostFlight, newSquawk } = body;

  if (typeof hobbsIn !== "number" || typeof fuelPostFlight !== "string") {
    return NextResponse.json({ error: "hobbsIn (number) and fuelPostFlight (string) are required" }, { status: 400 });
  }

  // Find the tech log entry for this booking
  const [techEntry] = await db.select().from(techLogEntries)
    .where(eq(techLogEntries.bookingId, booking.id));

  // Compute airtime
  const airtime = techEntry?.hobbsOut
    ? String((hobbsIn - parseFloat(techEntry.hobbsOut)).toFixed(1))
    : null;

  // Update tech log entry
  if (techEntry) {
    await db.update(techLogEntries).set({
      hobbsIn: String(hobbsIn),
      airtime,
      fuelAdded: fuelPostFlight,
    }).where(eq(techLogEntries.id, techEntry.id));
  }

  // Update booking
  const [updated] = await db.update(bookings).set({
    status: "checked_in",
    actualEndTime: new Date(),
    updatedAt: new Date(),
  }).where(eq(bookings.id, id)).returning();

  // Handle optional new squawk
  if (newSquawk) {
    const squawkSeverity = newSquawk.severity ?? "operational";
    await db.insert(squawks).values({
      aircraftId: booking.aircraftId,
      reportedBy: userId,
      title: newSquawk.title,
      description: newSquawk.description ?? "",
      severity: squawkSeverity,
      status: "open",
    });

    // Ground aircraft if airworthiness squawk
    if (squawkSeverity === "airworthiness") {
      await db.update(aircraft).set({ status: "grounded" }).where(eq(aircraft.id, booking.aircraftId));
    }
  }

  return NextResponse.json(updated);
}
