/**
 * Scroll choreography for the programs family.
 *
 * The sub-pages don't all ship the same inline scripts — /programs, for one,
 * has no `.reveal` observer at all — so the shared template can't assume the
 * hooks exist. This module supplies them for every page that loads
 * programs-theme.css: `.reveal` sections gain `.in` as they reach the fold and
 * their `.t` children cascade in 80ms apart.
 *
 * Fail-safe by construction: the hidden states are gated behind
 * `[data-motion="on"]`, which only this module sets. If it never runs, or
 * IntersectionObserver is missing, or the visitor asks for reduced motion,
 * everything renders visible.
 *
 * Sections are observed rather than individual elements, and their children
 * are queried at reveal time, so nodes a page script swaps in later are still
 * covered. A slow safety sweep catches anything inserted after that.
 */
export function initProgramsMotion(): () => void {
  const root = document.querySelector<HTMLElement>("#home-glydi .pg");
  if (!root) return () => {};

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return () => {};

  root.setAttribute("data-motion", "on");

  const cascade = (section: Element) => {
    section.classList.add("in");
    section.querySelectorAll<HTMLElement>(".t").forEach((el, i) => {
      el.style.transitionDelay = `${i * 80}ms`;
      el.classList.add("show");
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        cascade(e.target);
        io.unobserve(e.target);          // reveal once — no re-hide on scroll back
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.04 },
  );

  root.querySelectorAll(".reveal").forEach((s) => io.observe(s));

  // Anything a late script inserted is revealed outright — invisible content
  // is never acceptable.
  const sweep = window.setInterval(() => {
    root.querySelectorAll<HTMLElement>(".t:not(.show)").forEach((el) => {
      if (el.getBoundingClientRect().top < (window.innerHeight || 0)) el.classList.add("show");
    });
    root.querySelectorAll<HTMLElement>(".reveal:not(.in)").forEach((el) => {
      if (el.getBoundingClientRect().top < (window.innerHeight || 0)) cascade(el);
    });
  }, 1200);

  return () => {
    io.disconnect();
    clearInterval(sweep);
    root.removeAttribute("data-motion");
  };
}
