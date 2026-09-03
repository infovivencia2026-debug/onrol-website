// Programmatic city×course page generator (Naresh-IT-style scale, done with real
// per-city data so pages are genuinely distinct). Reads data/cross-cities.json +
// data/cross-courses.json, emits geo-shape page objects into data/cross-generated.json.
// Skips any slug already present in data/seo-catalog.json (hand-written pages win).
// gen-seo.mjs renders both catalog + cross-generated pages.
import { readFileSync, writeFileSync } from "node:fs";

const cities = JSON.parse(readFileSync("data/cross-cities.json", "utf8")).cities;
const courses = JSON.parse(readFileSync("data/cross-courses.json", "utf8")).courses;
const catalog = JSON.parse(readFileSync("data/seo-catalog.json", "utf8")).pages;
const existing = new Set(catalog.map((p) => p.slug));

const ORIGIN = "https://onrol.in";
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// stable per-page pick so phrasing varies but is deterministic across rebuilds
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
const pick = (arr, seed) => arr[seed % arr.length];

// Variant phrasings of each course's most-repeated attributes (applied, distinct), picked
// per-city by slug hash so two same-course pages don't share those identical phrases.
const CVAR = {
  "data-analytics-with-ai": { applied: ["turn operational and business data into decisions", "convert raw business and operations data into clear decisions", "move from business data to decisions people can act on"], distinct: ["reading messy data all the way to a business decision", "taking messy data through to an actual business decision", "carrying raw, messy data all the way to a decision"] },
  "power-bi": { applied: ["turn business data into dashboards leaders actually open", "build dashboards from business data that leaders genuinely use", "shape business data into dashboards that get opened daily"], distinct: ["the self-refreshing dashboard a leader opens every morning", "a dashboard that refreshes itself and a leader checks each morning", "the auto-updating dashboard leaders actually rely on"] },
  "generative-ai": { applied: ["build generative tools for content, documents and knowledge", "create generative tools across content, documents and knowledge", "ship generative tools for content, docs and internal knowledge"], distinct: ["grounded generative tools that draft, summarise and cite real sources", "generative tools that draft, summarise and cite from real sources", "generative tools grounded in real sources — drafting, summarising, citing"] },
  "ai-automation": { applied: ["take repetitive operations off people's plates with agents and workflows", "lift repetitive operations off the team using agents and workflows", "hand repetitive operations to agents and automated workflows"], distinct: ["lifting a repetitive, rules-shaped process off a team entirely", "removing a repetitive, rule-based process from a team completely", "taking a whole repetitive, rules-driven process off people's hands"] },
  "ai-digital-marketing": { applied: ["run AI-accelerated campaigns tied to real results", "run campaigns sped up by AI and tied to real outcomes", "drive AI-accelerated campaigns measured against real results"], distinct: ["campaigns whose every rupee is tied back to funnel and CAC", "campaigns where each rupee traces back to funnel and CAC", "campaigns with every rupee accountable to funnel and CAC"] },
  "prompt-engineering": { applied: ["design, test and harden prompts that hold up in production", "build, test and harden prompts that survive production", "craft, test and toughen prompts that hold in production"], distinct: ["prompts built as tested, versioned, production artifacts", "prompts treated as tested, versioned production artifacts", "prompts engineered as versioned, tested production assets"] },
  "python-for-ai": { applied: ["learn the language under modern AI, from first steps to working scripts", "learn the language behind modern AI, from basics to working scripts", "pick up the language powering modern AI, from scratch to real scripts"], distinct: ["the programming language that sits under almost all modern AI", "the language underpinning nearly all modern AI", "the language that sits beneath almost every modern AI system"] },
  "sql": { applied: ["query and shape the data under every analytics and engineering job", "query and shape the data behind every analytics and engineering role", "pull and shape the data that underlies analytics and engineering work"], distinct: ["querying the database directly to pull the exact data you need", "going straight to the database for exactly the data you need", "querying databases directly to get precisely the data required"] },
  "data-science": { applied: ["build and ship models and data products, not notebooks", "build and deploy models and data products, beyond notebooks", "ship real models and data products, not just notebooks"], distinct: ["framing and validating a model that actually ships, not a notebook", "framing and validating a model that ships, not a stray notebook", "building and validating a model that reaches production, not a notebook"] },
  "ai-agents": { applied: ["build tool-using agents that reliably do real work", "build tool-using agents that get real work done reliably", "create tool-using agents that carry out real work dependably"], distinct: ["tool-using agents that plan, call tools and act reliably", "agents that plan, call tools and act — reliably", "tool-using agents that reason, call tools and act dependably"] },
  "ai-app-development": { applied: ["build and ship real AI-powered apps, not prototypes", "build and launch real AI-powered apps, beyond prototypes", "ship genuine AI-powered apps, not throwaway prototypes"], distinct: ["taking an AI app from idea to a deployed, usable product", "carrying an AI app from idea to a deployed, working product", "moving an AI app from concept to a live, usable product"] },
  "ai-content-creation": { applied: ["use AI across video, social and brand content with real craft", "apply AI across video, social and brand content with genuine craft", "work AI across video, social and brand content with real craft"], distinct: ["directing AI across video, social and brand content with real craft", "directing AI over video, social and brand content with genuine craft", "steering AI across video, social and brand content with real craft"] },
};

