const SVG_NS = 'http://www.w3.org/2000/svg';

/* Dört YATAY pençe izi. Neredeyse düz: genişlik boyunca %8 eğim,
   sapma %0.5'in altında — kesik değil pençe görünsün diye. */
const SLASHES = [
  { left: 21, right: 13, jitter: [ .5, -.4] },
  { left: 42, right: 34, jitter: [-.4,  .5] },
  { left: 63, right: 55, jitter: [ .4, -.5] },
  { left: 84, right: 76, jitter: [-.5,  .4] }
];
const STEPS = 3;
const TOP_EDGE = [[0, 0], [100, 0]];
const BOTTOM_EDGE = [[0, 100], [100, 100]];

/* Şeritlerin ilk açılma yönü ve glitch şiddeti */
const NEAR = [[0, -5, -.5], [0, -2, .3], [0, 0, 0], [0, 2, -.3], [0, 5, .5]];
const JITTER_FACTOR = [1, -0.85, 1.35, -1.1, 0.75];

export const PIXEL_SIZE = 8;

/* Pençe+glitch evresinin bittiği, ızgaranın göründüğü an. */
const IZGARA_BASLANGIC_MS = 340;

/* Buharlaşma ayarları CSS'ten okunur (css/tokens.css içindeki --px-*), böylece
   süre hem animasyonda hem kapanış hesabında tek kaynaktan gelir ve ikisi
   birbirinden kayamaz.
   Her dağılmada yeniden okunuyor, modül yüklenirken bir kez değil: değerler
   çalışma anında değiştirilirse kapanış zamanlaması da onu takip etsin diye. */
function cssSayi(ad, varsayilan) {
  const ham = getComputedStyle(document.documentElement).getPropertyValue(ad).trim();
  const n = parseFloat(ham);
  return Number.isFinite(n) ? n : varsayilan;
}

const LINES = SLASHES.map(s => {
  const pts = [];
  for (let k = 0; k <= STEPS; k++) {
    const x = k * 100 / STEPS;
    let y = s.left + (s.right - s.left) * (k / STEPS);
    if (k > 0 && k < STEPS) y += s.jitter[k - 1];
    pts.push([x, y]);
  }
  return pts;
});

function bandPolygon(upper, lower) {
  const pts = [...upper, ...[...lower].reverse()];
  return 'polygon(' + pts.map(p => p[0].toFixed(1) + '% ' + p[1].toFixed(1) + '%').join(',') + ')';
}

/** Kartı pençe → glitch → piksel dağılması ile yok eder. */
export function dissolveCard({ slot, card, onDone }) {
  if (slot.dataset.dissolving) return;
  slot.dataset.dissolving = '1';

  const w = card.offsetWidth;
  const h = card.offsetHeight;
  slot.style.height = h + 'px';

  // 1) Beş yatay şerit
  for (let i = 0; i < 5; i++) {
    const upper = i === 0 ? TOP_EDGE : LINES[i - 1];
    const lower = i === 4 ? BOTTOM_EDGE : LINES[i];
    const wrap = document.createElement('div');
    wrap.className = 'piece-wrap';
    const piece = card.cloneNode(true);
    piece.classList.add('piece');
    piece.querySelectorAll('[contenteditable]').forEach(e => e.removeAttribute('contenteditable'));
    piece.style.clipPath = bandPolygon(upper, lower);
    piece.style.setProperty('--nx', NEAR[i][0] + 'px');
    piece.style.setProperty('--ny', NEAR[i][1] + 'px');
    piece.style.setProperty('--nr', NEAR[i][2] + 'deg');
    piece.style.setProperty('--jf', JITTER_FACTOR[i]);
    piece.style.animationDelay = (i * 9) + 'ms';
    wrap.appendChild(piece);
    slot.appendChild(wrap);
  }

  // 2) Pençe ışıkları
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'claw-streaks');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  LINES.forEach((line, i) => {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', 'M' + line.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L '));
    p.style.animationDelay = (i * 16) + 'ms';
    svg.appendChild(p);
  });
  slot.appendChild(svg);

  // 3) Piksel ızgarası — kalan eşit dağıtılır, kenarda ince şerit kalmaz
  const pikselSure   = cssSayi('--px-sure', 160);
  const satirGecikme = cssSayi('--px-satir', 7);
  const rastgele     = cssSayi('--px-rastgele', 60);

  const cols = Math.max(1, Math.round(w / PIXEL_SIZE));
  const rows = Math.max(1, Math.round(h / PIXEL_SIZE));
  const cw = w / cols, ch = h / rows;
  const grid = document.createElement('div');
  grid.className = 'px-grid';
  grid.style.width = w + 'px';
  grid.style.height = h + 'px';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = document.createElement('div');
      d.className = 'px';
      d.style.left = (c * cw).toFixed(2) + 'px';
      d.style.top = (r * ch).toFixed(2) + 'px';
      d.style.width = cw.toFixed(2) + 'px';
      d.style.height = ch.toFixed(2) + 'px';
      d.style.backgroundSize = w + 'px ' + h + 'px';
      d.style.backgroundPosition = (-c * cw).toFixed(2) + 'px ' + (-r * ch).toFixed(2) + 'px';
      // Alt sıra önce gider: kart aşağıdan yukarı erir.
      d.dataset.delay = ((rows - 1 - r) * satirGecikme + Math.random() * rastgele).toFixed(0);
      grid.appendChild(d);
    }
  }
  slot.appendChild(grid);

  card.style.visibility = 'hidden';
  void slot.offsetWidth;
  slot.classList.add('dissolving');

  setTimeout(() => {
    slot.querySelectorAll('.piece-wrap').forEach(el => { el.style.display = 'none'; });
    grid.classList.add('on');
    grid.querySelectorAll('.px').forEach(px => {
      px.style.animationDelay = px.dataset.delay + 'ms';
      px.classList.add('go');
    });
  }, IZGARA_BASLANGIC_MS);

  /* Kapanış zamanlaması ızgaradan HESAPLANIR, sabit yazılmaz.
     Kaç sıra oluştuğu kartın yüksekliğine ve --ui ölçeğine bağlı; sabit bir
     sayı yazılırsa uzun bir kartta kareler daha sönmeden slot kapanır, kısa
     bir kartta da söndükten sonra boşuna beklenir. */
  const gecikmeler = [...grid.children].map(el => +el.dataset.delay || 0);
  const enGecGecikme = gecikmeler.length ? Math.max(...gecikmeler) : 0;
  const pikselBitis = IZGARA_BASLANGIC_MS + enGecGecikme + pikselSure;

  setTimeout(() => {
    slot.style.transition = 'height .2s ease, margin .2s';
    slot.style.height = '0';
    slot.style.marginBottom = '0';
  }, pikselBitis);

  setTimeout(() => { slot.remove(); if (onDone) onDone(); }, pikselBitis + 220);
}

