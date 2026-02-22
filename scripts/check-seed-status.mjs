/**
 * Checks which DB seed/test-data scripts have effectively been run
 * by querying the database (no run-history table exists).
 *
 * Run: node scripts/check-seed-status.mjs
 * Or:  npm run db:seed-status
 *
 * Requires: DATABASE_URL in .env.local
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

// Expected aircraft count from seed-aircraft.mjs (Vliegclub Rotterdam fleet)
const SEED_AIRCRAFT_COUNT = 9;

try {
  const [aircraftCount] = await sql`SELECT COUNT(*)::int AS n FROM aircraft`;
  const [bookingsCount] = await sql`SELECT COUNT(*)::int AS n FROM bookings`;
  const [billsCount] = await sql`SELECT COUNT(*)::int AS n FROM bills`;
  const [withPhoto] = await sql`SELECT COUNT(*)::int AS n FROM aircraft WHERE image_url IS NOT NULL AND image_url != ''`;
  const [withVlootSpecs] = await sql`SELECT COUNT(*)::int AS n FROM aircraft WHERE engine IS NOT NULL`;

  const nAircraft = aircraftCount.n;
  const nBookings = bookingsCount.n;
  const nBills = billsCount.n;
  const nWithPhoto = withPhoto.n;
  const nWithVloot = withVlootSpecs.n;

  const status = (ok, label) => (ok ? "✓ Run" : "– Not run");
  const script = (name, ok, hint) => ({
    name,
    run: ok,
    hint: hint || null,
  });

  const checks = [
    script(
      "db:seed-aircraft",
      nAircraft >= SEED_AIRCRAFT_COUNT,
      nAircraft === 0 ? "No aircraft in DB" : `${nAircraft} aircraft (expected ${SEED_AIRCRAFT_COUNT})`
    ),
    script(
      "db:seed-bookings",
      nBookings > 0,
      nBookings === 0 ? "No bookings" : `${nBookings} bookings`
    ),
    script(
      "db:aircraft-photos",
      nWithPhoto > 0,
      nAircraft === 0 ? "Run db:seed-aircraft first" : nWithPhoto === 0 ? "No aircraft have image_url" : `${nWithPhoto}/${nAircraft} aircraft have photos`
    ),
    script(
      "db:vloot (aircraft-vloot-specs)",
      nWithVloot > 0,
      nAircraft === 0 ? "Run db:seed-aircraft first" : nWithVloot === 0 ? "No aircraft have engine/specs" : `${nWithVloot}/${nAircraft} aircraft have Vloot specs`
    ),
    script(
      "db:seed-bills",
      nBills > 0,
      nBookings === 0 ? "Run db:seed-bookings first" : nBills === 0 ? "No bills" : `${nBills} bills`
    ),
  ];

  console.log("Seed script status (inferred from DB content)\n");
  console.log("Script                    Status    Note");
  console.log("───────────────────────── ───────── ─────────────────────────────────");
  for (const c of checks) {
    const st = c.run ? "✓ Run" : "– Not run";
    const hint = c.hint || "";
    console.log(`${c.name.padEnd(26)} ${st.padEnd(9)} ${hint}`);
  }
  console.log();

  const notRun = checks.filter((c) => !c.run).map((c) => c.name);
  if (notRun.length > 0) {
    console.log("Suggested order if running from scratch:");
    console.log("  1. npm run db:migrate");
    console.log("  2. npm run db:seed-aircraft");
    console.log("  3. npm run db:vloot          # optional – fleet specs");
    console.log("  4. npm run db:aircraft-photos # optional – photos by tail number");
    console.log("  5. npm run db:seed-bookings");
    console.log("  6. npm run db:seed-bills");
    console.log("  7. node scripts/set-admin.mjs <email>  # optional – make a user admin");
  }
} catch (err) {
  console.error("DB error:", err.message);
  process.exit(1);
}
