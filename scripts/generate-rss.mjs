// Postbuild: generate /rss.xml in dist/ from blogPosts + AI_NEWS_ANCHORS.
//
// Why: RSS is still the dominant ingest path for news aggregators
// (Feedly, Inoreader), Mastodon/Bluesky bridges, and — increasingly —
// AI training pipelines. A clean, lastBuildDate-stamped feed at
// /rss.xml lets onrol.in get picked up by ChatGPT browse, Perplexity,
// Claude AI search, and Bing/IndexNow without any extra tooling.
//
// Reads the TS sources via tsx isn't necessary — both content files
// are plain ES modules with statically-analysable exports. We use a
// small regex extractor instead of compiling TS, since the build has
// already produced the list as data inside the bundle.

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const DIST = resolve(ROOT, "dist");
const SITE_URL = "https://onrol.in";
const FEED_TITLE = "ONROL — India's AI Execution School";
const FEED_DESC =
  "Practical AI execution updates for Indian builders — new model releases, AI jobs, vibe coding, automation, and what to ship next.";
const AUTHOR_EMAIL = "info@onrol.in";
const AUTHOR_NAME = "Dr. Neeraja Reddy";

// ── Lightweight extractors ──────────────────────────────────────────────────
function readBlogPosts() {
  const raw = readFileSync(resolve(ROOT, "src/lib/blogContent.ts"), "utf-8");
  // Pull each post object's slug, title, metaDescription, h1, hook,
  // publishedAt, category. The file uses uniform formatting so a flat
  // regex works — and is robust enough for a build-time script.
  const posts = [];
  const objRe =
    /\{\s*slug:\s*"([^"]+)"[\s\S]*?title:\s*"((?:[^"\\]|\\.)+)"[\s\S]*?metaDescription:\s*"((?:[^"\\]|\\.)+)"[\s\S]*?h1:\s*"((?:[^"\\]|\\.)+)"[\s\S]*?hook:\s*"((?:[^"\\]|\\.)+)"[\s\S]*?publishedAt:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"/g;
  let m;
  while ((m = objRe.exec(raw)) !== null) {
    const [, slug, title, metaDescription, h1, hook, publishedAt, category] = m;
    posts.push({
      slug,
      url: `${SITE_URL}/blog/${slug}/`,
      title: unescapeStr(title),
      description: unescapeStr(metaDescription),
      h1: unescapeStr(h1),
      hook: unescapeStr(hook),
      publishedAt,
      category,
      kind: "blog",
    });
  }
  return posts;
}

function readNewsAnchors() {
  const raw = readFileSync(resolve(ROOT, "src/lib/aiNewsAnchors.ts"), "utf-8");
  // The file exports a JSON-like array. Slice from the first '[' after
  // AI_NEWS_ANCHORS = to the closing ']' and JSON.parse it.
  // Match the literal start `= [` to skip past `AiNewsAnchor[]` type annotation.
  const eqIdx = raw.indexOf("AI_NEWS_ANCHORS");
  const start = raw.indexOf("= [", eqIdx);
  const end = raw.lastIndexOf("];");
  if (start < 0 || end < 0) return [];
  // start+2 → first char of the array literal "[".
  const arrText = raw.slice(start + 2, end + 1);
  let arr = [];
  try {
    arr = JSON.parse(arrText);
  } catch {
    return [];
  }
  return arr.map((a) => ({
    slug: a.slug,
    url: `${SITE_URL}/blog/${a.slug}/`,
    title: a.title,
    description: a.angle || a.theme,
    h1: a.title,
    hook: a.angle || a.theme,
    publishedAt: a.date,
    category: "AI News",
    kind: "news",
  }));
}

function unescapeStr(s) {
  return s.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function rfc822(iso) {
  // ISO date "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS+05:30" → RFC 822
  const d = new Date(iso.length === 10 ? `${iso}T09:00:00+05:30` : iso);
  return d.toUTCString();
}

// ── Build feed ─────────────────────────────────────────────────────────────
const blogs = readBlogPosts();
const news = readNewsAnchors();
const all = [...blogs, ...news]
  .filter((p) => !!p.publishedAt)
  // de-dupe by slug (a blog and news entry might share one)
  .filter((p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i)
  .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
  .slice(0, 60); // RSS readers cap, AI ingest doesn't need more than ~60

const lastBuild = new Date().toUTCString();

const items = all
  .map(
    (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${p.url}</link>
      <guid isPermaLink="true">${p.url}</guid>
      <pubDate>${rfc822(p.publishedAt)}</pubDate>
      <category>${escapeXml(p.category)}</category>
      <description>${escapeXml(p.description)}</description>
      <author>${AUTHOR_EMAIL} (${escapeXml(AUTHOR_NAME)})</author>
    </item>`,
  )
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(FEED_DESC)}</description>
    <language>en-IN</language>
    <copyright>© ${new Date().getFullYear()} ONROL</copyright>
    <managingEditor>${AUTHOR_EMAIL} (${escapeXml(AUTHOR_NAME)})</managingEditor>
    <webMaster>${AUTHOR_EMAIL} (${escapeXml(AUTHOR_NAME)})</webMaster>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <generator>onrol.in postbuild rss</generator>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/onrol-logo-dark.png</url>
      <title>${escapeXml(FEED_TITLE)}</title>
      <link>${SITE_URL}/</link>
    </image>
${items}
  </channel>
</rss>
`;

writeFileSync(resolve(DIST, "rss.xml"), xml, "utf-8");
console.log(`[rss] wrote /rss.xml — ${all.length} items (${blogs.length} blogs + ${news.length} news anchors, deduped)`);
