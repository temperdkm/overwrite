import { fireGlitch } from './glitch.js';

/* Ekranın üstünden mavi bir iple sarkan, iki parçalı ruh.
   İki dünya arasındaki kapı: OVERWRITE'ta dokununca Doodle Sphere'e,
   orada dokununca geri getirir.

   Kanona dayanıyor: Error topladığı ruhları Doodle Sphere'in "tavanına"
   ipleriyle asıyor.

   Neden SVG ve neden parça parça: ruh sallanıyor, glitch'leniyor ve iple
   birlikte hareket ediyor. Hazır bir görselin ne ipi ayrı oynayabilir ne de
   şeritlere bölünüp kayabilirdi. Ayrıca birkaç kilobayt tutuyor, her ekran
   boyutunda net kalıyor ve çevrimdışı çalışmayı etkilemiyor. */

/* İki YARIM kalp ayrı yol olarak çiziliyor; tek yolu clipPath ile bölmek
   id gerektirir ve ruh 6 kopya halinde çizildiği için (glitch şeritleri)
   aynı id sayfada 6 kez tekrarlanırdı. */
const SOL  = 'M12 5.7 C 11.2 4.1, 9.5 3, 7.5 3 C 4.4 3, 2 5.4, 2 8.5 C 2 14.5, 12 21, 12 21 Z';
const SAG  = 'M12 5.7 C 12.8 4.1, 14.5 3, 16.5 3 C 19.6 3, 22 5.4, 22 8.5 C 22 14.5, 12 21, 12 21 Z';
const TAM  = SOL + ' ' + SAG;

function ruhSvg() {
  return '' +
    '<svg class="soul-svg" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="' + SOL + '" fill="#E0392F"/>' +
      '<path d="' + SAG + '" fill="#7B3FD4"/>' +
      // Ruhu saran ipler — Error'un onu bağlayışı
      '<g stroke="#2FA8E8" stroke-width=".7" fill="none" opacity=".85">' +
        '<path d="M3 9 C 8 12, 16 6, 21 9"/>' +
        '<path d="M4 13 C 9 16, 15 10, 20 13"/>' +
      '</g>' +
      '<path d="' + TAM + '" fill="none" stroke="#2A1030" stroke-width="1.1"/>' +
    '</svg>';
}

/**
 * Sarkan ruhu üretir.
 * onTap: ruha dokunulduğunda çağrılır.
 * Dönen nesnenin destroy()'u zamanlayıcıyı temizler.
 */
export function makeSoul({ onTap, label }) {
  const kok = document.createElement('div');
  kok.className = 'soul-hang';

  const ip = document.createElement('div');
  ip.className = 'soul-string';
  kok.appendChild(ip);

  /* Glitch için buton bileşeninin .gb yapısı aynen kullanılıyor: bir asıl
     kopya ve clip-path ile yatay şeritlere bölünmüş beş kopya. Şeritler aynı
     CSS'ten besleniyor, yeni bir glitch uygulaması yazılmıyor. */
  const gb = document.createElement('div');
  gb.className = 'gb soul-gb';
  gb.setAttribute('role', 'button');
  gb.setAttribute('tabindex', '0');
  gb.setAttribute('aria-label', label);

  const asil = document.createElement('div');
  asil.className = 'base soul-art';
  asil.innerHTML = ruhSvg();
  gb.appendChild(asil);

  for (let i = 1; i <= 5; i++) {
    const s = document.createElement('div');
    s.className = 'slice s' + i + ' soul-art';
    s.innerHTML = ruhSvg();
    gb.appendChild(s);
  }

  const bas = (e) => { e.preventDefault(); fireGlitch(gb); onTap(); };
  gb.addEventListener('click', bas);
  gb.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') bas(e);
  });

  kok.appendChild(gb);

  // Kendiliğinden bozulsun; ekran gizliyken boşuna çalışmasın.
  const timer = setInterval(() => {
    if (!kok.closest('.screen[hidden]')) fireGlitch(gb);
  }, 4200);

  return {
    el: kok,
    destroy() { clearInterval(timer); }
  };
}
