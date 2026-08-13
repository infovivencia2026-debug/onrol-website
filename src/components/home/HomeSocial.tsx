// HomeSocial — "Follow our journey" pill row.
// Reference design: clean eyebrow + headline + horizontal pill buttons with
// platform icon + handle. Adapted to ONROL dark hub aesthetic with all 6
// active channels (LinkedIn, Instagram, YouTube, X, WhatsApp, Discord).

import { motion } from "framer-motion";
import {
 FaLinkedinIn,
 FaInstagram,
 FaYoutube,
 FaWhatsapp,
 FaXTwitter,
} from "react-icons/fa6";
import { FaDiscord } from "react-icons/fa";
import { ArrowUpRight } from "lucide-react";
import Container from "@/components/shared/Container";
import { SOCIAL } from "@/lib/brand";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

const CHANNELS = [
 {
 href: SOCIAL.linkedin,
 Icon: FaLinkedinIn,
 handle: "ONROL — AI Execution School",
 label: "LinkedIn",
 iconColor: "text-[#0A66C2]",
 iconBg: "bg-[#0A66C2]/15",
 },
 {
 href: SOCIAL.instagram,
 Icon: FaInstagram,
 handle: "@onrol.in",
 label: "Instagram",
 // Instagram has a multi-color gradient in its real logo; using a
 // gradient on the icon background hints at it without the SVG complexity.
 iconColor: "text-pink-400",
 iconBg: "bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20",
 },
 {
 href: SOCIAL.youtube,
 Icon: FaYoutube,
 handle: "@onrolofficial",
 label: "YouTube",
 iconColor: "text-[#FF0000]",
 iconBg: "bg-[#FF0000]/15",
 },
 {
 href: SOCIAL.x,
 Icon: FaXTwitter,
 handle: "@onrol_in",
 label: "X",
 iconColor: "text-[#0B1640]",
 iconBg: "bg-white/10",
 },
 {
 href: SOCIAL.whatsapp,
 Icon: FaWhatsapp,
 handle: "Daily AI drops",
 label: "WhatsApp",
 iconColor: "text-emerald-400",
 iconBg: "bg-emerald-500/15",
 },
 {
 href: SOCIAL.discord,
 Icon: FaDiscord,
 handle: "Builder community",
 label: "Discord",
 iconColor: "text-[#5865F2]",
 iconBg: "bg-[#5865F2]/15",
 },
];

const HomeSocial = () => {
 return (
 <section
 id="social"
 className="onrol-lazy-section relative bg-[#e6eaf1] py-12 md:py-28"
 style={{ fontFamily: INTER_STACK }}
 >
 {/* Top hairline accent for separation */}
 <div
 aria-hidden
 className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent"
 />

 <Container>
 <div className="mx-auto max-w-3xl text-center">
 <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-orange-600">
 Social
 </p>
 <h2
 className="mt-4 text-[#0B1640]"
 style={{
 fontSize: "clamp(28px, 4.6vw, 52px)",
 lineHeight: 1.05,
 letterSpacing: "-0.025em",
 fontWeight: 800,
 }}
 >
 Follow our journey on Instagram, YouTube + four more.
 </h2>
 <p className="mt-4 text-[14.5px] leading-relaxed text-[#0B1640]/85 md:text-[15.5px]">
 Daily AI updates, builder wins, behind-the-scenes from cohorts, and free
 workshop announcements — pick the platform you check most.
 </p>
 </div>

 <div className="mx-auto mt-10 flex max-w-5xl flex-wrap items-center justify-center gap-3">
 {CHANNELS.map((c, idx) => (
 <motion.a
 key={c.label}
 href={c.href}
 target="_blank"
 rel="noreferrer"
 aria-label={`${c.label} — ${c.handle}`}
 initial={{ opacity: 1, y: 12 }}
 whileInView={{ opacity: 1, y: 0 }}
 viewport={{ once: true, amount: 0.3 }}
 transition={{ duration: 0.32, delay: Math.min(idx * 0.05, 0.3) }}
 className="group flex items-center gap-3 rounded-full bg-white border border-[#0B1640]/10 px-4 py-2.5 transition hover:-translate-y-0.5 hover:border-orange-300/40 hover:bg-[#e6eaf1]"
 >
 <span
 className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${c.iconBg} ${c.iconColor}`}
 >
 <c.Icon className="h-4 w-4" />
 </span>
 <span className="text-[13px] font-semibold text-[#0B1640] group-hover:text-[#0B1640] sm:text-[13.5px]">
 {c.handle}
 </span>
 <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#0B1640]/85 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-orange-600" />
 </motion.a>
 ))}
 </div>

 <p className="mt-8 text-center text-[12px] text-[#0B1640]/85">
 Same content, different surfaces — pick whichever fits your day.
 </p>
 </Container>
 </section>
 );
};

export default HomeSocial;
