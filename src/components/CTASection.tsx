import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Quote, CheckCircle2, Calendar } from "lucide-react";

const testimonials = [
  {
    quote: "I came in knowing nothing about automation. Within 3 months I had a working AI workflow that a local business paid me ₹15,000 to deploy. ONROL is the real deal.",
    name: "Aarav Mehta",
    detail: "Pune · AI Automation Engineer · Freelancing at ₹80K/month",
    initials: "AM",
  },
  {
    quote: "The AI Generalist Program changed how I think about my career. I built a complete AI product demo, got shortlisted for a PM role, and doubled my CTC to ₹28L.",
    name: "Sneha Iyer",
    detail: "Hyderabad · AI Product Manager track",
    initials: "SI",
  },
  {
    quote: "Coming from a non-tech background, I was skeptical. But the AI Generalist Program gave me a published automation project — and I landed my first client within a week.",
    name: "Rohan Kapoor",
    detail: "Delhi · AI Generalist Program → First freelance client",
    initials: "RK",
  },
];

const steps = [
  { num: "01", title: "Submit your interest", desc: "Share your basic details and your goal to join ONROL." },
  { num: "02", title: "Complete evaluation", desc: "A quick first-fit step to identify your readiness and alignment." },
  { num: "03", title: "Get path clarity", desc: "Receive personalized guidance on the right starting layer." },
  { num: "04", title: "Begin your journey", desc: "Start with structure, visibility, proof, and a clear path forward." },
];

const promises = [
  "Real projects, not just theory",
  "Portfolio proof before you graduate",
  "Pathway to income, not just a certificate",
  "Community that keeps you building",
];

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="apply" className="py-12 md:py-20 lg:py-28 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.025] to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] orb bg-primary/8 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 shimmer-line" />

      <div className="container mx-auto px-6" ref={ref}>
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-[11px] font-body font-bold tracking-[0.28em] uppercase">Get Started</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
            Your next step is <span className="text-gradient">simple</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto font-body text-base md:text-lg">
            Clarity creates action. Action creates momentum.
          </p>
        </motion.div>

        {/* Step cards */}
        <div className="bento-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
              className="glass-card-hover shimmer-card rounded-2xl md:rounded-3xl p-5 md:p-8 noise-overlay group border border-white/5 relative overflow-hidden transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <span className="text-5xl font-display font-black text-primary/10 group-hover:text-primary/20 transition-all duration-500 select-none leading-none block mb-4">
                  {step.num}
                </span>
                <h4 className="text-base font-display font-bold mb-2.5 text-foreground tracking-tight group-hover:text-primary transition-colors">
                  {step.title}
                </h4>
                <p className="text-sm text-muted-foreground/75 font-body leading-relaxed group-hover:text-foreground/85 transition-colors">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main CTA block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[2.5rem] noise-overlay max-w-5xl mx-auto"
          style={{
            background: "linear-gradient(135deg, hsl(20 8% 9% / 0.98), hsl(20 10% 6% / 0.98))",
            border: "1px solid hsl(27 90% 48% / 0.3)",
            boxShadow: "0 0 100px -25px hsl(27 90% 48% / 0.35), 0 40px 80px -20px rgba(0,0,0,0.6)",
          }}
        >
          {/* Top glow bar */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
          {/* Large background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-primary/12 rounded-full blur-[80px] pointer-events-none" />
          {/* Bottom glow */}
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/8 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10 p-5 sm:p-8 md:p-10 lg:p-16">
            <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-center">
              {/* Left: Testimonial + promises */}
              <div>
                {/* Next cohort badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-6">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary tracking-wide">Next Cohort: 6 June 2026 — Seats filling fast</span>
                </div>

                {/* Featured testimonial */}
                <div className="flex items-start gap-4 mb-4 p-5 rounded-2xl bg-white/[0.04] border border-white/8">
                  <Quote className="w-6 h-6 text-primary/50 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm md:text-base font-body text-foreground/85 leading-relaxed italic">
                      "{testimonials[0].quote}"
                    </p>
                    <div className="flex items-center gap-2.5 mt-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/40 to-orange-300/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                        {testimonials[0].initials}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground/75 font-body">{testimonials[0].name}</p>
                        <p className="text-[10px] text-muted-foreground/70 font-body">{testimonials[0].detail}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Two smaller testimonials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                  {testimonials.slice(1).map((t, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/6">
                      <p className="text-xs font-body text-foreground/70 leading-relaxed italic mb-3">"{t.quote}"</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-orange-300/15 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                          {t.initials}
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-foreground/70 font-body">{t.name}</p>
                          <p className="text-[9px] text-muted-foreground/45 font-body">{t.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promises */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {promises.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: 0.7 + i * 0.08 }}
                      className="flex items-center gap-2.5 text-sm font-body text-foreground/75"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {p}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right: CTA card */}
              <div className="flex flex-col items-center text-center gap-5 min-w-[220px]">
                {/* Pulsing orb decoration */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-orange-300/20 pulse-ring mx-auto" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-display font-black text-gradient">AI</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl md:text-2xl font-display font-bold text-foreground mb-1">
                    Build proof.
                  </h3>
                  <h3 className="text-xl md:text-2xl font-display font-bold text-gradient mb-1">
                    Build positioning.
                  </h3>
                  <h3 className="text-xl md:text-2xl font-display font-bold text-foreground">
                    Build income.
                  </h3>
                </div>

                <a
                  href="https://onrol.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-full px-8 py-4 rounded-2xl overflow-hidden font-display font-bold text-base text-white text-center transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_20px_50px_-10px_rgba(70,70,70,0.5)]"
                  style={{ background: "linear-gradient(145deg, hsl(var(--cta-button-from)) 0%, hsl(var(--cta-button-to)) 100%)" }}
                >
                  <span className="absolute inset-0 bg-white/0 group-hover:bg-white/12 transition-colors duration-300 rounded-2xl" />
                  <span className="absolute inset-x-0 top-0 h-px bg-white/25 rounded-t-2xl" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Apply. Build. Grow.
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </a>

                <p className="text-xs text-muted-foreground/45 font-body">
                  onrol.in · Admissions open
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

