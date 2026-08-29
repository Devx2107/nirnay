export async function getRoute(startCoords: [number, number], endCoords: [number, number]) {
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

  return { route, distance, duration };
}
