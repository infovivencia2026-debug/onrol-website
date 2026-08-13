import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import Container from "@/components/shared/Container";
import { CURRICULUM_MODULES } from "@/lib/curriculumModules";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

/**
 * Hasini review: "no curriculum breakdown on the front page".
 * This is the homepage version of the AI Generalist 3-month curriculum.
 * Shares its data with <JourneySection> on /programs/ai-generalist/ so they
 * never drift out of sync.
 */
export default function HomeCurriculum() {
 return (
 <section
 id="curriculum"
 className="onrol-lazy-section relative bg-[#fffaf6] py-12 md:py-28"
 style={{ fontFamily: INTER_STACK }}
 >
 <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" />
 <Container>
 <div className="max-w-3xl">
 <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
 — 3-month curriculum
 </p>
 <h2
 className="mt-3 text-[#0B1640]"
 style={{
 fontSize: "clamp(34px, 5vw, 60px)",
 lineHeight: 1.04,
 letterSpacing: "-0.025em",
 fontWeight: 800,
 }}
 >
 From <span className="text-orange-600">tools</span> to a deployed{" "}
 <span className="text-orange-400">AI ecosystem</span>.
 </h2>
 <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-[#0B1640] md:text-base">
 Six hours a day. Four hours learning, two hours building. Every day ends with
 a real, deployable output you can show.
 </p>
 <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#0B1640]/12 bg-white px-3 py-1 text-[12px] text-[#0B1640]">
 <Clock className="h-3.5 w-3.5 text-orange-400" />
 6 hrs/day · 4 hrs learning · 2 hrs building
 </div>
 </div>

 <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
 {CURRICULUM_MODULES.map((mod, i) => (
 <motion.article
 key={mod.day}
 initial={{ opacity: 1, y: 18 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, amount: 0.2 }}
 transition={{ duration: 0.45, delay: i * 0.07 }}
 className="group relative flex flex-col rounded-2xl bg-white border border-[#0B1640]/10 p-5 transition hover:-translate-y-1 hover:border-orange-300/40"
 >
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-600">
 Day {mod.day}
 </span>
 <span className="grid h-7 w-7 place-items-center rounded-full border bg-white text-[10px] font-bold text-[#0B1640]">
 0{mod.day}
 </span>
 </div>
 <h3
 className="mt-3 text-[#0B1640]"
 style={{
 fontSize: "16.5px",
 fontWeight: 800,
 letterSpacing: "-0.01em",
 lineHeight: 1.2,
 }}
 >
 {mod.title}
 </h3>
 <p className="mt-1 text-[12px] text-orange-600/85">{mod.tag}</p>
 <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-[#0B1640]/95">
 {mod.details.map((d) => (
 <li key={d} className="flex items-start gap-2">
 <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
 <span>{d}</span>
 </li>
 ))}
 </ul>
 <div className="mt-5 rounded-lg border border-emerald-300/20 bg-emerald-500/8 px-3 py-2 text-[12px] leading-snug text-emerald-700">
 <strong className="text-[#0B1640]">Output:</strong> {mod.output}
 </div>
 </motion.article>
 ))}
 </div>

 <div className="mt-10 flex flex-wrap items-center gap-4">
 <a
 href="https://onrol.in/programs/"
 className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-6 py-3.5 text-[14px] font-bold text-[#0B1640] transition hover:brightness-110"
 >
 Register Now →
 </a>
 </div>
 </Container>
 </section>
 );
}
