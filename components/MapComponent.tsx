"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, CircleMarker } from "react-leaflet";
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
  onMarkerClick?: (hospital: Hospital) => void;
}

// Controller to smoothly pan/zoom the map when location updates
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

// Fixes "glitchy" map rendering during CSS layout transitions (e.g. width changes)
function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    
    const container = map.getContainer();
    observer.observe(container);
    
    return () => observer.disconnect();
  }, [map]);
  
  return null;
}

export default function MapComponent({ userLocation, hospitals, selectedHospital, route, onMarkerClick }: MapComponentProps) {
  const defaultCenter: [number, number] = [28.6139, 77.2090]; // Delhi
  const center = userLocation || defaultCenter;
  const zoomLevel = userLocation ? 13 : 11;

  return (
    <MapContainer 
      center={center} 
      zoom={zoomLevel} 
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      zoomControl={true}
    >
      {/* Handlers */}
      <MapController center={center} zoom={zoomLevel} />
      <MapResizer />
      
      {/* Base Map layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* User Location */}
      {userLocation && (
        <CircleMarker 
          center={userLocation} 
          radius={8} 
          pathOptions={{ fillColor: '#3b82f6', color: '#ffffff', weight: 3, fillOpacity: 1 }}
        >
          <Popup>You are here</Popup>
        </CircleMarker>
      )}

      {/* Hospital Markers */}
      {hospitals.map((h) => (
        <Marker 
          key={h.id} 
          position={[h.lat, h.lng]}
          eventHandlers={{
            click: () => onMarkerClick?.(h),
          }}
        >
          <Popup autoPan={true}>
            <strong>{h.name}</strong>
          </Popup>
        </Marker>
      ))}

      {/* Route Path */}
      {route && route.length > 0 && (
        <Polyline positions={route} color="#3b82f6" weight={5} opacity={0.7} />
      )}
    </MapContainer>
  );
}
