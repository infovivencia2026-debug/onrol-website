import { getAuthUserId, getErrorMessage } from "../push/_utils";

type ApiRequest = {
  method?: string;
  body?: { prompt?: string; context?: string };
  headers?: Record<string, string | string[] | undefined>;
};

type ApiResponse = {
  status: (code: number) => { json: (payload: unknown) => unknown };
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const userId = await getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const prompt = String(req.body?.prompt || "").trim();
    const context = String(req.body?.context || "").trim();
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required." });
    }

    const mistralApiKey = process.env.MISTRAL_API_KEY;
    if (!mistralApiKey) {
      return res.status(500).json({ error: "Missing MISTRAL_API_KEY in server environment." });
    }

    const model = process.env.MISTRAL_MODEL || "mistral-small-latest";
    const systemPrompt = [
      "You are ONROL Automation Copilot for an internal task-manager CRM.",
      "Return concise, practical actions admins can apply immediately.",
      "Focus only on workflow automation, task operations, meetings, and follow-up hygiene.",
      "Output plain text with short bullet points.",
    ].join(" ");
    const finalPrompt = context
      ? `Context:\n${context}\n\nUser request:\n${prompt}`
      : prompt;

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${mistralApiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: finalPrompt },
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

    return res.status(200).json({ ok: true, text });
  } catch (error: unknown) {
    return res.status(500).json({ error: getErrorMessage(error, "Failed to generate AI suggestion") });
  }
}

