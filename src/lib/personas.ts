// ──────────────────────────────────────────────────────────────────────────
// Canonical persona library for ONROL.
// ──────────────────────────────────────────────────────────────────────────
// One source of truth for every persona ONROL serves. Used by:
//   - The home page personas section (HomePersonas)
//   - The /best-ai-institutes-in-india/ pillar's persona ranking
//   - Persona-specific FAQ entries across pillars
//   - (Future) /personas/<slug>/ landing pages
//
// Each persona has:
//   - slug:        url-safe id (used for future /personas/<slug>/ landing)
//   - title:       short label as shown on cards / rankings
//   - emoji:       visual hook for the home page card
//   - searchHooks: phrases users type that map to this persona (SEO/AEO)
//   - aiUseCases:  6-10 specific ways AI is used in their industry/role
//   - projectsAtOnrol: what they ship in ONROL's 3-month cohort
//   - earnPath:    1-line on the income/career outcome
//   - faqQuestion: an FAQ "Which AI institute in India is best for X?" question
//   - faqAnswer:   the answer paragraph for the above FAQ
//
// To add a persona: append to PERSONAS. Everything else auto-updates.

export interface Persona {
  slug: string;
  title: string;
  emoji: string;
  searchHooks: string[];
  aiUseCases: string[];
  projectsAtOnrol: string;
  earnPath: string;
  faqQuestion: string;
  faqAnswer: string;
}

