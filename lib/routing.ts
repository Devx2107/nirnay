const ROUTE_CACHE_TTL_MS = 5 * 60 * 1000;
const ROUTE_CACHE_KEY = "hospital-finder-route-cache-v1";

type CachedRoute = {
  expiresAt: number;
  route: [number, number][] | null;
  distance: number;
  duration: number;
};

type ServerRouteMetrics = {
  route: [number, number][] | null;
  distanceKm: number;
  durationMinutes: number;
  source: "ors" | "estimated";
};

function routeCacheKey(startCoords: [number, number], endCoords: [number, number]) {
  // A small coordinate rounding makes nearby repeated searches share the cache.
  return [startCoords[0], startCoords[1], endCoords[0], endCoords[1]]
    .map((coordinate) => coordinate.toFixed(4))
    .join(":");
}

export async function getRoute(startCoords: [number, number], endCoords: [number, number]) {
  const cacheKey = routeCacheKey(startCoords, endCoords);
  if (typeof window !== "undefined") {
    try {
      const cache = JSON.parse(localStorage.getItem(ROUTE_CACHE_KEY) || "{}") as Record<string, CachedRoute>;
      const cached = cache[cacheKey];
      if (cached && cached.expiresAt > Date.now()) {
        return { route: cached.route, distance: cached.distance, duration: cached.duration, cached: true };
      }
    } catch {
      localStorage.removeItem(ROUTE_CACHE_KEY);
    }
  }

  // Call our local API route to keep the API key hidden from the client
  const startParam = `${startCoords[1]},${startCoords[0]}`; // lon,lat
  const endParam = `${endCoords[1]},${endCoords[0]}`;       // lon,lat
  
  const url = `/api/directions?start=${startParam}&end=${endParam}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch route");
  }

  const data = await response.json();
  
  if (data.mock) {
    console.warn("OpenRouteService API key is missing or invalid. Returning mock route.");
    return { route: [startCoords, endCoords], distance: 0, duration: 0 };
  }

  const coords = data.features[0].geometry.coordinates;
  // ORS returns [lon, lat], leaflet needs [lat, lon]
  const route = coords.map((c: [number, number]) => [c[1], c[0]]);
  const distance = data.features[0].properties.summary.distance; // meters
  const duration = data.features[0].properties.summary.duration; // seconds

  if (typeof window !== "undefined") {
    try {
      const cache = JSON.parse(localStorage.getItem(ROUTE_CACHE_KEY) || "{}") as Record<string, CachedRoute>;
      cache[cacheKey] = { expiresAt: Date.now() + ROUTE_CACHE_TTL_MS, route, distance, duration };
      localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Routing should still work when browser storage is unavailable or full.
    }
  }

  return { route, distance, duration, cached: false };
}

const serverRouteCache = new Map<string, { expiresAt: number; metrics: ServerRouteMetrics }>();

export async function getServerRoute(startCoords: [number, number], endCoords: [number, number]): Promise<ServerRouteMetrics> {
  const cacheKey = routeCacheKey(startCoords, endCoords);
  const cached = serverRouteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.metrics;
  if (cached) serverRouteCache.delete(cacheKey);

  const distanceKm = getStraightLineDistance(startCoords, endCoords);
  const apiKey = process.env.ORS_API_KEY;
  if (!apiKey || apiKey === "your-ors-api-key" || apiKey.includes("your_openrouteservice_api_key_here")) {
    const metrics = {
      route: null,
      distanceKm,
      durationMinutes: Math.max(1, (distanceKm / 25) * 60),
      source: "estimated" as const,
    };
    serverRouteCache.set(cacheKey, { expiresAt: Date.now() + ROUTE_CACHE_TTL_MS, metrics });
    return metrics;
  }

  const start = `${startCoords[1]},${startCoords[0]}`;
  const end = `${endCoords[1]},${endCoords[0]}`;
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${encodeURIComponent(apiKey)}&start=${start}&end=${end}`;
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/geo+json",
        Authorization: apiKey,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      const providerMessage = (await response.text()).slice(0, 300);
      throw new Error(`ORS returned ${response.status}${providerMessage ? `: ${providerMessage}` : ""}`);
    }
    const data = await response.json();
    const feature = data.features?.[0];
    const summary = feature?.properties?.summary;
    if (!feature || !summary) throw new Error("ORS returned no route");
    const route = (feature.geometry.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng] as [number, number]);
    const metrics = {
      route,
      distanceKm: summary.distance / 1000,
      durationMinutes: summary.duration / 60,
      source: "ors" as const,
    };
    serverRouteCache.set(cacheKey, { expiresAt: Date.now() + ROUTE_CACHE_TTL_MS, metrics });
    return metrics;
  } catch (error) {
    console.warn("ORS route unavailable; using estimated ETA:", error instanceof Error ? error.message : error);
    const metrics = {
      route: null,
      distanceKm,
      durationMinutes: Math.max(1, (distanceKm / 25) * 60),
      source: "estimated" as const,
    };
    serverRouteCache.set(cacheKey, { expiresAt: Date.now() + ROUTE_CACHE_TTL_MS, metrics });
    return metrics;
  }
}

// Returns distance in km between two coordinates [lat, lon]
export function getStraightLineDistance(coord1: [number, number], coord2: [number, number]) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(coord2[0] - coord1[0]);
  const dLon = deg2rad(coord2[1] - coord1[1]); 
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(coord1[0])) * Math.cos(deg2rad(coord2[0])) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI/180);
}
