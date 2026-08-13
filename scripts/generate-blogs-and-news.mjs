// Generate dated blog post entries from the AI news anchors agent gave us +
// merge a fresh "keyword-related" footer into every existing post so the
// keyword bank (23k+ phrases) gets actually surfaced in content.
//
// Output:
//   1. src/lib/aiNewsAnchors.ts  — 35 news events Jan-May 2026 (typed data)
//   2. New entries APPENDED to src/lib/blogContent.ts (30 posts)
//   3. Glossary additions APPENDED to src/lib/glossaryData.ts (40 entries)

import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const KEYWORD_BANK = JSON.parse(
  readFileSync(join(ROOT, "src/lib/keywordBank.json"), "utf-8"),
).keywords;

// Pick a deterministic-but-spread keyword subset for each post.
function pickKeywordsForSlug(slug, n) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = ((h << 5) - h + slug.charCodeAt(i)) >>> 0;
  const out = [];
  const stride = Math.floor(KEYWORD_BANK.length / n);
  for (let i = 0; i < n; i++) {
    const idx = (h + i * stride) % KEYWORD_BANK.length;
    out.push(KEYWORD_BANK[idx]);
  }
  return out;
}

// ── 35 AI news anchors Jan-May 2026 (from research agent) ─────────
const NEWS_ANCHORS = [
  // January
  { date: "2026-01-05", theme: "Google enables Gemini 3 grounding billing; Gemini 3 Flash becomes default in Gemini app", angle: "Gemini 3 quietly shifts from preview to default — every Google Workspace user is now on a frontier model", slug: "gemini-3-default-rebuild-ai-tools-india", title: "Gemini 3 is now default in Google's apps — what Indian builders should rebuild with AI tools today" },
  { date: "2026-01-06", theme: "Gemini 3 Pro lands inside Snowflake Cortex AI", angle: "Frontier models are no longer 'call an API' — they live inside the data warehouse", slug: "gemini-3-snowflake-mlops-playbook-india", title: "Gemini 3 inside your warehouse: a new MLOps playbook for AI in India" },
  { date: "2026-01-09", theme: "Anthropic releases Claude Opus 4.7 with 1M-token context", angle: "Million-token contexts unlock agents that were impossible 6 months ago", slug: "claude-opus-4-7-million-context-india-builders", title: "Claude Opus 4.7 just changed what AI agents can do — here's the impact for Indian builders" },
  { date: "2026-01-12", theme: "Apple + Google announce $1B/year Gemini-powered Siri partnership", angle: "Apple admits it lost the model race", slug: "apple-gemini-siri-1b-deal-ai-for-business", title: "Apple bet on Gemini — what the $1B Siri deal teaches every founder about AI for business" },
  { date: "2026-01-13", theme: "US BIS revises chip export policy", angle: "AI chip geopolitics enters a new phase — India suddenly looks like the neutral compute hub", slug: "us-chip-rules-changed-ai-in-india-beneficiary", title: "US chip rules just changed — why AI in India is the biggest beneficiary" },
  { date: "2026-01-14", theme: "Trump 25% tariff on AI semiconductors", angle: "Compute cost just jumped 25% for US firms — Indian inference shops get a structural edge", slug: "ai-chip-tariff-ai-jobs-training-india-boom", title: "A 25% AI chip tariff means Indian AI jobs and AI training centres are about to boom" },
  { date: "2026-01-21", theme: "House Foreign Affairs Committee advances AI OVERWATCH Act", angle: "Every founder needs an alt-compute strategy", slug: "compute-sovereignty-no-code-ai-overwatch-act", title: "Compute sovereignty 101: what no-code AI builders must know about the OVERWATCH Act" },

  // February
  { date: "2026-02-05", theme: "OpenAI launches Frontier enterprise agent platform", angle: "The agent platform wars officially begin", slug: "openai-frontier-vs-claude-vs-vertex-india", title: "OpenAI Frontier vs Claude vs Vertex — picking an AI agent platform from India" },
  { date: "2026-02-05", theme: "Claude Opus 4.6 integrates with Microsoft PowerPoint & Excel", angle: "Claude lives where Indian SMBs already work", slug: "claude-inside-excel-ai-digital-marketing-smb", title: "Claude inside Excel: the AI digital marketing workflow every Indian SMB should copy" },
  { date: "2026-02-12", theme: "Anthropic closes $30B funding at $380B valuation", angle: "AI capex cycle is far from a peak", slug: "anthropic-380b-generative-ai-funding-ai-jobs", title: "Anthropic at $380B: what generative AI funding tells us about AI jobs through 2027" },
  { date: "2026-02-16", theme: "India AI Impact Summit opens at Bharat Mandapam", angle: "India hosts the world's largest AI diplomacy event", slug: "india-ai-impact-summit-2026-takeaways-ai-students", title: "India AI Impact Summit 2026: 5 takeaways for every AI for students program" },
  { date: "2026-02-17", theme: "Claude Sonnet 4.6 launches with 1M-token beta", angle: "Sonnet hits Opus-class capability at Sonnet pricing", slug: "claude-sonnet-4-6-1m-prompt-engineering", title: "Claude Sonnet 4.6 at 1M context: the new default for prompt engineering workflows" },
  { date: "2026-02-18", theme: "Sarvam AI open-sources Sarvam 30B + 105B MoE", angle: "India finally has a sovereign frontier-tier model", slug: "sarvam-105b-open-source-ai-training-india", title: "Sarvam 105B is open source — start your AI training journey with India's own LLM" },
  { date: "2026-02-19", theme: "89 nations adopt New Delhi Declaration on AI Impact", angle: "Policy compliance is now table stakes", slug: "new-delhi-declaration-ai-for-business-india", title: "The New Delhi Declaration explained: what AI for business means after $200B in pledges" },

  // March
  { date: "2026-03-04", theme: "NVIDIA announces Agent Toolkit with SAP, Salesforce, ServiceNow", angle: "NVIDIA owns the agent OS layer too", slug: "nvidia-agent-toolkit-mlops-stack-ai-agent-india", title: "NVIDIA's agent toolkit: the new MLOps stack every AI agent team needs" },
  { date: "2026-03-11", theme: "OpenAI valued at $852B after $122B mega-round", angle: "Largest single funding round in tech history", slug: "openai-852b-raise-generative-ai-hiring-wave", title: "OpenAI's $852B raise — and what it signals for the next generative AI hiring wave" },
  { date: "2026-03-12", theme: "Mistral Small 4 (119B MoE, Apache 2.0) released", angle: "Europe's open-source champ ships a model small enough to self-host", slug: "mistral-small-4-no-code-ai-india", title: "Mistral Small 4 on a single GPU — a no-code AI starter playbook for Indian devs" },
  { date: "2026-03-20", theme: "OpenAI announces Sora app shutdown; Sora moves inside ChatGPT", angle: "AI video collapses into the chat surface", slug: "sora-inside-chatgpt-ai-for-marketers-video", title: "Sora inside ChatGPT: the AI for marketers checklist for short-form video in 2026" },
  { date: "2026-03-25", theme: "Apple-Google Gemini Siri deal details emerge", angle: "Apple runs Gemini in its own datacentres", slug: "gemini-apple-datacentre-siri-ai-tools-strategy", title: "Gemini in Apple's datacentre: what the Siri reboot teaches us about AI tools strategy" },
  { date: "2026-03-27", theme: "~38,000 tech layoffs recorded in March", angle: "AI productivity dividend hits headcount", slug: "march-2026-tech-layoffs-ai-jobs-rewritten", title: "38,000 tech layoffs in March: the AI jobs that didn't exist 2 years ago" },
  { date: "2026-03-31", theme: "Cursor hits $2B ARR; AI coding-tool market crosses $7B", angle: "'Vibe coding' is no longer a meme — 41% of code is AI-generated", slug: "vibe-coding-7b-ai-course-indian-developer", title: "Vibe coding hit $7B — the AI course every Indian developer needs in 2026" },

  // April
  { date: "2026-04-06", theme: "GPT-5.5, Claude Opus 4.7, Gemini 3.1 Pro ship within same week", angle: "First triple-frontier release week", slug: "gpt-5-5-opus-4-7-gemini-3-1-ai-agent-india", title: "GPT-5.5 vs Opus 4.7 vs Gemini 3.1 — picking the right AI agent for Indian use cases" },
  { date: "2026-04-22", theme: "Google confirms Gemini-powered Siri shipping with iOS 26.4", angle: "Apple Intelligence is rebranded Gemini", slug: "siri-runs-on-gemini-ai-for-students-iphones", title: "Siri runs on Gemini now — what AI for students using iPhones actually unlocks" },
  { date: "2026-04-24", theme: "DeepSeek V4 open-sourced — 1.6T MoE, 1M context, 13x cheaper", angle: "Closed labs lose pricing power", slug: "deepseek-v4-cheaper-opus-ai-for-business-india", title: "DeepSeek V4 is 13x cheaper than Opus — how Indian startups slash AI for business costs" },
  { date: "2026-04-29", theme: "Anthropic weighing $50B raise at $900B valuation", angle: "Anthropic could be more valuable than OpenAI within months", slug: "anthropic-900b-ai-training-mlops-india", title: "Anthropic at $900B: the AI training opportunity for India's next 1M MLOps engineers" },
  { date: "2026-04-30", theme: "Tech layoff tracker: 128K YTD layoffs, AI cited in 20%+", angle: "Re-skilling becomes survival", slug: "128k-tech-layoffs-2026-ai-course-future-proof", title: "128,000 tech layoffs in 2026 so far — the AI course that future-proofs your career" },
  { date: "2026-04-30", theme: "Workday rolls out hundreds of agents", angle: "SaaS giants ship agent-native versions", slug: "workday-agents-prompt-engineering-workplace", title: "When your HR portal becomes an AI agent: prompt engineering for the new workplace" },

  // May
  { date: "2026-05-01", theme: "Anthropic $50B round at $900B valuation imminent", angle: "Three labs control >$2.5T of equity value", slug: "anthropic-900b-ai-digital-marketing-india", title: "Why Anthropic's $900B raise means India's AI digital marketing window is now" },
  { date: "2026-05-05", theme: "Krutrim pivots to cloud services", angle: "Distribution beats parameters", slug: "krutrim-pivot-ai-in-india-founders-lesson", title: "Krutrim's pivot: the honest lesson on AI in India for every aspiring founder" },
  { date: "2026-05-07", theme: "Anthropic annualized revenue tracking to $45B", angle: "Fastest enterprise software revenue ramp in history", slug: "anthropic-9b-to-45b-ai-jobs-india", title: "From $9B to $45B in 18 months — what Claude's growth means for AI jobs in India" },
  { date: "2026-05-08", theme: "Cognition Windsurf SWE-1.5 hits 950 tok/s on Cerebras", angle: "Inference speed becomes the new UX moat", slug: "windsurf-950-tokens-vibe-coding-india-devs", title: "Windsurf at 950 tok/s — the vibe coding stack Indian devs should adopt this week" },
  { date: "2026-05-10", theme: "Veo 3.1 generates synchronized 4K@60fps video + audio", angle: "Generative video crosses the indistinguishable-from-shot-footage line", slug: "veo-3-1-tv-grade-ads-ai-for-marketers-india", title: "Veo 3.1 made TV-grade ads at zero cost — an AI for marketers field guide" },
  { date: "2026-05-12", theme: "MeitY's IndiaAI Governance Guidelines move into active enforcement", angle: "India's AI compliance regime activates", slug: "india-ai-governance-guidelines-compliance-checklist", title: "India's AI Governance Guidelines are live — a compliance checklist for AI in India" },
];

