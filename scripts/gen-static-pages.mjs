/* =========================================================================
   ONROL — static marketing page generator (SEO / AEO / GEO baked in).

   Reads the offline "onrol-home" folder, rewrites asset + inter-page links
   to the live clean URLs, fixes canonical/JSON-LD URLs, and injects a full
   SEO head (canonical clean URL, Open Graph, Twitter, robots) plus
   structured data (BreadcrumbList everywhere, FAQPage on /questions,
   Organization + WebSite on the home) so every page is search- and
   answer-engine ready. Output → public/ (served as native static pages).

   Run:  node scripts/gen-static-pages.mjs
   ========================================================================= */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

// Source = the offline "onrol-home" export folder. Override with:
//   node scripts/gen-static-pages.mjs "<path-to-folder>"   (or ONROL_SRC env)
const SRC = process.argv[2] || process.env.ONROL_SRC || "C:/Users/user/Downloads/onrol-home-main/onrol-home-main";
const OUT = "public";
const ORIGIN = "https://onrol.in";
/* Build date — stamped into freshness schema so it never goes stale. */
const BUILD_DATE = new Date().toISOString().slice(0, 10);
/* Branded OG card per page (real files in public/og/*.png). */
function ogImageFor(cleanUrl) {
  const p = cleanUrl.replace(ORIGIN, "").replace(/^\/+|\/+$/g, "");
  const card =
    /^programs(\/|$)/.test(p) || p === "cybersecurity" || p === "soc-analyst" ? "programs"
      : p.startsWith("blog") ? "blog"
      : p.startsWith("glossary") ? "glossary"
      : p.startsWith("tools") ? "tools"
      : "default";
  return `${ORIGIN}/og/${card}.png`;
}
const ORG_LOGO = `${ORIGIN}/onrol-logo-dark.png`;
// Verified-live profiles only (probed Aug 2026). Twitter/X handles onrol_ai /
// onrol_in both 404 — a dead sameAs weakens entity trust, so they're omitted.
const SAME_AS = [
  "https://www.linkedin.com/company/onrol",
  "https://www.instagram.com/onrol.in",
  "https://www.youtube.com/@onrolofficial",
];

const PROGRAMS = { name: "Programs", url: `${ORIGIN}/programs` };

/* src file → { out (public path), url (clean absolute), crumb, parent, noindex } */
const PAGES = {
  "index.html":                     { out: "home-static.html",                 url: `${ORIGIN}/` },
  "about.html":                     { out: "about.html",                       url: `${ORIGIN}/about`, crumb: "About" },
  "programs.html":                  { out: "programs.html",                    url: `${ORIGIN}/programs`, crumb: "Programs" },
  "ai-programs.html":               { out: "programs/ai.html",                 url: `${ORIGIN}/programs/ai`, crumb: "AI Programs", parent: PROGRAMS },
  "cyber-programs.html":            { out: "programs/cyber.html",              url: `${ORIGIN}/programs/cyber`, crumb: "Cyber Security Programs", parent: PROGRAMS },
  "ai-generalist.html":             { out: "programs/ai-generalist.html",      url: `${ORIGIN}/programs/ai-generalist`, crumb: "AI Generalist Program", parent: PROGRAMS },
  "ai-architect.html":              { out: "programs/ai-architect.html",       url: `${ORIGIN}/programs/ai-architect`, crumb: "AI Architect Program", parent: PROGRAMS },
  "cybersecurity.html":             { out: "programs/cybersecurity.html",      url: `${ORIGIN}/programs/cybersecurity`, crumb: "Cyber Security", parent: PROGRAMS },
  "soc-analyst.html":               { out: "programs/soc-analyst.html",        url: `${ORIGIN}/programs/soc-analyst`, crumb: "SOC Analyst", parent: PROGRAMS },
  // AI Career Accelerator — new program. Source lives in the repo (content/aica.html)
  // rather than the export folder. Real curriculum content is in place, so indexable.
  "aica.html":                      { out: "programs/aica.html",               url: `${ORIGIN}/programs/aica`, crumb: "AI Career Accelerator", parent: PROGRAMS, src: "content/aica.html" },
  "contact.html":                   { out: "contact.html",                     url: `${ORIGIN}/contact`, crumb: "Contact" },
  "mentors.html":                   { out: "mentors.html",                     url: `${ORIGIN}/mentors`, crumb: "Mentors" },
  "faq.html":                       { out: "questions.html",                   url: `${ORIGIN}/questions`, crumb: "Questions" },
  "glossary.html":                  { out: "glossary.html",                    url: `${ORIGIN}/glossary`, crumb: "AI Glossary" },
  "blog.html":                      { out: "blog.html",                        url: `${ORIGIN}/blog`, crumb: "Blog" },
  "quiz.html":                      { out: "tools/ai-skills-quiz.html",        url: `${ORIGIN}/tools/ai-skills-quiz`, crumb: "AI Skills Quiz" },
  "masterclass.html":               { out: "masterclass.html",                 url: `${ORIGIN}/masterclass`, crumb: "Free AI Masterclass" },
  "why-ai-matters.html":            { out: "why-now.html",                     url: `${ORIGIN}/why-now`, crumb: "Why AI Now" },
  "ai-course-hyderabad.html":       { out: "ai-course-in-hyderabad.html",      url: `${ORIGIN}/ai-course-in-hyderabad`, crumb: "AI Course in Hyderabad" },
  "best-ai-institute-hyderabad.html": { out: "best-ai-institute-in-hyderabad.html", url: `${ORIGIN}/best-ai-institute-in-hyderabad`, crumb: "Best AI Institute in Hyderabad" },
  "privacy.html":                   { out: "privacy-policy.html",              url: `${ORIGIN}/privacy-policy`, crumb: "Privacy Policy" },
  "terms.html":                     { out: "terms-and-conditions.html",        url: `${ORIGIN}/terms-and-conditions`, crumb: "Terms & Conditions" },
  "thank-you.html":                 { out: "thank-you.html",                   url: `${ORIGIN}/thank-you`, crumb: "Thank You", noindex: true },
};

