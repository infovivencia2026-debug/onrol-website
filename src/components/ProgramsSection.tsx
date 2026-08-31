import { Fragment } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Star,
  Target,
  Users,
  Zap,
} from "lucide-react";

const generalistFeatures = [
  "Build 5 real AI systems — no coding required (no-code + vibe coding)",
  "50+ live, mentor-led sessions with action check-ins",
  "Execution system for consistency and a job-ready portfolio",
  "Beginner-friendly — start from zero and ship real outputs",
];

const architectFeatures = [
  "Design, build, deploy & scale end-to-end AI systems",
  "Orchestration: AI agents, automations, APIs & integrations",
  "Production-grade projects with structured review loops",
  "Advanced track — for builders ready to go deeper",
];

const compareRows = [
  { label: "Learning style", onrol: "Execution-first", other: "Content-first" },
  { label: "Mentor access", onrol: "Live and structured", other: "Limited Q&A" },
  { label: "Outcome speed", onrol: "Visible in days", other: "Usually delayed" },
  { label: "Career readiness", onrol: "Operationally focused", other: "Mostly conceptual" },
];

export default function ProgramsSection() {
  return (
    <section className="relative px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Programs</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Structured Path to Real Execution
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Two live programs — start with AI Generalist, then go deeper with AI Architect.
          </p>
        </motion.div>

        <div className="grid gap-4 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm lg:col-span-1"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              <Star className="h-3.5 w-3.5 fill-primary" />
              Start Here
            </div>
            <div className="mt-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-foreground">AI Generalist Program</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your roadmap to a future-proof AI career — build real systems with no coding required.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3 text-primary" />
                3 Months
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3 text-primary" />
                Live Cohort
              </span>
            </div>
            <div className="mt-5 space-y-2">
              {generalistFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-2 text-sm text-foreground/85">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <a
              href="#apply"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Join Next Cohort
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm lg:col-span-2"
          >
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-background">
              <Target className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-foreground">AI Architect Program</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Orchestrate, connect and deploy — build end-to-end AI systems at scale.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3 text-primary" />
                6 Months
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                <Target className="h-3 w-3" />
                Advanced Track
              </span>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {architectFeatures.map((feature) => (
                <div key={feature} className="flex items-start gap-2 rounded-xl border border-border/50 bg-background p-3 text-sm text-foreground/85">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <a
              href="#apply"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-primary/40 px-4 py-2 text-sm font-semibold text-primary"
            >
              Apply for AI Architect
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 rounded-2xl border border-border/40"
        >
          <div className="grid min-w-[520px] grid-cols-3 overflow-x-auto">
            <div className="border-r border-border/30 bg-muted/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Feature
            </div>
            <div className="border-r border-border/30 bg-primary/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-primary">
              ONROL
            </div>
            <div className="bg-muted/30 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Typical Course
            </div>
            {compareRows.map((row) => (
              <Fragment key={row.label}>
                <div className="border-r border-t border-border/20 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  {row.label}
                </div>
                <div className="border-r border-t border-border/20 bg-primary/5 px-4 py-3 text-sm font-medium text-foreground">
                  {row.onrol}
                </div>
                <div className="border-t border-border/20 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                  {row.other}
                </div>
              </Fragment>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
