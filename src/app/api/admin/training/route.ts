export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { trainingRecords, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const role = await getUserRole(userId);
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({
      record: trainingRecords,
      studentName: users.name,
    })
    .from(trainingRecords)
    .leftJoin(users, eq(trainingRecords.studentId, users.id))
    .orderBy(desc(trainingRecords.createdAt));

  return NextResponse.json(rows.map((r) => ({ ...r.record, studentName: r.studentName })));
}