/* ---- absolute .html → clean URL map (fixes canonical + JSON-LD refs) ---- */
const ABS = {};
for (const [src, m] of Object.entries(PAGES)) ABS[`${ORIGIN}/${src}`] = m.url;
ABS[`${ORIGIN}/index.html`] = `${ORIGIN}/`;

/* ---- inter-page href map (clean routes) ---- */
const linkMap = [
  ["index.html#contact", "/contact"], ["index.html#programs", "/programs"],
  ["contact.html", "/contact"], ["soc-analyst.html", "/programs/soc-analyst"],
  ["ai-programs.html", "/programs/ai"], ["cyber-programs.html", "/programs/cyber"],
  ["ai-generalist.html#", "/programs/ai-generalist#"], ["ai-generalist.html", "/programs/ai-generalist"],
  ["programs.html", "/programs"], ["ai-architect.html", "/programs/ai-architect"],
  ["about.html", "/about"], ["faq.html", "/questions"], ["glossary.html", "/glossary"],
  ["blog.html", "/blog"], ["quiz.html", "/tools/ai-skills-quiz"], ["masterclass.html", "/masterclass"],
  ["why-ai-matters.html", "/why-now"], ["ai-course-hyderabad.html", "/ai-course-in-hyderabad"],
  ["best-ai-institute-hyderabad.html", "/best-ai-institute-in-hyderabad"], ["mentors.html", "/mentors"],
  ["cybersecurity.html", "/programs/cybersecurity"], ["privacy.html", "/privacy-policy"],
  ["terms.html", "/terms-and-conditions"], ["thank-you.html", "/thank-you"], ["index.html", "/"],
];

function rewriteAssets(s) {
  s = s.replace(/(["'(])(assets\/|who\/|module-\d+\/|modules-1\/|media\/)/g, "$1/home-glydi/$2");
  for (const f of ["about_onrol.mp4", "ai_gen_cover_desktop.png", "bag.jpeg", "logo-mark.png", "mam-0001.png", "mam_01.png", "ai-portfolio.jpg", "ai-portfolio-flow.jpg", "portfolio-arch.png", "portfolio-cyb.png", "portfolio-soc.png", "cta-bg.jpg", "footer.jpeg", "ast.png", "styles.css"])
    s = s.split(`"${f}`).join(`"/home-glydi/${f}`).split(`'${f}`).join(`'/home-glydi/${f}`);
  return s;
}
function rewriteLinks(html) {
  return html.replace(/href="([^"]+)"/g, (m, h) => {
    for (const [from, to] of linkMap) {
      if (h === from) return `href="${to}"`;
      if (from.endsWith("#") && h.startsWith(from)) return `href="${to}${h.slice(from.length)}"`;
    }
    return m;
  });
}
/* canonical + JSON-LD absolute .html URLs → clean URLs */
function fixAbsolute(s) {
  for (const [from, to] of Object.entries(ABS)) s = s.split(from).join(to);
  return s;
}

