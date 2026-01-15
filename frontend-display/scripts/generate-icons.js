/**
 * Script to generate PWA icons from source image
 * Run: node scripts/generate-icons.js
 *
 * This script requires sharp package to be installed:
 * npm install sharp --save-dev
 */

import sharp from "sharp";
import { mkdir, access } from "fs/promises";
import { constants } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const MASKABLE_SIZES = [192, 512];

const SOURCE_IMAGE = join(__dirname, "../public/Wisse_logo1.png");
const OUTPUT_DIR = join(__dirname, "../public/icons");

async function ensureDir(dir) {
  try {
    await access(dir, constants.F_OK);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

async function generateIcon(size, isMaskable = false) {
  const outputName = isMaskable
    ? `icon-maskable-${size}x${size}.png`
    : `icon-${size}x${size}.png`;
  const outputPath = join(OUTPUT_DIR, outputName);

  try {
    if (isMaskable) {
      // Maskable icons need safe zone (inner 80% is safe)
      // Add padding to ensure logo is in safe zone
      const padding = Math.floor(size * 0.1); // 10% padding on each side
      const innerSize = size - padding * 2;

      await sharp(SOURCE_IMAGE)
        .resize(innerSize, innerSize, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        })
        .png()
        .toFile(outputPath);
    } else {
      await sharp(SOURCE_IMAGE)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 1 },
        })
        .png()
        .toFile(outputPath);
    }
    console.log(`✓ Generated: ${outputName}`);
  } catch (error) {
    console.error(`✗ Failed to generate ${outputName}:`, error.message);
  }
}

async function main() {
  console.log("🎨 Generating PWA icons...\n");

  await ensureDir(OUTPUT_DIR);

  // Generate regular icons
  console.log("Regular icons:");
  for (const size of ICON_SIZES) {
    await generateIcon(size, false);
  }

  // Generate maskable icons
  console.log("\nMaskable icons:");
  for (const size of MASKABLE_SIZES) {
    await generateIcon(size, true);
  }

  // Generate favicon
  console.log("\nFavicon:");
  try {
    await sharp(SOURCE_IMAGE)
      .resize(32, 32, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png()
      .toFile(join(__dirname, "../public/favicon.png"));
    console.log("✓ Generated: favicon.png");
  } catch (error) {
    console.error("✗ Failed to generate favicon:", error.message);
  }

  // Generate apple-touch-icon
  console.log("\nApple Touch Icon:");
  try {
    await sharp(SOURCE_IMAGE)
      .resize(180, 180, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png()
      .toFile(join(__dirname, "../public/apple-touch-icon.png"));
    console.log("✓ Generated: apple-touch-icon.png");
  } catch (error) {
    console.error("✗ Failed to generate apple-touch-icon:", error.message);
  }

  console.log("\n✅ Icon generation complete!");
}

main().catch(console.error);
