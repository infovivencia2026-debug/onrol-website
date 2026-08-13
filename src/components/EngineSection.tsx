import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Cog, Rocket, DollarSign, TrendingUp, ArrowRight, ArrowDown } from "lucide-react";

const steps = [
  {
    icon: Cog,
    label: "Build",
    tagline: "Skill → Proof",
    desc: "Learn through practical, applied learning that produces visible, portfolio-ready outputs.",
    color: "from-orange-500/20 to-orange-500/5",
  },
  {
    icon: Rocket,
    label: "Deploy",
    tagline: "Proof → Systems",
    desc: "Turn knowledge into live automations, workflow systems, and client-ready deliverables.",
    color: "from-primary/18 to-primary/5",
  },
  {
    icon: DollarSign,
    label: "Monetize",
    tagline: "Systems → Income",
    desc: "Use real proof of work to unlock freelance, agency, startup, and high-paying job paths.",
    color: "from-amber-400/18 to-amber-400/5",
  },
  {
    icon: TrendingUp,
    label: "Scale",
    tagline: "Income → Growth",
    desc: "Grow through advanced tracks, ONROL Community, and long-term execution support.",
    color: "from-orange-300/16 to-orange-300/4",
  },
];

const EngineSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="engine" className="py-12 md:py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 shimmer-line" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <span className="text-primary text-[11px] font-body font-bold tracking-[0.28em] uppercase">How it works</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
            The Talent-to-Income Engine
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto font-body text-base md:text-lg">
            This is not course consumption. This is capability conversion.
          </p>
        </motion.div>

        {/* Steps grid */}
        <div className="relative max-w-6xl mx-auto">
          <div className="bento-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
                  className="glass-card-hover shimmer-card rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-7 md:p-10 text-center noise-overlay group relative overflow-hidden h-full"
                >
                  {/* Phase number watermark */}
                  <span className="absolute top-4 right-5 text-7xl font-display font-black text-white/[0.035] select-none pointer-events-none leading-none">
                    {i + 1}
                  </span>

                  <div className={`absolute inset-0 bg-gradient-to-b ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative z-10">
                    <div className="w-20 h-20 rounded-[1.5rem] glass-surface flex items-center justify-center mx-auto mb-6 border border-white/5 group-hover:border-primary/40 group-hover:scale-110 transition-all duration-500 shadow-xl group-hover:shadow-[0_0_30px_rgba(255,140,0,0.15)]">
                      <step.icon className="w-9 h-9 text-primary transition-transform duration-500 group-hover:rotate-6" />
                    </div>
                    <span className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] opacity-55 group-hover:opacity-100 transition-opacity block mb-0.5">
                      Phase {i + 1}
                    </span>
                    <h3 className="text-2xl font-display font-bold mb-1 text-foreground tracking-tight">
                      {step.label}
                    </h3>
                    <p className="text-xs text-primary/65 font-body font-semibold uppercase tracking-wider mb-4">
                      {step.tagline}
                    </p>
                    <p className="text-sm text-muted-foreground/80 font-body leading-relaxed max-w-[200px] mx-auto group-hover:text-foreground/90 transition-colors">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>

                {/* Connector arrow (desktop) */}
                {i < steps.length - 1 && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: 0.55 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="hidden lg:flex absolute top-1/2 -right-2.5 -translate-y-1/2 z-20 items-center justify-center"
                    >
                      <ArrowRight className="w-4 h-4 text-primary/40" />
                    </motion.div>
                    {/* Mobile connector */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={isInView ? { opacity: 1 } : {}}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.14 }}
                      className="flex lg:hidden justify-center items-center gap-2 py-2 text-primary/40"
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/35">
                        {steps[i + 1].label}
                      </span>
                    </motion.div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground/70 font-body text-sm italic">
            "Every ONROL learner moves through all four phases — with proof at every stage."
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default EngineSection;

