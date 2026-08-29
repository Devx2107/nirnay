import type { ParsedIntent } from "@/lib/ai/types";
import { getScoreWeights } from "./weights";
import type { HospitalProfile, RankedHospital, RouteMetrics } from "./types";

const MAX_ETA_MINUTES = 90;

function availabilityValue(value: boolean | null): number {
  return value === null ? 0.5 : value ? 1 : 0;
}

function etaValue(minutes: number | null): number {
  if (minutes === null || !Number.isFinite(minutes)) return 0;
  return Math.max(0, Math.min(1, 1 - minutes / MAX_ETA_MINUTES));
}

export function scoreHospital(
  hospital: HospitalProfile,
  intent: ParsedIntent,
  route: RouteMetrics | null,
): RankedHospital {
  const specialtyMatch = intent.specialty
    ? hospital.specialists.some((item) => item.specialty === intent.specialty && item.available)
    : null;
  const bedAvailable = intent.admission_required && intent.bed_type
    ? hospital.inventory !== null
      ? hospital.inventory[`${intent.bed_type}_available`] > 0
      : null
    : null;
  const bloodAvailable = intent.blood_required && intent.blood_type
    ? hospital.bloodTypesAvailable.includes(intent.blood_type)
    : null;

  const missingRequirements: string[] = [];
  const reasons: string[] = [];
  if (intent.specialty) {
    if (specialtyMatch) reasons.push(`${intent.specialty.replaceAll("_", " ")} specialist available`);
    else missingRequirements.push(`${intent.specialty.replaceAll("_", " ")} specialist`);
  }
  if (intent.admission_required && intent.bed_type) {
    if (bedAvailable) reasons.push(`${intent.bed_type.toUpperCase()} bed available`);
    else missingRequirements.push(`${intent.bed_type.toUpperCase()} bed`);
  }
  if (intent.blood_required && intent.blood_type) {
    if (bloodAvailable) reasons.push(`${intent.blood_type} blood available`);
    else missingRequirements.push(`${intent.blood_type} blood`);
  }
  if (route) reasons.push(`Estimated drive time: ${Math.round(route.durationMinutes)} minutes`);

  const weights = getScoreWeights(intent.urgency_level);
  const features = {
    eta: etaValue(route?.durationMinutes ?? null),
    specialty: availabilityValue(specialtyMatch),
    bed: availabilityValue(bedAvailable),
    blood: availabilityValue(bloodAvailable),
  };
  const score = Math.round(
    (features.eta * weights.eta +
      features.specialty * weights.specialty +
      features.bed * weights.bed +
      features.blood * weights.blood) * 100,
  );

  return {
    hospital,
    score,
    eligible: missingRequirements.length === 0,
    distanceKm: route?.distanceKm ?? 0,
    etaMinutes: route?.durationMinutes ?? null,
    route: route?.route ?? null,
    routeSource: route?.source ?? null,
    reasons,
    missingRequirements,
    features,
  };
}
