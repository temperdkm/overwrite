/* UYGULAMANIN KENDİNİ GÜNCELLEMESİ.

   iOS'ta ana ekran uygulamasını kapatıp açmak çoğu zaman sayfayı yeniden
   YÜKLEMİYOR — askıya alınmış sayfa geri geliyor. Yeni bir gezinme olmadığı
   için tarayıcı sw.js'in değişip değişmediğini hiç kontrol etmiyor. Uygulama
   çevrimdışı da kusursuz çalıştığından, kullanıcı eski sürümde süresiz
   kalabiliyor ve bunu anlamasının bir yolu da yok.

   Bu yüzden iki şey gerekiyor:
   1. Uygulama her ÖNE GELDİĞİNDE güncelleme var mı diye kendisi sorsun.
   2. Yeni service worker devraldığı an sayfa kendini yenilesin — service
      worker değişse bile ekrandaki sayfa hâlâ eski dosyalarla çalışıyor. */

// Öne her gelişte ağa çıkmamak için: en fazla dakikada bir kontrol.
const KONTROL_ARALIGI_MS = 60000;

/**
 * @param oncesindeYaz  Yenilemeden hemen önce çağrılır; bekleyen yazmaları
 *                      diske geçirmek için. Yazılmamış bir harf bile
 *                      kaybolmamalı.
 */
export function kurGuncelleme({ oncesindeYaz }) {
  if (!('serviceWorker' in navigator)) return;

  /* Sayfa açılırken ortada zaten bir service worker var mıydı? İlk kurulumda
     da controllerchange tetikleniyor; orada yenilemek gereksiz bir çift
     açılış demek olurdu. */
  const oncedenVardi = !!navigator.serviceWorker.controller;
  let yenileniyor = false;

  navigator.serviceWorker.addEventListener('controllerchange', async () => {
    if (!oncedenVardi || yenileniyor) return;
    yenileniyor = true;
    try {
      await oncesindeYaz();
    } catch (err) {
      console.error('yenilemeden önce kaydedilemedi:', err);
    }
    location.reload();
  });

  let sonKontrol = 0;
  navigator.serviceWorker.register('./sw.js').then((reg) => {
    const kontrolEt = () => {
      const simdi = Date.now();
      if (simdi - sonKontrol < KONTROL_ARALIGI_MS) return;
      sonKontrol = simdi;
      reg.update().catch(err => console.warn('güncelleme kontrolü başarısız:', err));
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') kontrolEt();
    });
    window.addEventListener('focus', kontrolEt);
  }).catch(err => console.warn('service worker kaydedilemedi:', err));
}

/**
 * Şu an sayfaya hizmet eden service worker'ın sürümünü sorar.
 * Kullanıcı "güncellendi mi" diye sorduğunda tahmin etmek yerine bakabilsin
 * diye var. Denetleyen bir service worker yoksa (ilk açılış, desteklenmiyor)
 * null döner.
 */
export function aktifSurum(zamanAsimiMs = 1500) {
  return new Promise((resolve) => {
    const sw = navigator.serviceWorker;
    if (!sw || !sw.controller) { resolve(null); return; }

    let bitti = false;
    const dinle = (e) => {
      if (e.data && e.data.surum) sonlandir(e.data.surum);
    };
    const sonlandir = (deger) => {
      if (bitti) return;
      bitti = true;
      sw.removeEventListener('message', dinle);
      resolve(deger);
    };

    sw.addEventListener('message', dinle);
    // Yanıt gelmezse söz sonsuza dek beklemesin.
    setTimeout(() => sonlandir(null), zamanAsimiMs);
    sw.controller.postMessage('surum');
  });
}
