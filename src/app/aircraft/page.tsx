import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { aircraft, squawks } from "@/db/schema";
import { sql, ne } from "drizzle-orm";
import { AircraftCard } from "@/components/AircraftCard";

export const dynamic = "force-dynamic";

export default async function AircraftListPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const allAircraft = await db.select().from(aircraft);

  const squawkStats = await db
    .select({
      aircraftId: squawks.aircraftId,
      count: sql<number>`count(*)::int`.as("count"),
      maxSeverity: sql<string>`
        max(case
          when ${squawks.severity} = 'airworthiness' then 3
          when ${squawks.severity} = 'operational' then 2
          when ${squawks.severity} = 'cosmetic' then 1
          else 0
        end)
      `.as("max_severity_rank"),
      hasSeverity: sql<string>`
        case max(case
          when ${squawks.severity} = 'airworthiness' then 3
          when ${squawks.severity} = 'operational' then 2
          when ${squawks.severity} = 'cosmetic' then 1
          else 0
        end)
          when 3 then 'airworthiness'
          when 2 then 'operational'
          when 1 then 'cosmetic'
          else null
        end
      `.as("has_severity"),
    })
    .from(squawks)
    .where(ne(squawks.status, "resolved"))
    .groupBy(squawks.aircraftId);

  const squawkMap = new Map(
    squawkStats.map((s) => [
      s.aircraftId,
      { count: s.count, maxSeverity: s.hasSeverity as "cosmetic" | "operational" | "airworthiness" | null },
    ])
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Fleet</h1>
        <p className="mt-1.5 text-muted-foreground">Select an aircraft to view specs and book.</p>
      </header>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {allAircraft.map((ac) => {
          const stats = squawkMap.get(ac.id);
          return (
            <AircraftCard
              key={ac.id}
              id={ac.id}
              tailNumber={ac.tailNumber}
              type={ac.type}
              hourlyRate={ac.hourlyRate}
              status={ac.status}
              openSquawkCount={stats?.count ?? 0}
              maxSquawkSeverity={stats?.maxSeverity ?? null}
              imageUrl={ac.imageUrl ?? null}
            />
          );
        })}
        {allAircraft.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center">No aircraft registered yet.</p>
        )}
      </div>
    </div>
  );
}
