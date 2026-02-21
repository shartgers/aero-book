import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bookings, users, aircraft, bookingInstructors, instructors, bills, waitlist, notificationPreferences } from "@/db/schema";
import { eq, and, lt, gt } from "drizzle-orm";
import { sendPushNotification } from "@/lib/push";

export const dynamic = "force-dynamic";

async function getUserRole(userId: string) {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return user?.role ?? "member";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const role = await getUserRole(session.user.id);
  if (booking.userId !== session.user.id && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(booking);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const role = await getUserRole(session.user.id);
  const body = await request.json();
  const { status } = body;

  if (!status) {
    return NextResponse.json({ error: "Missing required field: status" }, { status: 400 });
  }

  // Non-admin users can only cancel their own bookings
  if (role !== "admin") {
    if (booking.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (status !== "cancelled") {
      return NextResponse.json({ error: "Users can only cancel their own bookings" }, { status: 403 });
    }
  }

  const [updated] = await db
    .update(bookings)
    .set({ status, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();

  // Auto-generate bill when booking is completed
  if (status === "completed") {
    const startMs = (booking.actualStartTime ?? booking.startTime).getTime();
    const endMs = (booking.actualEndTime ?? booking.endTime).getTime();
    const aircraftHours = (endMs - startMs) / (1000 * 60 * 60);

    // Look up aircraft hourly rate
    const [craft] = await db
      .select({ hourlyRate: aircraft.hourlyRate })
      .from(aircraft)
      .where(eq(aircraft.id, booking.aircraftId));

    const aircraftRate = parseFloat(craft?.hourlyRate ?? "0");
    const aircraftCost = aircraftHours * aircraftRate;

    // Check for confirmed instructor
    let instructorHours: number | null = null;
    let instructorCost: number | null = null;

    const confirmedInstructors = await db
      .select({ instructorId: bookingInstructors.instructorId })
      .from(bookingInstructors)
      .where(
        and(
          eq(bookingInstructors.bookingId, id),
          eq(bookingInstructors.status, "confirmed")
        )
      );

    if (confirmedInstructors.length > 0) {
      const [instr] = await db
        .select({ hourlyRate: instructors.hourlyRate })
        .from(instructors)
        .where(eq(instructors.id, confirmedInstructors[0].instructorId));

      if (instr) {
        const instrRate = parseFloat(instr.hourlyRate);
        instructorHours = aircraftHours;
        instructorCost = instructorHours * instrRate;
      }
    }

    const totalAmount = aircraftCost + (instructorCost ?? 0);

    await db.insert(bills).values({
      bookingId: id,
      userId: booking.userId,
      aircraftHours: aircraftHours.toFixed(2),
      aircraftCost: aircraftCost.toFixed(2),
      instructorHours: instructorHours?.toFixed(2) ?? null,
      instructorCost: instructorCost?.toFixed(2) ?? null,
      totalAmount: totalAmount.toFixed(2),
      status: "pending",
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const role = await getUserRole(session.user.id);
  if (booking.userId !== session.user.id && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [updated] = await db
    .update(bookings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning();

  // Notify waitlist users whose requested slot overlaps with the cancelled booking
  const matchingWaitlist = await db
    .select()
    .from(waitlist)
    .where(
      and(
        eq(waitlist.aircraftId, booking.aircraftId),
        eq(waitlist.status, "waiting"),
        lt(waitlist.requestedStartTime, booking.endTime),
        gt(waitlist.requestedEndTime, booking.startTime)
      )
    );

  for (const entry of matchingWaitlist) {
    await db
      .update(waitlist)
      .set({ status: "notified" })
      .where(eq(waitlist.id, entry.id));

    // Send push notification if enabled
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, entry.userId));

    if (prefs?.pushEnabled && prefs.pushSubscription) {
      await sendPushNotification(prefs.pushSubscription as object, {
        title: "Slot Available",
        body: "A booking slot you were waiting for has opened up. Book now!",
        url: "/bookings/new",
      });
    }
  }

  return NextResponse.json(updated);
}
