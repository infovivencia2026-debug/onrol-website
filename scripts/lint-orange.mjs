/* Build-time gate: one orange, one place.
 *
 * The codebase had five competing oranges (#f46718, #ea580c, #f97316,
 * #f4671a, #ff6a3d) drifting across components. Brand orange is #f46718 and
 * #c04a08 is its AA-safe text tint on white; both live in the token files
 * listed under ALLOWED_FILES. Any other raw orange hex in src/ fails the
 * build — use the token instead.
 *
 * Run: node scripts/lint-orange.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["src"];
// The learn.onrol.in LMS is a separate surface built on the Tailwind orange
// ramp (#ea580c / #c2410c / #fb923c). It is deliberately out of this gate:
// folding it into the brand orange is a design decision, not a lint fix.
const SKIP_DIRS = [
  "src/components/learn",
  "src/pages/learn",
  "src/styles/learn-shell.css",
  "src/styles/learn-ceiling-shell.css",
];
const EXTS = [".ts", ".tsx", ".css", ".js", ".jsx", ".html", ".json"];

// The two canonical values: brand orange, and its AA-safe text tint on white.
// These are allowed anywhere (rewriting ~450 already-correct call sites to
// var() would be churn); the gate exists to stop NEW variants drifting in.
const CANONICAL = new Set(["f46718", "c04a08"]);

// Files permitted to declare any orange literal at all (the token sources).
const ALLOWED_FILES = new Set([
  "src/lib/brand.ts",
  "src/styles/onrol-tokens.css",
  "src/index.css",
]);

// Any hex that reads as orange: red high, green mid, blue low.
const HEX = /#([0-9a-fA-F]{6})\b/g;
const isOrange = (hex) => {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return r > 180 && g > 55 && g < 175 && b < 110 && r - b > 90;
};

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "node_modules" || name === "dist") continue;
      walk(p, out);
    } else if (EXTS.some((e) => name.endsWith(e))) {
      out.push(p);
    }
  }
  return out;
};

const offenders = [];
for (const dir of SCAN_DIRS) {
  for (const file of walk(join(ROOT, dir))) {
    const rel = relative(ROOT, file).split("\\").join("/");
    if (ALLOWED_FILES.has(rel)) continue;
    if (SKIP_DIRS.some((d) => rel.startsWith(d + "/") || rel.startsWith(d))) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const m of line.matchAll(HEX)) {
        if (isOrange(m[1]) && !CANONICAL.has(m[1].toLowerCase())) offenders.push(`${rel}:${i + 1}  #${m[1]}`);
      }
    });
  }
}

if (offenders.length) {
  console.error(
    `lint-orange: ${offenders.length} non-canonical orange literal(s).\n` +
      `Brand orange is #f46718 (#c04a08 for text on white). Replace these:\n  ` +
      offenders.join("\n  "),
  );
  process.exit(1);
}
console.log("lint-orange: clean");
