export type SurveyType = "student" | "professional";

export type SurveyInsight = {
  heading: string;
  body: string;
  source?: string;
};

export type SurveyQuestion = {
  id: string;
  title: string;
  subtitle?: string;
  type: "single" | "slider" | "text";
  options?: string[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  insight: SurveyInsight;
  optional?: boolean;
  placeholder?: string;
};

export type SurveyDefinition = {
  type: SurveyType;
  title: string;
  intro: string;
  tableName: string;
  questions: SurveyQuestion[];
  webhookUrl?: string;
};

export const surveyDefinitions: Record<SurveyType, SurveyDefinition> = {
  professional: {
    type: "professional",
    title: "Working Professional Diagnostic",
    intro:
      "A focused 10-step diagnostic to measure your growth, AI readiness, and income trajectory for the next 8-12 months.",
    tableName: "survey_professional_responses",
    webhookUrl: "https://script.google.com/macros/s/AKfycbz6GwTT9PMvnDu5HRPgQlQUEDAlZY8aRDr8lLDTdTBjb2EhH7OqDWJ7_I3nTQ4nO9rm/exec",
    questions: [
      {
        id: "q1_growth_satisfaction",
        title: "How satisfied are you with your current career growth and income?",
        subtitle: "Rate from 1 to 10.",
        type: "slider",
        min: 1,
        max: 10,
        minLabel: "1 = not satisfied at all",
        maxLabel: "10 = very satisfied",
        insight: {
          heading: "Industry Signal",
          body: "Only about 1 in 2 professionals feel satisfied with their income trajectory, and the gap is widening as AI adoption accelerates.",
          source: "McKinsey Future of Work 2025, LinkedIn Workforce Confidence Index",
        },
      },
      {
        id: "q2_ai_impact",
        title: "Do you feel AI is already impacting your work or can significantly improve your productivity?",
        type: "single",
        options: [
          "Yes, it is already changing how I work",
          "Yes, I can become far more productive with AI",
          "Not much impact yet",
          "Not sure",
        ],
        insight: {
          heading: "CEO Briefing",
          body: "Leaders across major AI companies consistently say AI will not replace people first, it will replace people not using AI tools.",
          source: "OpenAI, Anthropic, Microsoft leadership statements",
        },
      },
      {
        id: "q3_career_stability",
        title: "How stable do you feel your current career is over the next 2-3 years?",
        type: "single",
        options: ["Stable and growing", "Stable but slow growth", "Uncertain", "Need to change direction"],
        insight: {
          heading: "Salary Data",
          body: "AI-skilled professionals are already earning meaningful pay premiums in similar roles compared to peers without AI capability.",
          source: "WEF Future of Jobs 2025",
        },
      },
      {
        id: "q4_income_streams",
        title: "Do you feel limited by having only one source of income?",
        type: "single",
        options: [
          "Yes, I want multiple income streams",
          "Sometimes, I have thought about it",
          "No, current income is enough",
          "I have never thought about it",
        ],
        insight: {
          heading: "Income Research",
          body: "Top earners usually have 2-4 income streams, and AI is reducing the time needed to build a second stream.",
          source: "McKinsey Global Institute",
        },
      },
      {
        id: "q5_time_commitment",
        title: "How much time can you realistically dedicate weekly to building new skills?",
        type: "single",
        options: ["4-6 hours / week", "6-10 hours / week", "10-15 hours / week", "15+ hours / week"],
        insight: {
          heading: "Workforce Data",
          body: "Professionals who invest consistently in structured upskilling tend to grow income much faster than those who do not.",
          source: "Gartner AI Workforce Trends 2026",
        },
      },
      {
        id: "q6_pricing_ai_generalist",
        title: "AI Generalist Program (8 weeks + 1-year support), market pricing is often Rs1.5L to Rs3L. What is your view?",
        type: "single",
        options: [
          "Price is okay if strong outcomes are delivered",
          "Interested, but need more clarity on outcomes",
          "Slightly expensive, but worth it for long-term growth",
          "Would consider after seeing success stories",
        ],
        insight: {
          heading: "Market Benchmark",
          body: "Many short AI courses are high priced with low support, while deeper programs are valued for implementation outcomes.",
          source: "Indian edtech benchmark analysis 2026",
        },
      },
      {
        id: "q7_pricing_ai_pm",
        title: "AI Product Manager Program (24 weeks with product build and monetization), market pricing is often Rs1.5L to Rs3L. Your view?",
        type: "single",
        options: [
          "Fair if portfolio and placement outcomes are proven",
          "Interested but need better roadmap clarity",
          "Feels expensive right now",
          "Would evaluate based on mentor quality and results",
        ],
        insight: {
          heading: "Role Trend",
          body: "AI PM roles are growing fast where companies need people who can convert AI capability into product outcomes.",
          source: "Industry hiring trend summaries 2025-2026",
        },
      },
      {
        id: "q8_pricing_ai_automation",
        title: "AI Automation Engineer Program (20 weeks), market pricing is often Rs1.5L to Rs3L. Your view?",
        type: "single",
        options: [
          "Worth it if real automation outcomes are guaranteed",
          "Looks strong, but I need proof of execution support",
          "Too expensive for my current stage",
          "Could invest if ROI is clear within months",
        ],
        insight: {
          heading: "Demand Shift",
          body: "Automation talent that can build workflows and agents is becoming a high-leverage profile across teams.",
          source: "Enterprise automation demand reports",
        },
      },
      {
        id: "q9_ai_confidence",
        title: "How confident are you in using AI tools to solve real business problems right now?",
        subtitle: "Rate from 1 to 10.",
        type: "slider",
        min: 1,
        max: 10,
        minLabel: "1 = not confident",
        maxLabel: "10 = highly confident",
        insight: {
          heading: "Execution Gap",
          body: "Most professionals consume AI content but cannot demonstrate applied output in business contexts.",
          source: "Hiring manager interviews and talent audits",
        },
      },
      {
        id: "q10_voice",
        title: "What do you want from an institute in the AI era to make you more irreplaceable?",
        type: "text",
        optional: true,
        placeholder: "Share your honest view. This helps shape the ecosystem we build.",
        insight: {
          heading: "Design Input",
          body: "High-performing career programs are now built with learner feedback loops, not static curriculum assumptions.",
          source: "Program design best practices",
        },
      },
    ],
  },
  student: {
    type: "student",
    title: "Student UG Reality Check",
    intro:
      "A practical 10-step diagnostic to evaluate placement readiness, AI capability, and salary trajectory as a fresher.",
    tableName: "survey_student_responses",
    webhookUrl: "https://script.google.com/macros/s/AKfycbz6GwTT9PMvnDu5HRPgQlQUEDAlZY8aRDr8lLDTdTBjb2EhH7OqDWJ7_I3nTQ4nO9rm/exec",
    questions: [
      {
        id: "q1_placement_confidence",
        title: "How confident are you that you will land a job in your field within 3 months of graduation?",
        subtitle: "Rate from 1 to 10.",
        type: "slider",
        min: 1,
        max: 10,
        minLabel: "1 = not confident at all",
        maxLabel: "10 = completely confident",
        insight: {
          heading: "Placement Reality",
          body: "A large share of graduates do not start in the domain they studied and move to unrelated entry roles.",
          source: "Graduate hiring trend reports",
        },
      },
      {
        id: "q2_degree_vs_job",
        title: "Do you believe your current degree guarantees a relevant job after graduation?",
        type: "single",
        options: [
          "Yes, my degree directly gets me a job",
          "Maybe, I am not fully sure",
          "No, I am already worried about it",
          "I will figure it out after graduation",
        ],
        insight: {
          heading: "The Hard Truth",
          body: "Hiring teams increasingly evaluate proof of work and project ability, not just degree labels.",
          source: "Employability and hiring manager studies",
        },
      },
      {
        id: "q3_salary_target",
        title: "Are you targeting a double-digit salary (Rs10 LPA or above) as your first job offer?",
        type: "single",
        options: [
          "Yes, that is exactly my target",
          "I want it, but I am not sure I can get it",
          "I will take whatever I get first",
          "I have not thought about it yet",
        ],
        insight: {
          heading: "GCC Opportunity",
          body: "High-paying fresher roles are expanding, but selection now favors candidates who can demonstrate capability.",
          source: "NASSCOM GCC India, EY Future of Work",
        },
      },
      {
        id: "q4_ai_awareness",
        title: "Are you aware that companies now filter candidates based on ability to use AI tools in real work?",
        type: "single",
        options: [
          "Yes, I am already learning AI tools",
          "I have heard, but I have not started",
          "Not really aware",
          "I thought AI matters only for ML/Data Science",
        ],
        insight: {
          heading: "Hiring Filter",
          body: "AI tool usage is moving from bonus skill to baseline expectation across many job functions.",
          source: "India hiring manager surveys 2025-2026",
        },
      },
      {
        id: "q5_second_income",
        title: "Have you thought about building a second income stream alongside your career?",
        type: "single",
        options: [
          "Yes, I actively want this",
          "I have thought about it but do not know how",
          "No, I will focus on a job first",
          "Never thought about it",
        ],
        insight: {
          heading: "Early Income Advantage",
          body: "Students who begin earning early through applied skills often create stronger compounding career outcomes.",
          source: "Early-career earning trend studies",
        },
      },
      {
        id: "q6_ai_confidence",
        title: "How confident are you in using AI tools for real tasks, projects, or problem solving?",
        subtitle: "Rate from 1 to 10.",
        type: "slider",
        min: 1,
        max: 10,
        minLabel: "1 = never used",
        maxLabel: "10 = daily user with results",
        insight: {
          heading: "Capability Check",
          body: "Confidence rises when learners move from passive tutorials to project-based output and feedback loops.",
          source: "Project-based learning outcomes",
        },
      },
      {
        id: "q7_pricing_ai_generalist",
        title: "AI Generalist Program (8 weeks + 1-year support), market pricing is often Rs1.5L to Rs3L. What is your view?",
        type: "single",
        options: [
          "Fair if outcomes and execution support are clear",
          "Interested, but want stronger proof first",
          "Feels expensive for my current stage",
          "Would consider with clear roadmap and mentorship",
        ],
        insight: {
          heading: "Program Benchmark",
          body: "Students are willing to invest more when programs show practical output, portfolio value, and guided execution.",
          source: "Edtech conversion trend studies",
        },
      },
      {
        id: "q8_pricing_ai_pm",
        title: "AI Product Manager Program (24 weeks), market pricing is often Rs1.5L to Rs3L. Your view?",
        type: "single",
        options: [
          "Worth it if product outcomes are demonstrated",
          "Interested but need a clearer path",
          "Too expensive right now",
          "Would evaluate based on mentors and placements",
        ],
        insight: {
          heading: "Product Role Growth",
          body: "Companies now need AI-aware product talent who can bridge business need and execution with real artifacts.",
          source: "AI product hiring trend analysis",
        },
      },
      {
        id: "q9_pricing_ai_automation",
        title: "AI Automation Engineer Program (20 weeks), market pricing is often Rs1.45L to Rs3L. Your view?",
        type: "single",
        options: [
          "Fair if I can build real automation projects",
          "Interested with clear internship/project pipeline",
          "Cost feels high for now",
          "I would invest if ROI is clearly visible",
        ],
        insight: {
          heading: "Automation Demand",
          body: "Workflow automation and AI agent implementation are becoming core capabilities in GCC and startup hiring.",
          source: "Automation workforce trend reports",
        },
      },
      {
        id: "q10_voice",
        title: "What is the one thing you wish your college prepared you for, but did not?",
        type: "text",
        optional: true,
        placeholder: "Your answer helps shape what Onrol builds next.",
        insight: {
          heading: "Student Signal",
          body: "Direct student feedback is one of the strongest inputs for designing outcome-focused career systems.",
          source: "Learner success program research",
        },
      },
    ],
  },
};

export const surveyRouteMeta: Array<{
  type: SurveyType;
  title: string;
  description: string;
  path: string;
}> = [
  {
    type: "student",
    title: "College Student",
    description: "Measure your placement readiness and build an AI-first growth path.",
    path: "/survey/student",
  },
  {
    type: "professional",
    title: "Working Professional",
    description: "Assess your growth ceiling and unlock a practical AI-enabled roadmap.",
    path: "/survey/professional",
  },
];
