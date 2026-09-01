/* INK!SANS — kapıdan değil, kağıttan girilen evrenin sahibi.
   Referanstaki portreye göre çizildi: büyük yuvarlak kafatası, içe doğru
   eğik iri göz çukurları, küçük üçgen burun, sol yanakta mürekkep sıçraması
   ve boynu saran hacimli kahverengi atkı. Referansta yüz asık; burada
   GÜLÜYOR — kullanıcının isteği.

   Önceki hâli boydan çiziliyordu ve kafası topa benziyordu; bu bir PORTRE:
   kafa, atkı ve omuz. Not ekranında zaten küçük görünüyor, yakın plan olması
   yüzü okunur kılıyor.

   Üç canlandırma var ve üçü de ayrı parçalara ihtiyaç duyuyor — hazır bir
   görsel hiçbirini yapamazdı:
   1. Yazarken ağız oynuyor (iki ağız şekli sırayla).
   2. Boşta arada göz kırpıyor (açık gözler gizlenip kapalı çizgiler beliriyor).
   3. Gözlerindeki mürekkep şekilleri VE renkleri değişiyor (üç şekil sırayla,
      iki göz birbirinden faz kaydırmalı, yani hiç eşleşmiyorlar).

   id KULLANILMIYOR. Ekranda tek Ink var ama kural her yerde aynı: bu çizim
   ileride birden çok kez basılırsa tekrarlanan id'ler sessizce bozulurdu. */

const KONTUR = '#2A2118';
const OYUK = '#241C16';

/** Bir göz çukurunun içindeki üç mürekkep şekli — sırayla görünürler. */
function gozSekilleri(cx, cy, renkler) {
  return '<g transform="translate(' + cx + ' ' + cy + ')">' +
    // 1: baklava
    '<path class="ink-sekil ink-s1" fill="' + renkler[0] + '" ' +
          'd="M0 -4.4 L3.6 0 L0 4.4 L-3.6 0 Z"/>' +
    // 2: dört köşeli yıldız
    '<path class="ink-sekil ink-s2" fill="' + renkler[1] + '" ' +
          'd="M0 -5 C 0.7 -1.4, 1.4 -0.7, 5 0 C 1.4 0.7, 0.7 1.4, 0 5 ' +
             'C -0.7 1.4, -1.4 0.7, -5 0 C -1.4 -0.7, -0.7 -1.4, 0 -5 Z"/>' +
    // 3: daire
    '<circle class="ink-sekil ink-s3" fill="' + renkler[2] + '" r="3.7"/>' +
  '</g>';
}

