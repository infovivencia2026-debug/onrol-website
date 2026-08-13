/* =========================================================================
   ONROL — sitemap.xml generator.
   Merges the static marketing pages with the SPA's public SEO routes
   (pillar / persona / topic / geo pages) pulled straight from App.tsx, so
   the sitemap never drifts from the routes that actually ship.
   Run:  node scripts/gen-sitemap.mjs
   ========================================================================= */
import { readFileSync, writeFileSync, statSync } from "node:fs";

const ORIGIN = "https://onrol.in";
const BUILD_DATE = new Date().toISOString().slice(0, 10);

/* Real per-URL <lastmod>: use the mtime of the static HTML that backs a clean
   URL (public/*.html). SPA/prerendered routes have no public/*.html sibling at
   sitemap-gen time, so they fall back to the build date. A stale uniform date
   across every URL (the old hardcoded LASTMOD) dilutes the recrawl signal. */
function lastmodFor(u) {
  const clean = u.replace(/\/+$/, "") || "/";
  const file = clean === "/" ? "public/home-static.html" : `public/${clean.replace(/^\//, "")}.html`;
  try { return new Date(statSync(file).mtime).toISOString().slice(0, 10); }
  catch { return BUILD_DATE; }
}

/* Static marketing pages (clean URLs), excluding noindex (thank-you). */
const STATIC = [
  "/", "/about", "/programs", "/programs/ai", "/programs/cyber",
  "/programs/ai-generalist", "/programs/ai-architect", "/programs/aica", "/programs/cybersecurity",
  "/programs/soc-analyst", "/contact", "/mentors", "/questions", "/glossary",
  "/blog", "/tools/ai-skills-quiz", "/masterclass", "/cyber-masterclass/", "/why-now",
  "/ai-course-in-hyderabad", "/best-ai-institute-in-hyderabad",
  "/privacy-policy", "/terms-and-conditions",
];

/* Source of truth = the routes that actually get prerendered into crawlable
   HTML (scripts/prerender-routes.json). Using App.tsx alone missed the ~157
   individual blog posts + glossary terms (they're :slug routes there). We drop
   noindex / funnel / app / preview / redirect sections so the sitemap only
   advertises real, indexable content. */
const prerendered = JSON.parse(
  readFileSync("scripts/prerender-routes.json", "utf8"),
).routes;
const EXCLUDE =
  /^\/(admin|community|auth|task|learn|messenger|portal|preview|thanks|thank-you|survey|win|webinar|career-catalyst|apex|login|signup|feedback)(\/|$)|^\/landingpage\/|[:*]|-classic$/;
const spa = prerendered.filter(
  (r) => r.startsWith("/") && (r.replace(/\/+$/, "") || "/") !== "/" && !EXCLUDE.test(r),
);

/* priority heuristics */
function meta(u) {
  if (u === "/") return { p: "1.0", f: "daily" };
  if (/^\/programs\/(ai-generalist|ai-architect)$/.test(u)) return { p: "0.9", f: "weekly" };
  if (/^\/programs/.test(u) || u === "/cybersecurity" || u === "/soc-analyst") return { p: "0.9", f: "weekly" };
  if (/^\/(ai-course|best-ai|ai-institute|agentic|generative|ai-engineer|top-vibe|ai-automation|ai-for|academic|how-to-choose|ai-execution)/.test(u)) return { p: "0.8", f: "weekly" };
  if (/^\/blog/.test(u)) return { p: "0.7", f: "daily" };
  if (/^\/personas/.test(u)) return { p: "0.7", f: "weekly" };
  if (/^\/glossary\//.test(u)) return { p: "0.5", f: "monthly" };
  return { p: "0.6", f: "monthly" };
}

const staticSet = new Set(STATIC);
const urls = [...new Set([...STATIC, ...spa])];
// Emit each URL at its canonical 200 form so the sitemap contains no redirects:
//   • static "offline" pages serve 200 at the slashless URL (public/*.html);
//   • prerendered SPA routes are <route>/index.html directories, so 200 lives
//     at the trailing-slash URL (the slashless form 301s to it) — matching the
//     canonical baked into the prerendered HTML.
const canonicalLoc = (u) =>
  u === "/" || staticSet.has(u) ? u : u.endsWith("/") ? u : u + "/";
const body = urls
  .map((u) => {
    const { p, f } = meta(u);
    return `  <url>\n    <loc>${ORIGIN}${canonicalLoc(u)}</loc>\n    <lastmod>${lastmodFor(u)}</lastmod>\n    <changefreq>${f}</changefreq>\n    <priority>${p}</priority>\n  </url>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
writeFileSync("public/sitemap.xml", xml);
console.log(`sitemap.xml written — ${urls.length} URLs (${STATIC.length} static + ${spa.length} SPA)`);
