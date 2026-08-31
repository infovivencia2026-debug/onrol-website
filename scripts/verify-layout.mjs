import puppeteer from "puppeteer";

const BASE = "http://localhost:8080";
// every glydi route, from src/pages/glydi/registry.ts
const PAGES = [
  "/", "/about", "/programs", "/programs/ai", "/programs/cyber",
  "/programs/aica", "/programs/ai-generalist", "/programs/ai-architect", "/programs/cybersecurity",
  "/programs/soc-analyst", "/mentors", "/questions", "/glossary", "/blog",
  "/tools/ai-skills-quiz", "/masterclass", "/why-now", "/ai-course-in-hyderabad",
  "/best-ai-institute-in-hyderabad", "/privacy-policy", "/terms-and-conditions",
  "/contact", "/thank-you",
];
const WIDTHS = [1440, 1920, 2560, 390];
const QUIET = process.argv.includes("--quiet");

const browser = await puppeteer.launch({ channel: "chrome", headless: "new", args: ["--no-sandbox"] });
const failures = [];
const notes = [];

for (const path of PAGES) {
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    const errors = [];
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    await page.goto(BASE + path, { waitUntil: "networkidle0", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 900));

    // Walk the page so every scroll-reveal has had its chance to fire. Without
    // this, the opacity guard below cannot tell "hidden until you scroll to it"
    // (correct) from "hidden forever because no script will ever reveal it"
    // (the bug it exists to catch).
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 130));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 420));
    });
    await new Promise((r) => setTimeout(r, 500));

    const r = await page.evaluate(() => {
      const px = (v) => parseFloat(v);
      // --rule-x / --page-edge are max()/calc() expressions: reading the custom
      // property gives the unresolved text, so measure the resolved values off
      // the pseudo-element and a probe instead.
      const ruleStyle = getComputedStyle(document.body, "::before");
      const ruleX = ruleStyle.content !== "none" && ruleStyle.display !== "none" ? px(ruleStyle.left) : null;
      const probe = document.createElement("div");
      probe.style.cssText = "position:absolute;width:var(--page-edge);height:0;visibility:hidden";
      document.body.appendChild(probe);
      const edge = probe.getBoundingClientRect().width;
      probe.remove();

      const logo = document.querySelector(".site-logo img") || document.querySelector(".site-logo");
      const h1 = document.querySelector(".hero .hero-title") || document.querySelector(".pagehero .ph-title") || document.querySelector("h1");
      const nav = document.querySelector(".nav");
      const navVisible = !!nav && getComputedStyle(nav).display !== "none" && nav.getBoundingClientRect().width > 0;

      // any element still drawing its own vertical guide pair
      const strayRules = [];
      for (const el of document.querySelectorAll(".panel, .pagehero, .cta-section, .who, .build")) {
        for (const pseudo of ["::before", "::after"]) {
          const s = getComputedStyle(el, pseudo);
          if (s.content !== "none" && s.borderLeftStyle === "dotted" && px(s.borderLeftWidth) > 0) {
            strayRules.push(el.className + pseudo);
          }
        }
      }

      // text elements left of the rule
      const offenders = [];
      if (ruleX !== null) {
        const sel = "h1,h2,h3,p,li,dt,dd,.ph-title,.ph-sub";
        for (const el of document.querySelectorAll(sel)) {
          const rect = el.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) continue;
          if (!el.textContent.trim()) continue;
          const st = getComputedStyle(el);
          if (st.visibility === "hidden" || st.display === "none" || px(st.opacity) === 0) continue;
          if (el.closest(".footer") || el.closest(".login-menu")) continue;
          if (rect.left < ruleX - 1) {
            offenders.push(`${el.tagName}.${(el.className || "").toString().slice(0, 30)} left=${Math.round(rect.left)}`);
          }
        }
      }

      return {
        ruleX,
        edge,
        logoLeft: logo ? logo.getBoundingClientRect().left : null,
        h1Left: h1 ? h1.getBoundingClientRect().left : null,
        h1Text: h1 ? h1.textContent.trim().slice(0, 40) : null,
        navVisible,
        strayRules,
        offenders: offenders.slice(0, 6),
        // Regression guard: an entrance rule that matches a page whose script
        // never adds the reveal class leaves real content permanently invisible.
        // This catches any laid-out element sitting at opacity 0.
        hidden: (() => {
          const out = [];
          for (const el of document.querySelectorAll("main *, header *, section *")) {
            const r = el.getBoundingClientRect();
            if (r.width < 4 || r.height < 4) continue;
            if (!el.textContent.trim()) continue;
            const st = getComputedStyle(el);
            if (st.visibility === "hidden" || st.display === "none") continue;
            // An inactive slide in a deliberate two-state slider is SUPPOSED to
            // sit at opacity 0; only the active one is content. Everything else
            // hidden with no way back is still a failure.
            const ALT_STATE = [".ts-slide", ".ts-art-wrap"];
            if (ALT_STATE.some((sel) => el.matches(sel)) && !el.classList.contains("is-on")) continue;
            if (parseFloat(st.opacity) === 0) {
              out.push(el.tagName + "." + (el.className || "").toString().trim().slice(0, 28));
            }
          }
          return [...new Set(out)].slice(0, 4);
        })(),
        overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
        canScroll: document.documentElement.scrollHeight > window.innerHeight + 10,
        bodyOverflow: getComputedStyle(document.body).overflowY,
        heroFont: (() => {
          const t = document.querySelector(".hero .hero-title");
          return t ? getComputedStyle(t).fontFamily : null;
        })(),
        manrope: (() => {
          const el = document.querySelector("#home-glydi p, .subpage p, p");
          return el ? getComputedStyle(el).fontFamily : null;
        })(),
      };
    });

    const tag = `${path} @${width}`;
    const gap = r.logoLeft !== null && r.h1Left !== null ? Math.abs(r.logoLeft - r.h1Left) : null;
    const CENTRED = ["/thank-you"];   // centred by design, not misaligned
    if (width > 900 && !CENTRED.includes(path)) {
      if (gap === null) failures.push(`${tag}: missing logo or h1`);
      else if (gap > 2) failures.push(`${tag}: logo.left ${Math.round(r.logoLeft)} vs h1.left ${Math.round(r.h1Left)} (Δ${gap.toFixed(1)}px)`);
    }
    if (!r.navVisible) failures.push(`${tag}: .nav not visible`);
    if (r.strayRules.length) failures.push(`${tag}: stray guide pair on ${r.strayRules.join(", ")}`);
    if (r.offenders.length) failures.push(`${tag}: text left of rule (${r.ruleX?.toFixed(0)}): ${r.offenders.join(" | ")}`);
    if (r.overflow) failures.push(`${tag}: horizontal overflow`);
    if (r.hidden.length) failures.push(`${tag}: content stuck at opacity 0: ${r.hidden.join(", ")}`);
    if (errors.length) failures.push(`${tag}: ${errors.length} console/page error(s): ${errors.slice(0, 2).join(" | ")}`);
    if (r.bodyOverflow === "hidden") failures.push(`${tag}: body overflow-y hidden (scroll lock leaked)`);

    notes.push(`${tag.padEnd(22)} rule=${r.ruleX?.toFixed(0)} edge=${r.edge?.toFixed(0)} logo=${r.logoLeft?.toFixed(0)} h1=${r.h1Left?.toFixed(0)} nav=${r.navVisible} font=${(r.manrope || "").split(",")[0]}${path === "/" ? " hero=" + (r.heroFont || "").split(",")[0] : ""}`);
    await page.close();
  }
}

await browser.close();
console.log(notes.join("\n"));
console.log("\n===== " + (failures.length ? `${failures.length} FAILURE(S)` : "ALL CHECKS PASS") + " =====");
if (failures.length) console.log(failures.join("\n"));
