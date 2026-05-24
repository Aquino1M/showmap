import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  DollarSign, 
  ChevronDown,
  Video,
  Tv,
  Smartphone,
  Trophy,
  Target,
  Award,
  Users
} from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-purple-500/30">
      {/* Garantindo que o scroll suave funcione nos links âncora da página */}
      <style dangerouslySetInnerHTML={{__html: `html { scroll-behavior: smooth; }`}} />
      <Navbar />
      <main>
        <HeroSection />
        <SocialProof />
        <IncomeSection />
        <FeaturesSection />
        <CourseModules />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}

// ==========================================
// 1. BARRA DE NAVEGAÇÃO (HEADER)
// ==========================================
function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
          <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center font-bold text-white">
            MCM
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:block">Método Corte Milionário</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#ganhos" className="hover:text-white transition-colors">Potencial</a>
          <a href="#modulos" className="hover:text-white transition-colors">Módulos</a>
          <a href="#planos" className="hover:text-white transition-colors">Planos</a>
        </div>

        <a 
          href="#planos" 
          className="bg-white text-slate-950 px-5 py-2 rounded-full text-sm font-bold hover:bg-slate-200 transition-colors"
        >
          Garantir Vaga
        </a>
      </div>
    </nav>
  );
}

// ==========================================
// 2. SEÇÃO PRINCIPAL (HERO)
// ==========================================
function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="text-center lg:text-left">
            {/* ... existing text content ... */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              Vagas Abertas - Método Corte Milionário
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Transforme vídeos em uma <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">máquina de vendas.</span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto lg:mx-0">
              Aprenda a editar, viralizar e monetizar cortes sem precisar aparecer. Do zero ao nível de agência com clientes e patrocínios.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <a 
                href="#planos" 
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] text-center flex items-center justify-center gap-2"
              >
                Começar Agora
                <TrendingUp className="w-5 h-5" />
              </a>
              <a 
                href="#modulos" 
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg border border-white/10 hover:bg-white/5 transition-colors text-center flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Ver Módulos
              </a>
            </div>
          </div>

          {}
          <div className="relative mx-auto w-full max-w-md lg:max-w-full mt-10 lg:mt-0">
            <div className="aspect-video bg-slate-900 rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl flex items-center justify-center group">
               {/* 
                 AQUI VOCÊ COLOCA O ID DO SEU VÍDEO NÃO LISTADO.
                 Pegue o link do youtube, ex: https://www.youtube.com/watch?v=SEU_ID_AQUI
                 E substitua o 'SEU_ID_AQUI' abaixo.
               */}
               <iframe 
                 className="absolute inset-0 w-full h-full"
                 src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1" 
                 title="YouTube video player" 
                 frameBorder="0" 
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                 allowFullScreen
               ></iframe>
            </div>
            
            {/* ETIQUETA FLUTUANTE */}
            <div className="absolute -right-6 top-10 bg-[#1e2330] border border-white/5 p-4 rounded-2xl shadow-xl hidden md:block animate-bounce" style={{animationDuration: '3s', zIndex: 20}}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Ganho com Cortes</p>
                  <p className="font-bold text-white">R$ 147,00</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ==========================================
