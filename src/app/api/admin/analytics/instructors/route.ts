import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bookings, bookingInstructors, instructors, users } from "@/db/schema";
import { eq, and, gte, lte, sql, count, countDistinct } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id));
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : defaultFrom;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : now;

  // Get all confirmed instructor bookings in date range with completed status
  const results = await db
    .select({
      instructorId: bookingInstructors.instructorId,
      userName: users.name,
      flightCount: count(bookingInstructors.id).as("flight_count"),
      studentCount: countDistinct(bookings.userId).as("student_count"),
      totalHours: sql<string>`sum(extract(epoch from (coalesce(${bookings.actualEndTime}, ${bookings.endTime}) - coalesce(${bookings.actualStartTime}, ${bookings.startTime}))) / 3600)`.as("total_hours"),
    })
    .from(bookingInstructors)
    .innerJoin(bookings, eq(bookings.id, bookingInstructors.bookingId))
    .innerJoin(instructors, eq(instructors.id, bookingInstructors.instructorId))
    .innerJoin(users, eq(users.id, instructors.userId))
    .where(
      and(
        eq(bookingInstructors.status, "confirmed"),
        eq(bookings.status, "completed"),
        gte(bookings.startTime, from),
        lte(bookings.startTime, to)
      )
    )
    .groupBy(bookingInstructors.instructorId, users.name);

  return NextResponse.json(
    results.map((r) => ({
      instructorId: r.instructorId,
      name: r.userName,
      hoursFlown: Math.round(parseFloat(r.totalHours ?? "0") * 100) / 100,
      studentCount: Number(r.studentCount),
      flightCount: Number(r.flightCount),
    }))
  );
}
