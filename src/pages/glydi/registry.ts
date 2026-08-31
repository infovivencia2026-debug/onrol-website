// Registry of every ported glydi/onrol-home sub-page: raw markup + SEO meta +
// route. Imported by GlydiRoute (one lazy chunk for all sub-pages).
import programs from "./markup/programs.html?raw";
import aiPrograms from "./markup/ai-programs.html?raw";
import cyberPrograms from "./markup/cyber-programs.html?raw";
import aica from "./markup/aica.html?raw";
import aiGeneralist from "./markup/ai-generalist.html?raw";
import aiArchitect from "./markup/ai-architect.html?raw";
import about from "./markup/about.html?raw";
import mentors from "./markup/mentors.html?raw";
import faq from "./markup/faq.html?raw";
import glossary from "./markup/glossary.html?raw";
import blog from "./markup/blog.html?raw";
import quiz from "./markup/quiz.html?raw";
import masterclass from "./markup/masterclass.html?raw";
import whyAiMatters from "./markup/why-ai-matters.html?raw";
import aiCourseHyderabad from "./markup/ai-course-hyderabad.html?raw";
import bestAiInstitute from "./markup/best-ai-institute-hyderabad.html?raw";
import cybersecurity from "./markup/cybersecurity.html?raw";
import socAnalyst from "./markup/soc-analyst.html?raw";
import privacy from "./markup/privacy.html?raw";
import terms from "./markup/terms.html?raw";
import contact from "./markup/contact.html?raw";
import thankYou from "./markup/thank-you.html?raw";

export interface GlydiPageDef {
  path: string;
  markup: string;
  title: string;
  description: string;
  leadForm?: boolean;
  contactForm?: boolean;
  course?: string;
}

// Each page's ordered script manifest (extracted from the source HTML): external
// srcs (utils.js, config.js, GSAP, …) + inline code, in original load order.
export type GlydiScript = { src?: string; code?: string };
const scriptModules = import.meta.glob("./scripts/*.json", { eager: true }) as Record<
  string,
  { default: GlydiScript[] }
>;
export function glydiScripts(key: string): GlydiScript[] {
  return scriptModules[`./scripts/${key}.json`]?.default ?? [];
}

export const GLYDI_PAGES: Record<string, GlydiPageDef> = {
  programs: { path: "/programs", markup: programs, title: "Programs · ONROL", description: "Explore ONROL's two tracks — AI Programs and Cyber Security Programs at India's AI Execution School." },
  "ai-programs": { path: "/programs/ai", markup: aiPrograms, title: "AI Programs · ONROL", description: "ONROL's AI track — the AI Generalist and AI Architect programs." },
  "cyber-programs": { path: "/programs/cyber", markup: cyberPrograms, title: "Cyber Security Programs · ONROL", description: "ONROL's Cyber Security track — the Cyber Security and SOC Analyst programs." },  aica: { path: "/programs/aica", markup: aica, title: "AI Career Accelerator — 21 Days, Live | ONROL", description: "The 21-day ONROL AI Career Accelerator: 21 live sessions, an hour a day — the full day-by-day plan, from your first AI tools to a career project, portfolio and 90-day roadmap.", leadForm: true, course: "AI Career Accelerator" },

  "ai-generalist": { path: "/programs/ai-generalist", markup: aiGeneralist, title: "ONROL AI Generalist Program", description: "Become an AI Generalist in 3 months. Build 5 AI systems and 7+ real projects with a portfolio that gets you hired, clients, or freelance income.", leadForm: true, course: "AI Generalist Program" },
  "ai-architect": { path: "/programs/ai-architect", markup: aiArchitect, title: "AI Architect Program — Build & Lead AI Systems | ONROL", description: "The ONROL AI Architect program — go beyond using AI to design, build, and lead production-grade AI systems.", leadForm: true, course: "AI Architect Program" },
  about: { path: "/about", markup: about, title: "About · ONROL", description: "ONROL is India's AI Execution School — stop watching tutorials and start shipping real AI products." },
  mentors: { path: "/mentors", markup: mentors, title: "Mentors · ONROL", description: "Meet the ONROL mentors — practitioners who actually ship AI products." },
  faq: { path: "/questions", markup: faq, title: "Questions Answered · ONROL", description: "Answers to common questions about ONROL, the AI Generalist program, and how the cohort works." },
  glossary: { path: "/glossary", markup: glossary, title: "AI Glossary · ONROL", description: "Plain-English definitions of the AI terms that matter for builders." },
  blog: { path: "/blog", markup: blog, title: "Blog · ONROL", description: "Practical AI playbooks, build guides, and execution notes from ONROL." },
  quiz: { path: "/tools/ai-skills-quiz", markup: quiz, title: "AI Skills Quiz · ONROL", description: "Take the ONROL AI Skills Quiz and find your starting point." },
  masterclass: { path: "/masterclass", markup: masterclass, title: "Free AI Masterclass · ONROL", description: "Join the free ONROL AI masterclass on AI agents and vibe coding." },
  "why-ai-matters": { path: "/why-now", markup: whyAiMatters, title: "Why AI Matters Now · ONROL", description: "Why now is the moment to build with AI — and how ONROL gets you shipping." },
  "ai-course-hyderabad": { path: "/ai-course-in-hyderabad", markup: aiCourseHyderabad, title: "AI Course in Hyderabad · ONROL", description: "ONROL's applied AI course in Hyderabad — execution-first, builder-track AI training." },
  "best-ai-institute-hyderabad": { path: "/best-ai-institute-in-hyderabad", markup: bestAiInstitute, title: "Best AI Institute in Hyderabad · ONROL", description: "Why ONROL is among the best AI institutes in Hyderabad for applied, outcome-focused AI." },
  cybersecurity: { path: "/programs/cybersecurity", markup: cybersecurity, title: "Cyber Security Course Online — Zero to Job-Ready Defender | ONROL", description: "ONROL's online Cyber Security course — go from zero to a job-ready defender with hands-on, applied security skills.", leadForm: true, course: "Cyber Security Program" },
  "soc-analyst": { path: "/programs/soc-analyst", markup: socAnalyst, title: "SOC Analyst Course Online · ONROL", description: "Become a SOC Analyst — detect, investigate, and respond to threats. Fully online, hands-on ONROL program.", leadForm: true, course: "SOC Analyst Program" },
  privacy: { path: "/privacy-policy", markup: privacy, title: "Privacy Policy · ONROL", description: "ONROL privacy policy." },
  terms: { path: "/terms-and-conditions", markup: terms, title: "Terms & Conditions · ONROL", description: "ONROL terms and conditions." },
  contact: { path: "/contact", markup: contact, title: "Contact · ONROL", description: "Get in touch with ONROL — questions about programs, cohorts, and enrolment.", contactForm: true },
  "thank-you": { path: "/thank-you", markup: thankYou, title: "Thank you · ONROL", description: "Thanks for registering with ONROL — our team will be in touch shortly." },
};
