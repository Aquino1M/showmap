import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Erro inesperado na interface do ShowMap:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-slate-950 px-6 text-slate-100 grid place-items-center">
        <section className="max-w-lg rounded-2xl border border-red-500/30 bg-slate-900 p-8 text-center shadow-2xl">
          <h1 className="text-2xl font-extrabold text-white">Não foi possível abrir o painel</h1>
          <p className="mt-3 text-slate-300">O erro foi registrado no console do navegador. Atualize a página para tentar novamente.</p>
          <button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-500">Atualizar página</button>
        </section>
      </main>
    );
  }
}
