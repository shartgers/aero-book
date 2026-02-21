import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { notificationPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [existing] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, session.user.id));

  if (existing) {
    await db
      .update(notificationPreferences)
      .set({
        pushEnabled: false,
        pushSubscription: null,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.id, existing.id));
  }

  return NextResponse.json({ success: true });
}
