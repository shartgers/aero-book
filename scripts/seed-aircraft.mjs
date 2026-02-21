/**
 * Seeds the aircraft table with the Vliegclub Rotterdam fleet (9 aircraft).
 * Source: input/Vloot.md
 *
 * Hourly rates are placeholders — update them to match actual club tariffs.
 *
 * Run: node scripts/seed-aircraft.mjs
 * Or:  npm run db:seed-aircraft
 *
 * Safe to re-run: uses INSERT ... ON CONFLICT (tail_number) DO NOTHING
 */
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.local") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL in .env.local");
  process.exit(1);
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);

// ---------------------------------------------------------------------------
// Fleet data — Vliegclub Rotterdam
// Hourly rates in EUR (placeholders, adjust to actual tariffs)
// ---------------------------------------------------------------------------
const aircraft = [
  // Robin DR400-180 Regent (6 aircraft)
  { tailNumber: "PH-HLR", type: "Robin DR400-180",       hourlyRate: "170.00" },
  { tailNumber: "PH-NCD", type: "Robin DR400-180",       hourlyRate: "170.00" },
  { tailNumber: "PH-NSC", type: "Robin DR400-180",       hourlyRate: "170.00" },
  { tailNumber: "PH-SPZ", type: "Robin DR400-180",       hourlyRate: "170.00" },
  { tailNumber: "PH-SVT", type: "Robin DR400-180",       hourlyRate: "170.00" },
  { tailNumber: "PH-SVU", type: "Robin DR400-180",       hourlyRate: "170.00" },
  // Robin R2160 — aerobatics 2-seater
  { tailNumber: "PH-SVN", type: "Robin R2160",           hourlyRate: "145.00" },
  // Piper Archer III (PA-28-181) — IFR, glass cockpit
  { tailNumber: "PH-SVP", type: "Piper Archer III",      hourlyRate: "185.00" },
  // Piper Warrior (PA-28-161)
  { tailNumber: "PH-VSY", type: "Piper Warrior",         hourlyRate: "165.00" },
];

let inserted = 0;
let skipped = 0;

for (const a of aircraft) {
  const result = await sql`
    INSERT INTO aircraft (tail_number, type, hourly_rate, status, created_at, updated_at)
    VALUES (
      ${a.tailNumber},
      ${a.type},
      ${a.hourlyRate},
      'available',
      NOW(),
      NOW()
    )
    ON CONFLICT (tail_number) DO NOTHING
    RETURNING tail_number
  `;

  if (result.length > 0) {
    console.log(`  ✓ Inserted ${a.tailNumber} — ${a.type}`);
    inserted++;
  } else {
    console.log(`  – Skipped ${a.tailNumber} (already exists)`);
    skipped++;
  }
}

console.log(`\nDone. ${inserted} inserted, ${skipped} skipped.`);