function buildPage(city, course) {
  const slug = `${course.key}-course-in-${city.slug}`;
  const name = city.name;
  const [i0, i1, i2] = city.industries;
  const [a0, a1, a2, a3] = city.areas;
  const seed = hash(slug);
  const cname = course.label;
  const V = (salt, arr) => arr[hash(slug + "~" + salt) % arr.length]; // per-slot stable variant
  const cv = CVAR[course.key] || { applied: [course.applied], distinct: [course.distinct] };
  const applied = V("applied", cv.applied), distinct = V("distinct", cv.distinct);

  const lead = V("lead", [
    `Learn ${course.noun} live online from anywhere in ${name} — ${a0}, ${a1} or ${a2}. In ${city.anchor}, home to ${i0}, ${i1} and ${i2}, ONROL teaches you to ${applied} — and you keep the work as a portfolio.`,
    `${cap(cname)}, taught live online across ${name} — join from ${a0}, ${a1} or ${a2}. With the city built on ${i0}, ${i1} and ${i2}, ONROL has you ${applied}, and you walk away with the work as proof.`,
    `Study ${course.noun} online and live, wherever you are in ${name} — ${a0} through ${a2}. ${cap(city.anchor)} runs on ${i0}, ${i1} and ${i2}, and ONROL trains you to ${applied}, keeping every build as your portfolio.`,
  ]);

  const outcomes = [
    { title: V("o0t", [`Built for ${name}`, `Made for ${name}`, `Grounded in ${name}`]),
      text: V("o0", [
        `${cap(city.anchor)} means real demand: ${city.demand}. You learn ${cname} against the work local teams actually do.`,
        `Because ${city.anchor.replace(/^(a|an|the) /,'')}, ${city.demand} You pick up ${cname} on the tasks ${name} teams face for real.`,
        `${cap(city.demand)} That local pull is what you train ${cname} against — not textbook examples.`]) },
    { title: V("o1t", [`Tuned to ${cap(i0.split(" ").slice(-2).join(" "))}`, `Aimed at ${name}'s core work`, `Fit to local industry`]),
      text: V("o1", [
        `${cap(i0)} sit at the centre of ${name}'s economy. You apply ${course.noun} to the problems those teams face day to day.`,
        `With ${i0} driving so much of ${name}, you point ${course.noun} straight at the problems those teams deal with.`,
        `${cap(i0)} shape work here, so you use ${course.noun} on exactly the kind of tasks they run.`]) },
    { title: V("o2t", ["Applied, not theoretical", "Build-first, not slide-first", "Hands-on from day one"]),
      text: V("o2", [
        `${cname} here means one thing: ${distinct}. You ${applied} on real scenarios — ${course.build[0]} — instead of watching slides.`,
        `For ONROL, ${cname} is ${distinct}. So you ${applied} on genuine scenarios — ${course.build[0]} — rather than sitting through theory.`,
        `${cap(distinct)} is what ${cname} means here: you ${applied}, shipping ${course.build[0]}, not watching lectures.`]) },
    { title: V("o3t", ["Learn across the city, online", "One live cohort, no commute", "Online, around your week"]),
      text: V("o3", [
        `From ${a0} to ${a3}, the same live cohort — no commute, no relocation, evenings and weekends available.`,
        `Whether you're in ${a0} or ${a3}, it's one live cohort with mentors — evenings and weekends, no travel.`,
        `Join live from ${a0}, ${a1} or ${a3} — a single mentor-led cohort, evenings and weekends, no relocation.`]) },
  ];

  const learnHeading = V("lh", [`What ${name} learners build`, `What you'll build in ${name}`, `${name} learners walk away with`]);
  const learn = course.build.slice();

  const contextKicker = V("ck", [`Why ${cname} in ${name}`, `Why this lands in ${name}`, `${cname}, in ${name}`]);
  const contextHeading = V("ch", [`${cap(course.noun)}, tuned to ${name}'s economy`, `${cap(course.noun)} for how ${name} works`, `${cap(cname)} against real ${name} work`]);
  const context = [
    V("c0", [
      `${name}, ${city.state}'s ${city.tier === 1 ? "leading" : "fast-rising"} ${city.region} hub, is ${city.anchor}. Its economy runs on ${i0}, ${i1} and ${i2} — and ${city.demand}. Each of those is being reshaped by AI, which is why a ${cname} skill lands in ${name} rather than in the abstract.`,
      `As ${city.state}'s ${city.tier === 1 ? "leading" : "fast-rising"} ${city.region} hub, ${name} is ${city.anchor}. Work here turns on ${i0}, ${i1} and ${i2}, and ${city.demand} AI is reworking all three — so ${cname} pays off concretely in ${name}, not in theory.`,
      `${name} — ${city.anchor}, and ${city.state}'s ${city.tier === 1 ? "leading" : "fast-rising"} ${city.region} centre — lives on ${i0}, ${i1} and ${i2}. ${cap(city.demand)} With AI reshaping each, a ${cname} skill has somewhere real to land in ${name}.`]),
    V("c1", [
      `That is why ONROL teaches ${course.noun} — ${distinct} — against ${name}'s real work, helping you ${applied} for ${i0} and ${i1} the way local teams already operate. You use AI to move faster, and you learn the judgement, not just the tool. This is ${cname}, not a generic AI overview.`,
      `So ONROL's ${course.noun} is ${distinct}, taught against ${name}'s actual work: you ${applied} for ${i0} and ${i1} the way teams here do. You get speed from AI and the judgement to use it — ${cname}, not a generic overview.`,
      `ONROL answers that by teaching ${course.noun} as ${distinct} — worked against ${name}'s real tasks. You ${applied} for ${i0} and ${i1}, learning tool and judgement together. That's ${cname}, not a one-size AI course.`]),
    V("c2", [
      `You finish with ${course.build[3]} on a ${name}-relevant scenario — proof a hiring manager in ${a0} or ${a1} can open and trust in ${pick(["thirty seconds", "a minute", "one glance"], seed)}, not just a certificate. Learners join from ${a0}, ${a1}, ${a2} and ${a3}.`,
      `You end with ${course.build[3]} built on a ${name} scenario — the kind of proof a hiring manager in ${a0} or ${a1} trusts at ${pick(["a glance", "first look", "once over"], seed)}, well beyond a certificate. Cohorts draw from ${a0}, ${a1}, ${a2} and ${a3}.`,
      `The finish line is ${course.build[3]} on a real ${name} scenario — evidence an employer in ${a0} or ${a1} can judge in ${pick(["moments", "a minute", "one read"], seed)}, not a paper certificate. Learners come from ${a0}, ${a1}, ${a2} and ${a3}.`]),
  ];

  const faqs = [
    { q: V("q0", [`Is the ${cname} course in ${name} offline or online?`, `Do I attend the ${name} course in person or online?`, `Is ${cname} in ${name} taught online?`]),
      a: V("a0", [
        `100% live online. Learners from ${a0}, ${a1}, ${a2} and ${a3} join the same interactive, hands-on cohort — no travel or relocation needed.`,
        `Fully live online — people from ${a0}, ${a1}, ${a2} and ${a3} share one hands-on cohort, with no commute or relocation.`,
        `It's entirely online and live. Whether you're in ${a0}, ${a1}, ${a2} or ${a3}, it's the same interactive cohort — no travel required.`]) },
    { q: V("q1", [`Do I need a coding background for this ${cname} course?`, `Is coding required for ${cname} in ${name}?`, `Can I take ${cname} without coding?`]),
      a: V("a1", [
        `No. You start from the fundamentals and use AI copilots as you build; any technical steps are taught step by step.`,
        `Not at all — you begin at the fundamentals and lean on AI copilots while building, with technical bits taught as they arise.`,
        `No coding background needed. You start from basics, build with AI copilots, and pick up any technical steps along the way.`]) },
    { q: V("q2", [`Which ${name} roles does ${cname} help with?`, `What jobs in ${name} does ${cname} suit?`, `Who in ${name} is ${cname} for?`]),
      a: V("a2", [
        `${cap(course.roles)} across ${i0} and ${i1} — the sectors that define ${name}'s job market.`,
        `It suits ${course.roles} in ${i0} and ${i1}, the sectors that anchor ${name}'s job market.`,
        `Mostly ${course.roles} working in ${i0} and ${i1} — the industries that shape hiring in ${name}.`]) },
    { q: V("q3", ["Will I have a portfolio at the end?", "Do I finish with something to show?", "Is there a portfolio outcome?"]),
      a: V("a3", [
        `Yes. You publish ${course.build[3]} on a ${name}-relevant scenario — shareable proof for any ${name} employer, not just a certificate.`,
        `You do — ${course.build[3]}, built on a ${name} scenario. Shareable proof for a ${name} employer, not just a certificate.`,
        `Yes: ${course.build[3]} on a real ${name} scenario — something a ${name} employer can open and trust, beyond a certificate.`]) },
  ];

  return {
    type: "geo", generated: true, slug, city: name,
    title: `${cname} Course in ${name} — Live Online | ONROL`.slice(0, 65),
    description: `Live online ${cname} course for ${name}. ${cap(course.applied)} for ${i0} and ${i1}. No coding needed — join the next cohort.`.slice(0, 158),
    eyebrow: `Live Online · Serving ${name}`,
    h1: `${cname} course in`, h1accent: name,
    lead, meta: [{ icon: "screen", text: "100% live online" }, { icon: "clock", text: "Evening & weekend cohorts" }, { icon: "shield", text: "No coding background needed" }],
    outcomes, learnHeading, learn, contextKicker, contextHeading, context, faqs,
    cta: "Join the next cohort",
    form: { source: `Cross - ${cname} ${name}`, campaign: `cross-${course.key}-${city.slug}`, program: `${cname} (${name}, online)` },
    breadcrumb: [{ name: "AI Courses in India", url: `${ORIGIN}/best-ai-course-in-india` }, { name: `${cname} Course in ${name}`, url: `${ORIGIN}/${slug}/` }],
  };
}

// Optional CLI filters: --courses=a,b  --limit=N
const argCourses = (process.argv.find((a) => a.startsWith("--courses=")) || "").split("=")[1];
const argLimit = parseInt((process.argv.find((a) => a.startsWith("--limit=")) || "").split("=")[1] || "0", 10);
const courseFilter = argCourses ? new Set(argCourses.split(",")) : null;

const out = [];
let skipped = 0;
for (const course of courses) {
  if (course.bulk === false) continue; // near-synonym of another course — hand-written crosses cover it
  if (courseFilter && !courseFilter.has(course.key)) continue;
  for (const city of cities) {
    const slug = `${course.key}-course-in-${city.slug}`;
    if (existing.has(slug)) { skipped++; continue; }
    out.push(buildPage(city, course));
    if (argLimit && out.length >= argLimit) break;
  }
  if (argLimit && out.length >= argLimit) break;
}

writeFileSync("data/cross-generated.json", JSON.stringify({ generatedAt: new Date().toISOString(), pages: out }, null, 2) + "\n");
console.log(`gen-cross: ${out.length} city×course pages written to data/cross-generated.json (skipped ${skipped} existing). Cities=${cities.length} Courses=${courseFilter ? courseFilter.size : courses.length}`);
