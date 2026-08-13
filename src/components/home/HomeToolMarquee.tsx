import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
 ChevronLeft,
 ChevronRight,
 ExternalLink,
 BookOpen,
 Search,
 Sparkles,
 X,
} from "lucide-react";
import { glossary } from "@/lib/glossaryData";
import type { IconType } from "react-icons";
import {
 SiAnthropic,
 SiCanva,
 SiCrewai,
 SiElevenlabs,
 SiFigma,
 SiGithubcopilot,
 SiGooglegemini,
 SiLangchain,
 SiMake,
 SiN8N,
 SiNotion,
 SiOpenai,
 SiPerplexity,
 SiReplit,
 SiVercel,
 SiZapier,
} from "react-icons/si";
import { Shell } from "@/components/system/grid";
import { homeData } from "@/lib/homeData";
import { cardReveal } from "@/lib/motion";

const INTER_STACK = `"Fira Sans", Figtree, system-ui, -apple-system, "Segoe UI", sans-serif`;

type ToolItem = (typeof homeData.tools)[number];

const iconMap: Record<string, { icon?: IconType; localSlug?: string; simpleIconSlug?: string }> = {
 ChatGPT: { icon: SiOpenai, localSlug: "openai", simpleIconSlug: "openai" },
 Claude: { icon: SiAnthropic, localSlug: "anthropic", simpleIconSlug: "anthropic" },
 Gemini: { icon: SiGooglegemini, localSlug: "googlegemini", simpleIconSlug: "googlegemini" },
 Perplexity: { icon: SiPerplexity, localSlug: "perplexity", simpleIconSlug: "perplexity" },
 Mistral: { localSlug: "mistralai", simpleIconSlug: "mistral" },
 "Cohere Command": { localSlug: "cohere", simpleIconSlug: "cohere" },
 n8n: { icon: SiN8N, localSlug: "n8n", simpleIconSlug: "n8n" },
 Zapier: { icon: SiZapier, localSlug: "zapier", simpleIconSlug: "zapier" },
 Make: { icon: SiMake, localSlug: "make", simpleIconSlug: "make" },
 LangChain: { icon: SiLangchain, localSlug: "langchain", simpleIconSlug: "langchain" },
 CrewAI: { icon: SiCrewai, localSlug: "crewai", simpleIconSlug: "crewai" },
 Cursor: { localSlug: "cursor", simpleIconSlug: "cursor" },
 "GitHub Copilot": { icon: SiGithubcopilot, localSlug: "githubcopilot", simpleIconSlug: "githubcopilot" },
 Replit: { icon: SiReplit, localSlug: "replit", simpleIconSlug: "replit" },
 v0: { icon: SiVercel, localSlug: "vercel", simpleIconSlug: "vercel" },
 "Notion AI": { icon: SiNotion, localSlug: "notion", simpleIconSlug: "notion" },
 "Figma AI": { icon: SiFigma, localSlug: "figma", simpleIconSlug: "figma" },
 "Canva AI": { icon: SiCanva, localSlug: "canva", simpleIconSlug: "canva" },
 ElevenLabs: { icon: SiElevenlabs, localSlug: "elevenlabs", simpleIconSlug: "elevenlabs" },
 Midjourney: { localSlug: "midjourney", simpleIconSlug: "midjourney" },
 Supabase: { simpleIconSlug: "supabase" },
 "Hugging Face Inference": { localSlug: "huggingface", simpleIconSlug: "huggingface" },
 "Azure AI Studio": { simpleIconSlug: "microsoftazure" },
 "Amazon Bedrock": { simpleIconSlug: "amazon" },
 "Vertex AI": { simpleIconSlug: "googlecloud" },
};

