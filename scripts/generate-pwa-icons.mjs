/**
 * Generates PWA icons (icon-192.png, icon-512.png) in public/ using sharp.
 * Run: node scripts/generate-pwa-icons.mjs
 * Requires: npm install --save-dev sharp
 */
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");

// Theme colour from manifest (#1d4ed8) as RGB
const THEME_RGB = { r: 29, g: 78, b: 216 };

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Missing 'sharp'. Install with: npm install --save-dev sharp");
    process.exit(1);
  }

  mkdirSync(publicDir, { recursive: true });

  for (const size of [192, 512]) {
    const buffer = await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: THEME_RGB,
      },
    })
      .png()
      .toBuffer();

    const path = resolve(publicDir, `icon-${size}.png`);
    writeFileSync(path, buffer);
    console.log(`Wrote ${path}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
