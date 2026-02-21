import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { techLogEntries, aircraft, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TechLogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const { id: aircraftId } = await params;

  const [ac] = await db.select().from(aircraft).where(eq(aircraft.id, aircraftId));
  if (!ac) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p>Aircraft not found.</p>
      </div>
    );
  }

  const entries = await db
    .select({
      id: techLogEntries.id,
      entryDate: techLogEntries.entryDate,
      pilotId: techLogEntries.pilotId,
      hobbsIn: techLogEntries.hobbsIn,
      hobbsOut: techLogEntries.hobbsOut,
      airtime: techLogEntries.airtime,
      fuelAdded: techLogEntries.fuelAdded,
      oilAdded: techLogEntries.oilAdded,
      remarks: techLogEntries.remarks,
      pilotName: users.name,
    })
    .from(techLogEntries)
    .leftJoin(users, eq(techLogEntries.pilotId, users.id))
    .where(eq(techLogEntries.aircraftId, aircraftId))
    .orderBy(desc(techLogEntries.entryDate));

  const totalAirtime = entries.reduce(
    (sum, e) => sum + parseFloat(e.airtime ?? "0"),
    0
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href={`/aircraft/${aircraftId}`} className="text-blue-600 hover:underline text-sm">
        &larr; Back to aircraft
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-2">
        Tech Log &mdash; {ac.tailNumber} {ac.type}
      </h1>

      <p className="text-sm text-muted-foreground mb-6">
        Total airtime: <span className="font-semibold">{totalAirtime.toFixed(1)} hrs</span>
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-2">Date</th>
              <th className="py-2 pr-2">Pilot</th>
              <th className="py-2 pr-2">Hobbs In</th>
              <th className="py-2 pr-2">Hobbs Out</th>
              <th className="py-2 pr-2">Airtime</th>
              <th className="py-2 pr-2">Fuel</th>
              <th className="py-2 pr-2">Oil</th>
              <th className="py-2">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  No tech log entries yet.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-b hover:bg-muted/30">
                  <td className="py-2 pr-2">
                    {e.entryDate ? new Date(e.entryDate).toISOString().slice(0, 10) : ""}
                  </td>
                  <td className="py-2 pr-2">{e.pilotName ?? "Unknown"}</td>
                  <td className="py-2 pr-2">{e.hobbsIn ?? "-"}</td>
                  <td className="py-2 pr-2">{e.hobbsOut ?? "-"}</td>
                  <td className="py-2 pr-2">{e.airtime ?? "-"}</td>
                  <td className="py-2 pr-2">{e.fuelAdded ?? "-"}</td>
                  <td className="py-2 pr-2">{e.oilAdded ?? "-"}</td>
                  <td className="py-2 truncate max-w-[150px]">{e.remarks ?? ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
