# ONROL SEO + AEO Roadmap

**Source phrase deck:** [scripts/seo-phrases.txt](../scripts/seo-phrases.txt) — 972 commercial-intent phrases across 13 clusters.

**Goal:** Rank ONROL on page 1 of Google for high-intent commercial queries (`best AI institute India`, `top vibe coding training India`, `top 10 AI institutes`, geo-specific queries) AND get cited by AI search engines (Perplexity, Claude, ChatGPT, Bing Copilot, Google AI Overviews).

---

## Strategic principle

**One phrase ≠ one page.** Google penalises thin "doorway" pages that target a single keyword. The professional approach is **topic clustering**: each cluster gets *one pillar page* (the canonical authoritative resource) plus *5–15 supporting articles* that all internally link back to the pillar. The pillar page targets the head term; supporting articles target long-tail variations.

This roadmap: **20 pages → 250 phrases covered directly + 700 long-tail variations covered via internal linking and on-page mentions.**

---

## Tier P0 — ship in next 2 weeks (highest commercial leverage)

These are the "money pages". Each is a NEW pillar page or major rebuild. Each targets a head term we don't currently rank for.

| # | Slug (new) | Targets head term | Existing? | Effort |
|---|---|---|---|---|
| 1 | `/best-ai-institutes-in-india/` | best AI institute India + top AI institute India + top 10 AI institutes India | NEW | 6h |
| 2 | `/best-ai-bootcamps-in-india/` | best AI bootcamp India + top AI bootcamp India | NEW | 5h |
| 3 | `/top-vibe-coding-training-india/` | top vibe coding training India + best vibe coding course India | NEW | 5h |
| 4 | `/ai-institutes-near-me/` | AI institute near me + AI training near me + AI bootcamp near me | NEW | 4h |
| 5 | `/ai-course-fees-india/` | AI course fees India + AI course price India + AI bootcamp price India | NEW | 3h |
| 6 | `/onrol-vs-alternatives/` | ONROL vs SimpliLearn + ONROL vs Great Learning + ONROL vs UpGrad + ONROL vs Edureka | NEW | 5h |
| 7 | `/best-ai-course-in-india/` | best AI course India (UPLIFT existing) | EXISTING — rewrite | 3h |
| 8 | `/about/` | who is ONROL + Dr Neeraja Reddy (UPLIFT) | EXISTING — schema upgrade | 1h |

**P0 total = ~32 hours of focused content production.** Realistic: 2 weeks at 2-3h/day.

### Why these P0
- **#1 + #2 + #4** capture the broadest "best/top + AI + India" search intent — the user's primary goal.
- **#3** owns "vibe coding training India" — a phrase nobody has authority on yet (low-hanging fruit, blue ocean).
- **#5** is a price-comparison page — high commercial intent (people who price-shop convert at higher rates).
- **#6** wins comparison searches that competitors won't rank you for. ONROL writes the comparison so we control the framing.
- **#7 + #8** uplift existing pages without new URL/content overhead.

### Each P0 pillar page must include
1. **Direct-answer paragraph (≤150 words) right after H1** — `class="lead"` so Speakable schema picks it up. AI search engines extract from this.
2. **Comparison table** — 5-10 row HTML table comparing ONROL against named alternatives. Tables get extracted by Perplexity/ChatGPT verbatim.
3. **At least 8 FAQ entries** with `faqJsonLd` (already wired into PillarPageLayout — auto-attaches if `page.faqs` present).
4. **Stat tiles** with concrete numbers (cohort count, alumni count, project count, fees in ₹).
5. **Author byline** — Dr Neeraja Reddy + credentials (already auto-attached via PillarPageLayout).
6. **Geo + audience cross-links** — every pillar links to relevant city pages + audience-specific pages (P1-P2).
7. **Internal links** to 3+ other pillars and 5+ supporting blog posts.
8. **JSON-LD** (already wired via `PillarPageLayout`):
   - `BreadcrumbList`
   - `Person` (founder)
   - `Speakable` (h1 + p.lead)
   - `FAQPage`
   - **NEW: `Course` schema if program-specific**, **`ItemList` for top-N pages**
9. **Last-updated date stamp visible** ("Updated: May 2026") — freshness signal for AI search.

---

## Tier P1 — ship in next 4 weeks

20 supporting blog posts + 8 city pages. These power-up the P0 pillars via internal linking.

