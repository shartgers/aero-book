import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { clubSettings, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  name: "",
  overlapWindowMinutes: 15,
  defaultBookingDurationMinutes: 60,
  maxBookingDurationHours: 4,
};

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db.select().from(clubSettings);

  if (rows.length === 0) {
    return NextResponse.json(DEFAULTS);
  }

  return NextResponse.json(rows[0]);
}

export async function PUT(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id));
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, overlapWindowMinutes, defaultBookingDurationMinutes, maxBookingDurationHours } = body;

  const existing = await db.select().from(clubSettings);

  if (existing.length === 0) {
    // Insert
    const [created] = await db
      .insert(clubSettings)
      .values({
        name: name ?? DEFAULTS.name,
        overlapWindowMinutes: overlapWindowMinutes ?? DEFAULTS.overlapWindowMinutes,
        defaultBookingDurationMinutes: defaultBookingDurationMinutes ?? DEFAULTS.defaultBookingDurationMinutes,
        maxBookingDurationHours: maxBookingDurationHours ?? DEFAULTS.maxBookingDurationHours,
      })
      .returning();

    return NextResponse.json(created);
  }

  // Update
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updateData.name = name;
  if (overlapWindowMinutes !== undefined) updateData.overlapWindowMinutes = overlapWindowMinutes;
  if (defaultBookingDurationMinutes !== undefined) updateData.defaultBookingDurationMinutes = defaultBookingDurationMinutes;
  if (maxBookingDurationHours !== undefined) updateData.maxBookingDurationHours = maxBookingDurationHours;

  const [updated] = await db
    .update(clubSettings)
    .set(updateData)
    .where(eq(clubSettings.id, existing[0].id))
    .returning();

  return NextResponse.json(updated);
}
