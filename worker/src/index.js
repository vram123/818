// 818 Accounting Serve: chat assistant API (Cloudflare Worker)
// Keeps the Gemini API key server side. The website posts the conversation
// here and gets the assistant's reply back.

// Tried in order; the next one is used when a model is unavailable, overloaded
// or over its quota.
const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"];
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";

const ALLOWED_ORIGINS = [
  "https://818accountingserve.com",
  "https://www.818accountingserve.com",
  "https://vram123.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;

const SYSTEM_PROMPT = `You are Taxo, the website assistant for 818 Accounting Serve, an accounting and tax firm run by Garo with 20 years of experience. The firm serves individuals, families and small businesses with tax preparation, bookkeeping, payroll, tax planning and help with IRS and California FTB letters.

Your job:
- Answer general questions about accounting, taxes (US federal and California) and running a small business, in plain, friendly language.
- Keep answers short: a few sentences or a short list. Explain terms simply.
- Tax amounts, limits and income cutoffs change every year. Do not state specific dollar figures as current facts; say they change yearly and should be checked for the tax year in question.
- You give general information only, not professional advice for the visitor's personal situation.

When to send them to Garo:
If a question gets complicated or personal, answer what you can in general terms, then recommend a consultation with Garo. This includes: questions that depend on their own numbers or documents, IRS or FTB letters, audits, back taxes or unfiled years, penalties, choosing or changing a business entity, S corporation questions, payroll problems, multi-state income, selling a business or property, rental properties, inheritances, or anything where a mistake could cost them money. For simple general questions, just answer; do not add the referral. Say it like: "This one depends on your situation, so I recommend a quick consultation with Garo. You can call 310-854-2876, email garog@818accountingserve.com, or send a message on our Contact page."

Rules:
- Stay on topic. If asked about something unrelated to accounting, taxes, bookkeeping, payroll or small business finance, politely say you can only help with those topics.
- Never ask for or accept Social Security numbers, bank account numbers, passwords or other sensitive details. If someone shares them, tell them not to and suggest contacting Garo directly.
- Do not promise refund amounts, outcomes or prices. For pricing, suggest contacting Garo.
- Do not invent facts about the firm beyond what is written here.
- Do not use em dashes. Use plain text without Markdown headings.`;

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, origin);
    }
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return json({ error: "Origin not allowed" }, 403, origin);
    }
    if (!env.GEMINI_API_KEY) {
      return json({ error: "Server is missing GEMINI_API_KEY" }, 500, origin);
    }

    let messages;
    try {
      ({ messages } = await request.json());
    } catch {
      return json({ error: "Invalid JSON" }, 400, origin);
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return json({ error: "messages is required" }, 400, origin);
    }

    // Keep the most recent turns and cap their length to limit cost and abuse.
    const input = messages.slice(-MAX_MESSAGES).map((m) => ({
      type: m.role === "assistant" ? "model_output" : "user_input",
      content: [{ type: "text", text: String(m.content || "").slice(0, MAX_MESSAGE_LENGTH) }],
    }));

    let res;
    for (const model of MODELS) {
      res = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          model,
          system_instruction: SYSTEM_PROMPT,
          input,
          store: false,
          generation_config: { max_output_tokens: 800, thinking_level: "low" },
        }),
      });
      if (res.ok || ![404, 429, 503].includes(res.status)) break;
      console.error("Gemini " + model + " unavailable", res.status);
    }

    if (!res.ok) {
      console.error("Gemini error", res.status, await res.text());
      return json({ error: "The assistant is unavailable right now." }, 502, origin);
    }

    const data = await res.json();
    const reply = (data.steps || [])
      .filter((s) => s.type === "model_output")
      .flatMap((s) => s.content || [])
      .map((c) => c.text || "")
      .join("")
      .trim();

    return json({ reply: reply || "Sorry, I could not answer that. Please call Garo at 310-854-2876." }, 200, origin);
  },
};
