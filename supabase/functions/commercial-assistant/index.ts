import { createClient } from 'jsr:@supabase/supabase-js@2'

const allowedOrigins = new Set([
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'https://showmap.vercel.app',
  ...(Deno.env.get('SHOWMAP_ALLOWED_ORIGINS') || '').split(',').map((origin) => origin.trim()).filter(Boolean),
])

const getCorsHeaders = (request: Request) => {
  const origin = request.headers.get('origin')
  if (origin && !allowedOrigins.has(origin)) return null
  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

type EventRow = {
  id: string
  city: string
  state_id: string
  date: string
  time: string | null
  type: string
  status: string
  contractor_name: string | null
  event_name: string | null
  artist_name: string | null
  agent_id: string | null
  is_recurring: boolean
}

type ProfileRow = {
  id: string
  name: string
  role: string
}

const toAiEvent = (event: EventRow, agents: Map<string, string>) => ({
  cidade: event.city,
  uf: event.state_id,
  data: event.date,
  horario: event.time || 'sem horário',
  tipo: event.type,
  status: event.status,
  contratante: event.contractor_name || 'sem contratante',
  evento: event.event_name || '',
  artista: event.artist_name || '',
  agente: event.agent_id ? (agents.get(event.agent_id) || 'atribuído') : 'não atribuído',
  recorrente_anual: event.is_recurring,
})

const normalizeQuestion = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

// Perguntas sobre roteiro, datas, cidades e agenda NUNCA devem usar cache
const isReusableQuestion = (question: string) => {
  const normalized = normalizeQuestion(question)
  // Se menciona cidade, data, roteiro, dia, agenda → sempre consultar dados frescos
  if (/\b(roteiro|rota|dia|data|antes|depois|proximo|proxima|agenda|cidade|km|quilometro)\b/.test(normalized)) return false
  // Apenas perguntas genéricas sobre o sistema podem ser cacheadas
  return /\b(como|o que|funciona|cadastro|calendario|mapa|plano|financeiro)\b/.test(normalized)
}

Deno.serve(async (request) => {
  const corsHeaders = getCorsHeaders(request)
  if (!corsHeaders) return Response.json({ error: 'Origem não autorizada.' }, { status: 403 })
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    if (!supabaseUrl || !serviceRoleKey || !openRouterKey) throw new Error('Assistente comercial ainda não está configurado.')

    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) throw new Error('Sessão não informada.')

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: authData, error: authError } = await admin.auth.getUser(token)
    if (authError || !authData.user) throw new Error('Sessão inválida.')

    const body = await request.json() as { question?: string }
    const question = String(body.question || '').trim()
    if (!question || question.length > 800) throw new Error('Envie uma pergunta de até 800 caracteres.')
    const normalizedQuestion = normalizeQuestion(question)

    const { data: caller, error: callerError } = await admin
      .from('profiles')
      .select('role, company_id')
      .eq('id', authData.user.id)
      .single()
    if (callerError || !caller?.company_id || caller.role !== 'company_admin') {
      throw new Error('O Assistente Comercial está disponível somente para o escritório.')
    }

    const { data: company, error: companyError } = await admin
      .from('companies')
      .select('name, active, plan, plan_expires_at')
      .eq('id', caller.company_id)
      .single()
    if (companyError || !company?.active) throw new Error('Escritório sem acesso ativo.')
    if (company.plan_expires_at && new Date(`${company.plan_expires_at}T23:59:59`) < new Date()) {
      throw new Error('Plano vencido. Fale com o administrador para renovar.')
    }

    if (isReusableQuestion(normalizedQuestion)) {
      const { data: rememberedAnswer } = await admin
        .from('assistant_knowledge')
        .select('answer')
        .eq('company_id', caller.company_id)
        .eq('normalized_question', normalizedQuestion)
        .eq('reusable', true)
        .maybeSingle()
      if (rememberedAnswer?.answer) {
        await admin.from('assistant_knowledge')
          .update({ updated_at: new Date().toISOString() })
          .eq('company_id', caller.company_id)
          .eq('normalized_question', normalizedQuestion)
        return Response.json({ answer: rememberedAnswer.answer, source: 'memory' }, { headers: corsHeaders })
      }
    }

    // Buscar TODOS os eventos do escritório (sem limite artificial)
    const { data: events, error: eventsError } = await admin
      .from('events')
      .select('id, city, state_id, date, time, type, status, contractor_name, event_name, artist_name, agent_id, is_recurring')
      .eq('company_id', caller.company_id)
      .order('date', { ascending: true })
    if (eventsError) throw eventsError

    // Buscar agentes do escritório para identificar nomes
    const { data: agents } = await admin
      .from('profiles')
      .select('id, name, role')
      .eq('company_id', caller.company_id)
    const agentMap = new Map<string, string>()
    ;(agents || []).forEach((a: ProfileRow) => agentMap.set(a.id, a.name))

    const context = JSON.stringify((events || []).map((e: EventRow) => toAiEvent(e, agentMap)))
    const today = new Date().toISOString().slice(0, 10)
    const totalEvents = (events || []).length

    const systemPrompt = `Você é o Assistente Comercial do ShowMap para o escritório "${company.name}".

REGRAS DE COMPORTAMENTO:
• Fale em português do Brasil, de forma natural, amigável e direta.
• Use frases curtas. Explique a conclusão antes dos detalhes.
• Não use Markdown, asteriscos, títulos técnicos, tabelas, JSON.
• Se precisar listar, use no máximo 5 itens com o símbolo •.
• Não invente dados. Se não encontrar nos dados, diga "não encontrei nos registros".
• Não mostre e-mail, telefone, senha ou dados pessoais.
• Você não pode criar, reservar, vender, excluir ou alterar registros: apenas sugere.

HOJE É: ${today}

GLOSSÁRIO DE STATUS:
• "Vendido" ou "Confirmado" = show FECHADO, data ocupada, já tem contrato
• "Reservado" ou "Agendado" = data reservada, quase fechada
• "Proposta" = em negociação, agente trabalhando
• "Cadastro" = oportunidade importada, ainda não trabalhada (data LIVRE para roteiro)
• "Disponível" = data completamente livre

COMO SUGERIR ROTEIROS:
Quando o usuário pedir sugestão de roteiro ou "datas antes/depois" de um show:
1. Identifique o show referência (cidade + data)
2. Procure NOS DADOS eventos com datas 1-3 dias antes OU depois
3. Considere cidades no mesmo estado ou estados vizinhos como potenciais
4. Shows com status "Vendido"/"Reservado" já estão OCUPADOS - não sugira essas datas
5. Cadastros e propostas são oportunidades LIVRES que podem ser trabalhadas
6. Se não encontrar nada próximo, diga claramente e sugira o que há disponível

ESTADOS VIZINHOS (para roteiro):
GO vizinhos: MG, MS, MT, TO, BA, DF
SP vizinhos: MG, RJ, PR, MS
MG vizinhos: SP, RJ, ES, BA, GO, DF, MS
BA vizinhos: SE, AL, PE, PI, TO, GO, MG, ES

O escritório tem ${totalEvents} eventos cadastrados no total.

DADOS COMPLETOS DO ESCRITÓRIO (todos os eventos):
${context}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SHOWMAP_APP_URL') || 'https://showmap.vercel.app',
        'X-OpenRouter-Title': 'ShowMap Assistente Comercial',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENROUTER_MODEL') || 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    })
    if (!response.ok) {
      const details = await response.text()
      console.error('OpenRouter error:', response.status, details.slice(0, 500))
      throw new Error('A IA não respondeu agora. Tente novamente em instantes.')
    }

    const completion = await response.json()
    const answer = String(completion?.choices?.[0]?.message?.content || '').trim()
    if (!answer) throw new Error('A IA não retornou uma resposta.')
    const reusable = isReusableQuestion(normalizedQuestion)
    const { error: memoryError } = await admin.from('assistant_knowledge').upsert({
      company_id: caller.company_id,
      normalized_question: normalizedQuestion,
      question,
      answer,
      reusable,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,normalized_question' })
    if (memoryError) console.error('Assistant memory error:', memoryError.message)
    return Response.json({ answer, source: 'ai' }, { headers: corsHeaders })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível consultar o assistente.'
    return Response.json({ error: message }, { status: 400, headers: corsHeaders })
  }
})
