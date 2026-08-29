import { OpenAICompatibleProvider } from "./providers/openai-compatible";
import type { IntentProvider } from "./types";

function getProvider(): IntentProvider {
  const provider = process.env.LLM_PROVIDER?.toLowerCase() || "groq";
  if (provider === "groq") {
    return new OpenAICompatibleProvider({
      name: "Groq",
      apiKey: process.env.GROQ_API_KEY,
      endpoint: process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions",
      model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
    });
  }
  if (provider === "asi") {
    return new OpenAICompatibleProvider({ name: "ASI", apiKey: process.env.ASI_API_KEY, endpoint: process.env.ASI_API_URL, model: process.env.ASI_MODEL });
  }
  throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
}

export function parseIntent(input: string) {
  return getProvider().parseIntent(input);
}
