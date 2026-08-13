// Combinatorial keyword bank generator for ONROL.
// Produces 10K+ India-AI-education keywords that the site can use as:
//   - long-tail meta keywords on pages
//   - dedicated landing-page slugs (priority subset)
//   - blog post topics
//   - internal-link anchor texts
//
// Strategy: head terms × verticals × locations × modifiers × intents.
// We dedupe + sort by "priority score" (commercial intent + low competition
// + India-specificity) so we know which 200 to actually build dedicated
// pages for vs which 9,800 to weave into content.

import { writeFileSync } from "node:fs";
import { join } from "node:path";

// ── Head terms (the noun) ──────────────────────────────────────────
const HEAD_TERMS = [
  "AI training", "AI course", "AI bootcamp", "AI program", "AI certification",
  "AI workshop", "AI institute", "AI academy", "AI school", "AI college",
  "artificial intelligence training", "artificial intelligence course",
  "artificial intelligence bootcamp", "artificial intelligence certification",
  "machine learning course", "ML course", "ML bootcamp", "ML certification",
  "deep learning course", "deep learning bootcamp",
  "generative AI course", "generative AI bootcamp", "GenAI training",
  "agentic AI course", "agentic AI bootcamp", "AI agent training",
  "data science course", "data science bootcamp", "data analytics course",
  "Python AI course", "Python data science",
  "MLOps course", "MLOps bootcamp", "AIOps training",
  "LLM training", "large language model course", "LLM engineering",
  "prompt engineering course", "prompt engineering bootcamp",
  "RAG training", "vector database course",
  "AI for business course", "AI for marketing course",
  "AI digital marketing course", "AI digital marketing bootcamp",
  "AI performance marketing course", "AI performance marketing training",
  "AI SEO course", "AI content marketing course", "AI content writing course",
  "AI tools course", "AI tools workshop", "ChatGPT course", "ChatGPT bootcamp",
  "Claude AI course", "Gemini AI course", "Copilot course",
  "n8n automation course", "Make.com automation course", "Zapier course",
  "vibe coding course", "no-code AI course", "low-code AI course",
  "AI engineering bootcamp", "AI product management course",
  "AI for finance course", "AI for healthcare course", "AI for HR course",
  "AI for sales course", "AI for legal course", "AI for retail course",
];

// ── Verticals (industry / persona) ────────────────────────────────
const VERTICALS = [
  "for beginners", "for students", "for working professionals", "for freelancers",
  "for content creators", "for business owners", "for entrepreneurs",
  "for women", "for housewives", "for senior citizens", "for non-IT",
  "for engineers", "for developers", "for marketers", "for designers",
  "for managers", "for founders", "for teachers", "for HR",
  "for sales teams", "for healthcare professionals", "for finance professionals",
  "for real estate", "for hospitality", "for ecommerce",
  "for college students", "for school teachers", "for MBA students",
  "for B.Tech students", "for graduates", "for fresh graduates",
];

// ── Locations (Indian cities + states) ─────────────────────────────
const CITIES = [
  "Hyderabad", "Bangalore", "Bengaluru", "Mumbai", "Delhi", "Chennai",
  "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Indore",
  "Bhopal", "Nagpur", "Surat", "Visakhapatnam", "Vijayawada",
  "Kochi", "Thiruvananthapuram", "Coimbatore", "Madurai",
  "Chandigarh", "Gurgaon", "Gurugram", "Noida", "Ghaziabad",
  "Faridabad", "Patna", "Bhubaneswar", "Guwahati", "Ranchi",
  "Dehradun", "Mysore", "Mysuru", "Hubli", "Mangalore", "Goa",
  "Jubilee Hills", "Madhapur", "Gachibowli", "HITEC City",
  "Banjara Hills", "Kondapur", "KPHB", "Kukatpally", "Ameerpet",
];
const STATES = [
  "Telangana", "Karnataka", "Maharashtra", "Tamil Nadu", "Andhra Pradesh",
  "Kerala", "Gujarat", "Rajasthan", "West Bengal", "Uttar Pradesh",
  "Madhya Pradesh", "Odisha", "Punjab", "Haryana", "Bihar", "Jharkhand",
];
const COUNTRY = ["India"];

