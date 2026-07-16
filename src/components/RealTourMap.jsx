import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { getCityCoordinateKey, getCityLatLng, resolveCityLatLng } from '../lib/map';
import { getEventStatusLabel, getShowProximityColor } from '../lib/tour';

const BRAZIL_CENTER = [-14.235, -51.925];
const BRAZIL_ZOOM = 5;
const BRAZIL_BOUNDS = [[-34.2, -74.2], [5.7, -34.2]];

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
    <div className="absolute bottom-4 left-4 z-[500] flex flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#0B0F19]/95 shadow-lg">
      <button onClick={() => map.zoomIn()} aria-label="Aproximar mapa" className="p-2.5 text-cyan-300 hover:bg-indigo-600 hover:text-white"><Plus size={19} /></button>
      <button onClick={() => map.zoomOut()} aria-label="Afastar mapa" className="border-y border-slate-700 p-2.5 text-cyan-300 hover:bg-indigo-600 hover:text-white"><Minus size={19} /></button>
      <button onClick={() => map.setView(BRAZIL_CENTER, BRAZIL_ZOOM, { animate: true })} aria-label="Centralizar Brasil" className="p-2.5 text-cyan-300 hover:bg-indigo-600 hover:text-white"><RotateCcw size={17} /></button>
    </div>
  );
}

function MapLegend() {
  return (
    <div className="pointer-events-none absolute bottom-20 right-3 z-[500] rounded-xl border border-slate-700 bg-[#0B0F19]/95 px-3 py-2.5 text-[10px] text-slate-200 shadow-xl backdrop-blur sm:bottom-4 sm:right-4">
      <p className="mb-1.5 font-bold uppercase tracking-wide text-cyan-300">Índice da agenda</p>
      <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Hoje até 2 meses</p>
      <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" />De 3 a 4 meses</p>
      <p className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />De 5 a 6 meses</p>
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
      <MapContainer center={BRAZIL_CENTER} zoom={BRAZIL_ZOOM} minZoom={5} maxZoom={14} maxBounds={BRAZIL_BOUNDS} maxBoundsViscosity={1} zoomControl={false} scrollWheelZoom className="h-full w-full bg-[#101827]" aria-label="Mapa geográfico dos eventos">
        <TileLayer attribution='&copy; OpenStreetMap contributors &copy; CARTO' url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png" />
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
      {mapMode === 'tour' && <MapLegend />}
    </div>
  );
}
