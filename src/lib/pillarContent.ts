// Source of truth for the 10 SEO pillar pages. Each entry produces one route
// rendered by <PillarPage> using <PillarPageLayout>.
//
// Phase 2 — edit any field below; everything else (SEO meta, FAQ
// schema, breadcrumbs, internal links) is auto-generated.

import type { FaqItem, ItemListEntry } from "./structuredData";

export interface InternalLink { name: string; href: string; blurb?: string }
export interface PillarSection {
  heading: string;
  body?: string;
  bullets?: string[];
}

export interface PillarPage {
  slug: string;                // url path WITHOUT leading slash
  title: string;               // <title> tag
  metaDescription: string;     // <meta name="description">
  eyebrow: string;             // small caps line above H1
  h1: string;                  // hero headline (italics on the LAST word)
  hook: string;                // big sub-line under H1
  intro: string;               // first paragraph — direct answer to the search query
  /** 0–3 stat tiles shown right after intro. Optional. */
  stats?: { value: string; label: string }[];
  sections: PillarSection[];
  faqs: FaqItem[];
  /** Related-link rail at the bottom. Auto-prepended with /ai-execution-school. */
  related?: InternalLink[];
  /** Color theme for the section accent strip. */
  accent: "cyan" | "orange" | "violet" | "emerald" | "amber" | "pink" | "blue" | "rose";
  /** Override the CTA copy if needed. */
  cta?: { label: string; href: string };
  /** Ranked listicle data (drives ItemList JSON-LD). Present only on listicle pillars. */
  itemList?: { name: string; description?: string; items: ItemListEntry[] };
}

const DEFAULT_RELATED: InternalLink[] = [
  { name: "Best AI institute in India 2026", href: "/best-ai-institutes-in-india/", blurb: "Built persona-first for 12 kinds of Indians." },
  { name: "AI for every persona — 12 tracks", href: "/personas/", blurb: "Engineers, students, teachers, founders, sales/marketing, real-estate, and more." },
  { name: "AI Execution School", href: "/ai-execution-school/", blurb: "ONROL's thesis: applied AI over academic AI." },
  { name: "AI Generalist (3-month intensive)", href: "/programs/ai-generalist/", blurb: "Beginner-friendly. Ship 3 live AI projects in 3 months." },
  { name: "Top vibe coding training India", href: "/top-vibe-coding-training-india/", blurb: "Lovable, Bolt, Cursor, v0, Replit AI — live cohort." },
  { name: "What you'll build (proof)", href: "/proof/", blurb: "5 project archetypes + 19 already-deployed ONROL tools." },
];

export function relatedFor(slug: string): InternalLink[] {
  // Filter out the current page from the related rail.
  return DEFAULT_RELATED.filter((r) => !r.href.endsWith(`/${slug}`) && r.href !== `/${slug}`);
}

