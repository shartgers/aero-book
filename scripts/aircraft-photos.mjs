/**
 * Fetches aircraft photos by tail number (registry) from airport-data.com
 * and updates the aircraft table with image_url.
 *
 * Usage: node scripts/aircraft-photos.mjs
 * Requires: DATABASE_URL in .env.local
 *
 * Uses airport-data.com Aircraft Thumbnail API (registry search).
 * Rate-limits requests with a short delay between aircraft.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

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

/** Delay helper to avoid hammering the API */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch first thumbnail URL for a given aircraft registry (tail number).
 * Uses airport-data.com API: search by registry with r= parameter.
 * @param {string} tailNumber - e.g. "N12345" or "G-KKAZ"
 * @returns {Promise<string|null>} thumbnail image URL or null if not found
 */
async function fetchPhotoUrlByTailNumber(tailNumber) {
  const encoded = encodeURIComponent(tailNumber.trim());
  const apiUrl = `https://airport-data.com/api/ac_thumb.json?r=${encoded}&n=1`;
  try {
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (data.status === 200 && data.data && data.data.length > 0 && data.data[0].image) {
      return data.data[0].image;
    }
    return null;
  } catch (err) {
    console.warn(`  API error for ${tailNumber}:`, err.message);
    return null;
  }
}

async function main() {
  console.log("Fetching aircraft list from database...");
  const rows = await sql`SELECT id, tail_number, image_url FROM aircraft ORDER BY tail_number`;
  if (rows.length === 0) {
    console.log("No aircraft in database. Exiting.");
    return;
  }
  console.log(`Found ${rows.length} aircraft. Looking up photos (one request per aircraft, with delay)...\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    const { id, tail_number: tailNumber, image_url: existingUrl } = row;
    process.stdout.write(`${tailNumber} ... `);

    // Skip if we already have an image (re-run can re-fetch if you clear image_url)
    if (existingUrl) {
      console.log("already has image, skip");
      skipped++;
      continue;
    }

    const imageUrl = await fetchPhotoUrlByTailNumber(tailNumber);
    await sleep(400); // Be nice to airport-data.com

    if (imageUrl) {
      await sql`UPDATE aircraft SET image_url = ${imageUrl}, updated_at = now() WHERE id = ${id}`;
      console.log("OK");
      updated++;
    } else {
      console.log("no photo found");
      failed++;
    }
  }

  console.log("\nDone.");
  console.log(`Updated: ${updated}, Skipped (had image): ${skipped}, No photo found: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
