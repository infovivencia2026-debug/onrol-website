import { COHORT_LABEL_SHORT } from "./brand";

export type ProgramStat = {
  label: string;
  value: string;
};

export type ProgramOutcome = {
  title: string;
  description?: string;
};

export type ProgramJourneyModule = {
  id: string;
  title: string;
  description: string;
  topics: string[];
};

export type ProgramAudienceItem = {
  title: string;
  description: string;
};

export type ProgramProof = {
  headline: string;
  body: string;
  bullets: string[];
};

export type ProgramPricing = {
  label: string;
  duration: string;
  fee: string;
  inclusions: string[];
  supportLine: string;
  cta: string;
};

export type ProgramFaq = {
  question: string;
  answer: string;
};

export type ProgramFinalCta = {
  headline: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
};

export type ProgramPageData = {
  slug: "ai-generalist" | "ai-architect";
  title: string;
  subtitle: string;
  duration: string;
  cohortLabel: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroSupportLine: string;
  primaryCta: string;
  secondaryCta: string;
  stats: ProgramStat[];
  positioning: {
    headline: string;
    body: string;
    line: string;
  };
  outcomesHeading: string;
  outcomes: ProgramOutcome[];
  journeyHeading: string;
  modules: ProgramJourneyModule[];
  audienceHeading: string;
  audienceFit: ProgramAudienceItem[];
  proofSection: ProgramProof;
  leadFormHeadline: string;
  curriculumHeading: string;
  pricing: ProgramPricing;
  faqs: ProgramFaq[];
  finalCta: ProgramFinalCta;
  pathway: {
    label: string;
    href: string;
    description: string;
  };
};

