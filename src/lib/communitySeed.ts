type SeedCategory =
  | "AI Tools"
  | "AI News"
  | "Daily Hacks"
  | "Prompts"
  | "Training Videos"
  | "Workshops"
  | "Courses"
  | "Opportunities"
  | "Resources"
  | "Beginner Corner";

export type SeedPost = {
  id: string;
  title: string;
  description: string;
  content_html?: string;
  category: SeedCategory;
  cta_text?: string;
  cta_link?: string;
  created_at: string;
  thumbnail_emoji?: string;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  views_count: number;
};

export type SeedWorkshop = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  meeting_url?: string;
  registration_count: number;
  image_url?: string;
};

export type SeedResource = {
  id: string;
  title: string;
  description: string;
  resource_type: string;
  is_premium: boolean;
  is_free: boolean;
  file_url?: string;
  external_url?: string;
};

export type SeedPoll = {
  id: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  total_votes: number;
};

const CATEGORIES: SeedCategory[] = [
  "AI Tools",
  "AI News",
  "Daily Hacks",
  "Prompts",
  "Training Videos",
  "Workshops",
  "Courses",
  "Opportunities",
  "Resources",
  "Beginner Corner",
];

const START = new Date("2026-01-01T00:00:00Z");
const NOW = new Date();
const DAY_MS = 24 * 60 * 60 * 1000;
const TOTAL_DAYS = Math.max(1, Math.floor((NOW.getTime() - START.getTime()) / DAY_MS) + 1);
const POSTS_PER_CATEGORY = 100;

const toolLinks = [
  "https://chatgpt.com",
  "https://claude.ai",
  "https://gemini.google.com",
  "https://perplexity.ai",
  "https://n8n.io",
  "https://zapier.com",
  "https://make.com",
  "https://cursor.com",
  "https://www.github.com/features/copilot",
  "https://notion.so",
];

const videoLinks = [
  "https://www.youtube.com/watch?v=KtlDNY1RlDo",
  "https://www.youtube.com/watch?v=aircAruvnKk",
  "https://www.youtube.com/watch?v=5p248yoa3oE",
  "https://www.youtube.com/watch?v=JTxsNm9IdYU",
  "https://www.youtube.com/watch?v=WTHM7B74f6w",
  "https://www.youtube.com/watch?v=zjkBMFhNj_g",
  "https://www.youtube.com/watch?v=7xTGNNLPyMI",
  "https://www.youtube.com/watch?v=G2fqAlgmoPo",
  "https://www.youtube.com/watch?v=QzR7I0H6Pao",
  "https://www.youtube.com/watch?v=UwsrzCVZAb8",
];

const freeResourceLinks = [
  "https://platform.openai.com/docs",
  "https://docs.anthropic.com",
  "https://ai.google.dev",
  "https://huggingface.co/learn",
  "https://www.deeplearning.ai/short-courses",
  "https://www.kaggle.com/learn",
  "https://python.langchain.com/docs/introduction",
  "https://docs.n8n.io",
  "https://github.com/microsoft/autogen",
  "https://roadmap.sh/ai-engineer",
];

const coursePages = [
  "AI Foundations",
  "Prompt Systems",
  "Context Engineering",
  "Automation Design",
  "API Integrations",
  "No-Code Product Loops",
  "Evaluation & Guardrails",
  "Agent Architecture",
  "Deployment Readiness",
  "Portfolio Packaging",
  "Freelance Positioning",
  "Capstone Launch",
];

