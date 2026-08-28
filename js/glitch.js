const SLICE_COUNT = 5;

function chip(label, variant) {
  const wrap = document.createElement('div');
  wrap.className = 'chip' + (variant && variant !== 'normal' ? ' ' + variant : '');
  const inner = document.createElement('div');
  inner.className = 'in';
  inner.textContent = label;
  wrap.appendChild(inner);
  return wrap;
}

/** Glitch'li buton üretir: 1 asıl + 5 şerit kopya. */
export function makeGlitchButton({ label, variant = 'normal', onClick }) {
  const el = document.createElement('div');
  el.className = 'gb';
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', label);

  const base = chip(label, variant);
  base.classList.add('base');
  el.appendChild(base);

  for (let i = 1; i <= SLICE_COUNT; i++) {
    const s = chip(label, variant);
    s.classList.add('slice', 's' + i);
    el.appendChild(s);
  }

  if (onClick) {
    const handler = (e) => { e.preventDefault(); fireGlitch(el); onClick(); };
    el.addEventListener('click', handler);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') handler(e);
    });
  }
  return el;
}

/** Bozulmayı bir kez oynatır. */
export function fireGlitch(el) {
  el.classList.remove('fire');
  void el.offsetWidth;            // sınıfı yeniden uygulamak için akışı zorla
  el.classList.add('fire');
  setTimeout(() => el.classList.remove('fire'), 360);
}

/** Verilen butonları rastgele sırayla, aralıklarla tetikler. */
export function idleGlitch(getButtons, intervalMs = 3000) {
  return setInterval(() => {
    const list = getButtons().filter(Boolean);
    if (!list.length) return;
    fireGlitch(list[Math.floor(Math.random() * list.length)]);
  }, intervalMs);
}
