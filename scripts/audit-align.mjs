/* Alignment audit: every major block's left edge vs the shared --page-edge.
 * The design system says one measure holds the page; this reports anything
 * that drifts off it by more than 2px. Run: node scripts/audit-align.mjs [path]
 */
import puppeteer from "puppeteer";

const BASE = "http://localhost:8080";
const path = process.argv[2] || "/";
const widths = [1440, 1920];

const browser = await puppeteer.launch({ channel: "chrome", headless: "new" });
for (const width of widths) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 1000 });
  await page.goto(BASE + path, { waitUntil: "networkidle0", timeout: 60000 });
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });

  const rows = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;width:var(--page-edge);height:0;visibility:hidden";
    document.body.appendChild(probe);
    const edge = probe.getBoundingClientRect().width;
    probe.remove();

    const SEL = [
      ".hero-title", ".hero-actions", ".hero-meta", ".hero-cue",
      ".panel-head h1", ".panel-head > p", ".panel-head .cta", ".steps-board", ".panel-trust",
      ".build-lead", ".build-banner", ".build-text .pipe-eyebrow",
      ".who-head", ".who-title", ".who-grid",
      ".cta-section .cta-title", ".cta-eyebrow",
      ".footer-top", ".footer-news", ".footer-inner",
      ".pagehero-inner", ".ph-title", ".subpage",
    ];
    const out = [];
    for (const sel of SEL) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width < 10 || r.height < 4) continue;
        // full-width containers hold the spine with padding, not position —
        // compare the CONTENT edge or every section reads as "off by -edge"
        const cs = getComputedStyle(el);
        // Two kinds of block align differently and conflating them makes the
        // report useless:
        //   - a CARD (has a border or a filled background) aligns by its BOX;
        //     its padding is interior space, not a gutter.
        //   - a bare CONTAINER holds the spine with padding, so its content
        //     edge is what must land on the measure.
        const hasBorder = parseFloat(cs.borderLeftWidth) > 0;
        const bg = cs.backgroundColor;
        const filled = bg && bg !== "transparent" && !/rgba(0, 0, 0, 0)/.test(bg);
        // The white theme paints .who / .who-head #fff, which would misread
        // them as cards; they are bare containers that hold the spine with
        // padding, so name them explicitly.
        const CONTAINERS = [".who-head", ".who-grid", ".subpage", ".pagehero"];
        const isCard = (hasBorder || filled) && !CONTAINERS.includes(sel);
        const padL = isCard ? 0 : parseFloat(cs.paddingLeft) || 0;
        const padR = isCard ? 0 : parseFloat(cs.paddingRight) || 0;
        out.push({
          sel,
          left: Math.round((r.left + padL) * 10) / 10,
          right: Math.round((window.innerWidth - r.right + padR) * 10) / 10,
        });
        break; // first instance is enough
      }
    }
    return { edge: Math.round(edge * 10) / 10, out };
  });

  console.log(`\n=== ${path} @${width}  (--page-edge = ${rows.edge}px) ===`);
  for (const r of rows.out) {
    const dx = Math.round((r.left - rows.edge) * 10) / 10;
    // a second grid column is legitimately inset; only flag first-column blocks
    const SECOND_COL = [".build-text .pipe-eyebrow"];
    const flag = Math.abs(dx) > 2 && !SECOND_COL.includes(r.sel)
      ? `  <-- OFF by ${dx > 0 ? "+" : ""}${dx}px`
      : (SECOND_COL.includes(r.sel) ? "  (2nd column, expected)" : "");
    console.log(`${r.sel.padEnd(28)} left=${String(r.left).padStart(7)}  rightGap=${String(r.right).padStart(7)}${flag}`);
  }
  await page.close();
}
await browser.close();
