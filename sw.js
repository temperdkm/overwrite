/* ⚠ HER YAYINDA (git push) BU SÜRÜM NUMARASI ARTIRILACAK — aksi halde kurulu
   uygulama mevcut sürümünde DONAR: fetch her şeyde önce önbelleğe bakar ve yeni
   service worker yalnızca sw.js'in kendi baytları değişince kurulur, yani
   telefondaki uygulamaya değişen js/css dosyaları hiç ulaşmaz. */
const CACHE = 'overwrite-v20';
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
  './css/soul.css',
  './css/sphere.css',
  './css/universe.css',
  './css/backup.css',
  './js/app.js',
  './js/roman.js',
  './js/ring-math.js',
  './js/db.js',
  './js/store.js',
  './js/universes.js',
  './js/drag-ring.js',
  './js/editable.js',
  './js/glitch.js',
  './js/ring.js',
  './js/timeline.js',
  './js/dissolve.js',
  './js/soul.js',
  './js/sphere.js',
  './js/sphere-bg.js',
  './js/island.js',
  './js/ink.js',
  './js/universe.js',
  './js/backup.js',
  './js/backup-screen.js',
  './js/platform.js',
  './fonts/PressStart2P-latin.woff2',
  './fonts/PressStart2P-latin-ext.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* addAll KULLANILMAZ: listedeki tek bir dosya bile 404 verirse
   kurulumun tamamı başarısız olur ve çevrimdışı çalışma hiç kurulmaz.
   Her dosya tek tek ve hatası yutularak önbelleğe alınır; böylece ileride
   listeye eklenip henüz yazılmamış bir dosya bütün kurulumu düşürmez.

   cache: 'reload': istek tarayıcının KENDİ HTTP önbelleğini atlar. GitHub
   Pages dosyaları 10 dakika boyunca önbelleklettiği için, sürüm artırılıp
   yeniden kurulsa bile eski baytlar service worker önbelleğine kopyalanabilirdi. */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(
        ASSETS.map(url => c.add(new Request(url, { cache: 'reload' })).catch(err => {
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
      /* Sadece başarılı yanıtlar önbelleğe alınır: fetch() ağ hatasında reddeder
         ama 404/500 gibi HTTP hatalarında normal şekilde çözülür (res.ok === false).
         Kontrol olmazsa bir hata sayfası sonsuza dek (CACHE sürümü değişene kadar)
         önbellekten sunulurdu. */
      if (res.ok) caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(err => {
      /* index.html'e düşüş sadece sayfa navigasyonları içindir. Aksi halde
         önbellekte olmayan bir modül isteği (örn. henüz cache'lenmemiş bir
         Task 12/13 dosyası) HTML içeriğiyle çözülür ve modül değerlendirmesi
         bütünüyle bozulur — boş ekran hatasının asıl sebebi budur. */
      if (e.request.mode === 'navigate') return caches.match('./index.html');
      throw err;
    }))
  );
});
