// Auto-cross-linker: scans paragraph text for known glossary terms and
// replaces the FIRST occurrence in each paragraph with a <Link> to the
// matching /glossary/<slug>/ entry.
//
// Why first-occurrence-only:
//   - Keeps reading rhythm clean (5 "RAG" mentions in one paragraph all
//     hyperlinked is visual noise + dilutes link value).
//   - Enough internal-link signal for Google + AI search to register the
//     content cluster.
//
// Why we use a manual map and not the full glossary terms[]:
//   - The glossary `term` field includes parentheticals like "RAG (Retrieval-
//     Augmented Generation)" — bad for substring matching.
//   - A curated map gives us control over what auto-links and what doesn't.

import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { glossary } from "@/lib/glossaryData";

// Curated patterns: each term + its glossary slug. Order matters — longest
// patterns first so "AI agents" matches before "AI".
const TERM_PATTERNS: { regex: RegExp; slug: string }[] = [
  { regex: /\bAI orchestration\b/i, slug: "ai-orchestration" },
  { regex: /\bvector database(s)?\b/i, slug: "vector-database" },
  { regex: /\bsemantic search\b/i, slug: "semantic-search" },
  { regex: /\bvibe[\s-]?coding\b/i, slug: "vibe-coding" },
  { regex: /\bGitHub Copilot\b/i, slug: "github-copilot" },
  { regex: /\bGoogle DeepMind\b/i, slug: "google-deepmind" },
  { regex: /\bGoogle AI Studio\b/i, slug: "google-ai-studio" },
  { regex: /\bAI Overviews\b/i, slug: "ai-overviews" },
  { regex: /\bAI search\b/i, slug: "ai-search" },
  { regex: /\bAI agent(s)?\b/i, slug: "ai-agent" },
  { regex: /\bchain[\s-]of[\s-]thought\b/i, slug: "chain-of-thought" },
  { regex: /\btree[\s-]of[\s-]thought\b/i, slug: "tree-of-thought" },
  { regex: /\bsystem prompt(s)?\b/i, slug: "system-prompt" },
  { regex: /\bzero[\s-]shot\b/i, slug: "zero-shot" },
  { regex: /\bfew[\s-]shot\b/i, slug: "few-shot" },
  { regex: /\bprompt engineering\b/i, slug: "prompt-engineering" },
  { regex: /\bfine[\s-]tun(ing|e)\b/i, slug: "fine-tuning" },
  { regex: /\btraining data\b/i, slug: "training-data" },
  { regex: /\bcontext window\b/i, slug: "context-window" },
  { regex: /\btool use\b/i, slug: "tool-use" },
  { regex: /\bapplied AI\b/i, slug: "applied-ai" },
  { regex: /\bacademic AI\b/i, slug: "academic-ai" },
  { regex: /\bMake\.com\b/i, slug: "make-com" },
  { regex: /\bBolt\.new\b/i, slug: "bolt-new" },
  // Single-word matches (run last so multi-word patterns claim first).
  { regex: /\bClaude\b/i, slug: "claude" },
  { regex: /\bChatGPT\b/i, slug: "chatgpt" },
  { regex: /\bGemini\b/i, slug: "gemini" },
  { regex: /\bPerplexity\b/i, slug: "perplexity" },
  { regex: /\bAnthropic\b/i, slug: "anthropic" },
  { regex: /\bOpenAI\b/i, slug: "openai" },
  { regex: /\bGroq\b/i, slug: "groq" },
  { regex: /\bRAG\b/, slug: "rag" }, // case-sensitive — RAG only, not "rag" the textile
  { regex: /\bLoRA\b/, slug: "lora" },
  { regex: /\bMCP\b/, slug: "mcp" },
  { regex: /\bn8n\b/i, slug: "n8n" },
  { regex: /\bZapier\b/i, slug: "zapier" },
  { regex: /\bCursor\b/i, slug: "cursor" },
  { regex: /\bReplit\b/i, slug: "replit" },
  { regex: /\bSupabase\b/i, slug: "supabase" },
  { regex: /\bVercel\b/i, slug: "vercel" },
  { regex: /\bCloudflare\b/i, slug: "cloudflare" },
  { regex: /\bElevenLabs\b/i, slug: "elevenlabs" },
  { regex: /\bLLM(s)?\b/, slug: "llm" },
  { regex: /\bembedding(s)?\b/i, slug: "embedding" },
  { regex: /\bhallucination(s)?\b/i, slug: "hallucination" },
  { regex: /\binference\b/i, slug: "inference" },
  { regex: /\btoken(s)?\b/i, slug: "tokens" },
  { regex: /\btemperature\b/i, slug: "temperature" },
  { regex: /\bautomation\b/i, slug: "automation" },
  { regex: /\bAPI(s)?\b/, slug: "api" },
  { regex: /\bwebhook(s)?\b/i, slug: "webhook" },
  { regex: /\bSEO\b/, slug: "seo" },
];

const validSlugs = new Set(glossary.map((g) => g.slug));

interface LinkifyOptions {
  /** Override the default first-only mode. Rare. */
  unlimited?: boolean;
  /** CSS class for the rendered <Link>. */
  linkClassName?: string;
  /** Skip linking altogether (used in callouts/quotes to keep them clean). */
  disabled?: boolean;
}

const DEFAULT_LINK_CLASS =
  "text-orange-300 underline decoration-orange-400/40 underline-offset-2 transition hover:text-orange-200 hover:decoration-orange-300";

/**
 * Convert a plain text string into a ReactNode array with the first occurrence
 * of each glossary term wrapped in a <Link>. Subsequent occurrences are left
 * as plain text.
 */
export function linkifyGlossaryTerms(
  text: string,
  options: LinkifyOptions = {},
): ReactNode {
  if (options.disabled || !text) return text;

  const linkClass = options.linkClassName ?? DEFAULT_LINK_CLASS;
  const claimedSlugs = new Set<string>();

  // Walk the text, finding the earliest match across all unclaimed patterns
  // each iteration, splitting and recursing on the right side.
  const out: ReactNode[] = [];
  let cursor = 0;
  let safety = 0;
  while (cursor < text.length && safety++ < 120) {
    const remainder = text.slice(cursor);
    let bestMatch:
      | { index: number; length: number; slug: string; matched: string }
      | null = null;

    for (const pattern of TERM_PATTERNS) {
      if (claimedSlugs.has(pattern.slug) && !options.unlimited) continue;
      if (!validSlugs.has(pattern.slug)) continue;
      pattern.regex.lastIndex = 0; // reset stateful regex
      const m = pattern.regex.exec(remainder);
      if (!m) continue;
      if (!bestMatch || m.index < bestMatch.index) {
        bestMatch = { index: m.index, length: m[0].length, slug: pattern.slug, matched: m[0] };
      }
    }

    if (!bestMatch) {
      out.push(remainder);
      break;
    }

    if (bestMatch.index > 0) {
      out.push(remainder.slice(0, bestMatch.index));
    }
    out.push(
      <Link
        key={`${bestMatch.slug}-${cursor + bestMatch.index}`}
        to={`/glossary/${bestMatch.slug}/`}
        className={linkClass}
      >
        {bestMatch.matched}
      </Link>,
    );
    if (!options.unlimited) claimedSlugs.add(bestMatch.slug);
    cursor += bestMatch.index + bestMatch.length;
  }

  return out.length === 1 && typeof out[0] === "string" ? text : out;
}
