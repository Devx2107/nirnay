import type { UrgencyLevel } from "@/lib/ai/types";
import type { ScoreWeights } from "./types";

const WEIGHTS: Record<UrgencyLevel, ScoreWeights> = {
  low: { eta: 0.45, specialty: 0.3, bed: 0.15, blood: 0.1 },
  medium: { eta: 0.45, specialty: 0.3, bed: 0.15, blood: 0.1 },
  high: { eta: 0.35, specialty: 0.3, bed: 0.2, blood: 0.15 },
  critical: { eta: 0.4, specialty: 0.2, bed: 0.25, blood: 0.15 },
};

export function getScoreWeights(urgency: UrgencyLevel | null): ScoreWeights {
  return WEIGHTS[urgency ?? "medium"];
}
