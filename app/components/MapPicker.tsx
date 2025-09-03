"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L, { LatLngLiteral } from "leaflet";

type Suggestion = { label: string; lat: number; lon: number };

type Props = {
  defaultPosition?: LatLngLiteral;      // centro inicial
  initialValue?: LatLngLiteral | null;  // para edición
  addressFieldName?: string;
};

function ClickHandler({ onPick }: { onPick: (latlng: LatLngLiteral) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function RecenterOnPick({ position }: { position: LatLngLiteral }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);
  return null;
}

function parseMapsUrl(input: string): LatLngLiteral | null {
  try {
    const s = input.trim();
    // @lat,lng,zoomz
    const at = s.match(/@(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
    if (at) return { lat: parseFloat(at[1]), lng: parseFloat(at[3]) };

    const u = new URL(s);
    // q=lat,lng o ll=lat,lng
    const q = u.searchParams.get("q") || u.searchParams.get("ll");
    if (q) {
      const [lat, lng] = q.split(/[ ,]/).map((n) => parseFloat(n));
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
    // Apple Maps: ll=lat,lng
    const ll = u.searchParams.get("ll");
    if (ll) {
      const [lat, lng] = ll.split(",").map((n) => parseFloat(n));
      if (isFinite(lat) && isFinite(lng)) return { lat, lng };
    }
  } catch {
    // no válido como URL; ignorar
  }
  return null;
}

export default function MapPicker({
  defaultPosition = { lat: -33.4489, lng: -70.6693 },
  initialValue = null,
  addressFieldName = "venueAddress",
}: Props & { addressFieldName?: string }) {

  const [picked, setPicked] = useState<LatLngLiteral | null>(initialValue);
  const center = picked ?? defaultPosition;

  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html:
          '<div style="width:18px;height:18px;border-radius:9999px;transform:translate(-9px,-9px);background:#C36B5E;border:2px solid white;box-shadow:0 1px 6px rgba(0,0,0,.25)"></div>',
      }),
    []
  );

  // --- Buscador con autocompletado ---
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);  
  const [mapsUrl, setMapsUrl] = useState("");
  const debRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debRef.current) clearTimeout(debRef.current);
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    debRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
        const data = (await res.json()) as Suggestion[];
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debRef.current) clearTimeout(debRef.current);
    };
  }, [query]);

  useEffect(() => {
    const el = document.querySelector(
      `input[name="${addressFieldName}"]`
    ) as HTMLInputElement | null;
    if (el) el.value = query;
  }, [query, addressFieldName]);

  function chooseSuggestion(s: Suggestion) {
    setPicked({ lat: s.lat, lng: s.lon });
    setSuggestions([]);
    setQuery(s.label);
    const el = document.querySelector(
      `input[name="${addressFieldName}"]`
    ) as HTMLInputElement | null;
    if (el) el.value = s.label;
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPicked({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // silenciar errores (permiso denegado, etc.)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  function applyMapsUrl() {
    const coords = parseMapsUrl(mapsUrl);
    if (coords) setPicked(coords);
    if (mapsUrl.trim()) {
      const el = document.querySelector(
        `input[name="${addressFieldName}"]`
      ) as HTMLInputElement | null;
      if (el) el.value = mapsUrl.trim();
    }
  }

  return (
    <div className="space-y-3">
          <label>Dirección *</label>
      <div className="flex gap-2">
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Buscar dirección o lugar (ej. Parque Bicentenario)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <div className="absolute right-3 top-2 text-sm boho-muted">buscando…</div>}
        {suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border bg-white shadow">
            {suggestions.map((s, i) => (
              <li
                key={i}
                className="px-3 py-2 cursor-pointer hover:bg-sand"
                onClick={() => chooseSuggestion(s)}
              >
                {s.label}
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={useMyLocation} className="boho-outline">
          Usar mi ubicación
        </button>
      </div>
      <div className="boho-divider">
        <span className="text-xs tracking-widest uppercase boho-muted">o</span>
      </div>
      <div
        className="flex gap-2"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault(); // evita enviar el form padre
            applyMapsUrl();
          }
        }}
      >
        <input
          className="flex-1 rounded-xl border px-3 py-2"
          placeholder="Pegar enlace de Google/Apple Maps (opcional)"
          value={mapsUrl}
          onChange={(e) => setMapsUrl(e.target.value)}
          autoComplete="off"
        />
        <button className="boho-outline" type="button" onClick={applyMapsUrl}>
          Cargar
       </button>
      </div>

      <div className="h-72 rounded-2xl overflow-hidden border">
        <MapContainer center={center} zoom={13} className="h-full w-full z-0" scrollWheelZoom>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OSM'
          />
          <ClickHandler onPick={setPicked} />
          {picked && <RecenterOnPick position={picked} />}
          {picked && (
            <Marker
              position={picked}
              draggable
              eventHandlers={{ dragend: (e) => setPicked((e as L.DragEndEvent).target.getLatLng()) }}
              icon={markerIcon as L.Icon}
            />
          )}
        </MapContainer>
      </div>

      {/* inputs ocultos para el <form> padre */}
      <input type="hidden" name="latitude" value={picked?.lat ?? ""} />
      <input type="hidden" name="longitude" value={picked?.lng ?? ""} />
      <p className="text-sm boho-muted">
        Busca una dirección, usa tu ubicación o pega un enlace de Maps; también puedes hacer clic en el mapa o arrastrar el marcador.
      </p>
    </div>
  );
}
