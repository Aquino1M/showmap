import { useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { buildCommercialSuggestion, getSystemAnswer } from '../lib/commercialAdvisor';

const initialMessage = {
  role: 'assistant',
  text: 'Olá! Sou o assistente comercial do ShowMap. Posso tirar dúvidas do sistema e analisar oportunidades de roteiro com os dados do seu escritório.',
};

export default function FloatingCommercialAssistant({ events }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([initialMessage]);

  const answer = (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { role: 'user', text: trimmed }, { role: 'assistant', text: getSystemAnswer(trimmed, events) }]);
    setQuestion('');
  };

  const suggestRoute = () => {
    setMessages((current) => [...current, { role: 'assistant', text: buildCommercialSuggestion(events) }]);
  };

  return <div className="fixed bottom-6 right-6 z-[70] hidden lg:block">
    {isOpen && <section className="mb-3 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-indigo-500/40 bg-[#111827] shadow-2xl shadow-indigo-950/50">
      <header className="flex items-center justify-between border-b border-slate-800 bg-[#0B0F19] px-4 py-3">
        <div className="flex items-center gap-2"><Sparkles size={18} className="text-cyan-400" /><div><h2 className="text-sm font-bold text-white">Assistente Comercial</h2><p className="text-[10px] text-slate-400">Dados do seu escritório</p></div></div>
        <button onClick={() => setIsOpen(false)} aria-label="Fechar assistente" className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={18} /></button>
      </header>
      <div className="max-h-72 space-y-3 overflow-y-auto p-4 custom-scrollbar">
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[92%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${message.role === 'user' ? 'ml-auto bg-indigo-600 text-white' : 'bg-[#0B0F19] text-slate-300 border border-slate-800'}`}>{message.text}</div>)}
      </div>
      <div className="border-t border-slate-800 p-3">
        <button onClick={suggestRoute} className="mb-2 w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20">Analisar roteiro até 600 km</button>
        <form onSubmit={(event) => { event.preventDefault(); answer(question); }} className="flex gap-2">
          <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Digite sua dúvida" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-white outline-none focus:border-indigo-400" />
          <button type="submit" aria-label="Enviar pergunta" className="rounded-xl bg-indigo-600 p-2 text-white hover:bg-indigo-500"><Send size={16} /></button>
        </form>
      </div>
    </section>}
    <button onClick={() => setIsOpen((value) => !value)} aria-label="Abrir assistente comercial" className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/50 bg-indigo-600 text-white shadow-xl shadow-indigo-950/70 transition-transform hover:scale-105">
      <MessageCircle size={24} />
    </button>
  </div>;
}
