/* =========================================================================
   ONROL — incremental deploy for programmatic SEO pages.

   Regenerates the SEO pages (no browser), diffs the content-hash manifest
   against what was last deployed, and uploads ONLY the pages that changed —
   no vite build, no Puppeteer prerender, no web-root wipe. Then merges the new
   URLs into public/sitemap.xml, uploads it, and pings IndexNow for the changed
   URLs only.

   Run:  node scripts/deploy-seo.mjs
   Env:  SEO_SSH (default "onrol"), SEO_WEBROOT (default /home/onrol.in/public_html)
   ========================================================================= */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import https from "node:https";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://onrol.in";
const SSH = process.env.SEO_SSH || "onrol";
const WEBROOT = process.env.SEO_WEBROOT || "/home/onrol.in/public_html";
const KEY = "25975b8a29e14c0a90e825eb021b4670";
const sh = (cmd) => execSync(cmd, { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();

const t0 = Date.now();

/* 1. regenerate (fast, no browser) */
console.log(sh("node scripts/gen-seo.mjs"));
const manifest = JSON.parse(readFileSync(resolve(ROOT, "data/.seo-manifest.json"), "utf8"));

/* 2. diff against last-deployed manifest */
const deployedPath = resolve(ROOT, "data/.seo-deployed.json");
const deployed = existsSync(deployedPath) ? JSON.parse(readFileSync(deployedPath, "utf8")) : {};
const changed = Object.keys(manifest).filter((slug) => manifest[slug] !== deployed[slug]);
const catalog = JSON.parse(readFileSync(resolve(ROOT, "data/seo-catalog.json"), "utf8"));
let allPages = catalog.pages;
try { const gen = JSON.parse(readFileSync(resolve(ROOT, "data/cross-generated.json"), "utf8")).pages; if (Array.isArray(gen)) allPages = allPages.concat(gen); } catch {}
const allUrls = allPages.map((p) => `${ORIGIN}/${p.slug}/`);

if (!changed.length) {
  console.log("deploy-seo: nothing changed — 0 files uploaded.");
  process.exit(0);
}
console.log(`deploy-seo: ${changed.length} changed page(s): ${changed.join(", ")}`);

/* 3. upload ONLY changed files via a single tarball (robust for large waves —
   many files as scp/ssh args blow the Windows ~8KB command-line limit). Stage
   the changed <slug>/index.html files, tar once, extract remotely. */
const stage = resolve(ROOT, ".deploy-seo-tmp");
rmSync(stage, { recursive: true, force: true });
for (const slug of changed) {
  const dst = resolve(stage, slug);
  mkdirSync(dst, { recursive: true });
  copyFileSync(resolve(ROOT, "public", slug, "index.html"), resolve(dst, "index.html"));
}
// Relative paths only in shell commands — Git Bash's GNU tar reads a "C:\" as a
// remote host:path. sh() runs from the project root.
sh(`tar -czf .deploy-seo.tgz -C .deploy-seo-tmp .`);
const remoteTgz = `/tmp/onrol-seo-${Date.now()}.tgz`;
sh(`scp -O .deploy-seo.tgz ${SSH}:"${remoteTgz}"`);
sh(`ssh ${SSH} "mkdir -p '${WEBROOT}' && tar -xzf ${remoteTgz} -C '${WEBROOT}' && rm -f ${remoteTgz}"`);
rmSync(stage, { recursive: true, force: true });
rmSync(resolve(ROOT, ".deploy-seo.tgz"), { force: true });
for (const slug of changed) console.log(`  ↑ /${slug}/`);

/* 4. merge changed URLs into public/sitemap.xml + upload */
let sm = readFileSync(resolve(ROOT, "public/sitemap.xml"), "utf8");
const today = new Date().toISOString().slice(0, 10);
let added = 0;
for (const url of allUrls) {
  if (!sm.includes(`<loc>${url}</loc>`)) {
    const entry = `  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    sm = sm.replace("</urlset>", entry + "</urlset>");
    added++;
  }
}
if (added) { writeFileSync(resolve(ROOT, "public/sitemap.xml"), sm); }
sh(`scp -O "public/sitemap.xml" ${SSH}:"${WEBROOT}/sitemap.xml"`);
console.log(`  ↑ sitemap.xml (${added} new URL${added === 1 ? "" : "s"})`);

/* 5. ping IndexNow for the changed URLs only */
const changedUrls = changed.map((s) => `${ORIGIN}/${s}/`);
await new Promise((res) => {
  const body = JSON.stringify({ host: "onrol.in", key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList: changedUrls });
  const req = https.request("https://api.indexnow.org/indexnow", { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
    (r) => { console.log(`  IndexNow: HTTP ${r.statusCode} for ${changedUrls.length} URL(s)`); r.resume(); r.on("end", res); });
  req.on("error", (e) => { console.log(`  IndexNow: skipped (${e.message})`); res(); });
  req.write(body); req.end();
});

/* 6. record what we deployed */
writeFileSync(deployedPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`deploy-seo: done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
