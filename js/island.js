/* UÇAN ADA + ASILI KAĞIT — Doodle Sphere'deki bir hedefin görünüşü.
   Tamamen SVG olarak çiziliyor: her ekran boyutunda net kalması, kopmuş
   taşların ayrı ayrı süzülmesi ve kağıdın parmakla sürüklerken kayması
   gerekiyor; hazır bir görsel bunların hiçbirini yapamaz.

   KAPI YOK. Önce adanın üstünde içinden beyaz ışık sızan bir kapı vardı;
   tamamen kaldırıldı. Yerine, arka plandakilerin aynısı bir kağıt tavandan
   sarkıyor ve Error'un ipleri onu ruhu sardığı gibi sarıyor. Evrene artık
   o kağıttan giriliyor.

   ADA: düz bir tepe yüzeyi, altında kırık yüzeyli, aşağı doğru daralan koyu
   bir kaya. ÇİZGİSİZ — hiçbir yerde kontur yok, biçimi yalnızca dolgu
   renkleri ayırıyor.

   İÇERİDE id KULLANILMAZ (gradient/filter tanımı yok). Aynı ada ekranda
   birden çok kez çizildiği için her id sayfada tekrarlanır ve tarayıcı
   hepsini ilkine bağlar; gölge bu yüzden CSS drop-shadow ile veriliyor.

   Adalar birbirinin AYNISI. Kullanıcı "timeline'ların kendine özgün olması"
   fikrini bıraktı; ayırt edici olan numara ve ad, görünüş değil. */

/* Kağıdın sınırları ve iplerin ne kadar dışına taştığı. */
const SOL = 26, SAG = 74, UST = 20, ALT = 84, TASMA = 3;

/* Sabit tohumlu üretici. Math.random KULLANILMIYOR: sargı bir adaya bir kez
   verilip hep aynı kalmalı, yoksa her yeniden çizimde ipler yerinden zıplar. */
