import axios from "axios";
import { readFileSync } from "fs";
import { join } from "path";

const OLLAMA_URL = process.env.OLLAMA_BASE_URL ?? "http://ollama:11434";
const MODEL = "llama3.2:3b";

// Load SOUL.md at startup — proprietary character definition
let soulPrompt = "";
try {
  soulPrompt = readFileSync(join(process.cwd(), "../../workspace/SOUL.md"), "utf-8");
} catch {
  try {
    soulPrompt = readFileSync("/workspace/SOUL.md", "utf-8");
  } catch {
    console.warn("[ollama] SOUL.md not found — using fallback system prompt");
    soulPrompt = "You are a helpful WhatsApp business assistant. Keep replies short.";
  }
}

export interface MessageContext {
  businessName?: string;
  products?: Array<{ name: string; price: number }>;
  hours?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  language?: string;
}

async function ollamaChat(system: string, messages: Array<{ role: string; content: string }>): Promise<string> {
  try {
    const { data } = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: MODEL,
      messages: [{ role: "system", content: system }, ...messages],
      stream: false,
      options: { temperature: 0.7, num_predict: 512 },
    });
    return data.message?.content ?? "";
  } catch (err) {
    console.error("[ollama] Chat error:", err);
    return "Sorry, I'm having trouble right now. Please try again in a moment.";
  }
}

export async function processMessage(message: string, context: MessageContext): Promise<string> {
  const systemPrompt = `${soulPrompt}

Current business context:
- Business: ${context.businessName ?? "a local business"}
- Products: ${JSON.stringify(context.products ?? [])}
- Hours: ${context.hours ?? "Not specified"}

Reply in the same language the customer used. Keep replies under 300 characters.`;

  const messages = [
    ...(context.conversationHistory ?? []).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  return ollamaChat(systemPrompt, messages);
}

export async function extractBusinessSetup(
  conversation: string
): Promise<{ businessName?: string; products?: Array<{ name: string; price: number }>; hours?: string }> {
  const system =
    "You extract structured business information from a WhatsApp onboarding conversation. " +
    'Return ONLY valid JSON: { "businessName": string, "products": [{"name": string, "price": number}], "hours": string }. ' +
    "If a field cannot be determined, omit it. No explanation, just JSON.";

  const result = await ollamaChat(system, [{ role: "user", content: conversation }]);

  try {
    // Extract JSON from response (Ollama may add markdown fences)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return {};
  } catch {
    return {};
  }
}
