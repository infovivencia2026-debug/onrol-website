const AUTOPLAY_MS = 6500;

export function initHeroSlider() {
  const hero = document.querySelector<HTMLElement>("#home-glydi .hero");
  const stage = hero?.querySelector<HTMLElement>(".hero-bg");
  const slides = Array.from(hero?.querySelectorAll<HTMLElement>(".hero-slide") ?? []);
  const dots = Array.from(hero?.querySelectorAll<HTMLButtonElement>(".hero-slider-dots button") ?? []);
  const previous = hero?.querySelector<HTMLButtonElement>(".hero-slider-prev");
  const next = hero?.querySelector<HTMLButtonElement>(".hero-slider-next");

  if (!hero || !stage || slides.length < 2) return () => undefined;

  let active = 0;
  let timer: number | undefined;
  let touchStartX: number | undefined;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  stage.dataset.slider = "on";

  const render = (nextIndex: number, direction: 1 | -1) => {
    const oldIndex = active;
    active = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      slide.classList.remove("is-on", "is-out", "from-left");
      slide.setAttribute("aria-hidden", index === active ? "false" : "true");
    });

    if (oldIndex !== active) slides[oldIndex]?.classList.add(direction > 0 ? "is-out" : "from-left");
    slides[active]?.classList.add("is-on");

    dots.forEach((dot, index) => {
      const selected = index === active;
      dot.classList.toggle("is-on", selected);
      dot.setAttribute("aria-selected", String(selected));
      dot.tabIndex = selected ? 0 : -1;
    });
  };

  const stop = () => {
    if (timer !== undefined) window.clearInterval(timer);
    timer = undefined;
  };

  const start = () => {
    stop();
    if (reduceMotion || document.hidden) return;
    timer = window.setInterval(() => render(active + 1, 1), AUTOPLAY_MS);
  };

  const go = (index: number, direction: 1 | -1) => {
    render(index, direction);
    start();
  };

  const onPrevious = () => go(active - 1, -1);
  const onNext = () => go(active + 1, 1);
  const onVisibility = () => (document.hidden ? stop() : start());
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowLeft") onPrevious();
    if (event.key === "ArrowRight") onNext();
  };
  const onTouchStart = (event: TouchEvent) => {
    touchStartX = event.touches[0]?.clientX;
    stop();
  };
  const onTouchEnd = (event: TouchEvent) => {
    if (touchStartX === undefined) return;
    const distance = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
    if (Math.abs(distance) > 45) go(active + (distance < 0 ? 1 : -1), distance < 0 ? 1 : -1);
    else start();
    touchStartX = undefined;
  };

  previous?.addEventListener("click", onPrevious);
  next?.addEventListener("click", onNext);
  dots.forEach((dot, index) => dot.addEventListener("click", () => go(index, index >= active ? 1 : -1)));
  hero.addEventListener("mouseenter", stop);
  hero.addEventListener("mouseleave", start);
  hero.addEventListener("focusin", stop);
  hero.addEventListener("focusout", start);
  hero.addEventListener("keydown", onKeyDown);
  hero.addEventListener("touchstart", onTouchStart, { passive: true });
  hero.addEventListener("touchend", onTouchEnd, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  render(0, 1);
  start();

  return () => {
    stop();
    previous?.removeEventListener("click", onPrevious);
    next?.removeEventListener("click", onNext);
    hero.removeEventListener("mouseenter", stop);
    hero.removeEventListener("mouseleave", start);
    hero.removeEventListener("focusin", stop);
    hero.removeEventListener("focusout", start);
    hero.removeEventListener("keydown", onKeyDown);
    hero.removeEventListener("touchstart", onTouchStart);
    hero.removeEventListener("touchend", onTouchEnd);
    document.removeEventListener("visibilitychange", onVisibility);
    delete stage.dataset.slider;
  };
}
