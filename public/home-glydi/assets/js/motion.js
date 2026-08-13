/* =========================================================================
   ONROL — shared motion engine.  Load AFTER (optional) GSAP + ScrollTrigger
   + Lenis CDNs, with `defer`.  Everything degrades gracefully:
     - no GSAP  -> content still visible, no reveals
     - reduced-motion / saveData / mobile -> short-circuits (see GUARDRAILS)
   Opt-in hooks (add to markup):
     data-hero              stagger its children in on load
     data-reveal            fade+rise its children on scroll
     data-split             per-word reveal of a heading
     data-parallax          move at ~0.85x scroll (desktop only)
     data-tilt              3D tilt toward pointer (desktop only)
     data-magnetic          button eases toward cursor (desktop only)
     data-countup="1200"    count up on scroll (data-suffix, data-prefix, data-decimals)
   ========================================================================= */
(function () {
  "use strict";

  /* ---------- GUARDRAILS ---------- */
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SAVE = !!(navigator.connection && navigator.connection.saveData);
  var MOBILE = window.matchMedia("(max-width: 767px)").matches;
  var FINE = window.matchMedia("(pointer: fine)").matches;
  var G = window.gsap;

  /* inject minimal CSS so this works even on pages that don't link styles.css */
  (function css() {
    var s = document.createElement("style");
    s.textContent =
      ".motion-progress{position:fixed;top:0;left:0;height:3px;width:100%;transform:scaleX(0);transform-origin:0 50%;background:var(--orange,#F46718);z-index:200;pointer-events:none;will-change:transform}" +
      "[data-tilt]{transition:transform .5s cubic-bezier(.2,.7,.2,1),box-shadow .3s ease,border-color .3s ease;transform-style:preserve-3d;will-change:transform}" +
      "[data-magnetic]{transition:transform .25s cubic-bezier(.2,.7,.2,1)}" +
      "@media (prefers-reduced-motion:reduce){.motion-progress{display:none}[data-tilt],[data-magnetic]{transition:none!important;transform:none!important}}";
    document.head.appendChild(s);
  })();

  /* ---------- scroll-progress bar (cheap, always on unless reduced) ---------- */
  if (!REDUCE && !document.querySelector(".motion-progress")) {
    var bar = document.createElement("div");
    bar.className = "motion-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    var tick = false;
    function upd() {
      tick = false;
      var d = document.documentElement;
      var p = d.scrollTop / (d.scrollHeight - d.clientHeight) || 0;
      bar.style.transform = "scaleX(" + p + ")";
    }
    addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* ---------- 3D tilt (desktop pointer only, additive — safe w/o GSAP) ---------- */
  if (!REDUCE && FINE && !MOBILE) {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      var MAX = parseFloat(el.getAttribute("data-tilt")) || 6, raf = null, rx = 0, ry = 0;
      function apply() { raf = null; el.style.transform = "perspective(760px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateZ(6px)"; }
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        ry = ((e.clientX - r.left) / r.width - 0.5) * MAX * 2;
        rx = (0.5 - (e.clientY - r.top) / r.height) * MAX * 2;
        el.style.transition = "none";
        if (!raf) raf = requestAnimationFrame(apply);
      });
      el.addEventListener("mouseleave", function () { el.style.transition = ""; el.style.transform = ""; });
    });
    /* magnetic buttons */
    document.querySelectorAll("[data-magnetic]").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.28 + "px," + (e.clientY - r.top - r.height / 2) * 0.4 + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }

  if (REDUCE) { markCountupsDone(); return; }   /* nothing further */

  /* NOTE: native scrolling is used (no Lenis / smooth-scroll hijack) so the page
     scrolls normally. Reveals below are pure fade+rise and don't touch scroll. */

  if (!G) { showAll(); return; }   /* GSAP failed to load -> reveal everything, no anim */
  if (window.ScrollTrigger) G.registerPlugin(window.ScrollTrigger);

  /* ---------- hero load stagger ---------- */
  var hero = document.querySelector("[data-hero]");
  if (hero) {
    var hi = hero.querySelectorAll("[data-hero-item]");
    var items = hi.length ? hi : hero.querySelectorAll(".eyebrow, h1, .hero-copy, .hero-stats, .hero-actions, p, .button");
    G.set(items, { opacity: 0, y: 26 });
    G.to(items, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08, delay: 0.1 });
  }

  /* ---------- split-text section titles (per-word) ---------- */
  if (!MOBILE) document.querySelectorAll("[data-split]").forEach(function (el) {
    if (el.dataset.done) return; el.dataset.done = "1";
    el.innerHTML = el.textContent.replace(/(\S+)/g, '<span class="mw" style="display:inline-block;overflow:hidden;vertical-align:top"><span style="display:inline-block">$1</span></span>');
    var inner = el.querySelectorAll(".mw > span");
    G.set(inner, { yPercent: 115 });
    G.to(inner, { yPercent: 0, duration: 0.75, ease: "power3.out", stagger: 0.045, scrollTrigger: { trigger: el, start: "top 86%" } });
  });

  /* ---------- generic section reveals (children stagger, lazy) ---------- */
  document.querySelectorAll("[data-reveal]").forEach(function (sec) {
    var kids = sec.children && sec.children.length > 1 ? sec.children : [sec];
    G.set(kids, { opacity: 0, y: 30 });
    G.to(kids, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: sec, start: "top 82%" } });
  });

  /* ---------- parallax (desktop only) ---------- */
  if (!MOBILE && window.ScrollTrigger) document.querySelectorAll("[data-parallax]").forEach(function (el) {
    G.to(el, { yPercent: -15, ease: "none", scrollTrigger: { trigger: el.parentElement || el, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- count-up ---------- */
  document.querySelectorAll("[data-countup]").forEach(function (el) {
    var end = parseFloat(el.getAttribute("data-countup")) || 0, dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
    var pre = el.getAttribute("data-prefix") || "", suf = el.getAttribute("data-suffix") || "";
    window.ScrollTrigger ? window.ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true, onEnter: function () {
        var o = { v: 0 }; G.to(o, { v: end, duration: 1.5, ease: "power2.out", onUpdate: function () { el.textContent = pre + o.v.toFixed(dec) + suf; } });
      }
    }) : (el.textContent = pre + end.toFixed(dec) + suf);
  });

  /* helpers */
  function showAll() { document.querySelectorAll("[data-hero],[data-reveal]").forEach(function (s) { s.style.opacity = "1"; }); markCountupsDone(); }
  function markCountupsDone() {
    document.querySelectorAll("[data-countup]").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-countup")) || 0, dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      el.textContent = (el.getAttribute("data-prefix") || "") + end.toFixed(dec) + (el.getAttribute("data-suffix") || "");
    });
  }
})();
