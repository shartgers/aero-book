/**
 * Verifies Neon DB connection and lists tables in public schema.
 * Loads .env.local for DATABASE_URL. Run: node scripts/db-verify.mjs
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

// Use dynamic import for Neon (ESM)
const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);

try {
  const tables = await sql`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema IN ('public', 'drizzle')
    ORDER BY table_schema, table_name;
  `;
  console.log("Neon DB connection OK.");
  console.log("Tables:");
  if (tables.length === 0) {
    console.log("  (none yet – run: npm run db:migrate)");
  } else {
    for (const r of tables) {
      console.log(`  ${r.table_schema}.${r.table_name}`);
    }
  }
  // Show applied Drizzle migrations if the journal table exists
  try {
    const migrations = await sql`
      SELECT hash, name FROM drizzle.__drizzle_migrations ORDER BY created_at;
    `;
    if (migrations.length > 0) {
      console.log("Applied migrations:", migrations.map((m) => m.name || m.hash).join(", "));
    }
  } catch {
    // Table may not exist before first migrate
  }
} catch (err) {
  console.error("DB error:", err.message);
  process.exit(1);
}
