const DB_NAME = 'overwrite';
const DB_VERSION = 1;
const STORE_TIMELINES = 'timelines';
const STORE_META = 'meta';

let dbPromise = null;

/** Veritabanını açar (bir kez), sonraki çağrılarda aynı bağlantıyı verir. */
export function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_TIMELINES)) {
        db.createObjectStore(STORE_TIMELINES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db, store, mode) {
  return db.transaction(store, mode).objectStore(store);
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Bütün timeline'lar, no sırasına göre. */
export async function allTimelines() {
  const db = await openDb();
  const rows = await wrap(tx(db, STORE_TIMELINES, 'readonly').getAll());
  return rows.sort((a, b) => a.no - b.no);
}

export async function putTimeline(timeline) {
  const db = await openDb();
  await wrap(tx(db, STORE_TIMELINES, 'readwrite').put(timeline));
}

export async function deleteTimeline(id) {
  const db = await openDb();
  await wrap(tx(db, STORE_TIMELINES, 'readwrite').delete(id));
}

export async function getMeta(key) {
  const db = await openDb();
  return wrap(tx(db, STORE_META, 'readonly').get(key));
}

export async function setMeta(key, value) {
  const db = await openDb();
  await wrap(tx(db, STORE_META, 'readwrite').put(value, key));
}
