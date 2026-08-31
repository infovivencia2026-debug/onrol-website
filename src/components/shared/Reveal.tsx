// Reveal — fades children up as they enter the viewport.
//
// A thin, opinionated wrapper around framer-motion's whileInView so we
// can sprinkle "reveal on scroll" without re-typing the same 4 props
// in every component. Respects prefers-reduced-motion automatically.
//
// Usage:
//   <Reveal>
//     <h2>Headline that fades up when scrolled into view</h2>
//   </Reveal>
//
//   <Reveal delay={0.1} y={24}>
//     <Card />
//   </Reveal>

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "initial" | "whileInView" | "viewport" | "transition"> {
  children: ReactNode;
  /** Pixels to translate up from. Default 18. */
  y?: number;
  /** Stagger delay (s). Default 0. */
  delay?: number;
  /** Animation duration (s). Default 0.5. */
  duration?: number;
  /** How much of the element must be visible before triggering. Default 0.2. */
  amount?: number;
  /** Replay every time it enters view? Default false (one-shot). */
  repeat?: boolean;
}

export default function Reveal({
  children,
  y = 18,
  delay = 0,
  duration = 0.5,
  amount = 0.2,
  repeat = false,
  className,
  ...rest
}: RevealProps) {
  const reduced = useReducedMotion();

  // Reduced-motion users see the content statically — no transform, no fade.
  if (reduced) {
    return (
      <div className={className} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: !repeat, amount }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
