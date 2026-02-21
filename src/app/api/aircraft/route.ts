import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { aircraft, squawks, users } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await db
    .select({
      id: aircraft.id,
      tailNumber: aircraft.tailNumber,
      type: aircraft.type,
      hourlyRate: aircraft.hourlyRate,
      status: aircraft.status,
      lastMaintenanceDate: aircraft.lastMaintenanceDate,
      createdAt: aircraft.createdAt,
      updatedAt: aircraft.updatedAt,
      openSquawkCount: count(squawks.id),
      highestSeverity: sql<string | null>`
        max(case ${squawks.severity}
          when 'airworthiness' then 3
          when 'operational' then 2
          when 'cosmetic' then 1
        end)`.as("severity_rank"),
    })
    .from(aircraft)
    .leftJoin(
      squawks,
      sql`${squawks.aircraftId} = ${aircraft.id} and ${squawks.status} != 'resolved'`
    )
    .groupBy(aircraft.id);

  const mapped = results.map((r) => {
    const severityMap: Record<string, string> = { "3": "airworthiness", "2": "operational", "1": "cosmetic" };
    return {
      ...r,
      highestSeverity: r.highestSeverity ? severityMap[r.highestSeverity] ?? null : null,
    };
  });

  return NextResponse.json(mapped);
}

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id));
  if (!user.length || user[0].role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { tailNumber, type, hourlyRate, status } = body;

  if (!tailNumber || !type || hourlyRate == null) {
    return NextResponse.json({ error: "Missing required fields: tailNumber, type, hourlyRate" }, { status: 400 });
  }

  const [created] = await db
    .insert(aircraft)
    .values({
      tailNumber,
      type,
      hourlyRate: String(hourlyRate),
      ...(status ? { status } : {}),
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
