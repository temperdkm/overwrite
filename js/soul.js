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

      /* İkincil çatlaklar — ruh yalnızca ikiye ayrılmamış, çatlamış.
         Kendi renklerinin koyusu, siyah değil.

         BİLEREK ASİMETRİK. İlk hâlde iki yarımda aynı yükseklikte, birbirinin
         AYNASI iki çatlak vardı; alttaki bağ ipi de baştan aşağı bombeli bir
         yaydı. Üçü birleşince ruhun üstünde iki göz ve bir ağız beliriyordu —
         kalp gülüyor gibi duruyordu. Simetrik işaret çifti + altında yatay yay,
         insanın yüz olarak okuduğu şeyin ta kendisi. Artık sol yarımda iki,
         sağ yarımda bir çatlak var ve hiçbiri diğerinin karşısında değil. */
      '<path d="M6.2 6.8 L8.4 8.6 L7.1 11.2" stroke="#8E1B18" stroke-width=".55" fill="none" stroke-linejoin="round"/>' +
      '<path d="M5.4 13.4 L7.1 14.2" stroke="#8E1B18" stroke-width=".45" fill="none"/>' +
      '<path d="M17.9 11.2 L16.1 13.1 L17.3 15.7" stroke="#4A1F86" stroke-width=".55" fill="none" stroke-linejoin="round"/>' +

      /* ERROR'UN BAĞI — çapraz kesişen ipler.
         Kullanıcı istediği bağlanma biçimini çizerek gösterdi: ipler kalbi
         enlemesine sarmıyor, üst lobların tepesinden başlayıp ortada kesişerek
         alt uca iniyor. Uçlar siluetin BİRAZ DIŞINDA bitiyor — ip arkadan
         dolanıyormuş gibi dursun diye.

         Hepsi ÇAPRAZ: alt yarıda baştan aşağı yatay bir yay yok, çünkü öyle
         bir yay ağza dönüşüyor. NEON YOK: ipin kendi rengi. */
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
