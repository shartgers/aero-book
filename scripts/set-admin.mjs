/**
 * One-off script: set a user's role to admin by email.
 * Usage: node scripts/set-admin.mjs <email>
 * Example: node scripts/set-admin.mjs Farzad@test.com
 * Loads .env.local for DATABASE_URL.
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

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/set-admin.mjs <email>");
  process.exit(1);
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(url);

try {
  // Find user by email (case-insensitive); then update by exact id so role is set correctly.
  const found = await sql`
    SELECT id, email, role FROM users WHERE LOWER(email) = LOWER(${email});
  `;
  if (found.length === 0) {
    const any = await sql`SELECT email, role FROM users LIMIT 10`;
    console.error(`No user found with email: ${email}`);
    if (any.length > 0) {
      console.error("Existing users (sample):", any.map((r) => r.email).join(", "));
    }
    process.exit(1);
  }
  const userId = found[0].id;
  const result = await sql`
    UPDATE users
    SET role = 'admin'::user_role, updated_at = now()
    WHERE id = ${userId}
    RETURNING id, email, role;
  `;
  console.log("User upgraded to admin:", result[0]);
} catch (err) {
  console.error("DB error:", err.message);
  process.exit(1);
}
