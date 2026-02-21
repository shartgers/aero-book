export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { maintenanceIntervals, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; intervalId: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(session.user.id);
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { intervalId } = await params;
  const [interval] = await db
    .select()
    .from(maintenanceIntervals)
    .where(eq(maintenanceIntervals.id, intervalId));

  if (!interval) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const lastCompletedAt = parseFloat(body.lastCompletedAt);
  const intervalHours = parseFloat(interval.intervalHours);
  const nextDueAt = lastCompletedAt + intervalHours;

  const [updated] = await db
    .update(maintenanceIntervals)
    .set({
      lastCompletedAt: String(lastCompletedAt),
      nextDueAt: String(nextDueAt),
      updatedAt: new Date(),
    })
    .where(eq(maintenanceIntervals.id, intervalId))
    .returning();

  return NextResponse.json(updated);
}
