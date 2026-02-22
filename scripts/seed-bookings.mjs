/**
 * Seeds the bookings table with realistic test data spread over the coming
 * four weeks (today through today + 28 days).
 *
 * Strategy
 * ─────────
 * • Fetches every aircraft that is "available" (not grounded / maintenance).
 * • Fetches up to 20 existing users from public.users. If fewer than 5 exist
 *   it inserts a small set of named test pilots so bookings have plausible owners.
 * • For every day in the window, for every aircraft, fills 4–6 two-hour time
 *   slots chosen randomly from the flying window (08:00–18:00).  A per-slot
 *   random gate (threshold configurable via BOOKING_DENSITY, default 0.75)
 *   keeps some gaps so the grid looks busy but not impossibly packed.
 * • Booking status is distributed realistically:
 *     50 % confirmed  (solid bookings)
 *     25 % pre_booked (reservations not yet confirmed)
 *     15 % pending    (just submitted)
 *     10 % dispatched (crew on their way)
 *
 * Usage
 * ─────
 * node scripts/seed-bookings.mjs
 *
 * Optional env vars (besides DATABASE_URL):
 *   BOOKING_DAYS=28        – how many days ahead to fill  (default 28)
 *   BOOKING_DENSITY=0.75   – probability a slot is booked (default 0.75)
 *   DRY_RUN=1              – print would-be inserts, don't write to DB
 *
 * Safe to re-run: uses ON CONFLICT DO NOTHING based on
 * (aircraft_id, start_time).
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.local") });

// ─── Config ─────────────────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not found in .env.local");
  process.exit(1);
}

const DAYS_AHEAD = parseInt(process.env.BOOKING_DAYS ?? "28", 10);
const DENSITY    = parseFloat(process.env.BOOKING_DENSITY ?? "0.75");
const DRY_RUN    = process.env.DRY_RUN === "1";

// Flying-window: slots starting at these hours (UTC+0, adjust if your club
// is in a different TZ — these will be stored UTC in the DB).
// Each slot is 2 hours.  Slots: 08, 10, 12, 14, 16  → 5 slots / aircraft / day
const SLOT_HOURS = [8, 10, 12, 14, 16];
const SLOT_DURATION_HRS = 2;

const STATUS_WEIGHTS = [
  ["confirmed",  0.50],
  ["pre_booked", 0.25],
  ["pending",    0.15],
  ["dispatched", 0.10],
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pickStatus() {
  const r = Math.random();
  let acc = 0;
  for (const [status, weight] of STATUS_WEIGHTS) {
    acc += weight;
    if (r < acc) return status;
  }
  return "confirmed";
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 3_600_000);
}

function isoTs(date) {
  return date.toISOString();
}

/** Returns a Date at midnight UTC for `daysFromNow` days after today. */
function dayOffset(daysFromNow) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  return d;
}

// ─── Test pilot stubs (inserted if <5 users exist) ───────────────────────────
// Passwords are bcrypt hashes of "TestPilot1!" (cost 10)
const HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LpMPeUAVm4i";

const TEST_PILOTS = [
  { name: "Alex van der Berg",   email: "alex.vdberg@test.aerobook",   role: "member"     },
  { name: "Sanne Dijkstra",      email: "sanne.dijkstra@test.aerobook",role: "member"     },
  { name: "Luuk Vermeer",        email: "luuk.vermeer@test.aerobook",  role: "student"    },
  { name: "Mila de Vries",       email: "mila.devries@test.aerobook",  role: "member"     },
  { name: "Bas Hendriksen",      email: "bas.hendriksen@test.aerobook",role: "student"    },
  { name: "Emma Bakker",         email: "emma.bakker@test.aerobook",   role: "member"     },
  { name: "Daan Visser",         email: "daan.visser@test.aerobook",   role: "member"     },
  { name: "Lotte Mulder",        email: "lotte.mulder@test.aerobook",  role: "student"    },
  { name: "Thomas Smit",         email: "thomas.smit@test.aerobook",   role: "instructor" },
  { name: "Sophie Janssen",      email: "sophie.janssen@test.aerobook",role: "member"     },
];

