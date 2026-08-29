export async function getRoute(startCoords: [number, number], endCoords: [number, number]) {
  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY;
  if (!apiKey || apiKey === "your_openrouteservice_api_key_here") {
    console.warn("OpenRouteService API key is missing or invalid. Returning mock route.");
    return { route: [startCoords, endCoords], distance: 0, duration: 0 };
  }

  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startCoords[1]},${startCoords[0]}&end=${endCoords[1]},${endCoords[0]}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch route");
  }

  const data = await response.json();
  const coords = data.features[0].geometry.coordinates;
  // ORS returns [lon, lat], leaflet needs [lat, lon]
  const route = coords.map((c: [number, number]) => [c[1], c[0]]);
  const distance = data.features[0].properties.summary.distance; // meters
  const duration = data.features[0].properties.summary.duration; // seconds

  return { route, distance, duration };
}
