# SEO Agent Master — the 21st tool at tools.onrol.in

## Product vision in one line

**A unified admin dashboard that runs 4 SEO/AI-visibility agents on autopilot, surfaces opportunities for human approval, and tracks ONROL's citation rate across ChatGPT / Claude / Gemini / Perplexity over time.**

Productised at `tools.onrol.in/seo-agent-master/`. Admin-only (ONROL team), not a learner-facing tool — because the actions it triggers (publishing to Medium, drafting outreach, posting to Quora) need accountability.

## The 4 agents inside it

| # | Agent | What it does | Human-in-the-loop? |
|---|---|---|---|
| **1** | **Link Hunter** | Daily scan for backlink opportunities: competitor mentions, unlinked brand mentions, broken links, HARO/Featured queries, Reddit/Quora threads. Drafts a personalised outreach pitch for each. | Yes — humans approve + send |
| **3** | **Syndicator** | When a new ONROL blog post goes live, auto-publish to Medium / dev.to / Hashnode with canonical tags. LinkedIn + Substack drafts saved for manual review. | Partial — LinkedIn manual |
| **4** | **Quora Scout** | Polls Quora India for relevant new questions. AI drafts a substantive answer (1000+ words). Drops in the dashboard inbox. | Yes — humans approve + post |
| **5** | **Engine Watch** | Weekly: queries 50 target prompts across ChatGPT, Claude, Gemini, Perplexity. Logs whether ONROL is cited. Plots citation rate over time. Flags queries where ONROL is missing. | No — fully automated reporting |

## Why this is a real product, not just a script

- **Compounding value** — every agent's output gets better as data accumulates
- **Defensible advantage** — by month 6, ONROL has data no competitor has (citation rate per query, backlink win rate, syndication CTR)
- **Reusable infra** — once built, can be productised later for other Indian edtech brands (B2B SaaS opportunity)
- **Showcases ONROL's own AI capability** — eats own dog food. Founders building AI tools = strongest credibility signal

## Information architecture

```
tools.onrol.in/seo-agent-master/
│
├─ /                      Dashboard — KPIs + recent activity
├─ /citations             Engine Watch — citation tracker results, charts
│   └─ /run/:runId        Drill into a specific weekly run
│
├─ /syndications          Syndicator — publish log + manual trigger
│   └─ /:blogSlug         Per-post syndication detail
│
├─ /quora                 Quora Scout — drafts inbox
│   ├─ /:draftId          Review + edit individual draft
│   └─ /post              Mark drafts as posted (paste live URL)
│
├─ /backlinks             Link Hunter — opportunity pipeline (kanban)
│   ├─ /:opportunityId    Drill into single opportunity + outreach
│   └─ /pitch             Bulk send approved outreach emails
│
├─ /settings              Config: API keys, schedule, target prompts list
│   ├─ /apis              Manage Anthropic, OpenAI, Gemini, Perplexity, Medium, etc. keys
│   ├─ /prompts           Edit the 50 target prompts used by Engine Watch
│   ├─ /sources           Manage the data sources Link Hunter scans
│   └─ /schedule          Cron schedule + manual triggers
│
└─ /logs                  Audit log — every agent run, success/fail, timing
```

## Dashboard mockup (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SEO Agent Master                                          ⚙ Settings ▼   │
│ Mon 18 May 2026 · Citation rate: 18% (↑3% WoW) · 7 alerts                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │  ENGINE WATCH    │  │   SYNDICATOR     │  │  QUORA SCOUT     │     │
│  │                  │  │                  │  │                  │     │
│  │  18% citation    │  │  31 published    │  │  6 drafts        │     │
│  │  rate (last 7d)  │  │  this month      │  │  awaiting review │     │
│  │                  │  │                  │  │                  │     │
│  │  ▁▂▃▅▆▇▆█      │  │  Medium: 100% OK │  │  Last drafted:   │     │
│  │                  │  │  dev.to: 100% OK │  │  4 hours ago     │     │
│  │  ChatGPT: 22%    │  │  Hashnode: 100%  │  │                  │     │
│  │  Claude:  16%    │  │  LinkedIn: 8 mn  │  │  [Review queue] │     │
│  │  Gemini:  19%    │  │  draft pending   │  │                  │     │
│  │  PPLX:    14%    │  │                  │  │                  │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  LINK HUNTER — 23 open opportunities                            │   │
│  │                                                                  │   │
│  │  Discovered  | Drafted  | Contacted | Responded | Won   | Lost │   │
│  │     14            6          3            0         0      0    │   │
│  │                                                                  │   │
│  │  [▎▎▎▎▎▎▎▎▎▎▎▎▎▎] [▎▎▎▎▎▎] [▎▎▎]                            │   │
│  │                                                                  │   │
│  │  Top opportunities today:                                        │   │
│  │  • analyticsinsight.net "Best AI courses India 2026" — 91/100   │   │
│  │  • Reddit r/developersIndia "Where to learn AI..." — 87/100     │   │
│  │  • shiksha.com unlinked ONROL mention — 84/100                  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │  RECENT ACTIVITY (last 24h)                                      │   │
│  │  10:42  Engine Watch run completed (50 queries, 18% citation)   │   │
│  │  09:15  Syndicator published top-ai-tools-india-2026 to Medium  │   │
│  │  09:15  Syndicator published top-ai-tools-india-2026 to dev.to  │   │
│  │  07:00  Quora Scout discovered 3 new questions, drafted answers │   │
│  │  06:30  Link Hunter scan found 5 new opportunities              │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Run all agents now]  [View audit log]                                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | React + Tailwind (same stack as ONROL) | Reuse existing components, ship fast |
| **Hosting** | tools.onrol.in subdomain | Already exists, ONROL learners know the brand |
| **Database** | Supabase (community instance, service-role for agents) | Already deployed |
| **Auth** | Existing ONROL admin auth (reuse `admins` table check) | Don't reinvent |
| **Agent runtime** | Node scripts on VPS cron, OR n8n workflows | n8n already running on VPS — easier audit log |
| **LLM clients** | Anthropic, OpenAI, Google AI Studio, Perplexity SDKs (or raw fetch) | Already partly written in `scripts/agents/_shared.mjs` |
| **Email outreach** | Resend or Postmark (transactional, not bulk) | Stays in deliverability good books |
| **External APIs** | SerpAPI, Reddit API, Hashnode GraphQL, dev.to REST, Medium REST | All have free or low-cost tiers |