const toolDomainMap: Record<string, string> = {
 ChatGPT: "chatgpt.com",
 Claude: "claude.ai",
 Gemini: "gemini.google.com",
 Perplexity: "perplexity.ai",
 Mistral: "mistral.ai",
 Llama: "ai.meta.com",
 "Cohere Command": "cohere.com",
 Groq: "groq.com",
 DeepSeek: "deepseek.com",
 Qwen: "qwen.ai",
 Pi: "pi.ai",
 "You.com": "you.com",
 Kagi: "kagi.com",
 Glean: "glean.com",
 Elicit: "elicit.com",
 Consensus: "consensus.app",
 Scite: "scite.ai",
 "Notion AI": "notion.so",
 "Coda AI": "coda.io",
 "Airtable AI": "airtable.com",
 "ClickUp AI": "clickup.com",
 "Asana AI": "asana.com",
 "Monday AI": "monday.com",
 n8n: "n8n.io",
 Zapier: "zapier.com",
 Make: "make.com",
 Pipedream: "pipedream.com",
 Bardeen: "bardeen.ai",
 IFTTT: "ifttt.com",
 Relay: "relay.app",
 Workato: "workato.com",
 "Tray.io": "tray.io",
 UiPath: "uipath.com",
 LangChain: "langchain.com",
 LlamaIndex: "llamaindex.ai",
 CrewAI: "crewai.com",
 AutoGen: "microsoft.com",
 Haystack: "deepset.ai",
 DSPy: "stanford.edu",
 "Semantic Kernel": "microsoft.com",
 OpenRouter: "openrouter.ai",
 Flowise: "flowiseai.com",
 Langflow: "langflow.org",
 Cursor: "cursor.com",
 "GitHub Copilot": "github.com",
 Codeium: "codeium.com",
 Tabnine: "tabnine.com",
 "Amazon Q Developer": "aws.amazon.com",
 "Sourcegraph Cody": "sourcegraph.com",
 Replit: "replit.com",
 v0: "v0.dev",
 Bolt: "bolt.new",
 Loveable: "lovable.dev",
 Windsurf: "windsurf.com",
 Continue: "continue.dev",
 Aider: "aider.chat",
 "Figma AI": "figma.com",
 "Canva AI": "canva.com",
 Midjourney: "midjourney.com",
 "Leonardo AI": "leonardo.ai",
 Ideogram: "ideogram.ai",
 "Adobe Firefly": "adobe.com",
 "DALL-E": "openai.com",
 "Stable Diffusion": "stability.ai",
 Krea: "krea.ai",
 Magnific: "magnific.ai",
 "Framer AI": "framer.com",
 Uizard: "uizard.io",
 Runway: "runwayml.com",
 Pika: "pika.art",
 "Luma Dream Machine": "lumalabs.ai",
 Synthesia: "synthesia.io",
 HeyGen: "heygen.com",
 Descript: "descript.com",
 "CapCut AI": "capcut.com",
 "VEED AI": "veed.io",
 Veed: "veed.io",
 "InVideo AI": "invideo.io",
 ElevenLabs: "elevenlabs.io",
 PlayHT: "play.ht",
 Murf: "murf.ai",
 "Resemble AI": "resemble.ai",
 Suno: "suno.ai",
 Udio: "udio.com",
 Auphonic: "auphonic.com",
 Cleanvoice: "cleanvoice.ai",
 Whisper: "openai.com",
 AssemblyAI: "assemblyai.com",
 Pinecone: "pinecone.io",
 Weaviate: "weaviate.io",
 Qdrant: "qdrant.tech",
 Milvus: "milvus.io",
 Chroma: "trychroma.com",
 Supabase: "supabase.com",
 "Vercel AI SDK": "vercel.com",
 Modal: "modal.com",
 Replicate: "replicate.com",
 "Hugging Face Inference": "huggingface.co",
 "Databricks Mosaic AI": "databricks.com",
 "Snowflake Cortex": "snowflake.com",
 "Vertex AI": "cloud.google.com",
 "Azure AI Studio": "azure.microsoft.com",
 "Amazon Bedrock": "aws.amazon.com",
 LangSmith: "langchain.com",
 PromptLayer: "promptlayer.com",
 Helicone: "helicone.ai",
 "Weights & Biases": "wandb.ai",
 "Arize Phoenix": "arize.com",
};

const fallbackByCategory: Record<string, string> = {
 LLMs: "Core model stack for reasoning, generation, and AI operations.",
 Automation: "Workflow automation for triggers, integrations, and execution loops.",
 Agents: "Agentic orchestration for multi-step actions across tools.",
 Coding: "AI-assisted development stack for faster ship cycles.",
 Research: "Research intelligence tools for source-grounded decisions.",
 Design: "Creative stack for visual assets, UI systems, and prototypes.",
 Video: "Video generation and editing tools for production-ready media.",
 Audio: "Voice and speech systems for product experiences and content.",
 Productivity: "Planning and ops copilots for daily team execution.",
 Infra: "Inference, eval, deployment, and monitoring infrastructure.",
};

const customBrief: Record<string, string> = {
 ChatGPT: "General-purpose AI copilot for writing, coding, and execution planning.",
 Claude: "Long-context reasoning assistant for analysis-heavy workflows.",
 Gemini: "Multimodal model stack for text, code, and media-grounded tasks.",
 n8n: "Visual workflow orchestration for APIs, apps, and AI nodes.",
 Zapier: "No-code automation engine for lead flow and business operations.",
 Cursor: "AI-native coding workspace for fast iteration and shipping.",
 Perplexity: "Source-grounded answer engine for rapid research validation.",
};

