"use client";

import { useEffect, useState } from "react";
import { HospitalListPlaceholder } from "@/components/HomePlaceholders";
import { SearchBar } from "@/components/SearchBar";
import Map from "@/components/Map";
import { supabase } from "@/lib/supabaseClient";
import { getRoute, getStraightLineDistance } from "@/lib/routing";

export default function HomePage() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  
  // Stores routing info mapped by hospital id
  const [hospitalRoutes, setHospitalRoutes] = useState<Record<string, any>>({});

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

  // Fetch routes for hospitals within a 50km radius when location and hospitals are available
  useEffect(() => {
    if (!userLocation || hospitals.length === 0) return;

    const fetchRoutes = async () => {
      const radiusKm = 50;
      
      const nearbyHospitals = hospitals.filter(h => {
        const dist = getStraightLineDistance(userLocation, [h.lat, h.lng]);
        return dist <= radiusKm;
      });

      const routesData: Record<string, any> = {};

      await Promise.all(nearbyHospitals.map(async (h) => {
        try {
          const routeInfo = await getRoute(userLocation, [h.lat, h.lng]);
          routesData[h.id] = routeInfo;
        } catch (error) {
          console.error(`Failed to fetch route for hospital ${h.id}:`, error);
        }
      }));

      setHospitalRoutes(routesData);
    };

    fetchRoutes();
  }, [userLocation, hospitals]);

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
            hospitals={hospitals}
            selectedHospital={selectedHospital}
            route={selectedHospital ? hospitalRoutes[selectedHospital.id]?.route || null : null}
            onMarkerClick={(hospital) => setSelectedHospital(hospital)}
          />
        </div>
        <HospitalListPlaceholder />
      </div>
    </main>
  );
}
