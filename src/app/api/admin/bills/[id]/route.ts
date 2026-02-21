import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bills, users } from "@/db/schema";
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

  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id));
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const [bill] = await db.select().from(bills).where(eq(bills.id, id));
  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (body.aircraftHours !== undefined) updateData.aircraftHours = String(body.aircraftHours);
  if (body.aircraftCost !== undefined) updateData.aircraftCost = String(body.aircraftCost);
  if (body.instructorHours !== undefined) updateData.instructorHours = String(body.instructorHours);
  if (body.instructorCost !== undefined) updateData.instructorCost = String(body.instructorCost);
  if (body.landingFees !== undefined) updateData.landingFees = String(body.landingFees);
  if (body.surcharges !== undefined) updateData.surcharges = String(body.surcharges);
  if (body.totalAmount !== undefined) updateData.totalAmount = String(body.totalAmount);
  if (body.status !== undefined) updateData.status = body.status;

  const [updated] = await db
    .update(bills)
    .set(updateData)
    .where(eq(bills.id, id))
    .returning();

  return NextResponse.json(updated);
}
