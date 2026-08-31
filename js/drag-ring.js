/* Çemberi parmakla çevirme.
   Hem OVERWRITE'ın timeline çemberinde hem Doodle Sphere'in ada çemberinde
   aynı jest geçerli, bu yüzden mantık tek yerde: iki kopya olsaydı buradaki
   bir düzeltme birinde uygulanıp diğerinde unutulurdu.

   Çember parmağı SÜREKLİ takip eder (adım adım sıçramaz) ve bırakınca en
   yakın öğeye oturur. Sağa sürüklemek öğeleri sağa götürür — yani soldaki
   öne gelir; bu, içeriği tutup çekmenin doğal yönü.

   KARAR EŞİĞİ: bir föye/adaya dokunmak da touchstart/touchend üretiyor.
   İlk 8 piksel boyunca jestin ne olduğuna karar verilmez; hareket dikey
   ağırlıklıysa sürükleme hiç başlamaz, böylece dokunuşlar çemberi çevirmez. */

const KARAR_PX = 8;
const YATAYLIK = 1.5;

/**
 * @param onSurukle  kesirli adım kayması ile çağrılır (60fps) — sadece konumla
 * @param onBitir    parmak kalkınca tam sayı adım ile çağrılır — yeniden çiz
 */
export function attachRingDrag({ root, onSurukle, onBitir }) {
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
      root.classList.add('dragging');   // geçişi kapatır, öğe parmağa yapışır
    }
    onSurukle(dx / adimMesafesi());
  };

  const bitir = () => {
    if (!surukluyor) { izleniyor = false; return; }
    surukluyor = false;
    izleniyor = false;
    surukledi = true;                   // bu jestten doğacak click'i yut
    root.classList.remove('dragging');
    onBitir();
  };

  /* Sürükleme bittiğinde tarayıcı ayrıca bir click üretiyor; öğenin üstünde
     başlayan bir sürükleme yanlışlıkla onu açmasın diye yakalama aşamasında
     durduruluyor. */
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

  return {
    destroy() {
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      root.removeEventListener('touchend', bitir);
      root.removeEventListener('touchcancel', bitir);
      root.removeEventListener('click', onClickCapture, true);
    }
  };
}
