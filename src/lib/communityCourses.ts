export type CommunityCourseQuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type CommunityCourseLesson = {
  id: string;
  title: string;
  format: "video" | "lab" | "template" | "assignment";
  duration: string;
  objective: string;
};

export type CommunityCourseModule = {
  id: string;
  title: string;
  summary: string;
  lessons: CommunityCourseLesson[];
  quizQuestions: CommunityCourseQuizQuestion[];
};

export type CommunityCourse = {
  id: string;
  title: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  duration: string;
  projects: number;
  description: string;
  outcomes: string[];
  modules: CommunityCourseModule[];
};

const topicSeeds = [
  "Machine Learning Essentials",
  "Prompt Engineering for Work",
  "AI Automation with n8n",
  "RAG Systems Fundamentals",
  "AI Agents in Practice",
  "GenAI for Product Teams",
  "No-Code AI Workflows",
  "AI for Marketing Ops",
  "AI for Sales Ops",
  "AI Content Studio",
  "Data Analysis with AI",
  "AI for Founders",
  "AI UX and Interaction",
  "AI Video Production",
  "AI for Research Teams",
  "AI Coding Accelerators",
  "MLOps and Deployment",
  "AI Security Basics",
  "Local AI and Inference",
  "AI Career Transition",
];

const variants = ["Foundations", "Builder Sprint", "Project Lab", "Execution Track", "Career Accelerator"];
const levels: CommunityCourse["level"][] = ["Beginner", "Intermediate", "Advanced"];
const formats: CommunityCourseLesson["format"][] = ["video", "lab", "template", "assignment"];

const makeLessons = (courseId: string, moduleId: string, topic: string): CommunityCourseLesson[] =>
  Array.from({ length: 3 }, (_, lessonIndex) => ({
    id: `${courseId}-${moduleId}-l${lessonIndex + 1}`,
    title: `${topic} Lesson ${lessonIndex + 1}`,
    format: formats[lessonIndex % formats.length],
    duration: `${20 + lessonIndex * 12} min`,
    objective:
      lessonIndex === 0
        ? `Understand core concepts of ${topic.toLowerCase()}.`
        : lessonIndex === 1
          ? `Apply ${topic.toLowerCase()} in a guided hands-on workflow.`
          : `Ship a small output and document execution proof for ${topic.toLowerCase()}.`,
  }));

const makeQuiz = (courseId: string, moduleId: string, topic: string): CommunityCourseQuizQuestion[] => [
  {
    id: `${courseId}-${moduleId}-q1`,
    question: `What is the strongest first step before applying ${topic.toLowerCase()}?`,
    options: ["Random tool selection", "Clear problem definition", "Buying premium tools", "Skipping validation"],
    answerIndex: 1,
    explanation: "A clear problem definition ensures the workflow solves an actual business need.",
  },
  {
    id: `${courseId}-${moduleId}-q2`,
    question: `Which output best proves capability in ${topic.toLowerCase()}?`,
    options: ["Watching tutorials", "Collecting certificates", "A deployable mini-project", "Posting screenshots only"],
    answerIndex: 2,
    explanation: "Deployable output is the strongest proof of execution readiness.",
  },
  {
    id: `${courseId}-${moduleId}-q3`,
    question: `How should quality be validated in ${topic.toLowerCase()} tasks?`,
    options: ["No review needed", "Use a simple QA checklist", "Trust first output only", "Avoid testing edge cases"],
    answerIndex: 1,
    explanation: "A QA checklist reduces errors and improves consistency before launch.",
  },
];

const makeModules = (courseId: string, topic: string): CommunityCourseModule[] => [
  {
    id: "m1",
    title: `${topic} Core Concepts`,
    summary: `Build a practical baseline in ${topic.toLowerCase()} with templates and workflow patterns.`,
    lessons: makeLessons(courseId, "m1", topic),
    quizQuestions: makeQuiz(courseId, "m1", topic),
  },
  {
    id: "m2",
    title: `${topic} Execution Sprint`,
    summary: `Convert concepts into a mini capstone and portfolio-ready artifact.`,
    lessons: makeLessons(courseId, "m2", `${topic} Execution`),
    quizQuestions: makeQuiz(courseId, "m2", `${topic} execution`),
  },
];

const generatedCourses: CommunityCourse[] = topicSeeds.flatMap((seed, seedIndex) =>
  variants.map((variant, variantIndex) => {
    const n = seedIndex * variants.length + variantIndex + 1;
    const id = `ai-course-${String(n).padStart(3, "0")}`;
    const level = levels[(seedIndex + variantIndex) % levels.length];
    return {
      id,
      title: `${seed} · ${variant}`,
      level,
      duration: `${1 + (variantIndex % 3)} Week${variantIndex % 3 === 0 ? "" : "s"}`,
      projects: 1 + (variantIndex % 2),
      description: `Small, execution-first course focused on real outcomes in ${seed.toLowerCase()}.`,
      outcomes: [
        `Understand the core stack for ${seed.toLowerCase()}.`,
        "Build one practical mini project.",
        "Complete a quiz-based competency check.",
      ],
      modules: makeModules(id, seed),
    };
  }),
);

export const communityCourses: CommunityCourse[] = generatedCourses;

export const inferCourseIdFromText = (value: string): string => {
  const text = value.toLowerCase();
  const ranked = communityCourses
    .map((course) => {
      const title = course.title.toLowerCase();
      let score = 0;
      const words = title.split(/\s+/).filter((w) => w.length > 3);
      for (const word of words) {
        if (text.includes(word)) score += 1;
      }
      return { id: course.id, score };
    })
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score > 0 ? ranked[0].id : communityCourses[0]?.id ?? "ai-course-001";
};
