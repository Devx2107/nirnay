import type { ParsedIntent } from "@/lib/ai/types";

export type HospitalProfile = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  phone: string;
  ambulance_phone: string | null;
  address: string | null;
  specialists: Array<{
    specialty: string;
    available: boolean;
  }>;
  inventory: {
    icu_available: number;
    general_available: number;
  } | null;
  bloodTypesAvailable: string[];
  updatedAt: string | null;
};

export type RouteMetrics = {
  distanceKm: number;
  durationMinutes: number;
  route: [number, number][] | null;
  source: "ors" | "estimated";
};

export type ScoreWeights = {
  eta: number;
  specialty: number;
  bed: number;
  blood: number;
};

export type RankedHospital = {
  hospital: HospitalProfile;
  score: number;
  eligible: boolean;
  distanceKm: number;
  etaMinutes: number | null;
  route: [number, number][] | null;
  routeSource: RouteMetrics["source"] | null;
  reasons: string[];
  missingRequirements: string[];
  features: {
    eta: number;
    specialty: number;
    bed: number;
    blood: number;
  };
};

export type SearchRequest = {
  intent: ParsedIntent;
  origin: { latitude: number; longitude: number };
};
