import { motion } from "framer-motion";
import type { IconType } from "react-icons";
import {
 SiAnthropic,
 SiCanva,
 SiDatabricks,
 SiElevenlabs,
 SiFigma,
 SiGoogle,
 SiHuggingface,
 SiMeta,
 SiMistralai,
 SiNotion,
 SiNvidia,
 SiOpenai,
 SiPerplexity,
 SiZapier,
} from "react-icons/si";
import Container from "@/components/shared/Container";
import SectionHeading from "@/components/shared/SectionHeading";
import { homeData } from "@/lib/homeData";
import { cardReveal } from "@/lib/motion";

const companyLogoMap: Record<string, { icon?: IconType; fallback: string }> = {
 OpenAI: { icon: SiOpenai, fallback: "openai" },
 "Google DeepMind": { icon: SiGoogle, fallback: "google" },
 Anthropic: { icon: SiAnthropic, fallback: "anthropic" },
 "Meta AI": { icon: SiMeta, fallback: "meta" },
 "Microsoft AI": { fallback: "microsoft" },
 NVIDIA: { icon: SiNvidia, fallback: "nvidia" },
 "Hugging Face": { icon: SiHuggingface, fallback: "huggingface" },
 Perplexity: { icon: SiPerplexity, fallback: "perplexity" },
 "Stability AI": { fallback: "stabilityai" },
 "Mistral AI": { icon: SiMistralai, fallback: "mistralai" },
 Cohere: { fallback: "cohere" },
 Runway: { fallback: "runway" },
 ElevenLabs: { icon: SiElevenlabs, fallback: "elevenlabs" },
 Databricks: { icon: SiDatabricks, fallback: "databricks" },
 "Scale AI": { fallback: "scaleai" },
 Notion: { icon: SiNotion, fallback: "notion" },
 Canva: { icon: SiCanva, fallback: "canva" },
 Adobe: { fallback: "adobe" },
 Figma: { icon: SiFigma, fallback: "figma" },
 Zapier: { icon: SiZapier, fallback: "zapier" },
};

const HomeCompaniesMarquee = () => {
 const midpoint = Math.ceil(homeData.companies.length / 2);
 const topLine = homeData.companies.slice(0, midpoint);
 const bottomLine = homeData.companies.slice(midpoint);

 return (
 <section
 id="companies"
 className="relative bg-[#e6eaf1] py-10 md:py-20"
 style={{ fontFamily: `Inter, system-ui, sans-serif` }}
 >
 <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" />
 <Container>
 <div className="text-center">
 <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-600">
 — The AI ecosystem you'll learn to use
 </p>
 <h2
 className="mx-auto mt-3 max-w-3xl text-[#0B1640]"
 style={{
 fontSize: "clamp(26px, 3.4vw, 40px)",
 lineHeight: 1.1,
 letterSpacing: "-0.02em",
 fontWeight: 800,
 }}
 >
 100+ companies. <span className="text-orange-400">One execution stack.</span>
 </h2>
 </div>
 <motion.div {...cardReveal(0)} className="ticker-wrap mt-8 rounded-2xl bg-white border border-[#0B1640]/10 p-4">
 <div className="ticker-track gap-3 pb-3">
 {[...topLine, ...topLine].map((company, idx) => {
 const iconRef = companyLogoMap[company];
 const Icon = iconRef?.icon;
 return (
 <div
 key={`${company}-top-${idx}`}
 className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-[#0B1640]/85 transition-all duration-300 ease-out-premium hover:-translate-y-0.5 hover:border-orange-300/35 hover:bg-orange-500/10"
 title={company}
 >
 {Icon ? (
 <Icon className="h-8 w-8 shrink-0 text-[#0B1640]" aria-hidden />
 ) : iconRef ? (
 <img src={`/brand-kit/${iconRef.fallback}.svg`} alt={`${company} logo`} className="h-8 w-8 shrink-0" loading="lazy" />
 ) : (
 <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
 {company.slice(0, 1)}
 </span>
 )}
 {company}
 </div>
 );
 })}
 </div>
 <div className="ticker-track-reverse gap-3 pt-1">
 {[...bottomLine, ...bottomLine].map((company, idx) => {
 const iconRef = companyLogoMap[company];
 const Icon = iconRef?.icon;
 return (
 <div
 key={`${company}-bottom-${idx}`}
 className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-[#0B1640]/85 transition-all duration-300 ease-out-premium hover:-translate-y-0.5 hover:border-orange-300/35 hover:bg-orange-500/10"
 title={company}
 >
 {Icon ? (
 <Icon className="h-8 w-8 shrink-0 text-[#0B1640]" aria-hidden />
 ) : iconRef ? (
 <img src={`/brand-kit/${iconRef.fallback}.svg`} alt={`${company} logo`} className="h-8 w-8 shrink-0" loading="lazy" />
 ) : (
 <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
 {company.slice(0, 1)}
 </span>
 )}
 {company}
 </div>
 );
 })}
 </div>
 </motion.div>
 </Container>
 </section>
 );
};

export default HomeCompaniesMarquee;



