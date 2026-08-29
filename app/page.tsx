"use client";

import { useEffect, useState } from "react";
import { HospitalListPlaceholder } from "@/components/HomePlaceholders";
import { SearchBar } from "@/components/SearchBar";
import Map from "@/components/Map";
import { supabase } from "@/lib/supabaseClient";
import type { ParsedIntent } from "@/lib/ai/types";
import type { RankedHospital } from "@/lib/scoring/types";

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  const [rankedHospitals, setRankedHospitals] = useState<RankedHospital[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      const { data, error } = await supabase.from('hospitals').select('*');
      if (error) {
        console.error('Error fetching hospitals:', error);
      } else if (data) {
        setHospitals(data.map(h => ({
          id: h.id,
          name: h.name,
          lat: h.latitude,
          lng: h.longitude
        })));
      }
    };
    
    fetchHospitals();

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocationDenied(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationDenied(true);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  async function searchHospitals(intent: ParsedIntent) {
    if (!userLocation) {
      setSearchError("Enable location access to rank nearby hospitals.");
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const response = await fetch("/api/search-hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          origin: { latitude: userLocation[0], longitude: userLocation[1] },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Hospital search failed");
      setRankedHospitals(result.results);
      setHospitals(result.results.map((item: RankedHospital) => ({
        id: item.hospital.id,
        name: item.hospital.name,
        lat: item.hospital.latitude,
        lng: item.hospital.longitude,
      })));
      setSelectedHospital(null);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Hospital search failed");
    } finally {
      setSearchLoading(false);
    }
  }

  const selectedResult = selectedHospital
    ? rankedHospitals.find((item) => item.hospital.id === selectedHospital.id)
    : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
      {locationDenied && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <p className="font-semibold">Location access denied</p>
          <p>We need your location to find nearby hospitals and calculate ETA. Please enable location permissions in your browser and refresh.</p>
        </div>
      )}

      <section className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Find care faster</p>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-5xl">Find the right hospital when it matters.</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-neutral-500">Tell us what you need and we&apos;ll help you find nearby care.</p>
        <div className="mt-8">
          <SearchBar onIntent={searchHospitals} />
          {searchLoading && <p className="mt-3 text-sm text-neutral-500">Ranking nearby hospitals...</p>}
          {searchError && <p className="mt-3 text-sm text-red-600">{searchError}</p>}
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="min-h-[360px] rounded-2xl overflow-hidden border border-neutral-200 shadow-sm relative">
          <Map
            userLocation={userLocation}
            hospitals={hospitals}
            selectedHospital={selectedHospital}
            route={selectedResult?.route || null}
            onMarkerClick={(hospital) => setSelectedHospital(hospital)}
          />
        </div>
        {rankedHospitals.length === 0 ? <HospitalListPlaceholder /> : (
          <section aria-label="Ranked hospital list" className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900">Recommended hospitals</h2>
            {rankedHospitals.map((item) => (
              <button
                key={item.hospital.id}
                type="button"
                onClick={() => setSelectedHospital({ id: item.hospital.id, name: item.hospital.name, lat: item.hospital.latitude, lng: item.hospital.longitude })}
                className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{item.hospital.name}</h3>
                    <p className="mt-1 text-sm text-neutral-500">
                      {item.distanceKm.toFixed(1)} km · {item.etaMinutes ? `${Math.round(item.etaMinutes)} min ETA` : "ETA unavailable"}
                    </p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-sm font-semibold text-brand-700">{item.score}/100</span>
                </div>
                {item.reasons.length > 0 && <p className="mt-3 text-xs text-neutral-600">{item.reasons.join(" · ")}</p>}
                {item.missingRequirements.length > 0 && <p className="mt-2 text-xs text-red-600">Missing: {item.missingRequirements.join(", ")}</p>}
                {item.routeSource === "estimated" && <p className="mt-2 text-xs text-amber-700">ETA is an estimate</p>}
              </button>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
