/* DOODLE SPHERE'İN ARKA PLANI — tavandan sarkan kağıtlar.
   Adaların ARKASINDA duran manzara; dokunulmaz, tıklanmaz.

   Kağıtlar YUKARIDAN AŞAĞI sarkıyor: her biri ekranın üst kenarından inen
   uzun bir ipin ucunda. (İlk denemede gerili yatay iplere asılıydılar; asıl
   görüntüde ipler tavandan dikey iniyor.)

   Derinlik ip boyuyla değil BOYUT ve SOLUKLUKLA veriliyor: uzaktakiler
   küçük, sarıya çalan ve saydam; öndekiler büyük ve bembeyaz. Ekranın
   üstünden taşan büyük kağıtlar odanın devam ettiğini hissettiriyor.

   HİÇBİR YERDE IŞIMA YOK — ipler kendi renginde, düz mavi. */

const SVG_NS = 'http://www.w3.org/2000/svg';
const GENISLIK = 400, YUKSEKLIK = 700;

/* Derinlik katmanları. kagit: sayfanın rengi, ip: ipin saydamlığı. */
const KATMAN = {
  uzak:  { olcek: .50, opak: .34, kagit: '#EFD98F', kenar: '#D9BE73', ip: .16, satir: false },
  orta:  { olcek: .85, opak: .58, kagit: '#FBF0CE', kenar: '#D9C68F', ip: .24, satir: true },
  yakin: { olcek: 1.6, opak: .85, kagit: '#FFFFFF', kenar: '#E2D5AE', ip: .30, satir: true }
};

/* [x, ipBoyu, katman, eğim]. Elle dağıtıldı, rastgele değil: her açılışta
   aynı kompozisyon çıksın ve kağıtlar üst üste binmesin.

   EKRANIN ÜST ORTASI BOŞ: ruh oradan sarkıyor ve hemen altında ekran başlığı
   var. Bu yüzden x'i 142-258 arasında olan kağıtların ipi en az 175 birim —
   sayfanın kendisi başlığın altına iniyor. İnce ipler zaten soluk, yazının
   arkasından geçmeleri sorun değil; sorun olan büyük beyaz sayfaydı. */
const KAGITLAR = [
  [ 20, 130, 'uzak', -3], [ 30,  56, 'uzak',  2], [104, 210, 'uzak',  4],
  [162, 200, 'uzak', -2], [208, 262, 'uzak',  3], [292,  52, 'uzak', -4],
  [318, 192, 'uzak',  2], [352, 110, 'uzak', -3], [390, 168, 'uzak',  3],
  [ 48, 300, 'uzak', -2], [140, 328, 'uzak',  3], [236, 330, 'uzak', -3],
  [300, 348, 'uzak',  2], [372, 262, 'uzak', -4],

  [ 14, 398, 'orta',  3], [ 96, 232, 'orta', -3], [186, 428, 'orta',  2],
  [276, 388, 'orta', -2], [356, 452, 'orta',  4],

  [ 64,  96, 'yakin', -3], [262, 178, 'yakin',  2], [340,  56, 'yakin', -2],
  [126, 516, 'yakin',  3], [288, 556, 'yakin', -3]
];

/* Uzakta, her şeyin arkasında duran mavi ipler — Error'un ağı.
   [x1,y1,x2,y2]; uçlar bilerek görüş alanının dışında. */
const AG = [
  [-40, 470, 440, 250],
  [-40, 180, 440, 420],
  [-40, 640, 440, 540]
];

function el(ad, nitelikler) {
  const e = document.createElementNS(SVG_NS, ad);
  for (const k in nitelikler) e.setAttribute(k, nitelikler[k]);
  return e;
}

export function makeSphereBackground() {
  const svg = el('svg', {
    class: 'sphere-bg',
    viewBox: `0 0 ${GENISLIK} ${YUKSEKLIK}`,
    // slice: kağıtlar her ekran oranında kendi oranını korusun, gerekirse taşsın
    preserveAspectRatio: 'xMidYMid slice',
    'aria-hidden': 'true'
  });

  AG.forEach(([x1, y1, x2, y2]) => {
    svg.appendChild(el('line', { class: 'bg-ag', x1, y1, x2, y2 }));
  });

  KAGITLAR.forEach(([x, ipBoyu, katmanAdi, egim], i) => {
    const k = KATMAN[katmanAdi];
    const en = 26, boy = 34;

    // rotate(a), translate'ten sonra o noktanın etrafında döner: kağıt ipiyle
    // birlikte, tavana bağlandığı yerden eğilir.
    const dis = el('g', { transform: `translate(${x} 0) rotate(${egim}) scale(${k.olcek})` });

    const ic = el('g', {
      class: 'bg-kagit',
      style: `--sure:${(6 + (i % 5) * 0.8).toFixed(1)}s;--gecikme:${((i % 7) * 0.6).toFixed(1)}s`
    });

    const L = ipBoyu / k.olcek;   // ip boyu ekran biriminde sabit kalsın
    ic.appendChild(el('line', { class: 'bg-iplik', x1: 0, y1: 0, x2: 0, y2: L, opacity: k.ip }));
    ic.appendChild(el('rect', {
      class: 'bg-yaprak', x: -en / 2, y: L, width: en, height: boy,
      fill: k.kagit, stroke: k.kenar, opacity: k.opak
    }));
    if (k.satir) {
      for (let s = 0; s < 4; s++) {
        ic.appendChild(el('line', {
          class: 'bg-satir', opacity: k.opak * .5,
          x1: -en / 2 + 5, y1: L + 8 + s * 6,
          x2: en / 2 - (s === 3 ? 12 : 5), y2: L + 8 + s * 6
        }));
      }
    }

    dis.appendChild(ic);
    svg.appendChild(dis);
  });

  return svg;
}
