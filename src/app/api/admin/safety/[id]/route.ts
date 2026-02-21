export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { safetyReports, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const VALID_STATUSES = ["submitted", "under_review", "closed"] as const;

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
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
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { status, resolution } = body;

  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const [existing] = await db.select().from(safetyReports).where(eq(safetyReports.id, id));
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await db.update(safetyReports)
    .set({
      ...(status && { status }),
      ...(resolution !== undefined && { resolution }),
      reviewedBy: userId,
      updatedAt: new Date(),
    })
    .where(eq(safetyReports.id, id))
    .returning();

  return NextResponse.json(updated);
}
