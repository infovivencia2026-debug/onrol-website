const fs = require("fs");
const f = process.argv[2] || "public/landingpage/aigeneralist/index.html";
let s = fs.readFileSync(f, "utf8");

// Mojibake patterns: each entry is [bad, good].
// Most common: UTF-8 sequence (E2 80 XX) interpreted as Latin-1 / Windows-1252
// then re-encoded as UTF-8 — producing 3 char sequences like "â€"" for "—".
const fixes = [
  // EM and EN dashes
  ["â€”", "—"],
  ["â€“", "–"],
  // smart quotes
  ["â€™", "’"],   // ’
  ["â€˜", "‘"],   // ‘
  ["â€œ", "“"],   // “
  ["â€", "”"], // ” (the "right double quote" mojibake includes a control char)
  // ellipsis
  ["â€¦", "…"],
  // rupee sign
  ["â‚¹", "₹"],
  // middle dot
  ["Â·", "·"],
  // multiplication sign
  ["Ã—", "×"],
  // right arrow
  ["â†’", "→"],
  ["â†'", "→"],
  ["â†", "→"],
  // check mark
  ["âœ"+"“", "✓"],
  ["âœ"+"", "✓"],
  ["âœ\"", "✓"],
  // cross mark
  ["âœ•", "✕"],
  // non-breaking space
  ["Â ", " "],
  // copyright / registered
  ["Â©", "©"],
  ["Â®", "®"],
  // degree
  ["Â°", "°"],
];

let total = 0;
const log = [];
for (const [bad, good] of fixes) {
  if (!s.includes(bad)) continue;
  const n = s.split(bad).length - 1;
  if (!n) continue;
  s = s.split(bad).join(good);
  total += n;
  log.push(`${n}× ${JSON.stringify(bad)} → ${JSON.stringify(good)}`);
}

// Heuristic catch-all: any remaining "â€" + ASCII byte that we haven't mapped
// is almost always the right double quote ”. We log them but only fix safe ones.
const stragglers = s.match(/â€./g);
if (stragglers) {
  log.push(`remaining "â€?" occurrences after first pass: ${stragglers.length}`);
}

fs.writeFileSync(f, s);
console.log("replacements:", total);
log.forEach((l) => console.log("  ", l));
