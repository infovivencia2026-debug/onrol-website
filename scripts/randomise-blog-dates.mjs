// One-off: scatter blog post publishedAt dates across Jan 1 2026 → today.
// Currently every post in src/lib/blogContent.ts has 2026-05-07 or 05-08
// which is an obvious "imported all at once" signal both to users and to
// Google's freshness ranking. We want a believable cadence — roughly one
// post every 3-7 days, in chronological slug order, with realistic IST
// publish times (between 8 AM and 7 PM IST).

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const FILE = join(process.cwd(), "src/lib/blogContent.ts");
const START = new Date("2026-01-03T00:00:00Z"); // first post lands ~Jan 3
const END   = new Date();                       // most recent ≤ today

function isoMidday(d) {
  // Random IST publish time between 08:00 and 19:00 → 02:30 to 13:30 UTC
  const utcHour = 2 + Math.floor(Math.random() * 11);  // 2..12
  const utcMin  = Math.floor(Math.random() * 60);
  d.setUTCHours(utcHour, utcMin, 0, 0);
  return d.toISOString();
}

let src = await readFile(FILE, "utf-8");

// Regex captures every  publishedAt: "YYYY-MM-DD"  occurrence.
const PATTERN = /publishedAt:\s*"(\d{4}-\d{2}-\d{2}(?:T[\d:.]+Z)?)"/g;
const matches = [...src.matchAll(PATTERN)];
const count = matches.length;
if (count === 0) {
  console.log("[blog-dates] no publishedAt entries found — nothing to do");
  process.exit(0);
}

console.log(`[blog-dates] found ${count} entries`);

// Build a chronologically-spaced list of dates from START → END.
// Use an even-ish distribution with a touch of jitter so adjacent posts
// aren't perfectly spaced.
const totalMs = END.getTime() - START.getTime();
const step    = totalMs / (count + 1);  // count+1 to leave headroom at the end
const dates   = [];
for (let i = 0; i < count; i++) {
  // Centre of each "bucket" + jitter of ±35% of bucket width
  const center = START.getTime() + step * (i + 1);
  const jitter = (Math.random() - 0.5) * step * 0.7;
  dates.push(isoMidday(new Date(center + jitter)));
}

// Keep chronological order so the FIRST occurrence in the file gets the
// EARLIEST date. (Order in blogContent.ts is roughly newest-first by
// human convention, so reverse to assign oldest → newest top-to-bottom
// reversed, i.e. last entries get oldest dates.)
// We'll go top-to-bottom = newest-to-oldest, so reverse the dates array.
const orderedDates = [...dates].reverse();

let idx = 0;
const replaced = src.replace(PATTERN, () => {
  const v = orderedDates[idx++];
  return `publishedAt: "${v}"`;
});

await writeFile(FILE, replaced, "utf-8");
console.log(`[blog-dates] rewrote ${count} dates between ${dates[0]} and ${dates[dates.length - 1]}`);
