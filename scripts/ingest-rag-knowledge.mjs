import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

const FILES = [
  "README.md",
  "SURVEY_SETUP.md",
  "PORTAL_IMPLEMENTATION_SUMMARY.md",
  "COMMUNITY_SETUP.md",
  "COMMUNITY_SECURITY.md",
];

const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 120;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !MISTRAL_API_KEY) {
  console.error("Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MISTRAL_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function chunkText(text) {
  const chunks = [];
  let cursor = 0;

  while (cursor < text.length) {
    const end = Math.min(cursor + CHUNK_SIZE, text.length);
    chunks.push(text.slice(cursor, end));

    if (end === text.length) {
      break;
    }

    cursor = end - CHUNK_OVERLAP;
  }

  return chunks;
}

async function embedBatch(inputs) {
  const response = await fetch("https://api.mistral.ai/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistral-embed",
      input: inputs,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Embedding request failed (${response.status}): ${body}`);
  }

  const payload = await response.json();
  return payload.data.map((entry) => entry.embedding);
}

async function ingestFile(filePath) {
  const absolute = path.resolve(process.cwd(), filePath);
  const content = await fs.readFile(absolute, "utf8");
  const chunks = chunkText(content);

  console.log(`Ingesting ${filePath}: ${chunks.length} chunks`);

  await supabase.from("onrol_knowledge").delete().eq("source", filePath);

  const batchSize = 20;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const chunkBatch = chunks.slice(i, i + batchSize);
    const vectors = await embedBatch(chunkBatch);

    const rows = chunkBatch.map((chunk, index) => ({
      source: filePath,
      chunk_index: i + index,
      content: chunk,
      embedding: vectors[index],
    }));

    const { error } = await supabase.from("onrol_knowledge").insert(rows);
    if (error) {
      throw new Error(`Insert failed for ${filePath}: ${error.message}`);
    }
  }
}

async function main() {
  for (const filePath of FILES) {
    await ingestFile(filePath);
  }

  console.log("Knowledge ingestion complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});