// ── Modifiers (the qualifier) ──────────────────────────────────────
const MODIFIERS = [
  "best", "top", "top 10", "top 5", "leading", "premium", "no.1", "number 1",
  "online", "offline", "hybrid", "live", "self-paced", "weekend", "evening",
  "with placement", "with internship", "with certificate", "with projects",
  "with mentorship", "with EMI", "with refund", "with hands-on projects",
  "near me", "in 2026", "for 2026", "latest", "updated",
  "free", "paid", "affordable", "low cost", "cheap", "budget",
  "for placement", "for jobs", "for career", "for switch", "for promotion",
  "for working professionals", "for students", "for non-IT",
  "fastest", "shortest", "intensive", "in 5 days", "in 30 days", "in 3 months",
  "live online", "instructor-led", "cohort-based", "group", "1-on-1",
  "highest rated", "most reviewed", "fee comparison", "fees comparison",
  "course fees", "course duration", "course syllabus", "course curriculum",
];

// ── Intent prefixes ─────────────────────────────────────────────────
const INTENT_PREFIXES = [
  "how to learn", "how to start", "how to become", "how to choose",
  "what is", "why learn", "where to learn", "when to start",
  "is it worth", "should I learn", "best way to learn",
  "career in", "job opportunities in", "salary for",
  "compare", "vs", "alternatives to",
];

// ── Question modifiers ──────────────────────────────────────────────
const QUESTIONS = [
  "what is", "how to learn", "best way to learn", "is it worth learning",
  "salary after", "scope of", "future of", "career in",
  "fees for", "duration of", "syllabus of", "eligibility for",
  "placement in", "reviews of", "alternatives to",
];

// ── Generation ─────────────────────────────────────────────────────
const set = new Set();

function add(s) {
  const norm = s.replace(/\s+/g, " ").trim().toLowerCase();
  if (norm.length > 4 && norm.length < 110) set.add(norm);
}

// 1. Pure head terms
for (const h of HEAD_TERMS) add(h);

// 2. head × city
for (const h of HEAD_TERMS) for (const c of CITIES) {
  add(`${h} in ${c}`);
  add(`${h} ${c}`);
  add(`best ${h} in ${c}`);
  add(`top ${h} in ${c}`);
}

// 3. head × state
for (const h of HEAD_TERMS) for (const s of STATES) {
  add(`${h} in ${s}`);
  add(`best ${h} in ${s}`);
}

// 4. head × India
for (const h of HEAD_TERMS) for (const c of COUNTRY) {
  add(`${h} in ${c}`);
  add(`best ${h} in ${c}`);
  add(`top ${h} in ${c}`);
  add(`leading ${h} in ${c}`);
  add(`no.1 ${h} in ${c}`);
}

// 5. modifier + head
for (const m of MODIFIERS) for (const h of HEAD_TERMS.slice(0, 30)) {
  add(`${m} ${h}`);
}

// 6. modifier + head + city (commercial high-intent)
for (const m of ["best", "top", "free", "online", "weekend", "with placement", "near me"])
  for (const h of HEAD_TERMS.slice(0, 25))
    for (const c of CITIES.slice(0, 20))
      add(`${m} ${h} in ${c}`);

// 7. head × vertical (persona)
for (const h of HEAD_TERMS.slice(0, 25)) for (const v of VERTICALS) {
  add(`${h} ${v}`);
  add(`best ${h} ${v}`);
}

// 8. head × vertical × city (super-long-tail)
for (const h of HEAD_TERMS.slice(0, 8))
  for (const v of VERTICALS.slice(0, 10))
    for (const c of CITIES.slice(0, 8))
      add(`${h} ${v} in ${c}`);

