import { NextResponse } from "next/server";
import { validateAndNormalizeIntent } from "@/lib/ai/validation";
import { getServerRoute, getStraightLineDistance } from "@/lib/routing";
import { fetchHospitalProfiles } from "@/lib/search/hospital-profiles";
import { scoreHospital } from "@/lib/scoring/score-hospital";
import type { SearchRequest } from "@/lib/scoring/types";

const MAX_CANDIDATES = 8;
const SEARCH_RADIUS_KM = 50;

function validCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SearchRequest>;
    const origin = body.origin;
    if (!origin || !validCoordinate(origin.latitude, -90, 90) || !validCoordinate(origin.longitude, -180, 180)) {
      return NextResponse.json({ error: "A valid origin location is required" }, { status: 400 });
    }
    const intent = validateAndNormalizeIntent(body.intent);
    const profiles = await fetchHospitalProfiles();
    const nearby = profiles
      .map((hospital) => ({
        hospital,
        straightLineDistanceKm: getStraightLineDistance(
          [origin.latitude, origin.longitude],
          [hospital.latitude, hospital.longitude],
        ),
      }))
      .filter((item) => item.straightLineDistanceKm <= SEARCH_RADIUS_KM)
      .sort((a, b) => a.straightLineDistanceKm - b.straightLineDistanceKm)
      .slice(0, MAX_CANDIDATES);

    const ranked = await Promise.all(nearby.map(async ({ hospital, straightLineDistanceKm }) => {
      const route = await getServerRoute(
        [origin.latitude, origin.longitude],
        [hospital.latitude, hospital.longitude],
      );
      return scoreHospital(hospital, intent, route ?? {
        route: null,
        distanceKm: straightLineDistanceKm,
        durationMinutes: 0,
        source: "estimated",
      });
    }));

    ranked.sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return (a.etaMinutes ?? Number.MAX_VALUE) - (b.etaMinutes ?? Number.MAX_VALUE);
    });
    return NextResponse.json({ success: true, results: ranked, candidates: nearby.length });
  } catch (error) {
    console.error("Hospital search failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Hospital search failed" }, { status: 500 });
  }
}
