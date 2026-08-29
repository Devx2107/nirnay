import type { ParsedIntent, UrgencyLevel } from "./types";

const BLOOD_TYPES = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
const URGENCY_LEVELS = new Set<UrgencyLevel>(["low", "medium", "high", "critical"]);

const SPECIALTY_ALIASES: Record<string, string> = {
  "heart doctor": "cardiology",
  cardiologist: "cardiology",
  "heart specialist": "cardiology",
  neurologist: "neurology",
  orthopedist: "orthopedics",
  orthopedic: "orthopedics",
  "bone doctor": "orthopedics",
  pediatrician: "pediatrics",
  "child specialist": "pediatrics",
  surgeon: "general_surgery",
};

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return typeof value === "string" ? value.trim() : null;
}

function normalizeBloodType(value: unknown): string | null {
  const raw = nullableString(value);
  if (!raw) return null;
  const normalized = raw.toUpperCase().replace(/\s+/g, "").replace("NEGATIVE", "-").replace("POSITIVE", "+");
  return BLOOD_TYPES.has(normalized) ? normalized : null;
}

function normalizeSpecialty(value: unknown): string | null {
  const raw = nullableString(value)?.toLowerCase();
  if (!raw) return null;
  return SPECIALTY_ALIASES[raw] ?? raw.replace(/\s+/g, "_");
}

function normalizeUrgency(value: unknown): UrgencyLevel | null {
  const raw = nullableString(value)?.toLowerCase();
  if (!raw) return null;
  const aliases: Record<string, UrgencyLevel> = {
    mild: "low",
    urgent: "high",
    severe: "high",
    emergency: "critical",
    life_threatening: "critical",
    "life-threatening": "critical",
  };
  const normalized = aliases[raw] ?? raw;
  return URGENCY_LEVELS.has(normalized as UrgencyLevel) ? (normalized as UrgencyLevel) : null;
}

export function validateAndNormalizeIntent(value: unknown): ParsedIntent {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Intent response must be a JSON object");
  const record = value as Record<string, unknown>;
  if (!["specialty", "blood_type", "urgency_level"].every((key) => key in record)) {
    throw new Error("Intent response is missing required fields");
  }

  const bloodType = normalizeBloodType(record.blood_type);
  if (nullableString(record.blood_type) && !bloodType) throw new Error("Unsupported blood type");
  const urgency = normalizeUrgency(record.urgency_level);
  if (nullableString(record.urgency_level) && !urgency) throw new Error("Unsupported urgency level");

  return {
    specialty: normalizeSpecialty(record.specialty),
    blood_type: bloodType,
    urgency_level: urgency,
  };
}
