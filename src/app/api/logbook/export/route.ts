export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { logbookEntries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

function csvEscape(val: string | null | undefined): string {
  const s = val ?? "";
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? '"' + s.replace(/"/g, '""') + '"'
    : s;
}

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await db
    .select()
    .from(logbookEntries)
    .where(eq(logbookEntries.userId, session.user.id))
    .orderBy(desc(logbookEntries.entryDate));

  const headers = [
    "Date", "Aircraft Type", "Tail Number", "Departure", "Arrival",
    "Total Time", "PIC", "Dual", "Solo", "Night", "Instrument",
    "Cross Country", "Landings Day", "Landings Night", "Flight Type", "Remarks",
  ];

  const rows = entries.map((e) =>
    [
      e.entryDate ? new Date(e.entryDate).toISOString().slice(0, 10) : "",
      csvEscape(e.aircraftType),
      csvEscape(e.tailNumber),
      csvEscape(e.departureIcao),
      csvEscape(e.arrivalIcao),
      e.totalTime ?? "",
      e.picTime ?? "",
      e.dualTime ?? "",
      e.soloTime ?? "",
      e.nightTime ?? "",
      e.instrumentTime ?? "",
      e.crossCountryTime ?? "",
      String(e.landingsDay ?? ""),
      String(e.landingsNight ?? ""),
      e.flightType ?? "",
      csvEscape(e.remarks),
    ].join(",")
  );

  const csvString = [headers.join(","), ...rows].join("\n");

  return new NextResponse(csvString, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="logbook.csv"',
    },
  });
}
