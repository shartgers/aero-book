export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { techLogEntries, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entryId } = await params;
  const [entry] = await db.select().from(techLogEntries).where(eq(techLogEntries.id, entryId));

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(entry);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { entryId } = await params;
  const [entry] = await db.select().from(techLogEntries).where(eq(techLogEntries.id, entryId));

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getUserRole(session.user.id);

  if (entry.pilotId !== session.user.id && role !== "admin" && role !== "maintenance") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const updateData: Record<string, unknown> = {};

  if (body.signedOffBy !== undefined) {
    if (role !== "instructor" && role !== "admin") {
      return NextResponse.json({ error: "Only instructors or admins can sign off" }, { status: 403 });
    }
    updateData.signedOffBy = body.signedOffBy;
    updateData.signedOffAt = new Date();
  }

  const numericFields = ["hobbsIn", "hobbsOut", "tachIn", "tachOut", "airtime", "fuelAdded", "oilAdded"] as const;
  for (const f of numericFields) {
    if (body[f] !== undefined) {
      updateData[f] = body[f] != null ? String(body[f]) : null;
    }
  }

  if (body.remarks !== undefined) updateData.remarks = body.remarks;
  if (body.entryDate !== undefined) updateData.entryDate = new Date(body.entryDate);

  const [updated] = await db
    .update(techLogEntries)
    .set(updateData)
    .where(eq(techLogEntries.id, entryId))
    .returning();

  return NextResponse.json(updated);
}
