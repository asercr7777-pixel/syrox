import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are Shadow, the built-in AI assistant for the Forged app. You are a helpful, calm, capable general-purpose assistant. You can help with studying, coding, planning, productivity, the Forged app, workouts at a safe general level, games, writing, explanations, and everyday questions. You are not limited to fitness. Do not pretend to be a doctor or professional. For health or exercise questions, keep advice age-appropriate, avoid extreme dieting or unsafe training, and recommend a trusted adult or qualified professional when appropriate. Never give instructions that help a minor access dangerous or age-restricted things. Answer in the user's language. Keep answers useful and direct, but explain things properly when the user asks to learn. Use headings, bullets, examples, or code when they improve the answer. You are Shadow, not ChatGPT, but the conversation should feel natural and intelligent.`;

type GeminiMessage = { role: "user" | "model"; parts: { text: string }[] };

function cleanMessages(messages: unknown[]): GeminiMessage[] {
  const mapped = messages
    .filter((m): m is { role?: unknown; content?: unknown } => typeof m === "object" && m !== null)
    .map((m) => ({
      role: m.role === "assistant" ? "model" as const : "user" as const,
      text: String(m.content ?? "").slice(0, 8000).trim(),
    }))
    .filter((m) => m.text.length > 0);

  // Gemini history must begin with a user turn. The UI contains a local welcome
  // assistant message, so remove any leading model turns before sending history.
  while (mapped.length && mapped[0].role === "model") mapped.shift();

  // Keep the history valid even if the client ever produces two turns with the
  // same role in a row: combine them into one Gemini content turn.
  const result: GeminiMessage[] = [];
  for (const item of mapped) {
    const previous = result[result.length - 1];
    if (previous?.role === item.role) {
      previous.parts[0].text += `\n\n${item.text}`;
    } else {
      result.push({ role: item.role, parts: [{ text: item.text }] });
    }
  }
  return result;
}

function extractText(payload: any): string {
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part: any) => typeof part?.text === "string" ? part.text : "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return jsonResponse({ error: "Shadow AI is not configured yet. Add GEMINI_API_KEY to the Supabase Edge Function secrets." }, 503);
    }

    const body = await req.json();
    const rawMessages = Array.isArray(body?.messages) ? body.messages.slice(-20) : [];
    const contents = cleanMessages(rawMessages);

    if (!contents.length) return jsonResponse({ error: "No user message supplied" }, 400);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1400 },
        }),
      },
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message ?? `Gemini request failed (${response.status})`;
      const status = response.status === 429 ? 429 : response.status >= 400 && response.status < 500 ? 400 : 502;
      return jsonResponse({ error: message }, status);
    }

    const text = extractText(payload);
    if (!text) return jsonResponse({ error: "Shadow returned an empty response" }, 502);

    return jsonResponse({ message: text });
  } catch (error) {
    return jsonResponse({ error: error instanceof Error ? error.message : "Unexpected Shadow AI error" }, 500);
  }
});
