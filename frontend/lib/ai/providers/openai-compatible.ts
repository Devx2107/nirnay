import { ProviderError, type IntentProvider } from "../types";

type Config = { name: string; apiKey?: string; endpoint?: string; model?: string };

const SYSTEM_PROMPT = `Extract emergency-care search intent. Do not diagnose the patient.
Return only valid JSON with exactly these keys:
{"specialty": string|null, "blood_type": string|null, "urgency_level": "low"|"medium"|"high"|"critical"|null}
Use null when information is not clearly present. Normalize specialties to lowercase names,
blood types to A+, A-, B+, B-, AB+, AB-, O+, or O-, and urgency to the allowed values.
Do not include Markdown, explanations, treatment advice, or extra fields.`;

export class OpenAICompatibleProvider implements IntentProvider {
  constructor(private readonly config: Config) {}

  async parseIntent(input: string): Promise<unknown> {
    const { apiKey, endpoint, model, name } = this.config;
    if (!apiKey || !endpoint || !model) throw new ProviderError(`${name} provider is not configured`, 500);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: input },
          ],
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new ProviderError(`${name} returned HTTP ${response.status}`);

      const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }> };
      const content = payload.choices?.[0]?.message?.content;
      const text = Array.isArray(content) ? content.map((part) => part.text ?? "").join("") : content;
      if (!text) throw new ProviderError(`${name} returned an empty response`);
      try {
        return JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim());
      } catch {
        throw new ProviderError(`${name} returned invalid JSON`, 422);
      }
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      if (error instanceof DOMException && error.name === "AbortError") throw new ProviderError(`${name} request timed out`);
      throw new ProviderError(`${name} request failed`);
    } finally {
      clearTimeout(timeout);
    }
  }
}
