const DB_NAME = 'overwrite';
const DB_VERSION = 2;
const STORE_TIMELINES = 'timelines';
const STORE_UNIVERSES = 'universes';   // Doodle Sphere'deki adalar (hedefler)
const STORE_META = 'meta';

let dbPromise = null;

/* WebKit'te indexedDB.open() bazen NE onsuccess NE onerror tetikler
   (bfcache'ten dönüş, bellek baskısı altında soğuk açılış). Zaman aşımı
   olmazsa açılış sözü hiç sonuçlanmaz: uygulama sonsuza dek siyah ekranda
   asılı kalır ve hata da yakalanamaz. Süre dolunca reddedilir, böylece
   app.js hatayı yakalayıp "TEKRAR DENE" panelini gösterebilir. */
const OPEN_TIMEOUT_MS = 5000;

/** Veritabanını açar (bir kez), sonraki çağrılarda aynı bağlantıyı verir. */
export function openDb() {
  if (dbPromise) return dbPromise;

  const acilis = new Promise((resolve, reject) => {
    let bitti = false;
    let sure = null;
    const sonlandir = (fn, deger) => {
      if (bitti) return;
      bitti = true;
      clearTimeout(sure);
      fn(deger);
    };
    sure = setTimeout(
      () => sonlandir(reject, new Error('IndexedDB açılmadı (zaman aşımı)')),
      OPEN_TIMEOUT_MS
    );

    let req;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      sonlandir(reject, err);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_TIMELINES)) {
        db.createObjectStore(STORE_TIMELINES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_UNIVERSES)) {
        db.createObjectStore(STORE_UNIVERSES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };
    req.onsuccess = () => sonlandir(resolve, req.result);
    req.onerror = () => sonlandir(reject, req.error || new Error('IndexedDB açılamadı'));
    // Başka bir sekmede eski sürüm açık kaldıysa istek süresiz beklerdi.
    req.onblocked = () => sonlandir(reject, new Error('IndexedDB engellendi (başka bir sekme açık olabilir)'));
  });

  // Reddedilen söz KALICI olarak önbelleğe alınmaz: aksi halde ilk hatadan
  // sonra modülün ömrü boyunca herkes aynı hatayı alırdı ve oturum içinde
  // "TEKRAR DENE" hiçbir şeyi değiştiremezdi.
  const sonuc = acilis.catch(err => {
    if (dbPromise === sonuc) dbPromise = null;
    throw err;
  });
  dbPromise = sonuc;
  return sonuc;
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

/* Timeline'lar ve adalar AYNI kayıt biçimini kullanır (id, no, ad, entries) —
   yalnızca ayrı object store'larda dururlar. Bu yüzden erişim bir kez yazılıp
   iki depo için üretiliyor. Yöntem adları store.js'in beklediği arayüz;
   adlandırma timeline'lardan kalma, kayıt biçimi ise ortak. */
function kayitErisimi(storeAdi) {
  return {
    /** Bütün kayıtlar, no sırasına göre. */
    async allTimelines() {
      const db = await openDb();
      const rows = await wrap(tx(db, storeAdi, 'readonly').getAll());
      return rows.sort((a, b) => a.no - b.no);
    },
    async putTimeline(kayit) {
      const db = await openDb();
      await wrap(tx(db, storeAdi, 'readwrite').put(kayit));
    },
    async deleteTimeline(id) {
      const db = await openDb();
      await wrap(tx(db, storeAdi, 'readwrite').delete(id));
    }
  };
}

export const timelineBackend = kayitErisimi(STORE_TIMELINES);
export const universeBackend = kayitErisimi(STORE_UNIVERSES);

export async function getMeta(key) {
  const db = await openDb();
  return wrap(tx(db, STORE_META, 'readonly').get(key));
}

export async function setMeta(key, value) {
  const db = await openDb();
  await wrap(tx(db, STORE_META, 'readwrite').put(value, key));
}