// ─── Main ────────────────────────────────────────────────────────────────────
const { neon } = await import("@neondatabase/serverless");
const sql = neon(DATABASE_URL);

// 1. Load aircraft
const aircraftRows = await sql`
  SELECT id, tail_number, type, status
  FROM   aircraft
  WHERE  status != 'grounded'
  ORDER  BY tail_number
`;

if (aircraftRows.length === 0) {
  console.error("No aircraft found (or all grounded). Run npm run db:seed-aircraft first.");
  process.exit(1);
}
console.log(`Found ${aircraftRows.length} aircraft: ${aircraftRows.map(a => a.tail_number).join(", ")}`);

// 2. Load / create users
let userRows = await sql`
  SELECT id, email FROM users LIMIT 20
`;

if (userRows.length < 5) {
  console.log(`Only ${userRows.length} user(s) in DB — inserting test pilots…`);
  for (const p of TEST_PILOTS) {
    try {
      await sql`
        INSERT INTO users (name, email, password_hash, role, created_at, updated_at)
        VALUES (${p.name}, ${p.email}, ${HASH}, ${p.role}, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
      `;
    } catch (err) {
      console.warn(`  Could not insert ${p.email}: ${err.message}`);
    }
  }
  userRows = await sql`SELECT id, email FROM users LIMIT 20`;
}

console.log(`Using ${userRows.length} user(s) as booking owners.`);
const userIds = userRows.map(u => u.id);

// 3. Generate bookings
let inserted = 0;
let skipped  = 0;
let total    = 0;

const days = Array.from({ length: DAYS_AHEAD }, (_, i) => i);

for (const dayIdx of days) {
  const baseDay = dayOffset(dayIdx);

  for (const ac of aircraftRows) {
    // Shuffle slots so pattern varies per aircraft per day
    const shuffled = [...SLOT_HOURS].sort(() => Math.random() - 0.5);

    for (const slotHour of shuffled) {
      if (Math.random() > DENSITY) continue; // leave a gap

      const startTime = addHours(baseDay, slotHour);
      const endTime   = addHours(startTime, SLOT_DURATION_HRS);
      const userId    = userIds[Math.floor(Math.random() * userIds.length)];
      const status    = pickStatus();
      const notes     = status === "pre_booked"
        ? "Pre-booked — awaiting confirmation"
        : null;

      total++;

      if (DRY_RUN) {
        console.log(`[DRY] ${ac.tail_number}  ${isoTs(startTime)} → ${isoTs(endTime)}  ${status}`);
        continue;
      }

      try {
        const result = await sql`
          INSERT INTO bookings
            (aircraft_id, user_id, start_time, end_time, status, notes, created_at, updated_at)
          VALUES
            (${ac.id}, ${userId}, ${isoTs(startTime)}, ${isoTs(endTime)},
             ${status}, ${notes}, NOW(), NOW())
          ON CONFLICT DO NOTHING
          RETURNING id
        `;

        if (result.length > 0) {
          inserted++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.warn(`  WARN: ${ac.tail_number} ${isoTs(startTime)}: ${err.message}`);
        skipped++;
      }
    }
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log();
if (DRY_RUN) {
  console.log(`DRY RUN — would have attempted ${total} bookings.`);
} else {
  console.log(`Done.`);
  console.log(`  Attempted : ${total}`);
  console.log(`  Inserted  : ${inserted}`);
  console.log(`  Skipped   : ${skipped} (already existed or conflict)`);
  console.log();
  console.log(`Window: today through today + ${DAYS_AHEAD} days`);
  console.log(`Aircraft: ${aircraftRows.length}  ·  Users: ${userIds.length}  ·  Density: ${(DENSITY * 100).toFixed(0)}%`);
  console.log(`Expected range: ~${Math.round(aircraftRows.length * SLOT_HOURS.length * DAYS_AHEAD * DENSITY * 0.8)}–${Math.round(aircraftRows.length * SLOT_HOURS.length * DAYS_AHEAD * DENSITY)} bookings`);
}
