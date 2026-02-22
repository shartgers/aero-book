/**
 * Flightradar24 API sandbox test using the official @flightradar24/fr24sdk.
 * Verifies connectivity and response shape; sandbox does not consume credits.
 * See: https://fr24api.flightradar24.com/docs/sandbox-environment
 *
 * Requires: FR24_SANDBOX_API_KEY (or FR24_API_KEY or FR24_API_TOKEN) in .env.local.
 * Get a sandbox key from FR24 API portal → Key management.
 *
 * Run: npm run fr24:sandbox
 */
import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
config({ path: resolve(root, ".env.local") });

const apiToken =
  process.env.FR24_SANDBOX_API_KEY ||
  process.env.FR24_API_KEY ||
  process.env.FR24_API_TOKEN;

if (!apiToken) {
  console.error("Missing FR24_SANDBOX_API_KEY, FR24_API_KEY or FR24_API_TOKEN in .env.local");
  console.error("Get a sandbox key from: https://fr24api.flightradar24.com → Key management");
  process.exit(1);
}

async function run() {
  const SDK = await import("@flightradar24/fr24sdk");
  const client = new SDK.default.Client({
    apiToken,
    apiVersion: "v1",
  });

  let failed = false;

  try {
    // 1. Static airline (light) – sandbox returns American Airlines
    try {
      const airline = await client.airlines.getLight("AAL");
      if (!airline || !airline.name || !airline.iata || !airline.icao) {
        console.error("Airline response missing expected fields (name, iata, icao):", airline);
        failed = true;
      } else {
        console.log("OK airlines.getLight(AAL):", airline.name, `(${airline.iata}/${airline.icao})`);
      }
    } catch (e) {
      console.error("Airline request error:", e.message);
      failed = true;
    }

    // 2. Live flight positions (full) – sandbox returns one static flight
    try {
      const positions = await client.live.getFull({
        bounds: "50.682,46.218,14.422,22.243",
      });
      if (!Array.isArray(positions)) {
        console.error("Live positions response is not an array:", positions);
        failed = true;
      } else {
        const first = positions[0];
        const hasFlight =
          first && "flight" in first && "lat" in first && "lon" in first;
        if (!hasFlight) {
          console.error(
            "Live positions entry missing expected fields (flight, lat, lon):",
            first
          );
          failed = true;
        } else {
          console.log(
            "OK live.getFull: count =",
            positions.length,
            "e.g. flight",
            first?.flight
          );
        }
      }
    } catch (e) {
      console.error("Flight positions request error:", e.message);
      failed = true;
    }
  } finally {
    client.close();
  }

  if (failed) process.exit(1);
  console.log("FR24 sandbox test passed (using @flightradar24/fr24sdk).");
}

run();
