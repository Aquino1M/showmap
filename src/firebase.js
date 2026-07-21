import { supabase } from './supabase';

const TABLES = {
  companies: 'companies',
  users: 'profiles',
  events: 'events',
};

const DATA_CHANGED_EVENT = 'showmap:data-changed';
const LOCAL_SNAPSHOT_PREFIX = 'showmap:verified-snapshot:';
const LOCAL_SNAPSHOT_MAX_AGE = 6 * 60 * 60 * 1000;

// Cópia local apenas para leitura temporária quando a conexão cai. Dados só entram
// aqui depois de confirmados pelo Supabase; portanto, o banco remoto continua sendo
// a única fonte oficial e não há conflito entre versões da agenda.
const getSnapshotKey = async (collectionName) => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ? `${LOCAL_SNAPSHOT_PREFIX}${session.user.id}:${collectionName}` : null;
};

const storeVerifiedSnapshot = async (collectionName, items) => {
  try {
    const key = await getSnapshotKey(collectionName);
    if (!key || !globalThis.sessionStorage) return;
    globalThis.sessionStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), items }));
  } catch {
    // Cache é opcional: uma falha local não pode impedir o uso do Supabase.
  }
};

const readVerifiedSnapshot = async (collectionName) => {
  try {
    const key = await getSnapshotKey(collectionName);
    if (!key || !globalThis.sessionStorage) return null;
    const snapshot = JSON.parse(globalThis.sessionStorage.getItem(key) || 'null');
    if (!snapshot?.savedAt || !Array.isArray(snapshot.items) || Date.now() - snapshot.savedAt > LOCAL_SNAPSHOT_MAX_AGE) return null;
    return snapshot.items;
  } catch {
    return null;
  }
};

const clearVerifiedSnapshots = () => {
  try {
    if (!globalThis.sessionStorage) return;
    Object.keys(globalThis.sessionStorage)
      .filter((key) => key.startsWith(LOCAL_SNAPSHOT_PREFIX))
      .forEach((key) => globalThis.sessionStorage.removeItem(key));
  } catch {
    // Limpeza local é preventiva e não deve interromper o logout.
  }
};
const notifyCollectionChanged = (collectionName) => {
  globalThis.dispatchEvent?.(new CustomEvent(DATA_CHANGED_EVENT, { detail: collectionName }));
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
  artistName: row.artist_name || '',
  isRecurring: Boolean(row.is_recurring),
  value: row.value != null ? Number(row.value) : 0,
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
  artist_name: data.artistName?.trim() || null,
  is_recurring: Boolean(data.isRecurring),
  value: data.value != null ? Number(data.value) : 0,
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

// A função segura exige o token atual do usuário. Enviamos explicitamente o token
// mais recente para evitar que o navegador reutilize uma sessão antiga ao salvar.
const invokeManageUser = async (body) => {
  let { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) throw new Error('Sessão inválida. Entre novamente para continuar.');

  const expiresSoon = !session.expires_at || session.expires_at * 1000 < Date.now() + 60_000;
  if (expiresSoon) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    session = data.session;
  }
  if (!session?.access_token) throw new Error('Sessão inválida. Entre novamente para continuar.');

  return supabase.functions.invoke('manage-user', {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
};

const fetchCollection = async (collectionName) => {
  const table = TABLES[collectionName];
  if (!table) throw new Error(`Coleção inválida: ${collectionName}`);

  if (collectionName === 'events') {
    const { data, error } = await invokeManageUser({ action: 'list_events' });
    await throwFunctionError(error, 'Não foi possível carregar a agenda.');
    if (data?.error) throw new Error(data.error);
    return (data?.events || []).map(toEvent);
  }

  if (collectionName === 'users') {
    const { data, error } = await invokeManageUser({ action: 'list_users' });
    await throwFunctionError(error, 'Não foi possível carregar os usuários.');
    if (data?.error) throw new Error(data.error);
    return (data?.users || []).map(toUser);
  }

  if (collectionName === 'companies') {
    const { data, error } = await invokeManageUser({ action: 'list_companies' });
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
  let active = true;
  const notify = (session) => {
    if (active) onUserLoaded(session?.user || null);
  };

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    notify(session);
  });
  supabase.auth.getSession().then(({ data }) => notify(data.session)).catch(() => notify(null));

  return () => {
    active = false;
    subscription.unsubscribe();
  };
};

export const signIn = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  throwIfError(error);
};

export const signOut = async () => {
  clearVerifiedSnapshots();
  const { error } = await supabase.auth.signOut();
  throwIfError(error);
};

export const ensureCurrentProfile = async () => {
  const { data, error } = await invokeManageUser({ action: 'bootstrap' });
  await throwFunctionError(error, 'Não foi possível preparar o perfil.');
  if (data?.error) throw new Error(data.error);
  return data?.profile || null;
};

