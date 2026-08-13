import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Workflow, Lightbulb, ServerCog, ArrowUpRight } from "lucide-react";
import pathsBg from "@/assets/paths-bg.png";

const paths = [
  {
    icon: Workflow,
    title: "AI Automation Engineer",
    badge: "High Demand",
    desc: "Build intelligent workflows, automate real processes, and turn AI into measurable execution for businesses.",
    skills: ["Workflow Design", "Automation Thinking", "Business Utility", "Income Relevance"],
    income: "₹8L – ₹30L+",
    gradient: "from-orange-500/15 via-transparent to-transparent",
  },
  {
    icon: Lightbulb,
    title: "AI Product Manager",
    badge: "Strategic",
    desc: "Define intelligent use cases, shape products, and turn AI potential into clear market-facing solutions that ship.",
    skills: ["Problem Framing", "Use Case Thinking", "Product Decisions", "Cross-Functional"],
    income: "₹12L – ₹40L+",
    gradient: "from-amber-400/12 via-transparent to-transparent",
  },
  {
    icon: ServerCog,
    title: "Forward Deployed Engineer",
    badge: "Cutting Edge",
    desc: "Work at the edge of real problems, real systems, and real-world deployment in fast-moving environments.",
    skills: ["Real-World Problem Solving", "Deployment Thinking", "Business Proximity", "Execution Under Ambiguity"],
    income: "₹15L – ₹50L+",
    gradient: "from-orange-300/12 via-transparent to-transparent",
  },
];

const PathsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="paths" className="py-12 md:py-20 lg:py-28 relative overflow-hidden">
      {/* Background image layer */}
      <div className="absolute inset-0">
        <img src={pathsBg} alt="" className="w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background/95" />
      </div>

      {/* Decorative rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-primary/[0.04] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-primary/[0.06] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-primary/[0.08] pointer-events-none" />
      {/* Center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 orb bg-primary/8 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-[11px] font-body font-bold tracking-[0.28em] uppercase">Specialization</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
            Choose Your Elite Path
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto font-body text-base md:text-lg">
            One engine. Three powerful futures.
          </p>
        </motion.div>

        <div className="bento-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {paths.map((path, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.18 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card-hover shimmer-card rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-7 md:p-8 lg:p-10 noise-overlay group relative overflow-hidden flex flex-col"
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${path.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-700`} />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex flex-col h-full transition-transform duration-500 group-hover:-translate-y-1">
                {/* Icon + badge row */}
                <div className="flex items-start justify-between mb-8">
                  <div className="w-16 h-16 rounded-2xl glass-surface flex items-center justify-center border border-white/5 transition-all duration-500 group-hover:border-primary/40 group-hover:shadow-[0_0_25px_rgba(255,140,0,0.2)] group-hover:scale-110">
                    <path.icon className="w-8 h-8 text-primary transition-transform duration-500 group-hover:rotate-12" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-3 py-1 rounded-full border border-primary/25 bg-primary/10 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                      {path.badge}
                    </span>
                    <span className="text-xs text-muted-foreground/80 font-body">Avg. CTC</span>
                    <span className="text-sm font-display font-bold text-primary/80">{path.income}</span>
                  </div>
                </div>

                <h3 className="text-2xl font-display font-bold mb-4 text-foreground tracking-tight group-hover:text-primary transition-colors duration-300 leading-snug">
                  {path.title}
                </h3>
                <p className="text-base text-muted-foreground/80 font-body leading-relaxed mb-8 group-hover:text-foreground/90 transition-colors flex-1">
                  {path.desc}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {path.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 rounded-xl glass-surface border border-white/5 text-[11px] text-muted-foreground font-body font-semibold tracking-wide transition-all group-hover:border-primary/20 group-hover:text-foreground/80"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* CTA link */}
                <a
                  href="#apply"
                  className="flex items-center gap-2 text-primary/60 group-hover:text-primary transition-colors duration-300 text-sm font-bold mt-auto"
                >
                  <span>Explore path</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PathsSection;

