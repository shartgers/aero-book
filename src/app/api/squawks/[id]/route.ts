import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { squawks, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only maintenance or admin can update squawks
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id));
  if (!user || (user.role !== "maintenance" && user.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const [squawk] = await db.select().from(squawks).where(eq(squawks.id, id));

  if (!squawk) {
    return NextResponse.json({ error: "Squawk not found" }, { status: 404 });
  }

  const body = await request.json();
  const { status, description } = body;

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (status) updateData.status = status;
  if (description) updateData.description = description;

  // If resolving, set resolvedBy and resolvedAt
  if (status === "resolved") {
    updateData.resolvedBy = session.user.id;
    updateData.resolvedAt = new Date();
  }

  const [updated] = await db
    .update(squawks)
    .set(updateData)
    .where(eq(squawks.id, id))
    .returning();

  return NextResponse.json(updated);
}