const topicByCategory: Record<SeedCategory, string[]> = {
  "AI Tools": [
    "knowledge assistant",
    "content pipeline",
    "lead qualification",
    "customer support",
    "research synthesis",
    "proposal drafting",
    "internal wiki",
    "meeting summary",
    "sales ops",
    "onboarding automation",
  ],
  "AI News": [
    "model releases",
    "policy shifts",
    "enterprise adoption",
    "open-source moves",
    "funding momentum",
    "infrastructure updates",
    "developer ecosystem",
    "safety signals",
    "regulatory updates",
    "benchmark deltas",
  ],
  "Daily Hacks": [
    "prompt compression",
    "output QA",
    "template chaining",
    "fallback routing",
    "context cleanup",
    "citation checks",
    "speed optimizations",
    "style locking",
    "token efficiency",
    "workflow retries",
  ],
  Prompts: [
    "market research",
    "resume rewriting",
    "cold outreach",
    "technical writing",
    "feature scoping",
    "data cleaning",
    "feedback analysis",
    "SEO briefs",
    "lesson planning",
    "support macros",
  ],
  "Training Videos": [
    "automation walkthrough",
    "prompt clinic",
    "agent setup",
    "RAG implementation",
    "deployment prep",
    "UI build sprint",
    "workflow debugging",
    "evaluation loop",
    "portfolio teardown",
    "career strategy",
  ],
  Workshops: [
    "build sprint",
    "tool stack studio",
    "agent lab",
    "prompt systems lab",
    "workflow architecture",
    "RAG studio",
    "deployment workshop",
    "portfolio clinic",
    "freelance launchpad",
    "capstone rehearsal",
  ],
  Courses: [
    "core foundations",
    "intermediate systems",
    "advanced orchestration",
    "execution strategy",
    "deployment stack",
    "product thinking",
    "client delivery",
    "growth pathway",
    "career acceleration",
    "capstone integration",
  ],
  Opportunities: [
    "freelance brief",
    "internship opening",
    "contract role",
    "startup project",
    "agency collaboration",
    "creator partnership",
    "ops automation task",
    "AI analyst role",
    "mentor assistant role",
    "build challenge",
  ],
  Resources: [
    "prompt pack",
    "implementation checklist",
    "tool map",
    "deployment template",
    "client questionnaire",
    "audit sheet",
    "portfolio rubric",
    "SOP pack",
    "learning map",
    "evaluation rubric",
  ],
  "Beginner Corner": [
    "first 3 months",
    "tool basics",
    "confidence drills",
    "daily schedule",
    "mistake patterns",
    "mini projects",
    "practice cadence",
    "progress tracking",
    "mentor questions",
    "next step planning",
  ],
};

const titlePatterns: Record<SeedCategory, string[]> = {
  "AI Tools": [
    "How teams are using {topic} with {tool}",
    "Field note: turning {topic} into a repeatable system",
    "Stack review: best setup for {topic} this week",
    "Builder playbook for {topic} in under 45 minutes",
  ],
  "AI News": [
    "What changed in {topic} and why builders should care",
    "Weekly brief: {topic} in plain English",
    "Fast breakdown of {topic} with practical impact",
    "Signal check: where {topic} is moving next",
  ],
  "Daily Hacks": [
    "Daily execution hack: improve {topic} quality",
    "Small tweak, big result: fixing {topic} bottlenecks",
    "Five-minute upgrade for cleaner {topic}",
    "Operator shortcut for faster {topic}",
  ],
  Prompts: [
    "Prompt pattern for {topic} that actually ships work",
    "Reusable prompt blueprint: {topic}",
    "Prompt lab: tighter outputs for {topic}",
    "Production-safe prompt for {topic}",
  ],
  "Training Videos": [
    "Video lab: live build on {topic}",
    "Screen walkthrough: from blank page to {topic}",
    "Session replay: practical framework for {topic}",
    "Hands-on lesson: shipping {topic}",
  ],
  Workshops: [
    "Workshop session: build {topic} with mentors",
    "Live workshop track focused on {topic}",
    "Execution room: workshop for {topic}",
    "Mentored sprint: hands-on {topic}",
  ],
  Courses: [
    "Course module spotlight: {topic}",
    "Inside the syllabus: {topic} done right",
    "Learning path update for {topic}",
    "Course track deep dive: {topic}",
  ],
  Opportunities: [
    "New opportunity board entry: {topic}",
    "Open brief: paid scope around {topic}",
    "Career signal: teams hiring for {topic}",
    "Builder opportunity this week: {topic}",
  ],
  Resources: [
    "Resource vault drop: {topic}",
    "New template release for {topic}",
    "Downloadable toolkit for {topic}",
    "Reference pack to speed up {topic}",
  ],
  "Beginner Corner": [
    "Beginner guide: first steps in {topic}",
    "No-jargon primer for {topic}",
    "Start-here path: build confidence in {topic}",
    "Beginner sprint for mastering {topic}",
  ],
};

