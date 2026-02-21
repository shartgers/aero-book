import { auth } from "@/lib/auth/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db/index";
import { bookings, aircraft, users, techLogEntries, squawks, trainingRecords } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import LessonSignoffForm from "@/components/LessonSignoffForm";

export const dynamic = "force-dynamic";

async function cancelBooking(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId") as string;
  if (!bookingId) return;

  const { data: session } = await auth.getSession();
  if (!session?.user) return;

  await db
    .update(bookings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(bookings.id, bookingId));

  redirect("/bookings");
}

async function dispatchBooking(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId") as string;
  const hobbsOut = formData.get("hobbsOut") as string;
  const fuelState = formData.get("fuelState") as string;
  const preFlightConfirmed = formData.get("preFlightConfirmed") === "on";

  if (!preFlightConfirmed || !bookingId) return;

  const { data: session } = await auth.getSession();
  if (!session?.user) return;

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  if (!booking || booking.status !== "confirmed") return;

  await db.insert(techLogEntries).values({
    aircraftId: booking.aircraftId,
    bookingId: booking.id,
    pilotId: session.user.id,
    entryDate: new Date(),
    hobbsOut: hobbsOut || null,
    remarks: fuelState ? `Fuel state at dispatch: ${fuelState}` : null,
  });

  await db.update(bookings).set({
    status: "dispatched",
    actualStartTime: new Date(),
    updatedAt: new Date(),
  }).where(eq(bookings.id, bookingId));

  redirect(`/bookings/${bookingId}`);
}

