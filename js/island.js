/* UÇAN ADA + KAPI — Doodle Sphere'deki bir hedefin görünüşü.
   Tamamen SVG olarak çiziliyor: her ekran boyutunda net kalması, kapının
   içindeki ışığın nefes alması ve altındaki taşların ayrı ayrı süzülmesi
   gerekiyor; hazır bir görsel bunların hiçbirini yapamaz.

   İÇERİDE id KULLANILMAZ (gradient/filter tanımı yok). Aynı ada ekranda
   birden çok kez çizildiği için her id sayfada tekrarlanır ve tarayıcı
   hepsini ilkine bağlar; ışıma bu yüzden CSS drop-shadow ile veriliyor.

   Adalar birbirinin AYNISI. Kullanıcı "timeline'ların kendine özgün olması"
   fikrini bıraktı; ayırt edici olan numara ve ad, görünüş değil. */

const CIZIM =
  '<svg class="isle-svg" viewBox="0 0 100 132" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +

    /* Adanın altında süzülen kopmuş taşlar */
    '<g class="isle-pebble" style="--sure:5.4s;--gecikme:0s">' +
      '<path d="M18 118 l6-4 5 4-3 6-6 1z" fill="#7A5B40"/></g>' +
    '<g class="isle-pebble" style="--sure:6.8s;--gecikme:1.3s">' +
      '<path d="M74 108 l5-3 4 4-3 5-5 1z" fill="#6B4E36"/></g>' +
    '<g class="isle-pebble" style="--sure:6.1s;--gecikme:2.6s">' +
      '<path d="M55 126 l4-3 4 3-2 4-5 1z" fill="#7A5B40"/></g>' +

    /* Kaya gövdesi: aşağı doğru daralan, kırık yüzeyli bir parça */
    '<path d="M7 52 L12 74 L7 82 L19 94 L15 103 L27 109 L33 121 L42 113 ' +
            'L50 130 L58 111 L68 117 L72 103 L83 95 L79 85 L89 75 L93 52 Z" fill="#6B4E36"/>' +
    /* Işık alan sol yüz */
    '<path d="M7 52 L12 74 L7 82 L19 94 L15 103 L27 109 L33 121 L42 113 ' +
            'L50 130 L50 52 Z" fill="#8A6A4C"/>' +
    '<path d="M23 60 L27 76 L22 87" stroke="#4E3826" stroke-width="1.4" fill="none" stroke-linecap="round"/>' +
    '<path d="M67 59 L63 73 L69 85" stroke="#4E3826" stroke-width="1.2" fill="none" stroke-linecap="round"/>' +

    /* Çim: koyu kenar, üstünde açık yüzey */
    '<ellipse cx="50" cy="52" rx="43" ry="10" fill="#4E7C1E"/>' +
    '<ellipse cx="50" cy="50" rx="42" ry="9" fill="#8CC63F"/>' +
    '<path d="M13 47 l2-6 2 6z M23 44 l2-5 2 5z M78 45 l2-6 2 6z M87 48 l2-5 2 5z" fill="#5E9425"/>' +

    /* Kapının çime vuran ışığı — kapı açık, ışık dışarı sızıyor */
    '<ellipse class="isle-spill" cx="50" cy="53" rx="18" ry="5" fill="#FFFFFF"/>' +

    /* KAPI. Eninden UZUN: 26 birim geniş, 44 birim yüksek. İlk denemede
       kemerin yarıçapı genişliğin yarısı kadardı ve kapı boyundan geniş
       çıkıyordu — insan girebileceği bir kapı değil, mezar taşı gibi
       duruyordu. Oran ~1.7:1 olunca kapı gibi okunuyor.
       Kasa koyu, içi beyaz ışık; eşikteki koyu çizgi ise kapının bir
       YÜZEY değil bir AÇIKLIK olduğunu belli ediyor. */
    '<path d="M35 52 L35 21 A15 15 0 0 1 65 21 L65 52 Z" fill="#2E1B10" stroke="#170B04" stroke-width="1.2"/>' +
    '<path d="M38 52 L38 22 A12 12 0 0 1 62 22 L62 52" stroke="#6B4A31" stroke-width=".9" fill="none"/>' +
    '<g class="isle-light">' +
      '<path d="M40 52 L40 23 A10 10 0 0 1 60 23 L60 52 Z" fill="#E4F2FF"/>' +
      '<path d="M46 52 L46 27 A4 4 0 0 1 54 27 L54 52 Z" fill="#FFFFFF"/>' +
    '</g>' +
    '<path d="M40 52 L60 52" stroke="#170B04" stroke-width="1.1" stroke-linecap="round"/>' +
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
