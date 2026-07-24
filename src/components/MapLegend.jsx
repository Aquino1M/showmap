export default function MapLegend({ mobileBottom = 'bottom-[7.5rem]' }) {
  return (
    <div className={`pointer-events-none absolute ${mobileBottom} left-1/2 z-[1000] flex w-[248px] max-w-[calc(100%-2rem)] -translate-x-1/2 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-[#0B0F19]/95 px-3 py-2.5 text-[9px] text-slate-200 shadow-xl backdrop-blur sm:bottom-4 sm:left-auto sm:right-4 sm:block sm:w-auto sm:max-w-none sm:translate-x-0 sm:text-[10px]`}>
      <p className="hidden sm:mb-1.5 sm:block sm:font-bold sm:uppercase sm:tracking-wide sm:text-cyan-300">Índice da agenda</p>
      <p className="flex items-center gap-1.5 whitespace-nowrap"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Até 2 meses</p>
      <p className="flex items-center gap-1.5 whitespace-nowrap"><span className="h-2.5 w-2.5 rounded-full bg-orange-500" />3 a 4 meses</p>
      <p className="flex items-center gap-1.5 whitespace-nowrap"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />5 a 6 meses</p>
    </div>
  );
}
