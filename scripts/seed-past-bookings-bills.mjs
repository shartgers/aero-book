/**
 * Seeds past bookings and bills for specific test users (tester and farzad).
 * Finds users by email or name containing "tester" or "farzad" (case-insensitive),
 * then creates past bookings (e.g. over the last 60 days) and one bill per booking.
 *
 * Prerequisites: db:migrate, db:seed-aircraft. Target users must exist in public.users.
 *
 * Run: node scripts/seed-past-bookings-bills.mjs
 * Or:  npm run db:seed-past-bookings-bills
 *
 * Optional env:
 *   PAST_DAYS=60              — how many days back to spread bookings (default 60)
 *   PAST_BOOKINGS_PER_USER=10 — bookings to create per matched user (default 10)
 *
 * Safe to re-run: skips (aircraft_id, start_time) that already have a booking.
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not found in .env.local");
  process.exit(1);
}

const PAST_DAYS = parseInt(process.env.PAST_DAYS ?? "60", 10);
const PAST_BOOKINGS_PER_USER = parseInt(process.env.PAST_BOOKINGS_PER_USER ?? "10", 10);

// User identifiers: script matches email or name containing "tester" or "farzad" (case-insensitive)

const SLOT_HOURS = [8, 10, 12, 14, 16];
const SLOT_DURATION_HRS = 2;

/** Past date at midnight UTC, daysAgo days before today. */
function pastDayUTC(daysAgo) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 3_600_000);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function hoursBetween(start, end) {
  return (new Date(end) - new Date(start)) / (1000 * 60 * 60);
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(DATABASE_URL);

// ─── Find users matching "tester" or "farzad" (email or name, case-insensitive) ─
const users = await sql`
  SELECT id, email, name
  FROM users
  WHERE
    LOWER(email) LIKE ${"%tester%"}
    OR LOWER(email) LIKE ${"%farzad%"}
    OR LOWER(COALESCE(name, '')) LIKE ${"%tester%"}
    OR LOWER(COALESCE(name, '')) LIKE ${"%farzad%"}
`;
if (users.length === 0) {
  console.error("No users found matching 'tester' or 'farzad' (email or name). Create those users first.");
  process.exit(1);
}
console.log(`Found ${users.length} user(s): ${users.map((u) => u.email).join(", ")}`);

// Load aircraft (available only) with hourly rate for billing
const aircraft = await sql`
  SELECT id, tail_number, (hourly_rate::float) AS hourly_rate
  FROM aircraft
  WHERE status != 'grounded'
  ORDER BY tail_number
`;
if (aircraft.length === 0) {
  console.error("No aircraft found. Run npm run db:seed-aircraft first.");
  process.exit(1);
}

// ─── Create past bookings and bills per user ─────────────────────────────────
let totalBookings = 0;
let totalBills = 0;
let totalPayments = 0;

for (const user of users) {
  let insertedBookings = 0;
  const usedSlots = new Set(); // "aircraftId|startTimeIso" to avoid duplicates in this run

  for (let i = 0; i < PAST_BOOKINGS_PER_USER; i++) {
    const daysAgo = 1 + Math.floor(Math.random() * PAST_DAYS);
    const slotHour = SLOT_HOURS[Math.floor(Math.random() * SLOT_HOURS.length)];
    const ac = aircraft[Math.floor(Math.random() * aircraft.length)];

    const startTime = addHours(pastDayUTC(daysAgo), slotHour);
    const endTime = addHours(startTime, SLOT_DURATION_HRS);
    const startIso = startTime.toISOString();

    const slotKey = `${ac.id}|${startIso}`;
    if (usedSlots.has(slotKey)) continue;
    usedSlots.add(slotKey);

    // Skip if this aircraft+time already has a booking (e.g. from a previous run)
    const existing = await sql`
      SELECT 1 FROM bookings
      WHERE aircraft_id = ${ac.id} AND start_time = ${startIso}
      LIMIT 1
    `;
    if (existing.length > 0) continue;

    const status = Math.random() < 0.8 ? "completed" : "confirmed";

    const bookingResult = await sql`
      INSERT INTO bookings
        (aircraft_id, user_id, start_time, end_time, status, created_at, updated_at)
      VALUES
        (${ac.id}, ${user.id}, ${startIso}, ${endTime.toISOString()}, ${status}, NOW(), NOW())
      RETURNING id, start_time, end_time
    `;
    if (bookingResult.length === 0) continue;

    insertedBookings++;
    totalBookings++;
    const booking = bookingResult[0];

    // ─── Create bill for this booking ────────────────────────────────────────
    const aircraftHours = round2(hoursBetween(booking.start_time, booking.end_time));
    const aircraftCost = round2(aircraftHours * ac.hourly_rate);

    let instructorHours = null;
    let instructorCost = null;
    if (Math.random() < 0.3) {
      instructorHours = Math.random() < 0.5 ? 1.0 : 1.5;
      instructorCost = round2(instructorHours * 50);
    }
    const landingFees = Math.random() < 0.4 ? round2(12 + Math.random() * 10) : null;
    const surcharges = Math.random() < 0.2 ? round2(5) : null;
    let totalAmount = aircraftCost + (instructorCost ?? 0) + (landingFees ?? 0) + (surcharges ?? 0);
    totalAmount = round2(totalAmount);

    // Past bills: mostly paid, some pending
    const billStatus = Math.random() < 0.75 ? "paid" : "pending";
    const paidAt = billStatus === "paid" ? booking.start_time : null;
    const paymentIntentId = billStatus === "paid" ? `seed_pi_past_${booking.id.replace(/-/g, "").slice(0, 20)}` : null;

    const billResult = await sql`
      INSERT INTO bills (
        booking_id, user_id,
        aircraft_hours, aircraft_cost,
        instructor_hours, instructor_cost,
        landing_fees, surcharges,
        total_amount, status,
        payment_intent_id, paid_at,
        created_at, updated_at
      )
      VALUES (
        ${booking.id}, ${user.id},
        ${aircraftHours}, ${aircraftCost},
        ${instructorHours}, ${instructorCost},
        ${landingFees}, ${surcharges},
        ${totalAmount}, ${billStatus},
        ${paymentIntentId}, ${paidAt},
        NOW(), NOW()
      )
      RETURNING id
    `;
    if (billResult.length > 0) {
      totalBills++;
      if (billStatus === "paid") {
        await sql`
          INSERT INTO payments (bill_id, amount, payment_method, stripe_payment_id, status, created_at)
          VALUES (${billResult[0].id}, ${totalAmount}, 'card', ${paymentIntentId}, 'completed', NOW())
        `;
        totalPayments++;
      }
    }
  }

  console.log(`  ${user.email}: ${insertedBookings} past bookings (and bills) created.`);
}

console.log(`\nDone. Total: ${totalBookings} past bookings, ${totalBills} bills, ${totalPayments} payment records.`);
if (totalBookings === 0) {
  console.log("(No new slots; try increasing PAST_DAYS or PAST_BOOKINGS_PER_USER, or some slots may already exist.)");
}
