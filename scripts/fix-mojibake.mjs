// One-shot script: fix UTF-8 mojibake byte-sequences in source files.
// Patterns are built at runtime from raw code points to avoid any JS parser
// confusion with embedded quotes/specials inside the mojibake strings.
//
//   node scripts/fix-mojibake.mjs            # dry-run
//   node scripts/fix-mojibake.mjs --apply    # writes the fixes

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const APPLY = process.argv.includes("--apply");

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".html", ".css"]);
const SKIP_DIRS = new Set([
  "node_modules", "dist", "build", "release", ".git",
  "android", "desktop", "supabase", "public",
]);

const s = (...codes) => String.fromCharCode(...codes);

// [mojibake-as-code-points, real-character, label, observed-count]
// Sorted by source length DESC at runtime so longer matches eat their bytes
// before any shorter prefix can touch them.
const RAW = [
  // 3-char sequences
  [s(0x00E2, 0x201D, 0x20AC), "─", "box-drawing horizontal", 8622],
  [s(0x00E2, 0x20AC, 0x201D), "—", "em dash",                1598],
  [s(0x00E2, 0x0022, 0x20AC), "─", "box-drawing variant",     700],
  [s(0x00E2, 0x201A, 0x00B9), "₹", "rupee",                   369],
  [s(0x00E2, 0x20AC, 0x201C), "–", "en dash",                 161],
  [s(0x00E2, 0x2020, 0x2019), "→", "right arrow",             123],
  [s(0x00E2, 0x20AC, 0x0022), "—", "em dash variant",          13],
  [s(0x00E2, 0x20AC, 0x00A6), "…", "ellipsis",                  7],
  [s(0x00E2, 0x02DC, 0x2026), "★", "black star",                3],
  [s(0x00E2, 0x2020, 0x0027), "→", "right arrow alt",           3],
  [s(0x00E2, 0x2020, 0x201C), "↓", "down arrow",                2],
  [s(0x00E2, 0x2030, 0x02C6), "≈", "approx",                    1],
  [s(0x00E2, 0x0161, 0x2122), "⚙", "gear",                      1],
  [s(0x00E2, 0x0161, 0x00A1), "⚡", "high voltage",              1],
  [s(0x00E2, 0x0153, 0x00A8), "✨", "sparkles",                  1],
  // 4-char emoji mojibake (F0 9F XX XX → 4-byte UTF-8 emoji)
  [s(0x00F0, 0x0178, 0x0161, 0x20AC), "🚀", "rocket",                3],
  [s(0x00F0, 0x0178, 0x017D, 0x201C), "🎓", "graduation cap",        2],
  [s(0x00F0, 0x0178, 0x2019, 0x00BC), "💼", "briefcase",             2],
  [s(0x00F0, 0x0178, 0x017D, 0x00AF), "🎯", "bullseye",              2],
  [s(0x00F0, 0x0178, 0x008F, 0x00B7), "🏷", "label",                 1],
  [s(0x00F0, 0x0178, 0x201C, 0x0161), "📚", "books",                 1],
  [s(0x00F0, 0x0178, 0x201C, 0x02C6), "📈", "chart up",              1],
  [s(0x00F0, 0x0178, 0x017D, 0x00AC), "🎬", "clapper",               1],
  [s(0x00F0, 0x0178, 0x008F, 0x00AA), "🏪", "store",                 1],
  [s(0x00F0, 0x0178, 0x0152, 0x00B8), "🌸", "cherry blossom",        1],
  // 3-char emoji truncations (must match BEFORE 2-char patterns)
  [s(0x00F0, 0x0178, 0x203A),         "🛠",  "hammer/wrench trunc",   2],
  [s(0x00F0, 0x0178, 0x008F),         "🏆", "trophy trunc",          1],
  // 2-char sequences (run AFTER all 3+char ones)
  [s(0x00E2, 0x2020),         "←", "left arrow truncated",      5],
  [s(0x00E2, 0x2030),         "≈", "approx truncated",          1],
  [s(0x00E2, 0x0161),         "⚠", "warning truncated",         1],
  [s(0x00C2, 0x00B7),         "·", "middle dot",               49],
  [s(0x00C3, 0x00A9),         "é", "e-acute",                   1],
];

const REPLACEMENTS = RAW.slice().sort((a, b) => b[0].length - a[0].length);

function fixText(text) {
  let out = text;
  for (const [from, to] of REPLACEMENTS) {
    if (out.includes(from)) out = out.split(from).join(to);
  }
  return out;
}

const ROOT = process.cwd();
const summary = { scanned: 0, affected: 0, totalReplacements: 0, perFile: [] };

const MOJIBAKE_DETECT = /[ÂÃâ][\s\S]?[\s\S]?/g;

function countMojibake(text) {
  return (text.match(MOJIBAKE_DETECT) || []).length;
}

function processFile(p) {
  summary.scanned++;
  const original = readFileSync(p, "utf8");
  const fixed = fixText(original);
  if (fixed === original) return;
  const diff = countMojibake(original) - countMojibake(fixed);
  summary.affected++;
  summary.totalReplacements += diff;
  summary.perFile.push({ path: p, fixed: diff });
  if (APPLY) writeFileSync(p, fixed, "utf8");
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    if (name.startsWith(".") && name !== ".env.example") continue;
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p);
    else if (EXTENSIONS.has(extname(p).toLowerCase())) processFile(p);
  }
}

walk(join(ROOT, "src"));
walk(join(ROOT, "scripts"));
try {
  const idx = join(ROOT, "index.html");
  if (statSync(idx).isFile()) processFile(idx);
} catch {}

console.log(`Mode: ${APPLY ? "APPLY (writing changes)" : "DRY-RUN"}`);
console.log(`Files scanned: ${summary.scanned}`);
console.log(`Files affected: ${summary.affected}`);
console.log(`Mojibake instances cleaned: ${summary.totalReplacements}`);
console.log("\nTop-15 affected files:");
summary.perFile
  .sort((a, b) => b.fixed - a.fixed)
  .slice(0, 15)
  .forEach((f) => {
    const rel = f.path.replace(ROOT + "\\", "").replace(ROOT + "/", "");
    console.log(`  ${f.fixed.toString().padStart(6)}  ${rel}`);
  });

if (!APPLY) console.log("\nDry-run only. Re-run with --apply to write.");
