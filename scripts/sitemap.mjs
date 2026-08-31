// Sitemap generator. Runs as part of `npm run build` (postbuild).
// Source of truth: scripts/sitemap-routes.json
//
// Output:
//   dist/sitemap-index.xml   — entry point; points to per-section sitemaps below
//   dist/sitemap-pages.xml   — home, /about, /contact, /apex, /why-now, /proof
//   dist/sitemap-programs.xml — /programs/*
//   dist/sitemap-blog.xml    — /blog/*
//   dist/sitemap-glossary.xml — /glossary/*
//   dist/sitemap-tools.xml   — /tools/*
//   dist/sitemap.xml         — thin stub that 301s to sitemap-index.xml at
//                              the server level. Kept on disk only so old
//                              GSC submissions don't 404 hard during the
//                              transition; the file is a single <sitemapindex>
//                              pointing to sitemap-index.xml so any crawler
//                              that still hits /sitemap.xml gets routed.
//
// Why split: every URL now lives in exactly ONE sitemap, so Google stops
// reporting "Alternate page with proper canonical tag" noise from URLs
// that previously appeared in both the flat /sitemap.xml AND a sharded
// per-section file. Large sitemaps also make Google + Bing slow to
// process; section sitemaps keep each file < 1MB and let crawlers
// prioritize categories.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");
const SITE = "https://onrol.in";

if (!existsSync(DIST)) mkdirSync(DIST, { recursive: true });

const cfg = JSON.parse(
  readFileSync(resolve(ROOT, "scripts/sitemap-routes.json"), "utf-8"),
);
const today = new Date().toISOString().slice(0, 10);

// Deterministic per-path lastmod: stagger across the last ~120 days based
// on a stable hash of the URL path. Without this, every URL in the
// sitemap shares `today` which Google reads as either spam or a real
// site-wide change, neither of which helps ranking. With this, each
// route has a stable date that changes only when we choose to (by
// bumping STAGGER_BASE).
//
// Routes referenced in `lastmodOverrides` get an explicit date (use for
// pages we actually edited today — e.g. /career-catalyst — so Google
// sees a fresh change signal where one really happened).
const STAGGER_BASE = new Date("2026-01-15T00:00:00Z").getTime();
const STAGGER_WINDOW_DAYS = 120; // Spread evenly over ~4 months
const lastmodOverrides = new Set([
  // Touch these to force "edited today" for genuinely-fresh pages.
  "/",
  "/career-catalyst",
  "/programs/aica",
  "/programs/ai-generalist",
  "/programs/ai-architect",
  "/ai-institute-hyderabad",
  "/best-ai-course-in-india",
  "/best-ai-institutes-in-india",
  "/best-ai-institutes-in-india/",
  "/community",
  "/community/",
  "/ai-generalist",
  "/ai-generalist/",
]);
function hashPath(p) {
  let h = 0;
  for (let i = 0; i < p.length; i++) h = ((h << 5) - h + p.charCodeAt(i)) >>> 0;
  return h;
}
function staggeredLastmod(path) {
  if (lastmodOverrides.has(path)) return today;
  const offsetDays = hashPath(path) % STAGGER_WINDOW_DAYS;
  const d = new Date(STAGGER_BASE + offsetDays * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}

function urlEntry({ path, priority = 0.7, changefreq = "weekly", lastmod }) {
  if (!lastmod) lastmod = staggeredLastmod(path);
  return `  <url>
    <loc>${SITE}${path}</loc>
    <xhtml:link rel="alternate" hreflang="en-IN" href="${SITE}${path}" />
    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${path}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function urlsetXml(routes) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${routes.map(urlEntry).join("\n")}
</urlset>
`;
}

// ── Section split ────────────────────────────────────────────────────────
const sectionFor = (path) => {
  if (path.startsWith("/blog/")) return "blog";
  if (path.startsWith("/glossary/")) return "glossary";
  if (path.startsWith("/programs/")) return "programs";
  if (path.startsWith("/tools/")) return "tools";
  return "pages";
};

const sections = { pages: [], programs: [], blog: [], glossary: [], tools: [] };
for (const route of cfg.routes) {
  sections[sectionFor(route.path)].push(route);
}

// Write per-section sitemaps. Each URL now lives in exactly one of these
// (pages, programs, blog, glossary, tools).
const sectionFiles = [];
for (const [name, routes] of Object.entries(sections)) {
  if (routes.length === 0) continue;
  const file = `sitemap-${name}.xml`;
  writeFileSync(resolve(DIST, file), urlsetXml(routes), "utf-8");
  sectionFiles.push(file);
}

// Sitemap index — points to every section sitemap. We deliberately do NOT
// list a flat /sitemap.xml here anymore; previously every URL appeared in
// both the flat file AND a sharded file, which was contributing to
// "Alternate page with proper canonical tag" noise in Search Console.
const indexEntries = sectionFiles
  .map(
    (f) => `  <sitemap>
    <loc>${SITE}/${f}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`,
  )
  .join("\n");

const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexEntries}
</sitemapindex>
`;

writeFileSync(resolve(DIST, "sitemap-index.xml"), index, "utf-8");

// Keep /sitemap.xml on disk as a sitemap-index pointer so old GSC
// submissions / hardcoded references don't 404 during transition. Any
// crawler that fetches it gets routed to the proper sitemap-index, then
// to the sharded section files. This file is intentionally minimal —
// it does NOT relist every URL.
const flatRedirectStub = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE}/sitemap-index.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>
`;
writeFileSync(resolve(DIST, "sitemap.xml"), flatRedirectStub, "utf-8");

console.log(
  `[sitemap] wrote ${sectionFiles.length} section sitemaps + sitemap-index.xml (sitemap.xml stub points to index; flat duplicates removed)`,
);
