// One-off resize for the ONROL logo files.
// The originals were 4515x1200; displayed at ~237x63 on the homepage —
// Lighthouse flagged this as oversized. Resize to 600x160 (2.5x retina
// for the largest displayed size of ~240px wide) so we ship ~25-30 KiB
// instead of ~84 KiB of pixel data we never use.

import { mkdir, copyFile, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const PUBLIC_DIR = join(process.cwd(), "public");

// width × height target (retain aspect ratio anyway)
const TARGET_WIDTH = 600;

// Logos to resize — each will produce .png + .webp + .avif at the target
// width. Originals are backed up to {name}.orig.{ext} so we can revert.
const TARGETS = [
  "onrol-logo-light",
  "onrol-logo-dark",
];

async function backup(path) {
  try { await copyFile(path, path + ".orig"); } catch { /* ok */ }
}

async function fileSize(p) {
  try { return (await stat(p)).size; } catch { return null; }
}

function fmt(b) {
  if (b == null) return "—";
  if (b >= 1_000_000) return `${(b / 1_000_000).toFixed(2)} MB`;
  if (b >= 1_000) return `${(b / 1_000).toFixed(0)} KB`;
  return `${b} B`;
}

await mkdir(PUBLIC_DIR, { recursive: true });

for (const base of TARGETS) {
  // Use the .png as the source (highest fidelity input)
  const srcPng = join(PUBLIC_DIR, `${base}.png`);
  const buf = await readFile(srcPng).catch(() => null);
  if (!buf) {
    console.warn(`[resize] missing ${base}.png — skipping`);
    continue;
  }

  await backup(srcPng);
  const pngOut  = join(PUBLIC_DIR, `${base}.png`);
  const webpOut = join(PUBLIC_DIR, `${base}.webp`);
  const avifOut = join(PUBLIC_DIR, `${base}.avif`);
  await backup(webpOut);
  await backup(avifOut);

  // Single sharp pipeline; reused for each format.
  const resized = sharp(buf).resize({ width: TARGET_WIDTH, withoutEnlargement: true });

  await writeFile(pngOut,  await resized.clone().png({ quality: 90, compressionLevel: 9 }).toBuffer());
  await writeFile(webpOut, await resized.clone().webp({ quality: 86, effort: 6 }).toBuffer());
  await writeFile(avifOut, await resized.clone().avif({ quality: 62, effort: 4 }).toBuffer());

  console.log(
    `${base}: png ${fmt(await fileSize(pngOut)).padStart(8)}  ` +
    `webp ${fmt(await fileSize(webpOut)).padStart(8)}  ` +
    `avif ${fmt(await fileSize(avifOut)).padStart(8)}`
  );
}

console.log("\n[resize] done. originals saved as *.orig.*");
