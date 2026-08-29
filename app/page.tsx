"use client";

import { useEffect, useState } from "react";
import { HospitalListPlaceholder } from "@/components/HomePlaceholders";
import { SearchBar } from "@/components/SearchBar";
import Map from "@/components/Map";

// Temporary mock data until Supabase integration is fully wired in this component
const mockHospitals = [
  { id: "1", name: "Max Super Speciality Hospital", lat: 28.5273, lng: 77.2183 },
  { id: "2", name: "AIIMS Delhi", lat: 28.5659, lng: 77.2093 },
  { id: "3", name: "Apollo Hospital", lat: 28.5376, lng: 77.2796 },
];

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  // For routing testing
  const [route, setRoute] = useState<[number, number][] | null>(null);

  useEffect(() => {
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
          <SearchBar />
        </div>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="min-h-[360px] rounded-2xl overflow-hidden border border-neutral-200 shadow-sm relative">
          <Map
            userLocation={userLocation}
            hospitals={mockHospitals}
            selectedHospital={null}
            route={route}
          />
        </div>
        <HospitalListPlaceholder />
      </div>
    </main>
  );
}