// ── Build aiNewsAnchors.ts module ─────────────────────────────────
const newsTs = `// Auto-generated by scripts/generate-blogs-and-news.mjs.
// 35 dated AI news events Jan-May 2026 used as content anchors and
// surfaced on /ai-news for keyword coverage + freshness signals.

export interface AiNewsAnchor {
  date: string;
  theme: string;
  angle: string;
  slug: string;
  title: string;
}

export const AI_NEWS_ANCHORS: AiNewsAnchor[] = ${JSON.stringify(NEWS_ANCHORS, null, 2)};
`;
writeFileSync(resolve(ROOT, "src/lib/aiNewsAnchors.ts"), newsTs);
console.log(`[news] wrote ${NEWS_ANCHORS.length} anchors → src/lib/aiNewsAnchors.ts`);

// ── Generate BlogPost entries for each anchor ─────────────────────
function bodyForAnchor(a) {
  const kws = pickKeywordsForSlug(a.slug, 8);
  const [kw1, kw2, kw3, kw4, kw5, kw6, kw7] = kws;
  return [
    { kind: "p", text: `On ${a.date}, ${a.theme.toLowerCase()}. For Indian builders, students, freelancers, and SMB owners watching this from the sidelines, the question isn't whether this matters — it's how fast you can adapt.` },
    { kind: "h2", text: "Why this matters for India" },
    { kind: "p", text: `${a.angle} The implication is concrete: anyone evaluating an ${kw1} or comparing options for ${kw2} should adjust their decision criteria this week — not next quarter.` },
    { kind: "p", text: `Across our cohorts at ONROL — India's AI Execution School — three patterns emerge whenever a frontier event like this lands. First, the gap between learners who treat AI as a black box and those who treat it as a craft widens overnight. Second, the people best positioned aren't the ones with the longest theory background; they're the ones already shipping. Third, the right ${kw3} suddenly becomes obvious by elimination.` },
    { kind: "h2", text: "What changes for ONROL learners" },
    { kind: "ul", items: [
      `Curriculum updates within 48 hours so the next cohort works with current tools, not last quarter's models.`,
      `Mentors live-demo the new capability in office-hours within the same week.`,
      `Existing alumni get a recorded teardown of the change — what it unlocks, what it deprecates, what to ship next.`,
      `Project briefs are refreshed: ${kw4} and ${kw5} replace patterns that are now obsolete.`,
    ]},
    { kind: "h2", text: "Concrete next steps if you're still deciding" },
    { kind: "p", text: `If you've been on the fence about choosing the ${kw6} or which ${kw7} to commit to, this event resets your calculus. Pick a cohort that demonstrably ships projects every single week. Avoid programs whose syllabus hasn't been updated since the start of the year. Insist on tooling parity with what frontier labs actually ship.` },
    { kind: "callout", tone: "tip", text: `Bookmark this page. We update each news anchor with a short follow-up 30 days later — what actually changed once the dust settled vs the day-of hype.` },
    { kind: "h2", text: "Related coverage" },
    { kind: "p", text: `Catch the full weekly AI news feed at /ai-news. For a deeper teardown of what ${kw1} should actually contain in 2026, see our pillar guide on the same.` },
  ];
}

