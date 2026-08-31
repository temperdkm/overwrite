/* DOODLE SPHERE'İN ARKA PLANI — gerili iplere asılmış kağıtlar.
   Adaların ARKASINDA duran manzara; dokunulmaz, tıklanmaz. Referanstaki
   Anti-Void'in tavanından sarkan kağıtların karşılığı.

   Kağıtlar yerçekimine uyar: ip nereye eğilirse eğilsin iplikleri DİK
   sarkar, yalnızca hafif bir eğim rastgeleliği var. Sallanma dönmeyle değil
   ötelemeyle yapılıyor; SVG'de dönme merkezini (transform-origin) iç içe
   dönüşümlerde tarayıcılar farklı yorumluyor, öteleme her yerde aynı.

   Üst sıralar daha küçük ve daha soluk: derinlik hissi. */

const SVG_NS = 'http://www.w3.org/2000/svg';
const GENISLIK = 400, YUKSEKLIK = 700;

// p0/p1/p2: ipin çizdiği quadratic eğri. Uçlar bilerek görüş alanının
// dışında; ip ekranın kenarında bitmiyor, devam ediyormuş gibi duruyor.
const IPLER = [
  { p0: [-40, 104], p1: [200, 170], p2: [440,  86], t: [.16, .38, .60, .84], olcek: .62, opak: .42 },
  { p0: [440, 250], p1: [190, 320], p2: [-40, 232], t: [.22, .46, .70],      olcek: .78, opak: .55 },
  { p0: [-40, 430], p1: [210, 496], p2: [440, 414], t: [.14, .36, .58, .80], olcek: .92, opak: .62 },
  { p0: [440, 606], p1: [180, 668], p2: [-40, 592], t: [.28, .58],           olcek: 1.05, opak: .5 }
];

/** Quadratic Bézier üzerinde t noktası. */
function egriNoktasi(p0, p1, p2, t) {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
  ];
}

function el(ad, nitelikler) {
  const e = document.createElementNS(SVG_NS, ad);
  for (const k in nitelikler) e.setAttribute(k, nitelikler[k]);
  return e;
}

export function makeSphereBackground() {
  const svg = el('svg', {
    class: 'sphere-bg',
    viewBox: `0 0 ${GENISLIK} ${YUKSEKLIK}`,
    // slice: kağıtlar her ekran oranında kare kalsın, gerekirse kenardan taşsın
    preserveAspectRatio: 'xMidYMid slice',
    'aria-hidden': 'true'
  });

  IPLER.forEach((ip, satir) => {
    svg.appendChild(el('path', {
      class: 'bg-ip',
      d: `M${ip.p0[0]} ${ip.p0[1]} Q ${ip.p1[0]} ${ip.p1[1]} ${ip.p2[0]} ${ip.p2[1]}`,
      opacity: (ip.opak + .2).toFixed(2)
    }));

    ip.t.forEach((t, i) => {
      const [x, y] = egriNoktasi(ip.p0, ip.p1, ip.p2, t);
      // Küçük ama sabit bir eğim: her açılışta aynı yerde dursun, kağıtlar
      // rastgele zıplamasın. satir+i yeterince dağınık bir desen veriyor.
      const egim = ((satir * 3 + i * 5) % 7) - 3;

      const dis = el('g', { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) ` +
                                       `rotate(${egim}) scale(${ip.olcek})` });
      const ic = el('g', {
        class: 'bg-kagit',
        opacity: ip.opak.toFixed(2),
        style: `--sure:${(5.5 + ((satir + i) % 4) * 0.9).toFixed(1)}s;` +
               `--gecikme:${(((satir * 2 + i) % 5) * 0.7).toFixed(1)}s`
      });

      ic.appendChild(el('line', { class: 'bg-iplik', x1: 0, y1: 0, x2: 0, y2: 11 }));
      ic.appendChild(el('rect', { class: 'bg-yaprak', x: -11, y: 11, width: 22, height: 28 }));
      for (let s = 0; s < 3; s++) {
        ic.appendChild(el('line', {
          class: 'bg-satir',
          x1: -7, y1: 18 + s * 6, x2: (s === 2 ? 2 : 7), y2: 18 + s * 6
        }));
      }

      dis.appendChild(ic);
      svg.appendChild(dis);
    });
  });

  return svg;
}