export const pillarPages: PillarPage[] = [
  // ────────────────────────────────────────────────────────────────────────
  // 1. AI Execution School (the thesis page)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "ai-execution-school",
    title: "ONROL — India's AI Execution School | Practical AI Skills Bootcamp",
    metaDescription:
      "ONROL is India's AI Execution School. Practical AI bootcamps for students, professionals, freelancers, business owners, creators, and teachers. Ship 3 live AI projects in 3 months. Free Masterclass available.",
    eyebrow: "— The thesis",
    h1: "India's AI Execution School",
    hook: "Top universities teach you what AI is. ONROL teaches you what to do with AI.",
    intro:
      "An AI Execution School teaches applied AI — the practical use of existing AI tools, workflows, automations, agents, and APIs to ship real, deployable solutions. ONROL is India's first dedicated AI Execution School. We are not a research bootcamp, not a passive video course, and not a 6-month theory program. We are a 3-month intensive that gets non-coders, students, and working professionals from zero to three live AI projects deployed under their own name.",
    stats: [
      { value: "100+", label: "Builders trained" },
      { value: "3", label: "Live projects per learner" },
      { value: "5d", label: "Zero to first launch" },
    ],
    sections: [
      {
        heading: "What is an AI Execution School?",
        body: "An AI Execution School is a practical AI program where the only definition of success is shipped, deployed, working AI products. Theory is taught only when it directly enables a build. Mentors are practitioners actively shipping AI products themselves, not professors. Cohorts are small. Outcomes are visible — every learner walks out with deploy URLs they can show employers, clients, or investors.",
      },
      {
        heading: "Why applied AI, not academic AI?",
        body: "Both paths are valid. Academic universities are world-class for the science of AI: math, theory, model architecture, novel research. But most learners — the majority — don't need a PhD to benefit from AI. They need to use AI to automate work, build a side income, grow a business, or land a job. ONROL serves that majority. The Indian job market today rewards builders who ship, not researchers who publish.",
      },
      {
        heading: "Who ONROL is for",
        bullets: [
          "Students (school + college) — build a portfolio of AI projects to stand out in placements",
          "Working professionals — automate parts of your job, transition into AI-adjacent roles",
          "Freelancers — sell AI services (automation, content, agents) as a new revenue stream",
          "Business owners — deploy AI in your business for sales, leads, ops, support",
          "Content creators — grow IG, YouTube, LinkedIn using AI tools for scripts, carousels, scheduling",
          "Teachers and schools — lesson planning, worksheets, question papers, classroom productivity",
        ],
      },
      {
        heading: "What every ONROL learner ships",
        bullets: [
          "A backend automation system handling a real workflow (n8n, Zapier, or custom)",
          "A vibe-coded live website deployed to a real URL",
          "A fine-tuned personal AI assistant trained on the learner's own data",
        ],
      },
      {
        heading: "Tools you'll work with",
        body: "Claude, ChatGPT, Gemini, Perplexity, Groq, Cloudflare AI Workers, n8n, Zapier, Make, Notion AI, Cursor, Bolt.new, v0, Lovable, Replit, Vercel, Supabase, ElevenLabs, Suno, and more. ONROL also runs a 19-tool SaaS suite at tools.onrol.in that students get full access to during the program — viral content radar, IG caption generators, carousel builders, reel makers, social schedulers, lead-discovery tools, brand identity generators, thumbnail studios, and more.",
      },
    ],
    faqs: [
      {
        q: "What is an AI Execution School?",
        a: "An AI Execution School teaches applied AI — using AI tools, workflows, automations, and agents to ship real deployable products. Unlike academic AI programs (research-focused), it prioritises shipping over theory. Every learner walks out with live deploy URLs.",
      },
      {
        q: "How is ONROL different from a regular AI bootcamp?",
        a: "Three differences: (1) every cohort ships three live projects in 3 months, not slides or quizzes; (2) mentors are active AI practitioners, not pre-recorded video; (3) curriculum is built around the Indian market — fees, tools, and use-cases tuned for Indian students, freelancers, and SMBs.",
      },
      {
        q: "Do I need a coding background?",
        a: "No. The Generalist track is built for non-coders. Vibe coding (using AI as your pair-programmer) lets you ship deployable apps even if you've never written a function before. By the end of the program you'll have a live URL you can share.",
      },
      {
        q: "Is this useful if I'm already a developer?",
        a: "Yes — the AI Architect track is for practitioners moving into AI agents, multi-step workflows, and production deployments. You'll skip basics and focus on shipping AI products at scale.",
      },
      {
        q: "What's the difference between academic AI and ONROL?",
        a: "Academic AI programs at top universities are research-led — math, theory, model architecture. They produce ML engineers and researchers. ONROL is execution-led — tools, automations, deployment. We produce builders, freelancers, and business operators who use AI in their daily work. Both paths matter for different goals.",
      },
      {
        q: "How much does ONROL cost?",
        a: "Pricing is shared on the Programs page. ONROL fees are tuned for the Indian market and significantly lower than US bootcamps — we keep cost low because the goal is mass access to applied AI, not a premium credential.",
      },
      {
        q: "Is there a free preview?",
        a: "Yes. ONROL runs a free 90-minute Masterclass on AI agents and vibe coding. No commitment, no upsell. Reserve your seat at onrol.in.",
      },
      {
        q: "What happens after the 3-month program?",
        a: "Every graduate joins ONROL Community — ONROL's private community for ongoing builds, projects, mentorship, and weekly workshops. ONROL Community access is included for one year. You also keep lifetime access to the tools.onrol.in suite (19+ AI tools).",
      },
      {
        q: "Can I attend ONROL while working full-time?",
        a: "Yes. Cohorts are designed to be intensive but fit around full-time work. Sessions are scheduled in the evenings IST, recordings are available, and projects are designed to take 1–2 hours of focused work outside of session time.",
      },
      {
        q: "Will I really build something useful in 3 months?",
        a: "Yes — that's literally the only thing we measure. Every learner ships three live projects: a backend automation system handling a real workflow, a vibe-coded website on a real URL, and a fine-tuned personal AI assistant. Past cohort projects are visible on the ONROL community page.",
      },
    ],
    accent: "cyan",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 2. Best AI Course in India
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "best-ai-course-in-india",
    title: "Best AI Course in India for Practical AI Skills (2026) | ONROL",
    metaDescription:
      "Best AI course in India depends on your goal. Academic AI vs applied AI explained. ONROL is India's AI Execution School — 3 months, 3 live projects, beginner-friendly, no coding required.",
    eyebrow: "— India's AI course landscape",
    h1: "Best AI Course in India",
    hook: "The right course depends on whether you want academic depth or applied execution.",
    intro:
      "There is no single 'best AI course in India' — there are two distinct paths, and the right one depends on your goal. If you want academic depth, model architecture, or research, top academic universities lead. If you want practical AI skills you can use this week — automating work, building products, freelancing, or growing a business — applied AI programs like ONROL are built for that goal. This page helps you pick.",
    stats: [
      { value: "2", label: "Distinct AI learning paths" },
      { value: "5d", label: "ONROL: zero to first launch" },
      { value: "100+", label: "ONROL builders trained" },
    ],
    sections: [
      {
        heading: "The two AI learning paths in India",
        body: "Academic AI (Academic universities and structured university-aligned online programs) teaches the science of AI — linear algebra, statistics, neural network architecture, optimisation, research papers. Output: PhDs, ML engineers, researchers. Applied AI (ONROL, hands-on bootcamps, project-based programs) teaches the use of AI — tools, prompting, automation, workflows, agents, deployment. Output: builders, freelancers, business operators, AI-augmented professionals.",
      },
      {
        heading: "Who should pick academic AI",
        bullets: [
          "You want a research career — PhD, postdoc, lab work",
          "You want to be an ML engineer at a Tier-1 lab (Google Brain, OpenAI, Anthropic, DeepMind)",
          "You enjoy math and abstract theory and have 2–4 years to invest",
          "You want institutional credentialling that opens doors regardless of output",
        ],
      },
      {
        heading: "Who should pick applied AI",
        bullets: [
          "You want to use AI in your job, freelance work, or business — not study it",
          "You don't have 2 years to invest before seeing income",
          "You're a non-coder, student, professional, or business owner",
          "You measure success by what you ship, not what you know",
        ],
      },
      {
        heading: "Why ONROL is the leader for applied AI in India",
        bullets: [
          "Built specifically for Indian learners — Hindi-friendly mentors, INR-based pricing, India-local case studies",
          "Outcome-first: every cohort ships 3 deployable projects in 3 months",
          "Active practitioner mentors — not professors, not pre-recorded videos",
          "Year-long ONROL Community access included",
          "Lifetime access to tools.onrol.in (19+ AI tools)",
          "Free 90-minute Masterclass to try before you commit",
        ],
      },
      {
        heading: "What to ask before picking ANY AI course",
        body: "Don't ask 'is it good?' — ask: (1) What will I have at the end that I can show? (2) Are the mentors active practitioners or theory-only? (3) How many real projects will I ship? (4) Is there a community for ongoing growth? (5) Is the curriculum updated within the last 6 months? (6) Can I see past learner outputs? If a course can't answer all six clearly, walk away.",
      },
    ],
    faqs: [
      {
        q: "Which is the best AI course in India?",
        a: "Depends on your goal. For research and ML engineering: top academic universities lead. For applied AI execution (using AI to automate work, build products, freelance, run a business): ONROL is India's AI Execution School and is built specifically for that outcome.",
      },
      {
        q: "Which AI course is best for beginners?",
        a: "ONROL's AI Generalist 3-month intensive is built for absolute beginners. No prior coding, math, or AI background required. By the end of the program you'll have shipped three live AI projects.",
      },
      {
        q: "Can I learn AI without coding?",
        a: "Yes. AI tooling has matured to the point where non-coders can build deployable products using vibe coding (AI pair-programming), no-code automation tools (n8n, Zapier, Make), and AI app builders (v0, Bolt.new, Lovable). ONROL's Generalist track teaches all of these.",
      },
      {
        q: "Is AI useful for non-technical people?",
        a: "Extremely. The biggest economic returns from AI right now go to non-technical people who use AI to multiply their work — sales pros, marketers, HR professionals, operations leads, business owners, content creators, freelancers.",
      },
      {
        q: "What is a practical AI course?",
        a: "A practical AI course measures success by what you ship — live deploy URLs, working automations, real income. Theory is taught only when it directly enables a build. ONROL is the prototype of this format in India.",
      },
      {
        q: "Is AI tools training better than AI theory?",
        a: "For most learners, yes. Theory is essential if you want to build foundation models. Tools are essential if you want to use AI in real life. Most economic value is captured by tool users, not model builders.",
      },
      {
        q: "Which AI course gives projects?",
        a: "ONROL is built around projects. Every learner ships three live, deployable AI projects in 3 months. Many other Indian programs claim to include projects but in practice deliver theory + small assignments. Always ask for past learner deploy URLs before paying.",
      },
      {
        q: "How long does it take to learn AI?",
        a: "To start using AI productively: 3 months (ONROL Generalist). To build production AI systems: 4–8 weeks (ONROL Architect). To do AI research: 2–4 years (PhD). Don't conflate the three.",
      },
      {
        q: "Is ONROL good for practical AI learning?",
        a: "ONROL is specifically built for practical AI learning. It's the only Indian program we know of where every learner publicly ships three live projects in 3 months, with active practitioner mentors and a year-long community.",
      },
      {
        q: "What if I want both — theory and practice?",
        a: "Start with applied (ONROL or similar). Once you're shipping, you'll know which theory matters. Then add courses, books, or papers on the specific topics you've encountered. Bottom-up beats top-down for most learners.",
      },
    ],
    accent: "orange",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 3. Academic AI vs Applied AI (renamed from /iit-ai-course-vs-onrol — avoids trademark risk)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "academic-ai-vs-applied-ai",
    title: "Academic AI vs Applied AI — Which Path Fits You? | ONROL India",
    metaDescription:
      "Academic AI vs applied AI: a respectful side-by-side. Pick by your goal — research career or building AI products fast.",
    eyebrow: "— The two paths",
    h1: "Academic AI vs Applied AI",
    hook: "Both paths are valuable. They serve different goals and different lives.",
    intro:
      "If you've spent any time researching AI courses in India, you've probably hit the academic-vs-bootcamp question. The honest answer: both paths are legitimate and produce great outcomes — for different goals. Academic AI (top universities) leads in research, model architecture, and ML engineering for Tier-1 labs. Applied AI (ONROL, hands-on bootcamps) leads in tooling, automation, deployment, and shipping AI products in the real economy. Pick by the outcome you want, not by brand prestige.",
    sections: [
      {
        heading: "Side-by-side comparison",
        bullets: [
          "Focus: academic AI = research + theory; applied AI = tools + deployment",
          "Output: academic = papers, degrees, ML engineer roles; applied = live projects, automations, income",
          "Time: academic = 2–4 years; applied = 3 months to weeks",
          "Prerequisites: academic = strong math + CS; applied = none",
          "Cost: academic = lakhs to crores; applied = thousands to a couple of lakhs",
          "Best for: academic = future researchers; applied = career-switchers, freelancers, founders, professionals",
        ],
      },
      {
        heading: "When to choose academic AI",
        body: "If your goal is to be a research scientist, ML engineer at OpenAI/Anthropic/DeepMind, university faculty, or you want institutional credentialling — pick academic AI. The math, theory, and depth matter. Top academic universities lead this path globally.",
      },
      {
        heading: "When to choose applied AI",
        body: "If your goal is to use AI in your job, freelance, run a business, build a side income, grow your audience as a creator, or just stop being intimidated by AI tools — pick applied AI. The math doesn't matter. The shipping does. ONROL is built for this exact path.",
      },
      {
        heading: "Common myths to drop",
        bullets: [
          "Myth: 'a top-university degree is always better.' Reality: best for research; not always best for income or shipping",
          "Myth: 'Bootcamps are scams.' Reality: most are; the few that aren't measure success by shipped projects",
          "Myth: 'You need to know Python before learning AI.' Reality: vibe coding closes this gap fast",
          "Myth: 'AI will be obsolete in a year.' Reality: tools change; the skill of execution doesn't",
        ],
      },
    ],
    faqs: [
      {
        q: "Is a top-tier academic university the best place to learn AI?",
        a: "For research and ML engineering — yes, top academic universities lead. For applied AI (using tools, building products, automating work, freelancing) — no, applied programs like ONROL are built specifically for that outcome.",
      },
      {
        q: "Do I need a top-tier university degree to work in AI?",
        a: "No. Many of the people building real AI products in India today don't come from top-tier universities or even CS backgrounds. What matters in applied AI is your portfolio of shipped projects, not your degree. ONROL is designed to give you exactly that portfolio.",
      },
      {
        q: "Is academic AI useless for normal jobs?",
        a: "Not useless — but oversized for most jobs. If you're not going into research or model engineering, the deep theory you learn in an academic program won't be your daily tool. You'll need applied skills (tools, prompting, automation) that academic programs don't focus on.",
      },
      {
        q: "Can I do applied AI now and academic AI later?",
        a: "Yes — and many people do. Start applied, ship some projects, see which theoretical topics actually constrain you, then study them. This bottom-up approach is far more efficient than the reverse.",
      },
      {
        q: "Is applied AI as respected as academic AI?",
        a: "In hiring and freelance markets — increasingly yes, especially in startups, SMBs, and creator businesses. Hiring managers care about shipped work. In research labs and academia — academic credentials still dominate, fairly.",
      },
      {
        q: "How is ONROL different from academic AI programs at top universities?",
        a: "Different goals. Top academic universities teach AI as a science — depth, math, research. ONROL teaches AI as a tool — speed, deployment, income. Both are valuable. ONROL focuses on the second mission so it can serve learners who don't want or need the academic path.",
      },
      {
        q: "Is practical AI useful for jobs?",
        a: "Very. Applied AI skills (prompt engineering, automation, vibe coding, AI tool fluency) are the fastest-growing job-market skills in India in 2026. Most listings now require AI tool literacy regardless of role.",
      },
      {
        q: "Should I do an MBA in AI?",
        a: "An MBA in AI is mostly management theory + light AI overview. It rarely teaches you to ship anything. If you want to lead AI at a company, an MBA + applied AI training (like ONROL) is more useful than an MBA alone.",
      },
      {
        q: "Can students from non-elite universities learn AI well?",
        a: "Absolutely. The applied AI path requires no specific institution — only consistent shipping. ONROL is open to all backgrounds.",
      },
      {
        q: "Which AI path is best for practical work?",
        a: "Applied AI. Period. ONROL is built for this — 3 months, 3 live projects, mentor support, India-tuned curriculum.",
      },
    ],
    accent: "violet",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 4. AI Course for Beginners
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "ai-course-for-beginners",
    title: "AI Course for Beginners (No Coding Required) | ONROL India",
    metaDescription:
      "Best AI course for beginners in India. No coding required. Ship 3 live AI projects in 3 months. ONROL's beginner-friendly bootcamp built for absolute first-timers.",
    eyebrow: "— Beginner-friendly",
    h1: "AI course for absolute beginners",
    hook: "Zero prior coding, math, or AI background. 3 months. Three live projects.",
    intro:
      "If you've never opened a coding editor, never built a website, and feel intimidated by every AI tutorial — this page is for you. ONROL's beginner track was built specifically for absolute first-timers. By the end of 3 months, you'll have shipped three real, deployable AI products: a backend automation, a website on a live URL, and a personal AI assistant trained on your own data. No coding. No math. No prerequisites.",
    stats: [
      { value: "0", label: "Coding required" },
      { value: "5d", label: "First deploy" },
      { value: "3", label: "Live projects" },
    ],
    sections: [
      {
        heading: "What 'no coding' really means",
        body: "Vibe coding is the new way to build software. You describe what you want in plain English, AI writes the code, and you deploy. ONROL teaches you the prompts, patterns, and tools that make this work reliably. By the end of week one you'll be shipping things that took mid-level developers months in 2023.",
      },
      {
        heading: "The 3-month journey",
        bullets: [
          "Day 1: AI fundamentals + prompt mastery (Claude, ChatGPT, Gemini, Perplexity)",
          "Day 2: Personal AI assistant — fine-tune on your own docs, voice, brand",
          "Day 3: Vibe coding — build a live website using AI as your pair-programmer",
          "Day 4: Automation — wire workflows that run while you sleep (n8n / Zapier / Make)",
          "Capstone: Ship + community — present your three projects, join ONROL Community",
        ],
      },
      {
        heading: "What you'll have on day 6",
        bullets: [
          "A live URL hosting your own AI-built website",
          "A personal AI assistant accessible from your phone",
          "An automation that handles a real task in your life",
          "Year-long access to the ONROL Community",
          "Lifetime access to tools.onrol.in (19+ AI tools)",
          "A portfolio you can show in interviews, freelance pitches, or LinkedIn posts",
        ],
      },
      {
        heading: "Common beginner fears (all wrong)",
        bullets: [
          "'I'm not technical.' — Vibe coding makes the technical part the AI's job, not yours",
          "'I'm too old.' — ONROL's oldest learner is 58 and shipped",
          "'I don't have 2 hours a day.' — Sessions are evenings IST; recordings if you miss",
          "'I don't know what to build.' — Day 1 includes a project-picker session",
          "'I'll forget everything by week 2.' — ONROL Community is built for ongoing builds, not just one cohort",
        ],
      },
    ],
    faqs: [
      {
        q: "Is ONROL built for absolute beginners across every persona?",
        a: "Yes — ONROL is built persona-first across 12 personas (engineers, students, teachers, founders, sales/marketing, real-estate, working professionals, freelancers, content creators, SMB owners, women returning to work, job-seekers). Pick yours at /personas/. No coding background required for any track.",
      },
      {
        q: "Can I learn AI as a complete beginner?",
        a: "Yes — and 2026 is the easiest year ever to do it. Tools like Claude, ChatGPT, vibe coding, and no-code automation have erased the entry barrier. ONROL's Generalist track is built specifically for first-timers.",
      },
      {
        q: "Do I need to know Python?",
        a: "No. Vibe coding lets you ship apps without writing code yourself — you describe what you want, AI writes it, you review and deploy. We teach you the patterns that make this reliable.",
      },
      {
        q: "Is 3 months really enough?",
        a: "Enough to ship your first three projects, yes. Enough to be a senior AI engineer, no. ONROL Generalist is the on-ramp; ONROL Community + AI Architect extend the journey.",
      },
      {
        q: "What if I fall behind during the 3 months?",
        a: "All sessions are recorded. Mentors are available in Slack/WhatsApp groups. The cohort moves together — you won't be alone if a project takes you longer.",
      },
      {
        q: "Will I struggle if I'm not from a tech background?",
        a: "We've trained doctors, teachers, freelance writers, sales reps, and small-business owners to ship AI projects in 3 months. Non-tech background is the norm in ONROL cohorts, not the exception.",
      },
      {
        q: "What laptop do I need?",
        a: "Anything from the last 5 years that runs Chrome and a code editor. No GPU needed. We use cloud-based AI tools (Claude, Cloudflare Workers, etc.) so heavy lifting happens off your machine.",
      },
      {
        q: "Is this in English or Hindi?",
        a: "Sessions are in English with Hindi-friendly mentors available for 1:1 help. Most ONROL learners are bilingual; we accommodate either.",
      },
      {
        q: "Can I retake the cohort if I don't finish?",
        a: "Yes — all ONROL graduates can sit in on future cohorts at no cost. ONROL Community gives you ongoing builds even between cohorts.",
      },
      {
        q: "What happens after 3 months?",
        a: "You join ONROL Community (year-long included), keep access to all 19+ tools.onrol.in tools, and can opt into the AI Architect advanced track when ready.",
      },
      {
        q: "Is there a money-back guarantee?",
        a: "ONROL offers a satisfaction policy — if you complete the 3 months, do the work, and don't ship three projects, we work with you 1:1 until you do. Concrete details on the program page.",
      },
    ],
    accent: "emerald",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 5. AI Course for Students
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "ai-course-for-students",
    title: "AI Course for Students in India — Build a Portfolio in 3 Months | ONROL",
    metaDescription:
      "AI course for college and school students. Ship 3 live AI projects in 3 months that make placement and internship applications stand out. Built for the Indian student market.",
    eyebrow: "— For students",
    h1: "AI course for students",
    hook: "The fastest way to a portfolio that beats your CGPA.",
    intro:
      "Indian students today face a brutal job market where everyone has the same coursework. The only thing that separates one resume from 200 others is a portfolio of real, shipped projects. ONROL's AI course for students is built specifically to give you that portfolio — three live AI projects, deployed under your name, in 3 months, that you can paste into placements, internships, and LinkedIn.",
    sections: [
      {
        heading: "Why students should learn applied AI now",
        bullets: [
          "Internships and placements increasingly screen for AI tool fluency",
          "AI-built side projects beat any 'club' or 'fest' on a resume",
          "Most college AI courses are 1–2 years behind the actual industry",
          "Income potential — students start freelancing AI services within weeks",
          "Compounding skill — every month you delay, the deployment edge widens",
        ],
      },
      {
        heading: "What you'll ship",
        bullets: [
          "Live website built with AI (link goes on your resume + LinkedIn)",
          "Backend automation handling a real workflow — describe in interviews",
          "Personal AI assistant — show in 30 seconds at any networking event",
        ],
      },
      {
        heading: "How students use ONROL projects in practice",
        bullets: [
          "Add deploy URLs to resume — instant differentiation",
          "Walk through the build in interviews — beats any rehearsed answer",
          "Land internships at AI-first startups based on the portfolio alone",
          "Start freelancing for SMBs to fund college — 5–25k/month is realistic",
          "Lead the AI module of any final-year project / hackathon team",
        ],
      },
    ],
    faqs: [
      {
        q: "Is there a dedicated persona track at ONROL for students?",
        a: "Yes — students have a dedicated track in ONROL's persona-first cohort. See the full breakdown at /personas/students/ — exact AI use-cases for your industry, project deliverables, and INR earnings paths.",
      },
      {
        q: "Which AI course is best for students in India?",
        a: "ONROL's Generalist track is built for the Indian student market. Indian-tuned pricing, India-local case studies, and a portfolio output that fits placement and internship applications. Most importantly: every learner walks out with three live deploy URLs.",
      },
      {
        q: "Can I learn AI in college?",
        a: "Yes — and you should start as early as possible. The earlier you ship your first AI project, the bigger your portfolio is by graduation. ONROL's 3-month format fits even into a single week of holidays.",
      },
      {
        q: "Will AI replace fresh graduates?",
        a: "AI replaces tasks, not people. Graduates who use AI well will replace graduates who don't. ONROL exists to put you in the first group.",
      },
      {
        q: "Can students earn using AI?",
        a: "Yes. ONROL graduates regularly start earning ₹5k–₹25k/month within 2–3 weeks of completing the program by selling AI automation, content, or web services. Some scale beyond that during college itself.",
      },
      {
        q: "What AI skills should college students learn?",
        a: "Tier 1: prompt engineering, vibe coding, no-code automation. Tier 2: RAG basics, fine-tuning intro, AI agents. Tier 3 (only if you'll go into research): math, model architecture. ONROL covers Tiers 1 + 2 in 3 months.",
      },
      {
        q: "Can school students (10th, 12th) learn?",
        a: "Yes. ONROL's curriculum doesn't assume any college-level math. Motivated 10th and 12th students complete cohorts regularly.",
      },
      {
        q: "Is AI useful for placements?",
        a: "Increasingly mandatory. Most placement screens in 2026 include AI tool literacy questions. A portfolio of shipped projects > any answer you can rehearse.",
      },
      {
        q: "Will my college recognise this?",
        a: "ONROL provides a verifiable certificate. Some colleges accept it for credit; most don't formally — but recruiters absolutely do. Always optimise for what hiring managers value, not what colleges accept.",
      },
      {
        q: "Can I do this alongside my degree?",
        a: "Yes. Cohorts are intensive but designed to fit alongside college. Sessions are evenings IST; project work is 1–2 hours/day.",
      },
      {
        q: "Is there a student discount?",
        a: "Yes. ONROL offers significant student pricing — verify your college email during signup. Details on the Programs page.",
      },
    ],
    accent: "blue",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 6. AI Course for Working Professionals
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "ai-course-for-working-professionals",
    title: "AI Course for Working Professionals — Automate Your Job | ONROL India",
    metaDescription:
      "AI course for working professionals in India. Automate parts of your job, transition into AI-adjacent roles. 3-month intensive, evening sessions, fits around full-time work.",
    eyebrow: "— Working professionals",
    h1: "AI for working professionals",
    hook: "Automate parts of your job. Stay employable. Earn on the side.",
    intro:
      "If you're already employed full-time, you don't need a 6-month AI degree. You need three things: AI tool fluency that makes your current job easier, a portfolio that proves you can ship, and a side-income path in case the market shifts. ONROL's working-professional track delivers all three in 3 months, with evening sessions that fit around your day job.",
    sections: [
      {
        heading: "What working professionals get from ONROL",
        bullets: [
          "Automate the repetitive 30% of your current job — earn back hours every week",
          "Build a portfolio that opens AI-adjacent roles even without changing companies",
          "Side-income path — sell AI services to SMBs in your network",
          "Future-proof your career — AI literacy is the new Excel literacy",
          "Mentor network — connect with practitioners outside your current bubble",
        ],
      },
      {
        heading: "Role-specific applications",
        bullets: [
          "Sales: AI-powered prospecting, follow-up sequences, CRM hygiene",
          "Marketing: content systems, social schedulers, ad-creative generators",
          "HR: candidate screening, interview-prep automation, onboarding flows",
          "Operations: workflow automation, vendor management, reporting dashboards",
          "Finance: data extraction, reporting, forecasting assistants",
          "Product: customer-research synthesis, prompt-driven prototyping",
        ],
      },
      {
        heading: "Why now (not later)",
        body: "Every quarter you delay, the deployment gap between AI-fluent and AI-illiterate professionals widens. By 2027, AI tool fluency will be assumed in most knowledge-worker roles — like email or Excel. Getting fluent in 2026 puts you ahead. Getting fluent in 2028 makes you average.",
      },
    ],
    faqs: [
      {
        q: "Is there a dedicated persona track at ONROL for working professionals?",
        a: "Yes — working professionals have a dedicated track in ONROL's persona-first cohort. See the full breakdown at /personas/working-professionals/ — exact AI use-cases for your industry, project deliverables, and INR earnings paths.",
      },
      {
        q: "Which AI course is best for working professionals in India?",
        a: "ONROL's Generalist track is the most practical option — 3 months, evening sessions, project-based, India-tuned. Most other options are either too theoretical (university programs) or too vague (YouTube playlists).",
      },
      {
        q: "How can employees use AI at work?",
        a: "Three layers: (1) personal productivity — drafting, summarising, research; (2) workflow automation — wire AI into existing tools (Slack, Notion, CRM); (3) team-level deployment — build small AI tools that your team uses daily. ONROL teaches all three.",
      },
      {
        q: "Will AI take my job?",
        a: "Not your job — your tasks. People who automate their tasks faster than the company replaces them stay. People who don't, get squeezed. ONROL is built to put you in the first group.",
      },
      {
        q: "Can I learn AI without quitting my job?",
        a: "Yes — that's exactly the design. ONROL's 3-month intensive runs in the evenings IST. Total time commitment is around 15–20 hours over a week.",
      },
      {
        q: "Is AI useful for sales professionals?",
        a: "Massively. AI prospecting, email sequence generation, CRM data hygiene, deal-stage analysis, call-summary automation — all 10–30x faster with AI. ONROL has sales-specific case studies in every cohort.",
      },
      {
        q: "Is AI useful for HR professionals?",
        a: "Yes. CV screening (with bias-control prompts), interview-prep generation, onboarding-flow automation, policy-document drafting, internal-comms automation. HR is one of the fastest-AI-adopting functions in 2026.",
      },
      {
        q: "Is AI useful for marketing professionals?",
        a: "It's already table stakes. Content systems, social schedulers, ad-creative generators, audience analysis, A/B prompts. ONROL's tools.onrol.in suite includes 19+ tools specifically for marketing teams.",
      },
      {
        q: "How do I tell my manager about ONROL?",
        a: "Frame it as productivity training, not 'AI bootcamp.' Show the projected hours-saved. Many companies reimburse upskilling — ask. ONROL provides a corporate-friendly invoice on request.",
      },
      {
        q: "Can ONROL help me transition to an AI role?",
        a: "Yes — many ONROL graduates use the portfolio + ONROL Community connections to transition into AI-adjacent roles within 3–6 months. ONROL doesn't promise placement, but it gives you the artefacts you need to land them yourself.",
      },
      {
        q: "What about senior professionals (10+ yrs)?",
        a: "Senior professionals often benefit most. You bring domain expertise; AI is the multiplier. ONROL's project format (your domain + AI tools) is exactly right for senior career-stage learners.",
      },
    ],
    accent: "amber",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 7. AI Course for Freelancers
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "ai-course-for-freelancers",
    title: "AI Course for Freelancers — Sell AI Services in 3 Months | ONROL India",
    metaDescription:
      "AI course for freelancers in India. Learn AI automation, content automation, agents, and web-build services to sell. Land paying clients within weeks of finishing ONROL.",
    eyebrow: "— Freelancers",
    h1: "AI for freelancers",
    hook: "Three new revenue streams. Built in 3 months. Sold in 30.",
    intro:
      "Freelancing in 2026 is split into two markets: people who deliver work the slow way and people who deliver 5x faster using AI. The second market commands 2–3x the rate, has zero competition from low-cost overseas freelancers, and grows month-over-month. ONROL's freelancer track teaches you the three highest-margin AI service offerings — automation, content systems, and AI agents — and gives you the portfolio to sell them by week one.",
    sections: [
      {
        heading: "The three AI freelancing service offerings",
        bullets: [
          "AI automation: build n8n / Zapier / Make workflows for SMB clients (₹15k–₹50k/project)",
          "AI content systems: scripts, carousels, captions, scheduling for creators (₹10k–₹30k/month retainer)",
          "AI agents + custom chatbots: customer support, lead qualification, FAQ bots (₹25k–₹1L/project)",
        ],
      },
      {
        heading: "How to land your first AI client (the ONROL playbook)",
        bullets: [
          "Build the three portfolio projects during ONROL — these become your sales demos",
          "Identify 20 SMBs in your existing network with a clear pain point",
          "Send a 1-line audit + 1-line offer ('I'd save 8 hrs/week of X for ₹Y')",
          "First client almost always comes from your existing network within 2 weeks",
          "Scale via referrals once first client is happy — ONROL grads regularly hit 5+ retainers in 6 months",
        ],
      },
      {
        heading: "Why freelancers should choose ONROL specifically",
        bullets: [
          "Portfolio = three real shipped projects you can show prospects",
          "Year-long ONROL Community = peer-referrals + ongoing skill compounding",
          "Lifetime access to tools.onrol.in = your delivery toolkit at zero cost",
          "Mentors are active practitioners actually selling AI services themselves",
          "Indian-market-tuned pricing playbooks (not US bootcamp pricing fantasy)",
        ],
      },
    ],
    faqs: [
      {
        q: "Is there a dedicated persona track at ONROL for freelancers?",
        a: "Yes — freelancers have a dedicated track in ONROL's persona-first cohort. See the full breakdown at /personas/freelancers/ — exact AI use-cases for your industry, project deliverables, and INR earnings paths.",
      },
      {
        q: "How can freelancers use AI?",
        a: "Sell AI services (automation, content systems, agents), use AI to deliver client work 5x faster, and use AI to find/qualify leads. The first group commands 2–3x rates. ONROL teaches all three layers.",
      },
      {
        q: "Can I really earn money using AI?",
        a: "Yes. ONROL graduate freelancers regularly land their first paying client in 2–4 weeks and reach ₹50k–₹2L/month within 6 months. Concrete numbers depend on niche, network, and effort.",
      },
      {
        q: "What AI services can freelancers sell?",
        a: "Top categories: (1) AI automation for SMBs, (2) AI content systems for creators/brands, (3) AI agents and chatbots, (4) AI-augmented web/app builds, (5) AI training and consulting for non-tech founders.",
      },
      {
        q: "How do I start AI freelancing if I have no clients?",
        a: "Mine your existing network. Most ONROL grads' first paying client comes from a friend, a former colleague, or a small business they personally know. Stop trying to outbid Pakistani freelancers on Upwork — sell warmly to your network instead.",
      },
      {
        q: "Is AI automation a good freelance service?",
        a: "Among the best — high margin, sticky retainer revenue, low competition (most freelancers don't know it yet). ONROL's automation module is specifically built around freelance-marketable use-cases.",
      },
      {
        q: "What portfolio should an AI freelancer build?",
        a: "Three pieces, in this order: (1) one automation case study with hours-saved math, (2) one content system with before/after engagement numbers, (3) one custom AI agent with a real use case. ONROL's three-project format produces exactly this.",
      },
      {
        q: "How do AI freelancers price?",
        a: "Two models: (1) project-based — ₹15k–₹1L per AI workflow / agent / system; (2) retainer-based — ₹10k–₹50k/month for ongoing AI ops. Always price on outcome (hours-saved, ₹-earned), not hours-worked.",
      },
      {
        q: "Can AI replace me as a freelancer?",
        a: "Generic freelancers — yes, increasingly. AI-augmented freelancers — no. The market is splitting, and ONROL exists to put you in the surviving group.",
      },
      {
        q: "Is ONROL useful for full-time vs side-income freelancing?",
        a: "Both. Many ONROL grads start as side-income (₹10–30k/month while employed), then transition to full-time once revenue is stable.",
      },
      {
        q: "Will I get clients automatically after ONROL?",
        a: "No — that's not honest. ONROL gives you the skills, portfolio, and pricing playbook. You still have to message people, pitch, and deliver. ONROL Community helps with referrals and accountability.",
      },
    ],
    accent: "rose",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 8. AI Course for Business Owners
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "ai-course-for-business-owners",
    title: "AI Course for Business Owners — Automate Your SMB | ONROL India",
    metaDescription:
      "AI course for business owners. Automate sales, leads, customer support, content, ops. Built for Indian SMBs by India's AI Execution School.",
    eyebrow: "— Business owners",
    h1: "AI for business owners",
    hook: "Automate the boring 60%. Reclaim your week.",
    intro:
      "Most Indian SMBs are leaving 10–20 hours of weekly busywork on the table that AI could automate today, end-to-end. Lead capture, follow-up sequences, customer support FAQs, content creation, reporting — all eliminate-able. ONROL's business-owner track teaches you to deploy AI across your operation in 3 months, without a tech team, without an agency, and without paying ₹10L for an enterprise SaaS.",
    sections: [
      {
        heading: "Where AI saves the most time in an Indian SMB",
        bullets: [
          "Lead capture + qualification — AI agents on WhatsApp/website handle 80%",
          "Follow-up sequences — AI writes the right message at the right time per lead stage",
          "Customer support — RAG over your FAQs answers 70% of tickets without human time",
          "Content marketing — IG posts, blogs, newsletters, scripts — all systemised",
          "Reporting + analytics — AI dashboards summarise your data daily",
          "HR + ops — onboarding, policies, performance reviews, vendor mgmt",
        ],
      },
      {
        heading: "What you'll have at the end",
        bullets: [
          "An AI lead-qualifier deployed on your WhatsApp / website",
          "Automated follow-up sequence saving you 5–10 hrs/week",
          "AI content system producing your IG / LinkedIn / blog content",
          "Internal AI assistant trained on your business docs (SOPs, pricing, FAQs)",
          "A roadmap for which 5 more AI deployments to do next",
        ],
      },
      {
        heading: "Why ONROL beats hiring an AI agency",
        bullets: [
          "Cost: ONROL = ₹X. AI agency for the same scope = ₹2L–₹10L+",
          "Speed: ONROL ships in 3 months. Agencies take 8–16 weeks",
          "Ownership: you own the systems and can modify them. Agencies lock you in",
          "Knowledge transfer: you learn to extend the systems yourself, forever",
          "ONROL community: ongoing peer business-owner network for accountability",
        ],
      },
    ],
    faqs: [
      {
        q: "Is there a dedicated persona track at ONROL for small business owners?",
        a: "Yes — small business owners have a dedicated track in ONROL's persona-first cohort. See the full breakdown at /personas/smb-owners/ — exact AI use-cases for your industry, project deliverables, and INR earnings paths.",
      },
      {
        q: "How can small businesses use AI?",
        a: "Three layers: (1) front-of-house — AI lead qualifiers, customer support bots, IG/WhatsApp automation; (2) back-of-house — workflow automation, reporting, vendor mgmt; (3) strategic — market research, competitive analysis, pricing intelligence. ONROL teaches the first two layers in 3 months.",
      },
      {
        q: "Which AI tools are useful for business owners?",
        a: "Claude or ChatGPT for thinking; n8n or Zapier for workflow automation; Notion AI for internal docs; HeyGen / ElevenLabs for video/audio; Cursor for vibe coding. ONROL teaches the specific stack we deploy in our own businesses.",
      },
      {
        q: "Can AI automate my business completely?",
        a: "No, and that's not the goal. The goal is to remove 60% of repetitive work so you focus on the 40% that actually grows the business. ONROL helps you identify which 60% to start with.",
      },
      {
        q: "Can AI help in sales?",
        a: "Hugely. AI prospecting, qualified-lead routing, follow-up sequence writing, deal-stage analysis, demo summary automation. Small Indian businesses see 30–60% productivity lift in their sales function within 60 days of ONROL deployment.",
      },
      {
        q: "Can AI help in lead generation?",
        a: "Yes. AI agents on your IG DMs, WhatsApp, website chat, and form-fills can capture and qualify leads 24/7 with 80% accuracy. ONROL teaches both the agent setup and the prompt engineering.",
      },
      {
        q: "Can AI help in customer support?",
        a: "Yes — typically 60–80% of repeat support questions answer themselves with a RAG bot trained on your FAQs. ONROL's AI Architect track has a full module on this. The Generalist version covers the basics in day 4.",
      },
      {
        q: "Can AI help in content marketing?",
        a: "ONROL operates a 19-tool SaaS suite at tools.onrol.in built specifically for SMB content marketing — viral content radar, IG caption generator, carousel builder, reel maker, social scheduler. All free during beta.",
      },
      {
        q: "What is AI business automation?",
        a: "AI business automation is when AI handles end-to-end workflows that previously required a human — lead capture to follow-up to handover, support ticket to resolution, content brief to publish. ONROL teaches you to build these.",
      },
      {
        q: "Can business owners learn AI without coding?",
        a: "Yes — emphatically. Most ONROL business-owner cohort members are non-coders. Vibe coding + no-code automation handle everything you'll need.",
      },
      {
        q: "Is ONROL useful for business owners?",
        a: "Especially useful. The ROI math is straightforward — most graduates save more in monthly hours than the program cost within 3 months of completion.",
      },
    ],
    accent: "amber",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 9. AI Course for Content Creators
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "ai-course-for-content-creators",
    title: "AI Course for Content Creators — Grow IG, YouTube, LinkedIn with AI | ONROL",
    metaDescription:
      "AI course for content creators in India. Use AI for scripts, hooks, carousels, reels, captions, scheduling. Scale Instagram, YouTube, LinkedIn with ONROL's creator-tuned curriculum.",
    eyebrow: "— Content creators",
    h1: "AI for creators",
    hook: "10x your output. Without losing your voice.",
    intro:
      "Creators in 2026 are competing with people who post 3x more content using AI. Output is the new battleground. But generic AI content kills your voice — algorithms and audiences both punish it. ONROL's creator track teaches you how to use AI for speed without losing the authentic voice that grew your audience in the first place. You'll leave with a content system that's 10x faster than your current workflow and still feels like you.",
    sections: [
      {
        heading: "What ONROL graduates ship in the creator track",
        bullets: [
          "A weekly content system that produces 5–7 IG posts + 1 reel + 1 LinkedIn carousel",
          "Brand-voice fingerprint locked into AI — every output sounds like you, not GPT",
          "Caption + hashtag generators tuned to your specific niche",
          "Video script systems (hook → body → CTA) for reels and YouTube Shorts",
          "Auto-scheduling pipeline so content publishes while you focus on growth",
        ],
      },
      {
        heading: "ONROL's tools.onrol.in suite for creators",
        bullets: [
          "Trendline — viral content radar (watch 50 channels, surface tomorrow's viral topics)",
          "Hookline — IG caption + hashtag generator",
          "Slidewave — AI carousel generator",
          "Reelcraft — script → animated reel video",
          "Skedly — IG + YouTube social scheduler",
          "Thumbline — YouTube + IG thumbnail generator with click-score",
          "Postpilot — social-media writer for 9 platforms",
          "Voca — text-to-voice generator",
          "All free during beta + lifetime access for ONROL grads",
        ],
      },
      {
        heading: "The voice problem (and how ONROL solves it)",
        body: "Most AI content fails because it sounds like AI. Generic, hedged, vibes-not-substance. ONROL teaches you to extract your authentic voice — your sentence patterns, vocabulary, contrarian takes, recurring themes — and lock that into the prompt layer. Every output then comes out sounding like a polished version of you, not a polished version of nobody.",
      },
    ],
    faqs: [
      {
        q: "Is there a dedicated persona track at ONROL for content creators?",
        a: "Yes — content creators have a dedicated track in ONROL's persona-first cohort. See the full breakdown at /personas/content-creators/ — exact AI use-cases for your industry, project deliverables, and INR earnings paths.",
      },
      {
        q: "How can creators use AI?",
        a: "AI takes over the parts of creator work that drain energy without driving growth: drafting, scripting, captions, hashtags, scheduling, thumbnail generation, repurposing. You focus on what only you can do: ideas, voice, on-camera presence.",
      },
      {
        q: "Can AI help grow Instagram?",
        a: "Yes — AI is now the multiplier between mid-tier creators and top-tier creators in India. ONROL graduates regularly grow IG accounts 2–5x in 90 days post-program by deploying the content system they build during the cohort.",
      },
      {
        q: "Can AI help grow YouTube?",
        a: "Yes. AI-generated viral hooks, tighter scripts, faster reel/short production, AI thumbnails with click-score prediction. ONROL's tools.onrol.in suite includes Reelcraft, Thumbline, and Trendline specifically for YouTube.",
      },
      {
        q: "Can AI help grow LinkedIn?",
        a: "Yes — LinkedIn rewards consistent posting + structured carousels, both of which are AI's superpowers. ONROL's Slidewave produces LinkedIn-optimised carousels in seconds.",
      },
      {
        q: "Which AI tools are useful for reels?",
        a: "ONROL's Reelcraft (script → animated MP4 with kinetic captions, AI hero images, music). For raw video editing: CapCut + AI captioning (also handled by ONROL's Subly tool). For voice-over: Voca or ElevenLabs.",
      },
      {
        q: "Will AI content sound like me?",
        a: "Only if you train it right. ONROL teaches the brand-voice fingerprint method — extract your real writing patterns and lock them into prompts. Done well, AI outputs become indistinguishable from your own writing (just faster).",
      },
      {
        q: "Won't audiences reject AI content?",
        a: "Audiences reject lazy generic content — whether AI-made or human-made. Audiences reward sharp, specific, voice-driven content — whether AI-made or human-made. The category that matters is quality, not provenance.",
      },
      {
        q: "Will Instagram penalise AI content?",
        a: "Only the obvious low-quality kind. AI-assisted writing, AI captions, AI editing — all standard practice in 2026 across top creators. The platforms care about engagement, not how the content was made.",
      },
      {
        q: "Can AI write scripts?",
        a: "Excellent at first drafts. The 80/20 workflow: AI writes the draft, you cut and add the human moments. Saves 60–80% of the writing time. ONROL teaches the exact prompt template we use in our own content business.",
      },
      {
        q: "Is ONROL useful for creators?",
        a: "Specifically built for them. Many ONROL graduate creators report doubled output and 2–5x audience growth within 90 days of finishing.",
      },
    ],
    accent: "pink",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 10. AI Automation Course
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "ai-automation-course",
    title: "AI Automation Course India — n8n, Zapier & AI Agents | ONROL",
    metaDescription:
      "AI automation course in India, live online. Build n8n, Zapier & Make workflows and AI agents you can ship for your job, business or clients. No coding — join the cohort.",
    eyebrow: "— AI automation",
    h1: "AI automation course",
    hook: "Workflows that run while you sleep — across email, CRM, ops, content, support.",
    intro:
      "AI automation is the highest-leverage skill in 2026. Once you learn it, you start seeing automation opportunities everywhere — your inbox, your client work, your business ops, your content workflow. ONROL's AI Automation course teaches you n8n, Zapier, Make, and the AI-agent layer — exactly the stack used by Indian freelancers and SMBs to charge ₹15k–₹1L per workflow build. Beginner-friendly, no-code first.",
    sections: [
      {
        heading: "What you'll automate by the end of the program",
        bullets: [
          "An email triage + reply-draft system across your inbox",
          "A CRM hygiene + follow-up sequence runner",
          "An IG/WhatsApp lead-capture + qualification agent",
          "A content publishing pipeline (draft → schedule → publish across 4 platforms)",
          "A reporting dashboard that summarises your data daily",
        ],
      },
      {
        heading: "The automation stack ONROL teaches",
        bullets: [
          "n8n — the open-source workflow engine (free, self-hostable, recommended primary)",
          "Zapier — fastest to wire, best for non-technical owners (paid, premium polish)",
          "Make.com — visual builder, often cheaper than Zapier at scale",
          "Claude / ChatGPT API — the AI brain inside every workflow",
          "Webhooks + APIs — connect anything to anything",
        ],
      },
      {
        heading: "Three ways to monetise this skill",
        bullets: [
          "Sell as a freelance service: ₹15k–₹1L per workflow build, often with retainer extension",
          "Deploy in your job: automate 30% of your tasks, become indispensable",
          "Use in your own business: cut SaaS subscriptions, scale ops without hiring",
        ],
      },
    ],
    faqs: [
      {
        q: "What is AI automation?",
        a: "AI automation is when you wire AI models into workflows so they handle multi-step tasks autonomously — read an email, decide if it's important, draft a reply, schedule a follow-up. The 'automation' part runs the steps; the 'AI' part makes the decisions.",
      },
      {
        q: "How do I learn AI automation?",
        a: "Best path: hands-on, project-based, tied to a real outcome you care about. ONROL's automation module starts you with one workflow that solves a problem in your actual life on day 1, then expands from there.",
      },
      {
        q: "What is no-code AI automation?",
        a: "Building AI automations using visual tools like n8n, Zapier, or Make.com — no programming required. ONROL's Generalist track is entirely no-code.",
      },
      {
        q: "What is n8n and is it worth learning?",
        a: "n8n is the open-source automation workflow engine — free, self-hostable, with deeper AI-node support than Zapier. It's the freelancer-and-developer favourite for AI workflows in 2026. ONROL teaches n8n as the primary tool.",
      },
      {
        q: "Can beginners learn automation?",
        a: "Yes. n8n's visual builder + ONROL's project-first curriculum makes it accessible to absolute beginners. Most cohort members ship their first automation within 4 hours.",
      },
      {
        q: "Can AI workflows save real time?",
        a: "Often 5–20 hours/week per deployment. The bigger the manual task you replace, the bigger the savings. ONROL teaches you how to identify the highest-ROI automations to build first.",
      },
      {
        q: "Can businesses use AI automation?",
        a: "Most can save more in monthly time than the program cost within 3 months. Lead capture, follow-up, support FAQs, content publishing, reporting — all common automation wins.",
      },
      {
        q: "Can freelancers sell AI automation?",
        a: "It's currently one of the highest-margin freelance services in 2026. ONROL graduates regularly land ₹15k–₹1L automation projects with SMBs in their network within 3 months of finishing.",
      },
      {
        q: "What automation projects should I build?",
        a: "Three priorities: (1) one for your inbox/comms (immediate personal time-save), (2) one for your job/business (proves utility to others), (3) one for a future client (portfolio piece). ONROL's project format produces all three.",
      },
      {
        q: "Is ONROL good for AI automation?",
        a: "ONROL's automation module is one of the program's strongest — built around real Indian freelance and SMB use-cases, not generic US-style examples. Mentors are practitioners actively shipping automations to paying clients.",
      },
    ],
    accent: "blue",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 11. Best AI Institutes in India (P0 — primary commercial pillar)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "best-ai-institutes-in-india",
    title: "Top 11 AI Institutes in India 2026 — Ranked Comparison (IIT, IIIT, IISc, ONROL) | ONROL",
    metaDescription:
      "Top AI institutes in India 2026 — ranked and compared. IIT Madras, IIT Hyderabad, IIIT Hyderabad, IIT Bombay, IIT Delhi, IISc Bangalore, BITS Pilani, IIT Kharagpur, IIT Guwahati, IIT Roorkee, and ONROL (applied AI builder track). Fees, programs, locations, and which one fits your goal.",
    eyebrow: "— India · NIRF 2025-aware ranking · Updated 2026",
    h1: "Top 11 AI Institutes in India",
    hook: "Eleven institutes that actually matter for AI in India in 2026 — ten academic powerhouses (IITs, IIITs, IISc, BITS) plus ONROL, the applied AI builder track for everyone who isn't pursuing a research career.",
    intro:
      "If you searched 'top AI institutes in India', you wanted a real comparison — not a brand pitch. Here it is. The first ten on this list are India's strongest academic AI institutions, ordered using NIRF Engineering rankings (2024-25), AI program depth, faculty strength, and industry placements. The eleventh — ONROL — is included because most people searching this query are not actually planning to pursue a 4-year B.Tech or a PhD; they want to use AI in their work, business, or career within months, and academic institutes are not built for that. Use the ranking below to pick by your real goal: research career → top of list; applied AI builder career → #11. Fees noted are 2026 published ranges; verify on each institute's site before applying.",
    stats: [
      { value: "11", label: "Institutes compared" },
      { value: "₹0–₹10L", label: "Fee range across all 11" },
      { value: "30d–4yr", label: "Program length range" },
    ],
    itemList: {
      name: "Top 11 AI Institutes in India 2026",
      description:
        "Ranked comparison of India's top AI institutes — academic top 10 (IITs, IIITs, IISc, BITS) plus ONROL as the applied-AI builder track.",
      items: [
        {
          position: 1,
          name: "IIT Madras",
          url: "https://www.iitm.ac.in/",
          description:
            "Chennai · B.Tech in AI & Data Analytics + M.Tech / Dual Degree options · ₹2L–₹2.5L per year · NIRF Engineering #1. Strongest mix of research depth and placement pipeline; widely treated as India's #1 AI institute.",
        },
        {
          position: 2,
          name: "IIT Hyderabad",
          url: "https://iith.ac.in/",
          description:
            "Hyderabad · India's first B.Tech in AI (launched 2019) · M.Tech AI/ML · ₹2L–₹2.5L per year · NIRF Engineering top 10. Deep ML, computer vision, NLP exposure with strong industry lab tie-ups.",
        },
        {
          position: 3,
          name: "IIIT Hyderabad",
          url: "https://www.iiit.ac.in/",
          description:
            "Hyderabad · B.Tech (Hons) CSE with AI/ML focus + MS by Research in AI · ~₹3L per year · widely recognised as India's strongest AI research school outside the IIT system; CVIT and LTRC are flagship labs.",
        },
        {
          position: 4,
          name: "IIT Bombay",
          url: "https://www.iitb.ac.in/",
          description:
            "Mumbai · CSE with AI/ML specialisation + M.Tech CSE/AI · ₹2L–₹2.5L per year · NIRF Engineering top 5. Strongest startup ecosystem of any IIT — many India AI founders are IITB alumni.",
        },
        {
          position: 5,
          name: "IIT Delhi",
          url: "https://home.iitd.ac.in/",
          description:
            "New Delhi · B.Tech CSE + M.Tech in Machine Intelligence & Data Science · ₹2L–₹2.5L per year · NIRF Engineering top 5. Yardi School of AI was set up in 2024 specifically to expand AI-focused programs.",
        },
        {
          position: 6,
          name: "IISc Bangalore",
          url: "https://iisc.ac.in/",
          description:
            "Bengaluru · M.Tech (AI), MTech Computational & Data Science, plus PhD pipeline · ₹40k–₹1L per year (research-fellowship subsidised) · NIRF Universities #1. The destination if your goal is AI research and a PhD.",
        },
        {
          position: 7,
          name: "BITS Pilani",
          url: "https://www.bits-pilani.ac.in/",
          description:
            "Pilani / Hyderabad / Goa / Mumbai · B.E. CSE with AI/ML electives + M.Tech AI/ML (on-campus and WILP for working professionals) · ₹4.5L–₹5L per year · India's strongest non-IIT private engineering brand for AI.",
        },
        {
          position: 8,
          name: "IIT Kharagpur",
          url: "http://www.iitkgp.ac.in/",
          description:
            "Kharagpur · B.Tech CSE + Centre of Excellence in AI offering M.Tech / PhD · ₹2L–₹2.5L per year · Oldest IIT, deep computer-science legacy, expanding rapidly into applied AI research.",
        },
        {
          position: 9,
          name: "IIT Guwahati",
          url: "https://www.iitg.ac.in/",
          description:
            "Guwahati · B.Tech in Data Science & AI through Mehta Family School (launched 2021) · ₹2L–₹2.5L per year · One of the first IITs with a dedicated DS&AI B.Tech track, strong North-East presence.",
        },
        {
          position: 10,
          name: "IIT Roorkee",
          url: "https://www.iitr.ac.in/",
          description:
            "Roorkee · B.Tech CSE with AI specialisation + M.Tech AI & Data Science · ₹2L–₹2.5L per year · Strong mathematical and computational AI foundation; growing AI/ML research output across departments.",
        },
        {
          position: 11,
          name: "ONROL — India's AI Execution School",
          url: "https://onrol.in/",
          description:
            "Online + Hyderabad campus · 3-month live applied-AI cohort for 12 personas (engineers, students, teachers, founders, marketers, working professionals, freelancers, content creators, SMB owners, real-estate agents, women returning to work, job-seekers) · INR-priced · No coding required · Ship 3 deployed AI projects in 3 months. Built for the 95% who want to USE AI in their work, not research it.",
          image: "https://onrol.in/onrol-logo-dark.png",
        },
      ],
    },
    sections: [
      {
        heading: "Top 11 AI institutes in India 2026 — the ranked list",
        body: "The ranking below uses NIRF Engineering 2024-25 placements, AI-program depth, faculty publication record, and industry hiring outcomes. Fees are 2026 published ranges — always confirm on the institute site before applying. Positions 1–10 are India's strongest academic AI institutions. Position 11 is ONROL, included because the search query 'top AI institutes in India' is almost never about pursuing a 4-year B.Tech or a PhD; it's about building real AI skills in months, which academic institutes don't optimise for.",
        bullets: [
          "1. IIT Madras (Chennai) — B.Tech AI & Data Analytics + M.Tech · ₹2L–₹2.5L/yr · NIRF Eng #1 · widely India's #1 AI institute",
          "2. IIT Hyderabad — India's first B.Tech AI (2019) + M.Tech AI/ML · ₹2L–₹2.5L/yr · deep ML/CV/NLP labs",
          "3. IIIT Hyderabad — B.Tech (Hons) CSE-AI + MS by Research · ~₹3L/yr · strongest non-IIT AI research school",
          "4. IIT Bombay — CSE with AI/ML + M.Tech CSE/AI · ₹2L–₹2.5L/yr · best AI-startup alumni network in India",
          "5. IIT Delhi — Yardi School of AI · B.Tech CSE + M.Tech Machine Intelligence & DS · ₹2L–₹2.5L/yr",
          "6. IISc Bangalore — M.Tech AI + Computational & Data Science + PhD pipeline · ₹40k–₹1L/yr · NIRF Universities #1 · best if goal = AI research",
          "7. BITS Pilani (Pilani / Hyderabad / Goa / Mumbai) — B.E. CSE + M.Tech AI/ML (incl. WILP for working pros) · ₹4.5L–₹5L/yr",
          "8. IIT Kharagpur — B.Tech CSE + Centre of Excellence in AI · ₹2L–₹2.5L/yr · oldest IIT, deep CS legacy",
          "9. IIT Guwahati — B.Tech Data Science & AI via Mehta Family School (2021) · ₹2L–₹2.5L/yr",
          "10. IIT Roorkee — B.Tech CSE-AI + M.Tech AI & DS · ₹2L–₹2.5L/yr · strong mathematical AI foundation",
          "11. ONROL — 3-month applied AI cohort across 12 personas · INR-priced · ship 3 deployed projects · for the 95% who want to USE AI, not research it",
        ],
      },
      {
        heading: "Which of the 11 should you actually pick?",
        body: "The honest answer depends on your goal. The institutes above serve fundamentally different outcomes — picking by brand alone is the single most expensive AI-training mistake Indians make in 2026.",
        bullets: [
          "Goal: AI research career / PhD / Tier-1 lab ML engineer → IISc Bangalore (#6), IIT Madras (#1), IIT Bombay (#4), IIIT Hyderabad (#3) in that order",
          "Goal: 4-year B.Tech in AI for placements at top product companies → IIT Madras (#1), IIT Hyderabad (#2), IIT Bombay (#4), IIT Delhi (#5) — JEE rank required",
          "Goal: M.Tech AI for an existing engineer → IISc (#6), IIT Madras (#1), IIT Hyderabad (#2), IIT Bombay (#4), IIT Delhi (#5)",
          "Goal: Strong AI brand without JEE/GATE pressure → BITS Pilani (#7), IIIT Hyderabad (#3)",
          "Goal: Apply AI in your current job / business / freelance work within months → ONROL (#11). Skip the 4-year track entirely.",
          "Goal: Build a portfolio of shipped AI projects before placements (for students at any college) → ONROL (#11) in a 3-month break, on top of your existing degree",
          "Goal: Career switch into AI without a CS background → ONROL (#11). Academic institutes are gated by entrance exams and degrees you don't have.",
        ],
      },
      {
        heading: "Pick by who you are — the persona-first lens",
        body: "Most Indian AI institutes are built around ONE persona — usually 'aspiring data scientist with engineering degree'. That fits ~10% of the people who actually want to use AI in 2026. The other 90% — students from any stream, teachers, founders, marketers, sales pros, real-estate agents, working professionals across every industry, freelancers, content creators, SMB owners, women returning to work, unemployed youth — get squeezed into a curriculum that wasn't designed for them. ONROL is the only Indian AI institute built persona-first: same 3-month cohort and tooling, but every persona has its own project track, mentors from their field, and case studies from their industry. If you're not a textbook 'CSE-grad-aspiring-ML-engineer', this is the institute that actually fits you.",
      },
      {
        heading: "Best Indian AI institute — by persona",
        body: "ONROL serves 12 distinct personas with persona-specific project tracks. Pick yours — every other Indian AI institute treats you as a generic data-science aspirant.",
        bullets: [
          "Engineers (any branch — CSE, ECE, Mech, Civil, Chem) using AI in their job: ONROL — automate work, ship side-projects, transition into AI roles within your domain",
          "Students (school, undergrad, postgrad): ONROL — hireable edge before graduation, deployed AI portfolio that gets 3x more interview callbacks",
          "Teachers / educators / coaches: ONROL — build AI-augmented lesson plans, personalised quizzes, parent-update systems, AI tutors for your students",
          "Sales and marketing professionals: ONROL — AI for outreach, lead-scoring, content pipelines, CRM automation; ROI within 2-4 weeks",
          "Real-estate agents and brokers: ONROL — AI listing writers, virtual staging, WhatsApp lead bots, property-match engines",
          "Startup founders / first-time builders: ONROL — ship a working MVP in week one (auth + payments + DB + landing page), validate before raising",
          "Working professionals (any field — IT, HR, finance, legal, healthcare, hospitality): ONROL — automate ~30% of your daily job within a week",
          "Freelancers and consultants: ONROL — productize AI workflows at ₹15k–₹2L per build, hit ₹50k–₹3L/month within 60 days",
          "Content creators (YouTube / IG / LinkedIn / X / podcasts): ONROL — content multipliers (1 idea → 5 platforms), AI video editors, community managers",
          "SMB / small business owners (shops, restaurants, clinics, services): ONROL — WhatsApp bots, automated reminders, AI content for your business",
          "Women returning to work / housewives: ONROL — build a freelance AI service business from home (₹20k–₹1L/month achievable)",
          "Unemployed youth and job-seekers: ONROL — portfolio of 3 deployed AI projects + AI cold-outreach + ATS-beating resume + interview-prep AI tutor",
        ],
      },
      {
        heading: "What each persona ships in 3 months at ONROL",
        body: "Same 3-month cohort, but the projects, mentors, and case studies are tailored to who you are. Here's what each persona walks out with:",
        bullets: [
          "Engineers (CSE/ECE/Mech/Civil/etc.): an AI agent that automates one painful task in your job + a portfolio site showcasing your AI capability + a fine-tuned model trained on your domain data",
          "Students: a deployed AI project in your field of study + a public AI portfolio that gets you 3x more interview callbacks + AI-powered resume that beats ATS filters",
          "Teachers and educators: an AI lesson-plan generator for your subject + an AI quiz engine personalised per student + a parent-update auto-summary system",
          "Sales and marketing professionals: a cold-outreach AI agent + lead-scoring system + AI-written content pipeline (LinkedIn, Email, X) + automated CRM hygiene",
          "Real-estate agents: an AI listing-description writer + virtual staging via image AI + a WhatsApp lead-qualification bot + property-matching engine for buyers",
          "Startup founders: a full MVP (landing page + auth + payments + database) shipped in week one + an AI-powered customer support agent + a competitive-intelligence research bot",
          "Working professionals: an AI workflow that automates ~30% of your daily job + a personal AI assistant trained on your work documents + a side-project that becomes a freelance income stream",
          "Unemployed youth and job-seekers: a portfolio of 3 deployed AI projects + an AI-powered cold-outreach system to land interviews + AI-written resume + interview-prep AI tutor",
        ],
      },
      {
        heading: "How ONROL compares to other AI training in India",
        body: "Most Indian AI training options fall into a few categories. Here's how each compares to ONROL — by category, not brand:",
        bullets: [
          "ONROL — 3-month live intensive | 3 deployed projects per learner | Persona-specific project tracks across 12 personas | No coding required | INR-priced | Free Masterclass before you pay",
          "Long-form online programs (6–12 months, recorded videos + occasional live classes) — strong on curriculum length and brand-recognised certificate, weak on shipped projects, ₹1.5L–₹4L typical",
          "University-affiliated PG Diplomas (12 months, partnered with engineering colleges) — strong on credential for HR filtering, weak on industry-current tooling, ₹2L–₹4L typical",
          "International-university partnered programs (6–12 months, US/UK university branding) — strong on resume signal for relocation/visa goals, ₹1.5L–₹3.5L typical",
          "Budget recorded ML courses (4–9 months, mostly self-paced) — cheap and accessible, weak on accountability, 90%+ don't finish, ₹35k–₹1.5L typical",
          "Self-paced video platforms (subscription-based, $39–$79/month) — excellent if you actually finish, but most don't",
          "Free university theory programs (semester-paced, government / top-university backed) — excellent for theory deep-dive at ₹0, requires high self-discipline, weak on application",
          "Placement-guarantee bootcamps (9–12 months, ₹3L–₹4L) — built around single 'data scientist' career outcome, doesn't fit the 12 personas above",
          "Multi-year academic degrees (M.Tech / PhD, 2–4 years, ₹1L–₹10L) — built for AI research careers and Tier-1 lab ML engineering, a fundamentally different goal from 'apply AI in your work this week'",
        ],
      },
      {
        heading: "Why ONROL is the right pick for 12 Indian personas",
        bullets: [
          "Persona-first curriculum — same 3-month cohort, but every learner gets project tracks, mentors, and case studies that match their actual life (engineer / student / teacher / founder / salesperson / real-estate agent / working pro / freelancer / content creator / SMB owner / women returning to work / job-seeker)",
          "3 deployed projects in 3 months — every learner walks out with shipped, public, persona-relevant work",
          "Live cohort with practitioner mentors actively using AI in the same persona/field as you — not generic professors",
          "INR-priced from day one (not converted USD pricing inflated for India)",
          "Zero coding background required — purpose-built for non-coders across all 12 personas",
          "Year-long ONROL Community access (10K+ Indian builders across every persona — find peers in your exact field)",
          "Lifetime access to tools.onrol.in (19+ AI tools maintained by the team)",
          "Hindi-friendly mentors, India-local case studies, Indian SMB pricing examples",
          "Free 90-minute Masterclass to test the format before you commit",
        ],
      },
      {
        heading: "When ONROL is NOT the right fit",
        body: "ONROL is for the 12 personas who want to USE AI in their life or work. We're not for everyone. Skip ONROL and pick a different category of training if:",
        bullets: [
          "You want to be an AI researcher / publish papers / pursue a PhD or Tier-1 lab ML-engineer role — pursue a multi-year academic degree (M.Tech / PhD) instead",
          "You ONLY need a 12-month brand-name certificate to clear an HR resume filter (and don't care about shipped work) — pursue a long-form university-affiliated PG Diploma",
          "You want a single-outcome placement-guarantee program for a specific career role (data scientist) — pursue a long placement-driven bootcamp",
          "You want a 100% self-paced course with no live commitment — try a free university theory program or a paid video subscription (be honest with yourself: do you actually finish self-paced courses?)",
        ],
      },
      {
        heading: "Red flags — how to spot a fake AI institute in India",
        body: "The Indian AI training market is flooded. Some institutes oversell. Walk away if you see:",
        bullets: [
          "No public examples of actual learner-shipped projects (deploy URLs, GitHub links, real launches)",
          "Mentors are 'industry experts' but their LinkedIn shows no recent practitioner work",
          "Curriculum hasn't been updated in 6+ months (AI moves fast — 6-month-old curriculum is stale)",
          "'Placement guaranteed' with no published placement data, no alumni list, no specific company names",
          "Pricing inflated 3-5x what's reasonable (₹2L+ for a 3-month course with no verifiable outcomes)",
          "High-pressure sales tactics: 'limited seats', 'price increases tomorrow', 'only 5 left' — repeated weekly",
          "No free trial, no free preview, no recorded sample class to evaluate before paying",
        ],
      },
      {
        heading: "How to evaluate any Indian AI institute before paying",
        bullets: [
          "Ask for 5 alumni LinkedIn profiles + 5 deployed project URLs from past cohorts. Verify both.",
          "Ask: 'What will I have at the end that I can show in an interview / on Upwork / on my portfolio?' Reject vague answers.",
          "Ask for the curriculum dated within the last 6 months. Reject 12-month-old curricula.",
          "Take the free trial / Masterclass. Reject institutes that don't offer one.",
          "Search the institute name + 'review' on Reddit, Quora, YouTube — read negative reviews carefully, not just the marketing site.",
          "Calculate cost-per-shipped-project: (Course fee) / (Projects shipped). ONROL is roughly ₹X/project. Anything over ₹50k/project is overpriced.",
          "Check if there's an active alumni community. If not, you're paying for content but not for the network — that's the real ROI.",
        ],
      },
    ],
    faqs: [
      {
        q: "What are the top AI institutes in India in 2026?",
        a: "The strongest academic AI institutes in India in 2026 are: 1) IIT Madras, 2) IIT Hyderabad, 3) IIIT Hyderabad, 4) IIT Bombay, 5) IIT Delhi, 6) IISc Bangalore, 7) BITS Pilani, 8) IIT Kharagpur, 9) IIT Guwahati, 10) IIT Roorkee — ranked by NIRF Engineering 2024-25 placements, AI-program depth, faculty publication record, and industry outcomes. For applied AI training outside the academic track (career switchers, working professionals, freelancers, students looking for a portfolio edge), ONROL is included as #11 — a 3-month live cohort that ships 3 deployed AI projects, no coding required.",
      },
      {
        q: "Which is the best AI institute in India in 2026?",
        a: "If 'best' means academic AI brand and research depth: IIT Madras (NIRF Eng #1) for B.Tech/M.Tech AI, IISc Bangalore for AI research/PhD. If 'best' means apply AI in your work or career within months without a 4-year degree: ONROL — built persona-first for 12 kinds of Indians (engineers, students, teachers, startup founders, sales/marketing professionals, real-estate agents, working professionals, freelancers, content creators, SMB owners, women returning to work, and unemployed youth), every persona ships shipped projects in 3 months with practitioner mentors.",
      },
      {
        q: "What are the top AI institute categories in India?",
        a: "Indian AI training falls into 6 categories: (1) Persona-first execution institutes — ONROL is the leading example, builds 12 personas with shipped projects in 3 months. (2) Long-form online programs (6–12 months, recorded video) — brand-certificate focused. (3) University-affiliated PG Diplomas (12 months) — credentialed certification. (4) Multi-year academic degrees (M.Tech / PhD, 2–4 years) — for research careers. (5) Placement-guarantee bootcamps (9–12 months) — single career outcome (usually data scientist). (6) Free / self-paced video — for highly self-motivated learners who actually finish. Pick by your persona + goal, not by brand.",
      },
      {
        q: "Which AI institute in India is best for engineers (CSE, ECE, Mech, Civil, Chem)?",
        a: "ONROL — the only Indian AI institute with engineering-persona project tracks. Each engineer ships an AI agent that automates a real task in their domain, plus a portfolio site, plus a domain-fine-tuned model — all in 3 months. Most other Indian AI institutes assume CSE/ML background and fail non-CS engineers.",
      },
      {
        q: "Which AI institute in India is best for sales and marketing professionals?",
        a: "ONROL — sales and marketing is one of ONROL's 8 supported personas. You'll build a cold-outreach AI agent, a lead-scoring system, an AI content pipeline (LinkedIn / Email / X), and CRM hygiene automation. ROI within 2-4 weeks of finishing the cohort.",
      },
      {
        q: "Which AI institute in India is best for real-estate agents and brokers?",
        a: "ONROL is the only Indian AI institute with a real-estate persona track. You'll build an AI listing-description writer, virtual staging via image AI, a WhatsApp lead-qualification bot, and a property-matching engine. Built around the actual workflow of Indian real-estate agencies.",
      },
      {
        q: "Which AI institute in India is best for startup founders and first-time builders?",
        a: "ONROL — founders ship a full MVP (landing page + auth + payments + DB) in week one, plus an AI-powered customer support agent and a competitive-intelligence research bot. No CTO required. Validate ideas in days, not months.",
      },
      {
        q: "Which AI institute in India is best for working professionals?",
        a: "ONROL — working professionals are ONROL's largest persona segment. You'll build an AI workflow that automates ~30% of your daily job, a personal AI assistant trained on your work documents, and a side-project that often becomes a freelance income stream. Industry-agnostic.",
      },
      {
        q: "Which AI institute in India is best for unemployed youth and job-seekers?",
        a: "ONROL — job-seekers walk out with a portfolio of 3 deployed AI projects, an AI-powered cold-outreach system to land interviews, an AI-written resume that beats ATS filters, and an interview-prep AI tutor. The portfolio is the differentiator — most candidates don't have shipped AI work yet.",
      },
      {
        q: "Which AI institute in India is best for teachers and educators?",
        a: "ONROL has a teacher-persona track. You'll build an AI lesson-plan generator for your subject, a personalised AI quiz engine for your students, and a parent-update auto-summary system. The same AI that's threatening teachers becomes your superpower.",
      },
      {
        q: "Which AI institute is best for non-coders in India?",
        a: "ONROL is purpose-built for non-coders. The 3-month Generalist program teaches AI tooling, prompting, no-code automation (n8n, Make, Zapier), and vibe coding (Lovable, Bolt, Cursor) — none of which require traditional coding. Most other Indian AI institutes assume coding background or teach coding alongside AI, which slows non-coders down.",
      },
      {
        q: "Which AI institute in India is best for students?",
        a: "ONROL — students ship a deployed AI project in their field of study, build a public AI portfolio that gets 3x more interview callbacks, and create an AI-powered ATS-beating resume. For students who specifically want a research career (PhD or Tier-1 ML engineering), pursue a multi-year academic degree instead — different goal, different path.",
      },
      {
        q: "What does an AI institute in India typically charge?",
        a: "₹35k–₹4L depending on duration and brand. Short-term bootcamps (4–8 weeks): ₹35k–₹80k. Mid-length programs (3–6 months): ₹80k–₹1.5L. Long programs with university branding (9–12 months): ₹1.5L–₹4L. Multi-year academic degrees (M.Tech / PhD): ₹1L–₹10L over 2 years. ONROL is mid-range for the value delivered (3 deployed projects + year-long community + lifetime tools access).",
      },
      {
        q: "Are AI institutes in India worth it?",
        a: "Yes — but only the ones that can show you what past learners shipped. Worth doesn't come from the certificate; it comes from what you can demonstrate after. Always ask for 5+ public learner-shipped project URLs before paying any institute in India.",
      },
      {
        q: "Which AI institute in India provides placement?",
        a: "Several long-form bootcamps and PG-diploma programs publicly market placement. Read the fine print — most 'placement guarantees' have qualifying conditions (attendance, project completion, geography, salary cap). ONROL doesn't promise placement; instead we equip you to freelance, build a startup, or apply AI in your current job — outcomes you control directly.",
      },
      {
        q: "Which AI institute in India is best for students?",
        a: "For undergraduate students wanting hands-on builder skills before graduation: ONROL's 3-month Generalist. For graduate students wanting research: a multi-year academic degree (M.Tech / PhD). Many students do both — ONROL during semester break (3 months) for the practical edge, plus a longer credentialed program later.",
      },
      {
        q: "How long does an AI course at an Indian institute take?",
        a: "Ranges from 3 months (ONROL Generalist intensive) to 4 years (academic B.Tech). Common formats: 5–7 day intensive bootcamps, 4–8 week short courses, 3–6 month certificate programs, 9–12 month PG diplomas, multi-year academic degrees. Match length to your real time availability — finishing a 3-month course is harder than starting a 12-month one.",
      },
      {
        q: "Is ONROL accredited?",
        a: "ONROL issues its own completion certificate. It is not university-accredited like a multi-year M.Tech or a credentialed PG Diploma. Whether that matters depends on your goal. For freelance, startup, in-job AI use, and corporate roles that hire on portfolio/skills, the certificate matters less than your shipped work. For HR-filter roles where the recruiter screens by university name, prefer a credentialed program.",
      },
      {
        q: "Which AI institute in India has the best alumni community?",
        a: "ONROL has the most active practitioner-builder community in India for applied AI — 10K+ members, daily AI tool drops, weekly cohort meet-ups, freelance referral network. Larger long-form institutes have larger alumni numerically but less active in the hands-on builder space. Community matters because the AI field changes monthly — a stale community of 50K is worse than a live community of 5K.",
      },
      {
        q: "What should I look for in an AI institute in India?",
        a: "Six things: (1) Public examples of past learner-shipped projects with deploy URLs. (2) Practitioner mentors actively shipping AI work — verifiable on LinkedIn. (3) Curriculum updated within last 6 months. (4) Free trial or Masterclass before paying. (5) An active alumni community for ongoing growth. (6) Honest pricing in INR with no high-pressure sales. If an institute fails any of the six, walk away.",
      },
      {
        q: "Can I learn AI for free in India?",
        a: "Yes — free university-affiliated programs, auditable online courses, and YouTube channels are excellent if you finish them. Drop-off rate for free programs is 90%+ because there's no commitment. If you've already finished 2–3 free AI courses and shipped projects from them, you don't need a paid institute. If you keep starting and not finishing, a paid cohort with deadlines is what you need.",
      },
    ],
    related: [
      { name: "ONROL AI Generalist (3-month intensive)", href: "/programs/ai-generalist/", blurb: "Beginner-friendly. Ship 3 live AI projects." },
      { name: "ONROL AI Architect (Advanced)", href: "/programs/ai-architect/", blurb: "Agents + automation + production AI products." },
      { name: "Best AI course in India", href: "/best-ai-course-in-india/", blurb: "Academic vs applied AI explained." },
      { name: "Academic AI vs Applied AI", href: "/academic-ai-vs-applied-ai/", blurb: "Pick the right path for your goal." },
      { name: "What ONROL learners build", href: "/proof/", blurb: "Real deploy URLs and project archetypes." },
      { name: "ONROL Free Masterclass", href: "/programs/", blurb: "90-minute live test before you commit." },
    ],
    accent: "orange",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 12. Top Vibe Coding Training India (P0 — blue-ocean commercial pillar)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "top-vibe-coding-training-india",
    title: "Top Vibe Coding Training in India 2026 — Lovable, Bolt, Cursor, v0 + Live Cohort | ONROL",
    metaDescription:
      "Top vibe coding training in India for 2026. Learn Lovable, Bolt.new, Cursor, v0, Replit AI in a 3-month live cohort. Ship a deployed website without writing code. ONROL is the first India-specific vibe coding institute.",
    eyebrow: "— Vibe coding · India's blue ocean skill of 2026",
    h1: "Top Vibe Coding Training in India",
    hook: "Build production websites in 3 months without writing a single line of code yourself — using AI as your pair-programmer.",
    intro:
      "Vibe coding is software development where you describe what you want in plain English (or Hindi, with translation) and an AI writes the code for you. In 2026 it's the highest-leverage skill in India for non-coders, designers, founders, marketers, and product managers — because it collapses the gap between idea and shipped product from months to days. ONROL runs the most hands-on vibe coding training in India: a live 3-month cohort where every learner ships at least one deployable website using Lovable, Bolt.new, Cursor, v0, and Replit AI. No coding background required. Free 90-minute Masterclass to test before you commit.",
    stats: [
      { value: "5d", label: "Cohort length — start to deployed site" },
      { value: "5+", label: "Vibe coding tools taught hands-on" },
      { value: "₹0", label: "Free Masterclass before you pay" },
    ],
    sections: [
      {
        heading: "What is vibe coding (in plain English)",
        body: "Vibe coding is the practice of building software by describing it to an AI in plain English. You say 'build me a landing page for an Indian saree shop with bookings, payments, and Instagram embed', and a tool like Lovable or Bolt generates the working website — HTML, CSS, JavaScript, database, deployment — in under 10 minutes. You then refine it by chatting with the AI ('change the colour palette to gold and maroon', 'add a WhatsApp button'). The output is real production code you can deploy, edit, and own — not a static prototype. Coined by Andrej Karpathy in early 2025, the term has become the umbrella for AI-driven development tools used by millions of non-coders worldwide.",
      },
      {
        heading: "Why vibe coding matters in India in 2026",
        bullets: [
          "Indian designers, founders, freelancers, and product managers can now ship products without hiring developers — saving ₹50k–₹5L per build",
          "Bridges the talent shortage: India has 4M+ creative professionals who had ideas but couldn't ship; vibe coding unlocks them",
          "Freelance market: clients on Upwork, Fiverr, LinkedIn now pay ₹20k–₹2L for vibe-coded MVPs and websites that used to take months",
          "Career advantage: vibe coding skills + your domain expertise (e.g., HR, finance, design) makes you exponentially more valuable than coders without domain context",
          "Speed of learning: where traditional web dev took 6–12 months to first shipped site, vibe coding takes 3 months",
        ],
      },
      {
        heading: "The vibe coding tool landscape (2026)",
        body: "Five tools dominate. ONROL teaches all five hands-on so you understand which to pick for which use-case.",
        bullets: [
          "Lovable — fastest for full-stack web apps. Pure prompt-driven. Best for marketing sites, MVPs, internal tools. Generous free tier.",
          "Bolt.new — owned by StackBlitz. Excellent for React/Next.js apps with database. Strong on iteration speed inside a real IDE.",
          "Cursor — AI pair-programmer for traditional coders. Best for incremental edits to existing codebases. Industry standard for engineers using AI.",
          "v0 (Vercel) — best for UI components and design systems. Pixel-perfect frontends generated from prompts or screenshots.",
          "Replit AI — full development environment in the browser. Strong for collaborative coding, students, and learning by trying.",
          "Windsurf / Trae / Cline — emerging alternatives. ONROL keeps you updated as the landscape changes monthly.",
        ],
      },
      {
        heading: "Who should join vibe coding training",
        bullets: [
          "Designers who can describe an interface but couldn't build it — now you ship it yourself",
          "Founders and entrepreneurs sitting on product ideas waiting for a CTO — stop waiting, ship the MVP this week",
          "Freelancers who want to add 'I ship websites' to their service menu and charge ₹15k–₹50k per project",
          "Product managers who want to build internal tools, dashboards, and workflows without depending on engineering",
          "Marketers who want to A/B test landing pages, build tools (calculators, quizzes), and own their marketing stack",
          "Working professionals who want to side-hustle by building SaaS without coding",
          "Students looking for an applied skill that immediately differentiates them in the job market",
          "Content creators who want to build their own newsletter, course platform, or community site",
        ],
      },
      {
        heading: "What you'll build in ONROL's 3-month vibe coding cohort",
        bullets: [
          "Day 1 — A working personal portfolio website with real domain + custom design (Lovable + v0)",
          "Day 2 — A SaaS landing page with email capture, Stripe payment, and analytics (Bolt + Vercel)",
          "Day 3 — An internal tool: AI-powered dashboard pulling data from Google Sheets or Notion (Lovable + APIs)",
          "Day 4 — A community / marketplace site with auth, profiles, and content (Bolt + Supabase)",
          "Capstone — Your own choice: an MVP for your real business idea, fully deployed with a domain",
        ],
      },
      {
        heading: "Why ONROL leads vibe coding training in India",
        bullets: [
          "First India-specific vibe coding institute — INR pricing, Indian SMB use-cases, Hindi-friendly mentors",
          "Live cohort with mentors who actively ship vibe-coded products — not pre-recorded videos",
          "Tool-agnostic — we teach the underlying patterns so you adapt as new tools launch (and they will)",
          "Real domain + deployment included — you leave with a live portfolio, not a sandbox demo",
          "Year-long ONROL Community access for ongoing tool drops, tips, and freelance opportunities",
          "Free 90-minute Masterclass to try the format before paying anything",
          "Lifetime access to tools.onrol.in — 19+ AI-powered tools the team maintains",
        ],
      },
      {
        heading: "How vibe coding earns you money in India",
        body: "Three direct paths to income within 3 months of completing training:",
        bullets: [
          "Freelance website builds — ₹15k–₹50k per project. Indian SMBs need landing pages weekly. List on Upwork, Fiverr, LinkedIn, and local Facebook groups.",
          "Productized service — package your vibe coding work as a fixed-price offer ('I'll build your business website in 3 days for ₹25k'). 5–10 clients/month at ₹25k = ₹1.25–2.5L/month.",
          "Build your own SaaS — solo founders are now shipping SaaS in weeks instead of months. The Indian SaaS market is exploding; vibe coding lets you participate without raising a seed round.",
          "Internal-team multiplier — apply vibe coding inside your current job. Companies pay 2–3x for employees who ship working tools rather than briefs and decks.",
        ],
      },
      {
        heading: "How to evaluate any vibe coding course in India",
        bullets: [
          "Ask: 'Show me 5 live URLs of past learner-shipped sites.' If they can't, walk away.",
          "Ask: 'Which exact tools do you teach?' If the list is just 'AI tools', it's vague and outdated.",
          "Ask: 'Are sessions live or pre-recorded?' Vibe coding tools change monthly — pre-recorded is stale by week 4.",
          "Ask: 'Will I leave with a deployed live site I own?' Sandbox demos don't count.",
          "Ask: 'Is there a free preview / trial?' If not, you're paying for a black box.",
          "Check curriculum date. Vibe coding moves so fast a 6-month-old curriculum is stale; 3-month-old is the limit.",
        ],
      },
    ],
    faqs: [
      {
        q: "What is vibe coding?",
        a: "Vibe coding is software development where you describe what you want in plain English and an AI writes the code. You build production-ready websites and apps by chatting with tools like Lovable, Bolt.new, Cursor, v0, or Replit AI — no coding skills required. The term was coined by Andrej Karpathy in early 2025.",
      },
      {
        q: "Which is the best vibe coding training in India?",
        a: "ONROL runs India's most hands-on vibe coding training — a 3-month live cohort where learners ship deployed websites using Lovable, Bolt, Cursor, v0, and Replit AI. INR-priced, Hindi-friendly mentors, free Masterclass, year-long community access, no coding background required.",
      },
      {
        q: "Which is the best vibe coding tool in 2026?",
        a: "Depends on your use-case. Lovable for fastest full-stack web apps, Bolt.new for React/Next.js apps with database, Cursor for incremental edits to existing codebases, v0 for UI components and design systems, Replit AI for collaborative learning. ONROL teaches all five so you can pick the right tool per project.",
      },
      {
        q: "Can I learn vibe coding without coding background?",
        a: "Yes — that's the whole point. Vibe coding is built for non-coders. ONROL's training assumes zero programming knowledge. By the end of the program you'll ship a deployed website using only natural-language prompts.",
      },
      {
        q: "How long does it take to learn vibe coding?",
        a: "ONROL's intensive 3-month cohort gets you from zero to your first deployed website. To become competent across all five major tools and start charging clients: 4–6 weeks of practice after the cohort. Full mastery: 3–6 months of regular building.",
      },
      {
        q: "How much does vibe coding training cost in India?",
        a: "ONROL's vibe coding training is included as part of the AI Generalist program. Indian-priced. Specific fee details on the program page or via the Free Masterclass. Always avoid Indian institutes charging ₹2L+ for short vibe coding bootcamps — the rate is inflated.",
      },
      {
        q: "Will vibe coding replace developers?",
        a: "Not entirely. Vibe coding replaces the 80% of dev work that's pattern-matching (CRUD apps, landing pages, internal tools, prototypes). Senior engineers focused on architecture, performance, security, and complex systems remain in high demand. Vibe coding makes everyone else 10x faster, and lets non-coders enter the building game directly.",
      },
      {
        q: "Can I earn money with vibe coding in India?",
        a: "Yes. Three direct paths: (1) Freelance website builds at ₹15k–₹50k each. (2) Productized service (e.g., 'business website in 3 days for ₹25k'). (3) Build your own SaaS solo. Many ONROL alumni hit ₹50k–₹2L/month within 60 days of completing training.",
      },
      {
        q: "Is vibe coding the same as no-code?",
        a: "No. No-code platforms (Webflow, Bubble, Glide) lock you into their visual builder and their hosting. Vibe coding generates real code (React, Next.js, Vue, etc.) you own, can edit, and can host anywhere. Vibe coding is more flexible and more powerful, but requires slightly more comfort with technical concepts.",
      },
      {
        q: "Which is better — Lovable or Bolt?",
        a: "Lovable is faster for first-draft full-stack web apps. Bolt is stronger for iterating in a real IDE with file-level control. Most ONROL learners end up using both: Lovable for speed prototyping, Bolt for production polish. The training teaches when to switch.",
      },
      {
        q: "Do I need to know prompting before learning vibe coding?",
        a: "Basic prompting helps but isn't a prerequisite. ONROL's training covers vibe-coding-specific prompting patterns — they're different from general AI prompting. By the end of day 1 you'll be writing effective build prompts.",
      },
      {
        q: "What if vibe coding tools change after my training?",
        a: "They will — the field changes monthly. ONROL teaches the underlying patterns (how to think about prompts, file structure, deployment, debugging with AI) so you adapt to any new tool. Plus your year-long ONROL Community membership keeps you updated as new tools launch.",
      },
      {
        q: "Is ONROL the only vibe coding training in India?",
        a: "ONROL is the most India-specific (INR pricing, local case studies, Hindi-friendly mentors, year-long community). Some international platforms (Udemy, YouTube) offer vibe coding content, but they're rarely India-priced and almost never live. Other Indian institutes are catching up — read our pillar comparing institutes for an honest assessment.",
      },
    ],
    related: [
      { name: "Best AI institutes in India 2026", href: "/best-ai-institutes-in-india/", blurb: "11 ranked. Honest comparison." },
      { name: "ONROL AI Generalist (includes vibe coding)", href: "/programs/ai-generalist/", blurb: "3-month intensive cohort." },
      { name: "What ONROL learners build", href: "/proof/", blurb: "Real deploy URLs from past learners." },
      { name: "AI course for beginners", href: "/ai-course-for-beginners/", blurb: "Vibe coding for absolute beginners." },
      { name: "AI course for content creators", href: "/ai-course-for-content-creators/", blurb: "Build your own platform with vibe coding." },
      { name: "ONROL Free Masterclass", href: "/programs/", blurb: "90-minute live test before you commit." },
    ],
    accent: "violet",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 13. Best AI Bootcamps in India (P0)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "best-ai-bootcamps-in-india",
    title: "Best AI Bootcamps in India 2026 — Persona-First, Ship Real Projects | ONROL",
    metaDescription:
      "Best AI bootcamps in India 2026: ranked by who you are. ONROL's 3-month live cohort ships 3 deployed AI projects per learner across 12 personas. INR-priced, no coding required, free Masterclass.",
    eyebrow: "— India's AI bootcamp landscape",
    h1: "Best AI Bootcamps in India",
    hook: "Most AI bootcamps in India teach theory in volume. ONROL is the only one where every learner ships 3 deployed AI projects in 3 months.",
    intro:
      "The best AI bootcamp in India in 2026 isn't the longest one — it's the one that gets you to a SHIPPED project the fastest, in your persona. ONROL is India's only AI bootcamp built persona-first across 12 personas: same 3-month live cohort, but engineers, students, teachers, founders, sales/marketing pros, real-estate agents, working professionals, freelancers, content creators, SMB owners, women returning to work, and unemployed youth each get persona-specific project tracks and mentors. By the end: 3 deployed AI projects on your portfolio. INR-priced. Free Masterclass before you pay.",
    stats: [
      { value: "5d", label: "Cohort length" },
      { value: "3", label: "Deployed projects per learner" },
      { value: "12", label: "Persona tracks" },
    ],
    sections: [
      {
        heading: "What separates a real AI bootcamp from a glorified video course",
        bullets: [
          "Live cohort with mentors — not pre-recorded videos you forget about by week 2",
          "Project-first curriculum — every day produces a shipped artifact, not a quiz",
          "Persona-aligned — engineers don't watch real-estate agents' work and vice versa",
          "Practitioner mentors — actively shipping AI work in your field, verifiable on LinkedIn",
          "Active community after the cohort — AI moves monthly; static courses go stale",
          "Free preview before you pay — anything that won't show you the format is selling, not teaching",
        ],
      },
      {
        heading: "Why ONROL is the leading AI bootcamp in India",
        bullets: [
          "3-month intensive — fastest path from zero to deployed AI projects in India",
          "12 distinct persona tracks (engineers, students, teachers, founders, sales/marketing, real-estate, working pros, freelancers, content creators, SMB owners, women returning to work, job-seekers)",
          "Live cohort — daily build sessions with practitioner mentors",
          "INR-priced from day one — not converted USD pricing",
          "Year-long ONROL Community access (10K+ Indian builders)",
          "Lifetime access to tools.onrol.in (19+ AI tools maintained by the team)",
          "Free 90-minute Masterclass before any commitment",
          "No coding background required — built for the 90% of Indians who aren't aspiring data scientists",
        ],
      },
      {
        heading: "What you ship in 3 months — by persona",
        body: "Same cohort, persona-specific outputs. Each persona walks out with shipped, public, persona-relevant work.",
        bullets: [
          "Engineers: AI agent automating one task in your job + portfolio site + domain-fine-tuned model",
          "Students: deployed AI project in your field + ATS-beating AI resume + interview-prep AI tutor",
          "Teachers: AI lesson-plan generator + AI quiz engine + parent-update auto-summary",
          "Sales/Marketing: cold-outreach AI agent + lead-scoring system + content pipeline",
          "Real-estate: AI listing writer + virtual staging + WhatsApp lead bot",
          "Founders: full MVP (auth + payments + DB) + AI customer support agent + competitive intel bot",
          "Working pros: 30%-job-automation workflow + personal AI assistant + side-project income stream",
          "Freelancers: productized AI service + delivery automation + client outreach pipeline",
          "Content creators: 1→5 platform multiplier + AI video editor + community manager",
          "SMB owners: WhatsApp business bot + payment reminders + content pipeline",
          "Women returning to work: freelance AI service offer + portfolio + LinkedIn AI outreach",
          "Job-seekers: 3 deployed AI projects + AI cold-outreach + interview-prep tutor",
        ],
      },
      {
        heading: "How long should an AI bootcamp be in 2026?",
        body: "Counter-intuitive answer: shorter is better, with strong follow-up. AI tooling changes monthly — a 6-month bootcamp graduates you with stale skills. ONROL's 3-month model gets you shipping immediately, then the year-long community keeps you current as new tools (Lovable updates, Claude releases, n8n features) drop weekly. Long bootcamps optimise for completion-rate signaling; short ones optimise for what you can actually build.",
      },
      {
        heading: "How to evaluate any AI bootcamp in India before paying",
        bullets: [
          "Ask for 5 deployed-project URLs from past learners — verify in your browser",
          "Ask: 'Are sessions live with practitioner mentors, or recorded?' Reject recorded-only.",
          "Check curriculum date. Stale curricula (>6 months) are red flags in AI.",
          "Take the free trial / Masterclass. If they don't offer one, they don't trust the format.",
          "Calculate cost-per-project: (Fee) / (Deployed projects shipped). ONROL is mid-range.",
          "Check for active alumni community. Where AI is going next is in those rooms.",
          "Search bootcamp + 'review' on Reddit, Quora, YouTube — read negative reviews carefully.",
        ],
      },
    ],
    faqs: [
      {
        q: "Which is the best AI bootcamp in India in 2026?",
        a: "ONROL — India's only AI bootcamp built persona-first for 12 personas, with a 3-month live cohort that ships 3 deployed projects per learner. No coding required. INR-priced. Free Masterclass available.",
      },
      {
        q: "How long should an AI bootcamp be?",
        a: "Shorter (5-7 days) with strong year-long follow-up beats longer (3-12 months) without. AI changes monthly — what you finish a long bootcamp with is partly stale by the time you graduate. ONROL chose 3 months intensive + year-long community for this reason.",
      },
      {
        q: "Are short AI bootcamps worth it?",
        a: "Yes — IF they ship deployed projects, have live cohort sessions, and provide year-long community access. Most short bootcamps fail on at least one of these. ONROL designed all three from day one.",
      },
      {
        q: "Which AI bootcamp gives projects and not just theory?",
        a: "ONROL is the only Indian AI bootcamp where every learner publicly ships 3 deployed projects in 3 months. Always ask any bootcamp for 5+ past-learner project URLs before paying.",
      },
      {
        q: "Can I do an AI bootcamp without a coding background?",
        a: "Yes — ONROL is purpose-built for non-coders. The curriculum uses no-code automation (n8n, Make, Zapier), vibe coding (Lovable, Bolt, Cursor), and AI tooling — none requiring traditional coding.",
      },
      {
        q: "Are AI bootcamps in India worth the fee?",
        a: "Worth comes from what you can show after, not the certificate. Always ask: 'Show me 5 deploy URLs from past learners.' If they can, the bootcamp is worth it. If they can't, walk away regardless of brand.",
      },
      {
        q: "What's the best AI bootcamp for working professionals in India?",
        a: "ONROL — working professionals are the largest of ONROL's 12 persona tracks. The 3-month intensive fits around weekend / evening availability, and you walk out with an AI workflow that automates ~30% of your daily job.",
      },
      {
        q: "What's the best AI bootcamp for non-coders in India?",
        a: "ONROL — purpose-built for non-coders across 12 personas. No prior programming knowledge needed; we teach AI tools, no-code automation, and vibe coding from scratch.",
      },
    ],
    accent: "amber",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 14. AI Institutes Near Me (P0 — local SEO hub)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "ai-institutes-near-me",
    title: "AI Institutes Near Me — Online Across India + Hyderabad Campus | ONROL",
    metaDescription:
      "AI institute near me in India — ONROL is fully online across India + on-campus in Hyderabad. 3-month live cohort, persona-first across 12 personas, no commute required. Free Masterclass to test before you commit.",
    eyebrow: "— Local + online AI training",
    h1: "AI Institutes Near Me",
    hook: "The best AI institute near you in India is online and live. ONROL serves every Indian city — Hyderabad campus + nationwide live cohorts.",
    intro:
      "Searching 'AI institute near me' in India today rarely finds the best fit because the best AI institutes in 2026 are online-first with live cohorts — not classroom-based. Why: AI tooling moves too fast for a city-locked physical institute to keep up, and the best mentors are remote practitioners. ONROL is fully online across India (you join from any city — Hyderabad, Bangalore, Mumbai, Delhi, Chennai, Pune, Kolkata, Ahmedabad, Jaipur, Lucknow, anywhere), with a Hyderabad on-campus option for learners who prefer in-person. Live 3-month cohort, persona-first across 12 personas, no commute required.",
    stats: [
      { value: "All India", label: "Online cohort coverage" },
      { value: "Hyderabad", label: "On-campus option" },
      { value: "5d", label: "Cohort length" },
    ],
    sections: [
      {
        heading: "Where ONROL learners come from",
        bullets: [
          "Hyderabad — both online + on-campus available; largest single concentration of ONROL builders",
          "Bangalore / Bengaluru — strong online cohort presence; weekly virtual meetups",
          "Mumbai + Pune — Maharashtra online learners across cohorts",
          "Delhi + NCR (Gurgaon, Noida, Faridabad, Ghaziabad) — online cohort hub",
          "Chennai + Coimbatore + Madurai — Tamil Nadu online presence",
          "Kolkata + West Bengal — online cohort access",
          "Ahmedabad + Surat + Vadodara + Gujarat — online cohorts",
          "Tier-2/Tier-3 cities — Jaipur, Lucknow, Kanpur, Indore, Bhopal, Nagpur, Bhubaneswar, Visakhapatnam, Vijayawada, and many more",
        ],
      },
      {
        heading: "Why online-live beats nearby-classroom for AI in 2026",
        bullets: [
          "AI tools change monthly — physical institutes can't update curriculum fast enough",
          "Best mentors are practitioners, not professors — and the best practitioners work remotely",
          "Live cohort + recordings = catch-up flexibility no classroom offers",
          "Save 1-2 hours/day not commuting — invest in actual practice",
          "Build skills using the exact tooling you'll use in your job (cloud-based, online)",
          "Network across 10K+ Indian builders nationwide, not just your city",
        ],
      },
      {
        heading: "When in-person matters (and ONROL Hyderabad fits)",
        body: "There are valid reasons to want in-person: hands-on troubleshooting, network density, accountability, structured environment. ONROL's Hyderabad campus offers all four for learners who specifically want them. Most learners pick the online option because it's faster and more flexible — but if you're in or near Hyderabad and prefer in-person, that's available.",
        bullets: [
          "On-campus mentor sessions for Hyderabad cohort members",
          "Co-working space access during the 3-month intensive",
          "Direct access to the ONROL team",
          "Same persona-specific tracks — just delivered in-person",
        ],
      },
      {
        heading: "How to compare AI institutes 'near you' fairly",
        bullets: [
          "Don't filter by 'physical campus' — filter by 'live cohort + practitioner mentors + shipped projects'",
          "Ask about online vs offline: a hybrid that's online-default with optional in-person beats either extreme",
          "Check curriculum freshness (last update date) — that's a hard signal of whether they're keeping up",
          "Look at past-learner deploy URLs — geography of learner is irrelevant; output quality isn't",
          "INR pricing matters more than physical location — local institutes often charge more, not less",
        ],
      },
    ],
    faqs: [
      {
        q: "What are the AI institutes near me in India?",
        a: "Best answer in 2026: don't optimise for physical proximity — AI tooling moves too fast for classroom institutes. ONROL is fully online across India with a Hyderabad on-campus option. You join the live cohort from any city, with the same mentors and persona-specific projects.",
      },
      {
        q: "Are there AI institutes in my city in India?",
        a: "Most cities have local AI training providers, but quality varies wildly and most teach with stale curricula. ONROL's online cohort serves your city directly — same INR pricing, same mentors, no commute. Hyderabad has both online + on-campus options.",
      },
      {
        q: "Is online AI training as good as offline in India?",
        a: "For AI specifically: online is BETTER in 2026. Reason: AI tools are cloud-based, mentors are remote practitioners, and curriculum updates roll out instantly online. Physical institutes can't match the freshness or mentor quality.",
      },
      {
        q: "Does ONROL have a campus near me?",
        a: "ONROL has on-campus delivery in Hyderabad. For every other Indian city, the live online cohort is the path — same curriculum, same mentors, same deployed projects.",
      },
      {
        q: "Which is the best AI institute in Hyderabad?",
        a: "ONROL — Hyderabad is our home base. Both online + on-campus delivery. Persona-first across 12 personas. 3-month intensive. Free Masterclass.",
      },
      {
        q: "Which is the best AI institute in Bangalore / Mumbai / Delhi / Chennai?",
        a: "ONROL — fully online cohort accessible from any Indian city, with the same live mentor sessions and persona-specific projects regardless of where you join from. INR-priced.",
      },
    ],
    accent: "blue",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 15. AI Course Fees India (P0 — pricing intent)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "ai-course-fees-india",
    title: "AI Course Fees in India 2026 — What You Should Pay (and Avoid) | ONROL",
    metaDescription:
      "AI course fees in India 2026: ₹35k–₹4L typical range. ONROL's 3-month live cohort is INR-priced and includes year-long community + lifetime tools access. Free 90-minute Masterclass before you commit.",
    eyebrow: "— What AI training really costs in India",
    h1: "AI Course Fees in India",
    hook: "AI course fees in India range from ₹0 to ₹10L+. Most of that variance is brand premium — not value delivered.",
    intro:
      "AI course fees in India in 2026 span an absurd range: ₹0 (free university-affiliated theory programs), ₹35k (short bootcamps), ₹1.5L–₹4L (long PG diplomas with university branding), and ₹1L–₹10L (multi-year academic degrees). The honest truth: most of the price variance is brand-name premium, not training quality. Cost-per-shipped-project is the metric that matters. ONROL's 3-month live cohort sits in the mid-range on absolute fees but is the best value-for-money in India when you measure cost-per-deployed-project (3 projects shipped + year-long community + lifetime tools access). Free 90-minute Masterclass before you commit.",
    stats: [
      { value: "₹35k–₹4L", label: "Typical India range" },
      { value: "3", label: "Projects ONROL ships per learner" },
      { value: "₹0", label: "ONROL Free Masterclass" },
    ],
    sections: [
      {
        heading: "AI course fee categories in India (2026)",
        bullets: [
          "Free university-affiliated theory programs — semester-paced, ₹0, low completion rate (90%+ drop off)",
          "Short bootcamps (4–8 weeks) — ₹35k–₹80k, recorded video plus some live, mixed quality",
          "Mid-length programs (3–6 months) — ₹80k–₹1.5L, certificate-focused",
          "Long PG diplomas with university branding (9–12 months) — ₹1.5L–₹4L, HR-filter focus",
          "Placement-guarantee bootcamps (9–12 months) — ₹3L–₹4L, single-career-outcome (data scientist)",
          "Multi-year academic degrees (M.Tech / PhD) — ₹1L–₹10L, for research careers",
          "Self-paced video subscriptions — $20–80/month, requires high self-discipline",
        ],
      },
      {
        heading: "How to think about AI course fees correctly",
        body: "Don't ask 'what's cheapest?' or 'what's most premium?'. Ask 'cost per outcome'. The right metric is cost-per-shipped-project + cost-per-month-of-community-access + cost-per-mentor-hour. By those metrics, ONROL is in the best-value tier. Always-free programs cost ₹0 in fees but cost you 6 months of unfinished video time. Premium ₹4L programs cost ₹4L AND 12 months of life — for a certificate that may or may not get you hired.",
      },
      {
        heading: "Hidden costs to ask about",
        bullets: [
          "GST — most India-priced courses add 18% on top; check if quoted fee is inclusive",
          "Tools and APIs — some bootcamps make you pay $20–100/month in API fees during the program",
          "Recordings access — some charge separately for recordings after the live cohort ends",
          "Certificate fee — some charge ₹2k–₹10k extra to actually issue the certificate",
          "Community access duration — most expire after 3-6 months; ONROL gives 1 year",
          "Refund policy — what's the cancellation window? (ONROL: 7 days)",
        ],
      },
      {
        heading: "When 'expensive' is actually cheap",
        bullets: [
          "If a ₹1L program ships 5 deployed projects (₹20k/project), that's better value than a ₹35k program shipping 0 projects (infinite/project)",
          "If you'll earn ₹50k–₹2L/month freelance after — every fee is ROI-positive within 60 days",
          "If the community keeps you current for a year — that's worth ₹50k+ standalone",
          "If mentors are ACTIVELY shipping AI work — that's irreplaceable (and most cheap programs don't have it)",
        ],
      },
      {
        heading: "Red flags in AI course pricing in India",
        bullets: [
          "Inflated 'list price' with constant 'discounts' (₹4L → ₹50k 'this week only'). Real pricing is steady.",
          "Fee not shown on website — 'request a callback to know fees' = high-pressure sales coming",
          "USD pricing converted to INR without rate adjustment — ₹83/USD makes a $400 course look like ₹33k when it should be ₹15-20k for India",
          "Long no-refund policies — anything beyond 7 days is suspicious",
          "Mandatory 12-month commitment with no exit — flexible payment plans are standard now",
        ],
      },
    ],
    faqs: [
      {
        q: "What is the typical AI course fee in India?",
        a: "₹35k–₹4L depending on duration and brand. Short bootcamps: ₹35k–₹80k. Mid-length: ₹80k–₹1.5L. Long PG diplomas: ₹1.5L–₹4L. Multi-year academic degrees: ₹1L–₹10L. Free options exist but completion rates are <10%.",
      },
      {
        q: "How much does ONROL's AI course cost?",
        a: "ONROL's 3-month live cohort is INR-priced and includes year-long community access + lifetime access to tools.onrol.in (19+ AI tools). Specific fee details on the program page or via the Free Masterclass. The Free Masterclass itself is ₹0.",
      },
      {
        q: "Is there a free AI course in India?",
        a: "Yes — free university-affiliated programs and free video subscriptions exist. Drop-off rate is 90%+. Free works only if you've already finished 2-3 free AI courses and shipped projects. If you keep starting and not finishing, a paid cohort with deadlines is what you actually need.",
      },
      {
        q: "Are expensive AI courses worth it in India?",
        a: "Sometimes. The right metric is cost-per-shipped-project. A ₹4L course that ships 3 deployed projects (~₹1.3L per project) is decent value if the certificate matters for your goal. A ₹4L course that ships 0 projects is overpriced regardless. Always ask for 5 past-learner deploy URLs before paying.",
      },
      {
        q: "What's the cheapest good AI course in India?",
        a: "If you can stay disciplined, free university-affiliated theory programs are excellent at ₹0. If you need accountability + shipped projects, paid live cohorts in the ₹50k–₹1L range deliver the best ROI in India today.",
      },
      {
        q: "Are AI course EMI / payment plans available in India?",
        a: "Most paid programs offer EMI. Standard split: 3-month, 6-month, or 12-month installments via Razorpay / Cashfree. Check whether EMI carries a markup (some do, ~5-10%). Always read the cancellation clause before committing to long EMIs.",
      },
      {
        q: "Are AI courses GST-applicable in India?",
        a: "Yes — 18% GST applies on AI course fees in India. Some institutes quote inclusive prices, some quote ex-GST. Always confirm before signing.",
      },
      {
        q: "Is there a refund policy on AI courses in India?",
        a: "Industry standard is 7 days from cohort start. Some institutes offer 14-3 month windows; some offer none at all. Anything with no refund policy is a red flag — they're betting you won't ask.",
      },
    ],
    accent: "emerald",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 16. How to Choose an AI Institute in India (P0 — replaces ONROL-vs-X comparison)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "how-to-choose-ai-institute-india",
    title: "How to Choose an AI Institute in India 2026 — A 7-Question Filter | ONROL",
    metaDescription:
      "How to choose the right AI institute in India: 7 questions to ask any bootcamp before paying. Persona-first lens. Avoid the 90% of training that doesn't ship deployed projects.",
    eyebrow: "— A buyer's guide for AI training in India",
    h1: "How to Choose an AI Institute in India",
    hook: "Most Indian AI training is theory in volume. Use these 7 questions to filter before you spend a rupee.",
    intro:
      "Choosing an AI institute in India in 2026 is hard because the market is flooded — every ed-tech company added an 'AI' track, and brand-name premiums often don't correlate with actual training quality. The right way to choose: ignore brand, ignore duration, ignore certificate prestige. Run every option through 7 specific questions. If a course can't answer all 7 clearly, walk away — regardless of fee or reputation. This page is the filter we use. ONROL passes all 7 by design.",
    stats: [
      { value: "7", label: "Filter questions" },
      { value: "12", label: "Personas ONROL serves" },
      { value: "5d", label: "ONROL cohort length" },
    ],
    sections: [
      {
        heading: "Question 1 — What will I have at the end that I can show?",
        body: "Reject vague answers. The right answer names specific deliverables: 3 deployed AI projects with public URLs, a portfolio site, an AI-written ATS-beating resume, etc. If the institute talks about 'completion certificate' as the primary outcome, the certificate is the only output — not enough. Ask for 5 past-learner deploy URLs and verify them in your browser.",
      },
      {
        heading: "Question 2 — Are mentors active practitioners or theory-only?",
        body: "Ask for 5 mentor LinkedIn profiles. Check their activity in the last 90 days. If their last AI shipping post was 2 years ago, they're teaching theory. The best mentors are practitioners actively building AI products NOW — they bring fresh tools, fresh patterns, and real-world tradeoffs. ONROL's mentors all ship AI work weekly.",
      },
      {
        heading: "Question 3 — Is the curriculum updated within the last 6 months?",
        body: "AI tooling changes monthly. A curriculum built 12 months ago is missing entire categories of tools (AI agents, vibe coding platforms, MCP, etc.). Ask: 'When was the curriculum last revised?' Reject any answer over 6 months old.",
      },
      {
        heading: "Question 4 — Is there a free trial or Masterclass?",
        body: "Anything that won't show you the format before you pay is selling, not teaching. The Free Masterclass should be substantive (60-90 minutes minimum, with mentors, with at least one mini-project). Recorded marketing videos don't count. ONROL's Free Masterclass is live, hands-on, and ungated.",
      },
      {
        heading: "Question 5 — Is there an active alumni community?",
        body: "Community matters because AI changes monthly — a stale community of 50K is worse than a live community of 5K. Ask: 'How active is the alumni community? Can you show me sample conversations from this week?' If they can't, you're paying for content but not the network — and the network is the real long-term ROI.",
      },
      {
        heading: "Question 6 — Is pricing in INR with no high-pressure sales?",
        body: "INR-priced from day one (not converted USD). Honest pricing on the website (no 'callback to know fees'). No 'limited seats this week only' urgency theater. If you see any of these, you're being sold to, not enrolled. ONROL pricing is published, INR-native, and steady.",
      },
      {
        heading: "Question 7 — Does the institute fit MY persona?",
        body: "This is the question most learners skip and most institutes never ask. AI training built for 'aspiring data scientists with engineering degrees' fits ~10% of Indian learners. The other 90% (engineers in non-CS fields, students, teachers, founders, sales/marketing pros, real-estate agents, working professionals across all industries, freelancers, content creators, SMB owners, women returning to work, job-seekers) need persona-aligned tracks. ONROL is the only Indian AI institute built persona-first across 12 distinct personas.",
      },
    ],
    faqs: [
      {
        q: "How do I choose the right AI institute in India?",
        a: "Run every option through 7 questions: (1) What deliverable will I have at the end? (2) Are mentors active practitioners? (3) Curriculum updated in last 6 months? (4) Free trial / Masterclass available? (5) Active alumni community? (6) INR pricing without high-pressure sales? (7) Does it fit MY persona? An institute should pass all 7. ONROL is built to.",
      },
      {
        q: "How can I tell if an AI institute is a scam?",
        a: "Red flags: no public past-learner project URLs, mentors with no recent practitioner activity, curriculum >6 months old, no free trial, no published pricing, high-pressure 'limited seats' sales tactics, refund policy missing or <7 days. If you see 3+ of these, walk away.",
      },
      {
        q: "Should I pick a long or short AI course in India?",
        a: "Short (5-7 days intensive) with strong year-long community follow-up beats long (3-12 months) without. AI tools change monthly — what you finish a long course with is partly stale. Short + community + active practice = the best learning velocity in 2026.",
      },
      {
        q: "Should I pick an online or offline AI course in India?",
        a: "Online-first beats offline for AI in 2026. Reasons: AI tools are cloud-based, best mentors are remote practitioners, and online curriculum updates instantly. ONROL is fully online with a Hyderabad on-campus option for those who want it.",
      },
      {
        q: "How important is the certificate from an AI course in India?",
        a: "Less important than your portfolio of shipped projects. For HR-filter roles where the recruiter screens by university name, brand-name certificates help. For freelance, startup, in-job AI use, and modern AI roles — your shipped work matters far more.",
      },
      {
        q: "What questions should I ask before paying for an AI course in India?",
        a: "(1) Show me 5 past-learner deploy URLs. (2) Show me 5 mentor LinkedIn profiles with recent practitioner activity. (3) When was the curriculum last updated? (4) Is there a free Masterclass? (5) How active is the alumni community? (6) What's the refund policy? (7) Which of my persona's specific projects will I ship?",
      },
      {
        q: "What's the best AI institute for someone who isn't from a coding background?",
        a: "ONROL — purpose-built for non-coders across 12 personas (engineers in non-CS fields, students, teachers, founders, sales/marketing, real-estate, working pros, freelancers, content creators, SMB owners, women returning to work, job-seekers). No prior programming required.",
      },
    ],
    accent: "rose",
  },

  // ────────────────────────────────────────────────────────────────────────
  // Keyword-variant pillars (one URL per high-intent keyword)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "generative-ai-course-india",
    title: "Generative AI Course in India 2026 — Live Cohort, Hands-On, INR-Priced | ONROL",
    metaDescription: "Generative AI course in India 2026. Live 3-month cohort covering ChatGPT, Claude, Gemini, image generation (Midjourney, Stable Diffusion), and AI agents. No coding required. INR-priced. Free Masterclass.",
    eyebrow: "— India · 3-month live · INR-priced",
    h1: "Generative AI Course in India",
    hook: "Learn generative AI the way Indian builders actually use it in 2026: ChatGPT + Claude + Midjourney + AI agents, shipping deployed work in 3 months.",
    intro:
      "Searching for a generative AI course in India in 2026? Most options are recorded video courses written in 2023 — long, theoretical, and outdated within months. ONROL's Generative AI track is different. It's a 3-month live cohort where every learner ships generative AI projects: AI-written content systems, AI-image production pipelines, and AI-agent workflows. The curriculum is refreshed monthly because the field moves monthly. No coding required. INR-priced. Free 90-minute Masterclass to test before you commit.",
    stats: [
      { value: "30d", label: "Live cohort length" },
      { value: "5+", label: "Generative AI tools taught hands-on" },
      { value: "₹0", label: "Free Masterclass before paying" },
    ],
    sections: [
      {
        heading: "What 'generative AI' means in 2026 (and what to actually learn)",
        body: "Generative AI in 2026 is far broader than 'ChatGPT'. The practical skill stack Indian builders need is:",
        bullets: [
          "Text generation — ChatGPT, Claude, Gemini, plus prompt-engineering patterns that survive model upgrades",
          "Image generation — Midjourney, Ideogram, Krea, Stable Diffusion (for production, design, social content)",
          "Voice generation — ElevenLabs, OpenAI TTS (for podcasts, voice agents, Indian-language audio)",
          "Video generation — Veo 3, Sora 2, Pika, Runway (for short-form marketing and product demos)",
          "Music generation — Suno, Udio (for video backgrounds and audio branding)",
          "Code generation — vibe coding via Lovable, Bolt, Cursor, v0 (the highest-leverage skill in 2026)",
          "AI agent generation — multi-step agents built on OpenAI Assistants, Claude tools, n8n, custom LangGraph-style flows",
        ],
      },
      {
        heading: "What you'll ship in 3 months",
        body: "ONROL's Generative AI track is project-driven. Every learner walks out with deployed, public work — not certificates of attendance.",
        bullets: [
          "An AI-powered content production pipeline (3 platforms, automated cross-posting, weekly schedule)",
          "An AI image system for your industry (brand kit, social cards, product mockups, or thumbnails)",
          "A vibe-coded production website using generative tools you actually own",
          "A generative-AI agent that takes one repetitive task in your work and automates it end-to-end",
          "A portfolio site showcasing all four, deployed under your name with a real domain",
        ],
      },
      {
        heading: "Who this generative AI course is for",
        bullets: [
          "Content creators wanting to 5× output without sacrificing quality",
          "Marketers automating campaigns + content production",
          "Designers extending their workflow with AI image + video tools",
          "Founders shipping MVPs and marketing without hiring engineers",
          "Working professionals adding generative AI to their daily job — emails, decks, research, automation",
          "Freelancers building generative AI services as a new revenue stream",
          "Students building a hireable portfolio of generative AI work before graduation",
        ],
      },
      {
        heading: "Why ONROL's generative AI course beats recorded video courses",
        bullets: [
          "Live cohort — generative AI tools change monthly; recorded courses are stale by month 4",
          "Projects, not playlists — every week you ship something deployable, not 'watch and continue'",
          "Practitioner mentors actively shipping generative AI work in Indian companies",
          "INR-priced (not USD-converted) — Indian SMB and freelance pricing baked into examples",
          "Year-long ONROL Community access for ongoing tool drops, prompts, and freelance opportunities",
          "Lifetime access to tools.onrol.in — 19+ generative AI tools the team maintains",
          "Free 90-minute Masterclass to test the format before committing",
        ],
      },
      {
        heading: "How generative AI earns you money in India",
        bullets: [
          "Freelance content production — ₹20k–₹1L/month retainers (LinkedIn, blog, video, social)",
          "AI-generated design services — logos, brand identity, social kits (₹10k–₹50k/project)",
          "Vibe-coded websites for SMBs (₹15k–₹50k/project, 1–3 days delivery)",
          "AI-agent builds for clinics, real-estate, coaching (₹25k–₹1L/project + retainers)",
          "AI marketing campaigns and ad creative production for D2C brands",
          "In-job leverage — automate ~30% of your daily work, position for promotion or higher pay",
        ],
      },
    ],
    faqs: [
      { q: "What's the best generative AI course in India in 2026?", a: "Live cohorts beat recorded courses for generative AI because tools change monthly. ONROL's 3-month Generative AI track is India's most hands-on option — live mentors, deployed projects, INR-priced, no coding required." },
      { q: "Do I need coding to learn generative AI?", a: "No. Most generative AI in 2026 is no-code — ChatGPT/Claude UIs, Midjourney prompts, vibe-coded apps. ONROL is built for non-coders specifically." },
      { q: "How long does it take to learn generative AI?", a: "3 months for working competence, 60–90 days for selling generative AI services to clients. The skill compounds — month 3 is dramatically more productive than month 1." },
      { q: "Which generative AI tools should I learn first?", a: "Start with ChatGPT (or Claude), Midjourney (or Ideogram), and Lovable (or Bolt). Master those three before adding more. ONROL teaches you when to use each." },
      { q: "Can generative AI replace designers / writers / coders?", a: "It augments them, not replaces them. The valuable skill is being a designer / writer / coder who uses generative AI — you're 5× faster than your peers who don't." },
      { q: "What's the fee for ONROL's Generative AI course?", a: "INR-priced. See the program page for current cohort pricing or take the Free Masterclass first — there's no obligation to commit." },
    ],
    related: [
      { name: "ONROL AI Generalist (includes generative AI)", href: "/programs/ai-generalist/", blurb: "3-month intensive cohort." },
      { name: "Agentic AI course India", href: "/agentic-ai-course-india/", blurb: "Next step: AI agents that take actions." },
      { name: "Best AI institutes in India 2026", href: "/best-ai-institutes-in-india/", blurb: "Ranked comparison." },
      { name: "Top vibe coding training India", href: "/top-vibe-coding-training-india/", blurb: "Lovable, Bolt, Cursor, v0 hands-on." },
    ],
    accent: "violet",
  },

  {
    slug: "agentic-ai-course-india",
    title: "Agentic AI Course in India 2026 — Build AI Agents That Take Actions | ONROL",
    metaDescription: "Agentic AI course in India 2026. Build AI agents that book meetings, send emails, research markets, and complete multi-step workflows. Live 3-month cohort. OpenAI + Anthropic + n8n stack. INR-priced.",
    eyebrow: "— India · Agents, not chatbots · 2026",
    h1: "Agentic AI Course in India",
    hook: "Agentic AI isn't a chatbot — it's an AI that takes actions. Build agents that book meetings, send emails, run research, and automate multi-step workflows.",
    intro:
      "Agentic AI is the most over-talked-about, under-built category of 2026. Most 'AI agent' courses teach a single ChatGPT custom GPT and call it an agent. That's not agentic AI. Real agentic AI is multi-step, tool-using, decision-making software powered by an LLM that takes actions on your behalf — books a meeting, sends an email, queries a database, calls an API, posts to Slack, files a ticket. ONROL's Agentic AI course teaches you to build production-grade agents on the modern stack: OpenAI Assistants, Anthropic Claude with tool use, n8n for orchestration, MCP for tool standards, and vector databases for memory.",
    stats: [
      { value: "30d", label: "Live cohort length" },
      { value: "3+", label: "Production agents you'll ship" },
      { value: "₹0", label: "Free Masterclass first" },
    ],
    sections: [
      {
        heading: "What 'agentic AI' actually means",
        body: "An AI agent has four properties a chatbot doesn't have:",
        bullets: [
          "Goal-directed — it pursues a specific outcome, not just a single response",
          "Tool-using — it calls external APIs, databases, services, browsers, calendars",
          "Multi-step — it plans, executes, observes, replans (loop until done)",
          "Memory — it remembers context across turns and across sessions",
        ],
      },
      {
        heading: "What you'll build in 3 months",
        bullets: [
          "A sales-qualification agent that takes inbound leads, researches the company, scores fit, and writes a personalised first-touch email",
          "A research agent that runs multi-step web + document research, cites sources, and produces a structured report",
          "A customer-support agent that pulls from your help docs, answers questions, and escalates correctly",
          "A workflow agent that automates one repetitive multi-step task in your job (HR, finance, operations, marketing — depends on persona)",
          "A portfolio site showing each agent's behaviour with screenshots + deploy URLs",
        ],
      },
      {
        heading: "The 2026 agentic AI stack",
        bullets: [
          "OpenAI Assistants API + tool use (most mature)",
          "Anthropic Claude tool use + computer use (newest, most capable for complex reasoning)",
          "n8n / Make.com / LangGraph for orchestration of multi-step flows",
          "MCP (Model Context Protocol) for standardised tool integration",
          "Supabase or Pinecone for vector memory",
          "OpenAI Realtime API + ElevenLabs for voice agents (phone calls, IVR replacement)",
          "Evaluation frameworks — agents that aren't evaluated drift; ONROL teaches you to build eval suites",
        ],
      },
      {
        heading: "Who agentic AI is for",
        bullets: [
          "Engineers transitioning into AI engineering roles (highest-paying AI specialty in 2026)",
          "Founders building AI-first products where the agent IS the product",
          "Working professionals automating multi-step parts of their job (sales, ops, support)",
          "Freelancers offering agent-build services to Indian SMBs (₹50k–₹2L/agent + retainers)",
          "Product managers building 'AI co-pilot' features inside existing SaaS",
        ],
      },
      {
        heading: "How agentic AI services earn in India",
        bullets: [
          "Sales-agent builds for B2B SaaS — ₹50k–₹1L per project + maintenance retainer",
          "Customer-support agent builds for D2C brands — ₹30k–₹75k + monthly retainer",
          "Real-estate WhatsApp + voice agents — ₹25k–₹75k + retainer",
          "Clinic / coaching booking agents — ₹15k–₹50k + retainer",
          "Internal-ops agents (invoice processing, ticket triage) for mid-market companies — ₹1L–₹5L per project",
        ],
      },
    ],
    faqs: [
      { q: "Is agentic AI different from a chatbot?", a: "Yes — fundamentally. A chatbot answers questions. An agent takes actions: books, sends, queries, calls, posts. Multi-step, tool-using, goal-directed." },
      { q: "Do I need coding for agentic AI?", a: "Some coding helps for advanced agents, but ONROL covers the no-code path first (n8n + OpenAI Assistants UI + Make.com) before moving to API-level work. Non-coders ship working agents." },
      { q: "Which agentic AI framework should I learn?", a: "Start with OpenAI Assistants + n8n. Add Anthropic Claude tool use in week 3. LangGraph/LangChain after the cohort if you want pure-code orchestration." },
      { q: "How long does it take to learn agentic AI?", a: "3 months for working competence on a single agent type. 90 days for production-grade agents you can sell or deploy at scale." },
      { q: "Is agentic AI the future of AI?", a: "It's the present. Every major AI company (OpenAI, Anthropic, Google, Microsoft) is pivoting product around agents in 2026. Learning agentic AI now is a 5-year career advantage." },
      { q: "What's the fee for ONROL's Agentic AI course?", a: "INR-priced. Check the program page for current cohort pricing or take the Free Masterclass first." },
    ],
    related: [
      { name: "ONROL AI Generalist (foundation)", href: "/programs/ai-generalist/", blurb: "Start here if new to AI." },
      { name: "ONROL AI Architect (advanced)", href: "/programs/ai-architect/", blurb: "Production-grade agentic AI." },
      { name: "Generative AI course India", href: "/generative-ai-course-india/", blurb: "Companion track." },
      { name: "AI automation course India", href: "/ai-automation-course/", blurb: "n8n / Make / Zapier deep dive." },
    ],
    accent: "cyan",
  },

  {
    slug: "ai-engineer-course-india",
    title: "AI Engineer Course in India 2026 — Land an AI Engineering Job | ONROL",
    metaDescription: "AI engineer course in India 2026. Learn the AI engineering stack: LLM APIs, RAG, fine-tuning, vector databases, agents, evaluations, MLOps. Build a hireable portfolio in 3 months. Live cohort.",
    eyebrow: "— India · For aspiring AI engineers · 2026",
    h1: "AI Engineer Course in India",
    hook: "The AI engineer role is the highest-paying technical role in India in 2026 — and the most under-supplied. Here's how to become one in 3 months of focused work.",
    intro:
      "Indian companies are hiring AI engineers at salaries ₹15L–₹60L per annum in 2026, and the supply is nowhere near demand. The role is not 'classical ML engineer' (Kaggle + PyTorch from scratch). It's 'AI engineer' — someone who ships production AI features using LLM APIs, RAG, fine-tuning, vector databases, agents, evaluations, and modern MLOps. ONROL's AI Engineer track gets engineers from any background (CSE, ECE, mech, data science, full-stack) into shipping production AI features in 3 months, with a portfolio that gets you AI engineer interviews.",
    stats: [
      { value: "₹15–60L", label: "AI engineer salaries India 2026" },
      { value: "30d", label: "Cohort to portfolio" },
      { value: "3+", label: "Production AI features shipped" },
    ],
    sections: [
      {
        heading: "What an AI engineer actually does (2026 reality)",
        body: "AI engineering is application-layer AI, not foundation-model research. You're not training GPT — you're building products on top of it.",
        bullets: [
          "Integrate LLM APIs (OpenAI, Anthropic, Google) into production codebases",
          "Build RAG pipelines (retrieval-augmented generation) using vector databases (Pinecone, Weaviate, Supabase pgvector)",
          "Fine-tune small models (LoRA, QLoRA) on company-specific data",
          "Design AI agent architectures (multi-step, tool-using, evaluated)",
          "Write evaluation suites — the most under-taught and most important AI engineering skill",
          "Optimise cost + latency of LLM calls in production (caching, batching, model routing)",
          "Build feedback loops + observability (LangFuse, Helicone, Langsmith) for shipped AI features",
        ],
      },
      {
        heading: "The 2026 AI engineering stack ONROL teaches",
        bullets: [
          "LLM APIs — OpenAI, Anthropic Claude, Google Gemini, Mistral, Sarvam",
          "RAG infrastructure — Pinecone, Weaviate, Supabase pgvector, Postgres + pgvector",
          "Orchestration — LangChain, LangGraph, LlamaIndex, n8n for workflows",
          "Agent frameworks — OpenAI Assistants, Anthropic tool use, MCP",
          "Fine-tuning — LoRA, QLoRA, OpenAI fine-tuning, Together AI",
          "Evaluation — Ragas, OpenAI Evals, custom eval harnesses",
          "Observability — LangFuse, Helicone, LangSmith, Langtail",
          "Deployment — Vercel, Railway, AWS Lambda, Cloudflare Workers AI",
        ],
      },
      {
        heading: "What you'll ship in 3 months",
        bullets: [
          "A production-quality RAG application (chat with your company's docs)",
          "A multi-step AI agent with tool use, memory, and evaluation",
          "A fine-tuned model on a domain-specific dataset (small but real)",
          "A cost-optimised LLM pipeline with caching, fallback routing, and observability",
          "A public portfolio site documenting each — code on GitHub, demo URLs, eval reports",
        ],
      },
      {
        heading: "Who AI engineer track is for",
        bullets: [
          "CSE/IT graduates wanting an AI engineering role (₹15–₹30L starting in 2026)",
          "Working engineers (any branch) transitioning into AI (₹25–₹60L for senior roles)",
          "Full-stack developers adding AI features to existing products",
          "Data scientists pivoting from classical ML to LLM-era applications",
          "Backend engineers seeing AI eat their job category — get ahead of it",
        ],
      },
      {
        heading: "Salary + hiring outcomes Indian AI engineers see in 2026",
        bullets: [
          "Entry-level AI engineer (0–2 years experience): ₹15–₹30L total comp at product companies",
          "Mid-level AI engineer (3–6 years): ₹30–₹50L total comp",
          "Senior AI engineer / AI lead (6+ years): ₹50L–₹1Cr+ at top product companies",
          "AI engineer at Indian startups (Razorpay, CRED, Postman, Sarvam, etc.): ₹20–₹60L depending on level",
          "International remote AI engineering roles (US/EU companies hiring from India): ₹40L–₹1.5Cr",
        ],
      },
      {
        heading: "Why ONROL's AI engineer track works",
        bullets: [
          "Application-layer focus — what Indian companies actually hire for (not Kaggle competitions)",
          "Mentors are practicing AI engineers at Indian product companies",
          "Curriculum updated monthly — the stack moves monthly, the course must too",
          "Real portfolio outputs that get you interviews, not just certificates",
          "Mock interview prep — AI engineering interviews are RAG, agent design, evals — we drill these",
          "Live cohort — your peer group becomes your AI engineering network for the next 5 years",
        ],
      },
    ],
    faqs: [
      { q: "What's the difference between an AI engineer and an ML engineer?", a: "ML engineers train models. AI engineers ship features built on top of pre-trained foundation models (GPT, Claude). The 2026 hiring boom is for AI engineers — far broader market than ML engineers." },
      { q: "Do I need a Computer Science degree to be an AI engineer?", a: "Most AI engineer roles in India in 2026 require CSE/IT/related degree as a baseline. Some product startups hire on portfolio quality alone — that's what ONROL's track focuses on." },
      { q: "What's the AI engineer salary in India in 2026?", a: "₹15–₹30L for entry-level, ₹30–₹50L for mid-level, ₹50L–₹1Cr+ for senior. International remote AI roles hiring from India: up to ₹1.5Cr." },
      { q: "How long does it take to become an AI engineer?", a: "3 months of focused work for an entry-level portfolio. 90 days for a senior-quality portfolio. Continuous learning after that — the field moves monthly." },
      { q: "Is AI engineering a good career in India in 2026?", a: "Highest-leverage technical career in India for the next 5 years. Demand massively exceeds supply. Salaries are 2–3× standard SWE salaries in product companies." },
      { q: "What's the fee for ONROL's AI engineer course?", a: "INR-priced. See the program page or take the Free Masterclass first to evaluate fit." },
    ],
    related: [
      { name: "ONROL AI Architect (advanced)", href: "/programs/ai-architect/", blurb: "Production-grade AI engineering." },
      { name: "Agentic AI course India", href: "/agentic-ai-course-india/", blurb: "Specialise in agents." },
      { name: "AI skills most in demand in India 2026", href: "/blog/ai-skills-most-in-demand-india-2026/", blurb: "Market data." },
      { name: "Best AI institutes in India 2026", href: "/best-ai-institutes-in-india/", blurb: "Ranked comparison." },
    ],
    accent: "blue",
  },

  // ────────────────────────────────────────────────────────────────────────
  // 17–24. City pages (P1 local SEO hubs)
  // ────────────────────────────────────────────────────────────────────────
  ...buildCityPillar({
    slug: "ai-institute-hyderabad",
    city: "Hyderabad",
    state: "Telangana",
    areas: ["Banjara Hills", "Jubilee Hills", "Madhapur", "HITEC City", "Gachibowli", "Begumpet", "Kondapur", "Kukatpally", "Kothaguda", "Ameerpet", "Secunderabad"],
    extraNote: "Hyderabad is ONROL's home base — both online + on-campus delivery from the Jubilee Hills campus. Hyderabad is also India's strongest AI ecosystem city, home to IIT Hyderabad and IIIT Hyderabad (two of India's top AI research institutions), Microsoft Research India, the Government of Telangana's AI Mission, and a dense cluster of AI-first startups.",
    onCampus: true,
    extraSections: [
      {
        heading: "Why Hyderabad is India's leading AI city in 2026",
        body: "Hyderabad isn't just another tech city — it's the city with the densest AI ecosystem in India, which makes choosing an AI institute here different from anywhere else in the country.",
        bullets: [
          "Home to IIT Hyderabad — first IIT in India to launch a B.Tech in AI (2019), one of the top academic AI institutions globally",
          "Home to IIIT Hyderabad — strongest non-IIT AI research school in India, with flagship labs CVIT (computer vision) and LTRC (language tech)",
          "Microsoft Research India — Hyderabad office is one of Microsoft's largest AI research outposts globally",
          "Government of Telangana's AI Mission — the only Indian state with a dedicated AI policy, AI City initiative, and active AI sandbox programs",
          "Dense cluster of AI startups — Sarvam AI partners, Indian generative-AI lab leadership, multiple unicorn AI companies headquartered in HITEC City",
          "Strong placement pipeline — Microsoft, Google, Amazon, Razorpay, Salesforce, ServiceNow, Uber, Meta all have major Hyderabad offices hiring AI talent",
          "Hindi + Telugu + English ecosystem — mentors and case studies in three languages, broader than other Indian tech hubs",
        ],
      },
      {
        heading: "Where ONROL's Hyderabad campus sits",
        body: "ONROL is based in Jubilee Hills (Plot No. 288, Road No. 78, 500013), central to the city's AI hub. The campus serves on-campus cohorts plus a co-working space for online cohort participants who want occasional in-person mentor sessions.",
        bullets: [
          "12 minutes from HITEC City via the Khajaguda flyover",
          "10 minutes from Banjara Hills + Filmnagar tech-startup clusters",
          "15 minutes from Gachibowli Financial District",
          "25 minutes from Madhapur + Kondapur via the inner ring road",
          "35 minutes from Kukatpally (KPHB) + Miyapur via outer ring road",
          "20 minutes from Begumpet — direct connectivity by metro + cab",
        ],
      },
      {
        heading: "Areas of Hyderabad ONROL serves directly",
        body: "Online cohort covers every neighbourhood. On-campus delivery is concentrated in central Hyderabad. Specific area-wise resources:",
        bullets: [
          "Kondapur — separate area page at /ai-institute-kondapur/ with Kondapur-specific guidance",
          "Gachibowli — separate area page at /ai-institute-gachibowli/ — IT-corridor learner profile",
          "Madhapur — separate area page at /ai-institute-madhapur/ — HITEC City adjacency",
          "Kukatpally (KPHB) — separate area page at /ai-institute-kukatpally/ — JNTU + working professionals",
          "HITEC City — separate area page at /ai-institute-hitech-city/ — Cyber Towers + Mindspace",
          "Banjara Hills, Jubilee Hills — direct on-campus walk-in distance",
          "Ameerpet, Begumpet, Secunderabad — strong metro connectivity to the campus",
        ],
      },
      {
        heading: "Hyderabad AI ecosystem — companies hiring AI talent in 2026",
        body: "Hyderabad's AI hiring is concentrated in five clusters. Knowing which one you want to work in changes your ideal training path.",
        bullets: [
          "Big-tech R&D centres — Microsoft, Google, Amazon, Meta, Apple (Hyderabad has India's largest concentration of these AI R&D offices)",
          "Indian SaaS unicorns — Postman, Darwinbox, Skuad, plus dozens of growth-stage AI-first companies",
          "Financial-services tech — Razorpay, Salesforce, ServiceNow, Wells Fargo, Bank of America (heavy AI engineering hiring)",
          "Healthcare AI — multiple Hyderabad-based health-tech startups using AI for diagnostics, RCM, clinical NLP",
          "Government + research — Telangana State Innovation Cell, IIIT-H research labs, Microsoft Research India, IIT-H labs",
        ],
      },
      {
        heading: "How ONROL compares to other Hyderabad AI training options",
        body: "Hyderabad has the most crowded AI training market in India. Here's an honest categorical comparison so you can pick the right fit for your goal.",
        bullets: [
          "Long-form IT-training institutes (NareshIT, NIIT, Aptech, multiple Ameerpet players) — 4–9 months, mixed delivery, traditional curriculum, established placement reputations",
          "University-affiliated AI programs — IIT Hyderabad B.Tech AI (4 years), IIIT-H MS by Research (2 years), JNTU-H affiliated colleges — academic depth",
          "Skill-academy bootcamps — Newton School, AlmaBetter, MaskedHashtag (8–12 month placement-guarantee programs)",
          "International cohort platforms (Scaler, Coursera, upGrad) — branded, longer, USD-converted pricing",
          "ONROL — 3-month intensive, persona-first across 12 personas, applied AI focus, INR-priced, deployed projects as outcome, free Masterclass before committing",
        ],
      },
      {
        heading: "What makes ONROL different in the Hyderabad market",
        bullets: [
          "3 months vs 4–12 months — much faster outcome cycle",
          "Persona-first project tracks — same cohort runs 12 distinct project archetypes, while other Hyderabad institutes pick one career outcome (usually data scientist)",
          "No coding background required — most Hyderabad AI institutes still assume Python proficiency on day 1",
          "Live cohort with practitioner mentors — not pre-recorded video or lecture-hall academic delivery",
          "Curriculum refreshed monthly — vibe coding tools (Lovable, Bolt, v0) and agentic AI tools (MCP, Claude tool use) covered the week they launch",
          "Free 90-minute Masterclass with the actual format and mentors — most Hyderabad institutes give only a brochure or a sales call",
          "Year-long ONROL Community access included — 10K+ Indian builders, including a strong Hyderabad chapter",
          "Lifetime access to tools.onrol.in — 19+ working AI tools the ONROL team maintains",
        ],
      },
      {
        heading: "Next cohort batches in Hyderabad",
        body: "ONROL runs new 3-month cohorts monthly. Batches alternate weekday-evening (7–9 PM) and weekend (Sat-Sun, 10 AM–1 PM) schedules so working professionals + students can both attend. On-campus availability is in Jubilee Hills; online is from anywhere in Hyderabad or India.",
        bullets: [
          "Next online + on-campus cohort: announced monthly — check the live program page for current dates",
          "Free Masterclass: weekly, 90 minutes, live, no recording, no pitch",
          "Weekend batch option: ideal for working professionals in HITEC City, Gachibowli, Madhapur",
          "Weekday-evening batch: ideal for students and freelancers with flexible day schedules",
          "Custom corporate cohorts: ONROL runs in-house batches for Hyderabad-based companies — contact for B2B pricing",
        ],
      },
      {
        heading: "Hyderabad-specific success stories",
        body: "ONROL learners in Hyderabad have shipped real work to real outcomes — across the personas served:",
        bullets: [
          "Hyderabad-based freelance AI consultant — picked up 3 SMB clients in month 1, scaled to ₹1.2L/month by month 4",
          "Madhapur teacher — built an AI lesson-plan tool that now generates ₹40k/month from coaching institutes",
          "Gachibowli SaaS founder — shipped MVP in week 1 of the cohort, raised seed funding within 4 months",
          "KPHB engineering student — landed AI engineer role at a Hyderabad fintech 2 months after graduation portfolio launch",
          "Banjara Hills boutique owner — automated WhatsApp + Instagram customer support, reclaimed 15 hours/week",
          "Working professional at HITEC City — automated ~35% of daily ops job, promoted within 90 days of cohort completion",
        ],
      },
      {
        heading: "How to evaluate any AI institute in Hyderabad (6-point checklist)",
        body: "If you're shortlisting AI institutes in Hyderabad in 2026, run them through this filter before paying:",
        bullets: [
          "Ask for 5 alumni LinkedIn profiles + 5 deployed project URLs from past Hyderabad cohorts. Verify both.",
          "Ask which Hyderabad employers their alumni have joined in the last 12 months — and ask for one verifiable contact.",
          "Take the free trial or Masterclass — substantively, not a 15-minute marketing webinar.",
          "Check curriculum freshness — anything older than 6 months in AI is stale. Ask for the curriculum's last revision date in writing.",
          "Search the institute name + 'review' on Reddit, Quora, JustDial, Trustpilot. Read the negative reviews carefully.",
          "Calculate cost-per-shipped-project: fee divided by number of projects you walk out with. Anything over ₹50k/project is overpriced in 2026.",
        ],
      },
    ],
    extraFaqs: [
      { q: "Where is ONROL's Hyderabad campus located?", a: "Plot No. 288, Road No. 78, Jubilee Hills, Hyderabad 500013. Central to the AI hub — 10 minutes from Banjara Hills, 12 minutes from HITEC City, 15 minutes from Gachibowli Financial District, 25 minutes from Madhapur + Kondapur." },
      { q: "Does ONROL offer on-campus AI training in Hyderabad?", a: "Yes. Both online and on-campus delivery from the Jubilee Hills campus. On-campus cohort runs monthly, with optional in-person mentor sessions available for online cohort participants who want occasional face-to-face time." },
      { q: "Is ONROL better than NareshIT, NIIT, Aptech for AI in Hyderabad?", a: "Different category. Traditional IT-training institutes in Hyderabad run 4–9 month courses optimised for placements in services companies. ONROL runs a 3-month intensive optimised for shipped projects, applied AI, and 12-persona-specific outputs. Pick by goal: brand-recognised certificate for HR filtering → traditional institute; shipped portfolio + applied AI skills → ONROL." },
      { q: "How does ONROL compare to IIT Hyderabad's AI program?", a: "Completely different paths. IIT Hyderabad's B.Tech AI (4 years) is academic — research career, ML engineering at top labs. ONROL's 3-month cohort is applied — using AI in your work, freelance, business, or career switch within months. Both valid; choose by goal." },
      { q: "Can I join ONROL's Hyderabad cohort if I work full-time?", a: "Yes — weekend batches (Sat-Sun, 10 AM–1 PM) and weekday-evening batches (7–9 PM) accommodate working professionals across HITEC City, Gachibowli, Madhapur, Banjara Hills, and beyond." },
      { q: "Does ONROL provide placement support in Hyderabad?", a: "Direct placement isn't promised, but ONROL equips you for three career paths: (1) AI roles at Hyderabad product companies + startups via the alumni network, (2) freelance AI services to Hyderabad SMBs, (3) applied AI within your current job for promotion. Alumni in Hyderabad have joined Microsoft, Razorpay, ServiceNow, and multiple AI startups via the network." },
      { q: "What's the AI course fee in Hyderabad in 2026?", a: "Hyderabad institutes vary widely: ₹35k (short bootcamps) up to ₹4L (long placement-guarantee programs). ONROL's 3-month cohort is INR-priced in the mid-range when measured by cost-per-deployed-project — see the program page or take the Free Masterclass for current fee." },
    ],
    extraRelated: [
      { name: "Hyderabad neighbourhoods — Kondapur", href: "/ai-institute-kondapur/", blurb: "Kondapur AI institute page." },
      { name: "Hyderabad neighbourhoods — Gachibowli", href: "/ai-institute-gachibowli/", blurb: "Gachibowli AI institute page." },
      { name: "Hyderabad neighbourhoods — Madhapur", href: "/ai-institute-madhapur/", blurb: "Madhapur AI institute page." },
      { name: "Hyderabad neighbourhoods — Kukatpally", href: "/ai-institute-kukatpally/", blurb: "KPHB AI institute page." },
      { name: "Hyderabad neighbourhoods — HITEC City", href: "/ai-institute-hitech-city/", blurb: "HITEC City AI institute page." },
      { name: "Telangana state AI institutes", href: "/ai-institute-telangana/", blurb: "State-wide AI training context." },
    ],
  }),
  ...buildCityPillar({
    slug: "ai-institute-bangalore",
    city: "Bangalore",
    altCity: "Bengaluru",
    state: "Karnataka",
    areas: ["Koramangala", "HSR Layout", "Indiranagar", "Whitefield", "Electronic City", "MG Road", "BTM Layout"],
  }),
  ...buildCityPillar({
    slug: "ai-institute-mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    areas: ["Andheri", "Powai", "BKC", "Lower Parel", "Bandra", "Goregaon"],
  }),
  ...buildCityPillar({
    slug: "ai-institute-delhi",
    city: "Delhi",
    altCity: "NCR",
    state: "Delhi NCR",
    areas: ["Connaught Place", "Saket", "Gurgaon / Gurugram", "Noida", "Greater Noida", "Faridabad", "Ghaziabad"],
  }),
  ...buildCityPillar({
    slug: "ai-institute-chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    areas: ["T. Nagar", "OMR", "Anna Nagar", "Velachery", "Adyar", "Tambaram"],
  }),
  ...buildCityPillar({
    slug: "ai-institute-pune",
    city: "Pune",
    state: "Maharashtra",
    areas: ["Hinjewadi", "Kharadi", "Baner", "Aundh", "Viman Nagar", "Kothrud"],
  }),
  ...buildCityPillar({
    slug: "ai-institute-kolkata",
    city: "Kolkata",
    state: "West Bengal",
    areas: ["Salt Lake", "Park Street", "New Town", "Howrah", "Ballygunge"],
  }),
  ...buildCityPillar({
    slug: "ai-institute-ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat",
    areas: ["SG Highway", "Bopal", "Prahlad Nagar", "Maninagar", "Vastrapur"],
  }),

  // ── Hyderabad neighbourhood pages (hyper-local long-tail) ────────────
  ...buildCityPillar({
    slug: "ai-institute-kondapur",
    city: "Kondapur",
    state: "Telangana",
    areas: ["Kothaguda", "Botanical Garden Road", "Gachibowli border", "Kothaguda Junction", "Serilingampally", "near Sarath City Mall"],
    extraNote: "Kondapur learners join the same Hyderabad-based ONROL cohort — online or on-campus at Jubilee Hills.",
    onCampus: true,
  }),
  ...buildCityPillar({
    slug: "ai-institute-gachibowli",
    city: "Gachibowli",
    state: "Telangana",
    areas: ["Financial District", "Wipro Circle", "DLF Cyber City Junction", "Nallagandla", "Tellapur"],
    extraNote: "Gachibowli is 12 km from ONROL's Jubilee Hills campus — online cohort plus optional on-campus mentor sessions.",
    onCampus: true,
  }),
  ...buildCityPillar({
    slug: "ai-institute-madhapur",
    city: "Madhapur",
    state: "Telangana",
    areas: ["HITEC City", "Image Hospital Road", "Inorbit Mall area", "Ayyappa Society", "Kavuri Hills"],
    extraNote: "Madhapur sits in the heart of Hyderabad's IT corridor — ONROL serves Madhapur engineers + working professionals online with optional Jubilee Hills campus visits.",
    onCampus: true,
  }),
  ...buildCityPillar({
    slug: "ai-institute-kukatpally",
    city: "Kukatpally",
    state: "Telangana",
    areas: ["KPHB Colony", "JNTU Hyderabad area", "Hydernagar", "Miyapur border", "Pragathi Nagar"],
    extraNote: "Kukatpally (KPHB) is one of Hyderabad's largest student + working-professional hubs. ONROL's online cohort + Jubilee Hills campus serve every KPHB learner.",
    onCampus: true,
  }),
  ...buildCityPillar({
    slug: "ai-institute-hitech-city",
    city: "HITEC City",
    altCity: "HiTech City",
    state: "Telangana",
    areas: ["Cyber Towers", "Mindspace", "Raheja IT Park", "Q City", "Inorbit area"],
    extraNote: "HITEC City is Hyderabad's IT epicentre — ONROL's online cohort suits the working-professional schedules common here, with on-campus mentor sessions at Jubilee Hills.",
    onCampus: true,
  }),

  // ── Bangalore neighbourhood pages ─────────────────────────────────────
  ...buildCityPillar({
    slug: "ai-institute-whitefield",
    city: "Whitefield",
    state: "Karnataka",
    areas: ["ITPL", "Brookefield", "Kadugodi", "Hoodi", "Mahadevapura", "Marathahalli border"],
    extraNote: "Whitefield is Bangalore's largest tech corridor. ONROL's online cohort serves Whitefield learners with weekend / evening options that fit IT work schedules.",
  }),
  ...buildCityPillar({
    slug: "ai-institute-koramangala",
    city: "Koramangala",
    state: "Karnataka",
    areas: ["1st Block", "5th Block", "Forum Mall area", "Sarjapur Road junction", "BTM border", "HSR border"],
    extraNote: "Koramangala is Bangalore's startup capital — ONROL's founder + freelancer persona tracks are particularly strong matches for Koramangala learners.",
  }),

  // ── Tier-2 city pages (high-search, low-competition) ──────────────────
  ...buildCityPillar({
    slug: "ai-institute-visakhapatnam",
    city: "Visakhapatnam",
    altCity: "Vizag",
    state: "Andhra Pradesh",
    areas: ["MVP Colony", "Dwaraka Nagar", "Beach Road", "Madhurawada", "Rushikonda", "Gajuwaka"],
    extraNote: "Visakhapatnam (Vizag) is one of Andhra Pradesh's fastest-growing tech cities — ONROL's fully-online cohort is accessible from every Vizag neighbourhood.",
  }),
  ...buildCityPillar({
    slug: "ai-institute-jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    areas: ["Malviya Nagar", "C-Scheme", "Vaishali Nagar", "Mansarovar", "Jagatpura", "Tonk Road"],
    extraNote: "Jaipur is Rajasthan's startup and IT hub — ONROL's online cohort, INR pricing, and Hindi-friendly mentors fit Jaipur learners well.",
  }),
  ...buildCityPillar({
    slug: "ai-institute-coimbatore",
    city: "Coimbatore",
    state: "Tamil Nadu",
    areas: ["RS Puram", "Saibaba Colony", "Peelamedu", "Race Course", "Tidel Park area", "Singanallur"],
    extraNote: "Coimbatore is Tamil Nadu's manufacturing + IT hub — ONROL's online cohort serves Coimbatore engineers, students, and SMB owners.",
  }),
  ...buildCityPillar({
    slug: "ai-institute-indore",
    city: "Indore",
    state: "Madhya Pradesh",
    areas: ["Vijay Nagar", "AB Road", "Palasia", "Bhawarkuan", "Rajwada", "Super Corridor"],
    extraNote: "Indore is Madhya Pradesh's commercial and IT capital — ONROL's online cohort with INR pricing fits Indore learners and SMB owners.",
  }),
  ...buildCityPillar({
    slug: "ai-institute-lucknow",
    city: "Lucknow",
    state: "Uttar Pradesh",
    areas: ["Hazratganj", "Gomti Nagar", "Aliganj", "Indira Nagar", "Alambagh", "Mahanagar"],
    extraNote: "Lucknow is Uttar Pradesh's capital and growing IT hub — ONROL's fully online cohort with Hindi-friendly mentors is a strong fit.",
  }),

  // ────────────────────────────────────────────────────────────────────────
  // 25–30. State pages (P1 — broader local SEO than city pages)
  // ────────────────────────────────────────────────────────────────────────
  ...buildStatePillar({
    slug: "ai-institute-telangana",
    state: "Telangana",
    cities: ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar"],
    isHomeState: true,
  }),
  ...buildStatePillar({
    slug: "ai-institute-karnataka",
    state: "Karnataka",
    cities: ["Bangalore (Bengaluru)", "Mysore", "Mangalore", "Hubli", "Belgaum"],
  }),
  ...buildStatePillar({
    slug: "ai-institute-maharashtra",
    state: "Maharashtra",
    cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  }),
  ...buildStatePillar({
    slug: "ai-institute-tamil-nadu",
    state: "Tamil Nadu",
    cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  }),
  ...buildStatePillar({
    slug: "ai-institute-andhra-pradesh",
    state: "Andhra Pradesh",
    cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore"],
  }),
  ...buildStatePillar({
    slug: "ai-institute-gujarat",
    state: "Gujarat",
    cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  }),

  // ────────────────────────────────────────────────────────────────────────
  // 31–36. Industry pages (P1 — sector-specific, complementary to personas)
  // ────────────────────────────────────────────────────────────────────────
  ...buildIndustryPillar({
    slug: "ai-for-healthcare-india",
    industry: "Healthcare",
    industryLower: "healthcare",
    audiences: ["doctors", "clinics", "hospitals", "diagnostic labs", "medical practitioners"],
    useCases: [
      "AI medical-record summarisation — patient files → 60-second briefings before consultation",
      "AI symptom triage agents on WhatsApp for clinic frontline screening",
      "Medical-imaging vision AI for X-ray / MRI / CT pre-screening",
      "Auto-generate patient discharge summaries + follow-up reminders",
      "AI-assisted billing + insurance claim processing (pre-fill claim forms from notes)",
      "Clinical research assistant agents that scan PubMed for relevant new studies daily",
      "Multi-lingual patient communication (Hindi / Tamil / Telugu / Bengali)",
    ],
    earnPath: "Reduce admin time 30-50%, increase patient throughput, deliver better care without hiring more staff.",
  }),
  ...buildIndustryPillar({
    slug: "ai-for-legal-india",
    industry: "Legal",
    industryLower: "legal",
    audiences: ["lawyers", "law firms", "in-house counsel", "legal researchers", "paralegals"],
    useCases: [
      "Contract review AI agent — flag risky clauses, missing protections, non-standard language",
      "Case-law research assistant — query Indian + international case databases conversationally",
      "Auto-draft standard contract templates (NDAs, employment, vendor agreements) from briefs",
      "Discovery automation — scan thousands of documents for relevance",
      "Client intake bot — qualify and route enquiries 24/7",
      "Compliance monitoring — track regulatory updates across SEBI, RBI, MCA, CCI feeds",
      "Multi-lingual document translation for Indian regional languages",
    ],
    earnPath: "Bill 2-3x more matters with the same hours, reduce associate-time on routine review by 60%, productize legal services.",
  }),
  ...buildIndustryPillar({
    slug: "ai-for-fintech-india",
    industry: "Fintech",
    industryLower: "fintech",
    audiences: ["fintech founders", "banking professionals", "wealth managers", "credit analysts", "payment-ops teams"],
    useCases: [
      "AI fraud-detection agents on transaction streams (UPI, card, wallet)",
      "Conversational customer support bot on WhatsApp for account / payment queries",
      "Credit risk assessment with explainable-AI rationale for compliance",
      "Auto-generate compliance reports for RBI / SEBI from raw transaction data",
      "Investment-research agent — earnings calls, filings, news → analyst-quality briefings",
      "Personalised financial planning agents for end customers",
      "KYC document parsing + verification automation",
    ],
    earnPath: "Cut ops cost 30-50%, ship product faster, scale customer support without scaling headcount.",
  }),
  ...buildIndustryPillar({
    slug: "ai-for-hospitality-india",
    industry: "Hospitality",
    industryLower: "hospitality",
    audiences: ["restaurant owners", "hotel managers", "café entrepreneurs", "cloud kitchen operators", "tourism operators"],
    useCases: [
      "WhatsApp reservation + booking AI bot, multi-lingual",
      "Auto-respond to Google / Zomato / TripAdvisor reviews — protect ratings 24/7",
      "AI menu engineering — optimise dish profitability + customer-favourites pairing",
      "Staff-shift forecasting from booking + walk-in patterns",
      "AI-powered marketing content for IG / Reels / WhatsApp Status, daily",
      "Personalised guest experience — agent remembers preferences, suggests upsells",
      "Inventory + ordering automation tied to demand forecasting",
    ],
    earnPath: "Increase repeat customers 40%+, save ₹50k+/month on staff time, capture leads while closed.",
  }),
  ...buildIndustryPillar({
    slug: "ai-for-edtech-india",
    industry: "EdTech",
    industryLower: "edtech",
    audiences: ["edtech founders", "online educators", "coaching institute owners", "course creators", "tutors"],
    useCases: [
      "Personalised AI tutor agents trained on your course material",
      "Auto-generate quizzes, assignments, and assessment rubrics per chapter",
      "Student progress dashboards with AI-flagged learning gaps",
      "Multi-lingual content delivery — translate your courses into 8+ Indian languages",
      "AI-driven lead qualification for prospective students",
      "Automated student support — handle FAQs, refund queries, technical support",
      "Cohort-management AI — schedule, remind, follow up, certify automatically",
    ],
    earnPath: "Scale to 10x students with same team, premium-price personalised offerings, build moat via proprietary AI.",
  }),
  ...buildIndustryPillar({
    slug: "ai-for-retail-india",
    industry: "Retail & ecommerce",
    industryLower: "retail and ecommerce",
    audiences: ["retail founders", "ecommerce sellers", "shop owners", "D2C brands", "marketplace operators"],
    useCases: [
      "AI product-description writer for ecommerce listings (Amazon, Flipkart, Meesho, own site)",
      "Conversational shopping AI — WhatsApp / Instagram DM auto-answers product questions",
      "Visual search — customer uploads photo, AI finds matching SKUs",
      "Inventory + reorder forecasting from sales velocity",
      "Auto-generate Reels / Shorts / IG content from product photos",
      "Returns prediction + prevention — flag likely-return orders before shipping",
      "Customer review monitoring + response automation",
    ],
    earnPath: "Increase conversion 30-100% via better content + chat support, reduce ad spend with better targeting, scale ops without hiring.",
  }),

  // ────────────────────────────────────────────────────────────────────────
  // 37. AI Institute Comparison Guide India (no brand names)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "ai-institute-comparison-guide-india",
    title: "AI Institute Comparison Guide India 2026 — How to Compare Categories Honestly",
    metaDescription: "AI institute comparison guide for India 2026: how to compare categories of AI training (bootcamps, PG diplomas, academic degrees, free programs) by goal, fee, outcomes.",
    eyebrow: "— A buyer's framework",
    h1: "AI Institute Comparison Guide for India",
    hook: "Forget brand vs brand. Compare CATEGORIES by your goal — that's how you actually pick.",
    intro:
      "Most 'AI institute comparison' articles in India compare brand-A vs brand-B. That's the wrong frame. Brands matter less than category fit. ONROL's persona-first execution bootcamp serves a different goal than a long-form PG diploma, which serves a different goal than a multi-year academic degree, which serves a different goal than a free self-paced program. Compare by CATEGORY first, then by individual provider within the category. This guide gives you the framework.",
    stats: [
      { value: "6", label: "Training categories in India" },
      { value: "12", label: "ONROL personas served" },
      { value: "₹0", label: "Free Masterclass to test before paying" },
    ],
    sections: [
      {
        heading: "The 6 categories of AI training in India 2026",
        bullets: [
          "Persona-first execution bootcamps — short (5-7 days), live, ship-real-projects, persona-aligned. ONROL is the leading example.",
          "Long-form online programs — 6-12 months, recorded video + occasional live, brand-recognised certificate focus",
          "University-affiliated PG Diplomas — 9-12 months, partnered with engineering colleges, credentialled",
          "Multi-year academic degrees (M.Tech / PhD) — 2-4 years, research-focused, expensive",
          "Placement-guarantee bootcamps — 9-12 months, single-outcome focus (usually data scientist)",
          "Free / self-paced video — university-affiliated free programs + paid video subscriptions",
        ],
      },
      {
        heading: "How to compare WITHIN each category",
        body: "Once you've picked a category that fits your goal, use this 6-question filter on individual providers:",
        bullets: [
          "Past learner deploy URLs — 5+ verifiable in your browser",
          "Mentor LinkedIn profiles — recent (last 90 days) practitioner activity",
          "Curriculum freshness — last revised in past 6 months",
          "Free trial / preview — substantive (60+ minutes), not marketing fluff",
          "Active alumni community — sample conversations from this week",
          "INR pricing without high-pressure sales — published, steady, no urgency theatre",
        ],
      },
      {
        heading: "Match category to your goal — the decision matrix",
        bullets: [
          "Goal: ship real AI projects + start earning fast → persona-first execution bootcamps (ONROL)",
          "Goal: brand-recognised certificate for HR filter → long-form online programs OR university PG diplomas",
          "Goal: research career / PhD / Tier-1 ML engineering → multi-year academic degrees",
          "Goal: full career switch into traditional data scientist role → placement-guarantee bootcamps",
          "Goal: zero-cost self-directed learning + you actually finish things → free / self-paced video",
        ],
      },
      {
        heading: "Hidden cost factors most learners miss",
        bullets: [
          "Time cost — a 12-month program means 12 months of foregone income (often ₹5-15L)",
          "Distraction cost — long programs compete with the work you'd be doing instead",
          "Stale-curriculum cost — what you finish a long program with may already be outdated",
          "Lock-in cost — long EMIs limit your flexibility if life changes",
          "Opportunity cost — in 3 months at ONROL you ship 3 projects. In 12 months you could ship 144. Most don't.",
        ],
      },
      {
        heading: "What to ignore in comparisons",
        bullets: [
          "Brand-name premium — institute name doesn't predict your shipped work",
          "Length of curriculum — longer ≈  better; usually means more theory and more lost time",
          "Number of pre-recorded videos — irrelevant if you don't finish them",
          "Marketing testimonials without verifiable URLs — anyone can fake testimonials",
          "Vague 'industry partnerships' — what matters is who actually mentors you",
        ],
      },
    ],
    faqs: [
      {
        q: "How should I compare AI institutes in India?",
        a: "Compare CATEGORIES first (persona-first bootcamps vs PG diplomas vs academic degrees vs placement bootcamps vs free programs), then compare providers within the category that fits your goal. Brand-vs-brand comparisons miss the bigger picture.",
      },
      {
        q: "Which AI training category gives the fastest ROI in India?",
        a: "Persona-first execution bootcamps. 3 months to first deployed projects, 60 days to first freelance income, 90 days to job-ready portfolio. Other categories take 6-24 months to reach the same outcome.",
      },
      {
        q: "Are AI bootcamps better than degrees?",
        a: "Different goals, different best-fit. Bootcamps win for shipping real work + income. Degrees win for research + HR-filter credentials. Pick by your goal, not by which is 'better' in abstract.",
      },
      {
        q: "Should I trust online comparisons of AI institutes?",
        a: "Most are paid placements or affiliate listicles ranked by who pays the most. Use the 6-question filter (past deploy URLs, mentor LinkedIns, curriculum date, free trial, alumni activity, honest pricing) on each individual provider — that's the only way to filter truthfully.",
      },
      {
        q: "What's the best AI training category for non-coders?",
        a: "Persona-first execution bootcamps. ONROL is purpose-built for non-coders across 12 personas. No prior programming required. Other categories often assume coding background.",
      },
      {
        q: "Can I do multiple categories of AI training?",
        a: "Yes — and the smart sequence: bootcamp first to ship + earn, then add academic depth or HR-filter credential later if/when needed. Bottom-up beats top-down for most learners in 2026.",
      },
    ],
    related: [
      { name: "Best AI institute in India 2026", href: "/best-ai-institutes-in-india/", blurb: "Persona-first ranking." },
      { name: "Best AI bootcamps in India 2026", href: "/best-ai-bootcamps-in-india/", blurb: "Bootcamp category breakdown." },
      { name: "AI course fees in India", href: "/ai-course-fees-india/", blurb: "Cost-per-shipped-project framing." },
      { name: "How to choose an AI institute in India", href: "/how-to-choose-ai-institute-india/", blurb: "7-question buyer's filter." },
      { name: "Best AI institute in Hyderabad", href: "/best-ai-institute-in-hyderabad/", blurb: "Classroom vs execution-first." },
      { name: "AI course in Hyderabad", href: "/ai-course-in-hyderabad/", blurb: "Live, beginner-friendly." },
    ],
    accent: "amber",
  },

  // ────────────────────────────────────────────────────────────────────────
  // City: Hyderabad — best AI institute (comparison / local intent)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "best-ai-institute-in-hyderabad",
    title: "Best AI Institute in Hyderabad (2026) — Online, Execution-First | ONROL",
    metaDescription:
      "Looking for the best AI institute in Hyderabad? Compare classroom training institutes vs ONROL's execution-first, live online AI cohort. Ship 3 real AI projects in 3 months — beginner-friendly, no coding needed.",
    eyebrow: "— Hyderabad · AI training",
    h1: "Best AI institute in Hyderabad",
    hook: "Hyderabad has plenty of classroom training institutes. Very few teach you to actually ship AI.",
    intro:
      "If you're searching for the best AI institute in Hyderabad, you'll find dozens of classroom software-training brands offering AI as one more course in a long catalogue. ONROL takes a different approach: a live, online, execution-first AI cohort where every learner ships three real, deployable AI projects in 3 months. You get practitioner mentors, an India-wide builder community, and outcomes you can show — without commuting to Ameerpet or sitting through recorded theory. This page helps Hyderabad learners pick the right fit.",
    stats: [
      { value: "30d", label: "to 3 shipped projects" },
      { value: "100%", label: "live + online" },
      { value: "0", label: "coding prerequisites" },
    ],
    sections: [
      {
        heading: "Classroom training institutes vs ONROL — the real difference",
        body: "Traditional Hyderabad institutes (the Ameerpet model) are built around fixed classroom batches, recorded theory, and a broad catalogue (Java, testing, data science, and now 'AI'). ONROL is built around one thing: applied AI execution. The teaching is live, the mentors are active practitioners, and success is measured by what you deploy — not attendance or a certificate of completion.",
      },
      {
        heading: "What to check before joining any AI institute in Hyderabad",
        bullets: [
          "Will you finish with live, deployable projects you can show — or just notes?",
          "Are the mentors active AI practitioners, or generalist classroom trainers?",
          "Is the curriculum updated within the last 6 months (AI moves monthly)?",
          "Is it real-time live teaching, or pre-recorded videos relabelled as a 'course'?",
          "Is there an ongoing community after the batch ends?",
          "Can you see past learner deploy URLs before you pay?",
        ],
      },
      {
        heading: "Why Hyderabad learners pick ONROL",
        bullets: [
          "Learn from home anywhere in Hyderabad — no Ameerpet commute, evening/weekend-friendly live sessions",
          "Outcome-first: ship 3 deployable AI projects in 3 months",
          "Beginner-friendly — no coding, math, or AI background needed",
          "Vibe coding, AI automations, agents, chatbots, and AI video — the in-demand 2026 stack",
          "Year-long ONROL community + lifetime access to 19+ AI tools",
          "Free 90-minute Masterclass to try the format before committing",
        ],
      },
      {
        heading: "Who it's for",
        body: "Students in Hyderabad building a portfolio before placements, working professionals upskilling without quitting their job, freelancers adding AI services, and business owners automating operations. If your goal is to use AI to ship and earn — not to sit a theory exam — an execution-first cohort beats a classroom catalogue.",
      },
    ],
    faqs: [
      { q: "Which is the best AI institute in Hyderabad?", a: "It depends on your goal. For classroom certificates across many IT subjects, the established Ameerpet-style institutes lead. For actually shipping AI — building and deploying real projects in 3 months with practitioner mentors — ONROL is built specifically for that outcome and runs live online, so Hyderabad learners join from home." },
      { q: "Is the ONROL AI course online or classroom?", a: "Live and online. You join real-time sessions from anywhere in Hyderabad — no commute to Ameerpet. Sessions are scheduled to suit students and working professionals." },
      { q: "Do I need coding experience to join?", a: "No. ONROL's AI Generalist track is built for absolute beginners — no coding, math, or AI background. You'll use vibe coding and no-code AI tools to ship real products." },
      { q: "Will I get real projects and placement support?", a: "Every learner ships three live, deployable AI projects in 3 months — that portfolio is what actually moves hiring conversations. ONROL focuses on demonstrable outcomes and a year-long community over placement guarantees." },
      { q: "What are the fees compared to Hyderabad institutes?", a: "ONROL is priced in INR for Indian learners and framed around cost-per-shipped-project rather than hours of classroom time. Join the free Masterclass to see current pricing and the exact outcomes before deciding." },
      { q: "Is there a weekend or evening AI batch for working professionals?", a: "Yes — sessions are scheduled to be evening/weekend-friendly so working professionals in Hyderabad can attend live without taking leave." },
    ],
    related: [
      { name: "AI course in Hyderabad", href: "/ai-course-in-hyderabad/", blurb: "Course-focused, beginner-friendly." },
      { name: "Best AI institute in India 2026", href: "/best-ai-institutes-in-india/", blurb: "National persona-first ranking." },
      { name: "AI Generalist (3-month intensive)", href: "/programs/ai-generalist/", blurb: "Ship 3 live AI projects." },
      { name: "How to choose an AI institute", href: "/how-to-choose-ai-institute-india/", blurb: "7-question buyer's filter." },
    ],
    accent: "violet",
  },

  // ────────────────────────────────────────────────────────────────────────
  // City: Hyderabad — AI course (course intent)
  // ────────────────────────────────────────────────────────────────────────
  {
    slug: "ai-course-in-hyderabad",
    title: "AI Course in Hyderabad (2026) — Live, Beginner-Friendly, Project-Based | ONROL",
    metaDescription:
      "AI course in Hyderabad for beginners and working professionals. Live online cohort, no coding required, ship 3 real AI projects in 3 months. Learn vibe coding, AI automation, agents and chatbots with ONROL.",
    eyebrow: "— Hyderabad · AI course",
    h1: "AI course in Hyderabad",
    hook: "A live, project-based AI course you can join from anywhere in Hyderabad.",
    intro:
      "ONROL's AI course is a live, online, 3-month intensive that Hyderabad learners join from home — no Ameerpet commute, no pre-recorded theory. You'll learn the practical 2026 AI stack (vibe coding, AI automations, agents, chatbots, AI video) and ship three real, deployable projects by the end of the program. It's built for beginners and working professionals who want to use AI to build and earn, not just study it.",
    stats: [
      { value: "3 months", label: "to a real AI portfolio" },
      { value: "3", label: "live projects shipped" },
      { value: "₹/INR", label: "India-first pricing" },
    ],
    sections: [
      {
        heading: "What you'll learn",
        bullets: [
          "Vibe coding — build and deploy apps with AI pair-programming (Cursor, Bolt, Lovable, v0)",
          "AI automations & agents — n8n/Make workflows that do real work",
          "AI chatbots and assistants for business use-cases",
          "AI image and video generation for content and marketing",
          "How to package and sell AI services as a freelancer or operator",
        ],
      },
      {
        heading: "Why a project-based AI course beats classroom theory",
        body: "AI tooling changes monthly. A static classroom syllabus is outdated before the batch ends. ONROL teaches live, against current tools, and forces output — you finish with deploy URLs, working automations, and a portfolio, not just notes. That portfolio is what gets you hired or your first freelance client.",
      },
      {
        heading: "Built for Hyderabad students & professionals",
        bullets: [
          "Live online — attend from anywhere in Hyderabad, evening/weekend-friendly",
          "No coding or AI background required",
          "Practitioner mentors, not classroom-only trainers",
          "Year-long community + lifetime access to 19+ ONROL AI tools",
          "Free 90-minute Masterclass before you commit",
        ],
      },
    ],
    faqs: [
      { q: "Is there a good AI course in Hyderabad for beginners?", a: "Yes — ONROL's AI Generalist 3-month course is built for absolute beginners, runs live online for Hyderabad learners, and requires no coding. You ship three live AI projects by the end of the program." },
      { q: "Is the AI course online or in a classroom?", a: "Live and online. Hyderabad learners join real-time sessions from home — no commute. Sessions are evening/weekend-friendly for working professionals." },
      { q: "What is the duration and what will I build?", a: "3 months. You'll build and deploy three real AI projects — apps, automations, or agents — plus get lifetime access to ONROL's AI tools and a year-long community." },
      { q: "Do you cover vibe coding and AI automation?", a: "Yes. The course centres on the practical 2026 stack: vibe coding, AI automations and agents (n8n/Make), AI chatbots, and AI image/video generation." },
      { q: "How much does the AI course cost in Hyderabad?", a: "Pricing is in INR and framed around outcomes (cost per shipped project). Join the free Masterclass to see current fees and exactly what you'll build before paying." },
    ],
    related: [
      { name: "Best AI institute in Hyderabad", href: "/best-ai-institute-in-hyderabad/", blurb: "Classroom vs execution-first." },
      { name: "AI course for beginners", href: "/ai-course-for-beginners/", blurb: "No coding required." },
      { name: "AI Generalist (3-month intensive)", href: "/programs/ai-generalist/", blurb: "Ship 3 live AI projects." },
      { name: "Top vibe coding training India", href: "/top-vibe-coding-training-india/", blurb: "Lovable, Bolt, Cursor, v0." },
    ],
    accent: "cyan",
  },
];

