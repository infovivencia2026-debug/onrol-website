# ONROL — AI-Search Visibility Execution Plan

**Owner:** Dr. Neeraja Reddy / ONROL team
**Build assist:** Claude Code (this assistant)
**Started:** 2026-05-02
**Goal:** ONROL appears in ChatGPT Search, Perplexity, Google AI Overviews, Bing Copilot for "best AI course India / practical AI course / AI execution school" and 100+ adjacent queries.

**Brand line (use everywhere):**
> ONROL — India's AI Execution School.
> IIT teaches you what AI is. ONROL teaches you what to do with AI.

---

## Phase status legend
- ✅ done · 🟡 in-progress · ⬜ not started · 🔒 blocked on user

---

## Phase 0 — Critical: Prerendering (without this nothing works)

**Why:** onrol.in is a Vite SPA. AI crawlers (ChatGPT/Perplexity/Claude bots) don't reliably execute JavaScript, so they see an empty `<div id="root"></div>`. Without prerendering, every page below is **invisible** to AI search.

- 🟡 Add Puppeteer-based prerender pass to `npm run build` (writes static HTML for marketing routes after Vite build)
- 🟡 Prerender these routes initially: `/`, `/programs`, `/programs/ai-generalist`, `/programs/ai-orchestrator`, `/preview/a`, `/preview/b`, `/preview/c`
- 🟡 Easy to add more routes later via a single config array

## Phase 1 — Foundation infrastructure (Week 1)

- 🟡 `public/robots.txt` whitelists every relevant bot: OAI-SearchBot, ChatGPT-User, GPTBot, PerplexityBot, Perplexity-User, ClaudeBot, anthropic-ai, GoogleOther, AppleBot-Extended, CCBot, Amazonbot
- 🟡 `public/llms.txt` (short index for agents)
- 🟡 `public/llms-full.txt` (full markdown of public content for agent ingestion)
- 🟡 Dynamic `sitemap.xml` (built each deploy)
- 🟡 `<SEO>` component (title, meta, OG, Twitter, canonical, hreflang en-IN, JSON-LD slot)
- 🟡 `<FAQ>` component (auto-emits FAQPage schema)
- 🟡 `<BreadcrumbTrail>` (auto-emits BreadcrumbList schema)
- 🟡 Global JSON-LD on `/`: `Organization`, `EducationalOrganization`, `WebSite` (with `SearchAction` for sitelinks search box)
- 🟡 `hreflang en-IN` on every page

## Phase 2 — Content backbone (Weeks 2–3)
10 pillar pages + 15 blog posts. Each: SSR-ready, JSON-LD, breadcrumbs, FAQ schema, internal links, named-author E-E-A-T (founder bio).

Pillar pages:
- ✅ `/ai-execution-school/`
- ✅ `/best-ai-course-in-india/`
- ✅ `/academic-ai-vs-applied-ai/`
- ✅ `/ai-course-for-beginners/`
- ✅ `/ai-course-for-students/`
- ✅ `/ai-course-for-working-professionals/`
- ✅ `/ai-course-for-freelancers/`
- ✅ `/ai-course-for-business-owners/`
- ✅ `/ai-course-for-content-creators/`
- ✅ `/ai-automation-course/`

All pillars are prerendered, in sitemap, FAQ schema'd, breadcrumbed, founder-credited, internally linked. Edit content via `src/lib/pillarContent.ts`. Founder bio + photo placeholder via `src/lib/founder.ts` — drop final photo at `public/founder-neeraja-reddy.jpg` when ready.

Blog posts (Week 3):
- ✅ best-ai-course-in-india-for-beginners
- ✅ best-ai-course-for-students-in-india
- ✅ how-to-learn-ai-without-coding
- ✅ ai-skills-every-student-should-learn
- ✅ best-ai-course-for-working-professionals
- ✅ best-ai-course-for-freelancers
- ✅ how-to-earn-money-using-ai
- ✅ best-ai-automation-course-in-india
- ✅ ai-tools-for-business-owners
- ✅ best-ai-course-for-content-creators
- ✅ how-to-grow-instagram-using-ai
- ✅ how-to-grow-youtube-using-ai
- ✅ how-to-grow-linkedin-using-ai
- ✅ best-ai-course-for-teachers
- ✅ academic-ai-vs-applied-ai-which-to-pick

All 15 blogs are prerendered, in sitemap, with Article + FAQ + Breadcrumb + Person JSON-LD. Edit content via `src/lib/blogContent.ts`. Index page at `/blog/` with category filtering.

Founder updated: **Dr. Neeraja Reddy** (initials NR). Drop final 1200×1200 photo at `public/founder-neeraja-reddy.jpg` to swap the avatar everywhere.

## Phase 3 — Original data/research (Weeks 3–4)
Single biggest AI-citation magnet.

- ⬜ `/research/state-of-ai-adoption-india-2026`
- ⬜ `/research/100-indie-ai-builder-toolstack`
- ⬜ `/research/zero-to-ai-builder-path-length`
- 🔒 USER: 50-person survey results
- 🔒 USER: cohort metrics from ONROL records

