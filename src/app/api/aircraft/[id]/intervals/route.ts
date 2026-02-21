export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { maintenanceIntervals, techLogEntries, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: aircraftId } = await params;

  const [hobbsRow] = await db
    .select({ max: sql<string>`max(${techLogEntries.hobbsOut})` })
    .from(techLogEntries)
    .where(eq(techLogEntries.aircraftId, aircraftId));

  const currentHobbs = parseFloat(hobbsRow?.max ?? "0");

  const intervals = await db
    .select()
    .from(maintenanceIntervals)
    .where(eq(maintenanceIntervals.aircraftId, aircraftId));

  const result = intervals.map((interval) => {
    const hoursRemaining = parseFloat(interval.nextDueAt ?? "0") - currentHobbs;
    let status: "overdue" | "warning" | "ok";
    if (hoursRemaining <= 0) {
      status = "overdue";
    } else if (hoursRemaining <= parseFloat(interval.warningThresholdHours)) {
      status = "warning";
    } else {
      status = "ok";
    }
    return { ...interval, hoursRemaining, status, currentHobbs };
  });

  return NextResponse.json(result);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(session.user.id);
  if (role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id: aircraftId } = await params;
  const body = await request.json();

  const intervalHours = parseFloat(body.intervalHours);
  const lastCompletedAt = body.lastCompletedAt != null ? parseFloat(body.lastCompletedAt) : null;
  const nextDueAt = lastCompletedAt != null ? lastCompletedAt + intervalHours : intervalHours;

  const [interval] = await db
    .insert(maintenanceIntervals)
    .values({
      aircraftId,
      name: body.name,
      intervalHours: String(intervalHours),
      lastCompletedAt: lastCompletedAt != null ? String(lastCompletedAt) : null,
      nextDueAt: String(nextDueAt),
      warningThresholdHours: body.warningThresholdHours != null ? String(body.warningThresholdHours) : "10",
    })
    .returning();

  return NextResponse.json(interval, { status: 201 });
}
