export type UrgencyLevel = "low" | "medium" | "high" | "critical";
export type BedType = "icu" | "general";
export type FollowUpField = "blood_type";

export type ParsedIntent = {
  specialty: string | null;
  blood_type: string | null;
  urgency_level: UrgencyLevel | null;
  admission_required: boolean | null;
  bed_type: BedType | null;
  blood_required: boolean | null;
};

export type FollowUp = {
  field: FollowUpField;
  question: string;
  options: string[];
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
