import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { aircraft, bookings } from "@/db/schema";
import { and, gte, lt, ne } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { BookingSlotPopover } from "@/components/BookingSlotPopover";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

const HOURS_START = 6;
const HOURS_END = 20;

/** Format a Date as YYYY-MM-DD in local time for use in ?date= query param. */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD string to Date at start of that day (local). Returns null if invalid. */
function parseDateParam(value: string | undefined): Date | null {
  if (!value || typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const y = parseInt(match[1], 10);
  const m = parseInt(match[2], 10) - 1;
  const d = parseInt(match[3], 10);
  const date = new Date(y, m, d);
  if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d) return null;
  return date;
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { date: dateParam } = await searchParams;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayStart = parseDateParam(dateParam) ?? todayStart;
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const prevDay = new Date(dayStart);
  prevDay.setDate(prevDay.getDate() - 1);
  const nextDay = new Date(dayStart);
  nextDay.setDate(nextDay.getDate() + 1);
  const isToday =
    dayStart.getFullYear() === todayStart.getFullYear() &&
    dayStart.getMonth() === todayStart.getMonth() &&
    dayStart.getDate() === todayStart.getDate();

  const allAircraft = await db.select().from(aircraft).orderBy(aircraft.tailNumber);

  const todayBookings = await db
    .select()
    .from(bookings)
    .where(
      and(
        ne(bookings.status, "cancelled"),
        lt(bookings.startTime, dayEnd),
        gte(bookings.endTime, dayStart)
      )
    );

  // Build a map of aircraft id -> tail number for popovers
  const aircraftMap = new Map(allAircraft.map((ac) => [ac.id, ac.tailNumber]));

  const hours = Array.from({ length: HOURS_END - HOURS_START }, (_, i) => HOURS_START + i);

  function getBookingSlots(aircraftId: string) {
    return todayBookings.filter((b) => b.aircraftId === aircraftId);
  }

  function bookingOverlapsHour(booking: typeof todayBookings[number], hour: number): boolean {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    const slotStart = new Date(dayStart);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(dayStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    return start < slotEnd && end > slotStart;
  }

  const dateLabel = dayStart.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Bookings</h1>
          {/* Day navigation: previous | date (or Today) | next */}
          <nav className="flex items-center gap-1" aria-label="Change day">
            <Button variant="outline" size="icon" asChild title="Previous day">
              <Link href={`/bookings?date=${toDateString(prevDay)}`}>
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <span className="min-w-[200px] px-2 text-center text-sm font-medium text-muted-foreground sm:min-w-[260px]">
              {isToday ? `Today — ${dateLabel}` : dateLabel}
            </span>
            <Button variant="outline" size="icon" asChild title="Next day">
              <Link href={`/bookings?date=${toDateString(nextDay)}`}>
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            {!isToday && (
              <Button variant="ghost" size="sm" asChild className="ml-1">
                <Link href="/bookings">Today</Link>
              </Button>
            )}
          </nav>
        </div>
        <Button asChild>
          <Link href="/bookings/new">New Booking</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="border-r px-3 py-2 text-left text-sm font-medium">Aircraft</th>
              {hours.map((h) => (
                <th key={h} className="min-w-[60px] border-r px-1 py-2 text-center text-xs font-medium">
                  {String(h).padStart(2, "0")}:00
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allAircraft.map((ac) => {
              const acBookings = getBookingSlots(ac.id);
              return (
                <tr key={ac.id} className="border-t">
                  <td className="border-r px-3 py-2 text-sm font-medium">{ac.tailNumber}</td>
                  {hours.map((h) => {
                    const overlapping = acBookings.find((b) => bookingOverlapsHour(b, h));
                    return (
                      <td
                        key={h}
                        className={cn(
                          "border-r px-1 py-2 text-center text-xs",
                          overlapping ? "bg-primary/15 text-primary" : ""
                        )}
                      >
                        {overlapping ? (
                          <BookingSlotPopover
                            booking={{
                              id: overlapping.id,
                              aircraftTailNumber: aircraftMap.get(overlapping.aircraftId) ?? "—",
                              startTime: overlapping.startTime.toISOString(),
                              endTime: overlapping.endTime.toISOString(),
                              status: overlapping.status,
                            }}
                          />
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {allAircraft.length === 0 && (
              <tr>
                <td colSpan={hours.length + 1} className="px-3 py-8 text-center text-muted-foreground">
                  No aircraft available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
