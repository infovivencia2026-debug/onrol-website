import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle } from "lucide-react";

const faqs = [
  {
    q: "Who is ONROL designed for?",
    a: "ONROL is for anyone who uses AI tools but wants to go beyond being a passive user — students, early-career professionals, freelancers, and working professionals who want to turn AI skills into real income. No degree required. Ambition required.",
  },
  {
    q: "Do I need prior AI experience to join?",
    a: "No. The AI Generalist Program (3 months) is designed to be accessible regardless of your current level. If you can use a browser and are willing to execute, you're ready. The AI Architect Program (6 months) is for those who've already built early proof and want to design and deploy end-to-end AI systems.",
  },
  {
    q: "What's the difference between the AI Generalist and AI Architect programs?",
    a: "The AI Generalist Program (3 months) is your entry point — a structured, execution-first program to build 5 real AI systems with no coding required. The AI Architect Program (6 months) goes deeper — orchestrate, connect and deploy end-to-end AI systems at scale.",
  },
  {
    q: "Are sessions live or can I access recordings?",
    a: "ONROL runs live cohorts for real-time collaboration and momentum. Recordings are available for enrolled learners so you don't miss anything if life gets in the way.",
  },
  {
    q: "What happens after I complete the program?",
    a: "Program graduates get access to the ONROL Community Builder Community — a network of ambitious builders, mentors, and opportunities. You'll also have a clear path into specialization tracks (AI Automation Engineer, AI Product Manager, or Forward Deployed Engineer) based on your proof and goals.",
  },
  {
    q: "How is ONROL different from a typical online course?",
    a: "Most courses sell information. ONROL sells transformation. Every program is output-first — you leave with real proof of work, not just a video completion badge. You learn by building, you're evaluated on execution, and you graduate with a portfolio that speaks for itself.",
  },
  {
    q: "Is there a refund or cancellation policy?",
    a: "Program fees are non-refundable. We keep cohorts small and committed, so please enrol only when you're ready to execute. If you can't continue, talk to us — we'll do our best to move you to a later cohort. Full terms are shared at enrolment.",
  },
  {
    q: "Will I get a certificate?",
    a: "Yes — but more importantly, you'll get proof. ONROL issues program certificates, but the real credential is your portfolio: live projects, automated systems, and documented execution that any employer or client can verify.",
  },
];

const FAQSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="faq" className="py-12 md:py-20 lg:py-28 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 shimmer-line" />
      <div className="absolute top-1/4 right-0 w-72 h-72 orb bg-primary/[0.04] pointer-events-none" />
      <div className="absolute bottom-1/4 left-0 w-64 h-64 orb bg-primary/[0.03] pointer-events-none" />

      <div className="container mx-auto px-6" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-[11px] font-body font-bold tracking-[0.28em] uppercase">FAQ</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
            Questions? Answered.
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto font-body text-base md:text-lg">
            Everything you need to know before you take the first step.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                >
                  <AccordionItem
                    value={`faq-${i}`}
                    className="glass-card-hover shimmer-card rounded-2xl border border-border/30 px-6 overflow-hidden data-[state=open]:border-primary/25 transition-colors duration-300"
                  >
                    <AccordionTrigger className="text-sm md:text-base font-display font-bold text-foreground/90 hover:text-primary transition-colors py-5 text-left [&>svg]:text-primary/60 [&>svg]:shrink-0">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground/75 font-body leading-relaxed pb-5 pt-0">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>

          {/* Still have questions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 p-5 rounded-2xl border border-border/20 bg-muted/5 text-center"
          >
            <MessageCircle className="w-5 h-5 text-primary/60 shrink-0" />
            <p className="text-sm text-muted-foreground/65 font-body">
              Still have questions?{" "}
              <a
                href="mailto:hello@onrol.in"
                className="text-primary font-semibold hover:underline underline-offset-4 transition-colors"
              >
                Write to us at hello@onrol.in
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