const CIZIM =
  '<svg class="ink-svg" viewBox="0 0 100 104" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +

    /* Omuz ve palto — atkının altından görünen kadarı */
    '<path d="M0 104 L0 86 C 9 89, 15 96, 18 104 Z" fill="#6E4A2C" stroke="' + KONTUR + '" stroke-width="1.6"/>' +
    '<path d="M100 104 L100 86 C 91 89, 85 96, 82 104 Z" fill="#6E4A2C" stroke="' + KONTUR + '" stroke-width="1.6"/>' +

    /* ATKI — ARKA KAT. Yanlarda çeneye kadar YÜKSELİYOR, ortada çukurlaşıyor:
       boynu saran bir kukuleta gibi. Düz bir kavis olsaydı gövde silueti
       çıkardı, atkı değil. */
    '<path d="M0 104 C 0 82, 5 62, 18 51 C 26 46, 34 54, 37 64 ' +
            'C 42 70, 58 70, 63 64 C 66 54, 74 46, 82 51 C 95 62, 100 82, 100 104 Z" ' +
          'fill="#8E5A2B" stroke="' + KONTUR + '" stroke-width="1.8"/>' +

    /* KAFATASI — atkının arka katının üstünde */
    '<path d="M50 3 C 69 3, 81 17, 81 35 C 81 52, 68 66, 50 66 ' +
            'C 32 66, 19 52, 19 35 C 19 17, 31 3, 50 3 Z" ' +
          'fill="#FDFCF8" stroke="' + KONTUR + '" stroke-width="2"/>' +

    /* GÖZLER — AÇIK hâl. Çukurlar içe doğru eğik: dıştaki uçlar aşağıda,
       içteki uçlar yukarıda. Referanstaki kararlı bakış bundan geliyor. */
    '<g class="ink-goz-acik">' +
      '<ellipse cx="35" cy="33" rx="13" ry="8.4" fill="' + OYUK + '" transform="rotate(-18 35 33)"/>' +
      '<ellipse cx="65" cy="33" rx="13" ry="8.4" fill="' + OYUK + '" transform="rotate(18 65 33)"/>' +
      '<g class="ink-sol">' + gozSekilleri(35, 33, ['#F2C14E', '#4FB0E8', '#E85A6B']) + '</g>' +
      '<g class="ink-sag">' + gozSekilleri(65, 33, ['#5CC98C', '#C77DFF', '#F2A03D']) + '</g>' +
    '</g>' +

    /* GÖZLER — KAPALI hâl. Yalnızca göz kırparken beliriyor. */
    '<g class="ink-goz-kapali">' +
      '<path d="M24 32 Q 35 27, 46 36" stroke="' + OYUK + '" stroke-width="2.6" ' +
            'fill="none" stroke-linecap="round"/>' +
      '<path d="M54 36 Q 65 27, 76 32" stroke="' + OYUK + '" stroke-width="2.6" ' +
            'fill="none" stroke-linecap="round"/>' +
    '</g>' +

    /* Burun */
    '<path d="M46.5 40 L53.5 40 L50 48 Z" fill="' + OYUK + '"/>' +

    /* AĞIZ. İki hâl üst üste; konuşurken CSS ikisini sırayla gösteriyor.
       Referansta yüz asık, burada gülüyor — kavis yukarı bakıyor. */
    '<path class="ink-agiz-kapali" d="M39 51 Q 50 61 61 51" ' +
          'stroke="' + OYUK + '" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
    '<path class="ink-agiz-acik" d="M39 50 Q 50 64 61 50 Q 50 57 39 50 Z" fill="' + OYUK + '"/>' +

    /* Sol yanaktaki mürekkep sıçraması */
    '<path d="M26 43 C 30 41, 33 44, 32 48 C 31 52, 26 53, 24 50 C 22 47, 23 44, 26 43 Z" ' +
          'fill="' + OYUK + '"/>' +
    '<circle cx="35.5" cy="42" r="1.5" fill="' + OYUK + '"/>' +
    '<circle cx="34.5" cy="50" r="1.9" fill="' + OYUK + '"/>' +
    '<circle cx="21.5" cy="41" r="1.2" fill="' + OYUK + '"/>' +
    '<circle cx="37" cy="46.5" r="1" fill="' + OYUK + '"/>' +

    /* ATKI — ÖN KAT, kafatasının ÜSTÜNE çiziliyor.
       Üst kenarı bir U: ortada çenenin ALTINDA kalıyor (ağız ve çene açıkta),
       yanlarda yanakların hizasına kadar YÜKSELİP kafatasının siluetini
       örtüyor. Atkıyı gövdeden ayıran şey bu — hepsi kafanın arkasında
       kalınca kazak, ortadan çeneyi örtünce ağzı yutan bir yaka oluyordu.
       İki kat üst üste ve ikisinin de konturu var; aradaki fark kıvrılıp
       katlanan kenarı gösteriyor. */
    '<path d="M6 104 C 8 80, 14 56, 26 50 C 33 47, 36 60, 40 70 ' +
            'C 44 74, 56 74, 60 70 C 64 60, 67 47, 74 50 C 86 56, 92 80, 94 104 Z" ' +
          'fill="#B87A42" stroke="' + KONTUR + '" stroke-width="1.6"/>' +
    '<path d="M15 104 C 17 82, 22 61, 31 56 C 37 54, 40 65, 43 73 ' +
            'C 46 77, 54 77, 57 73 C 60 65, 63 54, 69 56 C 78 61, 83 82, 85 104 Z" ' +
          'fill="#D9A268" stroke="' + KONTUR + '" stroke-width="1.4"/>' +
    '<path d="M28 82 C 30 90, 31 97, 30 104" stroke="' + KONTUR + '" stroke-width="1.3" ' +
          'fill="none" opacity=".4"/>' +
    '<path d="M72 82 C 70 90, 69 97, 70 104" stroke="' + KONTUR + '" stroke-width="1.3" ' +
          'fill="none" opacity=".4"/>' +
  '</svg>';

/** Ink'in DOM'unu kurar. */
export function makeInk() {
  const el = document.createElement('div');
  el.className = 'ink';
  el.innerHTML = CIZIM;               // kullanıcı metni İÇERMEZ, sabit çizim
  return el;
}

/**
 * Konuşma hâlini açıp kapatır. Yazarken açılır, yazı durunca kapanır —
 * çağıran taraf gecikmeyi kendisi yönetiyor.
 */
export function inkKonusuyor(el, aktif) {
  el.classList.toggle('konusuyor', !!aktif);
}
