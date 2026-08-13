// Reveal helpers — kept fail-safe so a missed IntersectionObserver event never
// hides content. Initial state is fully visible; whileInView still triggers a
// subtle slide-up for entrance polish, but if the observer never fires the
// reader still sees the content.
export const sectionReveal = {
  initial: { opacity: 1, y: 0 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
} as const;

export const cardReveal = (index = 0) =>
  ({
    initial: { opacity: 1, y: 0 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] },
  }) as const;

export const cardHover = {
  whileHover: { y: -4, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
} as const;
