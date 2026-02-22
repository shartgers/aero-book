/**
 * Seeds the bills table from existing bookings.
 * Each booking gets at most one bill. Hours and costs are derived from
 * booking duration and aircraft hourly rate; optional instructor, landing,
 * and surcharges are added for variety.
 *
 * Prerequisites: db:migrate, db:seed-aircraft, db:seed-bookings (bookings must exist).
 *
 * Run: node scripts/seed-bills.mjs
 * Or:  npm run db:seed-bills
 *
 * Optional env: BILL_MAX=100  — max number of bills to create (default: all bookings without a bill).
 *
 * Safe to re-run: only creates bills for bookings that do not yet have a bill.
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

const BILL_MAX = parseInt(process.env.BILL_MAX ?? "9999", 10);

// Status distribution: mostly paid, some pending, a few disputed/refunded
const STATUS_WEIGHTS = [
  ["paid", 0.55],
  ["pending", 0.30],
  ["disputed", 0.10],
  ["refunded", 0.05],
];

function pickStatus() {
  const r = Math.random();
  let acc = 0;
  for (const [status, weight] of STATUS_WEIGHTS) {
    acc += weight;
    if (r < acc) return status;
  }
  return "paid";
}

/** Round to 2 decimals for currency. */
function round2(n) {
  return Math.round(n * 100) / 100;
}

/** Duration in hours from start to end (timestamps). */
function hoursBetween(start, end) {
  return (new Date(end) - new Date(start)) / (1000 * 60 * 60);
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(DATABASE_URL);

// ─── Load bookings that don't have a bill yet, with aircraft rate ───────────
const candidates = await sql`
  SELECT
    b.id AS booking_id,
    b.user_id,
    b.start_time,
    b.end_time,
    a.id AS aircraft_id,
    (a.hourly_rate::float) AS hourly_rate
  FROM bookings b
  JOIN aircraft a ON a.id = b.aircraft_id
  LEFT JOIN bills bl ON bl.booking_id = b.id
  WHERE bl.id IS NULL
  ORDER BY b.start_time
  LIMIT ${BILL_MAX}
`;

if (candidates.length === 0) {
  console.log("No bookings without a bill. Run db:seed-bookings first or bills are already seeded.");
  process.exit(0);
}

console.log(`Creating bills for ${candidates.length} booking(s)...\n`);

let inserted = 0;
let paymentsInserted = 0;

for (const row of candidates) {
  const aircraftHours = round2(hoursBetween(row.start_time, row.end_time));
  if (aircraftHours <= 0) continue;

  const aircraftCost = round2(aircraftHours * parseFloat(row.hourly_rate));

  // Optional: instructor for ~30% of bills (1.0 or 1.5 hours @ 50 EUR)
  let instructorHours = null;
  let instructorCost = null;
  if (Math.random() < 0.3) {
    instructorHours = Math.random() < 0.5 ? 1.0 : 1.5;
    instructorCost = round2(instructorHours * 50);
  }

  // Optional: landing fees and surcharges
  const landingFees = Math.random() < 0.4 ? round2(12 + Math.random() * 10) : null;
  const surcharges = Math.random() < 0.2 ? round2(5) : null;

  let totalAmount = aircraftCost + (instructorCost ?? 0) + (landingFees ?? 0) + (surcharges ?? 0);
  totalAmount = round2(totalAmount);

  const status = pickStatus();
  const paidAt = status === "paid" ? new Date() : null;
  const paymentIntentId = status === "paid" ? `seed_pi_${row.booking_id.replace(/-/g, "").slice(0, 24)}` : null;

  const result = await sql`
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
      ${row.booking_id}, ${row.user_id},
      ${aircraftHours}, ${aircraftCost},
      ${instructorHours}, ${instructorCost},
      ${landingFees}, ${surcharges},
      ${totalAmount}, ${status},
      ${paymentIntentId}, ${paidAt},
      NOW(), NOW()
    )
    RETURNING id, total_amount, status
  `;

  if (result.length === 0) continue;
  inserted++;
  const bill = result[0];

  // For paid bills, add a matching payment record (so lists show as paid).
  if (status === "paid") {
    await sql`
      INSERT INTO payments (bill_id, amount, payment_method, stripe_payment_id, status, created_at)
      VALUES (${bill.id}, ${totalAmount}, 'card', ${paymentIntentId}, 'completed', NOW())
    `;
    paymentsInserted++;
  }
}

console.log(`Done. Bills created: ${inserted}. Payment records (for paid bills): ${paymentsInserted}.`);
if (inserted < candidates.length) {
  console.log(`(Skipped ${candidates.length - inserted} due to zero/negative duration.)`);
}
