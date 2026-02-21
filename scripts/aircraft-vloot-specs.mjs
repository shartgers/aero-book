/**
 * Loads aircraft specs from the Vliegclub Rotterdam fleet (input/Vloot.md)
 * into the aircraft table. Updates existing rows by tail_number.
 *
 * Run after db:migrate and db:seed-aircraft:
 *   npm run db:vloot
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

// ---------------------------------------------------------------------------
// Specs from input/Vloot.md — keyed by tail_number
// ---------------------------------------------------------------------------
const dr400Specs = {
  engine: "Lycoming O-360, 180 pk",
  seats: 4,
  maxSpeed: "~173 mph (280 km/h)",
  cruiseSpeed: "~140 knots (260 km/h)",
  range: "~900 miles (1.450 km)",
  fuelBurnPerHour: "~35 liter/uur",
  maxTakeoffWeight: "1.100 kg",
  description:
    "Frans gebouwd enkelmotorig vliegtuig van hout en stof, sliding canopy, cranked wing. Gebouwd in Dijon-Darois door Avions Pierre Robin. Meerdere DR400's uitgerust voor IFR, één met glass cockpit.",
};

const specsByTail = {
  "PH-HLR": dr400Specs,
  "PH-NCD": dr400Specs,
  "PH-NSC": dr400Specs,
  "PH-SPZ": dr400Specs,
  "PH-SVT": dr400Specs,
  "PH-SVU": dr400Specs,
};

// Robin R2160 — aerobatics 2-seater (Vloot: 1 stuk)
specsByTail["PH-SVN"] = {
  engine: "Lycoming 160 pk",
  seats: 2,
  maxSpeed: null,
  cruiseSpeed: null,
  range: null,
  fuelBurnPerHour: null,
  maxTakeoffWeight: null,
  description:
    "Speciaal kunstvliegtuig (aerobatics), 2-zitter. Ontworpen mede door Chris Heintz. Wordt gebruikt voor aerobatics-training en af en toe bij formatieteamvluchten.",
};

// Piper Archer III (PA-28-181)
specsByTail["PH-SVP"] = {
  engine: "Lycoming O-360, 180 pk",
  seats: 4,
  maxSpeed: null,
  cruiseSpeed: "~128 knots (237 km/h)",
  range: "~520 nm (960 km)",
  fuelBurnPerHour: null,
  maxTakeoffWeight: "1.157 kg",
  description:
    "Uitgerust met Garmin GI 275 glass cockpit instrumenten + autopilot, geschikt voor IFR-opleiding.",
};

// Piper Warrior (PA-28-161)
specsByTail["PH-VSY"] = {
  engine: "Lycoming O-320, 160 pk",
  seats: 4,
  maxSpeed: null,
  cruiseSpeed: "~108 knots (200 km/h)",
  range: "~450 nm (835 km)",
  fuelBurnPerHour: null,
  maxTakeoffWeight: null,
  description: null,
};

async function main() {
  console.log("Loading Vloot specs into aircraft table...\n");

  let updated = 0;
  let skipped = 0;

  for (const [tailNumber, spec] of Object.entries(specsByTail)) {
    const result = await sql`
      UPDATE aircraft
      SET
        engine = ${spec.engine ?? null},
        seats = ${spec.seats ?? null},
        max_speed = ${spec.maxSpeed ?? null},
        cruise_speed = ${spec.cruiseSpeed ?? null},
        range = ${spec.range ?? null},
        fuel_burn_per_hour = ${spec.fuelBurnPerHour ?? null},
        max_takeoff_weight = ${spec.maxTakeoffWeight ?? null},
        description = ${spec.description ?? null},
        updated_at = NOW()
      WHERE tail_number = ${tailNumber}
      RETURNING tail_number
    `;

    if (result.length > 0) {
      console.log(`  ✓ ${tailNumber} — ${spec.engine ?? "specs"}`);
      updated++;
    } else {
      console.log(`  – ${tailNumber} (not in DB, run db:seed-aircraft first)`);
      skipped++;
    }
  }

  console.log(`\nDone. ${updated} updated, ${skipped} not found.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
