// Persona×city page generator — "AI course for <persona> in <city>". Reads
// data/cross-personas.json + data/cross-cities.json, emits geo-shape pages into
// data/cross-personas-gen.json. Skips slugs already in seo-catalog.json.
// gen-seo / validate-seo / deploy-seo merge this file too.
import { readFileSync, writeFileSync } from "node:fs";

const P = JSON.parse(readFileSync("data/cross-personas.json", "utf8"));
const cities = JSON.parse(readFileSync("data/cross-cities.json", "utf8")).cities;
const catalog = JSON.parse(readFileSync("data/seo-catalog.json", "utf8")).pages;
const existing = new Set(catalog.map((p) => p.slug));
const cityBySlug = Object.fromEntries(cities.map((c) => [c.slug, c]));
const ORIGIN = "https://onrol.in";
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// Per-page deterministic phrasing variation (anti near-duplicate; brief item 04).
const hashN = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return Math.abs(h); };

// Variant phrasings of each persona's repeated attributes. Same meaning, different words —
// picked per-city by slug hash so two same-persona pages don't share the long identical phrases.
const PVAR = {
  "it-professionals": {
    usecases: ["automate delivery work, build AI features and agents, and add AI to the products they already ship", "wire AI into the systems they maintain, ship AI features and agents, and automate the delivery grind", "add AI to existing products, build working agents, and take repetitive delivery tasks off their plate"],
    build: ["an AI feature or agent wired into a real system, plus automations that cut delivery grunt-work", "a working AI agent connected to a real system, alongside automations that remove delivery busywork", "a deployed AI feature plus delivery automations, both running against a real codebase or system"],
    pains: ["AI is reshaping every IT role, and experience alone no longer guarantees relevance", "every IT role is being rewritten by AI, and seniority alone no longer keeps you safe", "AI is changing what IT work looks like, and years on the job no longer guarantee your seat"],
  },
  "finance-professionals": {
    usecases: ["automate reconciliations, analyse financial data with AI, and draft reports and commentary faster", "let AI handle reconciliation, dig through financial data, and produce reports and commentary in less time", "speed up reconciliations, run AI over financial data, and turn numbers into reports and narrative faster"],
    build: ["an AI-assisted financial analysis and a reporting automation on a real finance workflow", "a reporting automation plus an AI-driven financial analysis built on a real finance process", "an AI analysis of real financial data and an automated reporting pipeline for a finance team"],
    pains: ["month-close, reconciliation and reporting still eat hours that AI can now take back", "reconciliation, month-close and reporting still burn hours AI is now able to reclaim", "the close, the reconciliations and the reports still swallow time AI can hand back"],
  },
  "hr-professionals": {
    usecases: ["screen and summarise applications, draft job posts and policies, and automate onboarding and HR queries", "sift and summarise applications, write job posts and policies, and automate onboarding and staff queries", "triage applications with AI, draft postings and policy, and take onboarding and HR Q&A off manual hands"],
    build: ["an AI screening-and-drafting workflow and an HR-query assistant on a real people-ops process", "an AI-query assistant for staff plus a screening-and-drafting workflow on a real HR process", "a people-ops assistant and an AI screening workflow built on a real hiring or onboarding process"],
    pains: ["screening, coordination and repetitive people-ops work scale badly by hand", "manual screening, coordination and people-ops tasks don't scale as headcount grows", "by-hand screening, scheduling and repetitive HR work quickly hit a ceiling"],
  },
  "sales-professionals": {
    usecases: ["research accounts with AI, personalise outreach at scale, and automate follow-ups and CRM updates", "use AI to research accounts, tailor outreach at scale, and keep follow-ups and CRM hygiene automatic", "profile accounts with AI, personalise every touch at scale, and let AI handle follow-ups and CRM entry"],
    build: ["an AI prospect-research and outreach workflow tied to a real sales process", "an AI-driven research-and-outreach workflow wired to a real sales pipeline", "a prospect-research and personalised-outreach system built on a real sales motion"],
    pains: ["research, follow-ups and personalised outreach take time better spent selling", "prospect research, follow-ups and tailored outreach eat hours that should go to closing", "the admin of research, follow-up and personalisation steals time from actual selling"],
  },
  "marketing-professionals": {
    usecases: ["generate on-brand content and creative variants, and tie campaigns to funnel and performance with AI", "produce on-brand content and creative at volume, and connect campaigns to funnel data with AI", "spin up on-brand copy and creative variants, and use AI to link campaigns to performance"],
    build: ["an AI content-and-creative system and a performance view for a real brand", "an AI-powered content-and-creative engine plus a campaign performance view for a real brand", "a content-and-creative generation system and an AI performance dashboard for a real brand"],
    pains: ["content volume, creative variants and reporting outpace a small team", "the demand for content, creative variants and reporting outruns a lean team", "a small team can't keep up with the content, creative and reporting the channels now need"],
  },
  "healthcare-professionals": {
    usecases: ["summarise and draft clinical and admin documents, answer routine queries, and automate coordination", "draft and summarise clinical and admin paperwork, field routine queries, and automate coordination", "use AI to write and summarise clinical and admin documents, handle routine questions, and coordinate care tasks"],
    build: ["a documentation-and-query AI tool on a real healthcare-admin workflow", "an AI documentation-and-query assistant built on a real healthcare-admin process", "a clinical-admin AI tool that drafts documents and answers routine queries on a real workflow"],
    pains: ["documentation and coordination take time away from patients", "paperwork and coordination pull time away from patient care", "admin and documentation steal hours that should go to patients"],
  },
  "business-owners": {
    usecases: ["automate customer replies, generate sales and marketing content, and streamline operations with AI", "let AI handle customer replies, produce sales and marketing content, and tidy up operations", "automate support responses, spin up sales and marketing content, and run operations leaner with AI"],
    build: ["AI automations for a real business — customer service, content and an operations workflow", "a set of AI automations for a real business: support, content and an operations workflow", "customer-service, content and operations automations built for a real business"],
    pains: ["a small team means every repetitive task is a real cost", "with a lean team, every repetitive task is money and time you can't spare", "when the team is small, every manual, repeated task is a direct cost"],
  },
  "freshers": {
    usecases: ["learn to build real AI projects, and use AI to accelerate learning and job-hunting", "build real AI projects from scratch, and lean on AI to learn faster and job-hunt smarter", "ship genuine AI projects, and use AI itself to speed up studying and the job search"],
    build: ["two to three deployed AI projects that make a fresher's portfolio stand out", "two or three shipped AI projects that lift a fresher's portfolio above the pile", "a handful of deployed AI projects that give a new graduate a portfolio with proof"],
    pains: ["degrees alone no longer stand out; employers want proof you can build", "a degree by itself no longer stands out — employers want evidence you can build", "credentials alone don't cut it now; employers look for proof you can actually build"],
  },
};

