// Banco de dados local do ShowMap.
// Os dados ficam neste navegador, em localStorage, e podem ser salvos/restaurados
// pela aba Backup do Administrador Master.

const INITIAL_COMPANIES = [
  { id: 'comp1', name: 'Top Shows Produções', email: 'contato@topshows.com', phone: '(11) 9999-9999', active: true },
  { id: 'comp2', name: 'Sertanejo VIP', email: 'vendas@sertanejovip.com', phone: '(62) 8888-8888', active: true },
];

const INITIAL_USERS = [
  { id: 'super1', name: 'Admin Geral', email: 'admin', password: '123', role: 'superadmin' },
  { id: 'cadmin1', name: 'Diretor Top Shows', email: 'admintop', password: '123', role: 'company_admin', companyId: 'comp1' },
  { id: 'cadmin2', name: 'Diretor Sertanejo', email: 'adminsertanejo', password: '123', role: 'company_admin', companyId: 'comp2' },
  { id: 'agente1', name: 'João (Agente Top)', email: 'agente1', password: '123', role: 'agent', companyId: 'comp1' },
  { id: 'agente2', name: 'Maria (Agente Vip)', email: 'agente2', password: '123', role: 'agent', companyId: 'comp2' },
];

const INITIAL_EVENTS = [
  { id: '1', stateId: 'GO', city: 'Goiânia', date: '2026-08-15', time: '22:00', status: 'Disponível', companyId: 'comp1', agentId: 'agente1', type: 'cache' },
  { id: '2', stateId: 'SP', city: 'Campinas', date: '2026-09-10', time: '23:30', status: 'Confirmado', companyId: 'comp2', agentId: 'agente2', type: 'portaria', contractorName: 'Prefeitura M.', contractorEmail: 'pref@cidade.com', contractorPhone: '(11) 9999-9999' },
  { id: '3', stateId: 'MG', city: 'Uberlândia', date: '2026-10-20', time: '21:00', status: 'Proposta', companyId: 'comp1', agentId: 'agente1', type: 'emenda', contractorName: 'Festa da Uva', contractorEmail: 'festa@uva.com', contractorPhone: '(34) 9999-8888' },
];

const COLLECTIONS = ['companies', 'users', 'events'];
const STORAGE_PREFIX = 'showmap:';
const INITIAL_DATA = {
  companies: INITIAL_COMPANIES,
  users: INITIAL_USERS,
  events: INITIAL_EVENTS,
};

const listeners = {
  companies: [],
  users: [],
  events: [],
};

const clone = (data) => JSON.parse(JSON.stringify(data));
const storageKey = (collectionName) => `${STORAGE_PREFIX}${collectionName}`;

const assertCollection = (collectionName) => {
  if (!COLLECTIONS.includes(collectionName)) {
    throw new Error(`Coleção inválida: ${collectionName}`);
  }
};

const getLocalData = (collectionName) => {
  assertCollection(collectionName);
  const saved = localStorage.getItem(storageKey(collectionName));
  if (!saved) {
    const initialData = clone(INITIAL_DATA[collectionName]);
    localStorage.setItem(storageKey(collectionName), JSON.stringify(initialData));
    return initialData;
  }

  try {
    const data = JSON.parse(saved);
    if (!Array.isArray(data)) throw new Error('Formato inválido');
    return data;
  } catch {
    const initialData = clone(INITIAL_DATA[collectionName]);
    localStorage.setItem(storageKey(collectionName), JSON.stringify(initialData));
    return initialData;
  }
};

const setLocalData = (collectionName, data) => {
  assertCollection(collectionName);
  localStorage.setItem(storageKey(collectionName), JSON.stringify(data));
};

const notify = (collectionName) => {
  const data = getLocalData(collectionName);
  listeners[collectionName].forEach((callback) => callback(clone(data)));
};

export const initAuth = (onUserLoaded) => {
  onUserLoaded({ uid: 'local-user', isAnonymous: true });
  return () => {};
};

export const subscribeCollection = (collectionName, callback) => {
  assertCollection(collectionName);
  listeners[collectionName].push(callback);
  callback(clone(getLocalData(collectionName)));

  return () => {
    listeners[collectionName] = listeners[collectionName].filter((listener) => listener !== callback);
  };
};

export const saveDocument = async (collectionName, data) => {
  assertCollection(collectionName);
  const docId = data.id ? String(data.id) : `${collectionName.slice(0, 4)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const documentToSave = { ...data, id: docId };
  const currentList = getLocalData(collectionName);
  const updatedList = currentList.some((item) => String(item.id) === docId)
    ? currentList.map((item) => String(item.id) === docId ? documentToSave : item)
    : [...currentList, documentToSave];

  setLocalData(collectionName, updatedList);
  notify(collectionName);
  return docId;
};

export const deleteDocument = async (collectionName, docId) => {
  assertCollection(collectionName);
  const id = String(docId);
  setLocalData(collectionName, getLocalData(collectionName).filter((item) => String(item.id) !== id));
  notify(collectionName);
};

export const exportLocalDatabase = () => ({
  version: 1,
  exportedAt: new Date().toISOString(),
  database: Object.fromEntries(COLLECTIONS.map((collectionName) => [collectionName, getLocalData(collectionName)])),
});

const validateBackup = (backup) => {
  if (!backup || backup.version !== 1 || !backup.database || typeof backup.database !== 'object') {
    throw new Error('Arquivo de backup inválido.');
  }

  COLLECTIONS.forEach((collectionName) => {
    const records = backup.database[collectionName];
    if (!Array.isArray(records)) throw new Error(`A coleção ${collectionName} está ausente ou inválida.`);

    const ids = new Set();
    records.forEach((record) => {
      if (!record || typeof record !== 'object' || !record.id) {
        throw new Error(`A coleção ${collectionName} contém um registro inválido.`);
      }
      const id = String(record.id);
      if (ids.has(id)) throw new Error(`A coleção ${collectionName} contém IDs repetidos.`);
      ids.add(id);
    });
  });
};

export const importLocalDatabase = async (backup) => {
  validateBackup(backup);
  COLLECTIONS.forEach((collectionName) => {
    setLocalData(collectionName, clone(backup.database[collectionName]));
  });
  COLLECTIONS.forEach(notify);
};
