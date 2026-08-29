"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default marker icon in leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export type Hospital = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

interface MapComponentProps {
  userLocation: [number, number] | null;
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  route: [number, number][] | null;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({ userLocation, hospitals, selectedHospital, route }: MapComponentProps) {
  const defaultCenter: [number, number] = [28.6139, 77.2090]; // Delhi
  const center = userLocation || defaultCenter;

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", zIndex: 0 }}>
      <ChangeView center={center} zoom={userLocation ? 13 : 11} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {userLocation && (
        <Marker position={userLocation}>
          <Popup>You are here</Popup>
        </Marker>
      )}

      {hospitals.map((h) => (
        <Marker key={h.id} position={[h.lat, h.lng]}>
          <Popup>{h.name}</Popup>
        </Marker>
      ))}

      {route && (
        <Polyline positions={route} color="blue" weight={5} opacity={0.6} />
      )}
    </MapContainer>
  );
}
