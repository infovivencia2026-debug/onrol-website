// Post-build prerender pass — turns the Vite SPA into static HTML for the
// marketing routes so AI crawlers (ChatGPT, Perplexity, Claude, Bing Copilot)
// can read full-content pages without executing JavaScript.
//
// Usage: invoked automatically by `npm run build` via the `postbuild` hook.
// Safely no-ops if Puppeteer isn't installed (dev/CI fallback).
//
// Add new routes to scripts/prerender-routes.json — no other code change
// needed. Community / admin / dynamic routes stay client-rendered.
//
// Parallelism: PRERENDER_CONCURRENCY env var (default 4) controls how many
// pages render simultaneously in one Puppeteer browser. 4 tabs gives ~3.5×
// speedup over serial without overloading typical dev machines or VPS CI.
// Push higher (8 or 16) if you've got cores + RAM to spare; drop to 1 to
// force the legacy serial path.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import handler from "serve-handler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const DIST = resolve(ROOT, "dist");

const CONCURRENCY = Math.max(1, parseInt(process.env.PRERENDER_CONCURRENCY || "4", 10));

let puppeteer;
try {
  puppeteer = (await import("puppeteer")).default;
} catch {
  console.log("[prerender] puppeteer not installed — skipping prerender pass.");
  console.log("           install with: npm i -D puppeteer");
  process.exit(0);
}

if (!existsSync(DIST)) {
  console.error("[prerender] dist/ missing — run `vite build` first.");
  process.exit(1);
}

const allRoutes = JSON.parse(
  readFileSync(resolve(ROOT, "scripts/prerender-routes.json"), "utf-8"),
).routes;

// Routes served by the static "offline" marketing pages (public/*.html, built
// by scripts/gen-static-pages.mjs). Prerendering these is HARMFUL:
//   • a generated <route>/index.html directory would shadow the static file
//     (LiteSpeed resolves the dir before the sibling .html), replacing the
//     hand-built offline design with the React version;
//   • prerendering "/" overwrites dist/index.html — the SPA shell that every
//     client-rendered route + the SPA fallback depend on.
// So we skip them; only the ~249 SPA-only routes (geo/persona/topic/pillar/
// blog/glossary sub-pages) get prerendered into crawlable HTML.
// Only "/" is kept SPA-shell (prerendering it would overwrite dist/index.html,
// the shell every client-rendered route + the SPA fallback depend on). Every
// other marketing route is now prerendered so it ships the current (new "vs")
// design as crawlable HTML — the prerendered <route>/index.html shadows any
// sibling static .html (LiteSpeed resolves the dir first), which is now the
// desired behaviour since the offline static pages carry the older design.
// Nothing is skipped anymore. "/" IS prerendered, but written to home-static.html
// (the file the OLS vhost serves for "/") instead of index.html — so the SPA shell
// at index.html stays intact for the client-side fallback. See renderRoute.
const STATIC_ROUTES = new Set([]);
// Marketing routes whose clean URL the OLS vhost resolves to a sibling <route>.html
// (not <route>/index.html). For these we ALSO overwrite dist/<route>.html with the
// prerendered new-design HTML, so it wins over the older gen-static-pages output on
// a full deploy. Everything else is served as <route>/index.html.
const MARKETING_HTML = new Set([
  "/about", "/programs", "/programs/ai", "/programs/cyber", "/programs/aica",
  "/programs/ai-generalist", "/programs/ai-architect", "/programs/cybersecurity",
  "/programs/soc-analyst", "/contact", "/mentors", "/questions", "/glossary",
  "/blog", "/tools/ai-skills-quiz", "/masterclass", "/why-now",
  "/ai-course-in-hyderabad", "/best-ai-institute-in-hyderabad",
  "/privacy-policy", "/terms-and-conditions", "/thank-you",
]);
const routes = allRoutes.filter((r) => !STATIC_ROUTES.has(r.replace(/\/+$/, "") || "/"));
console.log(`[prerender] ${routes.length} SPA routes (skipped ${allRoutes.length - routes.length} static-served routes)`);

