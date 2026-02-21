import { config } from "dotenv";
import { resolve } from "path";
import type { Config } from "drizzle-kit";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
