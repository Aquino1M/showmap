import { CalendarDays, Map as MapIcon, Users } from 'lucide-react';
import { useState } from 'react';

export default function TourMapControls({ mapMode, setMapMode, mapDisplay, setMapDisplay, selectedArtist, setSelectedArtist, artists }) {
  const [isArtistMenuOpen, setIsArtistMenuOpen] = useState(false);

  return (
    <div className="absolute top-4 left-4 right-4 z-20 grid grid-cols-[repeat(4,minmax(0,1fr))] items-stretch gap-1.5 sm:flex sm:w-auto sm:right-auto sm:gap-2">
      <div className="min-h-14 min-w-0 bg-[#0B0F19]/90 backdrop-blur border border-slate-800 p-2 rounded-xl shadow-lg sm:p-3">
        <h4 className="mb-2 truncate text-[10px] font-bold uppercase text-slate-400">{mapMode === 'tour' ? 'Minha turnê' : 'Disponibilidade'}</h4>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${mapMode === 'tour' ? 'bg-cyan-400' : 'bg-white'}`}></span><span className="truncate text-[10px] text-white sm:text-xs">{mapMode === 'tour' ? 'Shows da turnê' : 'Datas abertas'}</span></div>
      </div>
      <button onClick={() => setMapMode((mode) => mode === 'tour' ? 'available' : 'tour')} aria-pressed={mapMode === 'tour'} className={`min-h-14 w-full rounded-xl border px-1 text-[10px] font-bold shadow-lg backdrop-blur transition-colors sm:w-auto sm:px-3 sm:text-xs ${mapMode === 'tour' ? 'border-cyan-400 bg-cyan-500 text-slate-950' : 'border-slate-700 bg-[#0B0F19]/90 text-indigo-300 hover:bg-indigo-600 hover:text-white'}`}>
        <CalendarDays size={17} className="mx-auto mb-1" />{mapMode === 'tour' ? 'Datas abertas' : 'Minha turnê'}
      </button>
      <div className="relative min-w-0 sm:w-auto">
        <button onClick={() => setIsArtistMenuOpen((open) => !open)} aria-expanded={isArtistMenuOpen} title={selectedArtist || 'Escolher artista'} className={`min-h-14 w-full rounded-xl border px-1 text-[10px] font-bold shadow-lg backdrop-blur transition-colors sm:w-auto sm:max-w-32 sm:px-3 sm:text-xs ${selectedArtist ? 'border-cyan-400 bg-cyan-500 text-slate-950' : 'border-slate-700 bg-[#0B0F19]/90 text-indigo-300 hover:bg-indigo-600 hover:text-white'}`}>
          <Users size={17} className="mx-auto mb-1" /><span className="block truncate">{selectedArtist || 'Artista'}</span>
        </button>
        {isArtistMenuOpen && <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-52 rounded-xl border border-slate-700 bg-[#0B0F19] p-2 shadow-2xl">
          <button onClick={() => { setSelectedArtist(''); setIsArtistMenuOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-300 hover:bg-slate-800">Todos os artistas</button>
          {artists.length ? artists.map((artist) => <button key={artist} onClick={() => { setSelectedArtist(artist); setMapMode('tour'); setIsArtistMenuOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-white hover:bg-indigo-600">{artist}</button>) : <p className="px-3 py-2 text-xs text-slate-400">Nenhum artista confirmado.</p>}
        </div>}
      </div>
      <button onClick={() => setMapDisplay((display) => display === 'real' ? 'svg' : 'real')} className="min-h-14 w-full rounded-xl border border-slate-700 bg-[#0B0F19]/90 px-1 text-[10px] font-bold text-indigo-300 shadow-lg backdrop-blur transition-colors hover:bg-indigo-600 hover:text-white sm:w-auto sm:px-3 sm:text-xs" title={mapDisplay === 'real' ? 'Usar mapa ilustrado' : 'Usar mapa real'}>
        <MapIcon size={17} className="mx-auto mb-1" />{mapDisplay === 'real' ? 'Mapa SVG' : 'Mapa real'}
      </button>
    </div>
  );
}
