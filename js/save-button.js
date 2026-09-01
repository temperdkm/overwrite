/* SAVE — Doodle Sphere'de yeni evren doğuran buton.
   CREATE'in yerini aldı. Undertale'in SAVE noktası gibi: gökkuşağı çerçeve,
   içi saydam, yanında dört köşeli yıldız.

   GLITCH YOK. Uygulamanın bütün butonları arada bozulur, bu bozulmaz —
   kullanıcının isteği. Efekti bozulma değil PARLAMA: aralıklarla üstünden
   bir ışık geçiyor. Bu yüzden makeGlitchButton kullanılmıyor, kendi
   yapısı var. */

const YILDIZ =
  '<svg class="save-star" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 1.5 C 13.1 8, 16 10.9, 22.5 12 C 16 13.1, 13.1 16, 12 22.5 ' +
            'C 10.9 16, 8 13.1, 1.5 12 C 8 10.9, 10.9 8, 12 1.5 Z"/>' +
  '</svg>';

/**
 * @param onClick  basılınca çağrılır
 * @param label    ekran okuyucu etiketi
 */
export function makeSaveButton({ onClick, label }) {
  const el = document.createElement('div');
  el.className = 'save-btn';
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', label);

  const ic = document.createElement('div');
  ic.className = 'save-in';
  ic.innerHTML = YILDIZ;                       // kullanıcı metni İÇERMEZ

  const yazi = document.createElement('span');
  yazi.className = 'save-text';
  yazi.textContent = 'SAVE';
  ic.appendChild(yazi);
  el.appendChild(ic);

  const bas = (e) => { e.preventDefault(); onClick(); };
  el.addEventListener('click', bas);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') bas(e);
  });

  return el;
}

/**
 * Hiç ada yokken buton daha sık parlar: kullanıcı ilk bakışta neye basacağını
 * anlasın diye. Çember ekranındaki OVERWRITE'ın daha sık bozulmasıyla aynı
 * mantık — orada bozulma, burada parlama.
 */
export function setSaveAttention(el, aktif) {
  el.classList.toggle('dikkat', !!aktif);
}