const categoryTone: Record<string, string> = {
 LLMs: "from-orange-500/35 to-orange-500/15",
 Automation: "from-indigo-500/35 to-violet-500/15",
 Agents: "from-emerald-500/30 to-orange-500/15",
 Coding: "from-fuchsia-500/30 to-indigo-500/15",
 Research: "from-amber-500/30 to-orange-500/15",
 Design: "from-pink-500/30 to-fuchsia-500/15",
 Video: "from-rose-500/30 to-orange-500/15",
 Audio: "from-teal-500/30 to-orange-500/15",
 Productivity: "from-orange-500/30 to-orange-500/15",
 Infra: "from-slate-400/30 to-slate-600/15",
};

type CategoryTheme = {
 badge: string;
 glow: string;
 popCard: string;
};

const categoryThemeMap: Record<string, CategoryTheme> = {
 LLMs: {
 badge: "border-orange-300/35 bg-orange-500/18",
 glow: "0 0 0 1px rgba(34,211,238,0.35), 0 20px 34px rgba(14,165,233,0.35)",
 popCard: "from-[#404040] via-[#134267] to-[#1d5a86]",
 },
 Automation: {
 badge: "border-indigo-300/35 bg-indigo-500/18",
 glow: "0 0 0 1px rgba(129,140,248,0.35), 0 20px 34px rgba(99,102,241,0.32)",
 popCard: "from-[#454545] via-[#2f3a7c] to-[#3f4c98]",
 },
 Agents: {
 badge: "border-emerald-300/35 bg-emerald-500/18",
 glow: "0 0 0 1px rgba(52,211,153,0.35), 0 20px 34px rgba(16,185,129,0.3)",
 popCard: "from-[#404040] via-[#1f5e64] to-[#2b7a79]",
 },
 Coding: {
 badge: "border-fuchsia-300/35 bg-fuchsia-500/18",
 glow: "0 0 0 1px rgba(217,70,239,0.35), 0 20px 34px rgba(168,85,247,0.3)",
 popCard: "from-[#404040] via-[#4c2674] to-[#5f3491]",
 },
 Research: {
 badge: "border-amber-300/35 bg-amber-500/18",
 glow: "0 0 0 1px rgba(251,191,36,0.35), 0 20px 34px rgba(245,158,11,0.3)",
 popCard: "from-[#4a3216] via-[#5d3f1d] to-[#764f26]",
 },
 Design: {
 badge: "border-pink-300/35 bg-pink-500/18",
 glow: "0 0 0 1px rgba(244,114,182,0.35), 0 20px 34px rgba(236,72,153,0.3)",
 popCard: "from-[#4f1d49] via-[#65285d] to-[#803676]",
 },
 Video: {
 badge: "border-rose-300/35 bg-rose-500/18",
 glow: "0 0 0 1px rgba(251,113,133,0.35), 0 20px 34px rgba(244,63,94,0.3)",
 popCard: "from-[#4c2030] via-[#632a3f] to-[#7d3550]",
 },
 Audio: {
 badge: "border-teal-300/35 bg-teal-500/18",
 glow: "0 0 0 1px rgba(45,212,191,0.35), 0 20px 34px rgba(20,184,166,0.3)",
 popCard: "from-[#404040] via-[#1e6060] to-[#287b7b]",
 },
 Productivity: {
 badge: "border-orange-300/35 bg-orange-500/18",
 glow: "0 0 0 1px rgba(56,189,248,0.35), 0 20px 34px rgba(14,165,233,0.3)",
 popCard: "from-[#1c3c63] via-[#25507f] to-[#326aa4]",
 },
 Infra: {
 badge: "border-slate-300/35 bg-slate-500/18",
 glow: "0 0 0 1px rgba(148,163,184,0.35), 0 20px 34px rgba(100,116,139,0.28)",
 popCard: "from-[#404040] via-[#3a4a62] to-[#4b5d79]",
 },
};

const getCategoryTheme = (category: string): CategoryTheme =>
 categoryThemeMap[category] ?? {
 badge: "border-orange-300/35 bg-orange-500/18",
 glow: "0 0 0 1px rgba(34,211,238,0.35), 0 20px 34px rgba(14,165,233,0.35)",
 popCard: "from-[#404040] via-[#134267] to-[#1d5a86]",
 };

const rowsCount = 5;
const itemsPerRow = 10;
const pageSize = rowsCount * itemsPerRow;

const chunk = <T,>(input: T[], size: number): T[][] => {
 const result: T[][] = [];
 for (let i = 0; i < input.length; i += size) {
 result.push(input.slice(i, i + size));
 }
 return result;
};

