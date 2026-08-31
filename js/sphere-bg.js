/* DOODLE SPHERE'İN ARKA PLANI — tavandan sarkan kağıtlar.
   Adaların ARKASINDA duran manzara; dokunulmaz, tıklanmaz.

   Kağıtlar YUKARIDAN AŞAĞI sarkıyor: her biri ekranın üst kenarından inen
   uzun bir ipin ucunda.

   Sayfalar DÜMDÜZ BEYAZ: çerçeve yok, üstlerinde satır yok. Derinlik yalnızca
   boyut ve saydamlıkla veriliyor — uzaktakiler küçük ve solgun, sıcak
   gökyüzünün önünde kendiliğinden krem görünüyorlar; öndekiler büyük ve
   bembeyaz.

   HİÇBİR YERDE IŞIMA YOK — ipler kendi renginde, düz mavi. */

const SVG_NS = 'http://www.w3.org/2000/svg';
const GENISLIK = 400, YUKSEKLIK = 700;

/* Derinlik katmanları. opak: sayfanın saydamlığı, ip: ipin saydamlığı. */
const KATMANLAR = [
  { adet: 26, olcek: .46, opak: .34, ip: .14 },
  { adet: 14, olcek: .82, opak: .58, ip: .22 },
  { adet:  8, olcek: 1.5, opak: .88, ip: .30 }
];

/* Ekranın üst ORTASI boş kalmalı: ruh oradan sarkıyor. Bu şeride düşen
   kağıtların ipi uzatılıyor, yani sayfa ruhun altına iniyor. İnce ipler
   zaten solgun, ruhun arkasından geçmeleri sorun değil; sorun olan büyük
   beyaz sayfanın tam ruhun arkasına denk gelmesiydi. */
const RUH_SERIDI = [142, 258];
const RUH_ALTI = 190;

/* Uzakta, her şeyin arkasında duran mavi ipler — Error'un ağı. */
const AG = [
  [-40, 470, 440, 250],
  [-40, 180, 440, 420],
  [-40, 640, 440, 540]
];

/* Sabit tohumlu üretici. Math.random KULLANILMIYOR: kompozisyon her açılışta
   aynı olmalı, yoksa kağıtlar uygulama her açıldığında yerinden zıplar. */
function uretici(tohum) {
  let s = tohum >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function el(ad, nitelikler) {
  const e = document.createElementNS(SVG_NS, ad);
  for (const k in nitelikler) e.setAttribute(k, nitelikler[k]);
  return e;
}

export function makeSphereBackground() {
  const svg = el('svg', {
    class: 'sphere-bg',
    viewBox: '0 0 ' + GENISLIK + ' ' + YUKSEKLIK,
    // slice: kağıtlar her ekran oranında kendi oranını korusun, gerekirse taşsın
    preserveAspectRatio: 'xMidYMid slice',
    'aria-hidden': 'true'
  });

  AG.forEach(function (a) {
    svg.appendChild(el('line', { class: 'bg-ag', x1: a[0], y1: a[1], x2: a[2], y2: a[3] }));
  });

  const rnd = uretici(20260901);
  let i = 0;

  KATMANLAR.forEach(function (k) {
    for (let n = 0; n < k.adet; n++, i++) {
      const x = Math.round(rnd() * (GENISLIK + 40) - 20);
      let ipBoyu = Math.round(40 + rnd() * 560);
      if (x > RUH_SERIDI[0] && x < RUH_SERIDI[1] && ipBoyu < RUH_ALTI) ipBoyu += RUH_ALTI;
      const egim = Math.round(rnd() * 8) - 4;
      const en = 26, boy = 34;

      // rotate(a), translate'ten sonra o noktanın etrafında döner: kağıt
      // ipiyle birlikte, tavana bağlandığı yerden eğilir.
      const dis = el('g', {
        transform: 'translate(' + x + ' 0) rotate(' + egim + ') scale(' + k.olcek + ')'
      });

      const ic = el('g', {
        class: 'bg-kagit',
        style: '--sure:' + (6 + (i % 5) * 0.8).toFixed(1) + 's;' +
               '--gecikme:' + ((i % 7) * 0.6).toFixed(1) + 's'
      });

      const L = ipBoyu / k.olcek;   // ip boyu ekran biriminde sabit kalsın
      ic.appendChild(el('line', { class: 'bg-iplik', x1: 0, y1: 0, x2: 0, y2: L, opacity: k.ip }));
      ic.appendChild(el('rect', {
        class: 'bg-yaprak', x: -en / 2, y: L, width: en, height: boy, opacity: k.opak
      }));

      dis.appendChild(ic);
      svg.appendChild(dis);
    }
  });

  return svg;
}
