import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { maintenanceIntervals, techLogEntries, aircraft, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { AddIntervalForm } from "./AddIntervalForm";
import { RecordCompletionButton } from "./RecordCompletionButton";

export const dynamic = "force-dynamic";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export default async function IntervalsPage({
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

  const [hobbsRow] = await db
    .select({ max: sql<string>`max(${techLogEntries.hobbsOut})` })
    .from(techLogEntries)
    .where(eq(techLogEntries.aircraftId, aircraftId));

  const currentHobbs = parseFloat(hobbsRow?.max ?? "0");

  const intervals = await db
    .select()
    .from(maintenanceIntervals)
    .where(eq(maintenanceIntervals.aircraftId, aircraftId));

  const intervalsWithStatus = intervals.map((interval) => {
    const hoursRemaining = parseFloat(interval.nextDueAt ?? "0") - currentHobbs;
    let status: "overdue" | "warning" | "ok";
    if (hoursRemaining <= 0) {
      status = "overdue";
    } else if (hoursRemaining <= parseFloat(interval.warningThresholdHours)) {
      status = "warning";
    } else {
      status = "ok";
    }
    return { ...interval, hoursRemaining, status };
  });

  const role = await getUserRole(session.user.id);
  const isAdmin = role === "admin";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href={`/aircraft/${aircraftId}`} className="text-blue-600 hover:underline text-sm">
        &larr; Back to aircraft
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-2">
        Maintenance Intervals &mdash; {ac.tailNumber}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Current Hobbs: <span className="font-semibold">{currentHobbs.toFixed(1)}</span>
      </p>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-2">Name</th>
              <th className="py-2 pr-2">Interval (hrs)</th>
              <th className="py-2 pr-2">Last Completed</th>
              <th className="py-2 pr-2">Next Due</th>
              <th className="py-2 pr-2">Hrs Remaining</th>
              <th className="py-2 pr-2">Status</th>
              {isAdmin && <th className="py-2">Action</th>}
            </tr>
          </thead>
          <tbody>
            {intervalsWithStatus.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-muted-foreground">
                  No maintenance intervals configured.
                </td>
              </tr>
            ) : (
              intervalsWithStatus.map((i) => (
                <tr key={i.id} className="border-b hover:bg-muted/30">
                  <td className="py-2 pr-2 font-medium">{i.name}</td>
                  <td className="py-2 pr-2">{i.intervalHours}</td>
                  <td className="py-2 pr-2">{i.lastCompletedAt ?? "-"}</td>
                  <td className="py-2 pr-2">{i.nextDueAt ?? "-"}</td>
                  <td className="py-2 pr-2">{i.hoursRemaining.toFixed(1)}</td>
                  <td className="py-2 pr-2">
                    {i.status === "overdue" && (
                      <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-medium">
                        Overdue
                      </span>
                    )}
                    {i.status === "warning" && (
                      <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium">
                        Warning
                      </span>
                    )}
                    {i.status === "ok" && (
                      <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium">
                        OK
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="py-2">
                      <RecordCompletionButton
                        aircraftId={aircraftId}
                        intervalId={i.id}
                        currentHobbs={currentHobbs}
                      />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <>
          <h2 className="text-lg font-semibold mb-4">Add Interval</h2>
          <AddIntervalForm aircraftId={aircraftId} />
        </>
      )}
    </div>
  );
}
