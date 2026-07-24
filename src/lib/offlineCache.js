const DATABASE_NAME = 'showmap-offline';
const DATABASE_VERSION = 1;
const STORE_NAME = 'verified-snapshots';
const FALLBACK_PREFIX = 'showmap:verified-snapshot:';

const canUseIndexedDb = () => typeof indexedDB !== 'undefined';

const openDatabase = () => new Promise((resolve, reject) => {
  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onerror = () => reject(request.error);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME, { keyPath: 'key' });
    }
  };
  request.onsuccess = () => resolve(request.result);
});

const runTransaction = async (mode, operation) => {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = operation(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
};

const fallbackKey = (key) => `${FALLBACK_PREFIX}${key}`;

export const saveVerifiedSnapshot = async (key, items) => {
  const snapshot = { key, savedAt: Date.now(), items };
  if (canUseIndexedDb()) {
    await runTransaction('readwrite', (store) => store.put(snapshot));
    return;
  }
  globalThis.localStorage?.setItem(fallbackKey(key), JSON.stringify(snapshot));
};

export const readVerifiedSnapshot = async (key, maxAgeMs) => {
  const snapshot = canUseIndexedDb()
    ? await runTransaction('readonly', (store) => store.get(key))
    : JSON.parse(globalThis.localStorage?.getItem(fallbackKey(key)) || 'null');
  if (!snapshot?.savedAt || !Array.isArray(snapshot.items)) return null;
  if (Date.now() - snapshot.savedAt > maxAgeMs) return null;
  return snapshot.items;
};

export const clearVerifiedSnapshots = async (userId) => {
  if (canUseIndexedDb()) {
    const database = await openDatabase();
    try {
      await new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) return;
          if (!userId || cursor.value.key.startsWith(`${userId}:`)) cursor.delete();
          cursor.continue();
        };
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
    } finally {
      database.close();
    }
    return;
  }

  Object.keys(globalThis.localStorage || {})
    .filter((key) => key.startsWith(FALLBACK_PREFIX) && (!userId || key.startsWith(fallbackKey(`${userId}:`))))
    .forEach((key) => globalThis.localStorage.removeItem(key));
};