// ── 1. Spin up a tiny static server pointing at dist/ ────────────────────────
// SPA fallback so React Router routes resolve when Puppeteer visits them.
// Without this, /programs returns serve-handler's 404 page and the prerender
// captures a near-empty stub (1.6KB) instead of the rendered route.
const server = http.createServer((req, res) =>
  handler(req, res, {
    public: DIST,
    rewrites: [{ source: "**", destination: "/index.html" }],
  }),
);
const port = await new Promise((resolveP) => {
  server.listen(0, "127.0.0.1", () => resolveP(server.address().port));
});
const base = `http://127.0.0.1:${port}`;
console.log(`[prerender] static server live on ${base}`);
console.log(`[prerender] concurrency = ${CONCURRENCY} (override with PRERENDER_CONCURRENCY)`);

// ── 2. Launch headless Chrome ────────────────────────────────────────────────
const browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  // Fall back to a system browser when puppeteer's bundled Chrome isn't installed.
  ...(process.env.PUPPETEER_EXECUTABLE_PATH
    ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
    : {}),
});

// Per-route work — extracted so it can run in parallel across pages.
async function renderRoute(page, route) {
  const url = `${base}${route}`;
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    // Give React Router + framer-motion + SEO useEffect-injected JSON-LD
    // scripts time to land so the rendered DOM mirrors what a real visitor
    // sees. 600ms was too short for some pillar pages (LocalBusiness schema
    // was missing from the prerendered HTML).
    await new Promise((r) => setTimeout(r, 1200));

    // Scroll the page top-to-bottom so every framer-motion whileInView
    // animation fires. Without this, sections below the fold ship with
    // their initial opacity:0 / transform baked into HTML — and if the
    // visitor's JS bundle is slow to load they see a "blank" page until
    // React hydrates. Scrolling makes the prerendered DOM ship with
    // opacity:1 / final-state styles, so the page is readable even
    // before hydration completes.
    await page.evaluate(async () => {
      const h = document.documentElement.scrollHeight;
      const step = Math.max(200, Math.floor(window.innerHeight * 0.7));
      for (let y = 0; y <= h; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));
    });
    // Small settle window after scrolling so the last whileInView animations finish.
    await new Promise((r) => setTimeout(r, 400));

    const html = await page.content();

    // Write to <route>/index.html (or root index.html for "/")
    if (route === "/") {
      // "/" is served by home-static.html; index.html stays the untouched SPA shell.
      writeFileSync(resolve(DIST, "home-static.html"), html, "utf-8");
    } else {
      const outDir = resolve(DIST, route.replace(/^\//, ""));
      if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, "index.html"), html, "utf-8");
      // For vhost-.html marketing routes, also overwrite the sibling static file
      // so the new design survives a full deploy (see MARKETING_HTML above).
      if (MARKETING_HTML.has(route.replace(/\/+$/, "") || "/")) {
        writeFileSync(resolve(DIST, `${route.replace(/^\//, "")}.html`), html, "utf-8");
      }
    }
    return { route, ok: true };
  } catch (err) {
    return { route, ok: false, error: err.message };
  }
}

// ── 3. Worker-pool: N parallel pages process the route queue ────────────────
// Each worker grabs the next route, renders it, and reports. Workers share
// one Puppeteer browser process; each owns its own page (tab). 4 workers
// on a typical dev box gives ~3.5× speedup with negligible CPU contention.
let success = 0;
let failed = 0;
let nextIndex = 0;
const total = routes.length;
const startTime = Date.now();

async function spawnWorker(workerId) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  while (true) {
    const i = nextIndex++;
    if (i >= total) break;
    const route = routes[i];
    const result = await renderRoute(page, route);
    if (result.ok) {
      success++;
      console.log(`[prerender] ✓ ${route}  (${success + failed}/${total})`);
    } else {
      failed++;
      console.warn(`[prerender] ✗ ${route} — ${result.error}`);
    }
  }
  await page.close();
}

await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, total) }, (_, i) => spawnWorker(i)),
);

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`[prerender] done — ${success} ok, ${failed} failed in ${elapsed}s.`);

await browser.close();
server.close();
if (failed === total) process.exit(1); // ALL failed = real problem
