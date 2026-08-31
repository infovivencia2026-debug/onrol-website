/**
 * Home motion layer — the "paper & ember" theme's choreography.
 *
 * Everything below the hero animates on entry; the hero is deliberately left
 * alone (it has its own scripted intro). No markup is edited: this module tags
 * elements with data-rv / --d and the paired stylesheet (theme-motion.css)
 * carries the states.
 *
 * Triggering is per SECTION, not per element. Some of the ported page scripts
 * replace nodes after mount (the film, the newsletter form) — an observer bound
 * to the original node would then never fire and its clone, which inherits the
 * data-rv attribute, would stay invisible forever. Observing the five stable
 * section containers and querying their descendants at reveal time sidesteps
 * that entirely, and a final safety sweep reveals anything inserted later.
 *
 * Fail-safe by construction: the hidden states live behind
 * #home-glydi[data-motion="on"], and that flag is set here. If this module
 * never runs, or IntersectionObserver is missing, or the visitor asks for
 * reduced motion, nothing is ever hidden.
 */

type Variant = "up" | "mask" | "line" | "scale";

/** Per section: [selector, variant, stagger step in ms] — order is reveal order. */
const PLAN: Record<string, Array<[string, Variant, number]>> = {
  // 02 — problem / steps board
  ".panel": [
    [".panel-head h1", "up", 0],
    [".panel-head > p", "up", 60],
    [".panel-head .cohort-note", "up", 60],
    [".panel-head .cta .btn", "up", 70],
    [".panel-trust .pt-item", "up", 80],
  ],
  // 03 — about + programs banner
  ".build": [
    [".build-lead .build-video", "mask", 0],
    [".build-text > *", "up", 70],
    [".build-banner .bb-title", "up", 0],
    [".build-banner .bb-right > *", "up", 80],
  ],
  // 04 — who it's for
  ".who": [
    [".who-head > *", "up", 70],
    [".who-grid .who-card", "scale", 55],
  ],
  // 05 — closing CTA
  ".cta-section": [[".cta-section > *", "up", 80]],
  // 06 — footer
  ".footer": [
    [".footer-top .f-brand > *", "up", 70],
    [".footer-top .f-col", "up", 90],
    [".footer-news > *", "up", 90],
  ],
};