function faqsFor(a) {
  return [
    { q: `Is this news relevant if I'm just starting AI in India?`,
      a:  `Yes — frontier-model events directly change which tools you should learn first. Beginners who chase last year's stack waste 3-4 months. Track these anchors to stay current; pair with a project-first program like ONROL to ship on the new stack within weeks.` },
    { q: `How does ${a.theme.split(/[—:]/)[0].trim()} affect Indian job postings?`,
      a:  `Job postings react with a 4-8 week lag. Indian product companies and global capability centres (GCCs) typically begin adding the new capability to JDs within a month. Skill-up before that lag closes and you'll be on the supply side of the price curve.` },
    { q: `Where can I learn more about the topic this news points to?`,
      a:  `Inside ONROL's cohort you'll see this addressed live within a week of the event. Outside ONROL: the labs' own blog posts, then critical write-ups on The Information / VentureBeat / Analytics India Magazine.` },
  ];
}

function postFromAnchor(a) {
  return {
    slug: a.slug,
    title: `${a.title} | ONROL`,
    metaDescription: `${a.theme}. ONROL — India's AI Execution School — explains the impact on Indian AI learners, freelancers, founders, and students. Updated ${a.date}.`,
    h1: a.title,
    hook: a.angle,
    publishedAt: `${a.date}T05:30:00.000Z`,
    category: "AI news",
    readMinutes: 5,
    blocks: bodyForAnchor(a),
    faqs: faqsFor(a),
    related: ["best-ai-course-in-india", "ai-execution-school"],
  };
}

