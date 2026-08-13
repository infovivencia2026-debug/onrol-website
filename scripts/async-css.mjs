// Postbuild: inline the main CSS into every prerendered HTML <head> as a
// <style> block, then remove the external <link rel="stylesheet">.
//
// On Slow 4G this kills the remaining ~750-1000ms render-blocking
// round-trip — the previous async-load approach still had a brief
// blocking window before the stylesheet swapped in. Inlining trades
// ~40KB of HTML per file against eliminating one network request +
// the FOUC.
//
// Trade-off: repeat visits lose the shared CSS cache (every HTML now
// embeds its own copy). Lighthouse measures first-visit only, so we
// score better; real users on repeat visits cache the HTML response
// itself (we set short Cache-Control on HTML but most users will have
// it indexed in browser cache for the session).

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const DIST = resolve(process.cwd(), "dist");

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (entry === "index.html") out.push(p);
  }
  return out;
}

const files = walk(DIST);

// First file: find the CSS path + read it. We assume a single main CSS
// chunk (Vite's default for non-route-split CSS).
let cssContent = null;
let cssHref = null;

const RE = /<link\s+rel="(?:stylesheet|preload)"(?:\s+as="style")?\s+(?:crossorigin(?:="[^"]*")?\s+)?href="(\/assets\/[^"]+\.css)"[^>]*>/;

for (const f of files) {
  const html = readFileSync(f, "utf-8");
  const m = html.match(RE);
  if (m) {
    cssHref = m[1];
    const cssPath = join(DIST, cssHref.replace(/^\//, ""));
    cssContent = readFileSync(cssPath, "utf-8");
    break;
  }
}

// Note: do NOT exit here even if CSS is already inlined — we still
// need the strip-modulepreloads pass at the bottom of this script
// to run on every build.
const skipInline = !cssContent || !cssHref;
if (skipInline) {
  console.log("[inline-css] CSS already inlined (or none found) — skipping inline step, running preload strip only");
}

let touched = 0;
if (!skipInline) {
  // Inline the full main CSS into every HTML's <head>. Trade-off:
  //   - bigger HTML download (~470KB raw, ~58KB gzip)
  //   - parser pays a one-time CSS-parse cost before first paint
  // BUT in exchange we get:
  //   - zero FOUC (no visible re-style flash)
  //   - zero CLS from style-arrival reshape
  //   - exactly one round-trip to render
  // We tried deferred-CSS for a 90→92 LCP win, but it produced a
  // very visible "site loads then refreshes" flash the founder
  // flagged, AND introduced 0.131 CLS. Inline is the better UX
  // trade even if the perf score lands a point or two lower.
  const cssBytes = cssContent.length;
  const inlineTag = `<style>${cssContent}</style>`;

  const LINK_RE = new RegExp(
    `<link\\s+rel="(?:stylesheet|preload)"(?:\\s+as="style")?\\s+(?:crossorigin(?:="[^"]*")?\\s+)?href="${cssHref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>(?:<noscript>[^<]*<link[^>]*></noscript>)?`,
    "g",
  );

  for (const f of files) {
    const src = readFileSync(f, "utf-8");
    if (!LINK_RE.test(src)) continue;
    LINK_RE.lastIndex = 0;
    const replaced = src.replace(LINK_RE, inlineTag);
    if (replaced !== src) {
      writeFileSync(f, replaced, "utf-8");
      touched++;
    }
  }

  console.log(`[inline-css] inlined ${Math.round(cssBytes / 1024)}KB CSS into ${touched}/${files.length} files`);
}

// ── Strip stale modulepreload hints for chunks that are only reachable
// through dynamic import (vendor-supabase, vendor-ui, vendor-charts,
// vendor-xlsx). Vite emits modulepreload for them anyway as a "make
// dynamic imports faster" optimisation, but Lighthouse counts those
// bytes as render-blocking + unused on first paint of marketing routes
// that never need them. The chunks still load on-demand when a route
// actually imports them — we only remove the proactive preload hint.
const STRIPPABLE = ["vendor-supabase", "vendor-ui", "vendor-charts", "vendor-xlsx"];
const PRELOAD_RE = new RegExp(
  `\\s*<link\\s+rel="modulepreload"[^>]*href="\\/assets\\/(?:${STRIPPABLE.join("|")})-[^"]+"[^>]*>`,
  "g",
);
let stripped = 0;
for (const f of files) {
  const src = readFileSync(f, "utf-8");
  if (!PRELOAD_RE.test(src)) continue;
  PRELOAD_RE.lastIndex = 0;
  const next = src.replace(PRELOAD_RE, "");
  if (next !== src) {
    writeFileSync(f, next, "utf-8");
    stripped++;
  }
}
console.log(`[inline-css] stripped vendor-supabase/ui/charts/xlsx modulepreloads from ${stripped} files`);

// ── Strip the baked-in render-blocking font <link>s that Puppeteer
// captures AFTER the JS-injected font loader's onload swap fires.
//
// The font loader in index.html intentionally appends each font link
// with media="print" then swaps to media="all" onload — the standard
// non-blocking pattern. Puppeteer runs the page to completion before
// snapshotting, so by the time it captures HTML, both Inter and
// Manrope <link>s carry media="all" and become render-blocking for
// real visitors loading the prerendered HTML.
//
// Without this strip:
//   - Inter <link href="/fonts/inter.css" media="all">         → ~260ms FCP cost
//   - Manrope <link href="fonts.googleapis.com/css2?..." media="all">
//     → ~1-2s FCP cost on Slow 4G (3rd-party CDN roundtrip)
//
// We leave the original loader script in index.html alone — every
// fresh client load will still JS-inject the deferred font load
// (with media="print" → swap to "all" on its own onload). The
// stripped HTML serves a cleaner critical path while real users
// get the right font ~100ms after first paint.
const FONT_LINK_PATTERNS = [
  // Inter — self-hosted
  /\s*<link\s+rel="stylesheet"\s+href="\/fonts\/inter\.css"[^>]*>/g,
  // Manrope — Google Fonts (any weight set / display value). Matches
  // both the unescaped & and the HTML-escaped &amp; in the query string.
  /\s*<link\s+rel="stylesheet"\s+href="https:\/\/fonts\.googleapis\.com\/css2\?family=Manrope[^"]*"[^>]*>/g,
];
let fontStripped = 0;
for (const f of files) {
  const src = readFileSync(f, "utf-8");
  let next = src;
  for (const RE of FONT_LINK_PATTERNS) {
    RE.lastIndex = 0;
    next = next.replace(RE, "");
  }
  if (next !== src) {
    writeFileSync(f, next, "utf-8");
    fontStripped++;
  }
}
console.log(`[inline-css] stripped baked render-blocking inter.css + Manrope <link>s from ${fontStripped} files`);

// ── Also strip any empty <link rel="stylesheet"> tags. These appear
// when a noscript fallback or a buggy injection leaves a tag with no
// href attribute — harmless visually but Lighthouse audits flag them
// and they confuse some CDN HTML minifiers.
const EMPTY_LINK_RE = /\s*<link\s+rel="stylesheet"\s*>/g;
let emptyStripped = 0;
for (const f of files) {
  const src = readFileSync(f, "utf-8");
  if (!EMPTY_LINK_RE.test(src)) continue;
  EMPTY_LINK_RE.lastIndex = 0;
  const next = src.replace(EMPTY_LINK_RE, "");
  if (next !== src) {
    writeFileSync(f, next, "utf-8");
    emptyStripped++;
  }
}
console.log(`[inline-css] stripped empty <link rel="stylesheet"> from ${emptyStripped} files`);
