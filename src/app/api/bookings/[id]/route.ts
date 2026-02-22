import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bookings, users, waitlist, notificationPreferences } from "@/db/schema";
import { eq, and, lt, gt } from "drizzle-orm";
import { sendPushNotification } from "@/lib/push";
import { createBillForCompletedBooking } from "@/lib/booking-bill";

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

  // Auto-generate bill when booking is completed (shared logic in lib/booking-bill)
  if (status === "completed") {
    await createBillForCompletedBooking(id);
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
