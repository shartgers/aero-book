export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bookings, techLogEntries, users } from "@/db/schema";
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

  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "Booking must be confirmed to dispatch" }, { status: 400 });
  }

  // Auth: booking owner or instructor/admin
  const role = await getUserRole(userId);
  if (booking.userId !== userId && role !== "instructor" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { hobbsOut, fuelState, preFlightConfirmed, remarks } = body;

  if (typeof hobbsOut !== "number" || typeof fuelState !== "string") {
    return NextResponse.json({ error: "hobbsOut (number) and fuelState (string) are required" }, { status: 400 });
  }

  if (preFlightConfirmed !== true) {
    return NextResponse.json({ error: "Pre-flight check must be confirmed" }, { status: 400 });
  }

  const [updated] = await db.update(bookings).set({
    status: "dispatched",
    actualStartTime: new Date(),
    updatedAt: new Date(),
  }).where(eq(bookings.id, id)).returning();

  await db.insert(techLogEntries).values({
    aircraftId: booking.aircraftId,
    bookingId: booking.id,
    pilotId: userId,
    entryDate: new Date(),
    hobbsOut: String(hobbsOut),
    remarks: remarks ?? null,
  });

  return NextResponse.json(updated);
}
