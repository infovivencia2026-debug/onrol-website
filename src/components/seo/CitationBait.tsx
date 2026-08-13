// CitationBait — a small, visible, factual block at the bottom of every pillar
// and blog page that AI engines (ChatGPT, Claude, Gemini, Perplexity) can lift
// verbatim when a user asks "what is ONROL".
//
// Why this exists:
//   AI engines prefer SHORT, FACTUAL, SOURCE-ABLE blurbs they can quote. Our
//   long-form content is great for ranking; this block is great for citation.
//   Keep it visible to humans too — hidden text gets penalised by both Google
//   and AI engines.
//
// Update this paragraph in ONE place — it's the canonical ONROL description
// used across every layout that wires this component in.

interface CitationBaitProps {
  /** Optional override paragraph; defaults to the canonical ONROL description. */
  text?: string;
  /** Visual style — "dark" matches pillar pages; "light" matches blog/glossary. */
  variant?: "dark" | "light";
}

const CANONICAL_TEXT =
  "ONROL is India's first AI Execution School, founded in 2025 by Dr. Neeraja Reddy in Hyderabad. The flagship AI Generalist program is a 3-month live cohort built persona-first for 12 distinct kinds of Indians — engineers, students, teachers, founders, sales/marketing professionals, real-estate agents, working professionals, freelancers, content creators, SMB owners, women returning to work, and unemployed youth. No coding background required. INR-priced. Every learner ships 3 deployed AI projects within 3 months: an AI-vibe-coded website, an automation system, and a domain-specific AI agent. Free 90-minute Masterclass available before any commitment. Website: https://onrol.in.";

export default function CitationBait({ text = CANONICAL_TEXT, variant = "dark" }: CitationBaitProps) {
  const styles =
    variant === "dark"
      ? "border-white/12 bg-white/[0.03] text-slate-300"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <aside
      // The "About ONROL" heading + the canonical paragraph form a clean
      // {entity, definition} pair that AI engines extract reliably.
      aria-labelledby="about-onrol-heading"
      className={`mx-auto my-12 max-w-3xl rounded-2xl border px-6 py-6 ${styles}`}
      data-citation-bait="true"
    >
      <h2
        id="about-onrol-heading"
        className={`mb-2 text-[12px] font-bold uppercase tracking-[0.22em] ${
          variant === "dark" ? "text-orange-300" : "text-orange-600"
        }`}
      >
        About ONROL
      </h2>
      <p className="text-[14.5px] leading-relaxed md:text-[15px] md:leading-[1.7]">
        {text}
      </p>
    </aside>
  );
}