## Phase 4 — YouTube channel as citation source (Week 4)
*ChatGPT cites YouTube ~30% of the time for "best course" queries.*

- ⬜ 30 video titles + descriptions + tags drafted by Claude
- ⬜ Each YouTube description deep-links onrol.in?utm_source=youtube
- ⬜ VideoObject + transcript schema on embedded videos
- 🔒 USER: record videos (3/week × 10 weeks)

## Phase 5 — Third-party authority signals (Weeks 5–6)
**Cannot be automated. User must register on each.**

- 🔒 Wikipedia/Wikidata draft entity (Claude drafts, user submits)
- 🔒 YourStory founder feature pitch
- 🔒 Inc42 listing
- 🔒 Entrackr listing
- 🔒 Tracxn listing
- 🔒 CourseReport
- 🔒 SwitchUp
- 🔒 AmbitionBox company profile
- 🔒 Crunchbase
- 🔒 LinkedIn company page + 4 founder articles
- 🔒 Google Business Profile
- 🔒 Bing Places
- 🔒 Quora Space (own "AI Education India")
- 🔒 Reddit: 20 genuine answers on r/IndiaCareers, r/learnmachinelearning, r/India
- 🔒 Medium publication
- 🔒 Substack newsletter

## Phase 6 — Tools / calculators (Week 7)
- ⬜ `/tools/ai-roi-calculator` (SMB savings calc)
- ⬜ `/tools/ai-skills-quiz` (15 Q → persona + path)
- ⬜ `/tools/free-ai-prompt-generator`
- ⬜ `/tools/ai-toolstack-picker`

## Phase 7 — Glossary (Week 7–8)
50 entries at `/glossary/<term>` with `DefinedTerm` schema.

## Phase 8 — Press kit + journalist enablement (Week 8)
- ⬜ `/press` page (founder bio, photos, brand assets, releases)
- ⬜ Press release via PRLog + EIN Presswire
- ⬜ 5 pitch templates
- 🔒 USER: 5 photos (founder, workshop, students, whiteboard, group)

## Phase 9 — Comparison pages vs competitors (Week 9)
12 auto-generated comparison pages (vs Scaler, GreatLearning, UpGrad, Simplilearn, Coursera, Newton School, Masai, Outscal, CrushKaTrack, YouTube, ChatGPT-only, Coding Ninjas).

## Phase 10 — Monitoring + iteration (continuous)
- ⬜ `/admin/seo` dashboard with GSC + ChatGPT/Perplexity referrals + manual AI Overview checks
- ⬜ Weekly SerpAPI sweep of top 100 queries

---

## Files I should never forget to update

When adding a new page, update ALL of these:
1. `scripts/prerender-routes.json` — add new route here
2. `scripts/sitemap-routes.json` — add new route here (with priority + changefreq)
3. `src/components/Navbar.tsx` — link in nav if marketing-tier
4. Internal linking block in 3 nearest pillar pages
5. `EXECUTION_PLAN.md` — flip status to ✅

## Brand voice rules

- Indian market friendly, professional, direct, NOT hype-heavy
- AVOID: "guaranteed job", "guaranteed income", "better than IIT", fake numbers, fake testimonials
- USE NATURALLY: "India's AI Execution School", "practical AI skills", "AI tools", "AI automation", "AI workflows", "AI agents", "portfolio projects"
- Comparison framing is **academic AI vs applied AI**, not "ONROL beats IIT"

## User-side blocked items (founder must do)

| # | Item | Phase blocked |
|---|---|---|
| 1 | Founder bio (200-300 words) + 1200×1200 photo | Phase 2 (E-E-A-T) |
| 2 | 5 student projects (name + project + deploy URL + screenshot 1280×800) | Phase 2 |
| 3 | Run 50-person survey (Claude drafts the questions) | Phase 3 |
| 4 | Pull cohort metrics (avg time-to-first-deploy, etc) | Phase 3 |
| 5 | Record 30 short videos (3/week × 10 weeks) | Phase 4 (highest leverage) |
| 6 | Sign up + paste content into 16 third-party platforms | Phase 5 |
| 7 | 5 press-kit photos | Phase 8 |
| 8 | Founder name, photo, WhatsApp number for "Talk to founder" pill (older todo) | Site-wide |

---

## Tech stack notes
- Vite + React Router (SPA)
- Tailwind CSS
- Supabase auth
- Hosted on OpenLiteSpeed at `/home/onrol.in/public_html`
- Deployed via `bash scripts/deploy.sh` (tars dist/ + rsync to VPS)
- Build: `npm run build`
- Decision: **prerender** (Puppeteer post-build) over Next.js migration

## Tracking metrics (Phase 10 dashboard)
- Google Search Console — impressions/clicks per pillar page
- ChatGPT referrals — `?utm_source=chatgpt.com` query-string
- Perplexity referrals — Referer: perplexity.ai
- Bing/Copilot referrals
- Manual AI Overview spot-checks logged in `/admin/seo`
