import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { AlertTriangle, Lightbulb, Rocket, TrendingUp } from "lucide-react";

/* ── Animated counter card ── */
const StatCounter = ({
  target,
  suffix,
  label,
  delay,
}: {
  target: number;
  suffix: string;
  label: string;
  delay: number;
}) => {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!isInView) return undefined;
    let start = 0;
    const steps = 60;
    const increment = target / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 1800 / steps);
    return () => clearInterval(timer);
  }, [isInView, target]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className="glass-card shimmer-card rounded-3xl px-6 py-6 text-center border border-border/50 relative overflow-hidden group hover:border-primary/30 transition-all duration-500"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <p className="text-3xl md:text-4xl font-display font-black text-foreground stat-number">
          {value}
          <span className="text-gradient">{suffix}</span>
        </p>
        <p className="mt-1.5 text-[10px] text-muted-foreground/80 font-body uppercase tracking-widest">{label}</p>
      </div>
    </motion.div>
  );
};

const cards = [
  {
    icon: AlertTriangle,
    title: "Tools are spreading faster than capability.",
    desc: "Millions are using AI tools, but very few know how to build workflows, create proof of work, or apply AI in ways the market values.",
    accent: "from-orange-500/12",
    span: "md:col-span-2 md:row-span-1",
  },
  {
    icon: Lightbulb,
    title: "Information is no longer an advantage. Execution is.",
    desc: "Watching tutorials, collecting prompts, and trying tools casually does not create credibility. Real leverage comes from building and demonstrating outcomes.",
    accent: "from-amber-400/12",
    span: "md:col-span-1 md:row-span-2",
  },
  {
    icon: Rocket,
    title: "The next opportunity belongs to builders.",
    desc: "Students and young professionals who can turn AI into projects, systems, and business outcomes will stand apart in careers, freelancing, and startups.",
    accent: "from-orange-400/10",
    span: "md:col-span-2 md:row-span-1",
  },
];

const ProblemSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="py-12 md:py-20 lg:py-28 relative section-secondary bg-background">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 shimmer-line" />
      {/* Subtle warm tint orb for light bg */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] orb bg-primary/[0.04] pointer-events-none" />

      <div className="container mx-auto px-6" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <span className="text-primary text-[11px] font-body font-bold tracking-[0.28em] uppercase mb-3 block">
            The Reality Check
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            AI is everywhere.
            <br />
            <span className="text-gradient">Income-ready talent is still rare.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-body text-base md:text-lg">
            The market no longer rewards awareness. It rewards proof, execution, and real-world outcomes.
          </p>
        </motion.div>

        {/* Stat counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
          <StatCounter target={300} suffix="M+" label="Indians using AI tools" delay={0.1} />
          <StatCounter target={94} suffix="%" label="Can't build with AI" delay={0.2} />
          <StatCounter target={12} suffix="x" label="Income gap: builders vs users" delay={0.3} />
        </div>

        {/* Bento Grid */}
        <div className="bento-grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className={`${card.span} glass-card-hover shimmer-card rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-7 md:p-10 noise-overlay group relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-7 border border-white/5 group-hover:border-primary/35 group-hover:bg-primary/8 transition-all duration-500 group-hover:shadow-[0_0_24px_rgba(255,140,0,0.18)]">
                  <card.icon className="w-7 h-7 text-primary transition-transform duration-500 group-hover:scale-110" />
                </div>
                <h3 className="text-xl md:text-2xl font-display font-bold mb-4 text-foreground tracking-tight group-hover:text-primary transition-colors duration-300 leading-snug">
                  {card.title}
                </h3>
                <p className="text-base text-muted-foreground/80 font-body leading-relaxed group-hover:text-foreground/90 transition-colors duration-300">
                  {card.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Closing statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="text-center mt-14"
        >
          <div className="inline-flex items-center gap-3 glass-card rounded-2xl px-8 py-5 glow-border">
            <TrendingUp className="w-5 h-5 text-primary shrink-0" />
            <p className="text-lg font-display font-semibold text-primary">
              This is the gap ONROL is built to solve.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;
