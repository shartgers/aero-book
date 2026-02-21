import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { waitlist } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await db
    .select()
    .from(waitlist)
    .where(eq(waitlist.userId, session.user.id));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { aircraftId, requestedStartTime, requestedEndTime, preferredAircraftId } = body;

  if (!aircraftId || !requestedStartTime || !requestedEndTime) {
    return NextResponse.json({ error: "Missing required fields: aircraftId, requestedStartTime, requestedEndTime" }, { status: 400 });
  }

  const start = new Date(requestedStartTime);
  const end = new Date(requestedEndTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  if (end <= start) {
    return NextResponse.json({ error: "requestedEndTime must be after requestedStartTime" }, { status: 400 });
  }

  const [created] = await db
    .insert(waitlist)
    .values({
      userId: session.user.id,
      aircraftId,
      preferredAircraftId: preferredAircraftId ?? null,
      requestedStartTime: start,
      requestedEndTime: end,
      status: "waiting",
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
