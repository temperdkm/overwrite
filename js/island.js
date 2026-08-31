/* UÇAN ADA + KAPI — Doodle Sphere'deki bir hedefin görünüşü.
   Tamamen SVG olarak çiziliyor: her ekran boyutunda net kalması, kapının
   içindeki ışığın nefes alması ve altındaki taşların ayrı ayrı süzülmesi
   gerekiyor; hazır bir görsel bunların hiçbirini yapamaz.

   REFERANSTAKİ ADA: düz bir tepe yüzeyi, altında kırık yüzeyli, aşağı doğru
   daralan koyu bir kaya. ÇİZGİSİZ — hiçbir yerde kontur yok, biçimi yalnızca
   dolgu renkleri ayırıyor. İlk denemede parlak yeşil çim ve koyu konturlar
   vardı; referansta ikisi de yok. Ada eninden derin de değil: geniş ve sığ.

   İÇERİDE id KULLANILMAZ (gradient/filter tanımı yok). Aynı ada ekranda
   birden çok kez çizildiği için her id sayfada tekrarlanır ve tarayıcı
   hepsini ilkine bağlar; ışıma bu yüzden CSS drop-shadow ile veriliyor.

   Adalar birbirinin AYNISI. Kullanıcı "timeline'ların kendine özgün olması"
   fikrini bıraktı; ayırt edici olan numara ve ad, görünüş değil. */

const CIZIM =
  '<svg class="isle-svg" viewBox="0 0 100 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +

    /* Adadan kopmuş, altında süzülen taşlar */
    '<g class="isle-pebble" style="--sure:5.4s;--gecikme:0s">' +
      '<path d="M15 96 l7-5 6 5-4 7-7 1z" fill="#544A3B"/></g>' +
    '<g class="isle-pebble" style="--sure:6.8s;--gecikme:1.3s">' +
      '<path d="M78 88 l6-4 5 5-4 6-6 1z" fill="#463D30"/></g>' +
    '<g class="isle-pebble" style="--sure:6.1s;--gecikme:2.6s">' +
      '<path d="M57 106 l5-4 5 4-3 5-6 1z" fill="#544A3B"/></g>' +

    /* Kaya gövdesi: geniş, sığ, kırık yüzeyli */
    '<path d="M4 52 L8 66 L4 71 L14 80 L11 88 L21 91 L28 100 L36 93 ' +
            'L44 105 L52 92 L61 97 L66 87 L76 82 L73 75 L84 68 L96 52 Z" fill="#4A4133"/>' +
    /* Işık alan sol yüz — gölge sınırı kontur değil, iki dolgunun sınırı */
    '<path d="M4 52 L8 66 L4 71 L14 80 L11 88 L21 91 L28 100 L36 93 ' +
            'L44 105 L48 96 L48 52 Z" fill="#5C5142"/>' +

    /* Tepe yüzeyi: önce kenarın koyusu, üstüne düzlük. Gövdeden yalnızca
       BİRAZ açık — fark büyük olunca ada mantara benziyordu. */
    '<ellipse cx="50" cy="52" rx="46" ry="8.5" fill="#5E5343"/>' +
    '<ellipse cx="50" cy="50" rx="44.5" ry="7.5" fill="#7A6C57"/>' +

    /* Kapının tepe yüzeyine vuran ışığı — kapı açık, ışık dışarı sızıyor */
    '<ellipse class="isle-spill" cx="50" cy="52" rx="18" ry="5" fill="#FFFFFF"/>' +

    /* KAPI. Eninden UZUN: 30 birim geniş, 46 birim yüksek. İlk halinde
       kemerin yarıçapı genişliğin yarısıydı, kapı boyundan geniş çıkıyor ve
       mezar taşı gibi duruyordu. Kasa koyu bir DOLGU — kontur yok. */
    '<path d="M35 52 L35 21 A15 15 0 0 1 65 21 L65 52 Z" fill="#2E1B10"/>' +
    '<path d="M38 52 L38 22 A12 12 0 0 1 62 22 L62 52 Z" fill="#4A3220"/>' +
    '<g class="isle-light">' +
      '<path d="M40 52 L40 23 A10 10 0 0 1 60 23 L60 52 Z" fill="#E4F2FF"/>' +
      '<path d="M46 52 L46 27 A4 4 0 0 1 54 27 L54 52 Z" fill="#FFFFFF"/>' +
    '</g>' +
    /* Eşik: kapının bir yüzey değil AÇIKLIK olduğunu belli ediyor */
    '<rect x="39" y="51" width="22" height="1.6" fill="#2E1B10"/>' +
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