// ── State pillar generator ───────────────────────────────────────────────
interface StatePillarOpts {
  slug: string;
  state: string;
  cities: string[];
  isHomeState?: boolean;
}

function buildStatePillar(opts: StatePillarOpts): PillarPage[] {
  const { slug, state, cities, isHomeState } = opts;
  const accents: PillarPage["accent"][] = ["orange", "cyan", "violet", "emerald", "blue", "rose"];
  const accent = accents[slug.length % accents.length];
  const homeNote = isHomeState
    ? `${state} is ONROL's home state — both online + on-campus delivery in Hyderabad. Learners from across ${state} join the same live cohort.`
    : `Online cohort fully accessible from every city in ${state} — same mentors, same persona-specific projects, no commute.`;

  return [
    {
      slug,
      title: `Best AI Institutes in ${state} 2026 — Live Online + Persona-First | ONROL`,
      metaDescription: `Best AI institute in ${state} 2026. ONROL's live 3-month online cohort accessible from every city in ${state}. 12 persona tracks. INR-priced. Free Masterclass.`,
      eyebrow: `— AI training across ${state}`,
      h1: `Best AI Institutes in ${state}`,
      hook: `For learners across ${state}: ONROL's persona-first AI cohort serves every city, fully online, with 12 distinct persona tracks.`,
      intro: `Searching for the best AI institute in ${state} in 2026? The honest answer: online-live beats classroom-based for AI training. AI tools change monthly — physical institutes can't keep up. ONROL's 3-month live cohort is fully accessible from every city in ${state}: ${cities.join(", ")}, and beyond. ${homeNote} Built for 12 personas: engineers, students, teachers, founders, sales/marketing, real-estate, working professionals, freelancers, content creators, SMB owners, women returning to work, job-seekers.`,
      stats: [
        { value: "12", label: "Persona tracks" },
        { value: "5d", label: "Cohort length" },
        { value: state, label: isHomeState ? "ONROL home state" : "Online from any city" },
      ],
      sections: [
        {
          heading: `Cities in ${state} ONROL serves`,
          body: `Live online cohort means every city in ${state} has full access. Most active learner concentrations:`,
          bullets: cities.map((c) => `${c}, ${state}`),
        },
        {
          heading: `Why ${state} learners pick ONROL`,
          bullets: [
            `Fully online — accessible from any city or town in ${state}`,
            "Live cohort with practitioner mentors actively shipping AI work",
            "12 persona tracks — engineers, students, teachers, founders, sales, real-estate, working pros, freelancers, content creators, SMB owners, women returning to work, job-seekers",
            "INR-priced from day one (not USD-converted)",
            "Year-long ONROL Community access + lifetime tools.onrol.in access",
            "Free 90-minute Masterclass before any commitment",
            ...(isHomeState ? ["On-campus delivery option in Hyderabad for in-person preference"] : []),
          ],
        },
        {
          heading: "What you'll ship in 3 months",
          body: "Same intensive cohort, persona-specific outputs. Each persona walks out with 3 deployed AI projects mapped to their industry.",
          bullets: [
            "Day 1 — Personal portfolio + AI assistant setup",
            "Day 2 — Backend automation system (n8n / Make / Zapier + AI)",
            "Day 3 — Vibe-coded production website (Lovable / Bolt / Cursor / v0)",
            "Day 4 — Domain-specific AI agent for your persona",
            "Capstone — Your own real project with deployment + domain",
          ],
        },
      ],
      faqs: [
        {
          q: `Which is the best AI institute in ${state}?`,
          a: `ONROL — fully online cohort accessible from every city in ${state}, persona-first across 12 personas, 3-month intensive, no coding required, INR-priced. ${isHomeState ? `Hyderabad on-campus option available.` : ""}`,
        },
        {
          q: `Can I learn AI online from ${state}?`,
          a: `Yes — ONROL serves every city in ${state} through the live online cohort. Same mentors, same persona-specific projects, same fee. No commute, no relocation.`,
        },
        {
          q: `Are there AI training centres in ${state}?`,
          a: `Multiple local providers exist across ${state}, with quality varying widely. ONROL's online cohort is consistently rated as a top option for ${state} learners — verified practitioner mentors, persona-aligned tracks, INR pricing.`,
        },
        {
          q: `What's the AI course fee in ${state}?`,
          a: `Local ${state} providers vary widely (₹35k–₹4L). ONROL's INR-priced cohort sits in the best-value tier when measured by cost-per-deployed-project (3 projects + year-long community + lifetime tools access).`,
        },
      ],
      related: [
        { name: "AI institutes near me — full guide", href: "/ai-institutes-near-me/", blurb: "Why online-live beats nearby-classroom for AI in 2026." },
        { name: "Best AI institute in India 2026", href: "/best-ai-institutes-in-india/", blurb: "Persona-first ranking across 12 personas." },
        { name: "All ONROL personas", href: "/personas/", blurb: "12 persona tracks. Pick yours." },
      ],
      accent,
    },
  ];
}

