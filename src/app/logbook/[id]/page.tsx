import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { logbookEntries, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { InstructorSignoffButton } from "./InstructorSignoffButton";

export const dynamic = "force-dynamic";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export default async function LogbookEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const { id } = await params;
  const [entry] = await db.select().from(logbookEntries).where(eq(logbookEntries.id, id));

  if (!entry) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p>Entry not found.</p>
        <Link href="/logbook" className="text-blue-600 hover:underline">Back to logbook</Link>
      </div>
    );
  }

  const role = await getUserRole(session.user.id);
  if (entry.userId !== session.user.id && role !== "admin" && role !== "instructor") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p>You do not have permission to view this entry.</p>
        <Link href="/logbook" className="text-blue-600 hover:underline">Back to logbook</Link>
      </div>
    );
  }

  const canSignOff = !entry.instructorSignoff && (role === "instructor" || role === "admin");

  const fields: [string, string | number | null | undefined][] = [
    ["Date", entry.entryDate ? new Date(entry.entryDate).toISOString().slice(0, 10) : null],
    ["Aircraft Type", entry.aircraftType],
    ["Tail Number", entry.tailNumber],
    ["Departure", entry.departureIcao],
    ["Arrival", entry.arrivalIcao],
    ["Total Time", entry.totalTime],
    ["PIC Time", entry.picTime],
    ["Dual Time", entry.dualTime],
    ["Solo Time", entry.soloTime],
    ["Night Time", entry.nightTime],
    ["Instrument Time", entry.instrumentTime],
    ["Cross Country Time", entry.crossCountryTime],
    ["Landings (Day)", entry.landingsDay],
    ["Landings (Night)", entry.landingsNight],
    ["Flight Type", entry.flightType],
    ["Remarks", entry.remarks],
    ["Instructor Signoff", entry.instructorSignoff ? "Signed" : "Pending"],
    [
      "Signoff Date",
      entry.instructorSignoffAt
        ? new Date(entry.instructorSignoffAt).toISOString().slice(0, 10)
        : null,
    ],
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/logbook" className="text-blue-600 hover:underline text-sm">
        &larr; Back to logbook
      </Link>

      <h1 className="text-2xl font-bold mt-4 mb-6">Logbook Entry</h1>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {fields.map(([label, value]) => (
          <div key={label}>
            <span className="text-muted-foreground">{label}:</span>{" "}
            <span className="font-medium">{value ?? "-"}</span>
          </div>
        ))}
      </div>

      {canSignOff && (
        <div className="mt-6">
          <InstructorSignoffButton entryId={id} userId={session.user.id} />
        </div>
      )}
    </div>
  );
}
