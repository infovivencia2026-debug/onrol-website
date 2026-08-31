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

function buildPage(persona, city) {
  const slug = `ai-course-for-${persona.slug}-in-${city.slug}`;
  const name = city.name;
  const [i0, i1, i2] = city.industries;
  const [a0, a1, a2, a3, a4] = city.areas;
  const L = persona.label;
  const T = persona.Title;

  const lead =
    `An AI course built for ${L} in ${name} — live online from ${a0}, ${a1} or ${a2}. ` +
    `In ${city.anchor}, where ${persona.sector} sit alongside ${i0}, ${i1} and ${i2}, ONROL helps ${L} ${persona.angle}, with a portfolio to show for it.`;

  const outcomes = [
    { title: `Made for ${T} in ${name}`, text: `${cap(persona.pains)}. In ${name}, where ${persona.sector} matter, you learn to ${persona.usecases}.` },
    { title: "Applied to your actual work", text: `You don't watch theory — you ${persona.usecases} on real scenarios drawn from ${name}'s economy.` },
    { title: `Tuned to ${name}'s economy`, text: `${cap(city.anchor)} means ${city.demand}. You learn AI against the ${i0}, ${i1} and ${i2} that define local work, with peers from ${a4 || a3}.` },
    { title: "Live and online, evenings too", text: `From ${a0} to ${a3}, one live cohort with mentors — evening and weekend batches, no commute, no career break.` },
  ];

  const learnHeading = `What ${T} in ${name} build`;
  const learn = [
    persona.build,
    `AI workflows applied to ${persona.sector} in ${name}`,
    `a portfolio piece that proves you can build with AI, not just talk about it`,
    `the judgement to use AI well — where it helps and where it does not`,
  ];

  const contextKicker = `Why ${T} in ${name} need AI`;
  const contextHeading = `AI for ${L}, tuned to ${name}`;
  const context = [
    `For ${L} in ${name}, AI has stopped being optional. ${cap(persona.pains)}, and in a city that runs on ${i0}, ${i1}, ${i2} and ${persona.sector}, the people who can put AI to work are pulling ahead. ${cap(city.demand)}.`,
    `That is why ONROL's course for ${L} is built around doing, not watching. You learn to ${persona.usecases} — against real scenarios from ${name}'s economy — and finish with ${persona.build}. It is applied AI for your role, not a generic overview.`,
    `You leave with a portfolio a ${name} employer can open and trust, and the confidence to keep building. Learners join live from ${a0}, ${a1}, ${a2} and ${a3} — no relocation, evenings and weekends available.`,
  ];

  const faqs = [
    { q: `Is this AI course for ${L} in ${name} online or offline?`, a: `100% live online. ${T} from ${a0}, ${a1}, ${a2} and ${a3} join the same interactive cohort — no travel or career break needed.` },
    { q: `Do ${L} need a coding background for this course?`, a: `No. It is built for ${L}, not developers — you learn to build with AI using no-/low-code tools and AI copilots, with any technical steps taught step by step.` },
    { q: `How is this different from a generic AI course?`, a: `It is applied to your role and your city: you ${persona.usecases}, on scenarios from ${name}'s ${persona.sector}, and finish with ${persona.build}.` },
    { q: `Will I have something to show at the end?`, a: `Yes — ${persona.build}. A portfolio you can show any ${name} employer, not just a certificate.` },
  ];

  return {
    type: "geo", generated: true, slug, city: name,
    title: `AI Course for ${T} in ${name} — Live Online | ONROL`.slice(0, 65),
    description: `AI course for ${L} in ${name}, live online. Learn to ${persona.usecases}. No coding — build a portfolio. Join the next cohort.`.slice(0, 158),
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