### Blog posts (12)
| Slug | Targets | Cluster |
|---|---|---|
| `/blog/how-to-choose-ai-institute-india/` | how to choose AI institute India + AI institute red flags India | 1 + 9 |
| `/blog/ai-bootcamp-vs-degree-india/` | AI bootcamp vs degree + applied AI vs academic AI | 6 |
| `/blog/ai-course-fees-comparison-india/` | AI course fees comparison + cheap AI course India | 5 |
| `/blog/free-vs-paid-ai-courses-india/` | free AI course India + free AI masterclass India | 5 |
| `/blog/learn-vibe-coding-step-by-step/` | how to learn vibe coding + vibe coding tutorial | 3 + 7 |
| `/blog/lovable-vs-bolt-vs-cursor-vs-v0/` | which vibe coding tool is best | 3 + 7 |
| `/blog/build-your-first-ai-agent/` | how to build AI agents + AI agents course India | 10 |
| `/blog/n8n-vs-make-vs-zapier-india/` | n8n vs Make vs Zapier comparison | 10 |
| `/blog/earn-money-with-ai-skills-india/` | earn money with AI India + AI freelance India | 8 |
| `/blog/ai-skills-most-in-demand-india-2026/` | AI skills in demand India 2026 + AI jobs India | 8 |
| `/blog/should-i-learn-ai-without-coding/` | AI without coding India + AI for non-coders India | 4 |
| `/blog/ai-course-for-women-india/` | AI for women India + AI for housewives India | 4 |

### City pages (8)
| Slug | Targets |
|---|---|
| `/ai-institute-hyderabad/` | AI institute Hyderabad + best AI institute Hyderabad + AI bootcamp Hyderabad |
| `/ai-institute-bangalore/` | AI institute Bangalore + AI bootcamp Bangalore |
| `/ai-institute-mumbai/` | AI institute Mumbai + AI bootcamp Mumbai |
| `/ai-institute-delhi/` | AI institute Delhi + AI bootcamp Delhi NCR |
| `/ai-institute-chennai/` | AI institute Chennai + AI bootcamp Chennai |
| `/ai-institute-pune/` | AI institute Pune |
| `/ai-institute-kolkata/` | AI institute Kolkata |
| `/ai-institute-ahmedabad/` | AI institute Ahmedabad + AI bootcamp Gujarat |

City pages should **add `LocalBusiness` schema** with the city as `areaServed`. Even if ONROL is fully online, the schema helps Google's geo-ranking.

---

## Tier P2 — ship in 2 months

40 long-tail blog posts targeting Cluster 4 (audience-specific) and Cluster 10 (technical subtopics).

Examples: `/blog/ai-course-for-engineering-students/`, `/blog/ai-course-for-marketers-india/`, `/blog/learn-langchain-india/`, `/blog/learn-prompt-engineering-india/`, `/blog/build-ai-saas-no-code/`, etc.

**Production rate:** 5 posts/week sustained = 8 weeks for 40 posts. Use the same `BlogPostLayout` infrastructure.

---

## Tier P3 — long-tail / opportunistic

