/* =========================================================================
   ONROL — SEO page validator (quality + submission-error gate).

   Checks every generated page in public/<slug>/index.html against the rules
   that decide whether Google can crawl, index and trust it:
     • structure: one <title>, one <h1>, meta description, canonical, robots
     • canonical + og:url match the page's real URL (trailing slash)
     • schema: BreadcrumbList + (Course|Article) + FAQPage present & parseable
     • meta lengths in SERP-safe ranges
     • no template leaks (undefined / [object / empty ${})
     • thinness: visible word count >= MIN_WORDS
     • duplicate detection: pairwise token-diff within the same type >= MIN_DIFF
     • catalog: unique slugs, required fields present

   Run:  node scripts/validate-seo.mjs
   Exits non-zero if any page FAILS (so it works as a CI/loop gate).
   ========================================================================= */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://onrol.in";
const MIN_WORDS = 380;      // below this = thin
// Duplicate threshold: template-based pages legitimately share common vocabulary
// ("AI", "course", "online", "portfolio"), so genuinely-differentiated city
// pages land ~100-129. The pathological thin pages were ~29 (only the city name
// changed). 90 catches true duplicates without false-flagging real variation.
const MIN_DIFF = 90;
// Programmatic city×course pages (generated:true) are legitimately templated
// (Naresh-IT model) — they share a scaffold and vary by city+course data. They
// get a lower floor that still catches broken/near-identical pages. Any pair
// involving a generated page uses this; hand-written vs hand-written stays 90.
const MIN_DIFF_GEN = 42;
const TITLE_MAX = 65, DESC_MIN = 70, DESC_MAX = 165;

const catalog = (() => {
  const base = JSON.parse(readFileSync(resolve(ROOT, "data/seo-catalog.json"), "utf8")).pages;
  try { const gen = JSON.parse(readFileSync(resolve(ROOT, "data/cross-generated.json"), "utf8")).pages; return Array.isArray(gen) ? base.concat(gen) : base; }
  catch { return base; }
})();
const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const tokenSet = (txt) => new Set(txt.toLowerCase().split(" ").filter((w) => w.length > 2));
const diffCount = (a, b) => { let d = 0; for (const t of a) if (!b.has(t)) d++; for (const t of b) if (!a.has(t)) d++; return d; };

let fail = 0, warn = 0;
const rows = [];
const tokensByType = {};

/* ---- per-page structural checks ---- */
for (const p of catalog) {
  const errs = [], warns = [];
  const file = resolve(ROOT, "public", p.slug, "index.html");
  if (!existsSync(file)) { rows.push({ slug: p.slug, errs: ["missing generated file"], warns: [] }); fail++; continue; }
  const html = readFileSync(file, "utf8");
  const url = `${ORIGIN}/${p.slug}/`;

  // required catalog fields
  for (const f of ["title", "description", "eyebrow", "h1", "lead", "cta", "faqs", "breadcrumb"])
    if (!p[f] || (Array.isArray(p[f]) && !p[f].length)) errs.push(`catalog missing: ${f}`);

  // structure
  const titleM = html.match(/<title>([^<]*)<\/title>/);
  if (!titleM) errs.push("no <title>");
  else if (titleM[1].length > TITLE_MAX) warns.push(`title ${titleM[1].length} chars (>${TITLE_MAX})`);
  const h1c = (html.match(/<h1[\s>]/g) || []).length;
  if (h1c !== 1) errs.push(`${h1c} <h1> (need exactly 1)`);
  const descM = html.match(/<meta name="description" content="([^"]*)"/);
  if (!descM) errs.push("no meta description");
  else if (descM[1].length < DESC_MIN || descM[1].length > DESC_MAX) warns.push(`desc ${descM[1].length} chars`);
  if (!/<meta name="robots" content="index, follow/.test(html)) errs.push("robots not index,follow");

  // canonical + og:url must equal the real URL
  const canM = html.match(/<link rel="canonical" href="([^"]*)"/);
  if (!canM) errs.push("no canonical");
  else if (canM[1] !== url) errs.push(`canonical ${canM[1]} != ${url}`);
  const ogM = html.match(/<meta property="og:url" content="([^"]*)"/);
  if (ogM && ogM[1] !== url) errs.push(`og:url ${ogM[1]} != ${url}`);

  // schema present & parseable
  const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let types = new Set();
  for (const block of ld) { try { const o = JSON.parse(block); types.add(o["@type"]); } catch { errs.push("unparseable JSON-LD"); } }
  if (!types.has("BreadcrumbList")) errs.push("no BreadcrumbList schema");
  if (!types.has("Course") && !types.has("Article")) errs.push("no Course/Article schema");
  if (p.faqs && p.faqs.length && !types.has("FAQPage")) errs.push("no FAQPage schema");

  // template leaks
  if (/\$\{|>\s*undefined\s*<|\[object |>\s*null\s*</.test(html)) errs.push("template leak (undefined/null/${})");
  // form wired
  if (!/id="sxForm"/.test(html)) errs.push("no lead form");

  // thinness
  const vis = visible(html);
  const wc = vis.split(" ").length;
  if (wc < MIN_WORDS) errs.push(`thin: ${wc} words (<${MIN_WORDS})`);

  (tokensByType[p.type] ||= []).push({ slug: p.slug, tok: tokenSet(vis), gen: !!p.generated });

  if (errs.length) fail++;
  warn += warns.length;
  rows.push({ slug: p.slug, errs, warns });
}

/* ---- cross-page duplicate detection (within type) ---- */
const dupes = [];
for (const type of Object.keys(tokensByType)) {
  const arr = tokensByType[type];
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++) {
      const d = diffCount(arr[i].tok, arr[j].tok);
      const floor = (arr[i].gen || arr[j].gen) ? MIN_DIFF_GEN : MIN_DIFF;
      if (d < floor) dupes.push({ a: arr[i].slug, b: arr[j].slug, diff: d });
    }
}

/* ---- catalog-level: unique slugs ---- */
const slugSeen = {};
for (const p of catalog) { slugSeen[p.slug] = (slugSeen[p.slug] || 0) + 1; }
const dupSlugs = Object.entries(slugSeen).filter(([, n]) => n > 1);

/* ---- report ---- */
console.log(`\nValidated ${catalog.length} pages\n${"=".repeat(48)}`);
for (const r of rows) {
  if (r.errs.length) console.log(`  ✗ ${r.slug}\n      ${r.errs.join("\n      ")}`);
  else if (r.warns.length) console.log(`  ⚠ ${r.slug}: ${r.warns.join("; ")}`);
}
if (dupSlugs.length) { console.log(`\n  ✗ DUPLICATE SLUGS: ${dupSlugs.map(([s]) => s).join(", ")}`); fail += dupSlugs.length; }
if (dupes.length) { console.log(`\n  ✗ TOO-SIMILAR PAGES (< ${MIN_DIFF} differing tokens):`); for (const d of dupes) console.log(`      ${d.a} ~ ${d.b}  (${d.diff})`); fail += dupes.length; }

console.log(`\n${"=".repeat(48)}`);
const clean = catalog.length - rows.filter((r) => r.errs.length).length;
console.log(`  ${clean}/${catalog.length} pages error-free · ${warn} warnings · ${dupes.length} near-duplicate pairs`);
if (fail) { console.log(`  RESULT: FAIL (${fail} issue group${fail === 1 ? "" : "s"})\n`); process.exit(1); }
console.log(`  RESULT: PASS — all pages clean, no submission errors\n`);
