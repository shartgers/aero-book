import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { instructors, instructorAvailability, users } from "@/db/schema";
import { eq } from "drizzle-orm";

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

  const results = await db
    .select()
    .from(instructorAvailability)
    .where(eq(instructorAvailability.instructorId, id));

  return NextResponse.json(results);
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

  // Check authorization: admin or the instructor's own user
  const [instructor] = await db
    .select({ userId: instructors.userId })
    .from(instructors)
    .where(eq(instructors.id, id));

  if (!instructor) {
    return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
  }

  const role = await getUserRole(session.user.id);
  if (role !== "admin" && instructor.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: Array<{
    dayOfWeek?: number;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    specificDate?: string;
    isBlocked?: boolean;
  }> = await request.json();

  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be an array of availability entries" }, { status: 400 });
  }

  // Delete existing availability and replace
  await db
    .delete(instructorAvailability)
    .where(eq(instructorAvailability.instructorId, id));

  if (body.length > 0) {
    const rows = body.map((entry) => ({
      instructorId: id,
      dayOfWeek: entry.dayOfWeek ?? null,
      startTime: entry.startTime,
      endTime: entry.endTime,
      isRecurring: entry.isRecurring,
      specificDate: entry.specificDate ? new Date(entry.specificDate) : null,
      isBlocked: entry.isBlocked ?? false,
    }));

    await db.insert(instructorAvailability).values(rows);
  }

  const updated = await db
    .select()
    .from(instructorAvailability)
    .where(eq(instructorAvailability.instructorId, id));

  return NextResponse.json(updated);
}
