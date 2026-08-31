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

/* RUH KIRIK, İKİYE BÖLÜNMÜŞ DEĞİL.
   İlk hâlde iki yarım düz bir çizgiyle ayrılıyordu ve ruh "ortadan kesilmiş"
   gibi duruyordu. Ayrım artık TESTERE DİŞLİ: iki yarımın kenarları birbirine
   geçen kırık bir hat izliyor.

   Aynı kırık hattın iki kopyası var — biri 0.3 birim solda, biri 0.3 birim
   sağda. Aradaki ince boşluk çatlağın kendisi; altında duran koyu dolgu
   oradan görünüyor, böylece çatlağın derinliği oluyor. Uçlar (üstteki çentik
   ve alttaki sivri uç) KAYDIRILMIYOR: çatlak iki uçta kapanıp ortada
   açılıyor, gerçek bir kırık gibi.

   İki yarım ayrı yol olarak çiziliyor; tek yolu clipPath ile bölmek id
   gerektirir ve ruh 6 kopya halinde çizildiği için (glitch şeritleri) aynı
   id sayfada 6 kez tekrarlanır, tarayıcı hepsini ilkine bağlardı. */

// Sol yarımın sağ kenarı (çatlağın sol dudağı)
const CATLAK_SOL = 'L10.1 8.2 L12.9 10.6 L9.9 13.4 L12.7 16.2 L10.9 18.4 L12 21';
// Sağ yarımın sol kenarı (çatlağın sağ dudağı)
const CATLAK_SAG = 'L10.7 8.2 L13.5 10.6 L10.5 13.4 L13.3 16.2 L11.5 18.4 L12 21';

// Kalbin dış hatları — uçtan çentiğe doğru, yani ters yönde çiziliyor;
// çatlak yukarıdan aşağı gittiği için kapanan yol böyle tamamlanıyor.
const DIS_SOL = 'C 12 21, 2 14.5, 2 8.5 C 2 5.4, 4.4 3, 7.5 3 C 9.5 3, 11.2 4.1, 12 5.7 Z';
const DIS_SAG = 'C 12 21, 22 14.5, 22 8.5 C 22 5.4, 19.6 3, 16.5 3 C 14.5 3, 12.8 4.1, 12 5.7 Z';

const SOL = 'M12 5.7 ' + CATLAK_SOL + ' ' + DIS_SOL;
const SAG = 'M12 5.7 ' + CATLAK_SAG + ' ' + DIS_SAG;

/* Çatlağın içi: iki dudağın arasında kalan şerit. Sağ dudak aşağı, sol dudak
   yukarı doğru çizilip kapatılıyor. Yarımların ALTINDA durduğu için yalnızca
   aradaki boşluktan görünür. */
const CATLAK_ICI =
  'M12 5.7 L10.7 8.2 L13.5 10.6 L10.5 13.4 L13.3 16.2 L11.5 18.4 L12 21 ' +
  'L10.9 18.4 L12.7 16.2 L9.9 13.4 L12.9 10.6 L10.1 8.2 Z';

function ruhSvg() {
  return '' +
    '<svg class="soul-svg" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="' + CATLAK_ICI + '" fill="#3D0A18"/>' +
      '<path d="' + SOL + '" fill="#E0392F"/>' +
      '<path d="' + SAG + '" fill="#7B3FD4"/>' +

      /* Yarımların üstündeki ikincil çatlaklar — ruh yalnızca ikiye
         ayrılmamış, çatlamış. Kendi renklerinin koyusu, siyah değil. */
      '<path d="M6.4 7.4 L8.2 9.1 L6.9 11.3" stroke="#8E1B18" stroke-width=".55" fill="none" stroke-linejoin="round"/>' +
      '<path d="M7.9 14.4 L9.6 15.6" stroke="#8E1B18" stroke-width=".45" fill="none"/>' +
      '<path d="M17.4 7.9 L15.7 9.4 L17.1 11.6" stroke="#4A1F86" stroke-width=".55" fill="none" stroke-linejoin="round"/>' +
      '<path d="M16.2 14.6 L14.5 15.7" stroke="#4A1F86" stroke-width=".45" fill="none"/>' +

      /* Error'un bağı: SIKI bir sargı. Beş kuşak gövdeyi sararken hafifçe
         aşağı bel veriyor (yuvarlak bir cismin etrafından dolanan ip böyle
         görünür), iki dikey ip de kuşakları birbirine bağlıyor. Tek tek
         gevşek çizgiler yerine bir ağ oluşturuyor.
         NEON YOK: ipin kendi rengi, ışıma eklenmiyor. */
      '<g stroke="#2FA8E8" stroke-width=".6" fill="none" stroke-linecap="round" opacity=".92">' +
        '<path d="M2.2 8 Q 12 8.9 21.8 8"/>' +
        '<path d="M2.4 11 Q 12 11.9 21.6 11"/>' +
        '<path d="M4.2 13.8 Q 12 14.7 19.8 13.8"/>' +
        '<path d="M6.4 16.4 Q 12 17.2 17.6 16.4"/>' +
        '<path d="M9.2 18.8 Q 12 19.5 14.8 18.8"/>' +
        '<path d="M7.5 4.8 C 6.6 9, 8.6 15, 11.4 20.1"/>' +
        '<path d="M16.5 4.8 C 17.4 9, 15.4 15, 12.6 20.1"/>' +
      '</g>' +
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
