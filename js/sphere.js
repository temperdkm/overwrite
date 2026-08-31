import { makeSoul } from './soul.js';

/* DOODLE SPHERE — hedeflerin dünyası.
   1. AŞAMA: yalnızca zemin ve geri dönüş ruhu. Adalar, kapılar, gerili
   ipler ve asılı kağıtlar sonraki aşamalarda geliyor.

   Ekranın omurgası önce kuruluyor ki geçiş telefonda gerçekten denenebilsin;
   dünya boş bile olsa iki evren arasında gidip gelmek çalışıyor olmalı. */

export function createSphereScreen({ root, onBack }) {
  root.innerHTML =
    '<div class="sphere-sky"></div>' +
    '<div class="sphere-motes" aria-hidden="true"></div>' +
    '<div class="sphere-title">DOODLE SPHERE</div>' +
    '<div class="sphere-note">adalar ve kapılar sonraki aşamada</div>';

  // Işık zerreleri — arka planın canlı durması için, dokunulmaz.
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

  const soul = makeSoul({ label: 'OVERWRITE\'a dön', onTap: onBack });
  root.appendChild(soul.el);

  return {
    destroy() { soul.destroy(); }
  };
}
