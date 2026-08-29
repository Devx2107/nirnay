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
