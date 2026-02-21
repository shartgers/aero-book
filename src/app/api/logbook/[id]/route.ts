export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { logbookEntries, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [entry] = await db.select().from(logbookEntries).where(eq(logbookEntries.id, id));

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getUserRole(session.user.id);
  if (entry.userId !== session.user.id && role !== "admin" && role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(entry);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [entry] = await db.select().from(logbookEntries).where(eq(logbookEntries.id, id));

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = await getUserRole(session.user.id);

  // Only owner or admin can update
  if (entry.userId !== session.user.id && role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  // Instructor signoff: only instructor or admin
  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (body.instructorSignoff !== undefined) {
    if (role !== "instructor" && role !== "admin") {
      return NextResponse.json({ error: "Only instructors or admins can sign off" }, { status: 403 });
    }
    updateData.instructorSignoff = body.instructorSignoff;
    updateData.instructorSignoffAt = new Date();
  }

  // Allow updating other fields
  const fields = [
    "entryDate", "aircraftType", "tailNumber", "departureIcao", "arrivalIcao",
    "totalTime", "picTime", "dualTime", "soloTime", "nightTime",
    "instrumentTime", "crossCountryTime", "landingsDay", "landingsNight",
    "flightType", "remarks",
  ] as const;

  for (const f of fields) {
    if (body[f] !== undefined) {
      if (f === "entryDate") {
        updateData[f] = new Date(body[f]);
      } else if (["totalTime", "picTime", "dualTime", "soloTime", "nightTime", "instrumentTime", "crossCountryTime"].includes(f)) {
        updateData[f] = body[f] != null ? String(body[f]) : null;
      } else if (f === "landingsDay" || f === "landingsNight") {
        updateData[f] = body[f] != null ? Number(body[f]) : null;
      } else {
        updateData[f] = body[f];
      }
    }
  }

  const [updated] = await db
    .update(logbookEntries)
    .set(updateData)
    .where(eq(logbookEntries.id, id))
    .returning();

  return NextResponse.json(updated);
}
