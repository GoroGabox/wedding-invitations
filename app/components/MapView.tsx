"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Carga react-leaflet solo en cliente
const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});

type LatLngLiteral = { lat: number; lng: number };

export default function MapView({
  position,
  zoom = 14,
}: {
  position: LatLngLiteral;
  zoom?: number;
}) {
  const [icon, setIcon] = useState<L.DivIcon | null>(null);

  // Cargar Leaflet sólo en cliente y crear un divIcon
  useEffect(() => {
    let mounted = true;
    (async () => {
      const L = await import("leaflet");
      const divIcon = L.divIcon({
        className: "",
        html:
          '<div style="width:18px;height:18px;border-radius:9999px;transform:translate(-9px,-9px);background:#C36B5E;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,.25)"></div>',
      });
      if (mounted) setIcon(divIcon);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="h-72 rounded-2xl overflow-hidden border">
      <MapContainer
        center={position}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OSM"
        />
        {/* Si el icono aún no cargó, deja que Marker use el default */}
        <Marker position={position} icon={icon ?? undefined} />
      </MapContainer>
    </div>
  );
}