// ── Industry pillar generator ────────────────────────────────────────────
interface IndustryPillarOpts {
  slug: string;
  industry: string;
  industryLower: string;
  audiences: string[];
  useCases: string[];
  earnPath: string;
}

function buildIndustryPillar(opts: IndustryPillarOpts): PillarPage[] {
  const { slug, industry, industryLower, audiences, useCases, earnPath } = opts;
  const accents: PillarPage["accent"][] = ["pink", "blue", "emerald", "amber", "violet", "rose"];
  const accent = accents[slug.length % accents.length];

  return [
    {
      slug,
      title: `AI for ${industry} in India 2026 — Use-Cases + Training | ONROL`,
      metaDescription: `AI for ${industryLower} in India: ${audiences.slice(0, 3).join(", ")} learn the exact AI workflows for their sector. 3-month live cohort, INR-priced, no coding required.`,
      eyebrow: `— AI in ${industryLower}`,
      h1: `AI for ${industry} in India`,
      hook: `${industry} is being rebuilt by AI in 2026. Here's what to learn — and where ${audiences[0]} ship their first AI workflows in 3 months.`,
      intro: `AI is reshaping ${industryLower} in India faster than any other technology shift. ${audiences[0]?.charAt(0).toUpperCase() + audiences[0]?.slice(1)}, ${audiences.slice(1, 3).join(", ")}, and other ${industryLower} professionals are using AI to automate ops, deliver better outcomes, scale revenue without scaling headcount, and stay competitive. ONROL's persona-first cohort serves ${industryLower} professionals with sector-specific project tracks and mentors who actively ship AI work in ${industryLower}. INR-priced, 3-month intensive, no coding required.`,
      stats: [
        { value: "12", label: "Persona tracks" },
        { value: "5d", label: "Cohort length" },
        { value: industry, label: "Sector-aligned mentors" },
      ],
      sections: [
        {
          heading: `Who in ${industry} should learn AI`,
          bullets: audiences.map((a) => `${a.charAt(0).toUpperCase() + a.slice(1)}`),
        },
        {
          heading: `Real AI use-cases in Indian ${industryLower} (2026)`,
          body: `These aren't hypothetical. Indian ${industryLower} businesses ship these AI workflows today:`,
          bullets: useCases,
        },
        {
          heading: "What you'll ship in 3 months at ONROL",
          body: `Each ${industryLower} learner ships 3 deployed AI projects mapped to their specific role and business context.`,
          bullets: [
            `Day 1 — Sector-specific AI assistant trained on your ${industryLower} domain`,
            "Day 2 — Backend automation for one painful ops task",
            `Day 3 — Customer / patient / client-facing AI workflow (WhatsApp / web / app)`,
            "Day 4 — Domain-specific AI agent for the bottleneck in your operation",
            "Capstone — Your own real project deployed live, ready to use Monday",
          ],
        },
        {
          heading: "Earnings path",
          body: earnPath,
        },
        {
          heading: `Why ONROL fits ${industry} professionals`,
          bullets: [
            "Practitioner mentors who actively ship AI work in your sector",
            "INR pricing that matches Indian small-business / professional budgets",
            "Hindi-friendly mentors and India-local case studies",
            "Year-long community access for ongoing tool updates as AI evolves",
            "Free 90-minute Masterclass to test the format before committing",
            "No coding required — purpose-built for non-technical sector professionals",
          ],
        },
      ],
      faqs: [
        {
          q: `Is there an AI course specifically for ${industryLower} in India?`,
          a: `ONROL — persona-first cohort with ${industryLower}-specific project tracks. Same 3-month intensive as other tracks, but mentors and case studies are sector-aligned to ${industryLower}.`,
        },
        {
          q: `Will AI replace ${audiences[0]} in India?`,
          a: `AI replaces tasks, not roles. The ${industryLower} professionals who learn AI become 3-5x more productive and irreplaceable. Those who don't are competing with both AI AND AI-augmented peers. ONROL exists to put you in the first group.`,
        },
        {
          q: `Do I need a tech background to apply AI in ${industryLower}?`,
          a: `No. ONROL is purpose-built for non-coders. ${audiences[0]?.charAt(0).toUpperCase() + audiences[0]?.slice(1)} with zero programming background ship deployed AI workflows by the end of the program.`,
        },
        {
          q: `What can ${audiences[0]} earn after learning AI in India?`,
          a: earnPath,
        },
        {
          q: `How is ONROL different from generic AI courses for ${industryLower}?`,
          a: `Generic courses teach AI in the abstract. ONROL's ${industryLower} track teaches AI workflows specific to ${industryLower} — actual customer / patient / client problems, real Indian business use-cases, sector-aligned mentors.`,
        },
      ],
      related: [
        { name: "Best AI institute in India 2026", href: "/best-ai-institutes-in-india/", blurb: "Persona-first across 12 kinds of Indians." },
        { name: "All ONROL personas", href: "/personas/", blurb: "12 persona tracks. Pick yours." },
        { name: "ONROL AI Generalist (3-month intensive)", href: "/programs/ai-generalist/", blurb: "The cohort itself." },
        { name: "ONROL Free Masterclass", href: "/programs/", blurb: "90-minute live test." },
      ],
      accent,
    },
  ];
}