// 3. PROVA SOCIAL (LOGOS)
// ==========================================
function SocialProof() {
  return (
    <section className="py-10 border-y border-white/5 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <p className="text-sm font-medium text-slate-500 mb-6 uppercase tracking-widest">Domine as plataformas que mais pagam</p>
        <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex items-center gap-2 text-2xl font-bold cursor-default hover:text-white transition-colors"><Smartphone className="w-8 h-8" /> TikTok</div>
          <div className="flex items-center gap-2 text-2xl font-bold cursor-default hover:text-white transition-colors"><Video className="w-8 h-8" /> Reels</div>
          <div className="flex items-center gap-2 text-2xl font-bold cursor-default hover:text-white transition-colors"><Tv className="w-8 h-8" /> Shorts</div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 4. POTENCIAL DE GANHOS (PAINEL)
// ==========================================
function IncomeSection() {
  const levels = [
    {
      title: "Nível Iniciante",
      income: "R$ 1.700",
      period: "/mês",
      desc: "Fazendo edição básica, postando e conseguindo os primeiros resultados monetizados ou primeiros clientes locais.",
      icon: <Target className="w-8 h-8 text-blue-400" />,
      color: "from-blue-500/20 to-transparent border-blue-500/30"
    },
    {
      title: "Nível Intermediário",
      income: "R$ 6.500",
      period: "/mês",
      desc: "Dominando crescimento, criando páginas virais e aplicando estratégia de volume para bater milhões de views.",
      icon: <TrendingUp className="w-8 h-8 text-purple-400" />,
      color: "from-purple-500/20 to-transparent border-purple-500/30",
      featured: true
    },
    {
      title: "Nível Profissional",
      income: "R$ 12.000+",
      period: "/mês",
      desc: "Atuando como agência, montando equipe, atendendo grandes influencers e podcasts com contratos de recorrência.",
      icon: <Trophy className="w-8 h-8 text-yellow-400" />,
      color: "from-yellow-500/20 to-transparent border-yellow-500/30"
    }
  ];

  return (
    <section id="ganhos" className="py-24 relative bg-slate-900/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Qual a renda média de um Clipador?</h2>
          <p className="text-slate-400 text-lg">Este é o painel real de evolução financeira dos nossos alunos que aplicam o Método Corte Milionário à risca.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {levels.map((level, i) => (
            <div key={i} className={`relative bg-slate-900 border ${level.color} p-8 rounded-3xl overflow-hidden hover:-translate-y-2 transition-transform duration-300 ${level.featured ? 'transform md:-translate-y-4 shadow-2xl shadow-purple-900/20' : ''}`}>
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${level.color} blur-3xl opacity-50`}></div>
              <div className="mb-6">{level.icon}</div>
              <h3 className="text-xl font-bold text-slate-300 mb-2">{level.title}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black text-white">{level.income}</span>
                <span className="text-slate-500 font-medium">{level.period}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{level.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 5. SEÇÃO DE BENEFÍCIOS (FEATURES GRID)
// ==========================================
function FeaturesSection() {
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Edição de Alta Retenção",
      description: "Aprenda os cortes exatos, zoom in/out e transições que prendem a atenção do usuário nos primeiros 3 segundos."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
      title: "Algoritmo a seu favor",
      description: "Entenda como funcionam as métricas de entrega e faça seus vídeos chegarem a milhões de visualizações organicamente."
    },
    {
      icon: <DollarSign className="w-6 h-6 text-purple-400" />,
      title: "Monetização Rápida",
      description: "Não espere anos. Descubra como vender como afiliado ou ativar a monetização das plataformas em tempo recorde."
    }
  ];

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-slate-900/50 border border-white/5 p-8 rounded-3xl hover:bg-slate-800/80 transition-colors cursor-default">
              <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 6. GRADE CURRICULAR (MÓDULOS)
// ==========================================
function CourseModules() {
  return (
    <section id="modulos" className="py-24 bg-slate-950 border-t border-white/5 relative scroll-m-10">
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
      
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">O que você vai aprender</h2>
          <p className="text-slate-400">A mesma estrutura em vídeo para todos, com evolução no nível de acompanhamento e bônus.</p>
        </div>

        <div className="space-y-6">
          {/* FASE 1 */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 font-bold text-xl shrink-0">1</div>
              <div>
                <h3 className="text-2xl font-bold">Conteúdo Base (Iniciante)</h3>
                <p className="text-slate-400 text-sm mt-1">15 Aulas focadas em te fazer aprender edição, postar e gerar os primeiros resultados.</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-slate-300">
              <p><strong className="text-white">Módulo 0 (1 aula):</strong> Boas-vindas e Acesso ao Real Oficial</p>
              <p><strong className="text-white">Módulo 1 (1 aula):</strong> Mentalidade do Mercado</p>
              <p><strong className="text-white">Módulo 2 (2 aulas):</strong> Estrutura do Corte Viral</p>
              <p><strong className="text-white">Módulo 3 (4 aulas):</strong> Edição Profissional (CapCut e Real Oficial)</p>
              <p><strong className="text-white">Módulo 4 (3 aulas):</strong> Como Encontrar Conteúdo</p>
              <p><strong className="text-white">Módulo 5 (2 aulas):</strong> Postagem (Horários e Algoritmo)</p>
              <p><strong className="text-white">Módulo 6 (1 aula):</strong> Monetização e Primeiros Clientes</p>
              <p><strong className="text-white">Módulo 7 (1 aula):</strong> Plano de Ação de 30 Dias</p>
            </div>
          </div>

          {/* FASE 2 */}
          <div className="bg-slate-900/80 border border-purple-500/30 rounded-2xl p-6 md:p-8 relative overflow-hidden hover:border-purple-500/50 transition-colors">
            <div className="absolute top-0 right-0 bg-purple-500/20 text-purple-300 px-4 py-1 rounded-bl-xl text-xs font-bold">INCLUSO NO INTERMEDIÁRIO</div>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 font-bold text-xl shrink-0">2</div>
              <div>
                <h3 className="text-2xl font-bold mt-4 sm:mt-0">Aceleração (Intermediário)</h3>
                <p className="text-slate-400 text-sm mt-1">Tudo da Fase 1 + 4 Aulas Extras + Mentoria Coletiva Semanal (Total: 19 aulas).</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-slate-300">
              <p><strong className="text-white">Módulo Extra 1 (2 aulas):</strong> Análise de Cortes (Retenção, comentários e compartilhamentos)</p>
              <p><strong className="text-white">Módulo Extra 2 (2 aulas):</strong> Crescimento, Páginas Virais e Estratégia de Volume</p>
              <p><strong className="text-white">Ao Vivo:</strong> Mentorias Coletivas (1x por semana Zoom/Meet)</p>
            </div>
          </div>

          {/* FASE 3 */}
          <div className="bg-slate-900/80 border border-yellow-500/30 rounded-2xl p-6 md:p-8 relative overflow-hidden hover:border-yellow-500/50 transition-colors">
            <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-300 px-4 py-1 rounded-bl-xl text-xs font-bold">INCLUSO NO PROFISSIONAL</div>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-400 font-bold text-xl shrink-0">3</div>
              <div>
                <h3 className="text-2xl font-bold mt-4 sm:mt-0">Agência (Profissional)</h3>
                <p className="text-slate-400 text-sm mt-1">Tudo da Fase 1 e 2 + 4 Aulas de Escala + Assessoria Individualizada (Total: 23 aulas).</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-slate-300">
              <p><strong className="text-white">Módulo Extra 1 (2 aulas):</strong> Escala Profissional (Equipe e Agência)</p>
              <p><strong className="text-white">Módulo Extra 2 (2 aulas):</strong> Operação Profissional (Contratos e Recorrência)</p>
              <p><strong className="text-white">VIP:</strong> Assessoria Individualizada (1 Encontro por semana)</p>
              <p><strong className="text-white">Network:</strong> Grupo Fechado de Alunos + Indicação para Clientes</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

// ==========================================
// 7. SEÇÃO DE PREÇOS (3 PLANOS)
// ==========================================
function PricingSection() {
  return (
    <section id="planos" className="py-24 relative overflow-hidden bg-slate-900/30 scroll-m-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Escolha o seu nível de acompanhamento</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">O conteúdo em vídeo é a base. O que muda de um plano para o outro é a proximidade, network, correção de erros e ferramentas extras.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          
          {/* PLANO INICIANTE */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 flex flex-col relative hover:border-slate-600 transition-colors">
            <h3 className="text-xl font-bold text-slate-300 mb-2">Iniciante</h3>
            <p className="text-sm text-slate-500 mb-6 h-10">Para quem quer aprender edição do zero e conseguir os primeiros resultados.</p>
            <div className="mb-8">
              <span className="text-4xl font-black text-white">R$ 115</span><span className="text-slate-400">,00</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                <span>Acesso Imediato a 15 Aulas Gravadas</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                <span>7 Módulos (Mentalidade até Monetização)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                <span>Edição Descomplicada (CapCut e Real Oficial)</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-500 shrink-0" />
                <span><strong className="text-white">Bônus:</strong> 1 mês grátis do Plano Lite do Real Oficial</span>
              </li>
            </ul>
            
            {}
            {/* AQUI: SUBSTITUA "#LINK_CHECKOUT_INICIANTE" PELO SEU LINK DE VENDAS */}
            <a 
              href="#LINK_CHECKOUT_INICIANTE" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full block text-center bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-700 transition-colors"
            >
              Assinar Iniciante
            </a>
          </div>

          {/* PLANO INTERMEDIÁRIO (DESTAQUE) */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-purple-500 rounded-3xl p-8 flex flex-col relative transform lg:-translate-y-4 shadow-2xl shadow-purple-900/20">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              Mais Escolhido
            </div>
            <h3 className="text-2xl font-bold text-purple-400 mb-2">Intermediário</h3>
            <p className="text-sm text-slate-400 mb-6 h-10">Aceleração com mentorias coletivas, análise de cortes e ferramentas extras.</p>
            <div className="mb-8">
              <span className="text-5xl font-black text-white">R$ 179</span><span className="text-slate-400">,90</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-300">
              <li className="flex items-start gap-3 font-semibold text-white">
                <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
                <span>Tudo do plano Iniciante + 4 Aulas (Total 19 Aulas)</span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-500 shrink-0" />
                <span>Mentoria Coletiva (1x por semana via Zoom)</span>
              </li>
              <li className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-purple-500 shrink-0" />
                <span>Acesso a Campeonatos de Cortes (Prêmios em $)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
                <span>Módulos Extras: Análise e Crescimento de Páginas</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-purple-500 shrink-0" />
                <span><strong className="text-white">Bônus:</strong> 1 mês grátis do Plano Creator do Real Oficial</span>
              </li>
            </ul>
            
            {}
            {/* AQUI: SUBSTITUA "#LINK_CHECKOUT_INTERMEDIARIO" PELO SEU LINK DE VENDAS */}
            <a 
              href="#LINK_CHECKOUT_INTERMEDIARIO" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full block text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-xl font-bold hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-purple-500/25"
            >
              Assinar Intermediário
            </a>
          </div>

          {/* PLANO PROFISSIONAL */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 flex flex-col relative hover:border-yellow-500/50 transition-colors">
            <h3 className="text-xl font-bold text-yellow-500 mb-2">Profissional</h3>
            <p className="text-sm text-slate-500 mb-6 h-10">Proximidade total. Assessoria, network exclusivo e estrutura de agência.</p>
            <div className="mb-8">
              <span className="text-4xl font-black text-white">R$ 219</span><span className="text-slate-400">,90</span>
            </div>
            
            <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-300">
              <li className="flex items-start gap-3 font-semibold text-white">
                <CheckCircle2 className="w-5 h-5 text-yellow-500 shrink-0" />
                <span>Tudo do plano Intermediário (Total 23 Aulas)</span>
              </li>
              <li className="flex items-start gap-3">
                <Award className="w-5 h-5 text-yellow-500 shrink-0" />
                <span>Assessoria Individual (1 encontro por semana)</span>
              </li>
              <li className="flex items-start gap-3">
                <Users className="w-5 h-5 text-yellow-500 shrink-0" />
                <span>Acesso ao Grupo Fechado de Alunos para Network</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-500 shrink-0" />
                <span>Indicação de Clientes e Parcerias com Podcasts</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-yellow-500 shrink-0" />
                <span>Módulo Agência: Contratos, Equipe e Recorrência</span>
              </li>
              <li className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
                <span><strong className="text-white">Bônus:</strong> 1 mês grátis do Plano Viral do Real Oficial</span>
              </li>
            </ul>
            
            {}
            {/* AQUI: SUBSTITUA "#LINK_CHECKOUT_PROFISSIONAL" PELO SEU LINK DE VENDAS */}
            <a 
              href="#LINK_CHECKOUT_PROFISSIONAL" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full block text-center bg-slate-800 text-white py-4 rounded-xl font-bold hover:bg-slate-700 transition-colors border border-yellow-500/30"
            >
              Assinar Profissional
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}

// ==========================================
// 8. SEÇÃO DE PERGUNTAS FREQUENTES (FAQ)
// ==========================================
function FAQSection() {
  const faqs = [
    {
      question: "O conteúdo das aulas em vídeo é diferente em cada plano?",
      answer: "A base de ensino e a qualidade do conteúdo gravado é a mesma! O que muda é a quantidade de módulos extras estratégicos e o nível de acompanhamento (mentorias em grupo x assessoria individual) e os bônus de network."
    },
    {
      question: "Preciso ter um computador bom?",
      answer: "Não! O Módulo 3 é dedicado 100% à edição profissional usando apenas o seu celular com aplicativos gratuitos como o CapCut e o próprio editor do Real Oficial."
    },
    {
      question: "O que é o Real Oficial?",
      answer: "O Real Oficial é uma ferramenta de IA 100% brasileira que transforma vídeos longos em cortes curtos e dinâmicos para TikTok, Instagram Reels e YouTube Shorts. Nossa IA analisa 18 parâmetros para identificar os momentos mais impactantes. A plataforma conta com: Monitoramento de lives, Geração de voz com IA, Postagem automática, Hooks/B-rolls premium e mais de 15 outras features. Ela também possui um Editor Profissional estilo CapCut (que inclusive usamos e ensinamos no curso!). O Real Oficial possui parceria exclusiva com o Método Corte Milionário."
    },
    {
      question: "Como funcionam os campeonatos de cortes dos planos Intermediário e Profissional?",
      answer: "Temos parcerias com grandes podcasts do Brasil. Mensalmente, abrimos campeonatos internos onde os melhores cortes avaliados pela nossa equipe ganham premiações em dinheiro."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-slate-900/30">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-12">Dúvidas Frequentes</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden bg-slate-900/50 hover:border-white/20 transition-colors">
      <button 
        className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-lg pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-purple-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div 
        className={`px-6 text-slate-400 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-48 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        {answer}
      </div>
    </div>
  );
}

// ==========================================
// 9. RODAPÉ (FOOTER)
// ==========================================
function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-500 text-sm">
        <div className="text-center md:text-left">
          <span className="font-bold text-white text-lg tracking-tight">Método Corte Milionário</span>
          <p className="mt-2">O método definitivo para dominar o algoritmo.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6">
          <a href="#termos" className="hover:text-purple-400 transition-colors">Termos de Uso</a>
          <a href="#privacidade" className="hover:text-purple-400 transition-colors">Políticas de Privacidade</a>
          <a href="#contato" className="hover:text-purple-400 transition-colors">Contato</a>
        </div>
        
        <div className="text-center md:text-right">
          &copy; {new Date().getFullYear()} Método Corte Milionário.<br className="md:hidden" /> Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}