const getLogoSources = (tool: ToolItem): string[] => {
 const toolMeta = iconMap[tool.name];
 const sources: string[] = [];
 const mappedDomain = toolDomainMap[tool.name];

 if (toolMeta?.localSlug) {
 sources.push(`/brand-kit/${toolMeta.localSlug}.svg`);
 }
 if (toolMeta?.simpleIconSlug) {
 sources.push(`https://cdn.simpleicons.org/${toolMeta.simpleIconSlug}`);
 }
 if (mappedDomain) {
 sources.push(`https://www.google.com/s2/favicons?domain=${mappedDomain}&sz=128`);
 }

 const guessedSlug = tool.name
 .toLowerCase()
 .replace(/&/g, "and")
 .replace(/[^a-z0-9]/g, "");
 sources.push(`https://cdn.simpleicons.org/${guessedSlug}`);
 sources.push(`https://www.google.com/s2/favicons?domain=${guessedSlug}.com&sz=128`);

 return Array.from(new Set(sources));
};

const ToolLogo = ({ tool }: { tool: ToolItem }) => {
 const iconMeta = iconMap[tool.name];
 const Icon = iconMeta?.icon;
 const [sourceIndex, setSourceIndex] = useState(0);
 const sources = useMemo(() => getLogoSources(tool), [tool]);

 useEffect(() => {
 setSourceIndex(0);
 }, [tool.name]);

 if (Icon) {
 return <Icon className="h-6 w-6 text-[#0A0A0A]" />;
 }

 if (sources[sourceIndex]) {
 return (
 <img
 src={sources[sourceIndex]}
 alt={`${tool.name} logo`}
 className="h-6 w-6 object-contain"
 loading="lazy"
 onError={() => {
 if (sourceIndex < sources.length - 1) {
 setSourceIndex((prev) => prev + 1);
 } else {
 setSourceIndex(-1);
 }
 }}
 />
 );
 }

 return (
 <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-[#0A0A0A]">
 {tool.name.slice(0, 1)}
 </span>
 );
};

// Featured tools — the headliners ONROL actually teaches in cohort.
// Surfaces a curated rail above the 100+ grid so the most important tools get
// dedicated tile space (not buried in a wall of generic icons).
const FEATURED = [
 {
 name: "Claude",
 tagline: "Reasoning + long context · Day 1",
 pricing: "Free + Pro",
 glossarySlug: "claude",
 accent: "from-orange-500 to-amber-500",
 },
 {
 name: "ChatGPT",
 tagline: "General-purpose copilot · Day 1",
 pricing: "Free + Pro",
 glossarySlug: "chatgpt",
 accent: "from-emerald-500 to-teal-500",
 },
 {
 name: "Gemini",
 tagline: "Multimodal + Workspace · Day 1",
 pricing: "Free + Pro",
 glossarySlug: "gemini",
 accent: "from-orange-500 to-orange-600",
 },
 {
 name: "Perplexity",
 tagline: "AI search w/ citations · Day 1",
 pricing: "Free + Pro",
 glossarySlug: "perplexity",
 accent: "from-violet-500 to-fuchsia-500",
 },
 {
 name: "Cursor",
 tagline: "AI-native code editor · Day 4",
 pricing: "Free + Paid",
 glossarySlug: "cursor",
 accent: "from-pink-400 to-rose-300",
 },
 {
 name: "n8n",
 tagline: "Automation engine · Day 3",
 pricing: "Free + self-host",
 glossarySlug: "n8n",
 accent: "from-amber-400 to-orange-300",
 },
];

// Pricing tier per tool — surfaces in the popup ("Free", "Free + Pro", etc.).
const TOOL_PRICING: Record<string, string> = {
 ChatGPT: "Free + Pro",
 Claude: "Free + Pro",
 Gemini: "Free + Pro",
 Perplexity: "Free + Pro",
 Groq: "Free + API",
 Cursor: "Free + Paid",
 "GitHub Copilot": "Paid",
 Replit: "Free + Paid",
 Bolt: "Free + Paid",
 Loveable: "Free + Paid",
 v0: "Free + Pro",
 n8n: "Free (self-host)",
 Zapier: "Free + Paid",
 Make: "Free + Paid",
 Notion: "Free + Paid",
 "Notion AI": "Paid add-on",
 "Figma AI": "Paid add-on",
 "Canva AI": "Free + Pro",
 Midjourney: "Paid",
 ElevenLabs: "Free + Paid",
 Supabase: "Free + Paid",
 "Vercel AI SDK": "Free",
 Replicate: "Pay-per-use",
 Modal: "Free + Paid",
 "Hugging Face Inference": "Free + Paid",
};

// Glossary slug map — link to /glossary/<slug>/ for tools we have entries for.
const TOOL_GLOSSARY: Record<string, string> = {
 ChatGPT: "chatgpt",
 Claude: "claude",
 Gemini: "gemini",
 Perplexity: "perplexity",
 Groq: "groq",
 Cursor: "cursor",
 "GitHub Copilot": "github-copilot",
 Replit: "replit",
 v0: "v0",
 Bolt: "bolt-new",
 Loveable: "lovable",
 n8n: "n8n",
 Zapier: "zapier",
 Make: "make-com",
 Supabase: "supabase",
};

const hasGlossaryEntry = (slug: string) => glossary.some((g) => g.slug === slug);

const HomeToolMarquee = () => {
 const [activeCategory, setActiveCategory] = useState("All");
 const [page, setPage] = useState(0);
 const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
 const [query, setQuery] = useState("");

 // Filter pipeline: category → search query
 const filtered = useMemo(() => {
 let pool = homeData.tools as ToolItem[];
 if (activeCategory !== "All") {
 pool = pool.filter((tool) => tool.category === activeCategory);
 }
 const q = query.trim().toLowerCase();
 if (q) {
 pool = pool.filter(
 (tool) =>
 tool.name.toLowerCase().includes(q) ||
 tool.category.toLowerCase().includes(q),
 );
 }
 return pool;
 }, [activeCategory, query]);

 const normalizedTools = useMemo(() => {
 if (activeCategory === "All" && !query.trim()) {
 return filtered.slice(0, 100);
 }
 return filtered;
 }, [activeCategory, query, filtered]);

 const pages = useMemo(() => chunk([...normalizedTools], pageSize), [normalizedTools]);
 const maxPage = Math.max(0, pages.length - 1);
 const rows = useMemo(() => chunk(pages[page] ?? [], itemsPerRow), [page, pages]);

 // Per-category counts for the chip strip.
 const categoryCounts = useMemo(() => {
 const counts: Record<string, number> = { All: Math.min(homeData.tools.length, 100) };
 for (const tool of homeData.tools) {
 counts[tool.category] = (counts[tool.category] ?? 0) + 1;
 }
 return counts;
 }, []);

 useEffect(() => {
 setPage(0);
 }, [activeCategory, query]);

 useEffect(() => {
 setSelectedTool(null);
 }, [activeCategory, page, query]);

 return (
 <section
 id="tools"
 className="onrol-lazy-section relative border-b border-black/10 bg-white py-10 md:py-16"
 style={{ fontFamily: INTER_STACK }}
 >
 <Shell>
 {/* Phase E — teaching-frame heading. Anchors the section to learning, not gallery. */}
 <div className="max-w-3xl">
 <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f46718]">
 — The AI stack you'll actually use
 </p>
 <h2
 className="mt-3 text-[#0A0A0A]"
 style={{
 fontSize: "clamp(34px, 5vw, 56px)",
 lineHeight: 1.04,
 letterSpacing: "-0.025em",
 fontWeight: 800,
 }}
 >
 100+ tools, mapped to real <span className="text-[#f46718]">builder workflows</span>.
 </h2>
 <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-[#0A0A0A] md:text-base">
 Prompts, RAG, automation, agents, vibe coding, launch systems. The stack below is organized around what you will actually ship.
 </p>
 </div>


 {/* Phase D — Search + filter chips with active counts. */}
 <motion.div {...cardReveal(0)} className="mt-10">
 <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
 <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#f46718]">
 + 100 more across the ecosystem
 </p>
 <div className="relative w-full max-w-sm">
 <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black/65" />
 <input
 type="search"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Search tools…"
 className="h-11 w-full rounded-full border bg-white pl-10 pr-10 text-[13.5px] text-[#0A0A0A] placeholder:text-black/65 focus:border-orange-400/60 focus:outline-none focus:ring-2 focus:ring-orange-300/20"
 />
 {query ? (
 <button
 type="button"
 onClick={() => setQuery("")}
 aria-label="Clear search"
 className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-black/65 transition hover:bg-white hover:text-[#0A0A0A]"
 >
 <X className="h-3.5 w-3.5" />
 </button>
 ) : null}
 </div>
 </div>

 <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
 {/* Mobile: category dropdown (saves the multi-row chip strip). */}
 <div className="w-full sm:hidden">
 <select
 value={activeCategory}
 onChange={(e) => setActiveCategory(e.target.value)}
 aria-label="Filter tools by category"
 className="h-11 w-full border border-black/15 bg-white px-3 text-[14px] font-semibold text-[#0A0A0A] focus:border-[#f46718] focus:outline-none focus:ring-2 focus:ring-[#f46718]/30"
 >
 {homeData.toolCategories.map((category) => (
 <option key={category} value={category}>
 {category} ({categoryCounts[category] ?? 0})
 </option>
 ))}
 </select>
 </div>
 {/* Desktop: chip strip. */}
 <div className="hidden flex-wrap gap-1.5 sm:flex">
 {homeData.toolCategories.map((category) => {
 const count = categoryCounts[category] ?? 0;
 const active = activeCategory === category;
 return (
 <button
 key={category}
 onClick={() => setActiveCategory(category)}
 className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition active:scale-[0.98] ${
 active
 ? "bg-orange-500 text-[#0A0A0A]"
 : "border bg-white text-[#0A0A0A] hover:border-orange-300/40 hover:bg-white hover:text-[#0A0A0A]"
 }`}
 >
 {category}
 <span
 className={`rounded-full px-1.5 py-0.5 text-[10px] ${
 active ? "bg-white/20" : "bg-white text-black/65"
 }`}
 >
 {count}
 </span>
 </button>
 );
 })}
 </div>

 <div className="hidden items-center gap-2 sm:flex">
 <button
 onClick={() => setPage((p) => (p <= 0 ? maxPage : p - 1))}
 className="grid h-10 w-10 place-items-center rounded-full border border-[#0B1640]/12 bg-white text-[#0A0A0A] transition hover:border-orange-300/40 hover:bg-white"
 aria-label="Previous tools page"
 >
 <ChevronLeft className="h-4 w-4" />
 </button>
 <p className="text-[12px] font-semibold uppercase tracking-wider text-black/65">
 Page {Math.min(page + 1, maxPage + 1)} / {Math.max(maxPage + 1, 1)}
 </p>
 <button
 onClick={() => setPage((p) => (p >= maxPage ? 0 : p + 1))}
 className="grid h-10 w-10 place-items-center rounded-full border border-[#0B1640]/12 bg-white text-[#0A0A0A] transition hover:border-orange-300/40 hover:bg-white"
 aria-label="Next tools page"
 >
 <ChevronRight className="h-4 w-4" />
 </button>
 </div>
 </div>
 </motion.div>

 <motion.div
 {...cardReveal(1)}
 className="relative mt-6  border border-white bg-white p-3 md:p-4"
 >
 <button
 type="button"
 onClick={() => setPage((p) => (p <= 0 ? maxPage : p - 1))}
 className="absolute -left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-white/95 text-[#0A0A0A] transition-all duration-200 hover:scale-105 hover:border-orange-300/55 hover:bg-white lg:inline-flex"
 aria-label="Previous tools page"
 >
 <ChevronLeft className="h-5 w-5" />
 </button>
 <button
 type="button"
 onClick={() => setPage((p) => (p >= maxPage ? 0 : p + 1))}
 className="absolute -right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-white/95 text-[#0A0A0A] transition-all duration-200 hover:scale-105 hover:border-orange-300/55 hover:bg-white lg:inline-flex"
 aria-label="Next tools page"
 >
 <ChevronRight className="h-5 w-5" />
 </button>

 {/* MOBILE: 3-col swipeable carousel, 15 tools per slide (one tap opens the tool modal). */}
 <div className="sm:hidden">
 <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
 {chunk([...normalizedTools], 15).map((slide, si) => (
 <div key={`mslide-${si}`} className="grid w-full shrink-0 snap-center grid-cols-3 gap-2">
 {slide.map((tool) => {
 const theme = getCategoryTheme(tool.category);
 return (
 <button
 key={tool.name}
 type="button"
 onClick={() => setSelectedTool(tool)}
 className="flex flex-col items-center gap-2 border border-black/10 bg-white p-3"
 >
 <span className={`inline-flex h-10 w-10 items-center justify-center border ${theme.badge}`}>
 <ToolLogo tool={tool} />
 </span>
 <p className="line-clamp-1 max-w-full text-center text-[10.5px] font-semibold text-[#0A0A0A]">{tool.name}</p>
 </button>
 );
 })}
 </div>
 ))}
 </div>
 <p className="mt-2 text-center text-[11px] font-medium text-black/50">
 Swipe to explore all {normalizedTools.length} tools &rarr;
 </p>
 </div>

 {/* DESKTOP grid (sm+). Background glow recolored to match orange brand. */}
 <AnimatePresence mode="wait">
 <motion.div
 key={`${activeCategory}-${page}`}
 initial={{ opacity: 1, y: 12 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -12 }}
 transition={{ duration: 0.22 }}
 className="relative z-10 hidden space-y-1.5 sm:block"
 >
 {/* Phase A — drop row labels, show tool name under each tile. */}
 {(rows[0] ?? []).length === 0 && query.trim() ? (
 <div className="px-2 py-12 text-center">
 <p className="text-[14px] font-semibold text-[#0A0A0A]">
 No tools match "{query}".
 </p>
 <button
 type="button"
 onClick={() => setQuery("")}
 className="mt-3 text-[12px] font-bold uppercase tracking-wider text-[#f46718] hover:text-[#f46718]"
 >
 Clear search →
 </button>
 </div>
 ) : null}
 {Array.from({ length: rowsCount }, (_, rowIndex) => {
 const rowItems = rows[rowIndex] ?? [];
 if (rowItems.length === 0) return null;
 return (
 <div key={`row-${rowIndex}`}>
 <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-10">
 {rowItems.map((tool, colIndex) => {
 const description = customBrief[tool.name] ?? fallbackByCategory[tool.category] ?? "AI tool";
 const theme = getCategoryTheme(tool.category);
 const rowLength = rowItems.length;
 const opensDown = rowIndex <= 1;
 const isLeftEdge = colIndex <= 1;
 const isRightEdge = colIndex >= Math.max(rowLength - 2, 0);
 const horizontalAnchor = isLeftEdge
 ? "left-0 translate-x-0"
 : isRightEdge
 ? "left-auto right-0 translate-x-0"
 : "left-1/2 -translate-x-1/2";
 const verticalAnchor = opensDown ? "top-[calc(100%+10px)]" : "bottom-[calc(100%+10px)]";
 const domain = toolDomainMap[tool.name];
 const glossarySlug = TOOL_GLOSSARY[tool.name];
 const glossaryHref =
 glossarySlug && hasGlossaryEntry(glossarySlug)
 ? `/glossary/${glossarySlug}/`
 : null;
 const pricing = TOOL_PRICING[tool.name] ?? null;

 return (
 <motion.article
 key={`${tool.name}-${rowIndex}-${colIndex}`}
 whileHover={{ y: -2 }}
 transition={{ duration: 0.16 }}
 onClick={() => {
 if (
 domain &&
 typeof window !== "undefined" &&
 window.matchMedia("(min-width: 768px)").matches
 ) {
 window.open(`https://${domain}`, "_blank", "noopener,noreferrer");
 } else {
 setSelectedTool(tool);
 }
 }}
 className="group relative cursor-pointer  border border-slate-100 bg-white p-3 transition-all duration-200 hover:z-40 hover:-translate-y-0.5 hover:border-orange-300/45 hover:bg-white"
 >
 <div className="flex flex-col items-center gap-2">
 <div className={`inline-flex h-10 w-10 items-center justify-center  border backdrop-blur-sm ${theme.badge}`}>
 <ToolLogo tool={tool} />
 </div>
 {/* Phase A — name below icon, no more mystery tiles. */}
 <p className="line-clamp-1 max-w-full text-center text-[10.5px] font-semibold text-[#0A0A0A] group-hover:text-[#0A0A0A]">
 {tool.name}
 </p>
 </div>
 {/* Phase A — tiny category-color dot. */}
 <span
 aria-hidden
 className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full ${theme.badge.replace("/18", "/60").replace("border-", "bg-").split(" ")[1]}`}
 />

 {/* Phase C — premium hover popup. */}
 <div className={`pointer-events-none absolute z-[80] w-72 scale-[0.85]  border border-black/10 bg-white p-5 opacity-0 backdrop-blur-xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 ${horizontalAnchor} ${verticalAnchor}`}>
 <div className="relative flex items-start gap-3">
 <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center  border backdrop-blur-sm ${theme.badge}`}>
 <ToolLogo tool={tool} />
 </div>
 <div className="min-w-0">
 <p className="truncate text-[15px] font-bold text-[#0A0A0A]">
 {tool.name}
 </p>
 <span className="mt-1 inline-flex items-center rounded-full border border-orange-300/30 bg-orange-500/10 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#f46718]">
 {tool.category}
 </span>
 </div>
 </div>
 <p className="relative mt-4 text-[12.5px] leading-relaxed text-[#0A0A0A]">
 {description}
 </p>
 {pricing ? (
 <div className="relative mt-3 flex items-center gap-1.5 text-[11px] text-[#0A0A0A]">
 <Sparkles className="h-3 w-3 text-[#f46718]" />
 <span>{pricing}</span>
 </div>
 ) : null}
 <div className="relative mt-4 flex flex-wrap items-center gap-2">
 {domain ? (
 <span className="inline-flex items-center gap-1  border border-[#0B1640]/12 bg-white/[0.04] px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wider text-black/65">
 Visit <ExternalLink className="h-3 w-3" />
 </span>
 ) : null}
 {glossaryHref ? (
 <span className="inline-flex items-center gap-1  border border-orange-300/30 bg-orange-500/10 px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wider text-[#f46718]">
 <BookOpen className="h-3 w-3" /> In glossary
 </span>
 ) : null}
 </div>
 </div>
 </motion.article>
 );
 })}
 </div>
 </div>
 );
 })}
 </motion.div>
 </AnimatePresence>
 </motion.div>

 {/* Mobile detail panel — same premium info as the desktop hover popup. */}
 <AnimatePresence>
 {selectedTool ? (
 <motion.div
 initial={{ opacity: 1, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -10 }}
 className="relative mt-4 overflow-hidden  border border-black/10 bg-white p-5 md:hidden"
 >
 <button
 type="button"
 aria-label="Close"
 onClick={() => setSelectedTool(null)}
 className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white text-[#0A0A0A] transition hover:bg-white/20"
 >
 <X className="h-3.5 w-3.5" />
 </button>
 <div className="relative flex items-start gap-3">
 <div className={`inline-flex h-12 w-12 shrink-0 items-center justify-center  border backdrop-blur-sm ${getCategoryTheme(selectedTool.category).badge}`}>
 <ToolLogo tool={selectedTool} />
 </div>
 <div className="min-w-0 flex-1 pr-6">
 <p className="text-[15px] font-bold text-[#0A0A0A]">{selectedTool.name}</p>
 <span className="mt-1 inline-flex items-center rounded-full border border-orange-300/30 bg-orange-500/10 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#f46718]">
 {selectedTool.category}
 </span>
 </div>
 </div>
 <p className="relative mt-4 text-[13px] leading-relaxed text-[#0A0A0A]">
 {customBrief[selectedTool.name] ?? fallbackByCategory[selectedTool.category] ?? "AI tool"}
 </p>
 {TOOL_PRICING[selectedTool.name] ? (
 <div className="relative mt-3 flex items-center gap-1.5 text-[11.5px] text-[#0A0A0A]">
 <Sparkles className="h-3 w-3 text-[#f46718]" />
 <span>{TOOL_PRICING[selectedTool.name]}</span>
 </div>
 ) : null}
 <div className="relative mt-4 flex flex-wrap items-center gap-2">
 {toolDomainMap[selectedTool.name] ? (
 <a
 href={`https://${toolDomainMap[selectedTool.name]}`}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5  bg-gradient-to-r from-orange-500 to-orange-400 px-3.5 py-2 text-[12px] font-bold uppercase tracking-wider text-[#0A0A0A]"
 >
 Visit <ExternalLink className="h-3 w-3" />
 </a>
 ) : null}
 {TOOL_GLOSSARY[selectedTool.name] && hasGlossaryEntry(TOOL_GLOSSARY[selectedTool.name]) ? (
 <Link
 to={`/glossary/${TOOL_GLOSSARY[selectedTool.name]}/`}
 className="inline-flex items-center gap-1.5  border border-orange-300/35 bg-orange-500/10 px-3.5 py-2 text-[12px] font-bold uppercase tracking-wider text-[#f46718]"
 >
 <BookOpen className="h-3 w-3" /> Glossary
 </Link>
 ) : null}
 </div>
 </motion.div>
 ) : null}
 </AnimatePresence>

 {/* Mobile: compact "Page X / Y" + prev/next (10 × 44px dot row overflowed 390px on phones, mobile audit). */}
 <div className="mt-4 hidden items-center justify-center gap-2">
 <button
 type="button"
 aria-label="Previous page"
 onClick={() => setPage((page - 1 + pages.length) % pages.length)}
 className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white text-[#0A0A0A] active:scale-95"
 >
 <ChevronLeft className="h-5 w-5" />
 </button>
 <span className="min-w-[80px] text-center text-[12px] font-bold uppercase tracking-wider text-[#0A0A0A]">
 Page {page + 1} / {pages.length}
 </span>
 <button
 type="button"
 aria-label="Next page"
 onClick={() => setPage((page + 1) % pages.length)}
 className="grid h-11 w-11 place-items-center rounded-full border border-black/10 bg-white text-[#0A0A0A] active:scale-95"
 >
 <ChevronRight className="h-5 w-5" />
 </button>
 </div>

 {/* Desktop: classic dot indicator. */}
 <div className="mt-4 hidden items-center justify-center gap-1 sm:flex">
 {pages.map((_item, index) => (
 <button
 key={`dot-${index}`}
 type="button"
 aria-label={`Go to tools page ${index + 1}`}
 onClick={() => setPage(index)}
 // 44px touch target via padding while keeping the dot visually small.
 className="grid h-11 w-11 place-items-center"
 >
 <span
 aria-hidden
 className={`block h-2.5 rounded-full transition-all ${
 page === index ? "w-7 bg-orange-400" : "w-3 bg-black/15 hover:bg-black/20"
 }`}
 />
 </button>
 ))}
 </div>

 </Shell>
 </section>
 );
};

export default HomeToolMarquee;