export function initHomeMotion(): () => void {
  const disposers: Array<() => void> = [];
  const root = document.getElementById("home-glydi");
  if (!root) return () => {};

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return () => {};

  root.setAttribute("data-motion", "on");
  disposers.push(() => root.removeAttribute("data-motion"));

  /* ---- 1. tag now (so nothing flashes in before its cue) --------------- */
  const tag = (scope: ParentNode, entries: Array<[string, Variant, number]>) => {
    for (const [sel, variant, step] of entries) {
      scope.querySelectorAll<HTMLElement>(sel).forEach((el, i) => {
        if (el.dataset.rv) return;             // first plan entry wins
        el.dataset.rv = variant;
        if (step) el.style.setProperty("--d", `${i * step}ms`);
      });
    }
  };

  const sections: Array<[HTMLElement, Array<[string, Variant, number]>]> = [];
  for (const [sectionSel, entries] of Object.entries(PLAN)) {
    const section = root.querySelector<HTMLElement>(sectionSel);
    if (!section) continue;
    tag(section, entries);
    sections.push([section, entries]);
  }

  /* ---- 2. reveal a whole section when it reaches the fold --------------- */
  const revealIn = (section: HTMLElement, entries: Array<[string, Variant, number]>) => {
    tag(section, entries);                     // re-tag: nodes may have been replaced
    section.querySelectorAll<HTMLElement>("[data-rv]").forEach((el) => el.classList.add("rv-in"));
  };

  const io = new IntersectionObserver(
    (records) => {
      for (const r of records) {
        if (!r.isIntersecting) continue;
        const hit = sections.find(([s]) => s === r.target);
        if (hit) revealIn(hit[0], hit[1]);
        io.unobserve(r.target);                // reveal once — no re-hide on scroll back
      }
    },
    // fire a little before the section reaches the fold, so the motion reads as
    // "already underway" rather than "triggered by the scrollbar"
    { rootMargin: "0px 0px -10% 0px", threshold: 0.04 },
  );
  disposers.push(() => io.disconnect());
  sections.forEach(([s]) => io.observe(s));

  /* ---- 3. safety sweep -------------------------------------------------- */
  /* Anything a late script inserted (or any element an observer somehow never
     fired for) is revealed outright. Invisible content is never acceptable. */
  const sweep = window.setInterval(() => {
    root.querySelectorAll<HTMLElement>("[data-rv]:not(.rv-in)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 0)) el.classList.add("rv-in");
    });
  }, 1200);
  disposers.push(() => clearInterval(sweep));

  /* ---- 4. who-grid parallax -------------------------------------------- */
  /* Each column drifts at a slightly different rate as the section crosses the
     viewport. Transform-only (no layout), capped at ±26px, desktop only. */
  const grid = root.querySelector<HTMLElement>(".who-grid");
  const cards = grid ? Array.from(grid.querySelectorAll<HTMLElement>(".who-card")) : [];
  const wide = window.matchMedia("(min-width: 901px)");
  let raf = 0;
  let queued = false;

  const drift = () => {
    queued = false;
    if (!grid || !wide.matches) return;
    const r = grid.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    // -1 (entering from below) .. 1 (leaving at the top)
    const p = Math.max(-1, Math.min(1, (vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2)));
    cards.forEach((card, i) => {
      const rate = [26, 10, 18, 4][i % 4];     // uneven on purpose — a regular ramp
      card.style.transform = `translate3d(0, ${(-p * rate).toFixed(2)}px, 0)`;
    });                                        // would read as a slide, not depth
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    raf = requestAnimationFrame(drift);
  };

  if (cards.length) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    drift();
    disposers.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      cards.forEach((c) => { c.style.transform = ""; });
    });
  }

  /* ---- 5. pointer-tracked sheen on the programs banner ------------------ */
  const banner = root.querySelector<HTMLElement>(".build-banner");
  if (banner) {
    const track = (ev: PointerEvent) => {
      const r = banner.getBoundingClientRect();
      banner.style.setProperty("--mx", `${((ev.clientX - r.left) / r.width) * 100}%`);
      banner.style.setProperty("--my", `${((ev.clientY - r.top) / r.height) * 100}%`);
    };
    banner.addEventListener("pointermove", track);
    disposers.push(() => banner.removeEventListener("pointermove", track));
  }

  /* ---- 6. the hero slider ---------------------------------------------
     The pictures live in the markup as <i class="hero-slide">, so adding
     another one is a single line of HTML — this counts what it finds.
     It holds still for reduced motion, and pauses while the tab is hidden
     rather than repainting a full-bleed image nobody is looking at. */
  {
    const stage = root.querySelector<HTMLElement>(".hero .hero-bg");
    const slides = stage ? Array.from(stage.querySelectorAll<HTMLElement>(".hero-slide")) : [];
    if (slides.length) {
      slides[0].classList.add("is-on");
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (slides.length > 1 && !still && stage) {
        stage.dataset.slider = "on";   // the CSS fallback stands down
        const hold = parseInt(getComputedStyle(stage).getPropertyValue("--hold"), 10) || 6500;
        let at = 0;
        let timer = 0;
        const outs: number[] = [];
        const step = () => {
          const prev = slides[at];
          at = (at + 1) % slides.length;
          prev.classList.replace("is-on", "is-out");
          slides[at].classList.remove("is-out");
          slides[at].classList.add("is-on");
          outs.push(window.setTimeout(() => prev.classList.remove("is-out"), 1600));
        };
        const start = () => { if (!timer) timer = window.setInterval(step, hold); };
        const stop = () => { if (timer) { window.clearInterval(timer); timer = 0; } };
        const onVis = () => (document.hidden ? stop() : start());
        start();
        document.addEventListener("visibilitychange", onVis);
        disposers.push(() => {
          stop();
          document.removeEventListener("visibilitychange", onVis);
          outs.forEach((t) => clearTimeout(t));
        });
      }
    }
  }

  /* ---- 7. the film -----------------------------------------------------
     The play button was wired in effects.ts, which nothing on this page
     calls, so clicking it did nothing at all. The film is the one thing
     on the home page a visitor is asked to press. */
  {
    const shell = root.querySelector<HTMLElement>(".build-video");
    const video = document.getElementById("aboutVid") as HTMLVideoElement | null;
    const cover = document.getElementById("vidCover");
    if (shell && video) {
      const start = () => {
        video.muted = false;          // it is a film with a voice in it
        video.loop = false;
        shell.classList.add("is-playing");
        void video.play().catch(() => {
          // autoplay policy refused the unmuted start: fall back to muted
          video.muted = true;
          void video.play().catch(() => shell.classList.remove("is-playing"));
        });
      };
      const stop = () => { video.pause(); shell.classList.remove("is-playing"); };
      const toggle = () => (video.paused ? start() : stop());

      if (cover) { cover.addEventListener("click", start); disposers.push(() => cover.removeEventListener("click", start)); }
      video.addEventListener("click", toggle);
      video.addEventListener("ended", () => shell.classList.remove("is-playing"));
      disposers.push(() => { video.removeEventListener("click", toggle); stop(); });

      // scrolling away pauses it rather than leaving a voice talking to nobody
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((es) => {
          es.forEach((e) => { if (!e.isIntersecting && !video.paused) stop(); });
        }, { threshold: 0.2 });
        io.observe(shell);
        disposers.push(() => io.disconnect());
      }
    }
  }

  return () => { disposers.forEach((d) => d()); };
}
