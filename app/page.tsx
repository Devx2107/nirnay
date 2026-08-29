"use client";

import { useEffect, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import Map from "@/components/Map";
import { supabase } from "@/lib/supabaseClient";
import type { ParsedIntent } from "@/lib/ai/types";
import type { RankedHospital } from "@/lib/scoring/types";

const SEARCH_CACHE_KEY = "hospital-finder-search-cache-v1";
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
import { MapPin, Phone, Ambulance } from "lucide-react";

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
    const cacheKey = JSON.stringify({
      latitude: userLocation[0].toFixed(4),
      longitude: userLocation[1].toFixed(4),
      intent,
    });
    try {
      try {
        const cache = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || "{}") as Record<string, { expiresAt: number; results: RankedHospital[] }>;
        const cached = cache[cacheKey];
        if (cached && cached.expiresAt > Date.now()) {
          setRankedHospitals(cached.results);
          setHospitals(cached.results.map((item) => ({
            id: item.hospital.id,
            name: item.hospital.name,
            lat: item.hospital.latitude,
            lng: item.hospital.longitude,
          })));
          setSelectedHospital(null);
          return;
        }
        if (cached) delete cache[cacheKey];
      } catch {
        localStorage.removeItem(SEARCH_CACHE_KEY);
      }

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
      try {
        const cache = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || "{}") as Record<string, { expiresAt: number; results: RankedHospital[] }>;
        cache[cacheKey] = { expiresAt: Date.now() + SEARCH_CACHE_TTL_MS, results: result.results };
        localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cache));
      } catch {
        // Ranking still works when browser storage is unavailable or full.
      }
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

  function toggleHospital(hospital: { id: string; name: string; lat: number; lng: number }) {
    setSelectedHospital((current: { id: string } | null) => current?.id === hospital.id ? null : hospital);
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pt-4 pb-10 sm:px-8 sm:pt-6 sm:pb-16">
      {locationDenied && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <p className="font-semibold">Location access denied</p>
          <p>We need your location to find nearby hospitals and calculate ETA. Please enable location permissions in your browser and refresh.</p>
        </div>
      )}

      <section className="relative mx-auto flex max-w-3xl flex-col items-center justify-center rounded-3xl px-4 py-10 text-center pb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-neutral-950 sm:text-5xl">
          Find the right hospital
        </h1>
        <p className="mt-4 text-lg text-neutral-500 max-w-xl">
          Tell us what you need and we&apos;ll help you find nearby care.
        </p>
        <div className="mt-8 w-full max-w-2xl">
          <SearchBar onIntent={searchHospitals} />
          {searchLoading && <p className="mt-3 text-sm text-neutral-500">Ranking nearby hospitals...</p>}
          {searchError && <p className="mt-3 text-sm text-red-600">{searchError}</p>}
        </div>
      </section>

      <div className={`mt-10 flex flex-col lg:flex-row gap-6 items-start transition-all duration-700 ease-in-out`}>
        <div className={`transition-all duration-700 ease-in-out rounded-2xl overflow-hidden border border-neutral-200 shadow-sm relative h-[400px] lg:h-[500px] flex-shrink-0 ${rankedHospitals.length > 0 ? "w-full lg:w-[57%]" : "w-full max-w-4xl mx-auto"}`}>
          <Map
            userLocation={userLocation}
            hospitals={hospitals}
            selectedHospital={selectedHospital}
            route={selectedResult?.route || null}
            onMarkerClick={toggleHospital}
          />
        </div>
        {rankedHospitals.length > 0 && (
          <section aria-label="Ranked hospital list" className="w-full lg:w-[43%] space-y-3 slide-in-fade">
            <h2 className="text-lg font-semibold text-neutral-900">Recommended hospitals</h2>
            {rankedHospitals.map((item) => {
              const isSelected = selectedHospital?.id === item.hospital.id;
              return (
                <div
                  key={item.hospital.id}
                onClick={() => toggleHospital({ id: item.hospital.id, name: item.hospital.name, lat: item.hospital.latitude, lng: item.hospital.longitude })}
                  className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition-all duration-300 ease-out cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${isSelected ? 'border-brand-500 ring-1 ring-brand-500' : 'border-neutral-200 hover:border-brand-300'}`}
                  role="button"
                  tabIndex={0}
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
                  
                  <div className={`grid overflow-hidden transition-all duration-300 ease-in-out ${isSelected ? "mt-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="min-h-0 border-t border-neutral-100 pt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.hospital.name + ' ' + (item.hospital.address || ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded-lg transition-colors"
                      >
                        <MapPin className="h-3.5 w-3.5 text-brand-600" />
                        Map
                      </a>
                      {item.hospital.phone && (
                        <a 
                          href={`tel:${item.hospital.phone.replace(/[^0-9+]/g, '')}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-medium rounded-lg transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5 text-brand-600" />
                          Call
                        </a>
                      )}
                      {item.hospital.ambulance_phone && (
                        <a 
                          href={`tel:${item.hospital.ambulance_phone.replace(/[^0-9+]/g, '')}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg transition-colors"
                        >
                          <Ambulance className="h-3.5 w-3.5 text-red-600" />
                          Ambulance
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
