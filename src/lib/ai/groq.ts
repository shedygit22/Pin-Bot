import OpenAI from "openai";

const groqClient = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "",
});

const openRouterClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export async function generateWithGroq(
  systemPrompt: string,
  userPrompt: string,
  model: string = "llama-3.1-70b-versatile",
  temperature: number = 0.7
): Promise<string> {
  try {
    const response = await groqClient.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: 2000,
    });
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.warn("Groq API failed, falling back to OpenRouter:", error);
    return generateWithOpenRouter(systemPrompt, userPrompt, temperature);
  }
}

export async function generateWithOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  try {
    const response = await openRouterClient.chat.completions.create({
      model: process.env.OPENROUTER_FREE_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature,
      max_tokens: 2000,
    });
    return response.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("OpenRouter fallback also failed:", error);
    throw new Error("All AI providers failed");
  }
}

export async function generateChatResponse(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  tools?: Array<Record<string, unknown>>,
  model: string = "llama-3.1-70b-versatile"
) {
  try {
    const response = await groqClient.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      tools: tools as any,
      temperature: 0.7,
      max_tokens: 4096,
    });
    return response.choices[0]?.message;
  } catch (error) {
    console.warn("Groq chat failed, falling back to OpenRouter:", error);
    const response = await openRouterClient.chat.completions.create({
      model: process.env.OPENROUTER_FREE_MODEL || "meta-llama/llama-3.1-8b-instruct:free",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 4096,
    });
    return response.choices[0]?.message;
  }
}
