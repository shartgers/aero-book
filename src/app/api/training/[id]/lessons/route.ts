export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { trainingRecords, lessonCompletions, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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
  const { id } = await params;

  const lessons = await db
    .select()
    .from(lessonCompletions)
    .where(eq(lessonCompletions.trainingRecordId, id))
    .orderBy(lessonCompletions.lessonCode);

  return NextResponse.json(lessons);
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

  const [record] = await db.select().from(trainingRecords).where(eq(trainingRecords.id, id));
  if (!record) return NextResponse.json({ error: "Training record not found" }, { status: 404 });

  const body = await request.json();
  const { lessonCode, lessonTitle, outcome, grade, instructorNotes, cbtaAssessmentData } = body;

  if (!lessonCode || !lessonTitle || !outcome) {
    return NextResponse.json({ error: "lessonCode, lessonTitle, and outcome are required" }, { status: 400 });
  }

  // Upsert lesson completion
  const [existing] = await db
    .select()
    .from(lessonCompletions)
    .where(
      and(
        eq(lessonCompletions.trainingRecordId, id),
        eq(lessonCompletions.lessonCode, lessonCode)
      )
    );

  if (existing) {
    await db
      .update(lessonCompletions)
      .set({
        outcome,
        grade: grade ?? existing.grade,
        instructorNotes: instructorNotes ?? existing.instructorNotes,
        cbtaAssessmentData: cbtaAssessmentData ?? existing.cbtaAssessmentData,
        signedOffBy: userId,
        signedOffAt: new Date(),
      })
      .where(eq(lessonCompletions.id, existing.id));
  } else {
    await db.insert(lessonCompletions).values({
      trainingRecordId: id,
      lessonCode,
      lessonTitle,
      outcome,
      grade: grade ?? null,
      instructorNotes: instructorNotes ?? null,
      cbtaAssessmentData: cbtaAssessmentData ?? null,
      signedOffBy: userId,
      signedOffAt: new Date(),
    });
  }

  // Recompute progress
  const all = await db
    .select()
    .from(lessonCompletions)
    .where(eq(lessonCompletions.trainingRecordId, id));

  const percent =
    all.length > 0
      ? (all.filter((l) => l.outcome === "passed").length / all.length) * 100
      : 0;

  await db
    .update(trainingRecords)
    .set({
      progressPercent: percent.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(trainingRecords.id, id));

  return NextResponse.json({ success: true, progressPercent: percent.toFixed(2) });
}
