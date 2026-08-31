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

/* RUH TEK BİR KIRIKLA İKİYE AYRILMIŞ.
   Ayrım düz bir çizgi değil TESTERE DİŞLİ: iki yarımın kenarları birbirine
   geçen kırık bir hat izliyor. Ama araları AÇIK DEĞİL — kırık tam oturuyor.

   Bunu boşluksuz yapmanın yolu iki yarımı yan yana koymak değil: iki dolgu
   yan yana geldiğinde kenar yumuşatma yüzünden aralarında saç teli inceliğinde
   bir çizgi kalır. Onun yerine önce BÜTÜN kalp kırmızı çiziliyor, üstüne
   yalnızca sağ yarım moruyla basılıyor. Böylece sınır tek bir şeklin kenarı
   oluyor ve dikiş izi hiç oluşmuyor.

   (Daha önce iki yarımın çatlak hattı 0.3 birim ayrılıp aradan koyu bir dolgu
   gösteriliyordu; kullanıcı çatlağın tam birleşmesini istedi. Yarımların
   üstündeki ikincil çatlaklar da kaldırıldı — yalnızca ortadaki kırık kaldı.)

   Yol tek parça olarak çiziliyor; clipPath ile bölmek id gerektirir ve ruh
   6 kopya halinde çizildiği için (glitch şeritleri) aynı id sayfada 6 kez
   tekrarlanır, tarayıcı hepsini ilkine bağlardı. */

// Kırığın hattı: çentikten (12, 5.7) alttaki sivri uca (12, 21).
const KIRIK = 'L10.4 8.2 L13.2 10.6 L10.2 13.4 L13 16.2 L11.2 18.4 L12 21';

// Bütün kalp — alt katman.
const TAM =
  'M12 5.7 C 11.2 4.1, 9.5 3, 7.5 3 C 4.4 3, 2 5.4, 2 8.5 C 2 14.5, 12 21, 12 21 ' +
  'C 12 21, 22 14.5, 22 8.5 C 22 5.4, 19.6 3, 16.5 3 C 14.5 3, 12.8 4.1, 12 5.7 Z';

/* Sağ yarım: çentikten kırık boyunca aşağı, sonra sağ dış hattan geri yukarı.
   Dış hat uçtan çentiğe doğru, yani ters yönde çiziliyor. */
const SAG =
  'M12 5.7 ' + KIRIK + ' ' +
  'C 12 21, 22 14.5, 22 8.5 C 22 5.4, 19.6 3, 16.5 3 C 14.5 3, 12.8 4.1, 12 5.7 Z';

function ruhSvg() {
  return '' +
    '<svg class="soul-svg" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="' + TAM + '" fill="#E0392F"/>' +
      '<path d="' + SAG + '" fill="#7B3FD4"/>' +

      /* ERROR'UN BAĞI — çapraz kesişen ipler.
         Kullanıcı istediği bağlanma biçimini çizerek gösterdi: ipler kalbi
         enlemesine sarmıyor, üst lobların tepesinden başlayıp ortada kesişerek
         alt uca iniyor. Uçlar siluetin BİRAZ DIŞINDA bitiyor — ip arkadan
         dolanıyormuş gibi dursun diye.

         Hepsi ÇAPRAZ. Alt yarıda baştan aşağı yatay bir yay YOK: bir yay ve
         üstünde simetrik iki işaret olunca ruhun üstünde gülen bir yüz
         beliriyordu. NEON YOK: ipin kendi rengi. */
      '<g stroke="#2FA8E8" stroke-width=".68" fill="none" stroke-linecap="round" opacity=".95">' +
        '<path d="M4.4 3.4 C 7.5 9, 11 15, 14.6 20.6"/>' +
        '<path d="M19 3.1 C 16.5 9, 12 15.2, 7.8 18.6"/>' +
        '<path d="M2.5 9.4 C 7 13, 14 16.4, 19.8 15.2"/>' +
        '<path d="M3.4 14.8 C 9 11.6, 15.6 8.6, 20.8 10.4"/>' +
        '<path d="M9.4 3.3 C 12.4 9, 12.8 15, 12.2 21"/>' +
        '<path d="M15.4 3.6 C 15 8, 13.4 13, 8.9 18.4"/>' +
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
