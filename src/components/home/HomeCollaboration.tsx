import { motion } from "framer-motion";
import { Building2, GraduationCap, Users, Handshake, ArrowRight } from "lucide-react";
import Container from "@/components/shared/Container";
import { homeData } from "@/lib/homeData";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const PARTNER_TRACKS = [
 {
 Icon: GraduationCap,
 title: "Colleges & Universities",
 body: "Execution-first AI workshops, faculty enablement, campus innovation tracks.",
 accent: "from-orange-500 to-orange-600",
 },
 {
 Icon: Building2,
 title: "Startup & Corporate Teams",
 body: "Custom upskilling cohorts for AI copilots, automation, and deployment readiness.",
 accent: "from-orange-500 to-amber-500",
 },
 {
 Icon: Users,
 title: "Communities & Ecosystem Builders",
 body: "Co-hosted events, operator circles, and execution-first learning labs.",
 accent: "from-violet-500 to-fuchsia-500",
 },
];

const CAPABILITIES = [
 "Workshop design + delivery",
 "ONROL Community onboarding",
 "Mentor-supported showcase days",
 "Post-workshop execution pathways",
];

export default function HomeCollaboration() {
 const section = homeData.collaborations;

 return (
 <section
 id="collaboration"
 className="onrol-lazy-section relative bg-[#e6eaf1] py-12 md:py-28"
 style={{ fontFamily: INTER_STACK }}
 >
 <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" />
 <Container>
 <div className="max-w-3xl">
 <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
 — Collaborate with ONROL
 </p>
 <h2
 className="mt-3 text-[#0B1640]"
 style={{
 fontSize: "clamp(34px, 5vw, 56px)",
 lineHeight: 1.04,
 letterSpacing: "-0.025em",
 fontWeight: 800,
 }}
 >
 {section.title}
 </h2>
 <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-[#0B1640] md:text-base">
 {section.body}
 </p>
 </div>

 <div className="mt-8 grid gap-3 md:mt-12 md:grid-cols-3 md:gap-5">
 {PARTNER_TRACKS.map((p, i) => (
 <motion.article
 key={p.title}
 initial={{ opacity: 1, y: 18 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, amount: 0.2 }}
 transition={{ duration: 0.45, delay: i * 0.08 }}
 className="group rounded-2xl bg-white border border-[#0B1640]/10 p-7 transition hover:-translate-y-1 hover:border-orange-300/40"
 >
 <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${p.accent} text-[#f3f5f8]`}>
 <p.Icon className="h-6 w-6" strokeWidth={2.4} />
 </div>
 <h3
 className="mt-5 text-[#0B1640]"
 style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.2 }}
 >
 {p.title}
 </h3>
 <p className="mt-2 text-[14px] leading-relaxed text-[#0B1640]/90">{p.body}</p>
 </motion.article>
 ))}
 </div>

 <div className="mt-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
 <div className="rounded-2xl bg-white border border-[#0B1640]/10 p-7">
 <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-600">
 What partnership unlocks
 </p>
 <ul className="mt-5 grid gap-3 sm:grid-cols-2">
 {CAPABILITIES.map((c) => (
 <li key={c} className="flex items-start gap-2.5 text-[14px] text-[#0B1640]">
 <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
 {c}
 </li>
 ))}
 </ul>
 </div>

 <div className="rounded-2xl border border-orange-300/25 bg-gradient-to-br from-[#404040] via-[#404040] to-[#f3f5f8] p-7">
 <span className="inline-flex items-center gap-2 rounded-full border border-orange-300/35 bg-orange-500/10 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.22em] text-orange-600">
 <Handshake className="h-3 w-3" />
 Partner with us
 </span>
 <h3
 className="mt-4 text-[#0B1640]"
 style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.2 }}
 >
 Bring ONROL to your campus, team, or community.
 </h3>
 <p className="mt-3 text-[14px] leading-relaxed text-[#0B1640]">
 Hosted workshops, custom cohorts, or long-form execution programs — built for your stakeholders.
 </p>
 <a
 href="/#contact"
 className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-[13px] font-bold uppercase tracking-wider text-[#0B1640] transition hover:brightness-110"
 >
 Start a conversation <ArrowRight className="h-4 w-4" />
 </a>
 </div>
 </div>
 </Container>
 </section>
 );
}
