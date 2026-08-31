import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, Briefcase, Sparkles, MessageCircle, ArrowRight, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import Container from "@/components/shared/Container";
import { homeData } from "@/lib/homeData";
// Community stats live on the self-hosted Postgres (community_members
// table). The supabase client is dynamically imported inside the
// effect so vendor-supabase (~42KB transfer / 33KB unused on first
// paint per Lighthouse) never enters the home page critical bundle.
import { cardHover, cardReveal } from "@/lib/motion";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;
const ICONS = [Sparkles, Briefcase, MessageCircle, Users];

interface RecentJoin {
 full_name: string | null;
 created_at: string;
}

const HomeApex = () => {
 const section = homeData.apex;
 const [memberCount, setMemberCount] = useState<number | null>(null);
 const [weekCount, setWeekCount] = useState<number | null>(null);
 const [recentJoins, setRecentJoins] = useState<RecentJoin[]>([]);

 const sectionElRef = useRef<HTMLElement | null>(null);
 useEffect(() => {
 let cancelled = false;
 // Gate the supabase chunk load + community_members query on the
 // section actually scrolling into view. Lighthouse was finishing
 // its LCP measurement while this section was still below the
 // fold but the query had already started — pulling vendor-supabase
 // into the critical request chain and stretching the chain to 5.1s.
 // IntersectionObserver guarantees we never fire during the first
 // paint window (Lighthouse's headless viewport is short).
 const run = async () => {
 try {
 const { communitySupabase: supabase } = await import("@/lib/communitySupabase");
 const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
 const [{ count: total }, { count: week }, { data: joins }] = await Promise.all([
 supabase.from("community_members").select("*", { count: "exact", head: true }).eq("member_status", "approved"),
 supabase.from("community_members").select("*", { count: "exact", head: true }).eq("member_status", "approved").gte("created_at", sevenDaysAgo),
 supabase.from("community_members").select("full_name, created_at").eq("member_status", "approved").order("created_at", { ascending: false }).limit(5),
 ]);
 if (cancelled) return;
 if (typeof total === "number") setMemberCount(total);
 if (typeof week === "number") setWeekCount(week);
 if (joins) setRecentJoins(joins);
 } catch {
 // Silent fallback to static copy.
 }
 };

 const el = sectionElRef.current;
 if (!el || typeof IntersectionObserver === "undefined") {
 // Fallback for older browsers — defer to idle.
 const handle = window.setTimeout(run, 2500);
 return () => { cancelled = true; window.clearTimeout(handle); };
 }
 const io = new IntersectionObserver(
 (entries) => {
 for (const e of entries) {
 if (e.isIntersecting) {
 io.disconnect();
 run();
 break;
 }
 }
 },
 { rootMargin: "300px 0px" }, // start ~one viewport before visible
 );
 io.observe(el);
 return () => { cancelled = true; io.disconnect(); };
 }, []);

 function timeAgoShort(iso: string): string {
 const ms = Date.now() - new Date(iso).getTime();
 if (ms < 0) return "now";
 const m = Math.floor(ms / 60000);
 if (m < 60) return `${m}m`;
 const h = Math.floor(m / 60);
 if (h < 24) return `${h}h`;
 const d = Math.floor(h / 24);
 return `${d}d`;
 }

 // Reviewer ask (Sriram): "no place for new joiners to enter, only existing can login"
 // Two clear paths now:
 // 1. New joiners → Free Masterclass (path into ONROL Community via cohort)
 // 2. Alumni → community sign-in
 // Scroll to top first so the registration modal opens over the hero where
 // the listener lives — otherwise clicking from this section deep in the
 // page can appear to do nothing (modal renders but is below the fold).
 const openMasterclass = () => {
 window.scrollTo({ top: 0, behavior: "smooth" });
 // Small delay so the scroll starts before the modal opens (better UX).
 setTimeout(() => window.dispatchEvent(new Event("open-hero-registration")), 150);
 };

 return (
 <section
 id="apex"
 ref={sectionElRef}
 className="onrol-lazy-section relative bg-[#e6eaf1] py-12 md:py-28"
 style={{ fontFamily: INTER_STACK }}
 >
 <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" />
 <Container>
 <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
 <div className="max-w-2xl">
 <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
 — ONROL Community
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
 Learning <span className="text-orange-600">does not end</span> after the session.
 </h2>
 <p className="mt-5 text-[15.5px] leading-relaxed text-[#0B1640] md:text-base">
 {section.description}
 </p>
 </div>

 {/* Live community pulse — real-time member count + week joins. */}
 {(memberCount != null || weekCount != null || recentJoins.length > 0) ? (
 <motion.div
 initial={{ opacity: 1, y: 14 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, amount: 0.2 }}
 transition={{ duration: 0.4 }}
 className="rounded-2xl border border-orange-300/25 bg-gradient-to-br from-[#404040] via-[#f3f5f8] to-[#404040] px-6 py-5"
 >
 <div className="flex items-center gap-3">
 <span aria-hidden className="relative flex h-3 w-3">
 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
 <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
 </span>
 <p className="text-[11.5px] font-bold uppercase tracking-[0.22em] text-emerald-300">Live</p>
 </div>
 <p className="mt-3 text-[20px] font-bold text-[#0B1640]">
 {memberCount != null ? `${memberCount.toLocaleString()} builders in ONROL Community` : "ONROL Community is live"}
 </p>
 {weekCount && weekCount > 0 ? (
 <p className="mt-1 text-[13px] text-orange-600/85">+{weekCount} joined this week</p>
 ) : null}

 {recentJoins.length > 0 ? (
 <div className="mt-4 flex items-center gap-2 text-[11px] text-[#0B1640]">
 <span>Latest:</span>
 <div className="flex -space-x-2">
 {recentJoins.slice(0, 5).map((j, i) => (
 <span
 key={`${j.full_name}-${i}`}
 title={`${j.full_name || "Member"} · ${timeAgoShort(j.created_at)} ago`}
 className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#f3f5f8] bg-gradient-to-br from-orange-400 to-violet-400 text-[10px] font-black text-[#f3f5f8]"
 >
 {(j.full_name || "?").trim()[0]?.toUpperCase() || "?"}
 </span>
 ))}
 </div>
 </div>
 ) : null}
 </motion.div>
 ) : null}
 </div>

 {/* Pillars */}
 <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:mt-12 lg:grid-cols-4">
 {section.pillars.map((pillar, idx) => {
 const Icon = ICONS[idx] ?? Sparkles;
 return (
 <motion.div
 key={pillar.title}
 {...cardReveal(idx)}
 {...cardHover}
 className="rounded-2xl bg-white border border-[#0B1640]/10 p-4 transition hover:border-orange-300/35 sm:p-6"
 >
 <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-400/15 text-orange-600">
 <Icon className="h-5 w-5" />
 </div>
 <h3
 className="mt-4 text-[#0B1640]"
 style={{
 fontSize: "16px",
 fontWeight: 700,
 letterSpacing: "-0.005em",
 }}
 >
 {pillar.title}
 </h3>
 <p className="mt-2 text-[13px] leading-relaxed text-[#0B1640]">{pillar.body}</p>
 </motion.div>
 );
 })}
 </div>

 {/* Two clear paths to enter ONROL Community (Sriram fix). */}
 <div className="mt-10 grid gap-4 md:grid-cols-2">
 <motion.div
 initial={{ opacity: 1, y: 14 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, amount: 0.3 }}
 transition={{ duration: 0.45 }}
 className="group relative overflow-hidden rounded-2xl border border-orange-300/30 bg-gradient-to-br from-[#404040] via-[#454545] to-[#f3f5f8] p-7 transition hover:border-orange-300/55"
 >
 <div aria-hidden className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-500/15 blur-3xl" />
 <p className="relative text-[11.5px] font-bold uppercase tracking-[0.22em] text-orange-600">
 New to ONROL
 </p>
 <h3
 className="relative mt-2 text-[#0B1640]"
 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.015em" }}
 >
 Apply for the next cohort
 </h3>
 <p className="relative mt-2 text-[13.5px] leading-relaxed text-[#0B1640]">
 Reserve your seat at the Free Masterclass. ONROL Community access is included with every cohort.
 </p>
 <a
 href="https://onrol.in/programs/"
 className="relative mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-3 text-[13.5px] font-bold uppercase tracking-wider text-[#0B1640] transition hover:brightness-110"
 >
 Register Now <ArrowRight className="h-4 w-4" />
 </a>
 </motion.div>

 <motion.div
 initial={{ opacity: 1, y: 14 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, amount: 0.3 }}
 transition={{ duration: 0.45, delay: 0.08 }}
 className="group relative overflow-hidden rounded-2xl border border-orange-300/25 bg-gradient-to-br from-[#404040] via-[#f3f5f8] to-[#f3f5f8] p-7 transition hover:border-orange-300/50"
 >
 <div aria-hidden className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-400/12 blur-3xl" />
 <p className="relative text-[11.5px] font-bold uppercase tracking-[0.22em] text-orange-600">
 ONROL alumni
 </p>
 <h3
 className="relative mt-2 text-[#0B1640]"
 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.015em" }}
 >
 Sign into ONROL Community
 </h3>
 <p className="relative mt-2 text-[13.5px] leading-relaxed text-[#0B1640]">
 Already in a cohort? Open the community dashboard, join build sessions, browse the freelance board.
 </p>
 <Link
 to="/community"
 className="relative mt-5 inline-flex items-center gap-2 rounded-xl border border-orange-300/60 bg-orange-500/15 px-6 py-3.5 text-[14.5px] font-bold uppercase tracking-wider text-orange-100 transition hover:border-orange-200 hover:bg-orange-500/25 hover:text-[#0B1640]"
 >
 <LogIn className="h-4 w-4" /> Open dashboard
 </Link>
 </motion.div>
 </div>
 </Container>
 </section>
 );
};

export default HomeApex;