/* The offline nav "active link" script used `pathname.split("/").pop()` and
   `.html` filename matching — both break once links are clean URLs served with
   a trailing slash (e.g. /programs/ → pop() = "" → falls back to index.html →
   wrongly highlights Home). Replace it with a clean-path comparison: normalise
   trailing slashes on both the current path and each link href (a pure #anchor
   Home link resolves to "/"). */
const NAV_ACTIVE_FIX =
  '<script>(function(){try{var path=(location.pathname.replace(/\\/+$/,"")||"/");' +
  'document.querySelectorAll(".nav-links a[href]").forEach(function(a){' +
  'var raw=(a.getAttribute("href")||"").split("#")[0];' +
  'var href=raw?(raw.replace(/\\/+$/,"")||"/"):"/";' +
  'a.classList.toggle("is-active",href===path);});}catch(e){}})();</script>';
function fixNavActive(s) {
  return s.replace(
    /<script>\(function\(\)\{try\{var p=\(location\.pathname\.split[\s\S]*?\}catch\(e\)\{\}\}\)\(\);<\/script>/,
    NAV_ACTIVE_FIX,
  );
}

const grab = (s, re) => { const m = s.match(re); return m ? m[1].trim() : ""; };
const jsonld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
const attr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const clean = (s) => s.replace(/<[^>]+>/g, "").replace(/&rarr;/g, "").replace(/\s+/g, " ").trim();

/* FAQPage — auto-extracted from faq.html .box (h3 + p) blocks */
function faqSchema(srcHtml) {
  const items = [];
  const re = /<div class="box">\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g;
  let m;
  while ((m = re.exec(srcHtml))) {
    items.push({
      "@type": "Question",
      name: clean(m[1]),
      acceptedAnswer: { "@type": "Answer", text: clean(m[2]) },
    });
  }
  if (!items.length) return "";
  return jsonld({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: items });
}

function breadcrumb(meta) {
  const items = [{ "@type": "ListItem", position: 1, name: "Home", item: `${ORIGIN}/` }];
  let pos = 2;
  if (meta.parent) items.push({ "@type": "ListItem", position: pos++, name: meta.parent.name, item: meta.parent.url });
  items.push({ "@type": "ListItem", position: pos, name: meta.crumb, item: meta.url });
  return jsonld({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items });
}

/* Blog + ItemList for the /blog index — makes the post collection a structured,
   crawlable list. Real post URLs come from prerender-routes.json; display names
   are derived from the slug (title-cased, common acronyms upper-cased). */
function blogSchema() {
  const routes = JSON.parse(readFileSync("scripts/prerender-routes.json", "utf8")).routes;
  const posts = routes.filter((r) => /^\/blog\/[^/]+\/?$/.test(r)).map((r) => r.replace(/\/+$/, ""));
  const ACR = /^(ai|ml|soc|api|llm|rag|it|us|uk|in|seo|faq|hr|ui|ux)$/i;
  const titleize = (p) => p.split("/").pop().split("-")
    .map((w) => ACR.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const items = posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${ORIGIN}${p}/`, name: titleize(p) }));
  return (
    jsonld({
      "@context": "https://schema.org", "@type": "Blog", "@id": `${ORIGIN}/blog#blog`,
      url: `${ORIGIN}/blog`, name: "ONROL Blog",
      description: "Practical AI guides, career advice and build tutorials from ONROL — India's AI Execution School.",
      inLanguage: "en-IN",
      publisher: { "@type": "Organization", name: "ONROL", logo: ORG_LOGO },
    }) +
    jsonld({ "@context": "https://schema.org", "@type": "ItemList", "@id": `${ORIGIN}/blog#posts`, numberOfItems: items.length, itemListElement: items })
  );
}

