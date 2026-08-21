import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are Shadow, the built-in AI assistant for the Forged app. You are a helpful, calm, concise general-purpose assistant. You can help with studying, coding, planning, productivity, the Forged app, workouts at a safe general level, games, writing, explanations, and everyday questions. Do not pretend to be a doctor or professional. For health or exercise questions, keep advice age-appropriate, avoid extreme dieting or unsafe training, and recommend a trusted adult or qualified professional when appropriate. Never give instructions that help a minor access dangerous or age-restricted things. Answer in the user's language. Use clear headings or bullets when useful. You are Shadow, not ChatGPT, but your chat experience should feel conversational and useful.`;

function extractText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text.trim();
  const parts: string[] = [];
  for (const item of payload?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (typeof content?.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "Shadow AI is not configured yet. Add OPENAI_API_KEY to the Supabase Edge Function secrets." }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const messages = Array.isArray(body?.messages) ? body.messages.slice(-20) : [];
    if (!messages.length) return new Response(JSON.stringify({ error: "No messages supplied" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const input = [
      { role: "developer", content: SYSTEM },
      ...messages.map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content ?? "").slice(0, 8000) })),
    ];

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "gpt-5.6-luna", input, max_output_tokens: 1200 }),
    });

    const payload = await response.json();
    if (!response.ok) return new Response(JSON.stringify({ error: payload?.error?.message ?? "Shadow AI request failed" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const text = extractText(payload);
    if (!text) return new Response(JSON.stringify({ error: "Shadow returned an empty response" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ message: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected Shadow AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
