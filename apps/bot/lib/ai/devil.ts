import axios from "axios";

const OLLAMA_URL = process.env.OLLAMA_BASE_URL ?? "http://ollama:11434";
const MODEL = "llama3.2:3b";

export interface BusinessProfile {
  name: string;
  products: Array<{ name: string; price: number }>;
  hours: string;
  whatsapp_number: string;
}

export interface DevilsAdvocateChallenge {
  category: string; issue: string; severity: "low" | "medium" | "high"; suggestion: string;
}

export interface DevilsAdvocateReport {
  overallRisk: "low" | "medium" | "high";
  challenges: DevilsAdvocateChallenge[];
  blindSpots: string[];
  provokeQuestion: string;
  verdict: string;
}

const SYSTEM_PROMPT = `You are a brutally honest business mentor for informal traders in Africa.
Stress-test their business setup. Identify pricing risks, market saturation, cash flow traps, operational blind spots.

Return ONLY valid JSON matching this shape:
{
  "overallRisk": "low" | "medium" | "high",
  "challenges": [{"category": string, "issue": string, "severity": "low"|"medium"|"high", "suggestion": string}],
  "blindSpots": string[],
  "provokeQuestion": string,
  "verdict": string
}

Rules: 3-6 challenges, 3-5 blindSpots, ONE provokeQuestion, verdict is exactly 2 sentences. No text outside JSON.`;

export async function runDevilsAdvocate(business: BusinessProfile): Promise<DevilsAdvocateReport> {
  const prompt = `Analyse this business:
Name: ${business.name}
Hours: ${business.hours}
Products: ${JSON.stringify(business.products, null, 2)}
Be the devil's advocate.`;

  const { data } = await axios.post(`${OLLAMA_URL}/api/chat`, {
    model: MODEL,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: prompt }],
    stream: false,
    options: { temperature: 0.8, num_predict: 1024 },
  });

  const text = data.message?.content ?? "";
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]) as DevilsAdvocateReport;
    throw new Error("No JSON found");
  } catch {
    // Return a sensible default if parsing fails
    return {
      overallRisk: "medium",
      challenges: [{ category: "General", issue: "Unable to fully analyse — please review your pricing and market.", severity: "medium", suggestion: "Consider researching competitor prices in your area." }],
      blindSpots: ["Consider seasonal demand changes", "Think about delivery options", "Plan for slow months"],
      provokeQuestion: "What happens if a competitor opens next door with lower prices?",
      verdict: "Your business has potential but needs careful monitoring. Review your pricing strategy and consider diversifying your offerings.",
    };
  }
}
