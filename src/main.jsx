import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { isSupabaseConfigured } from './supabase.js'
import AppErrorBoundary from './components/AppErrorBoundary.jsx'

const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <AppErrorBoundary>{isSupabaseConfigured ? <App /> : (
      <main className="min-h-screen bg-slate-950 px-6 text-slate-100 grid place-items-center">
        <section className="max-w-lg rounded-2xl border border-indigo-500/30 bg-slate-900 p-8 text-center shadow-2xl">
          <h1 className="text-3xl font-extrabold text-white">ShowMap</h1>
          <p className="mt-4 text-slate-300">A configuração do Supabase ainda não foi adicionada ao ambiente de publicação.</p>
          <p className="mt-3 text-sm text-slate-400">Cadastre VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY na Vercel e faça um novo deploy.</p>
        </section>
      </main>
    )}</AppErrorBoundary>
  </StrictMode>,
)
