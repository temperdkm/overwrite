import { roman } from './roman.js';
import { relIndex, placement } from './ring-math.js';
import { makeGlitchButton, fireGlitch, idleGlitch } from './glitch.js';
import { makeSoul } from './soul.js';
import { makeIsland, setIslandLabel } from './island.js';
import { makeSphereBackground } from './sphere-bg.js';
import { attachRingDrag } from './drag-ring.js';

/* DOODLE SPHERE — hedeflerin dünyası.
   OVERWRITE'ın aynadaki karşılığı: orada mor bir boşlukta timeline föyleri
   dönüyor, burada sıcak bir gökyüzünde hedef adaları. Mekanik birebir aynı
   (aynı çember matematiği, aynı sürükleme, aynı konumsal numaralandırma) —
   değişen yalnızca dünya.

   Adalar OVERWRITE'ın föyleri gibi merkeze İPLE BAĞLI DEĞİL: bu dünyada
   ipler arka plandaki asılı kağıtları tutuyor, adalar serbest yüzüyor. */

export function createSphereScreen({ root, evrenler, onBack, onOpen }) {
  root.innerHTML =
    '<div class="sphere-sky"></div>' +
    '<div class="sphere-motes" aria-hidden="true"></div>' +
    '<div class="sphere-title" id="sphTitle">DOODLE SPHERE</div>' +
    '<div id="sphIsles"></div>' +
    '<div class="sphere-empty" id="sphEmpty">HENÜZ HEDEF YOK.<br>YENİ BİR EVREN YARAT.</div>' +
    '<div class="sphere-create" id="sphCreate"></div>' +
    '<div class="saved" id="sphSaved">&#9622; KAYDEDİLDİ</div>' +
    '<div class="ring-nav" id="sphNav">' +
      '<button type="button" id="sphPrev" aria-label="önceki">&#9668;</button>' +
      '<div class="ring-ind" id="sphInd">—</div>' +
      '<button type="button" id="sphNext" aria-label="sonraki">&#9658;</button>' +
    '</div>';

  // Asılı kağıtlar gökyüzünün hemen üstüne, adaların altına girer.
  root.insertBefore(makeSphereBackground(), root.querySelector('.sphere-motes'));

  const host  = root.querySelector('#sphIsles');
  const empty = root.querySelector('#sphEmpty');
  const nav   = root.querySelector('#sphNav');
  const ind   = root.querySelector('#sphInd');
  const savedEl = root.querySelector('#sphSaved');

  /* onSaved başarıda argümansız, HATADA Error ile çağrılır (bkz. store.js).
     Başarısız yazma SESSİZ KALMAMALI: yoksa yeni ada ekranda durur ama
     diske hiç yazılmamıştır ve uygulama kapanınca yok olur. */
  evrenler.onSaved((err) => {
    if (root.hasAttribute('hidden') && !err) return;
    savedEl.classList.remove('show', 'fail');
    void savedEl.offsetWidth;
    if (err) {
      console.error('ada kaydedilemedi:', err);
      savedEl.textContent = '▖ KAYDEDİLEMEDİ';
      savedEl.classList.add('fail');
    } else {
      savedEl.textContent = '▖ KAYDEDİLDİ';
      savedEl.classList.add('show');
    }
  });

  /* Işık zerreleri — gökyüzünün ölü durmaması için, dokunulmaz. */
  const motes = root.querySelector('.sphere-motes');
  for (let i = 0; i < 18; i++) {
    const m = document.createElement('span');
    m.className = 'mote';
    m.style.left = (Math.random() * 100).toFixed(1) + '%';
    m.style.top = (Math.random() * 100).toFixed(1) + '%';
    m.style.setProperty('--gecikme', (Math.random() * 6).toFixed(2) + 's');
    m.style.setProperty('--sure', (5 + Math.random() * 5).toFixed(2) + 's');
    m.style.setProperty('--boy', (2 + Math.random() * 3).toFixed(1) + 'px');
    motes.appendChild(m);
  }

  /* OVERWRITE'ın karşıtı: orada yazılan silinir, burada yeni bir evren doğar. */
  const createBtn = makeGlitchButton({ label: 'CREATE', variant: 'big', onClick: () => {
    const u = evrenler.createUniverse();
    cur = evrenler.list().length - 1;
    render(u.id);
  }});
  root.querySelector('#sphCreate').appendChild(createBtn);

  root.querySelector('#sphPrev').addEventListener('click', () => step(-1));
  root.querySelector('#sphNext').addEventListener('click', () => step(1));

  let cur = 0;
  let surukleme = 0;                 // kesirli adım kayması; 0 = sürükleme yok
  const nodes = new Map();           // evren id -> { pos, float, isle }

  function geometry() {
    const w = root.clientWidth || 290;
    const h = root.clientHeight || 560;
    /* rx iki kısıt arasında sıkışıyor ve 0.41 ikisini de karşılayan değer:
       - Çok DAR olursa komşu adalar üst üste biner (0.40'ta ayrım 115px'ti,
         ada ise 105px genişliğinde — etiketler birbirine karışıyordu).
       - Çok GENİŞ olursa çemberin en arkasındaki ada (d=±2, elipsin yatay
         ucu) ekrandan taşar ve etiketi kesilir (0.46'da 21px taşıyordu).
       0.41'de ayrım 118px, en arkadaki ada ise 360px genişlikte bir ekranda
       bile tam sığıyor. */
    return {
      center: { x: w / 2, y: h * 0.46 },
      radii: { rx: w * 0.41, ry: h * 0.25 }
    };
  }

  function makeNode(i) {
    const pos = document.createElement('div');
    pos.className = 'pos';
    const flo = document.createElement('div');
    flo.className = 'float';
    flo.style.setProperty('--fd', (4.6 + (i % 5) * 0.31).toFixed(2) + 's');
    flo.style.setProperty('--fdl', ((i * 430) % 2300) + 'ms');
    const isle = makeIsland();
    flo.appendChild(isle); pos.appendChild(flo); host.appendChild(pos);
    return { pos, float: flo, isle };
  }

  /**
   * Tek bir adanın konumunu/ölçeğini/saydamlığını yazar.
   * Ortalama YÜZDEYLE yapılıyor — translate(calc(Xpx - 50%), ...) — çünkü ada
   * kutusu --ui ile ölçekleniyor ve piksel cinsinden yarı genişliğini JS
   * bilmiyor; yüzde her boyutta doğru. Dönüşüm merkezi varsayılan (%50 %50)
   * olduğu için scale de adanın kendi ortasına göre çalışır.
   */
  function konumlaAda(rec, i, n, center, radii) {
    const d = relIndex(i, cur, n) - surukleme;
    const p = placement(d, center, radii);
    rec.pos.style.transform =
      'translate(calc(' + p.x.toFixed(1) + 'px - 50%), calc(' + p.y.toFixed(1) + 'px - 50%))' +
      ' scale(' + p.scale.toFixed(3) + ')';
    rec.pos.style.opacity = p.opacity;
    rec.pos.style.zIndex = Math.round(p.z);   // kesirli d yüzünden yuvarlanmalı
    rec.pos.style.pointerEvents = p.visible ? 'auto' : 'none';
  }

  /** Yalnızca konumlar — içerik yeniden kurulmaz (sürüklerken 60fps çağrılır). */
  function konumla() {
    const list = evrenler.list();
    const n = list.length;
    if (!n) return;
    const { center, radii } = geometry();
    list.forEach((u, i) => {
      const rec = nodes.get(u.id);
      if (rec) konumlaAda(rec, i, n, center, radii);
    });
  }

  function render(dogumId) {
    const list = evrenler.list();
    const n = list.length;
    const { center, radii } = geometry();

    /* Başlık SABİT kalır, sayaç eklenmez. Sağ üstte ruhun ipi asılı duruyor
       ve "DOODLE SPHERE · 12 UNIVERSES" ortalandığında sağ ucu ipin üstüne
       biniyor. Sayı zaten alttaki göstergede yazıyor; buradaki tekrarı
       kaldırmak çarpışmayı kalıcı olarak bitiriyor. */
    empty.style.display = n ? 'none' : 'block';
    nav.style.display = n ? 'flex' : 'none';

    const yasayan = new Set(list.map(u => u.id));
    for (const [id, rec] of nodes) if (!yasayan.has(id)) { rec.pos.remove(); nodes.delete(id); }

    if (!n) { ind.textContent = '—'; return; }
    if (cur >= n) cur = n - 1;

    list.forEach((u, i) => {
      let rec = nodes.get(u.id);
      const yeni = !rec;
      if (yeni) { rec = makeNode(i); nodes.set(u.id, rec); }
      setIslandLabel(rec.isle, 'UNIVERSE ' + roman(u.no), u.ad);

      // Yeni ada geçişsiz olarak yerine konur, sonra geçiş açılır; aksi
      // halde ekranın köşesinden süzülerek gelir.
      if (yeni) {
        rec.pos.style.transition = 'none';
        konumlaAda(rec, i, n, center, radii);
        void rec.pos.offsetWidth;
        rec.pos.style.transition = '';
      }

      rec.isle.onclick = () => {
        const d = relIndex(i, cur, evrenler.list().length);
        if (d !== 0) { cur = i; render(); return; }
        if (onOpen) onOpen(u.id);
      };

      if (u.id === dogumId) {
        rec.isle.classList.add('born');
        setTimeout(() => rec.isle.classList.remove('born'), 640);
      }
    });

    konumla();
    const c = evrenler.list()[cur];
    ind.textContent = 'UNIVERSE ' + roman(c.no) + (c.ad ? ' · ' + c.ad : '');
  }

  function step(dir) {
    const n = evrenler.list().length;
    if (!n) return;
    cur = (cur + dir + n) % n;
    render();
  }

  const surukleyici = attachRingDrag({
    root,
    onSurukle: (s) => { surukleme = s; konumla(); },
    onBitir: () => {
      const n = evrenler.list().length;
      const adim = Math.round(surukleme);
      surukleme = 0;
      if (n && adim) cur = ((cur + adim) % n + n) % n;
      render();
    }
  });

  /* OVERWRITE'a dönüş: ekranın üstünden sarkan aynı ruh. */
  const soul = makeSoul({ label: 'OVERWRITE\'a dön', onTap: onBack });
  root.appendChild(soul.el);

  const onResize = () => render();
  window.addEventListener('resize', onResize);

  const idleTimer = idleGlitch(
    () => (root.hasAttribute('hidden') ? [] : [createBtn]),
    3400
  );
  // Hiç ada yokken buton daha sık bozulur: kullanıcı ilk bakışta neye
  // basacağını anlasın diye. Çember ekranındaki OVERWRITE ile aynı mantık.
  const ilkAcilisTimer = setInterval(() => {
    if (!root.hasAttribute('hidden') && evrenler.list().length === 0) fireGlitch(createBtn);
  }, 2200);

  return {
    render,
    step,
    createButton: createBtn,
    destroy() {
      window.removeEventListener('resize', onResize);
      surukleyici.destroy();
      clearInterval(idleTimer);
      clearInterval(ilkAcilisTimer);
      soul.destroy();
    }
  };
}
