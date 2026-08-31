/**
 * Behaviour for the program pages (program-console.css).
 *
 * Two things the CSS cannot do on its own:
 *  - the sticky curriculum index needs to know which module you are reading,
 *    so it can mark it (`.is-here`) as you scroll past;
 *  - a long document reads better with a sense of how far through it you are,
 *    so a hairline progress rail sits under the nav.
 *
 * Everything degrades to nothing: no observer support, or reduced motion, and
 * the page is simply a document with a static index.
 */
export function initProgramPage(): () => void {
  const root = document.querySelector<HTMLElement>("#home-glydi .px");
  if (!root) return () => {};

  const cleanups: Array<() => void> = [];

  /* ---- 1. scroll-spy over the curriculum ------------------------------- */
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>(".px-toc a"));
  const modules = links
    .map((a) => document.querySelector<HTMLElement>(a.getAttribute("href") || ""))
    .filter((el): el is HTMLElement => !!el);

  if (modules.length) {
    const mark = (id: string) => {
      links.forEach((a) => a.classList.toggle("is-here", a.getAttribute("href") === `#${id}`));
    };
    // An observer band picks the topmost INTERSECTING module, which lands one
    // behind as you scroll. The module being read is simply the last one whose
    // top has passed the reading line, so measure that directly.
    const readingLine = () => (window.innerHeight || 0) * 0.32;
    let spyTick = false;
    const spy = () => {
      if (spyTick) return;
      spyTick = true;
      requestAnimationFrame(() => {
        spyTick = false;
        const line = readingLine();
        let current = modules[0];
        for (const m of modules) {
          if (m.getBoundingClientRect().top <= line) current = m;
        }
        mark(current.id);
      });
    };
    window.addEventListener("scroll", spy, { passive: true });
    window.addEventListener("resize", spy, { passive: true });
    spy();
    cleanups.push(() => {
      window.removeEventListener("scroll", spy);
      window.removeEventListener("resize", spy);
    });
  }

  /* ---- 2. reading progress -------------------------------------------- */
  const rail = document.createElement("div");
  rail.className = "px-progress";
  rail.setAttribute("aria-hidden", "true");
  root.prepend(rail);
  cleanups.push(() => rail.remove());

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const doc = document.documentElement;
      const run = doc.scrollHeight - doc.clientHeight;
      rail.style.transform = `scaleX(${run > 0 ? Math.min(1, doc.scrollTop / run) : 0})`;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();
  cleanups.push(() => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onScroll);
  });

  return () => cleanups.forEach((c) => c());
}