const descriptionPatterns: Record<SeedCategory, string[]> = {
  "AI Tools": [
    "Practical breakdown with setup sequence, guardrails, and where this workflow breaks in real usage.",
    "A realistic implementation note from builder workflows, including handoff points and QA checks.",
    "Short operating guide on combining tools without over-engineering the stack.",
  ],
  "AI News": [
    "Quick context, practical implications, and what to adjust this week if you are building seriously.",
    "No-hype summary with direct impact on learning plans, product choices, and execution speed.",
    "Curated signal with action notes for learners, freelancers, and operators.",
  ],
  "Daily Hacks": [
    "Step-by-step micro method you can apply today before your next output round.",
    "Execution-first tactic to save review time and improve reliability.",
    "A small systems habit that compounds across daily delivery.",
  ],
  Prompts: [
    "Includes role framing, constraints, output structure, and a fast refinement loop.",
    "Built for practical use: cleaner drafts, fewer retries, and better decision support.",
    "Prompt scaffold designed for consistent quality in real tasks.",
  ],
  "Training Videos": [
    "Watch the full build path with clear checkpoints so you can replicate it quickly.",
    "A practical lesson focused on doing, not passive watching.",
    "Recorded session that moves from setup to deployable outcome.",
  ],
  Workshops: [
    "Live session format with mentor feedback, build checkpoints, and applied outcomes.",
    "Workshop designed for execution clarity and portfolio-grade output.",
    "Focused sprint where learners build and review in one flow.",
  ],
  Courses: [
    "Course notes with outcomes, assignments, and applied project references.",
    "Structured module context so you can understand where this fits in the full track.",
    "Syllabus segment connected to hands-on work and measurable proof.",
  ],
  Opportunities: [
    "Role context, expected output quality, and quick prep direction before applying.",
    "Opportunity brief with scope clarity and practical fit for active builders.",
    "Straightforward opening details for portfolio-backed candidates.",
  ],
  Resources: [
    "Curated asset with direct use cases and suggested usage order.",
    "Action-ready template pack to shorten planning and implementation time.",
    "Useful reference built for daily execution, not shelf storage.",
  ],
  "Beginner Corner": [
    "Simple path with clear milestones so beginners can build confidence early.",
    "Foundational guidance with zero jargon and practical next actions.",
    "Starter-friendly structure that avoids overwhelm and improves momentum.",
  ],
};

const emojiByCategory: Record<SeedCategory, string> = {
  "AI Tools": "TL",
  "AI News": "NW",
  "Daily Hacks": "HK",
  Prompts: "PR",
  "Training Videos": "VD",
  Workshops: "WS",
  Courses: "CR",
  Opportunities: "OP",
  Resources: "RS",
  "Beginner Corner": "BG",
};

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const pick = (list: string[], seed: number) => list[seed % list.length];

const getDateForIndex = (categoryIndex: number, itemIndex: number) => {
  const dayOffset = (itemIndex * 7 + categoryIndex * 5) % TOTAL_DAYS;
  const hour = (8 + ((itemIndex * 3 + categoryIndex * 2) % 14)) % 24;
  const minute = (itemIndex * 11 + categoryIndex * 13) % 60;
  const second = (itemIndex * 17 + categoryIndex * 19) % 60;
  const date = new Date(START);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, minute, second, 0);
  if (date.getTime() > NOW.getTime()) return NOW.toISOString();
  return date.toISOString();
};

const buildTitle = (category: SeedCategory, i: number) => {
  const topic = pick(topicByCategory[category], i * 3 + 1);
  const pattern = pick(titlePatterns[category], i * 7 + 2);
  const tool = pick(["ChatGPT", "Claude", "Gemini", "Perplexity", "n8n", "Cursor"], i * 5 + 3);
  return pattern.replace("{topic}", topic).replace("{tool}", tool);
};

const buildDescription = (category: SeedCategory, i: number) => {
  const base = pick(descriptionPatterns[category], i * 11 + 4);
  const suffix = pick(
    [
      "Includes one practical checklist.",
      "Shared in a concise builder format.",
      "Optimized for quick implementation.",
      "Useful for portfolio-facing work.",
      "Mapped to real execution context.",
    ],
    i * 13 + 8,
  );
  return `${base} ${suffix}`;
};

const getCtaText = (category: SeedCategory) => {
  switch (category) {
    case "Training Videos":
      return "Watch";
    case "Workshops":
      return "Register";
    case "Courses":
      return "View Course";
    case "Resources":
      return "Access";
    case "Opportunities":
      return "Apply";
    case "Prompts":
      return "Copy Prompt";
    default:
      return "View";
  }
};