/* Article schema for informational buyer-guide / geo pages (currently carry only
   a breadcrumb). Adds real E-E-A-T signal — author, publisher, freshness — and
   article rich-result eligibility. Not fabricated: headline/description come from
   the page's own title/meta, author is the real founder. */
function articleSchema(meta, title, desc) {
  return jsonld({
    "@context": "https://schema.org", "@type": "Article",
    headline: title, description: desc,
    mainEntityOfPage: { "@type": "WebPage", "@id": meta.url },
    image: ogImageFor(meta.url), inLanguage: "en-IN",
    author: { "@type": "Person", name: "Dr. Neeraja Reddy", url: `${ORIGIN}/founders/dr-neeraja-reddy` },
    publisher: { "@type": "Organization", name: "ONROL", logo: { "@type": "ImageObject", url: ORG_LOGO } },
    datePublished: "2026-05-01", dateModified: BUILD_DATE,
  });
}
const ARTICLE_SRCS = new Set(["ai-course-hyderabad.html", "best-ai-institute-hyderabad.html", "why-ai-matters.html"]);

function homeSchema() {
  return (
    jsonld({
      "@context": "https://schema.org", "@type": "Organization", name: "ONROL",
      alternateName: ["ONROL AI Execution School", "India's AI Execution School"],
      url: `${ORIGIN}/`, logo: ORG_LOGO,
      description: "ONROL is India's AI Execution School — a Hyderabad-based, online-first platform where students, professionals, freelancers and founders build and ship real AI systems (no coding required).",
      slogan: "Top universities teach you what AI is. ONROL teaches you what to do with AI.",
      foundingDate: "2025", areaServed: { "@type": "Country", name: "India" }, sameAs: SAME_AS,
      founder: { "@type": "Person", name: "Dr. Neeraja Reddy", url: `${ORIGIN}/founders/dr-neeraja-reddy` },
      contactPoint: [{ "@type": "ContactPoint", contactType: "customer support", availableLanguage: ["English", "Hindi"], url: `${ORIGIN}/contact` }],
    }) +
    jsonld({
      "@context": "https://schema.org", "@type": "WebSite", name: "ONROL",
      url: `${ORIGIN}/`, inLanguage: "en-IN",
      publisher: { "@type": "Organization", name: "ONROL", logo: ORG_LOGO },
    }) +
    // E-E-A-T: founder as a Person entity, linked to the real founder page.
    jsonld({
      "@context": "https://schema.org", "@type": "Person",
      name: "Dr. Neeraja Reddy", jobTitle: "Founder, ONROL",
      description: "Founder of ONROL — India's AI Execution School. Doctorate in Business Administration with 16+ years of global experience across healthcare, clinical research, and education — now helping non-coders ship real AI products.",
      url: `${ORIGIN}/founders/dr-neeraja-reddy`,
      image: `${ORIGIN}/founder-neeraja-reddy.jpg`,
      worksFor: { "@type": "Organization", name: "ONROL", url: `${ORIGIN}/` },
    }) +
    // Rich-result eligibility: the two flagship programs shown on the home.
    jsonld({
      "@context": "https://schema.org", "@type": "Course",
      name: "AI Generalist Program",
      description: "3-month live program: build 5 AI systems and 7+ real projects — automations, AI agents, chatbots and AI apps — no coding required.",
      provider: { "@type": "EducationalOrganization", name: "ONROL", url: `${ORIGIN}/` },
      url: `${ORIGIN}/programs/ai-generalist`, inLanguage: "en",
      hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "P3M" },
    }) +
    jsonld({
      "@context": "https://schema.org", "@type": "Course",
      name: "AI Architect Program",
      description: "6-month advanced program (250+ hours): design, deploy and scale complete AI systems — full-stack AI, advanced RAG and multi-agent workflows, 15+ deployable projects.",
      provider: { "@type": "EducationalOrganization", name: "ONROL", url: `${ORIGIN}/` },
      url: `${ORIGIN}/programs/ai-architect`, inLanguage: "en",
      hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "P6M" },
    }) +
    // Content freshness, machine-readable.
    jsonld({
      "@context": "https://schema.org", "@type": "WebPage",
      "@id": `${ORIGIN}/#webpage`, url: `${ORIGIN}/`,
      name: "ONROL — India's AI Execution School",
      datePublished: "2026-05-01", dateModified: BUILD_DATE,
      isPartOf: { "@type": "WebSite", url: `${ORIGIN}/` },
    })
  );
}

