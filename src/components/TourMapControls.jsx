import { CalendarDays, Map as MapIcon, Users } from 'lucide-react';
import { useState } from 'react';

export default function TourMapControls({ mapMode, setMapMode, mapDisplay, setMapDisplay, selectedArtist, setSelectedArtist, artists }) {
  const [isArtistMenuOpen, setIsArtistMenuOpen] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-20 flex max-w-[calc(100%-2rem)] flex-wrap items-start gap-2 pr-14 sm:max-w-none sm:pr-0">
      <div className="bg-[#0B0F19]/90 backdrop-blur border border-slate-800 p-3 rounded-xl shadow-lg">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">{mapMode === 'tour' ? 'Minha turnê' : 'Disponibilidade'}</h4>
        <div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${mapMode === 'tour' ? 'bg-cyan-400' : 'bg-white'}`}></span><span className="text-xs text-white">{mapMode === 'tour' ? 'Shows da turnê' : 'Datas abertas'}</span></div>
      </div>
      <button onClick={() => setMapMode((mode) => mode === 'tour' ? 'available' : 'tour')} aria-pressed={mapMode === 'tour'} className={`min-h-14 rounded-xl border px-3 text-xs font-bold shadow-lg backdrop-blur transition-colors ${mapMode === 'tour' ? 'border-cyan-400 bg-cyan-500 text-slate-950' : 'border-slate-700 bg-[#0B0F19]/90 text-indigo-300 hover:bg-indigo-600 hover:text-white'}`}>
        <CalendarDays size={17} className="mx-auto mb-1" />{mapMode === 'tour' ? 'Datas abertas' : 'Minha turnê'}
      </button>
      <div className="relative">
        <button onClick={() => setIsArtistMenuOpen((open) => !open)} aria-expanded={isArtistMenuOpen} title={selectedArtist || 'Escolher artista'} className={`min-h-14 max-w-32 rounded-xl border px-3 text-xs font-bold shadow-lg backdrop-blur transition-colors ${selectedArtist ? 'border-cyan-400 bg-cyan-500 text-slate-950' : 'border-slate-700 bg-[#0B0F19]/90 text-indigo-300 hover:bg-indigo-600 hover:text-white'}`}>
          <Users size={17} className="mx-auto mb-1" /><span className="block truncate">{selectedArtist || 'Artista'}</span>
        </button>
        {isArtistMenuOpen && <div className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-52 rounded-xl border border-slate-700 bg-[#0B0F19] p-2 shadow-2xl">
          <button onClick={() => { setSelectedArtist(''); setIsArtistMenuOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-slate-300 hover:bg-slate-800">Todos os artistas</button>
          {artists.length ? artists.map((artist) => <button key={artist} onClick={() => { setSelectedArtist(artist); setMapMode('tour'); setIsArtistMenuOpen(false); }} className="w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-white hover:bg-indigo-600">{artist}</button>) : <p className="px-3 py-2 text-xs text-slate-400">Nenhum artista confirmado.</p>}
        </div>}
      </div>
      <button onClick={() => setMapDisplay((display) => display === 'real' ? 'svg' : 'real')} className="min-h-14 rounded-xl border border-slate-700 bg-[#0B0F19]/90 px-3 text-xs font-bold text-indigo-300 shadow-lg backdrop-blur transition-colors hover:bg-indigo-600 hover:text-white" title={mapDisplay === 'real' ? 'Usar mapa ilustrado' : 'Usar mapa real'}>
        <MapIcon size={17} className="mx-auto mb-1" />{mapDisplay === 'real' ? 'Mapa SVG' : 'Mapa real'}
      </button>
    </div>
  );
}
