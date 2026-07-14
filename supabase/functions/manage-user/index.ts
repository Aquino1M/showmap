import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type Role = 'superadmin' | 'company_admin' | 'agent'

type RequestBody = {
  action: 'bootstrap' | 'create' | 'update' | 'delete'
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
      const metadataRole = authData.user.user_metadata?.role as Role | undefined
      const metadataCompanyId = authData.user.user_metadata?.company_id as string | undefined
      const role: Role = email === 'diogenesdidi83@gmail.com'
        ? 'superadmin' : matchingCompany || metadataRole === 'company_admin' || caller?.role === 'company_admin' ? 'company_admin' : (caller?.role as Role | undefined) ?? 'agent'
      const companyId = role === 'superadmin' ? null : matchingCompany?.id ?? caller?.company_id ?? metadataCompanyId ?? null
      if (role === 'agent' && !companyId) throw new Error('Perfil do agente não possui escritório vinculado.')
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

    if (body.action === 'create') {
      if (!body.name || !body.email || !body.password || !body.role || !canManage(body.role, targetCompanyId)) {
        throw new Error('Você não tem permissão ou faltam dados para criar este usuário.')
      }
      if (body.role !== 'superadmin' && !targetCompanyId) throw new Error('Selecione um escritório para este usuário.')

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
