import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const MAX_QUESTION_CHARS = 500;
const MAX_CONTEXT_CHARS = 1800;
const TOP_K = 3;
const MIN_SIMILARITY = 0.55;
const MAX_OUTPUT_TOKENS = 220;

type KnowledgeMatch = {
  id: number;
  source: string;
  content: string;
  similarity: number;
};

const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      })
    : null;

async function createQueryEmbedding(query: string): Promise<number[]> {
  const embeddingResponse = await fetch("https://api.mistral.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-embed",
      input: [query],
    }),
  });

  if (!embeddingResponse.ok) {
    const errorText = await embeddingResponse.text();
    throw new Error(`Mistral embeddings error (${embeddingResponse.status}): ${errorText}`);
  }

  const embeddingJson = await embeddingResponse.json();
  const vector = embeddingJson?.data?.[0]?.embedding;

  if (!Array.isArray(vector) || vector.length === 0) {
    throw new Error("Embedding response did not include a valid vector");
  }

  return vector;
}

function buildContext(matches: KnowledgeMatch[]): string {
  if (matches.length === 0) {
    return "";
  }

  const merged = matches
    .map(
      (item, index) =>
        `[Doc ${index + 1}] Source: ${item.source}\nSimilarity: ${item.similarity.toFixed(3)}\n${item.content}`
    )
    .join("\n\n");

  return merged.slice(0, MAX_CONTEXT_CHARS);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      throw new Error("Message is required and must be a string");
    }

    if (!MISTRAL_API_KEY) {
      throw new Error("Server is missing MISTRAL_API_KEY secret");
    }

    if (!supabase) {
      throw new Error("Server is missing SUPABASE_URL or SUPABASE_ANON_KEY");
    }

    const prompt = message.trim().slice(0, MAX_QUESTION_CHARS);
    if (!prompt) {
      throw new Error("Message cannot be empty");
    }

    const queryEmbedding = await createQueryEmbedding(prompt);
    const { data: matchRows, error: matchError } = await supabase.rpc("match_onrol_knowledge", {
      query_embedding: queryEmbedding,
      match_count: TOP_K,
      min_similarity: MIN_SIMILARITY,
    });

    if (matchError) {
      throw new Error(`Knowledge retrieval error: ${matchError.message}`);
    }

    const matches = (matchRows ?? []) as KnowledgeMatch[];
    const contextBlock = buildContext(matches);
    const sourceList = matches.map((item) => item.source);

    // Budget mode:
    // - Top-K retrieval capped at 3
    // - Context length capped
    // - Output tokens capped
    const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        temperature: 0.2,
        max_tokens: MAX_OUTPUT_TOKENS,
        messages: [
          {
            role: "system",
            content:
              "You are XULO, ONROL's AI assistant. Answer briefly and clearly about ONROL programs, learning paths, outcomes, and next steps. If context is provided, prioritize it. If context is not enough, say that clearly and suggest contacting ONROL team.",
          },
          {
            role: "system",
            content: contextBlock
              ? `Knowledge context:\n${contextBlock}`
              : "No knowledge context was retrieved for this question.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      throw new Error(`Mistral API error (${mistralResponse.status}): ${errorText}`);
    }

    const mistralJson = await mistralResponse.json();
    const response =
      mistralJson?.choices?.[0]?.message?.content?.trim() ||
      "I could not generate a response right now. Please try again.";

    return new Response(
      JSON.stringify({
        response,
        sources: sourceList,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in rag-chat function:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
