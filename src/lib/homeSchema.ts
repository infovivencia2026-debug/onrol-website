/**
 * Structured data for the home page.
 *
 * The FAQ answers and the film are both on the page already; these two blocks
 * simply tell Google what they are, which is what earns the expandable FAQ
 * result and the video thumbnail in search. Keep the text here identical to
 * the markup — Google treats a mismatch as a violation, not a technicality.
 */

const SITE = "https://onrol.in";

/** The six questions answered in the home page's FAQ section. */
export function homeFaqJsonLd() {
  const qa: Array<[string, string]> = [
    ["Do I need to know how to code?",
     "No, and that isn't a marketing line. Every program starts from zero and 70–75% of the time is hands on, with a mentor in the room while you build. If you can use a laptop and follow instructions, you can do this."],
    ["Are the sessions live, or recordings?",
     "Live. Mentors are in the room with you, cohorts stay small enough that your questions get answered, and every session is recorded afterwards so you can go back over anything you missed."],
    ["How much time does it take each week?",
     "It depends on the program. The AI Career Accelerator is an hour a day for 21 days. The AI Generalist runs three months at 50+ live hours; SOC Analyst is three months at 60+. Most people do it alongside a job or college."],
    ["What do I actually walk away with?",
     "Deployed work under your own name — AI systems, automations, agents, chatbots or security builds, depending on the track — with live links you can send to an employer or a client. Proof, not a certificate."],
    ["Which program should I start with?",
     "If you have never built anything with AI, start with the 21-day AI Career Accelerator. If you want a career change, the AI Generalist or the SOC Analyst track. If you already build and want to lead systems, the AI Architect."],
    ["How do I join, and what does it cost?",
     "Apply on any program page and our team calls you back to talk through the fit, the next cohort date and the fee for that program. There is no payment at the application step."],
  ];
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(([question, answer]) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

/** The film in the About band. */
export function homeVideoJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "Learn by building real AI products — inside ONROL",
    description:
      "ONROL is a live school with real mentors, not pre-recorded videos. Every week you finish something you can use, and by the end you have a portfolio that shows you can build.",
    thumbnailUrl: [`${SITE}/home-glydi/about-poster.jpg`],
    contentUrl: `${SITE}/home-glydi/about_onrol.mp4`,
    uploadDate: "2026-01-15",
    duration: "PT2M45S",
    publisher: {
      "@type": "Organization",
      name: "ONROL",
      logo: { "@type": "ImageObject", url: `${SITE}/home-glydi/logo-mark.png` },
    },
  };
}
