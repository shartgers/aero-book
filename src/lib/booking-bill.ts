/**
 * Shared logic for creating a bill when a booking is marked completed.
 * Used by the bookings API (PUT with status "completed") and the booking detail
 * page "Complete flight" server action. Ensures we don't create duplicate bills.
 */
import { db } from "@/db/index";
import { bills, bookings, aircraft, bookingInstructors, instructors } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Creates a pending bill for a booking that has been marked completed.
 * Uses actual or scheduled start/end times, aircraft hourly rate, and any
 * confirmed instructor to compute line items. Idempotent: skips if a bill
 * already exists for this booking.
 */
export async function createBillForCompletedBooking(bookingId: string): Promise<void> {
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, bookingId));
  if (!booking || booking.status !== "completed") {
    return;
  }

  // Avoid duplicate bills (e.g. if "Complete flight" or API is called twice)
  const [existing] = await db.select({ id: bills.id }).from(bills).where(eq(bills.bookingId, bookingId));
  if (existing) {
    return;
  }

  const startMs = (booking.actualStartTime ?? booking.startTime).getTime();
  const endMs = (booking.actualEndTime ?? booking.endTime).getTime();
  const aircraftHours = (endMs - startMs) / (1000 * 60 * 60);

  const [craft] = await db
    .select({ hourlyRate: aircraft.hourlyRate })
    .from(aircraft)
    .where(eq(aircraft.id, booking.aircraftId));
  const aircraftRate = parseFloat(craft?.hourlyRate ?? "0");
  const aircraftCost = aircraftHours * aircraftRate;

  let instructorHours: number | null = null;
  let instructorCost: number | null = null;
  const confirmedInstructors = await db
    .select({ instructorId: bookingInstructors.instructorId })
    .from(bookingInstructors)
    .where(
      and(
        eq(bookingInstructors.bookingId, bookingId),
        eq(bookingInstructors.status, "confirmed")
      )
    );

  if (confirmedInstructors.length > 0) {
    const [instr] = await db
      .select({ hourlyRate: instructors.hourlyRate })
      .from(instructors)
      .where(eq(instructors.id, confirmedInstructors[0].instructorId));
    if (instr) {
      const instrRate = parseFloat(instr.hourlyRate);
      instructorHours = aircraftHours;
      instructorCost = instructorHours * instrRate;
    }
  }

  const totalAmount = aircraftCost + (instructorCost ?? 0);

  await db.insert(bills).values({
    bookingId,
    userId: booking.userId,
    aircraftHours: aircraftHours.toFixed(2),
    aircraftCost: aircraftCost.toFixed(2),
    instructorHours: instructorHours?.toFixed(2) ?? null,
    instructorCost: instructorCost?.toFixed(2) ?? null,
    totalAmount: totalAmount.toFixed(2),
    status: "pending",
  });
}
