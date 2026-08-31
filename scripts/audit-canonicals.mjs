// One-shot audit: scan every dist/**/index.html for canonical mismatches.
// A mismatch is when the declared canonical doesn't match the file's own URL.
// Such mismatches can trigger Google Search Console's
// "Duplicate, Google chose different canonical than user" warning.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = "dist";
const SITE = "https://onrol.in";

const normalize = (u) => u.replace(/\/+$/, "");

const mismatches = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) {
      walk(p);
    } else if (name === "index.html") {
      const html = readFileSync(p, "utf8");
      const m = html.match(/rel="canonical"[^>]*href="([^"]+)"/);
      if (!m) return;
      const declared = m[1];

      const relPath =
        p.replace(/\\/g, "/").replace(/^dist/, "").replace(/\/index\.html$/, "/");
      const expected = SITE + relPath;

      if (normalize(declared) !== normalize(expected)) {
        mismatches.push({ file: relPath, declared, expected });
      }
    }
  }
}

walk(ROOT);

console.log(`Scanned dist/. Mismatches: ${mismatches.length}`);
console.log();
for (const m of mismatches.slice(0, 30)) {
  console.log(`PAGE:     ${m.file}`);
  console.log(`  declared: ${m.declared}`);
  console.log(`  expected: ${m.expected}`);
  console.log();
}
