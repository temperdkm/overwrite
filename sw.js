const CACHE = 'overwrite-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/base.css',
  './css/glitch.css',
  './css/sheets.css',
  './css/screens.css',
  './css/dissolve.css',
  './js/app.js',
  './js/roman.js',
  './js/ring-math.js',
  './js/db.js',
  './js/store.js',
  './js/editable.js',
  './js/glitch.js',
  './js/ring.js',
  './js/timeline.js',
  './js/dissolve.js',
  './js/backup.js',
  './js/platform.js',
  './fonts/PressStart2P-latin.woff2',
  './fonts/PressStart2P-latin-ext.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* addAll KULLANILMAZ: listedeki tek bir dosya bile 404 verirse
   kurulumun tamamı başarısız olur ve çevrimdışı çalışma hiç kurulmaz.
   Bu liste henüz yazılmamış dosyaları da içeriyor (dissolve.js Task 12'de,
   backup.js Task 13'te geliyor), o yüzden her dosya tek tek ve
   hatası yutularak önbelleğe alınır. */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(
        ASSETS.map(url => c.add(url).catch(err => {
          console.warn('önbelleğe alınamadı (atlandı):', url, err.message);
        }))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
