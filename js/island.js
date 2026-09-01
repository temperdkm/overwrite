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

const CIZIM =
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

       İP KUTUNUN DIŞINA TAŞIYOR (y = -170). Kısa bir ip havada kesiliyor ve
       kağıt tavandan değil hiçbir yerden sarkıyormuş gibi duruyordu; uzun ip
       arka plandaki ip ormanına karışıp gerçekten yukarıdan geliyor gibi
       oluyor. Taşabilmesi için .isle-svg'de overflow: visible var. */
    '<g class="isle-kagit">' +
      '<line class="isle-ip" x1="50" y1="-170" x2="50" y2="21"/>' +
      '<rect class="isle-yaprak" x="26" y="20" width="48" height="64"/>' +

      /* Error'un bağı — ruhtaki ile aynı mantık: enlemesine kuşak yok,
         hepsi çapraz ve ortada kesişiyor. Uçlar kağıdın kenarının BİRAZ
         DIŞINDA bitiyor, ip arkadan dolanıyormuş gibi dursun diye. */
      '<g class="isle-bag">' +
        '<path d="M28 24 C 40 40, 56 58, 72 80"/>' +
        '<path d="M72 24 C 60 40, 44 58, 28 80"/>' +
        '<path d="M24 42 C 40 51, 60 55, 76 46"/>' +
        '<path d="M24 66 C 40 57, 60 61, 76 70"/>' +
        '<path d="M42 18 C 45 40, 45 62, 43 86"/>' +
        '<path d="M60 18 C 57 40, 57 62, 59 86"/>' +
      '</g>' +
    '</g>' +
  '</svg>';

/** Bir adanın DOM'unu kurar. Etiket metni SONRA setIslandLabel ile yazılır. */
export function makeIsland() {
  const el = document.createElement('div');
  el.className = 'isle';
  el.innerHTML = CIZIM;               // kullanıcı metni İÇERMEZ, sabit çizim

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