export const askCommercialAssistant = async (question) => {
  let { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!session) throw new Error('Sessão inválida. Entre novamente para continuar.');
  if (!session.expires_at || session.expires_at * 1000 < Date.now() + 60_000) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    session = data.session;
  }
  if (!session?.access_token) throw new Error('Sessão inválida. Entre novamente para continuar.');
  const result = await supabase.functions.invoke('commercial-assistant', {
    body: { question },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  await throwFunctionError(result.error, 'Não foi possível consultar o assistente.');
  if (result.data?.error) throw new Error(result.data.error);
  return result.data?.answer;
};

export const subscribeCollection = (collectionName, callback) => {
  let active = true;
  const refresh = async () => {
    try {
      const list = await fetchCollection(collectionName);
      await storeVerifiedSnapshot(collectionName, list);
      if (active) callback(list);
    } catch (error) {
      console.error(`Erro ao carregar ${collectionName}:`, error);
      const snapshot = await readVerifiedSnapshot(collectionName);
      if (active && snapshot) callback(snapshot);
    }
  };

  const onLocalChange = (event) => {
    if (event.detail === collectionName) refresh();
  };

  refresh();
  globalThis.addEventListener?.(DATA_CHANGED_EVENT, onLocalChange);
  // Realtime e atualizações locais mantêm o painel atual. A consulta periódica
  // é apenas uma reserva para ambientes em que o Realtime esteja indisponível.
  const refreshInterval = setInterval(refresh, 60000);
  const channel = supabase
    .channel(`showmap-${collectionName}-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLES[collectionName] }, refresh)
    .subscribe();

  return () => {
    active = false;
    clearInterval(refreshInterval);
    globalThis.removeEventListener?.(DATA_CHANGED_EVENT, onLocalChange);
    supabase.removeChannel(channel);
  };
};

export const saveDocument = async (collectionName, data) => {
  if (collectionName === 'users') {
    const action = data.id ? 'update' : 'create';
    const { data: result, error } = await invokeManageUser({
        action,
        id: data.id || undefined,
        name: data.name,
        email: data.email,
        password: data.password || undefined,
        role: data.role,
        companyId: data.companyId || null,
    });
    await throwFunctionError(error, 'Não foi possível salvar o usuário.');
    if (result?.error) throw new Error(result.error);
    notifyCollectionChanged('users');
    return result?.id || data.id;
  }

  const row = collectionName === 'companies' ? fromCompany(data) : fromEvent(data);
  if (collectionName === 'companies') {
    const { data: result, error } = await invokeManageUser({ action: 'save_company', company: row });
    await throwFunctionError(error, 'Não foi possível salvar o escritório.');
    if (result?.error) throw new Error(result.error);
    notifyCollectionChanged('companies');
    return result?.id;
  }

  if (collectionName === 'events') {
    const { data: result, error } = await invokeManageUser({ action: 'save_event', event: row });
    await throwFunctionError(error, 'Não foi possível salvar a agenda.');
    if (result?.error) throw new Error(result.error);
    notifyCollectionChanged('events');
    return result?.id;
  }
  const { data: result, error } = await supabase
    .from(TABLES[collectionName])
    .upsert(row)
    .select('id')
    .single();
  throwIfError(error);
  notifyCollectionChanged(collectionName);
  return result.id;
};

export const deleteDocument = async (collectionName, docId) => {
  if (collectionName === 'users') {
    const { data, error } = await invokeManageUser({ action: 'delete', id: docId });
    await throwFunctionError(error, 'Não foi possível excluir o usuário.');
    if (data?.error) throw new Error(data.error);
    notifyCollectionChanged('users');
    return;
  }

  if (collectionName === 'events') {
    const { data, error } = await invokeManageUser({ action: 'delete_event', id: docId });
    await throwFunctionError(error, 'Não foi possível excluir a agenda.');
    if (data?.error) throw new Error(data.error);
    notifyCollectionChanged('events');
    return;
  }

  if (collectionName === 'companies') {
    const { data, error } = await invokeManageUser({ action: 'delete_company', id: docId });
    await throwFunctionError(error, 'Não foi possível excluir o escritório.');
    if (data?.error) throw new Error(data.error);
    notifyCollectionChanged('companies');
    return;
  }

  const { error } = await supabase.from(TABLES[collectionName]).delete().eq('id', docId);
  throwIfError(error);
  notifyCollectionChanged(collectionName);
};

export const renewCompanyPlan = async (companyId) => {
  const { data, error } = await invokeManageUser({ action: 'renew_company_plan', id: companyId });
  await throwFunctionError(error, 'Não foi possível renovar o plano.');
  if (data?.error) throw new Error(data.error);
  notifyCollectionChanged('companies');
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
