import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Lightbulb, Hammer, Rocket, IndianRupee } from "lucide-react";
import Container from "@/components/shared/Container";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const STEPS = [
  {
    label: "Learn",
    body: "Prompts, tools, agents, vibe coding — the actual stack.",
    Icon: Lightbulb,
    accent: "from-orange-500 to-orange-600",
  },
  {
    label: "Build",
    body: "Three live projects in 3 months. No tutorials. Just shipping.",
    Icon: Hammer,
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    label: "Launch",
    body: "Push real URLs, real automations, real products to live users.",
    Icon: Rocket,
    accent: "from-orange-500 to-amber-500",
  },
  {
    label: "Earn",
    body: "Convert what you built into freelance, product, or career income.",
    Icon: IndianRupee,
    accent: "from-emerald-500 to-teal-500",
  },
];

/**
 * Reviewer ask (Sriram + Ravindra): the execution model should be the highlight
 * of the homepage with an animated arrow flow. This component is the answer.
 *
 * Animates: each step fades in sequentially, then a connecting line draws across
 * once they're visible.
 */
export default function HomeFlowRibbon() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });

  return (
    <section
      className="onrol-lazy-section relative overflow-hidden bg-[#e6eaf1] py-12 md:py-28"
      style={{ fontFamily: INTER_STACK }}
    >
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_50%_30%,rgba(255,107,71,0.08),transparent_70%)]" />
      </div>

      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-orange-600">
            — The execution model
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[#0B1640] md:text-base">
            Four stages. One straight line from "I'm curious about AI" to "I'm earning from AI."
            Every ONROL learner walks the same arc.
          </p>
        </div>

        {/* Desktop: 4-up with connecting arrow. Mobile: stacked. */}
        <div ref={ref} className="relative mt-10 grid gap-4 md:mt-20 md:grid-cols-4 md:gap-4">
          {/* Animated connecting line — desktop only */}
          <motion.div
            aria-hidden
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ delay: 0.45, duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
            className="absolute left-[8%] right-[8%] top-[42px] hidden h-px origin-left bg-gradient-to-r from-orange-400/60 via-violet-400/60 via-orange-400/60 to-emerald-400/60 md:block"
          />

          {STEPS.map((step, i) => {
            const { Icon } = step;
            return (
              <motion.div
                key={step.label}
                initial={{ opacity: 1, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.12, duration: 0.5, ease: "easeOut" }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center md:items-start md:text-left">
                  <div className="relative">
                    <div
                      className={`grid h-[84px] w-[84px] place-items-center rounded-2xl bg-gradient-to-br ${step.accent} text-[#f3f5f8]`}
                    >
                      <Icon className="h-9 w-9" strokeWidth={2.4} />
                    </div>
                    <span className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-[#e6eaf1] text-[11px] font-bold text-[#0B1640]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3
                    className="mt-5 text-[#0B1640]"
                    style={{
                      fontSize: "clamp(20px, 2.2vw, 24px)",
                      fontWeight: 800,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {step.label}
                  </h3>
                  <p className="mt-2 max-w-[260px] text-[14px] leading-relaxed text-[#0B1640]/90">
                    {step.body}
                  </p>
                </div>

                {/* Mobile arrow between cards */}
                {i < STEPS.length - 1 ? (
                  <div className="mt-6 flex items-center justify-center text-[#0B1640]/85 md:hidden">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
