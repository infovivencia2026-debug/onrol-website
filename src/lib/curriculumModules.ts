// Source of truth for the 3-month AI Generalist curriculum. Consumed by:
//   - <HomeCurriculum> on the homepage (dark Outskill-style block)
//   - <JourneySection> on /programs/ai-generalist/ (light program-page block)
// Edit here once and both places update.

export interface CurriculumModule {
  day: number;
  title: string;
  /** Short tagline shown next to the day number on the home block. */
  tag: string;
  details: string[];
  /** Day-end deliverable — what the learner walks away with. */
  output: string;
}

export const CURRICULUM_MODULES: CurriculumModule[] = [
  {
    day: 1,
    title: "AI Foundations & Prompt Mastery",
    tag: "Tools + structured prompting",
    details: [
      "Understand AI models (Claude, ChatGPT, Gemini, Perplexity)",
      "Learn the structured prompting framework",
      "Eliminate bad outputs & hallucinations",
    ],
    output: "Reliable AI workflow you can trust",
  },
  {
    day: 2,
    title: "RAG & AI Personalization",
    tag: "AI that reads your private data",
    details: [
      "Build AI that reads private data",
      "Learn RAG architecture end-to-end",
      "Intro to fine-tuning & personalization",
    ],
    output: "Personal AI assistant grounded in your docs",
  },
  {
    day: 3,
    title: "Automation Systems (n8n)",
    tag: "Connect AI to your stack",
    details: [
      "Connect AI with tools (Gmail, Sheets, Slack)",
      "Build multi-step workflows",
      "Create autonomous systems",
    ],
    output: "Live backend automation running on a schedule",
  },
  {
    day: 4,
    title: "Vibe Coding (Website Building)",
    tag: "Ship a real site with AI",
    details: [
      "Build websites using AI (no coding required)",
      "Use AI IDE tools",
      "Deploy live applications",
    ],
    output: "A vibe-coded website live on a real URL",
  },
  {
    day: 5,
    title: "Ecosystem Launch",
    tag: "Stitch it all together",
    details: [
      "Integrate all systems into one ecosystem",
      "Launch your complete AI stack",
      "Record demos + publish portfolio",
    ],
    output: "Three deployed projects on your portfolio",
  },
];
