import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Role = 'superadmin' | 'company_admin' | 'agent'

type RequestBody = {
  action: 'create' | 'update' | 'delete'
  id?: string
  name?: string
  email?: string
  password?: string
  role?: Role
  companyId?: string | null
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

    const { data: caller, error: callerError } = await admin
      .from('profiles')
      .select('id, role, company_id')
      .eq('id', authData.user.id)
      .single()
    if (callerError || !caller) throw new Error('Perfil do solicitante não encontrado.')

    const body = await request.json() as RequestBody
    const isMaster = caller.role === 'superadmin'
    const isCompanyAdmin = caller.role === 'company_admin'
    const targetCompanyId = body.companyId ?? null

    const canManage = (role: Role, companyId: string | null) =>
      isMaster || (isCompanyAdmin && role === 'agent' && companyId === caller.company_id)

    if (body.action === 'create') {
      if (!body.name || !body.email || !body.password || !body.role || !canManage(body.role, targetCompanyId)) {
        throw new Error('Você não tem permissão ou faltam dados para criar este usuário.')
      }
      if (body.role !== 'superadmin' && !targetCompanyId) throw new Error('Selecione um escritório para este usuário.')

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: body.email.trim().toLowerCase(),
        password: body.password,
        email_confirm: true,
        user_metadata: { name: body.name.trim() },
      })
      if (createError || !created.user) throw createError ?? new Error('Não foi possível criar o usuário.')

      const { error: profileError } = await admin.from('profiles').update({
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        role: body.role,
        company_id: targetCompanyId,
      }).eq('id', created.user.id)
      if (profileError) throw profileError
      return Response.json({ id: created.user.id }, { headers: corsHeaders })
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
