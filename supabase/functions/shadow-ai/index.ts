import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are Shadow, the built-in AI assistant for the Forged app. You are a helpful, calm, capable general-purpose assistant. You can help with studying, coding, planning, productivity, the Forged app, workouts at a safe general level, games, writing, explanations, and everyday questions. You are not limited to fitness. Do not pretend to be a doctor or professional. For health or exercise questions, keep advice age-appropriate, avoid extreme dieting or unsafe training, and recommend a trusted adult or qualified professional when appropriate. Never give instructions that help a minor access dangerous or age-restricted things. Answer in the user's language. Keep answers useful and direct, but explain things properly when the user asks to learn. Use headings, bullets, examples, or code when they improve the answer. You are Shadow, not ChatGPT, but the conversation should feel natural and intelligent.`;

function cleanMessages(messages: unknown[]): { role: "user" | "model"; parts: { text: string }[] }[] {
  return messages
    .filter((m): m is { role?: unknown; content?: unknown } => typeof m === "object" && m !== null)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content ?? "").slice(0, 8000) }],
    }))
    .filter((m) => m.parts[0].text.trim().length > 0);
}

function extractText(payload: any): string {
  const parts = payload?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part: any) => typeof part?.text === "string" ? part.text : "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Shadow AI is not configured yet. Add GEMINI_API_KEY to the Supabase Edge Function secrets." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const rawMessages = Array.isArray(body?.messages) ? body.messages.slice(-20) : [];
    const contents = cleanMessages(rawMessages);

    if (!contents.length) {
      return new Response(JSON.stringify({ error: "No messages supplied" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1400,
          },
        }),
      },
    );

    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.message ?? "Shadow AI request failed";
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = extractText(payload);
    if (!text) {
      return new Response(JSON.stringify({ error: "Shadow returned an empty response" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ message: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Unexpected Shadow AI error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
