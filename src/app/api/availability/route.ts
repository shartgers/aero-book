import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bookings } from "@/db/schema";
import { eq, and, ne, gte, lt } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const aircraftId = searchParams.get("aircraftId");
  const date = searchParams.get("date");

  if (!aircraftId || !date) {
    return NextResponse.json({ error: "Missing required query params: aircraftId, date" }, { status: 400 });
  }

  const dayStart = new Date(`${date}T00:00:00Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  if (isNaN(dayStart.getTime())) {
    return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
  }

  const results = await db
    .select({
      bookingId: bookings.id,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.aircraftId, aircraftId),
        ne(bookings.status, "cancelled"),
        lt(bookings.startTime, dayEnd),
        gte(bookings.endTime, dayStart)
      )
    );

  return NextResponse.json(results);
}
