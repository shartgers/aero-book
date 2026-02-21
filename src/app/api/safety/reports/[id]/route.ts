export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { safetyReports, users } from "@/db/schema";
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

  const [report] = await db.select().from(safetyReports).where(eq(safetyReports.id, id));
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getUserRole(userId);
  if (report.reportedBy !== userId && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (report.isAnonymous && role !== "admin") {
    const { reportedBy: _reportedBy, ...rest } = report;
    return NextResponse.json(rest);
  }

  return NextResponse.json(report);
}
