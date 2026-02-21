import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { logbookEntries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { LogbookAddForm } from "@/components/LogbookAddForm";

export const dynamic = "force-dynamic";

export default async function LogbookPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

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
    }),
    {
      totalTime: 0,
      picTime: 0,
      dualTime: 0,
      soloTime: 0,
      nightTime: 0,
      instrumentTime: 0,
      crossCountryTime: 0,
    }
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pilot Logbook</h1>
        <Link
          href="/api/logbook/export"
          className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Export CSV
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 rounded-lg border p-4 bg-muted/50">
        {([
          ["Total", totals.totalTime],
          ["PIC", totals.picTime],
          ["Dual", totals.dualTime],
          ["Solo", totals.soloTime],
          ["Night", totals.nightTime],
          ["Instrument", totals.instrumentTime],
          ["XC", totals.crossCountryTime],
        ] as const).map(([label, value]) => (
          <div key={label} className="text-center">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="text-lg font-semibold">{value.toFixed(1)}</div>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-2">Date</th>
              <th className="py-2 pr-2">Tail</th>
              <th className="py-2 pr-2">Type</th>
              <th className="py-2 pr-2">Dep</th>
              <th className="py-2 pr-2">Arr</th>
              <th className="py-2 pr-2">Total</th>
              <th className="py-2 pr-2">Flight</th>
              <th className="py-2">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground">
                  No logbook entries yet. Add your first entry below.
                </td>
              </tr>
            ) : (
              entries.map((e) => (
                <tr key={e.id} className="border-b hover:bg-muted/30">
                  <td className="py-2 pr-2">
                    <Link href={`/logbook/${e.id}`} className="text-blue-600 hover:underline">
                      {e.entryDate ? new Date(e.entryDate).toISOString().slice(0, 10) : ""}
                    </Link>
                  </td>
                  <td className="py-2 pr-2">{e.tailNumber}</td>
                  <td className="py-2 pr-2">{e.aircraftType}</td>
                  <td className="py-2 pr-2">{e.departureIcao ?? ""}</td>
                  <td className="py-2 pr-2">{e.arrivalIcao ?? ""}</td>
                  <td className="py-2 pr-2">{e.totalTime}</td>
                  <td className="py-2 pr-2">{e.flightType}</td>
                  <td className="py-2 truncate max-w-[150px]">{e.remarks ?? ""}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold mb-4">Add Entry</h2>
      <LogbookAddForm />
    </div>
  );
}
