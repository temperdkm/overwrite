import { roman } from './roman.js';
import { RING, relIndex, placement, edgePoint } from './ring-math.js';
import { makeGlitchButton, fireGlitch, idleGlitch } from './glitch.js';
import { makeSoul } from './soul.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createRingScreen({ root, store, onOpen, onSphere }) {
  root.innerHTML =
    '<div class="ring-head" id="ringHead">DATA COMPILATION</div>' +
    '<svg id="wires" preserveAspectRatio="none"></svg>' +
    '<div id="ringSheets"></div>' +
    '<div class="ring-empty" id="ringEmpty">HENÜZ HİÇBİR ŞEY YOK.<br>BAŞLAMAK İÇİN BAS.</div>' +
    '<div class="ring-ow" id="ringOw"></div>' +
    '<div class="ring-nav" id="ringNav">' +
      '<button type="button" id="ringPrev" aria-label="önceki">&#9668;</button>' +
      '<div class="ring-ind" id="ringInd">—</div>' +
      '<button type="button" id="ringNext" aria-label="sonraki">&#9658;</button>' +
    '</div>';

  const head   = root.querySelector('#ringHead');
  const wires  = root.querySelector('#wires');
  const host   = root.querySelector('#ringSheets');
  const empty  = root.querySelector('#ringEmpty');
  const nav    = root.querySelector('#ringNav');
  const ind    = root.querySelector('#ringInd');

  const owBtn = makeGlitchButton({ label: 'OVERWRITE', variant: 'big', onClick: () => {
    const tl = store.createTimeline();
    cur = store.list().length - 1;
    render(tl.id);
  }});
  root.querySelector('#ringOw').appendChild(owBtn);

  root.querySelector('#ringPrev').addEventListener('click', () => step(-1));
  root.querySelector('#ringNext').addEventListener('click', () => step(1));

  let cur = 0;
  // Parmakla sürükleme sırasındaki kesirli adım kayması. 0 = sürükleme yok.
  // Pozitif değer sağa sürüklemek demek; föyler sağa kayar.
  let surukleme = 0;
  let rafId = null;
  const nodes = new Map();   // timeline id -> { pos, float, sheet }
  const paths = new Map();   // timeline id -> <path>

  function geometry() {
    const w = root.clientWidth || 290;
    const h = root.clientHeight || 560;
    wires.setAttribute('viewBox', `0 0 ${w} ${h}`);
    return {
      center: { x: w / 2, y: h * 0.4964 },
      radii: { rx: w * 0.379, ry: h * 0.2714 }
    };
  }

  function fillSheet(sheet, tl) {
    sheet.innerHTML =
      '<div class="kicker">TIMELINE</div><div class="no"></div><div class="name"></div>' +
      '<div class="line" style="width:72%"></div><div class="line" style="width:56%"></div>' +
      '<div class="count"></div>';
    sheet.querySelector('.no').textContent = roman(tl.no);
    sheet.querySelector('.name').textContent = tl.ad || '';   // güvenli
    const n = tl.entries.length;
    sheet.querySelector('.count').textContent = n + (n === 1 ? ' ENTRY' : ' ENTRIES');
  }

  function makeNode(tl, i) {
    const pos = document.createElement('div');
    pos.className = 'pos';
    const flo = document.createElement('div');
    flo.className = 'float';
    flo.style.setProperty('--fd', (4 + (i % 5) * 0.28).toFixed(2) + 's');
    flo.style.setProperty('--fdl', ((i * 370) % 2100) + 'ms');
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    flo.appendChild(sheet); pos.appendChild(flo); host.appendChild(pos);

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('stroke', '#A855F7');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    wires.appendChild(path);

    const rec = { pos, float: flo, sheet };
    nodes.set(tl.id, rec);
    paths.set(tl.id, path);
    return rec;
  }

  function render(bornId) {
    const list = store.list();
    const n = list.length;
    const { center, radii } = geometry();

    head.textContent = n ? `DATA COMPILATION · ${n} TIMELINE${n === 1 ? '' : 'S'}` : 'DATA COMPILATION';
    empty.style.display = n ? 'none' : 'block';
    nav.style.display = n ? 'flex' : 'none';

    const live = new Set(list.map(t => t.id));
    for (const [id, rec] of nodes) if (!live.has(id)) { rec.pos.remove(); nodes.delete(id); }
    for (const [id, p]  of paths) if (!live.has(id)) { p.remove(); paths.delete(id); }

    if (!n) { ind.textContent = '—'; return; }
    if (cur >= n) cur = n - 1;

    list.forEach((tl, i) => {
      let rec = nodes.get(tl.id);
      const fresh = !rec;
      if (fresh) rec = makeNode(tl, i);
      fillSheet(rec.sheet, tl);

      // Yeni föy geçişsiz olarak yerine konur, sonra geçiş açılır;
      // aksi halde ekranın köşesinden süzülerek gelir.
      if (fresh) {
        rec.pos.style.transition = 'none';
        konumlaFoy(rec, i, n, center, radii);
        void rec.pos.offsetWidth;
        rec.pos.style.transition = '';
      }

      rec.sheet.onclick = () => {
        const dd = relIndex(i, cur, store.list().length);
        if (dd === 0) onOpen(tl.id);
        else { cur = i; render(); }
      };

      if (tl.id === bornId) {
        rec.sheet.classList.add('born');
        setTimeout(() => rec.sheet.classList.remove('born'), 500);
      }
    });

    konumla();
    const c = store.list()[cur];
    ind.textContent = 'TIMELINE ' + roman(c.no) + (c.ad ? ' · ' + c.ad : '');
  }

  /**
   * Tek bir föyün konumunu/ölçeğini/saydamlığını yazar.
   * surukleme, parmakla sürükleme sırasındaki KESİRLİ adım kaymasıdır;
   * placement() açıyı hesapladığı için ondalık değerle de sorunsuz çalışır,
   * böylece föyler adım adım sıçramak yerine parmağı sürekli takip eder.
   */
  function konumlaFoy(rec, i, n, center, radii) {
    const d = relIndex(i, cur, n) - surukleme;
    const p = placement(d, center, radii);
    rec.pos.style.transform =
      `translate(${(p.x - RING.SHEET_W / 2).toFixed(1)}px,` +
      `${(p.y - RING.SHEET_H / 2).toFixed(1)}px) scale(${p.scale.toFixed(3)})`;
    rec.pos.style.opacity = p.opacity;
    rec.pos.style.zIndex = Math.round(p.z);      // kesirli d yüzünden yuvarlanmalı
    rec.pos.style.pointerEvents = p.visible ? 'auto' : 'none';
    return { p, d };
  }

  /**
   * Yalnızca konumları günceller — föy içeriğini YENİDEN KURMAZ.
   * Sürükleme sırasında saniyede ~60 kez çağrıldığı için render()'ın
   * yaptığı innerHTML yeniden kurma işi burada olmamalı.
   */
  function konumla() {
    const list = store.list();
    const n = list.length;
    if (!n) return;
    const { center, radii } = geometry();
    list.forEach((tl, i) => {
      const rec = nodes.get(tl.id);
      if (!rec) return;
      const { p, d } = konumlaFoy(rec, i, n, center, radii);
      const path = paths.get(tl.id);
      if (!path) return;
      path.style.display = p.visible ? '' : 'none';
      path.setAttribute('stroke-width', Math.max(0.2, 1.4 - Math.abs(d) * 0.25).toFixed(2));
      path.setAttribute('opacity', (p.opacity * 0.75).toFixed(2));
    });
  }

  /* İpler föylerin GERÇEK ekran konumunu takip eder; böylece idle
     süzülme sırasında bile uç föye yapışık kalır. Ekran gizliyken
     döngü çalışmaz — görünmeyen bir şey için pil harcanmaz. */
  function syncWires() {
    if (!root.hasAttribute('hidden')) {
      const { center } = geometry();
      const rootRect = root.getBoundingClientRect();
      for (const tl of store.list()) {
        const rec = nodes.get(tl.id), path = paths.get(tl.id);
        if (!rec || !path || path.style.display === 'none') continue;
        const r = rec.sheet.getBoundingClientRect();
        if (!r.width) continue;
        const sheet = {
          x: r.left - rootRect.left + r.width / 2,
          y: r.top - rootRect.top + r.height / 2,
          halfW: r.width / 2,
          halfH: r.height / 2
        };
        const e = edgePoint(sheet, center);
        const dx = sheet.x - center.x, dy = sheet.y - center.y;
        const len = Math.hypot(dx, dy) || 1;
        const mx = (center.x + e.x) / 2, my = (center.y + e.y) / 2, off = 11;
        path.setAttribute('d',
          `M${center.x} ${center.y} Q ${(mx - dy / len * off).toFixed(1)} ` +
          `${(my + dx / len * off).toFixed(1)} ${e.x.toFixed(1)} ${e.y.toFixed(1)}`);
      }
    }
    rafId = requestAnimationFrame(syncWires);
  }
  rafId = requestAnimationFrame(syncWires);

  function step(dir) {
    const n = store.list().length;
    if (!n) return;
    cur = (cur + dir + n) % n;
    render();
  }

  /* Doodle Sphere'e geçiş: ekranın üstünden sarkan ruh. */
  const soul = onSphere ? makeSoul({ label: 'DOODLE SPHERE', onTap: onSphere }) : null;
  if (soul) root.appendChild(soul.el);

  const onResize = () => render();
  window.addEventListener('resize', onResize);

  /* Parmakla SÜRÜKLEME. Ok butonları duruyor, bu onların yerine değil yanına.
     Çember parmağı sürekli takip eder (adım adım sıçramaz) ve bırakınca en
     yakın föye oturur. Sağa sürüklemek föyleri sağa götürür — yani soldaki
     föy öne gelir; bu, içeriği tutup çekmenin doğal yönü.
     KARAR EŞİĞİ: föye dokunmak da touchstart/touchend üretiyor. İlk 8 piksel
     boyunca jestin ne olduğuna karar verilmez; hareket dikey ağırlıklıysa
     sürükleme hiç başlamaz, böylece dokunuşlar çemberi çevirmez. */
  const KARAR_PX = 8, YATAYLIK = 1.5;
  const adimMesafesi = () => Math.max(70, (root.clientWidth || 390) * 0.30);
  let bx = 0, by = 0, izleniyor = false, surukluyor = false, surukledi = false;

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) { izleniyor = false; return; }
    bx = e.touches[0].clientX; by = e.touches[0].clientY;
    izleniyor = true; surukluyor = false;
  };

  const onTouchMove = (e) => {
    if (!izleniyor || !e.touches.length) return;
    const dx = e.touches[0].clientX - bx;
    const dy = e.touches[0].clientY - by;
    if (!surukluyor) {
      if (Math.abs(dx) < KARAR_PX && Math.abs(dy) < KARAR_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * YATAYLIK) { izleniyor = false; return; }
      surukluyor = true;
      root.classList.add('dragging');   // geçişi kapatır, föy parmağa yapışır
    }
    surukleme = dx / adimMesafesi();
    konumla();
  };

  const bitir = () => {
    if (!surukluyor) { izleniyor = false; return; }
    const n = store.list().length;
    const adim = Math.round(surukleme);
    surukleme = 0;
    surukluyor = false;
    izleniyor = false;
    surukledi = true;                   // bu jestten doğacak click'i yut
    root.classList.remove('dragging');
    if (n && adim) cur = ((cur + adim) % n + n) % n;
    render();
  };

  // Sürükleme bittiğinde tarayıcı ayrıca bir click üretiyor; föyün üstünde
  // başlayan bir sürükleme yanlışlıkla timeline'ı açmasın diye yakalama
  // aşamasında durduruluyor.
  const onClickCapture = (e) => {
    if (!surukledi) return;
    surukledi = false;
    e.stopPropagation();
    e.preventDefault();
  };

  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchmove', onTouchMove, { passive: true });
  root.addEventListener('touchend', bitir, { passive: true });
  root.addEventListener('touchcancel', bitir, { passive: true });
  root.addEventListener('click', onClickCapture, true);

  // Buton kendiliğinden bozulsun. Çember ekranındayken tek buton var,
  // o yüzden aralık 3 sn; ilk açılışta (hiç timeline yokken) 2 sn —
  // kullanıcı ilk bakışta butonun ne olduğunu anlasın diye.
  const idleTimer = idleGlitch(
    () => (root.hasAttribute('hidden') ? [] : [owBtn]),
    3000
  );
  const firstRunTimer = setInterval(() => {
    if (!root.hasAttribute('hidden') && store.list().length === 0) fireGlitch(owBtn);
  }, 2000);

  return {
    render,
    step,
    owButton: owBtn,
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', bitir);
      root.removeEventListener('touchcancel', bitir);
      root.removeEventListener('click', onClickCapture, true);
      clearInterval(idleTimer);
      clearInterval(firstRunTimer);
      if (soul) soul.destroy();
    }
  };
}
