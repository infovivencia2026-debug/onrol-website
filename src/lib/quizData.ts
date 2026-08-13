// AI Skills Quiz — 12 questions, 5 dimensions, weighted scoring.
// Output: a 0-100 readiness score, the user's strongest + weakest dimension,
// and a recommended ONROL track (Generalist vs Architect).

export type Dimension =
  | "Prompting"
  | "Tools"
  | "Automation"
  | "BuildShip"
  | "Mindset";

export interface QuizOption {
  label: string;
  /** Points awarded per dimension by this answer. */
  points: Partial<Record<Dimension, number>>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export const DIMENSIONS: Dimension[] = [
  "Prompting",
  "Tools",
  "Automation",
  "BuildShip",
  "Mindset",
];

export const DIMENSION_INFO: Record<Dimension, { label: string; blurb: string }> = {
  Prompting: {
    label: "Prompting",
    blurb: "How well you can get reliable, high-quality outputs from LLMs.",
  },
  Tools: {
    label: "AI tools",
    blurb: "Range and depth of AI tools you can actually use to ship work.",
  },
  Automation: {
    label: "Automation",
    blurb: "Comfort wiring AI into multi-step workflows that run without you.",
  },
  BuildShip: {
    label: "Build & ship",
    blurb: "Ability to take an idea and put a working AI thing in front of users.",
  },
  Mindset: {
    label: "Execution mindset",
    blurb: "Whether you treat AI as a curiosity or as a way to deliver outcomes.",
  },
};

export const QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "When you ask Claude or ChatGPT for something, what do you usually do?",
    options: [
      {
        label: "Type one short sentence and hope for the best",
        points: { Prompting: 0, Mindset: 1 },
      },
      {
        label: "Give a short instruction and refine if it's wrong",
        points: { Prompting: 1, Mindset: 1 },
      },
      {
        label: "Write a structured prompt with role, context, format",
        points: { Prompting: 3, Mindset: 2 },
      },
      {
        label: "Use a saved prompt template I've iterated on",
        points: { Prompting: 4, Mindset: 3, BuildShip: 1 },
      },
    ],
  },
  {
    id: "q2",
    question: "How many AI tools do you actively use in your workflow?",
    options: [
      { label: "Just ChatGPT, occasionally", points: { Tools: 0 } },
      { label: "2–3 (e.g. ChatGPT + one image tool)", points: { Tools: 1 } },
      { label: "4–6 across writing, search, automation", points: { Tools: 3 } },
      { label: "7+ — I have a real AI stack", points: { Tools: 4, Mindset: 2 } },
    ],
  },
  {
    id: "q3",
    question: "Have you used Perplexity or another AI search engine for research?",
    options: [
      { label: "Never heard of it", points: { Tools: 0 } },
      { label: "Tried it once or twice", points: { Tools: 1 } },
      { label: "Use it weekly for fact-finding", points: { Tools: 2 } },
      { label: "It's my default search engine", points: { Tools: 3, Mindset: 1 } },
    ],
  },
  {
    id: "q4",
    question: "Have you ever set up an automation that runs without you (Zapier, n8n, Make)?",
    options: [
      { label: "No, I do everything manually", points: { Automation: 0 } },
      { label: "I've tried but couldn't finish one", points: { Automation: 1 } },
      { label: "I have 1–2 simple automations live", points: { Automation: 2, BuildShip: 1 } },
      {
        label: "I've built multi-step automations with AI inside",
        points: { Automation: 4, BuildShip: 2, Mindset: 2 },
      },
    ],
  },
  {
    id: "q5",
    question: "How comfortable are you with the term \"API\"?",
    options: [
      { label: "I don't know what it means", points: { Tools: 0, Automation: 0 } },
      { label: "I roughly know what it is", points: { Tools: 1 } },
      { label: "I've used one inside a no-code tool", points: { Tools: 2, Automation: 2 } },
      {
        label: "I've called APIs from code or scripts",
        points: { Tools: 3, Automation: 3, BuildShip: 2 },
      },
    ],
  },
  {
    id: "q6",
    question: "Have you ever \"vibe-coded\" — built software by describing it to AI in plain English?",
    options: [
      { label: "Never tried", points: { BuildShip: 0 } },
      { label: "Played with Bolt.new or Lovable once", points: { BuildShip: 1 } },
      { label: "Shipped a small project this way", points: { BuildShip: 3, Mindset: 2 } },
      {
        label: "I regularly ship working software with AI as my pair programmer",
        points: { BuildShip: 4, Mindset: 3, Tools: 1 },
      },
    ],
  },
  {
    id: "q7",
    question: "Do you know what RAG (Retrieval-Augmented Generation) is?",
    options: [
      { label: "No idea", points: {} },
      { label: "Heard the term", points: { Prompting: 1 } },
      { label: "I understand the concept", points: { Prompting: 2, Tools: 1 } },
      {
        label: "I've built or used a RAG system",
        points: { Prompting: 3, BuildShip: 3, Tools: 2 },
      },
    ],
  },
  {
    id: "q8",
    question: "How would you describe your AI agent / orchestration knowledge?",
    options: [
      { label: "What's an AI agent?", points: {} },
      { label: "I've heard of agents but never used one", points: { Automation: 1 } },
      {
        label: "I've used agentic features in tools like Cursor",
        points: { Automation: 2, BuildShip: 2 },
      },
      {
        label: "I've designed multi-step agent workflows myself",
        points: { Automation: 4, BuildShip: 3, Mindset: 2 },
      },
    ],
  },
  {
    id: "q9",
    question: "When you learn a new AI technique, what happens next?",
    options: [
      { label: "I save the link, never come back", points: { Mindset: 0 } },
      { label: "I try it once on a personal task", points: { Mindset: 1 } },
      {
        label: "I build a small project around it",
        points: { Mindset: 3, BuildShip: 2 },
      },
      {
        label: "I ship something using it that solves a real problem",
        points: { Mindset: 4, BuildShip: 3 },
      },
    ],
  },
  {
    id: "q10",
    question: "Have you deployed anything (a website, bot, automation) live on the internet?",
    options: [
      { label: "No", points: { BuildShip: 0 } },
      { label: "A static site once", points: { BuildShip: 1 } },
      {
        label: "Yes — 1–2 live projects",
        points: { BuildShip: 2, Mindset: 1 },
      },
      {
        label: "Multiple live projects with real users",
        points: { BuildShip: 4, Mindset: 3 },
      },
    ],
  },
  {
    id: "q11",
    question: "How do you handle AI hallucinations / wrong answers?",
    options: [
      { label: "I usually trust the first answer", points: { Prompting: 0 } },
      { label: "I cross-check on Google", points: { Prompting: 1 } },
      {
        label: "I prompt for citations and verify them",
        points: { Prompting: 2, Tools: 1 },
      },
      {
        label: "I ground answers in retrieved documents (RAG / Perplexity)",
        points: { Prompting: 3, Tools: 2, BuildShip: 1 },
      },
    ],
  },
  {
    id: "q12",
    question: "What's your honest goal with AI?",
    options: [
      {
        label: "Curious — exploring what's possible",
        points: { Mindset: 1 },
      },
      {
        label: "Use AI to do my current job faster",
        points: { Mindset: 2, Tools: 1 },
      },
      {
        label: "Earn from AI — freelance, side income, products",
        points: { Mindset: 3, BuildShip: 2, Automation: 1 },
      },
      {
        label: "Build a serious AI-first business or career",
        points: { Mindset: 4, BuildShip: 3, Automation: 2 },
      },
    ],
  },
];

