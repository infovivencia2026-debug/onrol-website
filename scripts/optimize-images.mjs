// One-off image optimizer.
// Reads heavy source images in /public and generates .webp + .avif siblings.
// Components use <picture> with these as <source> entries — browsers pick the
// smallest format they support, falling back to the original PNG/JPG.
//
// Why a script and not vite-imagetools / vite-plugin-image:
//   - We control exactly which images get optimized (avoid bloating build).
//   - One-time run; we commit the .webp/.avif outputs alongside originals.
//   - Idempotent — safe to re-run.

import { readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const PUBLIC_DIR = join(process.cwd(), "public");

// Images worth optimizing (large originals only). Add more as needed.
const TARGETS = [
  "hero-builder.png",
  "founder-neeraja-reddy.jpg",
  "onrol-logo-home.png",
  "onrol-logo-light.png",
  "onrol-logo-dark.png",
  "career-catalyst-hero.jpg",
  "win-background.png",
];

async function fileSize(p) {
  try {
    const s = await stat(p);
    return s.size;
  } catch {
    return null;
  }
}

function fmt(bytes) {
  if (bytes == null) return "—";
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

for (const fname of TARGETS) {
  const src = join(PUBLIC_DIR, fname);
  const buf = await readFile(src).catch(() => null);
  if (!buf) {
    console.warn(`[optimize-images] missing source: ${fname}`);
    continue;
  }
  const base = fname.replace(/\.(png|jpe?g)$/i, "");
  const webpOut = join(PUBLIC_DIR, `${base}.webp`);
  const avifOut = join(PUBLIC_DIR, `${base}.avif`);

  // WebP — 82 quality is a sweet spot (visually identical at typical viewing).
  const webp = await sharp(buf).webp({ quality: 82, effort: 6 }).toBuffer();
  await writeFile(webpOut, webp);

  // AVIF — slower to encode; smaller files. quality 60 ~= jpg quality 85.
  const avif = await sharp(buf).avif({ quality: 60, effort: 4 }).toBuffer();
  await writeFile(avifOut, avif);

  const origSize = await fileSize(src);
  const webpSize = await fileSize(webpOut);
  const avifSize = await fileSize(avifOut);
  console.log(
    `${fname.padEnd(32)} ${fmt(origSize).padStart(10)} → webp ${fmt(webpSize).padStart(10)}  avif ${fmt(avifSize).padStart(10)}`,
  );
}
