import { auth } from "@/lib/auth/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db/index";
import { aircraft, squawks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { SquawkBadge } from "@/components/SquawkBadge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AircraftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { id } = await params;

  const [ac] = await db.select().from(aircraft).where(eq(aircraft.id, id));
  if (!ac) {
    notFound();
  }

  const openSquawks = await db
    .select()
    .from(squawks)
    .where(
      sql`${squawks.aircraftId} = ${id} AND ${squawks.status} != 'resolved'`
    )
    .orderBy(
      sql`case ${squawks.severity}
        when 'airworthiness' then 1
        when 'operational' then 2
        when 'cosmetic' then 3
        else 4
      end`
    );

  const statusColors: Record<string, string> = {
    available: "text-green-600 dark:text-green-400",
    maintenance: "text-amber-600 dark:text-amber-400",
    grounded: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/aircraft">&larr; Back to fleet</Link>
        </Button>
      </div>

      <Card className="mb-8 overflow-hidden flex flex-row flex-wrap sm:flex-nowrap">
        {/* Aircraft photo on the left (click target from list); full specs on the right */}
        <div className="w-full sm:w-64 shrink-0 h-48 sm:h-auto sm:min-h-64 bg-muted">
          {ac.imageUrl ? (
            <img
              src={ac.imageUrl}
              alt={ac.tailNumber}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-6xl">✈</div>
          )}
        </div>
        <div className="min-w-0 flex-1 p-6">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-2xl">{ac.tailNumber}</CardTitle>
            <p className="text-muted-foreground">{ac.type}</p>
          </CardHeader>
          <CardContent className="p-0">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-sm">Hourly Rate</dt>
                <dd className="font-medium">${ac.hourlyRate}/hr</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Status</dt>
                <dd className={`font-medium capitalize ${statusColors[ac.status] ?? ""}`}>{ac.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Last Maintenance</dt>
                <dd className="font-medium">
                  {ac.lastMaintenanceDate
                    ? new Date(ac.lastMaintenanceDate).toLocaleDateString()
                    : "—"}
                </dd>
              </div>
              {ac.engine && (
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-sm">Engine</dt>
                  <dd className="font-medium">{ac.engine}</dd>
                </div>
              )}
              {ac.seats != null && (
                <div>
                  <dt className="text-muted-foreground text-sm">Seats</dt>
                  <dd className="font-medium">{ac.seats}</dd>
                </div>
              )}
              {ac.maxSpeed && (
                <div>
                  <dt className="text-muted-foreground text-sm">Max speed</dt>
                  <dd className="font-medium">{ac.maxSpeed}</dd>
                </div>
              )}
              {ac.cruiseSpeed && (
                <div>
                  <dt className="text-muted-foreground text-sm">Cruise speed</dt>
                  <dd className="font-medium">{ac.cruiseSpeed}</dd>
                </div>
              )}
              {ac.range && (
                <div>
                  <dt className="text-muted-foreground text-sm">Range</dt>
                  <dd className="font-medium">{ac.range}</dd>
                </div>
              )}
              {ac.fuelBurnPerHour && (
                <div>
                  <dt className="text-muted-foreground text-sm">Fuel burn</dt>
                  <dd className="font-medium">{ac.fuelBurnPerHour}</dd>
                </div>
              )}
              {ac.maxTakeoffWeight && (
                <div>
                  <dt className="text-muted-foreground text-sm">Max takeoff weight</dt>
                  <dd className="font-medium">{ac.maxTakeoffWeight}</dd>
                </div>
              )}
            </dl>
            {ac.description && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-muted-foreground text-sm mb-1">Description</dt>
                <dd className="text-sm whitespace-pre-wrap">{ac.description}</dd>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      <h2 className="mb-4 text-xl font-semibold">
        Open Squawks ({openSquawks.length})
      </h2>

      {openSquawks.length === 0 ? (
        <p className="text-muted-foreground">No open squawks for this aircraft.</p>
      ) : (
        <div className="space-y-3">
          {openSquawks.map((sq) => (
            <Card key={sq.id} className="py-4">
              <CardContent className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{sq.title}</h3>
                    <SquawkBadge severity={sq.severity} />
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">{sq.description}</p>
                </div>
                <div className="text-muted-foreground shrink-0 text-right text-xs">
                  <div className="capitalize">{sq.status.replace("_", " ")}</div>
                  <div>{new Date(sq.createdAt).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
