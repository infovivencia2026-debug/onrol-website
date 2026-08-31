// Shared helpers for ONROL SEO/AI-visibility agents.
//
// Every agent imports from this file. Centralises: env loading, Supabase client,
// LLM call wrappers, basic logging, dry-run guard.
//
// Required env vars (see docs/AGENTS_SETUP.md for setup):
//   SUPABASE_URL                 — community Supabase URL (https://onrol.in/api)
//   SUPABASE_SERVICE_ROLE_KEY    — service-role key (DO NOT expose client-side)
//   ANTHROPIC_API_KEY            — for Claude (Quora drafter, citation tracker)
//   OPENAI_API_KEY               — for ChatGPT (citation tracker)
//   GOOGLE_AI_API_KEY            — for Gemini (citation tracker)
//   PERPLEXITY_API_KEY           — for Perplexity (citation tracker)
//   MEDIUM_INTEGRATION_TOKEN     — for syndication (https://medium.com/me/settings)
//   DEVTO_API_KEY                — for syndication (https://dev.to/settings/extensions)
//   HASHNODE_PAT                 — for syndication (https://hashnode.com/settings/developer)
//   SERP_API_KEY                 — for backlink scout (https://serpapi.com)

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ── Env loading ──────────────────────────────────────────────────────────────
// Loads .env from the project root. Picked up by both local dev + n8n executions.
function loadDotenv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (process.env[m[1]] !== undefined) continue; // don't overwrite existing
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[m[1]] = value;
  }
}
loadDotenv();

export const DRY_RUN = process.env.DRY_RUN === "true" || process.argv.includes("--dry-run");

export function env(key, { required = true } = {}) {
  const v = process.env[key];
  if (!v && required) {
    throw new Error(`Missing required env var: ${key}. See docs/AGENTS_SETUP.md.`);
  }
  return v;
}

// ── Supabase client (service-role) ───────────────────────────────────────────
export function db() {
  const url = env("SUPABASE_URL", { required: false }) || "https://onrol.in/api";
  const key = env("SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── LLM wrappers ─────────────────────────────────────────────────────────────
// Each LLM wrapper returns { text, raw }. Errors thrown are caller's responsibility.

export async function callClaude({ system, user, model = "claude-opus-4-7", maxTokens = 2000 }) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env("ANTHROPIC_API_KEY"),
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!r.ok) throw new Error(`Claude API ${r.status}: ${await r.text()}`);
  const json = await r.json();
  return { text: json.content?.[0]?.text || "", raw: json };
}

export async function callOpenAI({ system, user, model = "gpt-5", maxTokens = 2000, tools = undefined }) {
  // Uses Chat Completions for stability. Switch to Responses API if/when needed.
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env("OPENAI_API_KEY")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_completion_tokens: maxTokens,
      messages: [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: user },
      ],
      ...(tools ? { tools } : {}),
    }),
  });
  if (!r.ok) throw new Error(`OpenAI API ${r.status}: ${await r.text()}`);
  const json = await r.json();
  return { text: json.choices?.[0]?.message?.content || "", raw: json };
}

export async function callGemini({ system, user, model = "gemini-3-pro", maxTokens = 2000 }) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env("GOOGLE_AI_API_KEY")}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: user }] }],
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    },
  );
  if (!r.ok) throw new Error(`Gemini API ${r.status}: ${await r.text()}`);
  const json = await r.json();
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  return { text, raw: json };
}

export async function callPerplexity({ user, model = "sonar-pro" }) {
  // Perplexity's online models include citations (`citations` array).
  const r = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env("PERPLEXITY_API_KEY")}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!r.ok) throw new Error(`Perplexity API ${r.status}: ${await r.text()}`);
  const json = await r.json();
  return {
    text: json.choices?.[0]?.message?.content || "",
    citations: json.citations || [],
    raw: json,
  };
}

// ── Logging ──────────────────────────────────────────────────────────────────
export const log = (...args) => console.log(`[${new Date().toISOString()}]`, ...args);
export const warn = (...args) => console.warn(`[${new Date().toISOString()}] ⚠`, ...args);
export const err = (...args) => console.error(`[${new Date().toISOString()}] ✗`, ...args);
