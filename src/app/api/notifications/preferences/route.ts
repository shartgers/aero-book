import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { notificationPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  bookingReminders: true,
  waitlistNotifications: true,
  expiryReminders: true,
  billNotifications: true,
  emailEnabled: true,
  pushEnabled: false,
  pushSubscription: null,
};

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, session.user.id));

  if (!prefs) {
    return NextResponse.json({ userId: session.user.id, ...DEFAULTS });
  }

  return NextResponse.json(prefs);
}

export async function PUT(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const [existing] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, session.user.id));

  if (!existing) {
    // Insert with defaults + overrides
    const [created] = await db
      .insert(notificationPreferences)
      .values({
        userId: session.user.id,
        bookingReminders: body.bookingReminders ?? DEFAULTS.bookingReminders,
        waitlistNotifications: body.waitlistNotifications ?? DEFAULTS.waitlistNotifications,
        expiryReminders: body.expiryReminders ?? DEFAULTS.expiryReminders,
        billNotifications: body.billNotifications ?? DEFAULTS.billNotifications,
        emailEnabled: body.emailEnabled ?? DEFAULTS.emailEnabled,
        pushEnabled: body.pushEnabled ?? DEFAULTS.pushEnabled,
        pushSubscription: body.pushSubscription ?? DEFAULTS.pushSubscription,
      })
      .returning();

    return NextResponse.json(created);
  }

  // Update
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (body.bookingReminders !== undefined) updateData.bookingReminders = body.bookingReminders;
  if (body.waitlistNotifications !== undefined) updateData.waitlistNotifications = body.waitlistNotifications;
  if (body.expiryReminders !== undefined) updateData.expiryReminders = body.expiryReminders;
  if (body.billNotifications !== undefined) updateData.billNotifications = body.billNotifications;
  if (body.emailEnabled !== undefined) updateData.emailEnabled = body.emailEnabled;
  if (body.pushEnabled !== undefined) updateData.pushEnabled = body.pushEnabled;
  if (body.pushSubscription !== undefined) updateData.pushSubscription = body.pushSubscription;

  const [updated] = await db
    .update(notificationPreferences)
    .set(updateData)
    .where(eq(notificationPreferences.id, existing.id))
    .returning();

  return NextResponse.json(updated);
}
