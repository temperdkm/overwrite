// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setText, bindEditable } from '../js/editable.js';

function makeEl(ph = 'yaz...') {
  const el = document.createElement('div');
  el.setAttribute('contenteditable', 'true');
  el.dataset.ph = ph;
  document.body.appendChild(el);
  return el;
}

beforeEach(() => { document.body.innerHTML = ''; });

describe('setText', () => {
  it('HTML etiketini metin olarak yazar, eleman OLUŞTURMAZ', () => {
    const el = makeEl();
    setText(el, '<img src=x onerror=alert(1)>');
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('kalın etiketini metin olarak korur', () => {
    const el = makeEl();
    setText(el, '<b>KALIN</b> ve 5 < 8');
    expect(el.querySelector('b')).toBeNull();
    expect(el.textContent).toBe('<b>KALIN</b> ve 5 < 8');
  });

  it('null ve undefined için boş yazar', () => {
    const el = makeEl();
    setText(el, null);
    expect(el.textContent).toBe('');
    setText(el, undefined);
    expect(el.textContent).toBe('');
  });
});

describe('bindEditable', () => {
  it('boşken yer tutucu sınıfını koyar', () => {
    const el = makeEl();
    bindEditable(el, { onChange: () => {} });
    expect(el.classList.contains('ph')).toBe(true);
  });

  it('yazınca yer tutucuyu kaldırır ve onChange çağırır', () => {
    const el = makeEl();
    const spy = vi.fn();
    bindEditable(el, { onChange: spy });
    el.textContent = 'merhaba';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.classList.contains('ph')).toBe(false);
    expect(spy).toHaveBeenCalledWith('merhaba');
  });

  it('SİLİNCE KALAN <br> temizlenir ve yer tutucu geri gelir', () => {
    const el = makeEl();
    bindEditable(el, { onChange: () => {} });
    el.textContent = 'x';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    // tarayıcının içerik silinince bıraktığı artık
    el.innerHTML = '<br>';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.innerHTML).toBe('');
    expect(el.classList.contains('ph')).toBe(true);
  });

  it('yalnızca boşluk da boş sayılır', () => {
    const el = makeEl();
    bindEditable(el, { onChange: () => {} });
    el.textContent = '   ';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.classList.contains('ph')).toBe(true);
  });
});
