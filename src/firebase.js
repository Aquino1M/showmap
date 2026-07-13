import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

// Initial Mock Data
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

// Read configuration from variables
const env = import.meta.env || {};
const apiKey = env.VITE_FIREBASE_API_KEY || env.REACT_APP_FIREBASE_API_KEY;
const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN || env.REACT_APP_FIREBASE_AUTH_DOMAIN;
const projectId = env.VITE_FIREBASE_PROJECT_ID || env.REACT_APP_FIREBASE_PROJECT_ID;

let firebaseConfig = null;
if (typeof window !== 'undefined' && window.__firebase_config) {
  firebaseConfig = window.__firebase_config;
} else if (apiKey && authDomain && projectId) {
  firebaseConfig = {
    apiKey,
    authDomain,
    projectId,
  };
}

const appId = (typeof window !== 'undefined' && window.__app_id) || env.VITE_APP_ID || 'showmap-enterprise-prod';

let isFirebaseActive = false;
let db = null;
let auth = null;

if (firebaseConfig) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseActive = true;
    console.log('Firebase initialized successfully with appId:', appId);
  } catch (error) {
    console.error('Firebase initialization failed. Falling back to local storage:', error);
  }
} else {
  console.log('No Firebase config found. Running in Local Mode (localStorage).');
}

// Secure Authentication Hook (Rule 3)
export const initAuth = (onUserLoaded) => {
  if (!isFirebaseActive) {
    // Local mode simulation: instantly triggers authentication loaded state
    onUserLoaded({ uid: 'local-user', isAnonymous: true });
    return () => {};
  }

  const authenticate = async () => {
    try {
      if (typeof window !== 'undefined' && window.__initial_auth_token) {
        await signInWithCustomToken(auth, window.__initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    } catch (err) {
      console.error("Firebase auth failed:", err);
    }
  };

  authenticate();
  return onAuthStateChanged(auth, (usr) => {
    if (usr) onUserLoaded(usr);
  });
};

// Database Interfaces
// -----------------------------
// LOCAL STORAGE DB simulation helpers
const getLocalData = (key, initialData) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
};

const setLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const localListeners = {
  companies: [],
  users: [],
  events: []
};

const triggerLocalListeners = (collectionName) => {
  const data = getLocalData(collectionName, 
    collectionName === 'companies' ? INITIAL_COMPANIES :
    collectionName === 'users' ? INITIAL_USERS : INITIAL_EVENTS
  );
  localListeners[collectionName].forEach(cb => cb(data));
};

// Real-time listener function (Rule 1 & Rule 2)
export const subscribeCollection = (collectionName, callback) => {
  if (!isFirebaseActive) {
    localListeners[collectionName].push(callback);
    // Initial trigger
    triggerLocalListeners(collectionName);
    return () => {
      localListeners[collectionName] = localListeners[collectionName].filter(cb => cb !== callback);
    };
  }

  // Firebase path (Rule 1)
  const colRef = collection(db, 'artifacts', appId, 'public', 'data', collectionName);
  return onSnapshot(colRef, (snapshot) => {
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(list);
  }, (error) => {
    console.error(`Error subscribing to ${collectionName}:`, error);
  });
};

// Mutation functions
export const saveDocument = async (collectionName, data) => {
  const docId = data.id ? String(data.id) : `${collectionName.slice(0, 4)}_${Date.now()}`;
  const documentToSave = { ...data, id: docId };

  if (!isFirebaseActive) {
    const currentList = getLocalData(collectionName, 
      collectionName === 'companies' ? INITIAL_COMPANIES :
      collectionName === 'users' ? INITIAL_USERS : INITIAL_EVENTS
    );
    const updatedList = currentList.some(item => String(item.id) === docId)
      ? currentList.map(item => String(item.id) === docId ? documentToSave : item)
      : [...currentList, documentToSave];
    setLocalData(collectionName, updatedList);
    triggerLocalListeners(collectionName);
    return docId;
  }

  const docRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, docId);
  await setDoc(docRef, documentToSave);
  return docId;
};

export const deleteDocument = async (collectionName, docId) => {
  const idStr = String(docId);
  if (!isFirebaseActive) {
    const currentList = getLocalData(collectionName, 
      collectionName === 'companies' ? INITIAL_COMPANIES :
      collectionName === 'users' ? INITIAL_USERS : INITIAL_EVENTS
    );
    const updatedList = currentList.filter(item => String(item.id) !== idStr);
    setLocalData(collectionName, updatedList);
    triggerLocalListeners(collectionName);
    return;
  }

  const docRef = doc(db, 'artifacts', appId, 'public', 'data', collectionName, idStr);
  await deleteDoc(docRef);
};
