import { supabase } from './supabase';

const TABLES = {
  companies: 'companies',
  users: 'profiles',
  events: 'events',
};

const toCompany = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email || '',
  phone: row.phone || '',
  active: row.active,
  plan: row.plan || 'lite',
  planExpiresAt: row.plan_expires_at || '',
});

const toUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email || '',
  role: row.role,
  companyId: row.company_id,
});

const toEvent = (row) => ({
  id: row.id,
  stateId: row.state_id,
  city: row.city,
  date: row.date,
  time: row.time?.slice(0, 5) || '',
  type: row.type,
  status: row.status,
  companyId: row.company_id,
  agentId: row.agent_id,
  contractorName: row.contractor_name || '',
  contractorEmail: row.contractor_email || '',
  contractorPhone: row.contractor_phone || '',
  contractorInstagram: row.contractor_instagram || '',
  eventName: row.event_name || '',
});

const fromCompany = (data) => ({
  ...(data.id ? { id: data.id } : {}),
  name: data.name.trim(),
  email: data.email?.trim() || null,
  phone: data.phone?.trim() || null,
  active: Boolean(data.active),
  plan: data.plan || 'lite',
  plan_expires_at: data.planExpiresAt || null,
});

const fromEvent = (data) => ({
  ...(data.id ? { id: data.id } : {}),
  state_id: data.stateId,
  city: data.city.trim(),
  date: data.date,
  time: data.time || null,
  type: data.type,
  status: data.status,
  company_id: data.companyId,
  agent_id: data.agentId || null,
  contractor_name: data.contractorName?.trim() || null,
  contractor_email: data.contractorEmail?.trim() || null,
  contractor_phone: data.contractorPhone?.trim() || null,
  contractor_instagram: data.contractorInstagram?.trim() || null,
  event_name: data.eventName?.trim() || null,
});

const throwIfError = (error) => {
  if (error) throw new Error(error.message || 'Não foi possível concluir a operação no Supabase.');
};

const throwFunctionError = async (error, fallback) => {
  if (!error) return;
  try {
    const body = await error.context?.json?.();
    if (body?.error) throw new Error(body.error);
  } catch (detailsError) {
    if (detailsError instanceof Error && detailsError.message !== 'Unexpected end of JSON input') throw detailsError;
  }
  throw new Error(error.message || fallback);
};

const fetchCollection = async (collectionName) => {
  const table = TABLES[collectionName];
  if (!table) throw new Error(`Coleção inválida: ${collectionName}`);

  if (collectionName === 'events') {
    const { data, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'list_events' },
    });
    await throwFunctionError(error, 'Não foi possível carregar a agenda.');
    if (data?.error) throw new Error(data.error);
    return (data?.events || []).map(toEvent);
  }

  if (collectionName === 'users') {
    const { data, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'list_users' },
    });
    await throwFunctionError(error, 'Não foi possível carregar os usuários.');
    if (data?.error) throw new Error(data.error);
    return (data?.users || []).map(toUser);
  }

  if (collectionName === 'companies') {
    const { data, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'list_companies' },
    });
    await throwFunctionError(error, 'Não foi possível carregar os escritórios.');
    if (data?.error) throw new Error(data.error);
    return (data?.companies || []).map(toCompany);
  }

  const { data, error } = await supabase.from(table).select('*');
  throwIfError(error);
  if (collectionName === 'companies') return data.map(toCompany);
  if (collectionName === 'users') return data.map(toUser);
  return data.map(toEvent);
};

export const initAuth = (onUserLoaded) => {
  supabase.auth.getSession().then(({ data }) => onUserLoaded(data.session?.user || null));
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    onUserLoaded(session?.user || null);
  });
  return () => subscription.unsubscribe();
};

export const signIn = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  throwIfError(error);
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  throwIfError(error);
};

export const ensureCurrentProfile = async () => {
  const { data, error } = await supabase.functions.invoke('manage-user', {
    body: { action: 'bootstrap' },
  });
  await throwFunctionError(error, 'Não foi possível preparar o perfil.');
  if (data?.error) throw new Error(data.error);
  return data?.profile || null;
};

export const subscribeCollection = (collectionName, callback) => {
  let active = true;
  const refresh = async () => {
    try {
      const list = await fetchCollection(collectionName);
      if (active) callback(list);
    } catch (error) {
      console.error(`Erro ao carregar ${collectionName}:`, error);
    }
  };

  refresh();
  // A gravação é feita pela função segura; esta atualização periódica mantém
  // outra sessão aberta sincronizada mesmo quando o Realtime não recebe o evento.
  const refreshInterval = setInterval(refresh, 20000);
  const channel = supabase
    .channel(`showmap-${collectionName}-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES[collectionName] }, refresh)
    .subscribe();

  return () => {
    active = false;
    clearInterval(refreshInterval);
    supabase.removeChannel(channel);
  };
};

export const saveDocument = async (collectionName, data) => {
  if (collectionName === 'users') {
    const action = data.id ? 'update' : 'create';
    const { data: result, error } = await supabase.functions.invoke('manage-user', {
      body: {
        action,
        id: data.id || undefined,
        name: data.name,
        email: data.email,
        password: data.password || undefined,
        role: data.role,
        companyId: data.companyId || null,
      },
    });
    await throwFunctionError(error, 'Não foi possível salvar o usuário.');
    if (result?.error) throw new Error(result.error);
    return result?.id || data.id;
  }

  const row = collectionName === 'companies' ? fromCompany(data) : fromEvent(data);
  if (collectionName === 'companies') {
    const { data: result, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'save_company', company: row },
    });
    await throwFunctionError(error, 'Não foi possível salvar o escritório.');
    if (result?.error) throw new Error(result.error);
    return result?.id;
  }

  if (collectionName === 'events') {
    const { data: result, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'save_event', event: row },
    });
    await throwFunctionError(error, 'Não foi possível salvar a agenda.');
    if (result?.error) throw new Error(result.error);
    return result?.id;
  }
  const { data: result, error } = await supabase
    .from(TABLES[collectionName])
    .upsert(row)
    .select('id')
    .single();
  throwIfError(error);
  return result.id;
};

export const deleteDocument = async (collectionName, docId) => {
  if (collectionName === 'users') {
    const { data, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'delete', id: docId },
    });
    await throwFunctionError(error, 'Não foi possível excluir o usuário.');
    if (data?.error) throw new Error(data.error);
    return;
  }

  if (collectionName === 'events') {
    const { data, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'delete_event', id: docId },
    });
    await throwFunctionError(error, 'Não foi possível excluir a agenda.');
    if (data?.error) throw new Error(data.error);
    return;
  }

  if (collectionName === 'companies') {
    const { data, error } = await supabase.functions.invoke('manage-user', {
      body: { action: 'delete_company', id: docId },
    });
    await throwFunctionError(error, 'Não foi possível excluir o escritório.');
    if (data?.error) throw new Error(data.error);
    return;
  }

  const { error } = await supabase.from(TABLES[collectionName]).delete().eq('id', docId);
  throwIfError(error);
};

export const renewCompanyPlan = async (companyId) => {
  const { data, error } = await supabase.functions.invoke('manage-user', {
    body: { action: 'renew_company_plan', id: companyId },
  });
  await throwFunctionError(error, 'Não foi possível renovar o plano.');
  if (data?.error) throw new Error(data.error);
  return data;
};

export const exportDatabase = async () => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  database: {
    companies: await fetchCollection('companies'),
    users: await fetchCollection('users'),
    events: await fetchCollection('events'),
  },
});
