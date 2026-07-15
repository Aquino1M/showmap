import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Role = 'superadmin' | 'company_admin' | 'agent'
type Plan = 'lite' | 'pro' | 'ultra'
const planAgentLimits: Record<Plan, number> = { lite: 5, pro: 10, ultra: 15 }

type RequestBody = {
  action: 'bootstrap' | 'create' | 'update' | 'delete' | 'save_event' | 'delete_event' | 'list_events' | 'list_users' | 'list_companies' | 'save_company' | 'delete_company' | 'renew_company_plan'
  id?: string
  name?: string
  email?: string
  password?: string
  role?: Role
  companyId?: string | null
  event?: Record<string, unknown>
  company?: Record<string, unknown>
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Configuração segura do Supabase ausente.')

    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) throw new Error('Sessão não informada.')

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: authData, error: authError } = await admin.auth.getUser(token)
    if (authError || !authData.user) throw new Error('Sessão inválida.')

    const body = await request.json() as RequestBody
    const { data: caller, error: callerError } = await admin
      .from('profiles')
      .select('id, name, email, role, company_id')
      .eq('id', authData.user.id)
      .single()

    if (body.action === 'bootstrap') {
      const email = authData.user.email?.trim().toLowerCase()
      if (!email) throw new Error('E-mail do usuário não encontrado.')
      const { data: matchingCompany } = await admin.from('companies')
        .select('id').ilike('email', email).maybeSingle()
      const role: Role = email === 'diogenesdidi83@gmail.com'
        ? 'superadmin' : matchingCompany || caller?.role === 'company_admin' ? 'company_admin' : (caller?.role as Role | undefined) ?? 'agent'
      const companyId = role === 'superadmin' ? null : matchingCompany?.id ?? caller?.company_id ?? null
      if (role !== 'superadmin' && !companyId) throw new Error('Perfil não possui escritório vinculado.')
      const profile = {
        id: authData.user.id,
        name: authData.user.user_metadata?.name || caller?.name || email.split('@')[0],
        email,
        role,
        company_id: companyId,
      }
      const { error: bootstrapError } = await admin.from('profiles').upsert(profile, { onConflict: 'id' })
      if (bootstrapError) throw bootstrapError
      return Response.json({ profile: {
        id: profile.id, name: profile.name, email: profile.email,
        role: profile.role, companyId: profile.company_id,
      } }, { headers: corsHeaders })
    }

    if (callerError || !caller) throw new Error('Perfil do solicitante não encontrado.')

    const isMaster = caller.role === 'superadmin'
    const isCompanyAdmin = caller.role === 'company_admin'
    const targetCompanyId = body.companyId ?? null

    const canManage = (role: Role, companyId: string | null) =>
      isMaster || (isCompanyAdmin && role === 'agent' && companyId === caller.company_id)

    if (body.password && body.password.length < 6) {
      throw new Error('A senha deve ter pelo menos 6 caracteres.')
    }

    if (body.action === 'list_events') {
      let query = admin.from('events').select('*').order('date', { ascending: true })
      if (!isMaster) query = query.eq('company_id', caller.company_id)
      const { data: events, error } = await query
      if (error) throw error
      return Response.json({ events }, { headers: corsHeaders })
    }

    if (body.action === 'list_users') {
      let query = admin.from('profiles').select('id, name, email, role, company_id').order('name', { ascending: true })
      if (!isMaster) query = query.eq('company_id', caller.company_id)
      const { data: users, error } = await query
      if (error) throw error
      return Response.json({ users }, { headers: corsHeaders })
    }

    if (body.action === 'list_companies') {
      let query = admin.from('companies').select('*').order('name', { ascending: true })
      if (!isMaster) query = query.eq('id', caller.company_id)
      const { data: companies, error } = await query
      if (error) throw error
      return Response.json({ companies }, { headers: corsHeaders })
    }

    if (body.action === 'save_company') {
      if (!isMaster || !body.company || typeof body.company.name !== 'string') {
        throw new Error('Somente o Administrador Master pode salvar escritórios.')
      }
      const companyInput = body.company
      const safeCompany = {
        ...(typeof companyInput.id === 'string' ? { id: companyInput.id } : {}),
        name: companyInput.name.trim(),
        email: typeof companyInput.email === 'string' ? companyInput.email.trim().toLowerCase() || null : null,
        phone: typeof companyInput.phone === 'string' ? companyInput.phone.trim() || null : null,
        active: companyInput.active !== false,
        plan: (['lite', 'pro', 'ultra'].includes(String(companyInput.plan)) ? companyInput.plan : 'lite') as Plan,
        plan_expires_at: typeof companyInput.plan_expires_at === 'string' ? companyInput.plan_expires_at : new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10),
      }
      if (!safeCompany.name) throw new Error('Informe o nome do escritório.')
      const { data: company, error } = await admin.from('companies')
        .upsert(safeCompany).select('id').single()
      if (error) throw error
      return Response.json({ id: company.id }, { headers: corsHeaders })
    }

    if (body.action === 'renew_company_plan') {
      if (!isMaster || !body.id) throw new Error('Somente o Administrador Master pode renovar planos.')
      const { data: company, error: companyError } = await admin.from('companies')
        .select('plan, plan_expires_at').eq('id', body.id).single()
      if (companyError || !company) throw new Error('Escritório não encontrado.')
      const currentPlan = (['lite', 'pro', 'ultra'].includes(company.plan) ? company.plan : 'lite') as Plan
      const baseDate = company.plan_expires_at && new Date(`${company.plan_expires_at}T23:59:59`) > new Date()
        ? new Date(`${company.plan_expires_at}T12:00:00`) : new Date()
      baseDate.setMonth(baseDate.getMonth() + 1)
      const { data: renewed, error } = await admin.from('companies').update({
        plan: currentPlan,
        plan_expires_at: baseDate.toISOString().slice(0, 10),
        active: true,
      }).eq('id', body.id).select('id, plan_expires_at').single()
      if (error) throw error
      return Response.json({ id: renewed.id, planExpiresAt: renewed.plan_expires_at }, { headers: corsHeaders })
    }

    if (body.action === 'delete_company') {
      if (!isMaster || !body.id) throw new Error('Somente o Administrador Master pode excluir escritórios.')
      const { data: members, error: membersError } = await admin.from('profiles')
        .select('id').eq('company_id', body.id)
      if (membersError) throw membersError
      const { error: eventsError } = await admin.from('events').delete().eq('company_id', body.id)
      if (eventsError) throw eventsError
      for (const member of members) {
        const { error } = await admin.auth.admin.deleteUser(member.id)
        if (error) throw error
      }
      const { error } = await admin.from('companies').delete().eq('id', body.id)
      if (error) throw error
      return Response.json({ id: body.id }, { headers: corsHeaders })
    }

    if (body.action === 'save_event') {
      const event = body.event
      if (!event || typeof event.company_id !== 'string') throw new Error('Dados da agenda inválidos.')
      const safeEvent = {
        ...(typeof event.id === 'string' ? { id: event.id } : {}),
        state_id: typeof event.state_id === 'string' ? event.state_id.trim().toUpperCase() : '',
        city: typeof event.city === 'string' ? event.city.trim() : '',
        date: typeof event.date === 'string' ? event.date : '',
        time: typeof event.time === 'string' ? event.time : null,
        type: typeof event.type === 'string' ? event.type : '',
        status: typeof event.status === 'string' ? event.status : 'Disponível',
        company_id: event.company_id,
        agent_id: typeof event.agent_id === 'string' ? event.agent_id : null,
        contractor_name: typeof event.contractor_name === 'string' ? event.contractor_name.trim() || null : null,
        contractor_email: typeof event.contractor_email === 'string' ? event.contractor_email.trim().toLowerCase() || null : null,
        contractor_phone: typeof event.contractor_phone === 'string' ? event.contractor_phone.trim() || null : null,
        contractor_instagram: typeof event.contractor_instagram === 'string' ? event.contractor_instagram.trim() || null : null,
        event_name: typeof event.event_name === 'string' ? event.event_name.trim() || null : null,
      }
      if (!safeEvent.state_id || !safeEvent.city || !safeEvent.date || !safeEvent.type) throw new Error('Preencha os dados obrigatórios da agenda.')
      const eventCompanyId = safeEvent.company_id
      const eventAgentId = safeEvent.agent_id
      const eventId = safeEvent.id || null

      if (!isMaster && eventCompanyId !== caller.company_id) {
        throw new Error('Você não pode salvar dados de outro escritório.')
      }
      if (!isMaster && !isCompanyAdmin && eventAgentId !== authData.user.id) {
        throw new Error('O agente só pode registrar propostas em seu próprio nome.')
      }

      if (eventId) {
        const { data: existing, error: existingError } = await admin.from('events')
          .select('company_id, agent_id').eq('id', eventId).single()
        if (existingError || !existing) throw new Error('Registro da agenda não encontrado.')
        if (!isMaster && existing.company_id !== caller.company_id) {
          throw new Error('Você não pode alterar dados de outro escritório.')
        }
        if (!isMaster && !isCompanyAdmin && existing.agent_id && existing.agent_id !== authData.user.id) {
          throw new Error('O agente só pode alterar propostas assumidas por ele.')
        }
      }

      const { data: savedEvent, error: eventError } = await admin.from('events')
        .upsert(safeEvent).select('id').single()
      if (eventError) throw eventError
      return Response.json({ id: savedEvent.id }, { headers: corsHeaders })
    }

    if (body.action === 'delete_event') {
      if (!body.id) throw new Error('Registro da agenda não informado.')
      const { data: event, error: eventError } = await admin.from('events')
        .select('company_id').eq('id', body.id).single()
      if (eventError || !event) throw new Error('Registro da agenda não encontrado.')
      if (!isMaster && (!isCompanyAdmin || event.company_id !== caller.company_id)) {
        throw new Error('Você não tem permissão para excluir este registro.')
      }
      const { error: deleteError } = await admin.from('events').delete().eq('id', body.id)
      if (deleteError) throw deleteError
      return Response.json({ id: body.id }, { headers: corsHeaders })
    }

    if (body.action === 'create') {
      if (!body.name || !body.email || !body.password || !body.role || !canManage(body.role, targetCompanyId)) {
        throw new Error('Você não tem permissão ou faltam dados para criar este usuário.')
      }
      if (body.role !== 'superadmin' && !targetCompanyId) throw new Error('Selecione um escritório para este usuário.')

      if (body.role === 'agent') {
        const { data: company, error: companyError } = await admin.from('companies')
          .select('plan, plan_expires_at').eq('id', targetCompanyId).single()
        if (companyError || !company) throw new Error('Escritório não encontrado.')
        if (new Date(`${company.plan_expires_at}T23:59:59`) < new Date()) throw new Error('O plano deste escritório está vencido. Renove o plano para cadastrar agentes.')
        const plan = (['lite', 'pro', 'ultra'].includes(company.plan) ? company.plan : 'lite') as Plan
        const { count, error: countError } = await admin.from('profiles')
          .select('id', { count: 'exact', head: true }).eq('company_id', targetCompanyId).eq('role', 'agent')
        if (countError) throw countError
        if ((count || 0) >= planAgentLimits[plan]) throw new Error(`O plano ${plan.toUpperCase()} permite no máximo ${planAgentLimits[plan]} agentes.`)
      }

      const email = body.email.trim().toLowerCase()
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          name: body.name.trim(),
          role: body.role,
          company_id: targetCompanyId,
        },
      })
      // Se a conta já existir (situação comum após um cadastro anterior que
      // não gravou o perfil), recupera e vincula o perfil ao escritório atual.
      let user = created.user
      if (createError || !user) {
        const { data: userPage, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
        if (listError) throw listError
        user = userPage.users.find((item) => item.email?.trim().toLowerCase() === email)
        if (!user) throw createError ?? new Error('Não foi possível criar o usuário.')

        const { data: existingProfile } = await admin.from('profiles')
          .select('role, company_id').eq('id', user.id).maybeSingle()
        if (!isMaster && existingProfile?.company_id && existingProfile.company_id !== targetCompanyId) {
          throw new Error('Este e-mail já está vinculado a outro escritório.')
        }
        if (body.password) {
          const { error: passwordError } = await admin.auth.admin.updateUserById(user.id, { password: body.password })
          if (passwordError) throw passwordError
        }
      }

      const { error: profileError } = await admin.from('profiles').upsert({
        id: user.id,
        name: body.name.trim(),
        email,
        role: body.role,
        company_id: targetCompanyId,
      }, { onConflict: 'id' })
      if (profileError) throw profileError
      return Response.json({ id: user.id }, { headers: corsHeaders })
    }

    if (!body.id) throw new Error('Usuário não informado.')
    const { data: target, error: targetError } = await admin.from('profiles')
      .select('id, role, company_id')
      .eq('id', body.id)
      .single()
    if (targetError || !target) throw new Error('Usuário não encontrado.')
    if (!canManage(target.role as Role, target.company_id)) throw new Error('Você não tem permissão para este usuário.')

    if (body.action === 'delete') {
      if (target.id === authData.user.id) throw new Error('Você não pode excluir a própria conta.')
      const { error } = await admin.auth.admin.deleteUser(target.id)
      if (error) throw error
      return Response.json({ id: target.id }, { headers: corsHeaders })
    }

    if (body.action === 'update') {
      const authUpdates: Record<string, string> = {}
      if (body.email) authUpdates.email = body.email.trim().toLowerCase()
      if (body.password) authUpdates.password = body.password
      if (Object.keys(authUpdates).length) {
        const { error } = await admin.auth.admin.updateUserById(target.id, authUpdates)
        if (error) throw error
      }

      const { error } = await admin.from('profiles').update({
        name: body.name?.trim(),
        email: body.email?.trim().toLowerCase(),
        role: target.role,
        company_id: target.company_id,
      }).eq('id', target.id)
      if (error) throw error
      return Response.json({ id: target.id }, { headers: corsHeaders })
    }

    throw new Error('Ação inválida.')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro inesperado.'
    return Response.json({ error: message }, { status: 400, headers: corsHeaders })
  }
})
