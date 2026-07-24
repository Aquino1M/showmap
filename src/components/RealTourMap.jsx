import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import MapLegend from './MapLegend';
import { getCityCoordinateKey, getCityLatLng, resolveCityLatLng } from '../lib/map';
import { getEventStatusLabel, getRecurringOccurrenceDate, getShowProximityColor } from '../lib/tour';

const BRAZIL_CENTER = [-14.235, -51.925];
const BRAZIL_ZOOM = 5;
const MOBILE_BRAZIL_ZOOM = 4;
// Margem ao redor do Brasil: permite arrastar para conferir todo o Sul sem
// deixar o usuário preso na borda do mapa.
const BRAZIL_BOUNDS = [[-38.5, -78.5], [8.5, -30.5]];

function ResetMap({ resetToken, defaultZoom }) {
  const map = useMap();
  useEffect(() => {
    if (resetToken) map.setView(BRAZIL_CENTER, defaultZoom, { animate: true });
  }, [map, resetToken, defaultZoom]);
  return null;
}

function StateClickHandler({ onSelectState }) {
  useMapEvents({
    click: async ({ latlng }) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=5&lat=${latlng.lat}&lon=${latlng.lng}`);
        if (!response.ok) return;
        const result = await response.json();
        const stateCode = String(result?.address?.['ISO3166-2-lvl4'] || '').replace(/^BR-/, '').toUpperCase();
        if (/^[A-Z]{2}$/.test(stateCode)) onSelectState(stateCode);
      } catch {
        // O mapa continua utilizável se a consulta de estado estiver indisponível.
      }
    },
  });
  return null;
}

function ViewportTracker({ onViewportChange }) {
  useMapEvents({
    moveend: (event) => {
      const map = event.target;
      const center = map.getCenter();
      onViewportChange?.({ center: [center.lat, center.lng], zoom: map.getZoom() });
    },
  });
  return null;
}

function MapActions({ defaultZoom }) {
  const map = useMap();
  return (
    <div className="absolute bottom-4 left-4 z-[500] hidden flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#0B0F19]/95 shadow-lg sm:flex">
      <button onClick={() => map.zoomIn()} aria-label="Aproximar mapa" className="p-2.5 text-cyan-300 hover:bg-indigo-600 hover:text-white"><Plus size={19} /></button>
      <button onClick={() => map.zoomOut()} aria-label="Afastar mapa" className="border-y border-slate-700 p-2.5 text-cyan-300 hover:bg-indigo-600 hover:text-white"><Minus size={19} /></button>
      <button onClick={() => map.setView(BRAZIL_CENTER, defaultZoom, { animate: true })} aria-label="Centralizar Brasil" className="p-2.5 text-cyan-300 hover:bg-indigo-600 hover:text-white"><RotateCcw size={17} /></button>
    </div>
  );
}

export default function RealTourMap({ events, selectedState, selectedEventId, onSelectEvent, onSelectState, onViewEvent, resetToken, initialViewport, onViewportChange, hideLegend = false }) {
  const [locations, setLocations] = useState({});
  const defaultZoom = useMemo(
    () => (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? MOBILE_BRAZIL_ZOOM : BRAZIL_ZOOM),
    [],
  );
  const visibleEvents = useMemo(
    () => events.filter((event) => !selectedState || event.stateId === selectedState),
    [events, selectedState],
  );

  useEffect(() => {
    let active = true;
    const cities = [...new globalThis.Map(visibleEvents.map((event) => [
      getCityCoordinateKey(event.stateId, event.city),
      { stateId: event.stateId, city: event.city },
    ])).entries()];

    Promise.all(cities.map(async ([key, location]) => [
      key,
      await resolveCityLatLng(location.stateId, location.city),
    ])).then((entries) => {
      if (!active) return;
      setLocations((current) => {
        let changed = false;
        const next = { ...current };
        entries.forEach(([key, coordinates]) => {
          if (coordinates && (current[key]?.[0] !== coordinates[0] || current[key]?.[1] !== coordinates[1])) {
            next[key] = coordinates;
            changed = true;
          }
        });
        return changed ? next : current;
      });
    });
    return () => { active = false; };
  }, [visibleEvents]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <MapContainer center={initialViewport?.center || BRAZIL_CENTER} zoom={initialViewport?.zoom || defaultZoom} minZoom={defaultZoom} maxZoom={14} maxBounds={BRAZIL_BOUNDS} maxBoundsViscosity={0.25} dragging touchZoom doubleClickZoom zoomControl={false} attributionControl={false} scrollWheelZoom className="h-full w-full bg-[#101827]" aria-label="Mapa geográfico dos eventos">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ResetMap resetToken={resetToken} defaultZoom={defaultZoom} />
        <StateClickHandler onSelectState={onSelectState} />
        <ViewportTracker onViewportChange={onViewportChange} />
        <MapActions defaultZoom={defaultZoom} />
        {visibleEvents.map((event) => {
          const key = getCityCoordinateKey(event.stateId, event.city);
          const position = locations[key] || getCityLatLng(event.stateId, event.city);
          const occurrenceDate = getRecurringOccurrenceDate(event);
          const color = getShowProximityColor(occurrenceDate || event.date);
          const selected = selectedEventId === event.id;
          return (
            <CircleMarker key={event.id} center={position} radius={selected ? 12 : 9} pathOptions={{ color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }} eventHandlers={{ click: () => { onSelectEvent(event.id); if (onViewEvent) onViewEvent(event); } }}>
              <Popup>
                <div className="min-w-40 text-sm text-slate-900">
                  <strong>{event.city} · {event.stateId}</strong><br />
                  {new Date(`${event.date}T12:00:00`).toLocaleDateString('pt-BR')}<br />
                  {event.artistName && <>Artista: {event.artistName}<br /></>}
                  Status: {getEventStatusLabel(event.status)}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      {!hideLegend && <MapLegend mobileBottom="bottom-[7rem]" />}
    </div>
  );
}
