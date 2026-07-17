import { lazy, Suspense } from 'react';

const App = lazy(() => import('../App.jsx'));

const loading = <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-slate-100"><section className="rounded-2xl border border-indigo-500/30 bg-slate-900 px-7 py-6 text-center shadow-2xl"><h1 className="text-2xl font-extrabold">ShowMap</h1><p className="mt-2 text-sm text-slate-400">Carregando seu painel…</p></section></main>;

export default function AppLoader() {
  return <Suspense fallback={loading}><App /></Suspense>;
}
