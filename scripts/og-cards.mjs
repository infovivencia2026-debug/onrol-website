// Generate Open Graph cards (1200×630 PNG) for ONROL.
// One card per content category — used as og:image fallback by SEO.tsx.
// Runs after the build, writes to dist/og/*.png.
//
// Why category-level (not per-page): keeps build time bounded and gives each
// content type a distinct visual identity in social/AI citations without the
// complexity of headless browser rendering per route.

import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const OUT_DIR = join(process.cwd(), "dist", "og");

const CARDS = [
  {
    file: "default.png",
    eyebrow: "India's AI Execution School",
    title: "Stop consuming AI. Start building with it.",
    accent: "#FF6B47",
  },
  {
    file: "blog.png",
    eyebrow: "ONROL Blog",
    title: "Practical AI playbooks for India.",
    accent: "#FF6B47",
  },
  {
    file: "glossary.png",
    eyebrow: "ONROL AI Glossary",
    title: "Every AI term that matters, in plain English.",
    accent: "#22D3EE",
  },
  {
    file: "programs.png",
    eyebrow: "ONROL Programs",
    title: "5 days. 3 deployable AI projects. One execution path.",
    accent: "#FB923C",
  },
  {
    file: "apex.png", // legacy filename — referenced from many SEO blocks
    eyebrow: "ONROL Community",
    title: "Daily AI updates, free, by category.",
    accent: "#22D3EE",
  },
  {
    file: "community.png",
    eyebrow: "ONROL Community",
    title: "Daily AI updates, free, by category.",
    accent: "#22D3EE",
  },
  {
    file: "tools.png",
    eyebrow: "ONROL Tools",
    title: "100+ AI tools, mapped to the 5-day curriculum.",
    accent: "#A78BFA",
  },
];

function svgFor({ eyebrow, title, accent }) {
  // 1200×630, dark navy bg, orange accent strip on left, brand wordmark bottom-right.
  const safeTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const safeEyebrow = eyebrow.toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#070F1F"/>
      <stop offset="55%" stop-color="#0A1628"/>
      <stop offset="100%" stop-color="#08152A"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.18" cy="0.15" r="0.55">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect x="0" y="0" width="6" height="630" fill="${accent}"/>
  <g font-family="Inter, system-ui, sans-serif" fill="#FFFFFF">
    <text x="80" y="170" font-size="22" font-weight="700" letter-spacing="6" fill="${accent}">${safeEyebrow}</text>
    <foreignObject x="80" y="210" width="1040" height="320">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Inter,system-ui,sans-serif;font-size:78px;font-weight:800;line-height:1.05;letter-spacing:-0.025em;color:#FFFFFF;">${safeTitle}</div>
    </foreignObject>
    <text x="80" y="570" font-size="20" font-weight="700" letter-spacing="3" fill="#94A3B8">ONROL.IN</text>
    <text x="1120" y="570" font-size="20" font-weight="800" letter-spacing="-1" text-anchor="end" fill="${accent}">onrol</text>
  </g>
</svg>`;
}

// ── Per-page OG generator ─────────────────────────────────────────────────
// Walks prerendered HTML files in dist/, extracts <title>, generates a
// custom OG card per page. Falls back to category cards above when the
// page hasn't been prerendered or has no extractable title.
//
// Card filename convention: dist/og/<slug>.png where <slug> is the URL path
// with slashes replaced by `--` (e.g. /personas/engineers/ → personas--engineers.png).
// SEO.tsx derives the same slug at runtime so it can reference the image.

import { readFile, readdir } from "node:fs/promises";

async function* walkHtml(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkHtml(full);
    } else if (entry.name === "index.html") {
      yield full;
    }
  }
}

const DIST_ROOT = join(process.cwd(), "dist");

function pathToSlug(relPath) {
  // dist/personas/engineers/index.html → personas--engineers
  // dist/index.html → home
  const parts = relPath.split(/[\\/]/).filter((p) => p && p !== "index.html");
  if (parts.length === 0) return "home";
  return parts.join("--");
}

// Eyebrow + accent inferred from URL path prefix.
function inferStyle(relPath) {
  const lower = relPath.toLowerCase().replace(/\\/g, "/");
  if (lower.startsWith("personas/")) return { eyebrow: "ONROL Personas", accent: "#22D3EE" };
  if (lower.startsWith("blog/")) return { eyebrow: "ONROL Blog", accent: "#FB923C" };
  if (lower.startsWith("glossary/")) return { eyebrow: "ONROL Glossary", accent: "#A78BFA" };
  if (lower.startsWith("programs/")) return { eyebrow: "ONROL Programs", accent: "#FB923C" };
  if (lower.startsWith("community/")) return { eyebrow: "ONROL Community", accent: "#22D3EE" };
  if (lower.startsWith("ai-institute-")) return { eyebrow: "ONROL · By City", accent: "#60A5FA" };
  if (lower.startsWith("ai-course-for-")) return { eyebrow: "ONROL · By Audience", accent: "#34D399" };
  if (lower.startsWith("best-ai-") || lower.startsWith("top-")) return { eyebrow: "ONROL · India", accent: "#FB923C" };
  if (lower.startsWith("how-to-")) return { eyebrow: "ONROL Guide", accent: "#F472B6" };
  return { eyebrow: "India's AI Execution School", accent: "#FF6B47" };
}

function extractTitle(html) {
  // Prefer og:title; fall back to <title>.
  const og = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (og) return og[1];
  const t = html.match(/<title>([^<]+)<\/title>/i);
  if (t) return t[1].split("|")[0].split(" — ")[0].trim();
  return null;
}

async function generatePerPageCards() {
  let written = 0;
  for await (const file of walkHtml(DIST_ROOT)) {
    const rel = file.slice(DIST_ROOT.length + 1);
    if (rel === "index.html") {
      // Home page already has /og/default.png; skip to avoid overwriting.
      continue;
    }
    try {
      const html = await readFile(file, "utf-8");
      const title = extractTitle(html);
      if (!title) continue;
      const slug = pathToSlug(rel);
      const { eyebrow, accent } = inferStyle(rel);
      const svg = svgFor({ eyebrow, title, accent });
      const png = await sharp(Buffer.from(svg)).png().toBuffer();
      await writeFile(join(OUT_DIR, `${slug}.png`), png);
      written++;
    } catch (e) {
      console.warn(`[og] skipped ${rel}: ${e.message}`);
    }
  }
  console.log(`[og] generated ${written} per-page cards.`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  // 1. Generic category cards (kept for backwards-compat fallbacks).
  for (const card of CARDS) {
    const svg = svgFor(card);
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    await writeFile(join(OUT_DIR, card.file), png);
    console.log(`[og] wrote /og/${card.file}`);
  }
  console.log(`[og] generated ${CARDS.length} category cards.`);
  // 2. Per-page cards from prerendered HTML.
  await generatePerPageCards();
}

main().catch((err) => {
  console.error("[og] failed:", err);
  process.exit(1);
});