export const programsData: Record<ProgramPageData["slug"], ProgramPageData> = {
  "ai-generalist": {
    slug: "ai-generalist",
    title: "AI Generalist",
    subtitle: "AI Tools and Portfolio Mastery Program",
    duration: "",
    cohortLabel: COHORT_LABEL_SHORT,
    heroHeadline: "Stop Watching Tutorials. Start Building.",
    heroSubheadline: "This is the fastest path from a passive AI consumer to a capable AI builder.",
    heroSupportLine:
      "Build real projects, automate workflows, launch a live website, and create a personal AI assistant in just 3 months.",
    primaryCta: "Register Now",
    secondaryCta: "Download Brochure",
    stats: [
      { value: "3 Months", label: "Intensive" },
      { value: "3 Live Projects", label: "Build Outcomes" },
      { value: "Beginner Friendly", label: "No Barrier Start" },
      { value: "Portfolio-Ready", label: "Deployment Outputs" },
    ],
    positioning: {
      headline: "No Other AI Program Is Built Like This",
      body: "The market does not reward people for knowing prompts. It rewards people who can build real solutions.",
      line: "We build builders, not passive learners.",
    },
    outcomesHeading: "By the end of this program, learners launch 3 live projects",
    outcomes: [
      { title: "Backend Automation System" },
      { title: "Vibe-Coded Live Website" },
      { title: "Fine-Tuned Personal AI Assistant" },
    ],
    journeyHeading: "Your 5-Module Journey to AI Building",
    modules: [
      {
        id: "Module 1",
        title: "AI Foundations and Prompt Mastery",
        description:
          "Learn the unique strengths of leading AI models and master structured prompting for better outputs, clarity, and control.",
        topics: [
          "Claude",
          "ChatGPT",
          "Gemini",
          "Perplexity",
          "Structured prompting",
          "Markdown thinking structure",
          "Hallucination reduction",
        ],
      },
      {
        id: "Module 2",
        title: "RAG and AI Personalization",
        description: "Learn how to make AI work with private knowledge, documents, and contextual memory.",
        topics: [
          "RAG basics",
          "Private PDF understanding",
          "Company knowledge systems",
          "Fine-tuning introduction",
          "LoRA introduction",
          "Brand voice alignment",
        ],
      },
      {
        id: "Module 3",
        title: "Automation Systems with n8n",
        description: "Connect AI to tools and build real automation systems that work across your workflow.",
        topics: [
          "n8n",
          "Gmail integration",
          "Google Sheets integration",
          "APIs",
          "Webhooks",
          "AI workflow generation",
        ],
      },
      {
        id: "Module 4",
        title: "Vibe Coding and Website Launch",
        description: "Build and deploy a live website using AI-assisted development without needing traditional coding expertise.",
        topics: [
          "AI coding tools",
          "IDE-assisted development",
          "No-code / low-code thinking",
          "Interface building",
          "Deployment",
        ],
      },
      {
        id: "Module 5",
        title: "Ecosystem Launch",
        description:
          "Connect your assistant, automation, and website into one working ecosystem and present it as portfolio proof.",
        topics: ["System integration", "Demo recording", "Final showcase", "Launch presentation", "Certification"],
      },
    ],
    audienceHeading: "Is This Program Right For You?",
    audienceFit: [
      {
        title: "Students",
        description: "Build portfolio and future-ready skills before entering the market.",
      },
      {
        title: "Working Professionals",
        description: "Upgrade your profile and become execution-ready for better roles.",
      },
      {
        title: "Founders / Builders",
        description: "Prototype faster and launch AI-driven solutions without technical bottlenecks.",
      },
      {
        title: "Freelancers",
        description: "Build proof, projects, and income-ready portfolio assets.",
      },
    ],
    proofSection: {
      headline: "Proof of Your Expertise",
      body: "Following the final showcase, learners receive the ONROL AI Generalist Certificate. This is not proof of attendance. It is proof that they built real outcomes.",
      bullets: ["Project showcase review", "Portfolio-grade launch output", "Certificate linked to execution proof"],
    },
    leadFormHeadline: "Ready to Start Building?",
    curriculumHeading: "Detailed Curriculum",
    pricing: {
      label: "Generalist Track",
      duration: "3 Months",
      fee: "Fee details shared in live session",
      inclusions: [
        "Live expert-led sessions",
        "Hands-on building",
        "Final showcase",
        "Certificate",
        "Portfolio outputs",
      ],
      supportLine: "Built for rapid execution with mentor guidance and launch readiness.",
      cta: "Reserve Your Seat",
    },
    faqs: [
      {
        question: "Do I need coding experience?",
        answer: "No prior coding experience is required. The learning flow is beginner-friendly and execution guided.",
      },
      {
        question: "Is this beginner-friendly?",
        answer: "Yes. The program is designed to move you from basics to deployable outcomes quickly.",
      },
      {
        question: "Will I build real projects?",
        answer: "Yes. You complete and launch three practical projects that can be used as proof of capability.",
      },
      {
        question: "What happens after the 3 months?",
        answer: "You graduate with deployed outputs, proof assets, and direction for advanced progression pathways.",
      },
      {
        question: "Can working professionals join?",
        answer: "Yes. The intensive format supports professionals who want rapid upskilling and practical output.",
      },
      {
        question: "Will I get a certificate?",
        answer: "Yes. Certification is awarded after final showcase and proof review.",
      },
      {
        question: "Can I use these projects in my portfolio?",
        answer: "Absolutely. The projects are built to become immediate portfolio and interview assets.",
      },
    ],
    finalCta: {
      headline: COHORT_LABEL_SHORT,
      description: "Step into your builder phase with a focused, high-output intensive.",
      primaryCta: "Register Now",
      secondaryCta: "Reserve Your Seat",
    },
    pathway: {
      label: "Next-Level Path",
      href: "/programs/ai-architect",
      description: "After Generalist, continue into AI Architect to deepen orchestration and systems-level execution.",
    },
  },
  "ai-architect": {
    slug: "ai-architect",
    title: "AI Architect",
    subtitle: "Advanced AI Systems and Execution Program",
    duration: "9 Weeks Intensive",
    cohortLabel: "Next Cohort Opens Soon",
    heroHeadline: "Stop Using AI. Start Orchestrating It.",
    heroSubheadline:
      "A structured advanced program for learners who want to move beyond tools into real orchestration, systems thinking, and execution capability.",
    heroSupportLine:
      "Designed for learners who want deeper real-world ability, stronger project proof, and advanced portfolio outcomes.",
    primaryCta: "Check My Eligibility",
    secondaryCta: "Talk to an Advisor",
    stats: [
      { value: "9 Weeks", label: "Deep Program Arc" },
      { value: "Advanced Systems Thinking", label: "Execution Architecture" },
      { value: "Execution-Focused", label: "Applied Learning" },
      { value: "Stronger Portfolio Proof", label: "Career Credibility" },
    ],
    positioning: {
      headline: "This Is Where AI Users Become AI Operators",
      body: "Most learners stop at prompts, tutorials, and scattered tools. This program is designed to create a more capable execution layer through systems thinking, orchestration, deployment, and applied outcomes.",
      line: "We build orchestration capability, not surface-level familiarity.",
    },
    outcomesHeading: "What You Will Become",
    outcomes: [
      { title: "Workflow Orchestrator" },
      { title: "Multi-Tool AI Operator" },
      { title: "Systems-Level Builder" },
      { title: "Practical Automation Thinker" },
      { title: "Portfolio-Backed Execution Candidate" },
    ],
    journeyHeading: "Your 9-Week Journey to AI Orchestration",
    modules: [
      {
        id: "Week 1",
        title: "Problem Discovery and Orientation",
        description: "Define high-value execution problems and map where orchestration creates leverage.",
        topics: ["Problem framing", "Outcome mapping", "Execution baseline"],
      },
      {
        id: "Week 2",
        title: "LLM Understanding and Context Engineering",
        description: "Design better model behavior through context, constraints, and control strategies.",
        topics: ["Model behavior", "Prompt architecture", "Context windows"],
      },
      {
        id: "Week 3",
        title: "Workflow Automation Foundations",
        description: "Build reliable workflows across tools with operational clarity and control.",
        topics: ["Workflow logic", "Triggers and actions", "Error handling"],
      },
      {
        id: "Week 4",
        title: "Local AI and Deployment Understanding",
        description: "Understand local model workflows and deployment tradeoffs for practical use cases.",
        topics: ["Local model setups", "Latency tradeoffs", "Deployment basics"],
      },
      {
        id: "Week 5",
        title: "Knowledge Systems and RAG",
        description: "Create retrieval-backed systems that provide grounded, context-aware outputs.",
        topics: ["Knowledge ingestion", "Retrieval strategies", "Context reliability"],
      },
      {
        id: "Week 6",
        title: "AI Media and Content Workflows",
        description: "Orchestrate media and content pipelines with repeatable AI-assisted processes.",
        topics: ["Media pipelines", "Content systems", "Automation loops"],
      },
      {
        id: "Week 7",
        title: "Product Building and Deployment Thinking",
        description: "Package workflow capabilities into product-ready experiences and deploy safely.",
        topics: ["Product framing", "Delivery stack", "Launch strategy"],
      },
      {
        id: "Week 8",
        title: "Agent Systems and Orchestration",
        description: "Coordinate multi-step agent behavior for robust real-world execution.",
        topics: ["Agent design", "Task coordination", "System safeguards"],
      },
      {
        id: "Week 9",
        title: "Capstone Integration and Launch",
        description: "Integrate your full stack into one orchestration narrative and present final proof.",
        topics: ["Capstone integration", "Demo narrative", "Portfolio launch"],
      },
    ],
    audienceHeading: "Is This Advanced Program For You?",
    audienceFit: [
      {
        title: "Serious Learners",
        description: "You want more than prompt familiarity.",
      },
      {
        title: "Builders",
        description: "You want stronger execution proof.",
      },
      {
        title: "Career-Focused Professionals",
        description: "You want deeper systems understanding and stronger portfolio credibility.",
      },
      {
        title: "Committed Performers",
        description: "You are willing to build consistently and seriously.",
      },
    ],
    proofSection: {
      headline: "Execution Changes Everything",
      body: "This program is designed to help learners build stronger real-world proof through systems, workflows, deployment thinking, and advanced portfolio outcomes.",
      bullets: ["Capstone-level orchestration proof", "Systems and deployment narrative", "Advanced execution portfolio assets"],
    },
    leadFormHeadline: "Check If You Qualify for the Next Cohort",
    curriculumHeading: "Program Curriculum",
    pricing: {
      label: "Advanced Architect Track",
      duration: "9 Weeks",
      fee: "Program fee shared during eligibility call",
      inclusions: [
        "Advanced support",
        "Execution-first workflows",
        "Portfolio outcomes",
        "Cohort mentorship",
        "Internship / execution pathway if applicable",
      ],
      supportLine: "Designed for serious learners committed to deeper systems capability.",
      cta: "Check My Eligibility",
    },
    faqs: [
      {
        question: "Who is this program best suited for?",
        answer: "Learners who want advanced execution capability beyond basic AI tool usage.",
      },
      {
        question: "Do I need prior coding experience?",
        answer: "Prior coding helps but is not mandatory. Structured support is provided for practical execution.",
      },
      {
        question: "How is this different from AI Generalist?",
        answer: "Generalist focuses fast foundational builds; Architect is deeper systems thinking and orchestration.",
      },
      {
        question: "What exactly will I build?",
        answer: "You build multi-step orchestration systems, applied workflows, and capstone-level proof artifacts.",
      },
      {
        question: "How much time commitment is required?",
        answer: "Plan for consistent weekly build time plus live sessions for full value extraction.",
      },
      {
        question: "Can I do this while working?",
        answer: "Yes, many working professionals join. Consistency and disciplined execution are essential.",
      },
      {
        question: "Is pricing transparent?",
        answer: "Yes. Fee details and inclusions are clarified during eligibility and advisory discussions.",
      },
      {
        question: "What outcomes can I expect after completion?",
        answer: "Stronger systems-level portfolio proof and improved execution credibility for advanced opportunities.",
      },
    ],
    finalCta: {
      headline: "Next Cohort Opens Soon",
      description: "Move from AI usage to orchestration capability with guided advanced execution.",
      primaryCta: "Check My Eligibility",
      secondaryCta: "Talk to an Advisor",
    },
    pathway: {
      label: "Need a Strong Foundation First?",
      href: "/programs/ai-generalist",
      description: "New to building? Start with AI Generalist, then progress into the Architect track.",
    },
  },
};

export const programsDropdownData = [
  {
    slug: "ai-generalist",
    title: "AI Generalist",
    description: "Build your first AI portfolio, automation system, and deployable website in 3 months",
    duration: "3 Months",
    href: "/programs/ai-generalist",
  },
  {
    slug: "ai-architect",
    title: "AI Architect",
    description:
      "Advanced program for deeper AI systems, orchestration, execution capability, and career outcomes",
    duration: "9 Weeks",
    href: "/programs/ai-architect",
  },
] as const;