const getCtaLink = (category: SeedCategory, i: number) => {
  if (category === "Training Videos") return videoLinks[i % videoLinks.length];
  if (category === "Resources") return freeResourceLinks[i % freeResourceLinks.length];
  if (category === "AI Tools") return toolLinks[i % toolLinks.length];
  if (category === "Workshops") return "/#contact";
  if (category === "Courses") return "/community/dashboard?category=Courses";
  if (category === "Opportunities") return "/#contact";
  if (category === "Prompts") return "/community/dashboard?category=Prompts";
  return "/community/dashboard";
};

const getContentHtml = (category: SeedCategory, i: number) => {
  if (category === "Prompts") {
    const useCase = pick(topicByCategory.Prompts, i * 3 + 9);
    return `<h3>Prompt Exercise</h3><p>Use case: ${useCase}</p><p>Structure: role + context + constraints + expected format.</p><p>Review loop: run, refine, and compare two variants.</p>`;
  }

  if (category === "Courses") {
    return `<h3>Course Structure</h3><ul>${coursePages
      .map((page, idx) => `<li>Page ${idx + 1}: ${page}</li>`)
      .join("")}</ul><p>Outcome: complete project artifacts with review checkpoints.</p>`;
  }

  if (category === "Training Videos") {
    const link = videoLinks[i % videoLinks.length];
    return `<h3>Session Breakdown</h3><p>1) Problem framing</p><p>2) Live implementation</p><p>3) QA and deployment notes</p><p><a href="${link}" target="_blank" rel="noreferrer">Open video lesson</a></p>`;
  }

  return `<p>${buildDescription(category, i)}</p>`;
};

const makeStats = (i: number, categoryIndex: number) => ({
  likes_count: 40 + ((i * 19 + categoryIndex * 13) % 900),
  comments_count: 5 + ((i * 7 + categoryIndex * 3) % 140),
  saves_count: 10 + ((i * 11 + categoryIndex * 5) % 220),
  views_count: 200 + ((i * 37 + categoryIndex * 29) % 14000),
});

export const seededPosts: SeedPost[] = CATEGORIES.flatMap((category, categoryIndex) =>
  Array.from({ length: POSTS_PER_CATEGORY }).map((_, i) => ({
    id: `seed-${slug(category)}-${String(i + 1).padStart(3, "0")}`,
    title: buildTitle(category, i),
    description: buildDescription(category, i),
    content_html: getContentHtml(category, i),
    category,
    cta_text: getCtaText(category),
    cta_link: getCtaLink(category, i),
    created_at: getDateForIndex(categoryIndex, i),
    thumbnail_emoji: emojiByCategory[category],
    ...makeStats(i, categoryIndex),
  })),
).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export const seededWorkshops: SeedWorkshop[] = Array.from({ length: 24 }).map((_, i) => {
  const dayOffset = i + 1;
  const d = new Date("2026-04-01T09:00:00Z");
  d.setUTCDate(d.getUTCDate() + dayOffset);

  return {
    id: `seed-workshop-${String(i + 1).padStart(2, "0")}`,
    title: `Live Build Sprint ${i + 1}: Practical AI Delivery`,
    description:
      "Mentor-led execution room covering scope, build decisions, QA, and output packaging.",
    event_date: d.toISOString(),
    meeting_url: "https://onrol.in",
    registration_count: 35 + ((i * 9) % 200),
    image_url: `/media/home/interview-${(i % 3) + 1}.svg`,
  };
});

export const seededResources: SeedResource[] = Array.from({ length: 30 }).map((_, i) => ({
  id: `seed-resource-${String(i + 1).padStart(2, "0")}`,
  title: `Execution Resource Pack ${i + 1}`,
  description: "Curated references, templates, and checklists for practical AI implementation.",
  resource_type: i % 3 === 0 ? "PDF" : i % 3 === 1 ? "Video" : "Tool",
  is_premium: i % 7 === 0,
  is_free: i % 7 !== 0,
  external_url: freeResourceLinks[i % freeResourceLinks.length],
}));

export const seededPoll: SeedPoll = {
  id: "seed-poll-2026-q1",
  question: "Which deep-dive should ONROL run next for serious builders?",
  options: [
    { id: "seed-opt-1", text: "Automation Architecture", votes: 184 },
    { id: "seed-opt-2", text: "Prompt Systems at Scale", votes: 142 },
    { id: "seed-opt-3", text: "RAG + Knowledge Workflows", votes: 167 },
    { id: "seed-opt-4", text: "Freelance Execution Playbooks", votes: 129 },
  ],
  total_votes: 622,
};
