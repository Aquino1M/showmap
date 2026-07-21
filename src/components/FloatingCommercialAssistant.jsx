import { useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { getLocalKnowledgeAnswer, LOCAL_ASSISTANT_QUESTIONS } from '../lib/commercialAdvisor';
import { askCommercialAssistant } from '../firebase';

const initialMessage = {
  role: 'assistant',
  text: 'Olá! Sou o assistente comercial do ShowMap. Posso tirar dúvidas do sistema e analisar oportunidades de roteiro com os dados do seu escritório.',
};

const humanizeAssistantText = (text) => String(text || '')
  .replace(/\*\*/g, '')
  .replace(/`/g, '')
  .replace(/^\s*[-*]\s+/gm, '• ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export default function FloatingCommercialAssistant({ events, onOpenChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [areQuickQuestionsOpen, setAreQuickQuestionsOpen] = useState(false);

  const answer = async (text, localOnly = false) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setQuestion('');
    if (localOnly) {
      setMessages((current) => [...current, { role: 'assistant', text: humanizeAssistantText(getLocalKnowledgeAnswer(trimmed, events)) }]);
      setAreQuickQuestionsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await askCommercialAssistant(trimmed);
      if (!response || typeof response !== 'string') throw new Error('A IA não retornou uma resposta. Verifique o crédito e o modelo configurado no OpenRouter.');
      setMessages((current) => [...current, { role: 'assistant', text: humanizeAssistantText(response) }]);
    } catch (error) {
      const fallback = getLocalKnowledgeAnswer(trimmed, events);
      const message = error instanceof Error ? error.message : 'Não foi possível consultar a IA agora.';
      setMessages((current) => [...current, { role: 'assistant', text: humanizeAssistantText(`${message}\n\nResposta local: ${fallback}`) }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestRoute = () => answer('Analise meu próximo roteiro em até 600 km, priorizando o dia anterior e o posterior aos shows confirmados.');

  const toggleAssistant = () => {
    setIsOpen((open) => {
      const nextOpen = !open;
      onOpenChange?.(nextOpen);
      return nextOpen;
    });
  };

  const closeAssistant = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  return <div className="fixed bottom-6 right-6 z-[70] block">
    {isOpen && <section className="mb-3 flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-indigo-500/40 bg-[#111827] shadow-2xl shadow-indigo-950/50">
      <header className="flex items-center justify-between border-b border-slate-800 bg-[#0B0F19] px-4 py-3">
        <div className="flex items-center gap-2"><Sparkles size={18} className="text-cyan-400" /><div><h2 className="text-sm font-bold text-white">Assistente Comercial</h2><p className="text-[10px] text-slate-400">Dados do seu escritório</p></div></div>
        <button onClick={closeAssistant} aria-label="Fechar assistente" className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={18} /></button>
      </header>
      <div onWheel={(event) => { event.preventDefault(); event.stopPropagation(); event.currentTarget.scrollTop += event.deltaY; }} className="max-h-72 space-y-3 overflow-y-auto overscroll-contain p-4 custom-scrollbar">
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`whitespace-pre-line max-w-[92%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${message.role === 'user' ? 'ml-auto bg-indigo-600 text-white' : 'bg-[#0B0F19] text-slate-300 border border-slate-800'}`}>{message.text}</div>)}
        {isLoading && <div className="w-fit rounded-2xl border border-slate-800 bg-[#0B0F19] px-3 py-2 text-xs text-slate-400">Analisando os dados do escritório…</div>}
      </div>
      <div className="border-t border-slate-800 p-3">
        <button disabled={isLoading} onClick={suggestRoute} className="mb-2 w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50">Analisar roteiro até 600 km</button>
        <button disabled={isLoading} onClick={() => setAreQuickQuestionsOpen((open) => !open)} className="mb-2 w-full rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs font-bold text-slate-200 hover:border-indigo-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50">{areQuickQuestionsOpen ? 'Fechar perguntas prontas' : 'Perguntas prontas'}</button>
        {areQuickQuestionsOpen && <div className="mb-2 grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-[#0B0F19] p-2">
          {LOCAL_ASSISTANT_QUESTIONS.map((suggestion) => <button disabled={isLoading} key={suggestion} onClick={() => answer(suggestion, true)} className="rounded-lg border border-slate-700 bg-[#111827] px-2 py-2 text-left text-[10px] text-slate-300 hover:border-indigo-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50">{suggestion}</button>)}
        </div>}
        <form onSubmit={(event) => { event.preventDefault(); answer(question); }} className="flex gap-2">
          <input disabled={isLoading} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Digite sua dúvida" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-white outline-none focus:border-indigo-400 disabled:opacity-50" />
          <button disabled={isLoading} type="submit" aria-label="Enviar pergunta" className="rounded-xl bg-indigo-600 p-2 text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"><Send size={16} /></button>
        </form>
      </div>
    </section>}
    <button onClick={toggleAssistant} aria-label="Abrir assistente comercial" className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/50 bg-indigo-600 text-white shadow-xl shadow-indigo-950/70 transition-transform hover:scale-105">
      <MessageCircle size={24} />
    </button>
  </div>;
}
