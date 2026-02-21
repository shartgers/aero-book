import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bills, billDisputes } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [bill] = await db.select().from(bills).where(eq(bills.id, id));

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  if (bill.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { reason } = body;

  if (!reason) {
    return NextResponse.json({ error: "Missing required field: reason" }, { status: 400 });
  }

  // Create dispute
  const [dispute] = await db
    .insert(billDisputes)
    .values({
      billId: id,
      userId: session.user.id,
      reason,
      status: "open",
    })
    .returning();

  // Update bill status to disputed
  await db
    .update(bills)
    .set({ status: "disputed", updatedAt: new Date() })
    .where(eq(bills.id, id));

  return NextResponse.json(dispute, { status: 201 });
}
