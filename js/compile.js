import { roman } from './roman.js';

/* Bir timeline'ı telefondan dışarı, okunabilir düz metin olarak çıkarır.
   JSON değil düz metin: dosya doğrudan okunacak (bir sohbete yapıştırılacak
   ya da bilgisayarda açılacak), JSON'un süslü parantezleri gürültü olurdu. */

/** Roma rakamı; bozuk bir numara yüzünden dışa aktarma patlamasın. */
function numara(no) {
  try { return roman(no); } catch { return String(no); }
}

/** Timeline'ı düz metne çevirir. */
export function timelineMetni(tl) {
  const satir = [];
  const ad = (tl.ad || '').trim();
  satir.push('TIMELINE ' + numara(tl.no) + (ad ? ' — ' + ad : ''));

  const n = tl.entries.length;
  satir.push(n + (n === 1 ? ' ENTRY' : ' ENTRIES'));

  if (!n) {
    satir.push('');
    satir.push('(bu timeline boş)');
    return satir.join('\n');
  }

  tl.entries.forEach(en => {
    const eAd = (en.ad || '').trim();
    const metin = (en.metin || '').trim();
    satir.push('');
    satir.push('');
    satir.push('ENTRY ' + en.sira + (eAd ? ' — ' + eAd : ''));
    satir.push(metin || '(boş)');
  });

  return satir.join('\n');
}

/** Dosya adı: hangi timeline olduğu bilgisayarda da anlaşılsın diye adı taşır. */
export function dosyaAdi(tl) {
  const ad = (tl.ad || '').trim()
    .replace(/[\\/:*?"<>|]/g, '')   // dosya adında yasak karakterler
    .replace(/\s+/g, ' ')
    .slice(0, 40)
    .trim();
  return 'OVERWRITE ' + numara(tl.no) + (ad ? ' - ' + ad : '') + '.txt';
}

/**
 * Timeline'ı iOS paylaş menüsüne verir.
 * DOSYA olarak paylaşmak şart: düz metin paylaşımında iOS "Dosyalara Kaydet"
 * seçeneğini SUNMUYOR, yalnızca Mesajlar/Mail/Kopyala çıkıyor — yani OneDrive'a
 * kaydedilemiyor. Dosya paylaşımı desteklenmezse metne, o da yoksa panoya düşer.
 * Dönüş: 'dosya' | 'metin' | 'pano' | 'iptal'
 */
export async function timelinePaylas(tl) {
  const metin = timelineMetni(tl);
  const ad = dosyaAdi(tl);

  try {
    if (typeof File !== 'undefined' && navigator.canShare) {
      const dosya = new File([metin], ad, { type: 'text/plain' });
      if (navigator.canShare({ files: [dosya] })) {
        await navigator.share({ files: [dosya] });
        return 'dosya';
      }
    }
    if (navigator.share) {
      await navigator.share({ title: ad, text: metin });
      return 'metin';
    }
  } catch (err) {
    // Kullanıcı paylaş menüsünü kapattıysa bu hata değil.
    if (err && err.name === 'AbortError') return 'iptal';
    throw err;
  }

  await navigator.clipboard.writeText(metin);
  return 'pano';
}
