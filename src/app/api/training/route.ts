export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { trainingRecords, users, instructors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ensureNeonAuthUserInAppDb } from "@/lib/ensure-user";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const role = await getUserRole(userId);
  let rows: (typeof trainingRecords.$inferSelect)[] = [];

  if (role === "admin") {
    rows = await db.select().from(trainingRecords).orderBy(desc(trainingRecords.createdAt));
  } else if (role === "instructor") {
    const [instr] = await db.select().from(instructors).where(eq(instructors.userId, userId));
    if (instr) {
      rows = await db
        .select()
        .from(trainingRecords)
        .where(eq(trainingRecords.instructorId, instr.id))
        .orderBy(desc(trainingRecords.createdAt));
    } else {
      rows = [];
    }
  } else {
    rows = await db
      .select()
      .from(trainingRecords)
      .where(eq(trainingRecords.studentId, userId))
      .orderBy(desc(trainingRecords.createdAt));
  }

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  await ensureNeonAuthUserInAppDb(session.user);

  const role = await getUserRole(userId);
  if (role !== "instructor" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { studentId, courseType, startDate, targetEndDate, instructorId } = body;

  if (!studentId || !courseType || !startDate) {
    return NextResponse.json({ error: "studentId, courseType, and startDate are required" }, { status: 400 });
  }

  const [record] = await db
    .insert(trainingRecords)
    .values({
      studentId,
      courseType,
      startDate: new Date(startDate),
      targetEndDate: targetEndDate ? new Date(targetEndDate) : null,
      instructorId: instructorId ?? null,
    })
    .returning();

  return NextResponse.json(record, { status: 201 });
}