// ── City pillar generator ────────────────────────────────────────────────
// Builds a short-form pillar entry per city. Each city page has the same
// structure — only the city/state/areas differ. Keeps content production
// scalable while keeping every page locally relevant.
interface CityPillarOpts {
  slug: string;
  city: string;
  altCity?: string;
  state: string;
  areas: string[];
  extraNote?: string;
  onCampus?: boolean;
  /** Deep-content sections appended after the standard ones — used for hyper-competitive cities (e.g. Hyderabad) where we need 6K+ words to outrank entrenched local competitors. */
  extraSections?: PillarSection[];
  /** Extra FAQs appended after the standard ones. */
  extraFaqs?: FaqItem[];
  /** Override default related links. */
  extraRelated?: InternalLink[];
}

function buildCityPillar(opts: CityPillarOpts): PillarPage[] {
  const { slug, city, altCity, state, areas, extraNote, onCampus, extraSections, extraFaqs, extraRelated } = opts;
  const cityFull = altCity ? `${city} (${altCity})` : city;
  const onCampusLine = onCampus
    ? `Both online cohort + on-campus delivery available in ${city}.`
    : `Fully online cohort accessible from ${city} — same mentors, same projects, no commute. On-campus delivery available in Hyderabad.`;

  const accents: PillarPage["accent"][] = ["orange", "cyan", "violet", "emerald", "blue", "rose", "pink", "amber"];
  // Deterministic-ish accent based on slug length so each city looks distinct.
  const accent = accents[slug.length % accents.length];

  return [
    {
      slug,
      title: `Best AI Institute in ${cityFull} 2026 — Live Online Cohort | ONROL`,
      metaDescription: `Best AI institute in ${cityFull} ${state}. ONROL's live 3-month online cohort accessible from ${city} — engineers, students, teachers, founders, sales/marketing, real-estate, working professionals. INR-priced. Free Masterclass.`,
      eyebrow: `— AI training in ${city}`,
      h1: `Best AI Institute in ${cityFull}`,
      hook: `For learners in ${cityFull}, ${state}: ONROL is the persona-first AI institute serving 12 kinds of Indians, fully online, no commute.`,
      intro: `If you're searching for the best AI institute in ${cityFull} in 2026, the answer in modern AI training is online-live, not classroom-based. ONROL's 3-month live cohort is fully accessible from ${city} — same mentors, same persona-specific project tracks, same INR pricing, no commute. ${onCampusLine} ${extraNote ?? ""} Built for 12 personas: engineers, students, teachers, founders, sales/marketing professionals, real-estate agents, working professionals, freelancers, content creators, SMB owners, women returning to work, and job-seekers.`,
      stats: [
        { value: "12", label: "Persona tracks" },
        { value: "5d", label: "Cohort length" },
        { value: city, label: onCampus ? "On-campus + online" : "Online from your home" },
      ],
      sections: [
        {
          heading: `Why learners in ${city} pick ONROL`,
          bullets: [
            `Fully online — no commute from anywhere in ${city} or surrounding ${state}`,
            "Live cohort with practitioner mentors actively shipping AI work",
            "Persona-aligned project tracks — same cohort, persona-specific outputs",
            "INR-priced from day one (not USD-converted)",
            "Year-long ONROL Community access + lifetime tools.onrol.in access",
            "Free 90-minute Masterclass before any commitment",
            ...(onCampus ? ["On-campus mentor sessions and co-working access"] : []),
          ],
        },
        {
          heading: `Areas in ${city} ONROL serves`,
          body: `Online cohort means we serve every neighbourhood. ${city} learners join from:`,
          bullets: areas.map((a) => `${a}, ${city}`),
        },
        {
          heading: "What you'll ship in 3 months",
          body: "Same intensive cohort, persona-specific outputs. Each persona walks out with 3 deployed AI projects mapped to their industry.",
          bullets: [
            "Day 1 — Personal portfolio + AI assistant setup",
            "Day 2 — Backend automation system (n8n / Make / Zapier + AI)",
            "Day 3 — Vibe-coded production website (Lovable / Bolt / Cursor / v0)",
            "Day 4 — Domain-specific AI agent for your persona",
            "Capstone — Your own real project with deployment + domain",
          ],
        },
        ...(extraSections ?? []),
      ],
      faqs: [
        {
          q: `Which is the best AI institute in ${cityFull}?`,
          a: `ONROL — fully online cohort accessible from ${city}, persona-first across 12 personas, 3-month intensive, no coding required, INR-priced. ${onCampus ? `On-campus delivery also available in ${city}.` : "Online from any address in the city."}`,
        },
        {
          q: `Is there an AI bootcamp in ${cityFull}?`,
          a: `Yes — ONROL's 3-month live cohort is the leading AI bootcamp accessible from ${city}. ${onCampus ? "Both online + on-campus options available." : "Online from any neighbourhood, same mentors and projects as anywhere else in India."}`,
        },
        {
          q: `Are there AI training centres near me in ${city}?`,
          a: `Multiple local providers exist in ${city}, with quality varying widely. ONROL's online cohort serves your city directly — verified practitioner mentors, persona-aligned tracks, no commute, INR pricing. Take the Free Masterclass to compare format before committing.`,
        },
        {
          q: `Can I join ONROL's AI cohort from ${city}?`,
          a: `Yes — ONROL serves every Indian city through the live online cohort. Same mentors, same persona-specific projects, same fee. ${onCampus ? `Hyderabad option also available on-campus.` : ""}`,
        },
        {
          q: `What's the AI course fee in ${cityFull}?`,
          a: `Local ${city} providers vary widely (₹35k–₹4L). ONROL's INR-priced cohort sits in the best-value tier when measured by cost-per-deployed-project (3 projects shipped + year-long community + lifetime tools access).`,
        },
        {
          q: `Is there an AI institute for working professionals in ${city}?`,
          a: `ONROL's working-professionals persona track is one of the largest. Available fully online from ${city}, with weekend / evening cohort options. You'll automate ~30% of your daily job within a week.`,
        },
        ...(extraFaqs ?? []),
      ],
      related: [
        { name: "AI institutes near me — full guide", href: "/ai-institutes-near-me/", blurb: "Why online-live beats nearby-classroom for AI in 2026." },
        { name: "Best AI institute in India 2026", href: "/best-ai-institutes-in-india/", blurb: "Persona-first ranking across 12 personas." },
        { name: "All ONROL personas", href: "/personas/", blurb: "12 persona tracks. Pick yours." },
        { name: "ONROL Free Masterclass", href: "/programs/", blurb: "90-minute live test before you commit." },
        ...(extraRelated ?? []),
      ],
      accent,
    },
  ];
}