function seoHead(src, meta, html) {
  const title = grab(html, /<title>([^<]*)<\/title>/i) || "ONROL";
  const desc = grab(html, /<meta\s+name="description"\s+content="([^"]*)"/i) || "";
  const isHome = src === "index.html";
  const robots = meta.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const OG_IMAGE = ogImageFor(meta.url);
  let out = "\n";
  out += `<meta name="robots" content="${robots}">\n`;
  // Canonical fallback — source pages usually carry one, but inject it when
  // absent so no page ever ships without a self-referential canonical.
  if (!/rel="canonical"/i.test(html)) out += `<link rel="canonical" href="${meta.url}">\n`;
  // Preload the primary body font (self-hosted, otherwise discovered late after
  // the stylesheet parses) — a cheap LCP win. crossorigin is required for fonts.
  out += `<link rel="preload" href="/home-glydi/assets/fonts/opensans-400.woff2" as="font" type="font/woff2" crossorigin>\n`;
  // Favicon — only the home source ships a <link rel="icon">; sub-pages don't,
  // so add it here for every page.
  if (!/rel="[^"]*icon/i.test(html)) {
    out += `<link rel="icon" href="/home-glydi/logo-mark.png" type="image/png">\n`;
    out += `<link rel="apple-touch-icon" href="/home-glydi/logo-mark.png">\n`;
  }
  out += `<meta property="og:type" content="website">\n`;
  out += `<meta property="og:site_name" content="ONROL">\n`;
  out += `<meta property="og:locale" content="en_IN">\n`;
  out += `<meta property="og:title" content="${attr(title)}">\n`;
  out += `<meta property="og:description" content="${attr(desc)}">\n`;
  out += `<meta property="og:url" content="${meta.url}">\n`;
  out += `<meta property="og:image" content="${OG_IMAGE}">\n`;
  out += `<meta name="twitter:card" content="summary_large_image">\n`;
  out += `<meta name="twitter:title" content="${attr(title)}">\n`;
  out += `<meta name="twitter:description" content="${attr(desc)}">\n`;
  out += `<meta name="twitter:image" content="${OG_IMAGE}">\n`;
  if (isHome) out += homeSchema() + "\n";
  else out += breadcrumb(meta) + "\n";
  if (src === "faq.html") { const f = faqSchema(html); if (f) out += f + "\n"; }
  if (src === "blog.html") out += blogSchema() + "\n";
  if (ARTICLE_SRCS.has(src)) out += articleSchema(meta, title, desc) + "\n";
  if (src === "programs.html") out += PROGRAMS_COMPACT_CSS + "\n";
  out += NAV_LOGIN_CSS + "\n";
  return out;
}

/* The nav is always a light (white) floating pill and its links are forced dark.
   The Login control is a <button class="nav-login-btn"> (not an <a>), so on a few
   edited pages (cybersecurity, soc-analyst, program details) it inherited the
   white base nav-link colour and vanished against the pill. Force it — and its
   chevron — dark on every page so "Login" is always readable. */
const NAV_LOGIN_CSS = `<style id="nav-login-fix">
.nav .nav-login-btn,
.nav.on-dark .nav-login-btn{ color:#16181b !important; }
.nav .nav-login-btn .nl-chev{ color:currentColor !important; }
</style>`;

/* /programs: add the AI Career Accelerator card as a 3rd box in the AI panel,
   and switch the AI panel grid to 3 columns so all three sit in one row.
   (Cyber panel keeps its 2-up grid — the override is scoped to the AI track.) */
