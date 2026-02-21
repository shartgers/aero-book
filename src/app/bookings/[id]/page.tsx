import { auth } from "@/lib/auth/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db/index";
import { bookings, aircraft } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

  const canCancel = booking.status === "pending" || booking.status === "confirmed";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bookings">&larr; Back to bookings</Link>
        </Button>
      </div>

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
              <dd className="font-medium capitalize">{booking.status.replace("_", " ")}</dd>
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
    </div>
  );
}
