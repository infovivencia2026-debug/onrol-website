// Authenticated community page screenshots.
// Sign in via communitySupabase password auth, then capture each page at
// desktop + mobile widths. Used to QA the Discord-style redesign.

import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import puppeteer from "puppeteer";

const OUT_DIR = join(tmpdir().replace(/\\/g, "/"), "onrol-community");
const BASE = "https://onrol.in";

const ROUTES = [
  { name: "dashboard",     path: "/community/dashboard" },
  { name: "members",       path: "/community/members" },
  { name: "leaderboard",   path: "/community/leaderboard" },
  { name: "projects",      path: "/community/projects" },
  { name: "jobs",          path: "/community/jobs" },
  { name: "events",        path: "/community/events" },
  { name: "discussions",   path: "/community/discussions" },
  { name: "settings",      path: "/community/settings" },
  { name: "admin-webinar", path: "/community/admin/webinar" },
];

const WIDTHS = [
  { label: "desktop", w: 1440, h: 900 },
  { label: "mobile",  w: 390,  h: 844 },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const route of ROUTES) {
    for (const v of WIDTHS) {
      const page = await browser.newPage();
      try {
        await page.setViewport({ width: v.w, height: v.h, deviceScaleFactor: 2, isMobile: v.w < 768, hasTouch: v.w < 768 });
        const url = `${BASE}${route.path}`;
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await new Promise((r) => setTimeout(r, 2200));
        const png = await page.screenshot({ fullPage: true, type: "png" });
        const out = join(OUT_DIR, `${route.name}-${v.label}.png`);
        await writeFile(out, png);
        console.log(`[ss] ${route.name}-${v.label} → ${Math.round(png.length / 1024)} KB`);
      } catch (err) {
        console.error(`[ss] FAIL ${route.name}-${v.label}: ${err.message}`);
      } finally {
        await page.close();
      }
    }
  }
  await browser.close();
  console.log(`\n[ss] done. screenshots → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
