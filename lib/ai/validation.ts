import type { BedType, ParsedIntent, UrgencyLevel } from "./types";
import { SPECIALTIES, SPECIALTY_ALIASES, type Specialty } from "./specialties";

const BLOOD_TYPES = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
const URGENCY_LEVELS = new Set<UrgencyLevel>(["low", "medium", "high", "critical"]);
const BED_TYPES = new Set<BedType>(["icu", "general"]);

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

function normalizeSpecialty(value: unknown): Specialty | null {
  const raw = nullableString(value)?.toLowerCase();
  if (!raw) return null;
  const normalized = raw.replace(/[\s-]+/g, "_");
  if (SPECIALTIES.includes(normalized as Specialty)) return normalized as Specialty;
  return SPECIALTY_ALIASES[raw] ?? SPECIALTY_ALIASES[normalized] ?? null;
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

function normalizeBoolean(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  if (typeof value !== "string") return null;
  if (["true", "yes", "required", "admit", "admitting"].includes(value.toLowerCase())) return true;
  if (["false", "no", "not_required", "not required"].includes(value.toLowerCase())) return false;
  return null;
}

function normalizeBedType(value: unknown): BedType | null {
  const raw = nullableString(value)?.toLowerCase().replace(/\s+/g, "_");
  if (!raw) return null;
  if (["icu", "intensive_care", "intensive_care_unit"].includes(raw)) return "icu";
  if (["general", "general_bed", "normal", "ward"].includes(raw)) return "general";
  return null;
}

export function validateAndNormalizeIntent(value: unknown): ParsedIntent {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Intent response must be a JSON object");
  const record = value as Record<string, unknown>;
  if (!["specialty", "blood_type", "urgency_level", "admission_required", "bed_type"].every((key) => key in record)) {
    throw new Error("Intent response is missing required fields");
  }

  const specialtyText = nullableString(record.specialty);
  const specialty = normalizeSpecialty(record.specialty);
  if (specialtyText && !specialty) throw new Error("Unsupported specialty");
  const bloodType = normalizeBloodType(record.blood_type);
  if (nullableString(record.blood_type) && !bloodType) throw new Error("Unsupported blood type");
  const urgency = normalizeUrgency(record.urgency_level);
  if (nullableString(record.urgency_level) && !urgency) throw new Error("Unsupported urgency level");
  const bedType = normalizeBedType(record.bed_type);
  if (nullableString(record.bed_type) && !bedType) throw new Error("Unsupported bed type");
  const bloodRequired = normalizeBoolean(record.blood_required);

  return {
    specialty,
    blood_type: bloodType,
    urgency_level: urgency,
    admission_required: normalizeBoolean(record.admission_required),
    bed_type: bedType,
    blood_required: bloodRequired,
  };
}
