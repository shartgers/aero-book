export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { logbookEntries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ensureNeonAuthUserInAppDb } from "@/lib/ensure-user";
import { NextResponse, NextRequest } from "next/server";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await db
    .select()
    .from(logbookEntries)
    .where(eq(logbookEntries.userId, session.user.id))
    .orderBy(desc(logbookEntries.entryDate));

  const totals = entries.reduce(
    (acc, e) => ({
      totalTime: acc.totalTime + parseFloat(e.totalTime ?? "0"),
      picTime: acc.picTime + parseFloat(e.picTime ?? "0"),
      dualTime: acc.dualTime + parseFloat(e.dualTime ?? "0"),
      soloTime: acc.soloTime + parseFloat(e.soloTime ?? "0"),
      nightTime: acc.nightTime + parseFloat(e.nightTime ?? "0"),
      instrumentTime: acc.instrumentTime + parseFloat(e.instrumentTime ?? "0"),
      crossCountryTime: acc.crossCountryTime + parseFloat(e.crossCountryTime ?? "0"),
      landingsDay: acc.landingsDay + (e.landingsDay ?? 0),
      landingsNight: acc.landingsNight + (e.landingsNight ?? 0),
    }),
    {
      totalTime: 0,
      picTime: 0,
      dualTime: 0,
      soloTime: 0,
      nightTime: 0,
      instrumentTime: 0,
      crossCountryTime: 0,
      landingsDay: 0,
      landingsNight: 0,
    }
  );

  return NextResponse.json({ entries, totals });
}

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureNeonAuthUserInAppDb(session.user);

  const body = await request.json();

  const [entry] = await db
    .insert(logbookEntries)
    .values({
      userId: session.user.id,
      entryDate: new Date(body.entryDate),
      aircraftType: body.aircraftType,
      tailNumber: body.tailNumber,
      departureIcao: body.departureIcao ?? null,
      arrivalIcao: body.arrivalIcao ?? null,
      totalTime: String(body.totalTime),
      picTime: body.picTime != null ? String(body.picTime) : null,
      dualTime: body.dualTime != null ? String(body.dualTime) : null,
      soloTime: body.soloTime != null ? String(body.soloTime) : null,
      nightTime: body.nightTime != null ? String(body.nightTime) : null,
      instrumentTime: body.instrumentTime != null ? String(body.instrumentTime) : null,
      crossCountryTime: body.crossCountryTime != null ? String(body.crossCountryTime) : null,
      landingsDay: body.landingsDay != null ? Number(body.landingsDay) : null,
      landingsNight: body.landingsNight != null ? Number(body.landingsNight) : null,
      flightType: body.flightType,
      remarks: body.remarks ?? null,
      aircraftId: body.aircraftId ?? null,
      bookingId: body.bookingId ?? null,
    })
    .returning();

  return NextResponse.json(entry, { status: 201 });
}
