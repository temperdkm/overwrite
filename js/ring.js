import { roman } from './roman.js';
import { RING, relIndex, placement, edgePoint } from './ring-math.js';
import { makeGlitchButton, fireGlitch, idleGlitch } from './glitch.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createRingScreen({ root, store, onOpen }) {
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

      const d = relIndex(i, cur, n);
      const p = placement(d, center, radii);
      const tr = `translate(${(p.x - RING.SHEET_W / 2).toFixed(1)}px,` +
                 `${(p.y - RING.SHEET_H / 2).toFixed(1)}px) scale(${p.scale.toFixed(3)})`;

      // Yeni föy geçişsiz olarak yerine konur, sonra geçiş açılır;
      // aksi halde ekranın köşesinden süzülerek gelir.
      if (fresh) {
        rec.pos.style.transition = 'none';
        rec.pos.style.transform = tr;
        rec.pos.style.opacity = p.opacity;
        void rec.pos.offsetWidth;
        rec.pos.style.transition = '';
      } else {
        rec.pos.style.transform = tr;
        rec.pos.style.opacity = p.opacity;
      }
      rec.pos.style.zIndex = p.z;
      rec.pos.style.pointerEvents = p.visible ? 'auto' : 'none';

      rec.sheet.onclick = () => {
        const dd = relIndex(i, cur, store.list().length);
        if (dd === 0) onOpen(tl.id);
        else { cur = i; render(); }
      };

      const path = paths.get(tl.id);
      path.style.display = p.visible ? '' : 'none';
      path.setAttribute('stroke-width', (1.4 - Math.abs(d) * 0.25).toFixed(2));
      path.setAttribute('opacity', (p.opacity * 0.75).toFixed(2));

      if (tl.id === bornId) {
        rec.sheet.classList.add('born');
        setTimeout(() => rec.sheet.classList.remove('born'), 500);
      }
    });

    const c = store.list()[cur];
    ind.textContent = 'TIMELINE ' + roman(c.no) + (c.ad ? ' · ' + c.ad : '');
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

  const onResize = () => render();
  window.addEventListener('resize', onResize);

  /* Parmakla kaydırarak çemberi çevirme. Ok butonları duruyor, bu onların
     yerine değil yanına.
     EŞİK neden var: föylere dokunmak da bir touchstart/touchend çifti üretiyor.
     Yatay hareket 40px'i geçmeden ve yataylık dikeyliğin en az 1.5 katı olmadan
     jest sayılmıyor, böylece föye dokunmak yanlışlıkla çemberi çevirmiyor.
     Sol kaydırma bir sonrakine geçer (içerik sola gider), sağ kaydırma öncekine. */
  const ESIK = 40, YATAYLIK = 1.5;
  let bx = 0, by = 0, izleniyor = false;

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) { izleniyor = false; return; }
    bx = e.touches[0].clientX; by = e.touches[0].clientY; izleniyor = true;
  };
  const onTouchEnd = (e) => {
    if (!izleniyor) return;
    izleniyor = false;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - bx, dy = t.clientY - by;
    if (Math.abs(dx) < ESIK) return;
    if (Math.abs(dx) < Math.abs(dy) * YATAYLIK) return;
    step(dx < 0 ? 1 : -1);
  };

  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchend', onTouchEnd, { passive: true });
  root.addEventListener('touchcancel', () => { izleniyor = false; }, { passive: true });

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
      root.removeEventListener('touchend', onTouchEnd);
      clearInterval(idleTimer);
      clearInterval(firstRunTimer);
    }
  };
}
