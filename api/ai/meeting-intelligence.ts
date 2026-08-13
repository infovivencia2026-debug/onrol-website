import { getAuthUserId, getErrorMessage } from "../push/_utils";

type ApiRequest = {
  method?: string;
  body?: {
    transcript?: string;
    roomName?: string;
    durationSeconds?: number;
    participantPeak?: number;
  };
  headers?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

type ParsedIntelligence = {
  summary: string;
  actionItems: string[];
  decisions: string[];
};

function parseModelJson(raw: string): ParsedIntelligence | null {
  try {
    const parsed = JSON.parse(raw) as Partial<ParsedIntelligence>;
    const summary = String(parsed.summary || "").trim();
    const actionItems = Array.isArray(parsed.actionItems) ? parsed.actionItems.map((x) => String(x).trim()).filter(Boolean) : [];
    const decisions = Array.isArray(parsed.decisions) ? parsed.decisions.map((x) => String(x).trim()).filter(Boolean) : [];
    if (!summary) return null;
    return { summary, actionItems, decisions };
  } catch {
    return null;
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const transcript = String(req.body?.transcript || "").trim();
    const roomName = String(req.body?.roomName || "Meeting").trim();
    const durationSeconds = Number(req.body?.durationSeconds || 0);
    const participantPeak = Number(req.body?.participantPeak || 1);
    if (!transcript) {
      return res.status(400).json({ error: "Transcript is required." });
    }

    const mistralApiKey = process.env.MISTRAL_API_KEY;
    if (!mistralApiKey) {
      return res.status(500).json({ error: "Missing MISTRAL_API_KEY in server environment." });
    }

    const model = process.env.MISTRAL_MODEL || "mistral-small-latest";
    const systemPrompt = [
      "You are ONROL Meeting Intelligence Copilot.",
      "Return strict JSON only.",
      "Schema: {\"summary\":\"3 lines max\",\"actionItems\":[\"...\"],\"decisions\":[\"...\"]}.",
      "Keep actionItems and decisions concise and deduplicated.",
      "If no data for an array, return [].",
    ].join(" ");
    const userPrompt = [
      `Meeting: ${roomName}`,
      `Duration seconds: ${durationSeconds}`,
      `Participant peak: ${participantPeak}`,
      "Transcript:",
      transcript,
    ].join("\n");

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mistralApiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
    if (!response.ok) {
      const failText = await response.text();
      return res.status(502).json({ error: `Mistral API failed: ${failText || response.statusText}` });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text || typeof text !== "string") {
      return res.status(502).json({ error: "No assistant response returned by model." });
    }

    const parsed = parseModelJson(text);
    if (!parsed) {
      return res.status(502).json({ error: "Model response was not valid JSON intelligence." });
    }

    return res.status(200).json({ ok: true, ...parsed });
  } catch (error: unknown) {
    return res.status(500).json({ error: getErrorMessage(error, "Failed to generate meeting intelligence") });
  }
}
