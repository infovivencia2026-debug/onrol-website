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

function buildPage(city, course) {
  const slug = `${course.key}-course-in-${city.slug}`;
  const name = city.name;
  const [i0, i1, i2] = city.industries;
  const [a0, a1, a2, a3] = city.areas;
  const seed = hash(slug);
  const cname = course.label;

  const lead =
    `Learn ${course.noun} live online from anywhere in ${name} — ${a0}, ${a1} or ${a2}. ` +
    `In ${city.anchor}, home to ${i0}, ${i1} and ${i2}, ONROL teaches you to ${course.applied} — and you keep the work as a portfolio.`;

  const outcomes = [
    { title: `Built for ${name}`, text: `${cap(city.anchor)} means real demand: ${city.demand}. You learn ${cname} against the work local teams actually do.` },
    { title: `Tuned to ${cap(i0.split(" ").slice(-2).join(" "))}`, text: `${cap(i0)} sit at the centre of ${name}'s economy. You apply ${course.noun} to the problems those teams face day to day.` },
    { title: "Applied, not theoretical", text: `${cname} here means one thing: ${course.distinct}. You ${course.applied} on real scenarios — ${course.build[0]} — instead of watching slides.` },
    { title: "Learn across the city, online", text: `From ${a0} to ${a3}, the same live cohort — no commute, no relocation, evenings and weekends available.` },
  ];

  const learnHeading = `What ${name} learners build`;
  const learn = course.build.slice();

  const contextKicker = `Why ${cname} in ${name}`;
  const contextHeading = `${cap(course.noun)}, tuned to ${name}'s economy`;
  const context = [
    `${name}, ${city.state}'s ${city.tier === 1 ? "leading" : "fast-rising"} ${city.region} hub, is ${city.anchor}. ` +
      `Its economy runs on ${i0}, ${i1} and ${i2} — and ${city.demand}. ` +
      `Each of those is being reshaped by AI, which is why a ${cname} skill lands in ${name} rather than in the abstract.`,
    `That is why ONROL teaches ${course.noun} — ${course.distinct} — against ${name}'s real work, helping you ${course.applied} for ${i0} and ${i1} ` +
      `the way local teams already operate. You use AI to move faster, and you learn the judgement, not just the tool. This is ${cname}, not a generic AI overview.`,
    `You finish with ${course.build[3]} on a ${name}-relevant scenario — proof a hiring manager in ${a0} or ${a1} can open and trust in ` +
      `${pick(["thirty seconds", "a minute", "one glance"], seed)}, not just a certificate. Learners join from ${a0}, ${a1}, ${a2} and ${a3}.`,
  ];

  const faqs = [
    { q: `Is the ${cname} course in ${name} offline or online?`, a: `100% live online. Learners from ${a0}, ${a1}, ${a2} and ${a3} join the same interactive, hands-on cohort — no travel or relocation needed.` },
    { q: `Do I need a coding background for this ${cname} course?`, a: `No. You start from the fundamentals and use AI copilots as you build; any technical steps are taught step by step.` },
    { q: `Which ${name} roles does ${cname} help with?`, a: `${cap(course.roles)} across ${i0} and ${i1} — the sectors that define ${name}'s job market.` },
    { q: `Will I have a portfolio at the end?`, a: `Yes. You publish ${course.build[3]} on a ${name}-relevant scenario — shareable proof for any ${name} employer, not just a certificate.` },
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
