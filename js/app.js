import { timelineBackend } from './db.js';
import { createStore } from './store.js';
import { createUniverseStore } from './universes.js';
import { createRingScreen } from './ring.js';
import { createTimelineScreen } from './timeline.js';
import { createSphereScreen } from './sphere.js';
import { createUniverseScreen } from './universe.js';
import { createBackupScreen } from './backup-screen.js';
import { requestPersistence, isStandalone } from './platform.js';

const store = createStore(timelineBackend);
const evrenler = createUniverseStore();   // Doodle Sphere'in adaları
const ringRoot = document.getElementById('screen-ring');
const tlRoot   = document.getElementById('screen-timeline');
const sphRoot  = document.getElementById('screen-sphere');
const uvRoot   = document.getElementById('screen-universe');
const bkRoot   = document.getElementById('screen-backup');

/* Ekranlar tek listeden yönetiliyor. Eskiden her göster-fonksiyonu diğer
   ekranları TEK TEK gizliyordu; dördüncü ekran eklenince o kalıpta birini
   unutmak iki ekranın üst üste binmesi demekti. */
const ekranlar = [ringRoot, tlRoot, sphRoot, uvRoot, bkRoot];

function goster(hedef) {
  ekranlar.forEach(e => {
    if (e === hedef) e.removeAttribute('hidden');
    else e.setAttribute('hidden', '');
  });
}

let ring, timeline, sphere, universe, backup;
let acildi = false;      // boot() sonuna kadar geldi mi
let panelGosterildi = false;

function showRing() {
  goster(ringRoot);
  ring.render();
}

function showTimeline(id) {
  goster(tlRoot);
  timeline.open(id);
}

/* Hedeflerin dünyası. Ekranın üstünden sarkan ruhla girilip yine onunla
   çıkılıyor; iki evren arasında tek geçiş noktası var. */
function showSphere() {
  goster(sphRoot);
  sphere.render();
}

/* Bir adanın kapısından içeri: o hedefin notları ve Ink!Sans. */
function showUniverse(id) {
  goster(uvRoot);
  universe.open(id);
}

/* Yedek: çember ekranındaki DATA COMPILATION başlığından açılıyor. */
function showBackup() {
  goster(bkRoot);
  backup.open();
}

/**
 * Açılış başarısız olursa GÖRÜNÜR bir hata paneli çizer.
 * index.html boş <section>'larla geliyor: panel olmazsa kullanıcı sadece
 * koyu degradeyi görür ve "yükleniyor" ile "bozuldu" ayırt edilemez.
 * Hata metni innerHTML ile DEĞİL, textContent ile yazılır.
 */
function acilisBasarisiz(err) {
  if (panelGosterildi) return;
  panelGosterildi = true;
  console.error('açılış başarısız:', err);

  // Yarım kalmış ekranların rAF/interval döngüleri boşuna dönmesin
  try { if (ring) ring.destroy(); } catch (e) { /* yoksay */ }
  try { if (timeline) timeline.destroy(); } catch (e) { /* yoksay */ }
  try { if (sphere) sphere.destroy(); } catch (e) { /* yoksay */ }
  try { if (universe) universe.destroy(); } catch (e) { /* yoksay */ }
  try { if (backup) backup.destroy(); } catch (e) { /* yoksay */ }

  goster(ringRoot);
  ringRoot.style.pointerEvents = '';   // yükleme kilidi kalkmalı ki butona basılabilsin
  ringRoot.textContent = '';           // innerHTML KULLANILMAZ

  const kutu = document.createElement('div');
  kutu.className = 'boot-fail';

  const baslik = document.createElement('div');
  baslik.className = 'boot-fail-title';
  baslik.textContent = 'BAŞLATILAMADI';

  const mesaj = document.createElement('div');
  mesaj.className = 'boot-fail-msg';
  mesaj.textContent = 'Uygulama açılamadı. Notların silinmedi — bu açılışta ' +
                      'telefonun deposu okunamadı. Tekrar dene.';

  const ayrinti = document.createElement('div');
  ayrinti.className = 'boot-fail-detail';
  ayrinti.textContent = String((err && err.message) || err || 'bilinmeyen hata');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'boot-fail-retry';
  btn.textContent = 'TEKRAR DENE';
  btn.addEventListener('click', () => location.reload());

  kutu.appendChild(baslik);
  kutu.appendChild(mesaj);
  kutu.appendChild(ayrinti);
  kutu.appendChild(btn);
  ringRoot.appendChild(kutu);
}

async function boot() {
  /* Service worker EN BAŞTA kaydedilir, store.load()'dan ÖNCE.
     Aksi halde ilk açılıştaki bir veritabanı hatası çevrimdışı önbelleğin
     hiç kurulmaması demekti: sonraki açılış, ağ çalışsa bile aynı şekilde
     başarısız olurdu. */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err =>
      console.warn('service worker kaydedilemedi:', err));
  }

  /* Kabuk veritabanından ÖNCE çizilir: açılışta siyah ekran ile bozulmuş
     ekran kullanıcı gözünde birbirinin aynısıydı. */
  ring = createRingScreen({ root: ringRoot, store, onOpen: showTimeline,
                           onSphere: showSphere, onBackup: showBackup });
  const bosSatir = ringRoot.querySelector('#ringEmpty');
  if (bosSatir) bosSatir.style.display = 'none';  // veri yüklenmeden "hiçbir şey yok" denmez
  ringRoot.style.pointerEvents = 'none';          // yükleme bitmeden yeni timeline açılmasın

  /* İki depo BİRLİKTE yüklenir: ikisi de aynı IndexedDB bağlantısını
     kullanıyor, sıraya dizmek açılışı boşuna uzatırdı. */
  await Promise.all([store.load(), evrenler.load()]);

  ringRoot.style.pointerEvents = '';
  if (bosSatir) bosSatir.style.display = '';
  timeline = createTimelineScreen({ root: tlRoot, store, onBack: showRing });
  sphere = createSphereScreen({ root: sphRoot, evrenler, onBack: showRing, onOpen: showUniverse });
  universe = createUniverseScreen({ root: uvRoot, evrenler, onBack: showSphere });
  backup = createBackupScreen({ root: bkRoot, store, evrenler,
                               onBack: showRing, onRestored: showRing });
  ring.render();
  acildi = true;

  /* Sayfa gizlenirken bekleyen yazma varsa hemen diske yaz.
     Bunlar en kritik yazmalar (uygulama askıya alınmak üzere), bu yüzden
     hataları yutulmaz: gecikmeli yolun kullandığı bildiriciye yönlendirilir,
     kullanıcı KAYDEDİLEMEDİ göstergesini görür. */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'hidden') return;
    store.flush().catch(store.reportError);
    evrenler.flush().catch(evrenler.reportError);
  });
  window.addEventListener('pagehide', () => {
    store.flush().catch(store.reportError);
    evrenler.flush().catch(evrenler.reportError);
  });

  // Kalıcı depolama isteği açılışı bloklamaz ve başarısızlığı açılışı düşürmez.
  requestPersistence()
    .then(({ supported, granted }) =>
      console.log('kalıcı depolama:', { supported, granted, standalone: isStandalone() }))
    .catch(err => console.warn('kalıcı depolama istenemedi:', err));
}

// Ağ: sözü tutulmayan bir hata açılış sırasında olursa ekran boş kalmasın.
window.addEventListener('unhandledrejection', (e) => {
  console.error('yakalanmamış hata:', e.reason);
  if (!acildi) acilisBasarisiz(e.reason);
});

async function start() {
  try {
    await boot();
  } catch (err) {
    acilisBasarisiz(err);
  }
}

start();