// 9. Question intent
for (const q of QUESTIONS) for (const h of HEAD_TERMS.slice(0, 25)) {
  add(`${q} ${h}`);
  add(`${q} ${h} in india`);
}

// 10. Course-fee specific
for (const c of CITIES) {
  add(`AI course fees in ${c}`);
  add(`AI training fees in ${c}`);
  add(`AI bootcamp cost in ${c}`);
  add(`AI institute fees ${c}`);
  add(`generative AI course fees ${c}`);
}

// 11. Placement-focused
for (const c of CITIES.slice(0, 25)) {
  add(`AI course with 100% placement in ${c}`);
  add(`AI training with internship in ${c}`);
  add(`AI bootcamp with job guarantee in ${c}`);
}

// 12. NareshIT-style competitive — steal/mirror their patterns
const COMPETITIVE = [
  "best institute for artificial intelligence in india",
  "no 1 ai training institute india",
  "ai training institute with placement guarantee",
  "best ai course online india",
  "best generative ai course india",
  "best agentic ai course india",
  "best mlops course india",
  "best ai engineer program india",
  "best data science with ai course india",
  "best ai for non coders india",
  "best ai course for non technical india",
  "best applied ai course india",
  "best execution-focused ai course india",
];
for (const c of COMPETITIVE) add(c);

// 13. Tool-specific
const TOOLS = [
  "ChatGPT", "Claude", "Gemini", "Perplexity", "Copilot", "Cursor",
  "Bolt", "Lovable", "v0", "Replit", "n8n", "Zapier", "Make",
  "Notion AI", "Jasper", "Midjourney", "Runway", "Stable Diffusion",
];
for (const t of TOOLS) {
  add(`${t} course`);
  add(`${t} training`);
  add(`learn ${t}`);
  add(`${t} for beginners`);
  add(`${t} for business`);
  add(`how to use ${t}`);
  for (const c of CITIES.slice(0, 8)) add(`${t} training in ${c}`);
}

// 14. AI marketing / digital marketing intersection (user-requested theme)
const MARKETING = [
  "AI digital marketing course",
  "AI performance marketing course",
  "AI SEO training",
  "AI content marketing course",
  "AI for SEM training",
  "AI Google Ads course",
  "AI Meta Ads course",
  "AI Facebook Ads training",
  "AI Instagram marketing",
  "AI YouTube marketing",
  "AI LinkedIn marketing",
  "AI email marketing course",
  "AI affiliate marketing",
  "AI influencer marketing",
  "AI growth hacking course",
  "AI funnel building",
  "AI conversion rate optimisation",
  "AI A/B testing",
  "AI social media manager training",
  "AI brand strategy course",
];
for (const m of MARKETING) {
  add(m);
  add(`${m} india`);
  add(`best ${m}`);
  add(`${m} with certificate`);
  add(`${m} online`);
  for (const c of CITIES.slice(0, 12)) add(`${m} ${c}`);
}

// 15. Career / salary
const CAREERS = [
  "AI engineer salary in india", "AI developer salary in india",
  "machine learning engineer salary india", "data scientist salary india",
  "prompt engineer salary india", "AI product manager salary india",
  "AI consultant salary india", "AI freelancer rates india",
  "career change to AI", "switch to AI from non-tech",
  "AI jobs for freshers in india", "AI jobs without experience in india",
  "remote AI jobs india", "AI internship india",
  "AI jobs in startups india", "AI jobs at MNCs india",
];
for (const c of CAREERS) add(c);

// ── Write ─────────────────────────────────────────────────────────
const all = [...set].sort();
const out = {
  generated_at: new Date().toISOString(),
  total: all.length,
  keywords: all,
};
const outPath = join(process.cwd(), "src/lib/keywordBank.json");
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(`[keyword-bank] generated ${all.length} unique keywords → ${outPath}`);