function buildPage(persona, city) {
  const slug = `ai-course-for-${persona.slug}-in-${city.slug}`;
  const name = city.name;
  const [i0, i1, i2] = city.industries;
  const [a0, a1, a2, a3, a4] = city.areas;
  const areaTail = a4 ? `${a3} and ${a4}` : a3;
  const L = persona.label;
  const T = persona.Title;
  const V = (salt, arr) => arr[hashN(slug + "~" + salt) % arr.length]; // stable per page
  const pv = PVAR[persona.slug] || { usecases: [persona.usecases], build: [persona.build], pains: [persona.pains] };
  const uc = V("uc", pv.usecases), bld = V("bld", pv.build), pns = V("pns", pv.pains);

  const lead = V("lead", [
    `An AI course built for ${L} in ${name} — live online from ${a0}, ${a1} or ${a2}. In ${city.anchor}, where ${persona.sector} sit alongside ${i0}, ${i1} and ${i2}, ONROL helps ${L} ${persona.angle}, with a portfolio to show for it.`,
    `Built for ${L} across ${name} and taught live online — join from ${a0}, ${a1} or ${a2}. With the city running on ${i0}, ${i1} and ${i2} beside ${persona.sector}, ONROL turns ${L} into people who ${persona.angle}, and proves it with real work.`,
    `${cap(T)} in ${name} don't need more theory — they need to build. Streaming live to ${a0}, ${a1} and ${a2}, ONROL helps ${L} ${persona.angle} against a local economy of ${i0}, ${i1} and ${i2}, finishing with a portfolio rather than notes.`,
    `For ${L} anywhere in ${name} — ${a1}, ${a2} or ${areaTail} — this is a live online AI course that fits your role. In ${city.state}'s ${city.region} hub, where ${persona.sector} work beside ${i0}, ${i1} and ${i2}, ONROL helps you ${persona.angle}, with real projects to show.`,
    `A live online AI course for ${L} across ${name}, reaching ${a0}, ${a2} and ${areaTail}. With ${persona.sector} set among ${i0}, ${i1} and ${i2}, ONROL turns ${L} into people who ${persona.angle} — and can prove it.`,
  ]);

  const outcomes = [
    { title: V("o0t", [`Made for ${T} in ${name}`, `Built around ${T}, in ${name}`, `Shaped for ${T} here`]),
      text: V("o0", [
        `${cap(pns)}. In ${name}, where ${persona.sector} matter, you learn to ${uc}.`,
        `${cap(pns)} — so in ${name}, with ${persona.sector} close by, the focus is learning to ${uc}.`,
        `Because ${pns}, this course has ${L} in ${name} learn to ${uc}, not sit through generic slides.`]) },
    { title: V("o1t", ["Applied to your actual work", "Tied to the job you do", "Built on real tasks, not toys"]),
      text: V("o1", [
        `You don't watch theory — you ${uc} on real scenarios drawn from ${name}'s economy.`,
        `Instead of theory, you ${uc} using cases pulled straight from work in ${name}.`,
        `Every session is hands-on: you ${uc} against situations that mirror ${name}'s ${persona.sector}.`]) },
    { title: V("o2t", [`Tuned to ${name}'s economy`, `Rooted in ${name}`, `Local by design, ${name}`]),
      text: V("o2", [
        `${cap(city.anchor)} means ${city.demand}. You learn AI against the ${i0}, ${i1} and ${i2} that define local work, with peers from ${a4 || a3}.`,
        `With ${city.anchor}, ${city.demand} You work through AI on the ${i0}, ${i1} and ${i2} that drive ${name}, alongside peers near ${a4 || a3}.`,
        `${cap(city.demand)} That is why the course leans on ${name}'s ${i0}, ${i1} and ${i2}, with a cohort drawn from ${a4 || a3} and around.`]) },
    { title: V("o3t", ["Live and online, evenings too", "Live, online, around your week", "Real cohort, no commute"]),
      text: V("o3", [
        `From ${a0} to ${a3}, one live cohort with mentors — evening and weekend batches, no commute, no career break.`,
        `Whether you're in ${a0} or ${a3}, it's one mentor-led live cohort, with evening and weekend batches and no travel.`,
        `Join live from ${a0}, ${a1} or ${a3} — a real cohort with mentors, evenings and weekends, no career break needed.`]) },
  ];

  const learnHeading = V("lh", [`What ${T} in ${name} build`, `What you'll build in ${name}`, `${cap(T)} in ${name} walk away with`]);
  const learn = [
    bld,
    V("l1", [`AI workflows applied to ${persona.sector} in ${name}`, `AI put to work across ${persona.sector} in ${name}`, `AI built into ${persona.sector} the way ${name} runs them`]),
    V("l2", ["a portfolio piece that proves you can build with AI, not just talk about it", "a portfolio project that shows you build with AI, not just discuss it", "real, showable work that proves you build with AI rather than describe it"]),
    V("l3", ["the judgement to use AI well — where it helps and where it does not", "the judgement for when AI helps and when it does not", "a working sense of where AI adds value and where it falls short"]),
  ];

  const contextKicker = V("ck", [`Why ${T} in ${name} need AI`, `The case for AI, ${name}`, `Why this matters in ${name}`]);
  const contextHeading = V("ch", [`AI for ${L}, tuned to ${name}`, `AI that fits ${L} in ${name}`, `Built for ${L} in ${name}`]);
  const context = [
    V("c0", [
      `For ${L} in ${name}, AI has stopped being optional. ${cap(pns)}, and in a city that runs on ${i0}, ${i1}, ${i2} and ${persona.sector}, the people who can put AI to work are pulling ahead. ${cap(city.demand)}.`,
      `AI is no longer a nice-to-have for ${L} in ${name}. ${cap(pns)} — and where the economy turns on ${i0}, ${i1}, ${i2} and ${persona.sector}, those who can actually apply AI move first. ${cap(city.demand)}.`,
      `In ${name}, ${L} are feeling the shift: ${pns}. With ${i0}, ${i1}, ${i2} and ${persona.sector} all around, AI fluency is becoming the divide. ${cap(city.demand)}.`,
      `Across ${name} — ${a0}, ${a2} and out to ${areaTail} — ${L} face the same reality: ${pns}. In ${city.state}'s ${city.region} hub, with ${i0}, ${i1} and ${i2} beside ${persona.sector}, applying AI is what sets people apart. ${cap(city.demand)}.`,
      `${cap(pns)}. That hits ${L} in ${name} directly — a ${city.region} centre running on ${i0}, ${i1}, ${i2} and ${persona.sector}, where the ones who can put AI to work are pulling ahead. ${cap(city.demand)}.`]),
    V("c1", [
      `That is why ONROL's course for ${L} is built around doing, not watching. You learn to ${uc} — against real scenarios from ${name}'s economy — and finish with ${bld}. It is applied AI for your role, not a generic overview.`,
      `So ONROL's course for ${L} is hands-on from day one. You ${uc} on cases from ${name}'s own economy and end with ${bld} — role-specific, not a one-size-fits-all overview.`,
      `ONROL answers that with a build-first course for ${L}: you ${uc}, work through real ${name} scenarios, and leave with ${bld}. Applied to your role, not generic theory.`]),
    V("c2", [
      `You leave with a portfolio a ${name} employer can open and trust, and the confidence to keep building. Learners join live from ${a0}, ${a1}, ${a2} and ${a3} — no relocation, evenings and weekends available.`,
      `The result is a portfolio any ${name} employer can inspect and trust, plus the confidence to keep going. Join live from ${a0}, ${a1}, ${a2} or ${a3} — no move, evenings and weekends on offer.`,
      `You finish with real, showable work a ${name} employer will respect — and the habit of building. Cohorts run live for learners in ${a0}, ${a1}, ${a2} and ${a3}, evenings and weekends, no relocation.`]),
  ];

  const faqs = [
    { q: V("q0", [`Is this AI course for ${L} in ${name} online or offline?`, `Do ${L} in ${name} attend in person or online?`, `Is the ${name} course online?`]),
      a: V("a0", [
        `100% live online. ${T} from ${a0}, ${a1}, ${a2} and ${a3} join the same interactive cohort — no travel or career break needed.`,
        `It's fully live online — ${T} across ${a0}, ${a1}, ${a2} and ${a3} share one interactive cohort, with no commute or break from work.`,
        `Entirely online and live. Whether you're in ${a0}, ${a1}, ${a2} or ${a3}, it's the same hands-on cohort — no travel, no career gap.`]) },
    { q: V("q1", [`Do ${L} need a coding background for this course?`, `Is coding required for ${L} to join?`, `Can non-coders take this?`]),
      a: V("a1", [
        `No. It is built for ${L}, not developers — you learn to build with AI using no-/low-code tools and AI copilots, with any technical steps taught step by step.`,
        `Not at all. Designed for ${L} rather than developers, it has you build with no-/low-code tools and AI copilots, teaching any technical bits as they come up.`,
        `No coding needed. It's made for ${L}, so you build using no-/low-code tools and AI copilots, and pick up the technical parts step by step.`]) },
    { q: V("q2", ["How is this different from a generic AI course?", "Why not just take a general AI course?", "What makes this role-specific?"]),
      a: V("a2", [
        `It is applied to your role and your city: you ${uc}, on scenarios from ${name}'s ${persona.sector}, and finish with ${bld}.`,
        `It's built around your role and ${name}: you ${uc}, working on ${persona.sector} scenarios, and leave with ${bld}.`,
        `Because it's specific to your role in ${name} — you ${uc}, against ${persona.sector} cases, ending with ${bld}.`]) },
    { q: V("q3", ["Will I have something to show at the end?", "What do I walk away with?", "Is there a portfolio outcome?"]),
      a: V("a3", [
        `Yes — ${bld}. A portfolio you can show any ${name} employer, not just a certificate.`,
        `You do — ${bld}. That's real, showable proof for a ${name} employer, well beyond a certificate.`,
        `Yes: ${bld}. Something a ${name} employer can actually open and trust, not just a certificate.`]) },
  ];

  return {
    type: "geo", generated: true, slug, city: name,
    title: `AI Course for ${T} in ${name} — Live Online | ONROL`.slice(0, 65),
    description: `AI course for ${L} in ${name}, live online. Learn to ${uc}. No coding — build a portfolio. Join the next cohort.`.slice(0, 158),
    eyebrow: `Live Online · ${T} · ${name}`,
    h1: `AI course for ${L} in`, h1accent: name,
    lead, meta: [{ icon: "screen", text: "100% live online" }, { icon: "clock", text: "Evening & weekend cohorts" }, { icon: "shield", text: "No coding background needed" }],
    outcomes, learnHeading, learn, contextKicker, contextHeading, context, faqs,
    cta: "Join the next cohort",
    form: { source: `Persona - ${T} ${name}`, campaign: `persona-${persona.slug}-${city.slug}`, program: `AI for ${T} (${name}, online)` },
    breadcrumb: [{ name: "AI Courses in India", url: `${ORIGIN}/best-ai-course-in-india` }, { name: `AI Course for ${T} in ${name}`, url: `${ORIGIN}/${slug}/` }],
  };
}

const out = [];
let skipped = 0;
for (const persona of P.personas) {
  for (const citySlug of P.cityScope) {
    const city = cityBySlug[citySlug];
    if (!city) continue;
    const slug = `ai-course-for-${persona.slug}-in-${city.slug}`;
    if (existing.has(slug)) { skipped++; continue; }
    out.push(buildPage(persona, city));
  }
}
writeFileSync("data/cross-personas-gen.json", JSON.stringify({ generatedAt: new Date().toISOString(), pages: out }, null, 2) + "\n");
console.log(`gen-persona: ${out.length} persona×city pages -> data/cross-personas-gen.json (skipped ${skipped}). Personas=${P.personas.length} Cities=${P.cityScope.length}`);
