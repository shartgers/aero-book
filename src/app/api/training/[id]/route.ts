export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { trainingRecords, lessonCompletions, users, instructors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  const [record] = await db.select().from(trainingRecords).where(eq(trainingRecords.id, id));
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getUserRole(userId);
  if (role !== "admin") {
    if (record.studentId !== userId) {
      // Check if user is assigned instructor
      if (record.instructorId) {
        const [instr] = await db.select().from(instructors).where(eq(instructors.userId, userId));
        if (!instr || instr.id !== record.instructorId) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  const lessons = await db
    .select()
    .from(lessonCompletions)
    .where(eq(lessonCompletions.trainingRecordId, id))
    .orderBy(lessonCompletions.lessonCode);

  return NextResponse.json({ record, lessons });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;
  const { id } = await params;

  const role = await getUserRole(userId);
  if (role !== "instructor" && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [existing] = await db.select().from(trainingRecords).where(eq(trainingRecords.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined) updates.status = body.status;
  if (body.instructorId !== undefined) updates.instructorId = body.instructorId;
  if (body.targetEndDate !== undefined) updates.targetEndDate = body.targetEndDate ? new Date(body.targetEndDate) : null;

  const [updated] = await db
    .update(trainingRecords)
    .set(updates)
    .where(eq(trainingRecords.id, id))
    .returning();

  return NextResponse.json(updated);
}