Cluster 13 (EdTech platform variations from your original keyword list) — these align with a possible future B2B SaaS direction (selling ONROL's curriculum to schools/colleges). Park for now. Revisit if you launch the institutional product.

---

## AEO (AI Engine Optimization) tactics

Different from traditional SEO. AI engines (Perplexity, Claude, ChatGPT, Bing Copilot, Google AI Overviews) extract content differently. Tactics:

### 1. Direct-answer first
Every page's first paragraph (the `<p class="lead">`) **must answer the page's primary question in ≤150 words**, in declarative sentences with concrete facts. AI engines extract this paragraph verbatim.

**Bad:** *"In the modern world, AI is everywhere. Many people want to learn AI. ONROL is here to help you on your AI journey..."* (vague, motivational)

**Good:** *"ONROL is India's AI execution school. We run a 5-day intensive cohort in which non-coders ship 3 deployed AI projects: a backend automation, a vibe-coded website, and a fine-tuned personal assistant. Cohorts of 25–40 builders. Fee ₹X. Founded 2024 by Dr Neeraja Reddy. Live online + Hyderabad."* (factual, citeable)

### 2. Quotable definitive sentences
AI engines love sentences they can pull as a citation. Sprinkle 3-5 short factual claims per page:
- "ONROL is the only AI institute in India where every learner ships 3 deployed projects in 5 days."
- "Vibe coding is software development where you describe the app in plain English and an AI writes the code."
- Each claim should be standalone, factually accurate, and not require surrounding context.

### 3. Tables and bulleted lists
AI engines extract these much better than paragraphs. Every pillar should have:
- 1+ comparison table (5-10 rows)
- 2+ bulleted lists (5-10 items each)

### 4. FAQ blocks with FAQPage + Speakable schema
Already wired. Just keep adding FAQs to every new page. Aim 8-12 FAQs per pillar.

### 5. Citation-friendly content
- Mention specific cohort/student numbers ("100+ learners", "15 cohorts")
- Specific dates ("Founded 2024", "Updated May 2026")
- Specific fees ("₹X" — exact)
- Specific outcomes ("Learner shipped X within Y days")
- Author credentials (Dr Neeraja Reddy + DBA + 16 years experience)

### 6. llms.txt and llms-full.txt
You already have these at `/llms.txt` and `/llms-full.txt`. After each new page, **regenerate them** to include the new content. AI search crawlers fetch these to understand the site's content map.

### 7. Brave Search Goggles, Kagi, You.com
Niche AI engines. Submit your sitemap to Brave Search at `search.brave.com/help/webmaster`. Kagi pulls from Google. You.com has its own crawler — visit `you.com/webmaster` if available.

### 8. ChatGPT browse + Perplexity citation tracking
Once a month, search Perplexity/ChatGPT/Claude/Bing Copilot for your target queries. Note which pages get cited. This tells you which AEO tactics work.

---

## Submission process (per new page)

Every time you publish a new pillar or blog post:

1. **Build pipeline auto-runs:**
   - URL gets added to `dist/sitemap.xml` (already wired via `scripts/sitemap.mjs` — make sure new URLs are in `scripts/sitemap-routes.json`)
   - URL gets pinged to IndexNow → Bing + Yandex (already wired via `scripts/indexnow.mjs`)
   - llms-full.txt gets regenerated (already wired)

2. **Manual GSC submission (10 sec per URL):**
   - https://search.google.com/search-console
   - "URL Inspection" → paste new URL → "Request indexing"
   - Free quota: ~10/day per property. Spread launches across days.

3. **Manual Bing Webmaster submission:**
   - https://www.bing.com/webmasters
   - "URL submission" → paste up to 100 URLs/day. Bing gives a much higher quota than Google.

4. **Wait 24-48h then check:**
   - GSC → "Coverage" → URL should show "Submitted and indexed"
   - Google search `site:onrol.in/your-new-url/` — should show the page

5. **After 2 weeks:**
   - GSC → "Performance" → check if the page is getting impressions for target queries
   - If no impressions: page isn't competitive enough. Add more content / FAQs / internal links.

---

## Tracking spreadsheet (recommended)

Create a Google Sheet with columns:

| Phrase | Cluster | Target Page | Tier | Page Status | First-indexed | Rank Day-7 | Rank Day-30 | Rank Day-90 | Notes |
|---|---|---|---|---|---|---|---|---|---|

Update monthly. Phrases that drop in rank get a "refresh" task. Phrases that hit page 1 get an "expansion" task (more long-tail variations).

---

## Budget reality check

- **20 P0 + P1 pages × ~3-6 hours each = 80-120 hours of content + design work.**
- **40 P2 blog posts × ~2 hours each = 80 hours.**
- **Total: ~200 hours over 3 months for full deployment.**

If you're producing alone: 2-3 hours/day = 3-4 months.

If you hire a content writer at ₹500-1000/hour (Indian market rates for skilled SEO writers):
- ₹500/hour × 200 hours = **₹1,00,000** for full deployment.
- Or split: I generate 80% of content here, you/writer polish & add brand voice = **₹40,000-60,000**.

---

## Order of operations — what to do this week

1. **Approve the cluster + pillar list above** (or tell me to adjust)
2. I write **`/best-ai-institutes-in-india/`** as the first P0 pillar — full content, comparison table, FAQ, schema. Ship it.
3. I write **`/top-vibe-coding-training-india/`** — same depth. Ship it.
4. Add both to `scripts/sitemap-routes.json` + `scripts/prerender-routes.json`. Build + deploy.
5. You request indexing in GSC + Bing.
6. We measure rank in 2 weeks.
7. If they hit page 1 (or top 20), we replicate the formula for the rest of P0.
8. If they don't, we diagnose what's missing before producing more pages.

**This is incremental — we don't ship 20 pages at once. We ship 2, learn, then ship more.**
