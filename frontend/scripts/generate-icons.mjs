import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const SVG = join(ROOT, "public/icons/icon.svg");
const OUT = join(ROOT, "public/icons");

const svgBuffer = readFileSync(SVG);

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "maskable-512.png", size: 512, padding: 0.1 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "favicon-32x32.png", size: 32 },
];

for (const { name, size, padding = 0 } of sizes) {
  const innerSize = Math.floor(size * (1 - padding * 2));
  const offset = Math.floor((size - innerSize) / 2);

  const resizedSvg = await sharp(svgBuffer)
    .resize(innerSize, innerSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: padding > 0 ? { r: 14, g: 165, b: 233, alpha: 1 } : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resizedSvg, top: offset, left: offset }])
    .png()
    .toFile(join(OUT, name));

  console.log(`✅ ${name} (${size}x${size})`);
}

console.log("\n🎉 Semua icon berhasil digenerate!");