function uretici(tohum) {
  let s = tohum >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* Evren id'sinden sayı — her adanın sargısı kendine özgü ama kalıcı olsun. */
function tohumla(metin) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < metin.length; i++) {
    h ^= metin.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * Error'un bağı — kağıdı saran ipler.
 * Ruhtaki ile aynı mantık: enlemesine kuşak yok, hepsi çapraz ve ortada
 * kesişiyor, uçlar kağıdın kenarının biraz DIŞINDA bitiyor (ip arkadan
 * dolanıyormuş gibi dursun diye).
 *
 * Elle yazılmış altı yol yerine üretiliyor: sabit desen simetrik bir yıldıza
 * benziyordu, elle sarılmış bir ipe değil. Uçlar kenarlarda, kontrol
 * noktaları kağıdın İÇİNDE tutuluyor — böylece rastgelelik ipleri kağıttan
 * fırlatamıyor, yalnızca desenini bozuyor.
 */
function bagYollari(rnd) {
  const yollar = [];
  const ara = (a, b) => a + rnd() * (b - a);
  const n = (v) => v.toFixed(1);

  // Tepeden tabana geçen, dikeye yakın ipler
  for (let i = 0; i < 3; i++) {
    yollar.push('M' + n(ara(SOL + 2, SAG - 2)) + ' ' + (UST - TASMA) +
      ' C ' + n(ara(SOL, SAG)) + ' ' + n(UST + 20) +
      ', ' + n(ara(SOL, SAG)) + ' ' + n(ALT - 20) +
      ', ' + n(ara(SOL + 2, SAG - 2)) + ' ' + (ALT + TASMA));
  }
  // Kenardan kenara geçen, yataya yakın ipler
  for (let i = 0; i < 2; i++) {
    yollar.push('M' + (SOL - TASMA) + ' ' + n(ara(UST + 4, ALT - 4)) +
      ' C ' + n(SOL + 14) + ' ' + n(ara(UST, ALT)) +
      ', ' + n(SAG - 14) + ' ' + n(ara(UST, ALT)) +
      ', ' + (SAG + TASMA) + ' ' + n(ara(UST + 4, ALT - 4)));
  }
  // Köşeden köşeye çaprazlar
  for (let i = 0; i < 2; i++) {
    const solda = rnd() < 0.5;
    yollar.push('M' + (solda ? SOL - TASMA : SAG + TASMA) + ' ' + n(ara(UST - TASMA, UST + 18)) +
      ' C ' + n(ara(SOL, SAG)) + ' ' + n(ara(UST, ALT)) +
      ', ' + n(ara(SOL, SAG)) + ' ' + n(ara(UST, ALT)) +
      ', ' + (solda ? SAG + TASMA : SOL - TASMA) + ' ' + n(ara(ALT - 18, ALT + TASMA)));
  }
  return yollar;
}

function cizim(tohum) {
  const rnd = uretici(tohum);
  return '' +
  '<svg class="isle-svg" viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +

    /* Adadan kopmuş, altında süzülen taşlar */
    '<g class="isle-pebble" style="--sure:5.4s;--gecikme:0s">' +
      '<path d="M15 124 l7-5 6 5-4 7-7 1z" fill="#544A3B"/></g>' +
    '<g class="isle-pebble" style="--sure:6.8s;--gecikme:1.3s">' +
      '<path d="M78 116 l6-4 5 5-4 6-6 1z" fill="#463D30"/></g>' +
    '<g class="isle-pebble" style="--sure:6.1s;--gecikme:2.6s">' +
      '<path d="M57 134 l5-4 5 4-3 5-6 1z" fill="#544A3B"/></g>' +

    /* Kaya gövdesi: geniş, sığ, kırık yüzeyli */
    '<path d="M4 94 L8 106 L4 111 L14 119 L11 126 L21 129 L28 137 L36 131 ' +
            'L44 140 L52 130 L61 134 L66 126 L76 121 L73 115 L84 108 L96 94 Z" fill="#4A4133"/>' +
    /* Işık alan sol yüz — gölge sınırı kontur değil, iki dolgunun sınırı */
    '<path d="M4 94 L8 106 L4 111 L14 119 L11 126 L21 129 L28 137 L36 131 ' +
            'L44 140 L48 132 L48 94 Z" fill="#5C5142"/>' +

    /* Tepe yüzeyi: önce kenarın koyusu, üstüne düzlük. Gövdeden yalnızca
       BİRAZ açık — fark büyük olunca ada mantara benziyordu. */
    '<ellipse cx="50" cy="94" rx="46" ry="8.5" fill="#5E5343"/>' +
    '<ellipse cx="50" cy="92" rx="44.5" ry="7.5" fill="#7A6C57"/>' +

    /* TAVANDAN SARKAN KAĞIT.
       Kendi grubunda duruyor: parmakla sürüklerken ip, kağıt ve saran ipler
       birlikte kayıyor, ada yerinde kalıyor.

       İP EKRANIN TEPESİNE KADAR gidiyor (y = -900 birim, .isle-svg'de
       overflow: visible). Kısa bir ip havada kesiliyordu. Tek bir uzun değer
       yetiyor çünkü #app zaten taşanı kırpıyor: adanın ekranda nerede
       durduğunu hesaplamaya gerek yok, her konumda tepeyi geçiyor.
       Ruhun (z-index 70) arkasından geçiyor, adalar z-index 10'da. */
    '<g class="isle-kagit">' +
      '<line class="isle-ip" x1="50" y1="-900" x2="50" y2="21"/>' +
      '<rect class="isle-yaprak" x="' + SOL + '" y="' + UST + '" ' +
            'width="' + (SAG - SOL) + '" height="' + (ALT - UST) + '"/>' +
      '<g class="isle-bag">' +
        bagYollari(rnd).map(d => '<path d="' + d + '"/>').join('') +
      '</g>' +
    '</g>' +
  '</svg>';
}

/**
 * Bir adanın DOM'unu kurar. Etiket metni SONRA setIslandLabel ile yazılır.
 * @param kimlik  evren id'si — sargı deseninin tohumu. Aynı ada her zaman
 *                aynı sargıyla çizilsin diye kimliğe bağlı.
 */
export function makeIsland(kimlik) {
  const el = document.createElement('div');
  el.className = 'isle';
  el.innerHTML = cizim(tohumla(String(kimlik || '')));   // kullanıcı metni İÇERMEZ

  const etiket = document.createElement('div');
  etiket.className = 'isle-label';
  const no = document.createElement('span');
  no.className = 'isle-no';
  const ad = document.createElement('span');
  ad.className = 'isle-name';
  etiket.appendChild(no);
  etiket.appendChild(ad);
  el.appendChild(etiket);

  return el;
}

/** Numara ve ad — kullanıcı metni, her zaman textContent ile. */
export function setIslandLabel(el, numaraMetni, ad) {
  el.querySelector('.isle-no').textContent = numaraMetni;
  el.querySelector('.isle-name').textContent = ad || '';
}

/* Parmakla sürüklerken kağıdın KAYMASI.
   Ada parmağı takip ederken kağıt TERS yöne kaçıyor: havada asılı bir şey
   taşındığında geride kalır.

   Değer SVG kullanıcı birimi cinsinden (kağıt 48, ada 100 birim eninde), bu
   yüzden sınır dar: kağıt adanın dışına taşmamalı. Dönüş değil ÖTELEME —
   SVG'de dönme merkezini iç içe dönüşümlerde tarayıcılar farklı yorumluyor,
   öteleme her yerde aynı çalışıyor. */
const KAYMA_KATSAYI = 9;
const KAYMA_SINIR = 13;

/**
 * @param el         .isle kök öğesi
 * @param surukleme  kesirli adım kayması; sağa sürüklemek pozitif
 */
export function setIslandDrift(el, surukleme) {
  const ham = -surukleme * KAYMA_KATSAYI;
  const kay = Math.max(-KAYMA_SINIR, Math.min(KAYMA_SINIR, ham));
  el.style.setProperty('--kagit-kay', kay.toFixed(2) + 'px');
}