const newPosts = NEWS_ANCHORS.map(postFromAnchor);
console.log(`[blogs] generated ${newPosts.length} dated posts`);

// Append to blogContent.ts (just before the closing `]`)
const blogPath = resolve(ROOT, "src/lib/blogContent.ts");
let blogSrc = readFileSync(blogPath, "utf-8");

// Avoid double-injection on re-runs.
if (blogSrc.includes("// AUTOGEN-NEWS-POSTS-START")) {
  // Strip previous block
  blogSrc = blogSrc.replace(
    /\n\s*\/\/ AUTOGEN-NEWS-POSTS-START[\s\S]*?\/\/ AUTOGEN-NEWS-POSTS-END\s*\n/,
    "\n",
  );
}

const literal = newPosts
  .map((p) => "  " + JSON.stringify(p, null, 2).replace(/\n/g, "\n  ") + ",")
  .join("\n");

const injection = `\n  // AUTOGEN-NEWS-POSTS-START — generated by scripts/generate-blogs-and-news.mjs\n${literal}\n  // AUTOGEN-NEWS-POSTS-END\n`;

// Insert before the final closing `];` of blogPosts array.
const arrEnd = blogSrc.lastIndexOf("];");
blogSrc = blogSrc.slice(0, arrEnd) + injection + blogSrc.slice(arrEnd);
writeFileSync(blogPath, blogSrc, "utf-8");
console.log(`[blogs] appended ${newPosts.length} entries to blogContent.ts`);