// ── Scoring ─────────────────────────────────────────────────────────────
// Each dimension's max possible score is the sum of its top option per question.
const MAX_BY_DIM: Record<Dimension, number> = (() => {
  const m: Record<Dimension, number> = {
    Prompting: 0,
    Tools: 0,
    Automation: 0,
    BuildShip: 0,
    Mindset: 0,
  };
  for (const q of QUESTIONS) {
    for (const dim of DIMENSIONS) {
      const max = Math.max(...q.options.map((o) => o.points[dim] ?? 0));
      m[dim] += max;
    }
  }
  return m;
})();

export interface QuizResult {
  total: number;             // 0-100
  byDimension: Record<Dimension, { raw: number; max: number; pct: number }>;
  strongest: Dimension;
  weakest: Dimension;
  band: "starter" | "explorer" | "operator" | "shipper";
  bandLabel: string;
  bandSummary: string;
  recommendedTrack: { slug: "ai-generalist" | "ai-architect"; reason: string };
}

export function scoreQuiz(answers: Record<string, number>): QuizResult {
  const raw: Record<Dimension, number> = {
    Prompting: 0, Tools: 0, Automation: 0, BuildShip: 0, Mindset: 0,
  };
  for (const q of QUESTIONS) {
    const idx = answers[q.id];
    if (idx === undefined) continue;
    const opt = q.options[idx];
    if (!opt) continue;
    for (const dim of DIMENSIONS) {
      raw[dim] += opt.points[dim] ?? 0;
    }
  }
  const byDimension = {} as QuizResult["byDimension"];
  let totalRaw = 0;
  let totalMax = 0;
  for (const dim of DIMENSIONS) {
    const max = MAX_BY_DIM[dim];
    const pct = max > 0 ? Math.round((raw[dim] / max) * 100) : 0;
    byDimension[dim] = { raw: raw[dim], max, pct };
    totalRaw += raw[dim];
    totalMax += max;
  }
  const total = Math.round((totalRaw / totalMax) * 100);

  // Strongest / weakest by percentage
  let strongest: Dimension = DIMENSIONS[0];
  let weakest: Dimension = DIMENSIONS[0];
  for (const dim of DIMENSIONS) {
    if (byDimension[dim].pct > byDimension[strongest].pct) strongest = dim;
    if (byDimension[dim].pct < byDimension[weakest].pct) weakest = dim;
  }

  let band: QuizResult["band"];
  let bandLabel: string;
  let bandSummary: string;
  if (total < 25) {
    band = "starter";
    bandLabel = "AI Starter";
    bandSummary =
      "You're at the beginning — you've heard about AI but haven't shipped much yet. The good news: this is the highest-leverage moment to start, and the gap between zero and your first deployed AI project is smaller than you think.";
  } else if (total < 50) {
    band = "explorer";
    bandLabel = "AI Explorer";
    bandSummary =
      "You've experimented with AI tools but haven't built a coherent stack or shipped real work yet. You need a structured path that turns scattered usage into deployed projects.";
  } else if (total < 75) {
    band = "operator";
    bandLabel = "AI Operator";
    bandSummary =
      "You're already using AI productively across tools. Next leap: orchestration — chaining multiple AI calls and tools into systems that deliver outcomes without you in the loop.";
  } else {
    band = "shipper";
    bandLabel = "AI Shipper";
    bandSummary =
      "You're already shipping AI-driven work. The frontier for you is agents, multi-step orchestration, and turning your skill into products and services that scale.";
  }

  // Recommend track based on band + Automation/BuildShip readiness
  const orchestratorReady =
    total >= 55 ||
    (byDimension.Automation.pct >= 60 && byDimension.BuildShip.pct >= 50);
  const recommendedTrack = orchestratorReady
    ? {
        slug: "ai-architect" as const,
        reason:
          "You already have the basics. The Architect track moves you into agents, multi-step workflows, and shipping AI products at scale — which is where the real career and revenue leverage is.",
      }
    : {
        slug: "ai-generalist" as const,
        reason:
          "Your fastest win is the AI Generalist 3-month intensive. By the end you'll have 3 deployed projects: an automation, a vibe-coded site, and a personal AI assistant — exactly the foundation everything else builds on.",
      };

  return {
    total,
    byDimension,
    strongest,
    weakest,
    band,
    bandLabel,
    bandSummary,
    recommendedTrack,
  };
}