/**
 * ERASE: teker teker siler ama telefonu boğmaz.
 * - yalnızca EKRANDA GÖRÜNEN kartlar efekti oynatır
 * - aynı anda en fazla 3 kart dağılır
 * Ölçüldü: bu iki kural olmadan 20 entry'de zirve 4325 eleman,
 * kurallarla 1363.
 *
 * kartSecici ZORUNLU ve varsayılanı YOK. Eskiden '.ecard' sabit yazılıydı;
 * Doodle Sphere'in konuşma balonları '.bubble' olduğu için kart null geliyor,
 * dissolveCard ilk ölçümde hata fırlatıyordu. Sonuç en kötüsüydü: evren
 * mağazadan çoktan silinmiş oluyor ama ekran hiç kapanmıyordu. Varsayılan
 * bırakmak aynı tuzağı üçüncü ekranda tekrar kurardı.
 */
export function dissolveAll({ scroll, kartSecici, onEach, onDone }) {
  if (!kartSecici) throw new Error('dissolveAll: kartSecici zorunlu');

  const all = [...scroll.querySelectorAll('.slot:not([data-dissolving])')];
  const box = scroll.getBoundingClientRect();
  const visible = all.filter(s => {
    const r = s.getBoundingClientRect();
    return r.bottom > box.top + 2 && r.top < box.bottom - 2;
  });

  // Ekranda görünmeyen kartlar efekti oynatmaz; sessizce kaldırılır.
  all.forEach(s => { if (!visible.includes(s)) s.remove(); });

  if (!visible.length) { setTimeout(onDone, 320); return; }

  const MAX_CONCURRENT = 3, GAP = 150;
  let index = 0, active = 0, finished = 0;

  /* Emniyet kemeri EN BAŞTA kuruluyor, döngüden sonra değil: aşağıdaki
     çağrılardan biri hata fırlatırsa kemer hiç bağlanmamış oluyordu ve
     ekran sonsuza dek açık kalıyordu — yani tam da koruması gereken durumda
     çalışmıyordu. */
  setTimeout(onDone, visible.length * GAP + 2200);

  (function next() {
    if (index >= visible.length) return;
    if (active >= MAX_CONCURRENT) { setTimeout(next, 70); return; }
    const slot = visible[index++];
    const card = slot.querySelector(kartSecici);
    active++;
    // Tek bir bozuk kart bütün zinciri durdurmasın: o slot sessizce kalkar,
    // kalanlar dağılmaya devam eder.
    try {
      if (!card) throw new Error('kart bulunamadı: ' + kartSecici);
      dissolveCard({
        slot,
        card,
        onDone: () => {
          active--; finished++;
          if (onEach) onEach(slot);
          if (finished === visible.length) setTimeout(onDone, 140);
        }
      });
    } catch (err) {
      console.error('dağılma atlandı:', err);
      active--; finished++;
      slot.remove();
      if (finished === visible.length) setTimeout(onDone, 140);
    }
    setTimeout(next, GAP);
  })();
}
