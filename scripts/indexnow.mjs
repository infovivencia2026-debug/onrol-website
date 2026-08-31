// Submit ONROL's URLs to IndexNow (Bing, Yandex, Seznam, Naver in one shot).
//   https://www.indexnow.org/
//
// Usage:
//   node scripts/indexnow.mjs            # submits every URL in sitemap-routes.json
//   node scripts/indexnow.mjs <url1> ... # submits specific URLs only
//
// Setup:
//   1. The verification key file lives at public/<KEY>.txt (auto-generated below).
//   2. After deploy, the file must be accessible at https://onrol.in/<KEY>.txt
//      so search engines can verify our ownership.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";

const HOST = "onrol.in";
const SITE_URL = `https://${HOST}`;
const ENDPOINT = "https://api.indexnow.org/IndexNow";

const KEY_FILE_DIR = join(process.cwd(), "public");
// Persist the key in a stable file so the same key gets reused across runs.
const KEY_REGISTRY = join(process.cwd(), ".indexnow-key");

async function getOrCreateKey() {
  if (existsSync(KEY_REGISTRY)) {
    return (await readFile(KEY_REGISTRY, "utf8")).trim();
  }
  const key = randomBytes(16).toString("hex"); // 32-char alphanumeric
  await writeFile(KEY_REGISTRY, key, "utf8");
  if (!existsSync(KEY_FILE_DIR)) mkdirSync(KEY_FILE_DIR, { recursive: true });
  await writeFile(join(KEY_FILE_DIR, `${key}.txt`), key, "utf8");
  console.log(`[indexnow] generated new key + wrote public/${key}.txt`);
  return key;
}

async function loadDefaultUrls() {
  // Source of truth = the canonical sitemap we actually ship (public/sitemap.xml,
  // built by scripts/gen-sitemap.mjs) so IndexNow submits the exact same 200-URL
  // set search engines see — no drift from a stale route list.
  const xml = await readFile(join(process.cwd(), "public", "sitemap.xml"), "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function main() {
  const argUrls = process.argv.slice(2).filter(Boolean);
  const urls = argUrls.length ? argUrls : await loadDefaultUrls();
  const key = await getOrCreateKey();

  // Ensure the verification file is also written to dist/ if it exists, so a
  // build that runs indexnow will copy it into the deployable artefact.
  const distDir = join(process.cwd(), "dist");
  if (existsSync(distDir)) {
    await writeFile(join(distDir, `${key}.txt`), key, "utf8");
  }

  const body = {
    host: HOST,
    key,
    keyLocation: `${SITE_URL}/${key}.txt`,
    urlList: urls,
  };

  console.log(`[indexnow] submitting ${urls.length} URLs to IndexNow…`);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  console.log(`[indexnow] response: HTTP ${res.status} ${res.statusText}`);
  if (res.status === 200 || res.status === 202) {
    console.log(`[indexnow] ✓ accepted by Bing / Yandex / participating engines.`);
  } else {
    const txt = await res.text().catch(() => "");
    console.warn(`[indexnow] unexpected response body: ${txt.slice(0, 400)}`);
  }
}

main().catch((err) => {
  console.error("[indexnow] failed:", err);
  process.exit(1);
});
