export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type ParsedIntent = {
  specialty: string | null;
  blood_type: string | null;
  urgency_level: UrgencyLevel | null;
};

export interface IntentProvider {
  parseIntent(input: string): Promise<unknown>;
}

export class ProviderError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "ProviderError";
  }
}