## What's already done (this session)

- ✅ Supabase migration: `supabase/migrations/20260518_seo_agents.sql` (5 tables: opportunities, syndications, quora_drafts, citation_runs, citation_results)
- ✅ Shared helpers: `scripts/agents/_shared.mjs` (env loader, Supabase client, LLM wrappers for Claude/OpenAI/Gemini/Perplexity, dry-run guard, logging)

## Build sequence (proposed)

### Phase 1 — Agent backends (week 1)

Build the 4 Node scripts that DO the work. No UI yet. Each runs standalone.

1. `scripts/agents/engine-watch.mjs` — run weekly, queries 4 LLMs, writes to `citation_runs` + `citation_results`
2. `scripts/agents/syndicator.mjs` — runs per-new-blog, publishes to Medium/dev.to/Hashnode
3. `scripts/agents/quora-scout.mjs` — runs daily, finds new Quora India questions, drafts answers
4. `scripts/agents/link-hunter.mjs` — runs daily, multi-source scan, drafts pitches

Output for v1: just write to Supabase tables. Read with SQL until UI exists.

### Phase 2 — n8n workflows (week 1, parallel)

For each agent, an n8n workflow that:
- Triggers on cron (daily/weekly)
- Runs the Node script via `Execute Command` node
- Logs run status to Supabase
- Sends Telegram/email alert if a run fails

### Phase 3 — Admin dashboard UI (weeks 2–3)

Build the React app at `tools.onrol.in/seo-agent-master/` per the IA above.

- Dashboard (KPI cards + recent activity feed)
- Engine Watch (chart + drill into runs)
- Syndicator (log + retry failed)
- Quora Scout (inbox + approval flow)
- Link Hunter (kanban + outreach send)
- Settings

Reuse existing ONROL admin patterns (the community admin at `/community/admin` is a working example).

### Phase 4 — Outreach integration (week 4)

- Wire Resend/Postmark for outreach emails
- Click-to-send from Link Hunter cards
- Reply tracking (inbound webhook from email provider)

### Phase 5 — Telemetry + iteration (ongoing)

- Citation rate dashboard improves monthly
- Win rate tracking on Link Hunter
- A/B test outreach pitches
- Tune target prompts list based on what's converting

## Realistic cost

| Item | Monthly |
|---|---|
| Anthropic API (Claude — Quora drafts + Engine Watch) | ₹500–₹1,500 |
| OpenAI API (GPT-5 — Engine Watch + outreach drafts) | ₹500–₹1,500 |
| Google AI Studio (Gemini — Engine Watch) | ₹0 (free tier) |
| Perplexity API (Engine Watch) | ₹1,500 |
| SerpAPI (Link Hunter — competitor scans) | ₹4,000 |
| Resend/Postmark (outreach emails) | ₹0–₹800 |
| Medium / dev.to / Hashnode APIs | ₹0 (free) |
| n8n VPS overhead | ₹0 (already running) |
| **Total** | **₹6,500–₹9,300/month** |

Compare with: hiring an SEO outreach specialist in India = ₹40,000–₹80,000/month. Agent does 10× the volume at 1/8th the cost. Humans focus on approval + relationship.

## Open product questions for you

1. **Admin access:** restrict to specific email addresses (you, Dr. Neeraja, ops lead) or any user in the `admins` table?
2. **Engine Watch frequency:** weekly (default) or daily? Daily is more API spend but tighter feedback loop.
3. **Quora Scout posting:** approve-and-post-via-API, or approve-and-export-text for manual posting (Quora API is restrictive — manual is safer).
4. **Link Hunter outreach sending:** send-from-team-mailbox via Resend, or hand off as a Notion/Airtable task for a human to send?
5. **Public-facing version someday?** If ONROL ever wants to sell this as a B2B tool to other Indian edtechs, the architecture should be multi-tenant from day 1. Easier to design now than retrofit.

## What I can ship in the next session

**Option A:** Phase 1 + Phase 2 (agents back-end + n8n) — 4 working scripts that run on cron and write to Supabase. No UI yet but data starts flowing.

**Option B:** Phase 1 (Engine Watch only, fully working) + Phase 3 (UI shell only, all 4 panels in place but only Engine Watch hooked up).

**Option C:** Just Phase 1 (Engine Watch) end-to-end — script + n8n cron + minimal admin page. Most concrete deliverable in one session.

**Recommended: Option C.** Ship one agent end-to-end as the foundation, then add the others as separate releases.
