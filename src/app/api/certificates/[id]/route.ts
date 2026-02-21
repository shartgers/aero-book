import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { certificates, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getUserRole(userId: string) {
  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return user?.role ?? "member";
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
  const [cert] = await db.select().from(certificates).where(eq(certificates.id, id));

  if (!cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  const role = await getUserRole(session.user.id);
  if (cert.userId !== session.user.id && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (body.type !== undefined) updateData.type = body.type;
  if (body.expiryDate !== undefined) updateData.expiryDate = new Date(body.expiryDate);
  if (body.documentUrl !== undefined) updateData.documentUrl = body.documentUrl;

  // Only admin can set isVerified
  if (body.isVerified !== undefined && role === "admin") {
    updateData.isVerified = body.isVerified;
  }

  const [updated] = await db
    .update(certificates)
    .set(updateData)
    .where(eq(certificates.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [cert] = await db.select().from(certificates).where(eq(certificates.id, id));

  if (!cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }

  if (cert.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.delete(certificates).where(eq(certificates.id, id));

  return NextResponse.json({ success: true });
}
