// Mobile screenshot audit harness.
// Boots `vite preview`, then takes full-page 375px screenshots of every
// route in the audit list so we can spot mobile layout breakage.
//
// Usage: node scripts/screenshot-mobile.mjs

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import puppeteer from "puppeteer";

const OUT_DIR = join(tmpdir().replace(/\\/g, "/"), "onrol-mobile");
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;

// Routes to audit. Each unique TEMPLATE only needs one route — fixes
// propagate to all sibling pages.
const ROUTES = [
  // Marketing core
  { name: "home", path: "/" },
  { name: "career-catalyst", path: "/career-catalyst/" },
  { name: "programs", path: "/programs" },
  { name: "program-ai-generalist", path: "/programs/ai-generalist" },
  { name: "events", path: "/events" },
  { name: "founder", path: "/founders/dr-neeraja-reddy" },
  { name: "about", path: "/about" },
  { name: "contact", path: "/contact" },
  { name: "questions", path: "/questions" },
  { name: "proof", path: "/proof" },
  { name: "why-now", path: "/why-now" },
  // Pillar templates (one each)
  { name: "pillar-best-ai-course", path: "/best-ai-course-in-india" },
  { name: "pillar-state", path: "/ai-institute-telangana" },
  { name: "pillar-city", path: "/ai-institute-hyderabad" },
  { name: "pillar-industry", path: "/ai-for-healthcare-india" },
  { name: "pillar-comparison", path: "/ai-institute-comparison-guide-india" },
  // Persona template
  { name: "personas-index", path: "/personas" },
  { name: "persona-students", path: "/personas/students" },
  // Blog template
  { name: "blog-index", path: "/blog" },
  { name: "blog-post", path: "/blog/best-ai-course-in-india-for-beginners" },
  // Glossary
  { name: "glossary-index", path: "/glossary" },
  { name: "glossary-term", path: "/glossary/llm" },
  // Community + tools
  { name: "community", path: "/community" },
  { name: "tools-quiz", path: "/tools/ai-skills-quiz" },
];

const WIDTH = 375;
const HEIGHT = 812; // iPhone X-ish

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch { /* not yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`server didn't come up at ${url}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`[ss] starting vite preview on :${PORT}`);
  const server = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });
  server.stderr.on("data", (d) => process.stderr.write(`[vite!] ${d}`));

  const failures = [];
  try {
    await waitForServer(BASE);
    console.log(`[ss] server up`);

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    for (const { name, path } of ROUTES) {
      const url = `${BASE}${path}`;
      try {
        const page = await browser.newPage();
        await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        // domcontentloaded is faster + more reliable than networkidle0 for SPAs
        // (lazy-loaded chunks keep the network busy past actual paint).
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
        // Settle for animations + lazy-loaded chunks.
        await new Promise((r) => setTimeout(r, 1800));
        const png = await page.screenshot({ fullPage: true, type: "png" });
        const out = join(OUT_DIR, `${name}-${WIDTH}.png`);
        await writeFile(out, png);
        const sizeKb = Math.round(png.length / 1024);
        console.log(`[ss] ${name.padEnd(28)} ${path.padEnd(48)} ${String(sizeKb).padStart(5)} KB`);
        await page.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[ss] FAIL ${name} (${path}) — ${msg}`);
        failures.push({ name, path, error: msg });
      }
    }

    await browser.close();
  } finally {
    console.log(`[ss] killing vite preview`);
    server.kill();
  }

  if (failures.length) {
    console.log(`\n[ss] ${failures.length} routes failed:`);
    failures.forEach((f) => console.log(`  - ${f.name} (${f.path}): ${f.error.slice(0, 80)}`));
  }
  console.log(`\n[ss] done. screenshots → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
