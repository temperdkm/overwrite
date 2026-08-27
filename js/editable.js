/**
 * Kullanıcı metnini güvenle yazar.
 * innerHTML KULLANILMAZ: aksi halde nota <b>x</b> yazınca etiket kaybolur
 * ve <img src=x onerror=...> yazınca sayfada gerçek eleman oluşur.
 */
export function setText(el, text) {
  el.textContent = text == null ? '' : String(text);
}

function isEmpty(el) {
  return el.textContent.trim() === '';
}

/**
 * Boş alanı gerçekten boşaltır.
 * Tarayıcı içerik silinince görünmez bir <br> bırakıyor; bu yüzden
 * :empty CSS kuralı tutmuyor ve yer tutucu bir daha görünmüyor.
 */
function normalize(el) {
  if (isEmpty(el)) el.innerHTML = '';
  el.classList.toggle('ph', isEmpty(el));
}

/** Düzenlenebilir alanı bağlar: düz yapıştırma + güvenli yer tutucu. */
export function bindEditable(el, { onChange }) {
  el.addEventListener('input', () => {
    normalize(el);
    onChange(el.textContent);
  });

  el.addEventListener('blur', () => normalize(el));

  el.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain') || '';
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    normalize(el);
    onChange(el.textContent);
  });

  normalize(el);
}
