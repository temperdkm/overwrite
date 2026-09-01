import { uid } from './store.js';

/* YEDEK — tek dosyada bütün veri.
   Uygulama notların TEK KOPYASI: ana ekrana eklenmiş bir web uygulaması
   iCloud yedeğine girmiyor ve ikon silinirse veri de gidiyor. Bu dosya o
   yüzden süs değil, uygulamanın en önemli parçalarından biri.

   Burada yalnızca SAF MANTIK var — dosya biçimi, doğrulama, temizleme.
   Ekran ve paylaşma işi backup-screen.js'te; böylece biçim testlerle
   kilitlenebiliyor. */

export const BICIM_SURUMU = 1;

/** Bütün veriyi tek bir JSON metnine çevirir. */
export function disaAktar({ timelines, universes, now = () => new Date() }) {
  return JSON.stringify({
    uygulama: 'overwrite',
    surum: BICIM_SURUMU,
    tarih: now().toISOString(),
    timelines,
    universes
  }, null, 1);
}

function metinAl(v) {
  if (typeof v === 'string') return v;
  return v == null ? '' : String(v);
}

function sayiAl(v, varsayilan) {
  return Number.isFinite(v) ? v : varsayilan;
}

/**
 * Tek bir kaydı güvenli hâle getirir.
 * Yedek dosyası DIŞARIDAN geliyor: kullanıcı yanlış dosya seçebilir, dosya
 * bozulmuş olabilir. Alanlar tek tek tipine zorlanıyor ve tanınmayan her şey
 * atılıyor; aksi halde `entries` yerine bir sayı gelen bir dosya uygulamayı
 * açılışta çökertirdi ve elde ne yedek ne de eski veri kalırdı.
 */
function kayitTemizle(k, i) {
  if (!k || typeof k !== 'object' || Array.isArray(k)) {
    throw new Error('Yedek bozuk: kayıt listesinde beklenmeyen bir şey var.');
  }
  const entries = Array.isArray(k.entries) ? k.entries : [];
  return {
    id: metinAl(k.id) || uid(),
    no: sayiAl(k.no, i + 1),
    ad: metinAl(k.ad),
    entries: entries.map((e, j) => ({
      id: metinAl(e && e.id) || uid(),
      sira: sayiAl(e && e.sira, j),
      ad: metinAl(e && e.ad),
      metin: metinAl(e && e.metin),
      olusturma: sayiAl(e && e.olusturma, 0),
      guncelleme: sayiAl(e && e.guncelleme, 0)
    })),
    // Konumsal numaralandırmanın gereği; store.load() zaten yeniden yazacak
    // ama kayıt biçimi tutarlı kalsın diye burada da doğru veriliyor.
    nextSira: entries.length,
    olusturma: sayiAl(k.olusturma, 0),
    guncelleme: sayiAl(k.guncelleme, 0)
  };
}

/**
 * Yedek metnini okur ve doğrular.
 * Hata mesajları KULLANICIYA gösterilecek şekilde yazıldı: "JSON parse error"
 * gibi bir şey kullanıcıya hangi dosyayı seçmesi gerektiğini söylemiyor.
 */
export function iceAktar(metin) {
  let ham;
  try {
    ham = JSON.parse(metin);
  } catch {
    throw new Error('Dosya okunamadı. Bu bir OVERWRITE yedek dosyası değil.');
  }
  if (!ham || typeof ham !== 'object' || Array.isArray(ham)) {
    throw new Error('Dosya okunamadı. Bu bir OVERWRITE yedek dosyası değil.');
  }
  if (ham.uygulama !== 'overwrite') {
    throw new Error('Bu dosya OVERWRITE yedeği değil.');
  }
  if (sayiAl(ham.surum, 0) > BICIM_SURUMU) {
    throw new Error('Bu yedek uygulamanın daha yeni bir sürümünden. Önce uygulamayı güncelle.');
  }
  const timelines = Array.isArray(ham.timelines) ? ham.timelines : [];
  const universes = Array.isArray(ham.universes) ? ham.universes : [];
  return {
    timelines: timelines.map(kayitTemizle),
    universes: universes.map(kayitTemizle),
    tarih: typeof ham.tarih === 'string' ? ham.tarih : null
  };
}

/** Kullanıcıya "içinde ne var" diye göstermek için sayım. */
export function ozet({ timelines, universes }) {
  const topla = (liste) => liste.reduce((t, k) => t + (k.entries ? k.entries.length : 0), 0);
  return {
    timeline: timelines.length,
    universe: universes.length,
    entry: topla(timelines) + topla(universes)
  };
}

/** overwrite-yedek-2026-09-01-0143.json */
export function dosyaAdi(tarih = new Date()) {
  const iki = (n) => String(n).padStart(2, '0');
  return 'overwrite-yedek-' +
    tarih.getFullYear() + '-' + iki(tarih.getMonth() + 1) + '-' + iki(tarih.getDate()) +
    '-' + iki(tarih.getHours()) + iki(tarih.getMinutes()) + '.json';
}