async function checkinBooking(formData: FormData) {
  "use server";
  const bookingId = formData.get("bookingId") as string;
  const hobbsIn = formData.get("hobbsIn") as string;
  const fuelPostFlight = formData.get("fuelPostFlight") as string;
  const squawkTitle = (formData.get("squawkTitle") as string)?.trim();

  if (!bookingId) return;

  const { data: session } = await auth.getSession();
  if (!session?.user) return;

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  if (!booking || booking.status !== "dispatched") return;

  // Update tech log entry
  const [techEntry] = await db.select().from(techLogEntries)
    .where(eq(techLogEntries.bookingId, bookingId));
  if (techEntry) {
    const airtime = techEntry.hobbsOut && hobbsIn
      ? String((parseFloat(hobbsIn) - parseFloat(techEntry.hobbsOut)).toFixed(1))
      : null;
    await db.update(techLogEntries).set({
      hobbsIn: hobbsIn || null,
      airtime,
      fuelAdded: fuelPostFlight || null,
    }).where(eq(techLogEntries.id, techEntry.id));
  }

  await db.update(bookings).set({
    status: "checked_in",
    actualEndTime: new Date(),
    updatedAt: new Date(),
  }).where(eq(bookings.id, bookingId));

  // Optional squawk on check-in
  if (squawkTitle) {
    await db.insert(squawks).values({
      aircraftId: booking.aircraftId,
      reportedBy: session.user.id,
      title: squawkTitle,
      description: squawkTitle,
      severity: "operational",
      status: "open",
    });
  }

  redirect(`/bookings/${bookingId}`);
}

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { id } = await params;

  const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
  if (!booking) {
    notFound();
  }

  const [ac] = await db.select().from(aircraft).where(eq(aircraft.id, booking.aircraftId));

  // Get current user's role
  const [userRow] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id));
  const role = userRow?.role ?? "member";
  const isInstructorOrAdmin = role === "instructor" || role === "admin";

  // For lesson sign-off: find the booking user's most recent active training record
  let activeTrainingRecord = null;
  if (isInstructorOrAdmin && booking.status === "completed") {
    const [tr] = await db.select().from(trainingRecords)
      .where(eq(trainingRecords.studentId, booking.userId))
      .orderBy(desc(trainingRecords.createdAt))
      .limit(1);
    activeTrainingRecord = tr ?? null;
  }

  const canCancel = booking.status === "pending" || booking.status === "confirmed";
  const canDispatch = booking.status === "confirmed";
  const canCheckin = booking.status === "dispatched";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bookings">&larr; Back to bookings</Link>
        </Button>
      </div>

      {/* ── Booking Details ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Booking Details</CardTitle>
            <BookingStatusBadge status={booking.status} />
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">Aircraft</dt>
              <dd className="font-medium">
                {ac ? (
                  <Link href={`/aircraft/${ac.id}`} className="hover:underline">
                    {ac.tailNumber} ({ac.type})
                  </Link>
                ) : (
                  "Unknown"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Status</dt>
              <dd className="font-medium capitalize">{booking.status.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">Start</dt>
              <dd className="font-medium">
                {new Date(booking.startTime).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm">End</dt>
              <dd className="font-medium">
                {new Date(booking.endTime).toLocaleString()}
              </dd>
            </div>
            {booking.actualStartTime && (
              <div>
                <dt className="text-muted-foreground text-sm">Actual Start</dt>
                <dd className="font-medium">
                  {new Date(booking.actualStartTime).toLocaleString()}
                </dd>
              </div>
            )}
            {booking.actualEndTime && (
              <div>
                <dt className="text-muted-foreground text-sm">Actual End</dt>
                <dd className="font-medium">
                  {new Date(booking.actualEndTime).toLocaleString()}
                </dd>
              </div>
            )}
            {booking.notes && (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-sm">Notes</dt>
                <dd className="font-medium">{booking.notes}</dd>
              </div>
            )}
          </dl>
        </CardContent>
        {canCancel && (
          <CardFooter>
            <form action={cancelBooking}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <Button type="submit" variant="destructive" size="sm">
                Cancel Booking
              </Button>
            </form>
          </CardFooter>
        )}
      </Card>

      {/* ── Dispatch Panel ── */}
      {canDispatch && (
        <Card className="mt-6 border-orange-200 dark:border-orange-900">
          <CardHeader>
            <CardTitle className="text-lg text-orange-700 dark:text-orange-400">
              Dispatch Aircraft
            </CardTitle>
          </CardHeader>
          <form action={dispatchBooking}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="hobbsOut">Hobbs Out</Label>
                <Input id="hobbsOut" name="hobbsOut" type="number" step="0.1" placeholder="e.g. 1234.5" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fuelState">Fuel State</Label>
                <Input id="fuelState" name="fuelState" placeholder="e.g. Full / ¾ / Half" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="preFlightConfirmed"
                  name="preFlightConfirmed"
                  className="h-4 w-4 rounded border-gray-300"
                  required
                />
                <Label htmlFor="preFlightConfirmed" className="cursor-pointer">
                  Pre-flight check completed — no undeclared defects
                </Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white">
                Dispatch
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* ── Check-in Panel ── */}
      {canCheckin && (
        <Card className="mt-6 border-teal-200 dark:border-teal-900">
          <CardHeader>
            <CardTitle className="text-lg text-teal-700 dark:text-teal-400">
              Check In Aircraft
            </CardTitle>
          </CardHeader>
          <form action={checkinBooking}>
            <input type="hidden" name="bookingId" value={booking.id} />
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="hobbsIn">Hobbs In</Label>
                <Input id="hobbsIn" name="hobbsIn" type="number" step="0.1" placeholder="e.g. 1235.8" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="fuelPostFlight">Fuel Post-flight</Label>
                <Input id="fuelPostFlight" name="fuelPostFlight" placeholder="e.g. ¾ / Half / Low" />
              </div>
              <div className="sm:col-span-2 grid gap-1.5">
                <Label htmlFor="squawkTitle">New Defect / Squawk (optional)</Label>
                <Input
                  id="squawkTitle"
                  name="squawkTitle"
                  placeholder="Leave blank if no defects found"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                Check In
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* ── Lesson Sign-off (instructor / admin only, completed bookings) ── */}
      {isInstructorOrAdmin && booking.status === "completed" && activeTrainingRecord && (
        <Card className="mt-6 border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="text-lg">Lesson Sign-off</CardTitle>
            <p className="text-sm text-muted-foreground">
              Record lesson outcome for this student&apos;s training record.
            </p>
          </CardHeader>
          <CardContent>
            <LessonSignoffForm trainingRecordId={activeTrainingRecord.id} />
          </CardContent>
        </Card>
      )}

      {/* Prompt when no training record found for completed booking */}
      {isInstructorOrAdmin && booking.status === "completed" && !activeTrainingRecord && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No active training record found for this student.{" "}
              <Link href="/admin/training" className="underline hover:text-foreground">
                Manage training records
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