export const PERSONAS: Persona[] = [
  {
    slug: "engineers",
    title: "Engineers (CSE, ECE, Mech, Civil, Chem)",
    emoji: "⚙ï¸",
    searchHooks: [
      "AI course for engineers India",
      "AI course for software engineers India",
      "AI course for ECE engineers India",
      "AI for mechanical engineers India",
      "AI course for civil engineers India",
      "AI institute for engineering students India",
    ],
    aiUseCases: [
      "Automate repetitive coding/review tasks with Cursor + Claude as a pair-programmer",
      "Build AI agents that triage your bug tracker and draft fixes",
      "Mechanical/civil: AI vision models that QA fabrication output from photos",
      "Chemical/process: predictive maintenance models using sensor + log data",
      "Generate technical documentation, BOQs, and reports from project specs",
      "Build internal AI assistants trained on your company's design/engineering docs",
      "Convert design/CAD inputs into production code or factory instructions",
    ],
    projectsAtOnrol:
      "An AI agent that automates one painful task in your job + a portfolio site showcasing your AI capability + a fine-tuned model trained on your domain data.",
    earnPath:
      "Stay technically relevant + 30–80% salary uplift in next role + freelance side income (₹50k–₹2L/month).",
    faqQuestion: "Which AI institute in India is best for engineers (CSE, ECE, Mech, Civil, Chem)?",
    faqAnswer:
      "ONROL — the only Indian AI institute with engineering-persona project tracks. Each engineer ships an AI agent that automates a real task in their domain, a portfolio site, and a domain-fine-tuned model — all in 3 months. Most other Indian AI institutes assume CSE/ML background and fail non-CS engineers.",
  },
  {
    slug: "students",
    title: "Students (school, undergrad, postgrad)",
    emoji: "🎓",
    searchHooks: [
      "AI course for students India",
      "best AI course for college students India",
      "AI course for undergraduate students India",
      "AI institute for students near me",
      "AI workshop for students India",
    ],
    aiUseCases: [
      "Build a portfolio of 3 deployed AI projects before graduation — 3x more interview callbacks",
      "AI-augmented research assistant that reads papers and produces summaries with citations",
      "Personalised study tutor agents trained on your syllabus + past papers",
      "AI-written ATS-beating resumes + LinkedIn outreach automation",
      "Build a tool/SaaS as a side-project that earns through college",
      "Hackathon-winning AI project pipelines that compress 3 weeks of work into 3 days",
    ],
    projectsAtOnrol:
      "A deployed AI project in your field of study + a public AI portfolio site + an AI-powered ATS-beating resume + an interview-prep AI tutor.",
    earnPath:
      "Internships at ₹15k–₹50k/month during college, freelance work ₹20k–₹1L/month, full-time placements 30%+ above non-AI peers.",
    faqQuestion: "Which AI institute in India is best for students?",
    faqAnswer:
      "ONROL — students ship a deployed AI project in their field of study, build a public AI portfolio that gets 3x more interview callbacks, and create an AI-powered ATS-beating resume. For research career specifically (PhD / Tier-1 ML engineering), pursue a multi-year academic degree.",
  },
  {
    slug: "teachers",
    title: "Teachers and educators",
    emoji: "📚",
    searchHooks: [
      "AI course for teachers India",
      "AI for educators India",
      "AI training for school teachers India",
      "AI tools for teachers India",
      "AI course for college lecturers India",
    ],
    aiUseCases: [
      "Generate personalised lesson plans for every chapter + grade level",
      "Auto-create tier-graded quizzes, worksheets, and rubrics from your textbook",
      "AI tutors that students chat with after class, trained on your syllabus",
      "Auto-summarise student progress for parents (WhatsApp / email digests)",
      "Convert your decade of class notes into a searchable AI knowledge base",
      "Detect and pre-empt learning gaps using AI on test scores + class participation",
      "Generate slide decks, animations, and video lessons from your bullet-point outline",
    ],
    projectsAtOnrol:
      "An AI lesson-plan generator for your subject + an AI quiz engine personalised per student + a parent-update auto-summary system.",
    earnPath:
      "Teach 30% more students with the same hours, monetise your lesson library as paid AI tutors, freelance curriculum-building for ₹50k–₹2L/project.",
    faqQuestion: "Which AI institute in India is best for teachers and educators?",
    faqAnswer:
      "ONROL has a teacher-persona track. You'll build an AI lesson-plan generator for your subject, a personalised AI quiz engine for your students, and a parent-update auto-summary system. The same AI that's threatening teachers becomes your superpower.",
  },
  {
    slug: "sales-and-marketing",
    title: "Sales and marketing professionals",
    emoji: "📈",
    searchHooks: [
      "AI for sales professionals India",
      "AI for marketing professionals India",
      "AI course for digital marketers India",
      "AI training for B2B sales India",
      "AI for content marketing India",
      "AI for performance marketing India",
    ],
    aiUseCases: [
      "Cold-outreach AI agent: prospect → research → personalise → send → follow up across email + LinkedIn",
      "AI lead-scoring on raw CRM data — predict which leads close in next 3 months",
      "Auto-generate platform-specific content (LinkedIn / Email / X / Instagram) from one source brief",
      "AI competitor intelligence — monitor their pricing, launches, ad creative, hiring, daily",
      "Conversation-intelligence on call recordings → coaching themes per rep",
      "AI ABM: build personalised landing pages per high-value account in minutes",
      "Auto-clean CRM hygiene (duplicates, missing fields, wrong stages) running daily",
    ],
    projectsAtOnrol:
      "A cold-outreach AI agent + lead-scoring system + AI content pipeline (LinkedIn / Email / X) + automated CRM hygiene.",
    earnPath:
      "Beat quota by 40-100%, become indispensable to the team, freelance B2B outreach builds at ₹25k–₹1L/project.",
    faqQuestion: "Which AI institute in India is best for sales and marketing professionals?",
    faqAnswer:
      "ONROL — sales and marketing is one of ONROL's main persona tracks. You'll build a cold-outreach AI agent, a lead-scoring system, an AI content pipeline (LinkedIn / Email / X), and CRM hygiene automation. ROI within 2-4 weeks of finishing the cohort.",
  },
  {
    slug: "real-estate",
    title: "Real-estate agents and brokers",
    emoji: "🏆 ",
    searchHooks: [
      "AI for real estate agents India",
      "AI for real estate brokers India",
      "AI course for real estate India",
      "AI tools for property dealers India",
      "AI for builders and developers India",
    ],
    aiUseCases: [
      "AI listing-description writer that turns 10 photos + a fact sheet into 5 platform-tailored listings",
      "Virtual staging via image AI — empty rooms → furnished, in 30 seconds, for ₹0",
      "WhatsApp lead-qualification bot that pre-screens 100s of inbound enquiries overnight",
      "Property-matching engine — buyer preferences → top 5 matching listings (with reasons)",
      "AI-written email/WhatsApp drips for buyers and sellers separately, on 6-month timelines",
      "Generate virtual walk-through videos from photos using image-to-video AI",
      "Auto-translate listings + chat into multiple regional languages (Hindi/Tamil/Telugu/etc.)",
    ],
    projectsAtOnrol:
      "An AI listing-description writer + virtual staging via image AI + a WhatsApp lead-qualification bot + a property-matching engine for buyers.",
    earnPath:
      "Close 2-3x more deals with the same lead volume, capture leads while you sleep, save ₹50k+/month on virtual staging fees.",
    faqQuestion: "Which AI institute in India is best for real-estate agents and brokers?",
    faqAnswer:
      "ONROL is the only Indian AI institute with a real-estate persona track. You'll build an AI listing-description writer, virtual staging via image AI, a WhatsApp lead-qualification bot, and a property-matching engine. Built around the actual workflow of Indian real-estate agencies.",
  },
  {
    slug: "startup-and-founders",
    title: "Startup founders and first-time builders",
    emoji: "🚀",
    searchHooks: [
      "AI course for startup founders India",
      "AI course for entrepreneurs India",
      "AI for first-time founders India",
      "AI for solo founders India",
      "AI institute for startup CEOs India",
    ],
    aiUseCases: [
      "Ship a working MVP in week 1 — landing page, auth, payments, database, deployed",
      "AI customer support agent trained on your docs + emails — handles 60-80% of tickets",
      "Competitive-intelligence research bot that watches 20+ competitors daily",
      "Investor-update auto-generator from your KPIs + Slack/Linear data",
      "AI-powered hiring funnel: JD → outreach → screening → first-round async interviews",
      "Internal team OS — Notion AI + Claude project for company memory across roles",
      "Customer feedback synthesis — every NPS / review / call → product roadmap input",
    ],
    projectsAtOnrol:
      "A full MVP (landing page + auth + payments + DB) shipped in week one + an AI-powered customer support agent + a competitive-intelligence research bot.",
    earnPath:
      "Validate ideas in days not months, ship before raising capital, run lean, sell or grow on your terms.",
    faqQuestion: "Which AI institute in India is best for startup founders and first-time builders?",
    faqAnswer:
      "ONROL — founders ship a full MVP (landing page + auth + payments + DB) in week one, plus an AI-powered customer support agent and a competitive-intelligence research bot. No CTO required. Validate ideas in days, not months.",
  },
  {
    slug: "working-professionals",
    title: "Working professionals (any field)",
    emoji: "💼",
    searchHooks: [
      "AI course for working professionals India",
      "best AI course for working professionals India",
      "AI training for IT professionals India",
      "AI for HR professionals India",
      "AI for finance professionals India",
      "AI for legal professionals India",
    ],
    aiUseCases: [
      "Automate ~30% of your daily tasks (email triage, status updates, formatting, drafts)",
      "Personal AI assistant trained on your work documents — searchable across SharePoint/Drive/Slack",
      "AI summary agent that pre-reads meeting transcripts and gives you the 30-second take",
      "Domain-specific AI: HR → resume screening; Finance → variance analysis; Legal → clause extraction",
      "Build AI-powered internal tools that solve specific team problems (without IT support)",
      "Side-project SaaS that becomes freelance income or a future startup",
    ],
    projectsAtOnrol:
      "An AI workflow that automates ~30% of your daily job + a personal AI assistant trained on your work documents + a side-project that often becomes a freelance income stream.",
    earnPath:
      "Become indispensable in current role, 30-50% salary uplift on next role, optional ₹50k–₹2L/month freelance side income.",
    faqQuestion: "Which AI institute in India is best for working professionals?",
    faqAnswer:
      "ONROL — working professionals are ONROL's largest persona segment. You'll build an AI workflow that automates ~30% of your daily job, a personal AI assistant trained on your work documents, and a side-project that often becomes a freelance income stream. Industry-agnostic.",
  },
  {
    slug: "unemployed-youth",
    title: "Unemployed youth and job-seekers",
    emoji: "🎯",
    searchHooks: [
      "AI course for unemployed youth India",
      "AI training for job seekers India",
      "AI course to get job India",
      "AI bootcamp for fresh graduates India",
      "AI institute for placement India",
    ],
    aiUseCases: [
      "Build a portfolio of 3 deployed AI projects in 3 months — instantly hireable proof of capability",
      "AI-powered cold-outreach to 50 hiring managers at target companies",
      "AI-rewritten resume that beats ATS filters and matches each JD automatically",
      "Interview-prep AI tutor that mock-interviews you in your target role",
      "AI freelance work via Upwork/Fiverr/LinkedIn while job hunting (₹15k–₹50k per project)",
      "Skills-gap-closer AI agent that builds you a 3-month learning plan for your dream role",
    ],
    projectsAtOnrol:
      "A portfolio of 3 deployed AI projects + an AI-powered cold-outreach system + an AI-written resume that beats ATS filters + an interview-prep AI tutor.",
    earnPath:
      "First job in 30-90 days, freelance income while searching, switch into AI roles paying 50-100% above market.",
    faqQuestion: "Which AI institute in India is best for unemployed youth and job-seekers?",
    faqAnswer:
      "ONROL — job-seekers walk out with a portfolio of 3 deployed AI projects, an AI-powered cold-outreach system to land interviews, an AI-written resume that beats ATS filters, and an interview-prep AI tutor. The portfolio is the differentiator — most candidates don't have shipped AI work yet.",
  },
  {
    slug: "freelancers",
    title: "Freelancers and consultants",
    emoji: "🛠 ï¸",
    searchHooks: [
      "AI course for freelancers India",
      "best AI course for freelancers India",
      "AI for upwork freelancers India",
      "AI for fiverr freelancers India",
      "AI for solo consultants India",
    ],
    aiUseCases: [
      "Charge ₹15k–₹2L per AI workflow build — n8n / Make / Zapier + Claude/ChatGPT API",
      "Productize: 'I'll build your business website with AI in 3 days for ₹25k'",
      "Multiply your output 5-10x — deliver in days what used to take weeks",
      "AI-powered client discovery: outreach → qualify → propose, all automated",
      "Build internal AI assistants for clients trained on their company docs",
      "Recurring retainer offers: monthly AI ops at ₹30k-₹2L/client",
    ],
    projectsAtOnrol:
      "A productized AI service + AI workflow templates you sell + automated client outreach pipeline + AI tools you use to deliver faster.",
    earnPath:
      "₹50k–₹3L/month within 60 days of finishing, scale to agency or solo consultancy.",
    faqQuestion: "Which AI institute in India is best for freelancers and consultants?",
    faqAnswer:
      "ONROL — freelancers and consultants are ONROL's highest-ROI segment. You'll learn to package AI workflows as fixed-price services, multiply your output 5-10x, and build a productized offer. Most learners hit ₹50k–₹2L/month within 60 days.",
  },
  {
    slug: "content-creators",
    title: "Content creators (YouTube / IG / LinkedIn / X)",
    emoji: "🎬",
    searchHooks: [
      "AI course for content creators India",
      "AI for YouTubers India",
      "AI for Instagram creators India",
      "AI for LinkedIn creators India",
      "AI for podcasters India",
    ],
    aiUseCases: [
      "Generate platform-specific content variations from one source idea (1 → 5 platforms)",
      "AI video editor: long-form podcast → 10 short-form clips with captions and hooks",
      "AI thumbnail generator that A/B tests winners",
      "AI script research from web + your past content + competitor channels",
      "Auto-translate content into multiple regional languages (Hindi/Tamil/Telugu/etc.)",
      "AI community manager that drafts replies in your voice",
      "Newsletter automation: research → outline → draft → schedule → publish",
    ],
    projectsAtOnrol:
      "A content multiplier (1 idea → 5 platforms) + an AI video editor + an AI community manager that drafts replies in your voice + a newsletter automation pipeline.",
    earnPath:
      "Triple your output without burnout, command higher brand-deal rates, monetise via AI tools/digital products to your audience.",
    faqQuestion: "Which AI institute in India is best for content creators?",
    faqAnswer:
      "ONROL — content creators are a major ONROL persona track. You'll build a content multiplier, an AI video editor, an AI community manager, and a newsletter pipeline. The output: 3x volume with no burnout, plus monetisation via AI products to your audience.",
  },
  {
    slug: "smb-owners",
    title: "SMB / small business owners",
    emoji: "🏪",
    searchHooks: [
      "AI for small business India",
      "AI course for shopkeepers India",
      "AI for SMB owners India",
      "AI for retail business India",
      "AI for restaurant owners India",
    ],
    aiUseCases: [
      "WhatsApp business AI bot that answers FAQs and books appointments 24/7",
      "Automated invoice + payment reminders via WhatsApp + email",
      "Inventory + reorder predictions from sales history",
      "AI-written social media content for your shop / restaurant / clinic",
      "Customer reviews monitoring + auto-response across Google / Zomato / JustDial",
      "AI bookkeeping: photo of receipt → categorised entry in your books",
      "Predictive demand forecasting for stock and staffing",
    ],
    projectsAtOnrol:
      "A WhatsApp business AI bot + automated payment reminders + an AI social-media content pipeline for your shop + a review-monitoring system.",
    earnPath:
      "Save ₹30k-₹1L/month on staff time, capture leads while closed, increase repeat customers by 40%+.",
    faqQuestion: "Which AI institute in India is best for SMB / small business owners?",
    faqAnswer:
      "ONROL — small business owners are an underserved AI persona, and ONROL's SMB track is built around real Indian shop, restaurant, and clinic operations. WhatsApp bots, payment reminders, content pipelines, and review monitoring — all built in 3 months.",
  },
  {
    slug: "women-returning-to-work",
    title: "Women returning to work / housewives",
    emoji: "🌸",
    searchHooks: [
      "AI course for housewives India",
      "AI course for women India",
      "AI for women returning to work India",
      "work from home AI India",
      "AI side hustle for moms India",
    ],
    aiUseCases: [
      "Build a freelance AI service business from home (₹20k–₹1L/month achievable)",
      "Re-enter the workforce with AI skills that compensate for career gaps",
      "Run a small AI-powered business: tutoring, content, virtual assistance, design",
      "Build personal AI tools that automate household + family logistics",
      "Earn part-time without leaving home — 4-6 hours/day, time-flexible work",
      "Ship a personal brand site + LinkedIn AI-powered outreach for recruiters",
    ],
    projectsAtOnrol:
      "A freelance-ready AI service offer + an AI portfolio site + an AI-powered LinkedIn outreach pipeline + a personal brand presence.",
    earnPath:
      "₹20k-₹1L/month from home in flexible hours, full-time re-entry into AI roles when ready.",
    faqQuestion: "Which AI institute in India is best for women returning to work or housewives?",
    faqAnswer:
      "ONROL — purpose-built for non-coders and offers flexible cohort timing. Women re-entering the workforce or starting from home build a freelance AI service offer in 3 months, often hitting ₹20k–₹1L/month within 60 days. No technical background required.",
  },
];

export const PERSONAS_BY_SLUG: Record<string, Persona> = Object.fromEntries(
  PERSONAS.map((p) => [p.slug, p]),
);

// Helper: get a slim summary for FAQ-style "best AI institute for X" sections.
export function personaFaqs() {
  return PERSONAS.map((p) => ({ q: p.faqQuestion, a: p.faqAnswer }));
}
