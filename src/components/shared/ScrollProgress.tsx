// Thin scroll-progress bar at top of every page.
// Uses framer-motion's useScroll + spring smoothing so the bar tracks
// fluidly without jank on mobile. Hidden under prefers-reduced-motion.

import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

export default function ScrollProgress() {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 30,
    mass: 0.4,
  });

  if (reduced) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[2px] origin-left bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500"
      style={{ scaleX }}
    />
  );
}
