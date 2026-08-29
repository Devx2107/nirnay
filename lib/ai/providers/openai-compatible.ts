import { ProviderError, type IntentProvider } from "../types";
import { SPECIALTIES } from "../specialties";

type Config = { name: string; apiKey?: string; endpoint?: string; model?: string };

const SYSTEM_PROMPT = `Extract emergency-care search intent. Do not diagnose the patient.
Return only valid JSON with exactly these keys:
{"specialty": string|null, "blood_type": string|null, "urgency_level": "low"|"medium"|"high"|"critical"|null, "admission_required": boolean|null, "bed_type": "icu"|"general"|null, "blood_required": boolean|null}
Use null when information is not clearly present. The specialty must be exactly one of this allow-list:
${SPECIALTIES.join(", ")}
Map synonyms such as cardiologist or heart doctor to cardiology. Never invent a specialty outside this list.
Normalize specialties to these canonical lowercase names,
blood types to A+, A-, B+, B-, AB+, AB-, O+, or O-, urgency to the allowed values, and bed_type to icu or general.
Set admission_required true only when the user asks for admission, hospitalization, an inpatient bed, or clearly describes a condition requiring admission.
Determine bed_type from the symptoms and severity: use icu when intensive/critical care is indicated, and general for a normal ward bed. When admission_required is true, bed_type must be either icu or general and must never be null. Use null for bed_type only when admission_required is false or null. Do not ask the user to choose a bed type.
Set blood_required true only when the text suggests significant bleeding, blood loss, transfusion, surgery with likely blood need, or a condition where blood availability is directly relevant. Do not set it true just because urgency is high.
For severe acute symptoms without enough information to identify a narrower specialty, use emergency_medicine rather than null. For lower abdominal pain, consider gynecology or obstetrics only when the text gives relevant reproductive/pregnancy clues; otherwise use emergency_medicine for severe acute cases.
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
        const parsed = JSON.parse(text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim());
        console.log(`[${name}] Raw intent JSON from LLM:`);
        console.log(JSON.stringify(parsed, null, 2));
        return parsed;
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
