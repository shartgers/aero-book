import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { notificationPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { subscription } = body;

  if (!subscription) {
    return NextResponse.json({ error: "Missing required field: subscription" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, session.user.id));

  if (!existing) {
    await db.insert(notificationPreferences).values({
      userId: session.user.id,
      pushEnabled: true,
      pushSubscription: subscription,
    });
  } else {
    await db
      .update(notificationPreferences)
      .set({
        pushEnabled: true,
        pushSubscription: subscription,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.id, existing.id));
  }

  return NextResponse.json({ success: true });
}
