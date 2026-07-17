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
  city: string
  state_id: string
  date: string
  time: string | null
  type: string
  status: string
  contractor_name: string | null
  event_name: string | null
  artist_name: string | null
  is_recurring: boolean
}

const toAiEvent = (event: EventRow) => ({
  cidade: event.city,
  uf: event.state_id,
  data: event.date,
  horario: event.time,
  tipo: event.type,
  status: event.status,
  contratante: event.contractor_name,
  evento: event.event_name,
  artista: event.artist_name,
  recorrente_anual: event.is_recurring,
})

const normalizeQuestion = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('pt-BR')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

// Apenas dúvidas estáveis podem reutilizar uma resposta antiga. Perguntas sobre
// agenda, datas, propostas e artistas sempre precisam consultar os dados atuais.
const isReusableQuestion = (question: string) => /\b(como|o que|funciona|cadastro|calendario|mapa|agente|plano|financeiro|proposta)\b/.test(question)

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

    const { data: events, error: eventsError } = await admin
      .from('events')
      .select('city, state_id, date, time, type, status, contractor_name, event_name, artist_name, is_recurring')
      .eq('company_id', caller.company_id)
      .order('date', { ascending: true })
      .limit(150)
    if (eventsError) throw eventsError

    const context = JSON.stringify((events || []).map(toAiEvent))
    const systemPrompt = `Você é o Assistente Comercial do ShowMap para o escritório ${company.name}. Fale em português do Brasil, de forma natural, amigável e direta, como um assistente da equipe comercial. Use frases curtas e explique a conclusão antes dos detalhes. Não use Markdown, asteriscos, títulos técnicos, tabelas, JSON ou linguagem de sistema. Se precisar listar opções, use no máximo três itens simples com o símbolo •. Use apenas os eventos no contexto abaixo. Não invente dados, cidades, contratantes ou resultados. Não mostre e-mail, telefone, senha ou qualquer dado pessoal que não esteja no contexto. Você não pode criar, reservar, vender, excluir ou alterar registros: apenas sugere e explica. Cadastros recorrentes são oportunidades anuais e não bloqueiam a data. Ao sugerir roteiro, priorize datas livres e propostas próximas de shows agendados ou vendidos; deixe claro quando faltarem dados.\n\nContexto autorizado do escritório:\n${context}`

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
        temperature: 0.2,
        max_tokens: 500,
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
