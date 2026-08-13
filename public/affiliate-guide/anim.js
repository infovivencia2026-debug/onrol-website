/* ============================================================
   Animation controller — scroll reveal, 3D tilt, parallax
   Progressive enhancement; safe if elements are missing.
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 0a. Scroll progress bar (always on) ---------- */
  const progressBar = document.createElement("div");
  progressBar.className = "scroll-progress";
  progressBar.setAttribute("aria-hidden", "true");
  document.body.appendChild(progressBar);

  let progressTick = false;
  function updateProgress() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
    progressBar.style.width = `${pct}%`;
    progressTick = false;
  }
  window.addEventListener("scroll", () => {
    if (!progressTick) { progressTick = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();

  /* ---------- 0b. Count-up on numeric stats ---------- */
  function countUp(el) {
    const node = el.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const raw = node.nodeValue.trim();
    const match = raw.match(/^(\d[\d,]*)(.*)$/s);
    if (!match) return;
    const target = parseInt(match[1].replace(/,/g, ""), 10);
    const suffix = match[2];
    if (reduceMotion) { node.nodeValue = target + suffix; return; }
    const dur = 1100;
    let start = null;
    function frame(t) {
      if (start === null) start = t;
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      node.nodeValue = Math.round(target * eased) + (p === 1 ? suffix : "");
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const countTargets = [
    document.querySelector(".commission-mark strong"),
    ...document.querySelectorAll(".board-stats dt"),
  ].filter(Boolean);

  if (countTargets.length) {
    const countObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { countUp(entry.target); countObs.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    countTargets.forEach((el) => countObs.observe(el));
  }

  if (reduceMotion) return;

  /* ---------- 1. Tag elements for scroll reveal ---------- */
  const revealPlan = [
    [".section-intro > div", "left"],
    [".section-intro > p", "right"],
    [".bento-card", "up"],
    [".walkthrough-heading > div", "left"],
    [".walkthrough-heading > p", "right"],
    [".guide-player", "zoom"],
    [".video-copy", "left"],
    [".video-placeholder", "right"],
    [".faq-intro", "left"],
    [".faq-list details", "up"],
    [".cover-body", "left"],
    [".cover-meta", "up"],
    [".footer-grid > div", "up"],
    [".route-divider", "up"],
  ];

  revealPlan.forEach(([selector, mode]) => {
    const nodes = document.querySelectorAll(selector);
    nodes.forEach((node, i) => {
      if (node.hasAttribute("data-reveal")) return;
      node.setAttribute("data-reveal", mode === "up" ? "" : mode);
      // stagger siblings that share a container
      node.style.setProperty("--reveal-delay", `${Math.min(i * 70, 420)}ms`);
    });
  });

  /* ---------- 2. IntersectionObserver to fire reveals ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));

  /* ---------- 3. Animate the hero route path when visible ---------- */
  const routeArt = document.querySelector(".route-art");
  if (routeArt) {
    const routeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { routeArt.classList.add("draw"); routeObserver.disconnect(); }
      });
    }, { threshold: 0.4 });
    routeObserver.observe(routeArt);
  }

  /* ---------- 4. 3D tilt on pointer ---------- */
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  function makeTilt(el, maxDeg) {
    if (!el) return;
    el.classList.add("tilt-3d");
    // wrap in a perspective scene without disturbing layout
    const scene = el.parentElement;
    if (scene) scene.classList.add("scene-3d");

    let frame = null;

    function onMove(e) {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;   // 0..1
      const py = (e.clientY - rect.top) / rect.height;   // 0..1
      const rotY = (px - 0.5) * maxDeg * 2;
      const rotX = (0.5 - py) * maxDeg * 2;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        el.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
        el.style.setProperty("--glx", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--gly", `${(py * 100).toFixed(1)}%`);
      });
    }
    function onEnter() { el.classList.add("is-tilting"); }
    function onLeave() {
      el.classList.remove("is-tilting");
      if (frame) cancelAnimationFrame(frame);
      el.style.transform = "";
    }

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
  }

  if (fine) {
    makeTilt(document.querySelector(".hero-board"), 7);
    makeTilt(document.querySelector(".video-placeholder"), 5);
    document.querySelectorAll(".bento-card").forEach((card) => makeTilt(card, 4));
  }

  /* ---------- 5. Light parallax on hero decorative depth ---------- */
  if (fine) {
    const hero = document.querySelector(".hero");
    const board = document.querySelector(".hero-board");
    if (hero && board) {
      hero.addEventListener("pointermove", (e) => {
        const cx = (e.clientX / window.innerWidth - 0.5) * 2;
        const cy = (e.clientY / window.innerHeight - 0.5) * 2;
        board.style.setProperty("--px", `${(cx * 8).toFixed(1)}px`);
        board.style.setProperty("--py", `${(cy * 8).toFixed(1)}px`);
      });
    }
  }
})();
