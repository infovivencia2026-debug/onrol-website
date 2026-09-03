/* =========================================================================
   ONROL — near-duplicate (shingle) audit for the programmatic SEO pages.

   Google's near-duplicate filter keys on overlapping 5-word sequences of the
   MAIN content (chrome + recognised template blocks discounted), NOT on the
   token-set difference validate-seo measures. This samples same-type page pairs
   and reports the real overlap distribution, so we can see the "duplicate wall"
   coming (brief: >30% = wall, 15-25% = watch, <15% = ship).

   Run:  node scripts/shingle-audit.mjs
   Exits non-zero if any sampled group averages above FAIL_AVG (regression guard).
   ========================================================================= */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WARN_AVG = 30, FAIL_AVG = 38;
const P = (s) => resolve(ROOT, "public", "sites", s, "index.html");

// Keep only variable content: strip nav/footer + the site-wide-constant sections.
function varText(file) {
  let h = readFileSync(file, "utf8").replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ");
  const s = h.indexOf('<header class="sx-hero"'), e = h.indexOf("</main>");
  if (s >= 0 && e >= 0) h = h.slice(s, e);
  h = h.replace(/<section class="sx-method"[\s\S]*?<\/section>/g, " ")
       .replace(/<section class="sx-sec sx-progs"[\s\S]*?<\/section>/g, " ")
       .replace(/<section class="sx-reg"[\s\S]*?<\/section>/g, " ")
       .replace(/<section class="sx-sec sx-related"[\s\S]*?<\/section>/g, " ");
  return h.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").toLowerCase();
}
function shingles(t, n = 5) { const w = t.match(/[a-z][a-z']{2,}/g) || [], s = new Set(); for (let i = 0; i <= w.length - n; i++) s.add(w.slice(i, i + n).join(" ")); return s; }
const cache = {}; const S = (f) => cache[f] || (cache[f] = shingles(varText(f)));
function overlap(f1, f2) { const a = S(f1), b = S(f2); let i = 0; for (const x of a) if (b.has(x)) i++; return 100 * i / Math.min(a.size, b.size); }

const gen = (() => { try { return JSON.parse(readFileSync(resolve(ROOT, "data/cross-generated.json"), "utf8")).pages; } catch { return []; } })();
const per = (() => { try { return JSON.parse(readFileSync(resolve(ROOT, "data/cross-personas-gen.json"), "utf8")).pages; } catch { return []; } })();

function sample(slugs, label, N = 60) {
  const list = slugs.filter((s) => existsSync(P(s)));
  if (list.length < 3) return null;
  let vals = [], seed = 1337;
  for (let k = 0; k < N; k++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff; const i = seed % list.length;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff; let j = seed % list.length; if (j === i) j = (j + 1) % list.length;
    vals.push(overlap(P(list[i]), P(list[j])));
  }
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const over = 100 * vals.filter((v) => v > 30).length / vals.length;
  return { label, avg, over, n: vals.length };
}

const courseKeys = [...new Set(gen.map((p) => p.slug.replace(/-course-in-.*/, "")))];
const personaKeys = [...new Set(per.map((p) => p.slug.replace(/^ai-course-for-/, "").replace(/-in-.*/, "")))];
const groups = [];
for (const c of courseKeys) groups.push(sample(gen.filter((p) => p.slug.startsWith(c + "-course-in-")).map((p) => p.slug), `cross: ${c}`));
for (const k of personaKeys) groups.push(sample(per.filter((p) => p.slug.startsWith(`ai-course-for-${k}-in-`)).map((p) => p.slug), `persona: ${k}`));

console.log(`\nShingle audit — variable-content 5-gram overlap (WARN>${WARN_AVG}% avg, FAIL>${FAIL_AVG}% avg)\n${"=".repeat(64)}`);
let worst = 0, fails = 0;
for (const g of groups.filter(Boolean).sort((a, b) => b.avg - a.avg)) {
  const flag = g.avg > FAIL_AVG ? "✗ FAIL" : g.avg > WARN_AVG ? "⚠ watch" : "✓";
  if (g.avg > FAIL_AVG) fails++;
  worst = Math.max(worst, g.avg);
  console.log(`  ${flag.padEnd(7)} ${g.label.padEnd(34)} avg ${g.avg.toFixed(1).padStart(5)}%  (${g.over.toFixed(0)}% of pairs >30%)`);
}
console.log(`${"=".repeat(64)}\n  worst group avg ${worst.toFixed(1)}% · ${fails} group(s) over FAIL threshold`);
if (fails) { console.log(`  RESULT: FAIL — differentiate the flagged group(s) before scaling further.\n`); process.exit(1); }
console.log(`  RESULT: PASS — no group in the duplicate-wall zone.\n`);