function injectAicaCard(raw) {
  if (raw.includes("/programs/aica")) return raw;
  const aica = `      <a class="pcard" href="/programs/aica">
        <div class="pcard-top"><span class="pcard-num">01</span><span class="pcard-tag">New, 21 days</span></div>
        <h4>AI Career Accelerator</h4>
        <p>Twenty-one live sessions, one hour a day. Start at zero, finish with a shipped AI product.</p>
        <div class="pcard-chips"><span>Zero coding</span><span>Deployed product</span></div>
        <span class="pcard-go">Explore program <i>&rarr;</i></span>
      </a>
`;
  // Insert the AICA card FIRST (leftmost), before the AI Generalist card, then
  // renumber the AI-track cards so left→right reads 01 · 02 · 03.
  raw = raw.replace(/(\s*)<a class="pcard" href="ai-generalist\.html">/, `$1${aica.trimEnd()}$1<a class="pcard" href="ai-generalist.html">`);
  raw = raw.replace(/(href="ai-generalist\.html">\s*<div class="pcard-top"><span class="pcard-num">)01(<)/, "$102$2");
  raw = raw.replace(/(href="ai-architect\.html">\s*<div class="pcard-top"><span class="pcard-num">)02(<)/, "$103$2");
  // 3-column grid for the AI panel only.
  raw = raw.replace(/<\/head>/i,
    `<style id="ai-panel-3up">@media(min-width:721px){.ppanel[data-track="ai"] .prog-grid{grid-template-columns:repeat(3,1fr)}}</style>\n</head>`);
  return raw;
}

/* /programs — compact "one-viewport" density. Scoped via body:has(.prog-hero)
   so no other subpage hero is affected. Reclaims ~130–220px of vertical
   whitespace so the hero heading, the AI/Cyber track tabs and both program
   cards sit above the fold on a standard desktop, while the hero top still
   clears the fixed floating nav (top:16px, ~54px tall). */
const PROGRAMS_COMPACT_CSS = `<style id="programs-compact">
body:has(.prog-hero) .pagehero{ padding-top:clamp(96px,12vh,126px); padding-bottom:clamp(22px,3.2vh,38px); }
body:has(.prog-hero) .subpage.has-hero{ padding-top:clamp(16px,2.3vh,28px); }
body:has(.prog-hero) .ppanel{ margin-top:22px; }
body:has(.prog-hero) .panel-sub{ margin-bottom:16px; }
body:has(.prog-hero) .actions{ margin-top:26px; }
body:has(.prog-hero) .subpage .back{ margin-top:24px; }
</style>`;

/* Internal-links section for the Programs page → the programmatic SEO pages
   (courses / geo / career), auto-built from data/seo-catalog.json so it stays
   in sync as pages are added. Gives those pages a crawlable inbound link from a
   frequently-crawled page — the fix for orphan pages that index slowly. */
function seoLinksBlock() {
  let cat;
  try { cat = JSON.parse(readFileSync("data/seo-catalog.json", "utf8")).pages; }
  catch { return ""; }
  if (!cat || !cat.length) return "";
  const label = (p) => (p.breadcrumb && p.breadcrumb.length ? p.breadcrumb[p.breadcrumb.length - 1].name : p.city || p.slug);
  const li = (p) => `<li><a href="/${p.slug}/">${label(p).replace(/&/g, "&amp;")}</a></li>`;
  const col = (title, items) => items.length ? `<div class="pgx-col"><h4>${title}</h4><ul>${items.map(li).join("")}</ul></div>` : "";
  const cols = [
    col("Courses", cat.filter((p) => p.type === "course")),
    col("AI courses by city", cat.filter((p) => p.type === "geo")),
    col("Career &amp; outcomes", cat.filter((p) => p.type === "jobready")),
  ].filter(Boolean).join("");
  if (!cols) return "";
  return `<section class="pgx" aria-label="More AI courses and locations">
<style>.pgx{border-top:1px solid rgba(0,0,0,.1);margin-top:8px;padding:40px 0 8px}.pgx-in{max-width:860px;margin:0 auto;padding:0 20px}.pgx-kick{font-family:var(--mono);font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--orange);margin:0 0 20px}.pgx-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:26px}@media(max-width:640px){.pgx-cols{grid-template-columns:1fr;gap:20px}}.pgx-col h4{font-family:var(--mono);font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#16181b;margin:0 0 12px}.pgx-col ul{list-style:none;margin:0;padding:0;display:grid;gap:9px}.pgx-col a{color:#41454b;text-decoration:none;font-size:14.5px;border-bottom:1px solid transparent}.pgx-col a:hover{color:var(--orange);border-bottom-color:rgba(var(--orange-rgb),.4)}</style>
<div class="pgx-in"><p class="pgx-kick">Explore AI courses &amp; locations</p><div class="pgx-cols">${cols}</div></div></section>`;
}

