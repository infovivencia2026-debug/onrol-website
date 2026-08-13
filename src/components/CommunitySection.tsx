import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Users, Compass, Eye, BookOpen, Award, Activity } from "lucide-react";

const features = [
  { icon: Users, title: "Mentorship Access", desc: "Stay connected to guidance and support as you continue building in the real world." },
  { icon: Compass, title: "Peer Collaboration", desc: "Grow alongside ambitious builders and execution-focused peers who push you forward." },
  { icon: Eye, title: "Opportunity Visibility", desc: "Stay closer to projects, roles, gigs, and ecosystem-led opportunities as they emerge." },
  { icon: BookOpen, title: "Continuous Learning", desc: "Keep evolving through advanced conversations, shared insights, and prompt clinics." },
  { icon: Award, title: "Long-Term Positioning", desc: "Sustained visibility, identity, and professional growth in the AI-first economy." },
];

const activityFeed = [
  { user: "Aryan S.", action: "completed AI Workflow Sprint", time: "2m ago", dot: "bg-green-400" },
  { user: "Priya M.", action: "published portfolio project", time: "11m ago", dot: "bg-blue-400" },
  { user: "Rohan K.", action: "landed first freelance client", time: "34m ago", dot: "bg-primary" },
  { user: "Sneha T.", action: "joined Specialization Track", time: "1h ago", dot: "bg-purple-400" },
  { user: "Dev A.", action: "completed AI Generalist Program", time: "2h ago", dot: "bg-green-400" },
];

const CommunitySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="community" className="py-12 md:py-20 lg:py-28 relative section-secondary bg-background">
      <div className="absolute top-0 left-0 right-0 shimmer-line" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 orb bg-primary/[0.04] pointer-events-none" />

      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-[11px] font-body font-bold tracking-[0.28em] uppercase">ONROL Community</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
            Growth doesn't end with the program
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-body text-base md:text-lg">
            Programs create momentum. Ecosystems sustain it.
          </p>
        </motion.div>

        {/* Main grid: features + live activity */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 max-w-6xl mx-auto">
          {/* Features bento */}
          <div className="bento-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
                className={`${
                  i === 0 ? "lg:col-span-3" :
                  i === 1 ? "lg:col-span-3" :
                  i === 2 ? "lg:col-span-2" :
                  i === 3 ? "lg:col-span-2" :
                  "lg:col-span-2"
                } glass-card-hover shimmer-card rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 noise-overlay group border border-border/30 transition-all duration-500 relative overflow-hidden`}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 flex flex-col items-start transition-transform duration-500 group-hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-2xl glass-surface flex items-center justify-center mb-5 group-hover:border-primary/40 group-hover:bg-primary/8 transition-all duration-500 group-hover:shadow-[0_0_18px_rgba(255,140,0,0.12)]">
                    <f.icon className="w-6 h-6 text-primary transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <h4 className="text-base font-display font-bold mb-2 text-foreground tracking-tight group-hover:text-primary transition-colors">{f.title}</h4>
                  <p className="text-sm text-muted-foreground/75 font-body leading-relaxed group-hover:text-foreground/85 transition-colors">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Live Activity Feed */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card rounded-[2rem] p-6 border border-border/40 relative overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-display font-bold text-foreground">Community Activity</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary/80 uppercase tracking-wider">
                Sample
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/45 font-body mb-4 -mt-2">
              Representative examples from ONROL Community members
            </p>

            {/* Feed items */}
            <div className="space-y-3 flex-1">
              {activityFeed.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-black/[0.03] border border-black/[0.05] hover:border-black/[0.10] transition-colors group/item"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-orange-300/20 flex items-center justify-center shrink-0 ring-1 ring-white/10 text-[11px] font-bold text-primary">
                    {item.user.split(" ")[0][0]}{item.user.split(" ")[1]?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-body text-foreground/80 leading-snug">
                      <span className="font-semibold text-foreground/95 group-hover/item:text-primary transition-colors">{item.user}</span>{" "}
                      <span className="text-foreground/60">{item.action}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">{item.time}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${item.dot}`} />
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-5 pt-4 border-t border-border/30">
              <p className="text-center text-xs text-muted-foreground/55 font-body">
                Join <span className="text-primary font-semibold">247+ builders</span> already in ONROL Community
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;

