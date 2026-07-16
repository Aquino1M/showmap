import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import MapLegend from './MapLegend';
import { getCityCoordinateKey, getCityLatLng, resolveCityLatLng } from '../lib/map';
import { getEventStatusLabel, getShowProximityColor } from '../lib/tour';

const BRAZIL_CENTER = [-14.235, -51.925];
const BRAZIL_ZOOM = 5;
// Margem ao redor do Brasil: permite arrastar para conferir todo o Sul sem
// deixar o usuário preso na borda do mapa.
const BRAZIL_BOUNDS = [[-38.5, -78.5], [8.5, -30.5]];

function ResetMap({ resetToken }) {
  const map = useMap();
  useEffect(() => {
    if (resetToken) map.setView(BRAZIL_CENTER, BRAZIL_ZOOM, { animate: true });
  }, [map, resetToken]);
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

function MapActions() {
  const map = useMap();
  return (
    <div className="absolute bottom-4 left-4 z-[500] hidden flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#0B0F19]/95 shadow-lg sm:flex">
      <button onClick={() => map.zoomIn()} aria-label="Aproximar mapa" className="p-2.5 text-cyan-300 hover:bg-indigo-600 hover:text-white"><Plus size={19} /></button>
      <button onClick={() => map.zoomOut()} aria-label="Afastar mapa" className="border-y border-slate-700 p-2.5 text-cyan-300 hover:bg-indigo-600 hover:text-white"><Minus size={19} /></button>
      <button onClick={() => map.setView(BRAZIL_CENTER, BRAZIL_ZOOM, { animate: true })} aria-label="Centralizar Brasil" className="p-2.5 text-cyan-300 hover:bg-indigo-600 hover:text-white"><RotateCcw size={17} /></button>
    </div>
  );
}

export default function RealTourMap({ events, mapMode, selectedState, selectedEventId, onSelectEvent, onSelectState, resetToken }) {
  const [locations, setLocations] = useState({});
  const visibleEvents = useMemo(
    () => events.filter((event) => !selectedState || event.stateId === selectedState),
    [events, selectedState],
  );

  useEffect(() => {
    let active = true;
    visibleEvents.forEach(async (event) => {
      const key = getCityCoordinateKey(event.stateId, event.city);
      if (locations[key]) return;
      const coordinates = await resolveCityLatLng(event.stateId, event.city);
      if (active && coordinates) setLocations((current) => ({ ...current, [key]: coordinates }));
    });
    return () => { active = false; };
  }, [visibleEvents, locations]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <MapContainer center={BRAZIL_CENTER} zoom={BRAZIL_ZOOM} minZoom={5} maxZoom={14} maxBounds={BRAZIL_BOUNDS} maxBoundsViscosity={0.25} dragging touchZoom doubleClickZoom zoomControl={false} attributionControl={false} scrollWheelZoom className="h-full w-full bg-[#101827]" aria-label="Mapa geográfico dos eventos">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ResetMap resetToken={resetToken} />
        <StateClickHandler onSelectState={onSelectState} />
        <MapActions />
        {visibleEvents.map((event) => {
          const key = getCityCoordinateKey(event.stateId, event.city);
          const position = locations[key] || getCityLatLng(event.stateId, event.city);
          const color = mapMode === 'tour' ? (getShowProximityColor(event.date) || '#94a3b8') : '#38bdf8';
          const selected = selectedEventId === event.id;
          return (
            <CircleMarker key={event.id} center={position} radius={selected ? 12 : 9} pathOptions={{ color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }} eventHandlers={{ click: () => onSelectEvent(event.id) }}>
              <Popup>
                <div className="min-w-40 text-sm text-slate-900"><strong>{event.city} · {event.stateId}</strong><br />{new Date(`${event.date}T12:00:00`).toLocaleDateString('pt-BR')}<br />{event.artistName && <>Artista: {event.artistName}<br /></>}Status: {getEventStatusLabel(event.status)}</div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      {mapMode === 'tour' && <MapLegend mobileBottom="bottom-[7rem]" />}
    </div>
  );
}