let n = 0;
for (const [src, meta] of Object.entries(PAGES)) {
  let raw = readFileSync(meta.src || `${SRC}/${src}`, "utf8");
  // /programs: drop the hero sub-paragraph so the tabs + both cards sit in one
  // viewport (spacing rebalanced by PROGRAMS_COMPACT_CSS).
  if (src === "programs.html") {
    raw = raw.replace(/\s*<p class="ph-sub">[\s\S]*?<\/p>/, "");
    raw = injectAicaCard(raw);
    raw = raw.replace(/>Four programs\./g, ">Five programs.");  // AICA added → 5 total
    raw = raw.replace(/<\/main>/, seoLinksBlock() + "\n</main>");  // internal links → programmatic SEO pages
  }
  let html = fixNavActive(fixAbsolute(rewriteLinks(rewriteAssets(raw))));
  // Footer: link the free Prompt Library alongside the AI Skills Quiz (internal
  // inbound links to the linkable-asset tools from every crawled page).
  html = html.replace(
    '<li><a href="/tools/ai-skills-quiz">AI Skills Quiz</a></li>',
    '<li><a href="/tools/ai-skills-quiz">AI Skills Quiz</a></li>\n          <li><a href="/tools/ai-prompt-library">AI Prompt Library</a></li>',
  );
  // Home SERP tuning (ooty.io audit): title ≤60 chars with a number; meta
  // description trimmed from 230 → ~150 chars so Google shows it untruncated.
  if (src === "index.html") {
    html = html
      .replace(/<title>[^<]*<\/title>/, "<title>ONROL — India's AI Execution School | Build AI in 3 Months</title>")
      .replace(/(<meta name="description" content=")[^"]*(")/,
        "$1India's AI Execution School: build and deploy real AI in 3 months — no coding needed. Live mentors, 7+ shipped projects. Apply for the next cohort.$2");
    // Readability (audit: 16% of sentences had transition words; target 30%+).
    // The 4-step journey reads naturally as First/Next/Then/Finally; a few more
    // connectives elsewhere. Each pair no-ops harmlessly if the copy changes in
    // a future folder export.
    for (const [from, to] of [
      ["Get fluent in what moves the needle:", "First, get fluent in what moves the needle:"],
      ["Put those skills to work on real projects", "Next, put those skills to work on real projects"],
      ["Capability becomes proof.", "As a result, capability becomes proof."],
      ["Take it live. Your project ships", "Then take it live. Your project ships"],
      ["Proof becomes visible.", "In turn, proof becomes visible."],
      ["Turn it into income, freelance, a product, or a job.", "Finally, turn it into income, freelance, a product, or a job."],
      ["Visible work becomes a career.", "Ultimately, visible work becomes a career."],
      ["Each week you finish something real", "Moreover, each week you finish something real"],
      ["Pick the one that fits where you want to go.", "Then pick the one that fits where you want to go."],
      ["Find yours, and finish with real AI projects", "Simply find yours, and finish with real AI projects"],
      ["Join the next ONROL cohort and start building from day one", "So join the next ONROL cohort and start building from day one"],
    ]) html = html.replace(from, to);
  }
  // E-E-A-T: visible founder byline (linked to the founder page) + updated date
  // in the shared footer of every static page.
  html = html.replace(
    /All rights reserved\./,
    'All rights reserved. Founded by <a href="/founders/dr-neeraja-reddy" style="color:inherit;text-decoration:underline">Dr. Neeraja Reddy</a> &middot; Updated July 2026.',
  );
  const head = seoHead(src, meta, html);
  // ensure a clean canonical (already fixed to clean URL by fixAbsolute; add if missing)
  if (!/rel="canonical"/i.test(html)) html = html.replace(/<\/head>/i, `<link rel="canonical" href="${meta.url}">\n</head>`);
  html = html.replace(/<\/head>/i, `${head}</head>`);
  const path = `${OUT}/${meta.out}`;
  mkdirSync(path.substring(0, path.lastIndexOf("/")), { recursive: true });
  writeFileSync(path, html);
  n++;
}
console.log(`generated ${n} static pages with SEO/AEO/GEO head`);
