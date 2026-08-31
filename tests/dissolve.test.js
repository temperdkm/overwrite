// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { dissolveAll } from '../js/dissolve.js';

/* ERASE bütün kartları dağıtır. Buradaki asıl risk animasyonun güzelliği
   değil, EKRANIN KAPANMAMASI: veri dağılma başlamadan önce siliniyor, bu
   yüzden onDone çağrılmazsa kullanıcı artık var olmayan bir kaydın ekranında
   kilitli kalır. Testler tam olarak bunu koruyor. */

function kur(kartSiniflari) {
  const scroll = document.createElement('div');
  document.body.appendChild(scroll);
  kartSiniflari.forEach(sinif => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    if (sinif) {
      const card = document.createElement('div');
      card.className = sinif;
      slot.appendChild(card);
    }
    scroll.appendChild(slot);
  });
  return scroll;
}

/** jsdom'da düzen yok; kartları "ekranda görünür" saymak için ölçüm taklidi. */
function gorunurYap(scroll) {
  scroll.getBoundingClientRect = () => ({ top: 0, bottom: 500, left: 0, right: 300 });
  scroll.querySelectorAll('.slot').forEach((s, i) => {
    s.getBoundingClientRect = () => ({ top: i * 100, bottom: i * 100 + 90, left: 0, right: 300 });
  });
}

describe('dissolveAll', () => {
  beforeEach(() => { vi.useFakeTimers(); document.body.innerHTML = ''; });
  afterEach(() => { vi.useRealTimers(); });

  it('kartSecici verilmezse hata fırlatır', () => {
    const scroll = kur(['.ecard']);
    expect(() => dissolveAll({ scroll, onDone: () => {} })).toThrow(/kartSecici/);
  });

  it('ekranda görünmeyen kartları sessizce kaldırır ve yine de biter', () => {
    const scroll = kur(['ecard', 'ecard', 'ecard']);   // jsdom: hepsi 0 boyutlu
    const bitti = vi.fn();
    dissolveAll({ scroll, kartSecici: '.ecard', onDone: bitti });
    vi.advanceTimersByTime(400);
    expect(scroll.querySelectorAll('.slot')).toHaveLength(0);
    expect(bitti).toHaveBeenCalled();
  });

  /* Asıl regresyon: kart seçicisi '.ecard' olarak SABİT yazılıydı ve Doodle
     Sphere'in balonları '.bubble'. Kart null gelince dissolveCard ilk ölçümde
     hata fırlatıyor, hata dissolveAll'dan dışarı taşıyor ve emniyet kemeri
     hiç kurulmamış oluyordu: ekran sonsuza dek açık kalıyordu. */
  it('kartı bulunamayan slot zinciri durdurmaz, ekran yine kapanır', () => {
    const scroll = kur(['bubble', null, 'bubble']);
    gorunurYap(scroll);
    const bitti = vi.fn();
    dissolveAll({ scroll, kartSecici: '.bubble', onDone: bitti });
    vi.advanceTimersByTime(6000);
    expect(bitti).toHaveBeenCalled();
    expect(scroll.querySelectorAll('.slot')).toHaveLength(0);
  });

  it('doğru seçiciyle bütün kartlar dağılır ve ekran kapanır', () => {
    const scroll = kur(['bubble', 'bubble']);
    gorunurYap(scroll);
    const bitti = vi.fn();
    dissolveAll({ scroll, kartSecici: '.bubble', onDone: bitti });
    vi.advanceTimersByTime(6000);
    expect(bitti).toHaveBeenCalled();
    expect(scroll.querySelectorAll('.slot')).toHaveLength(0);
  });
});
