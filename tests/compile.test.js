import { describe, it, expect } from 'vitest';
import { timelineMetni, dosyaAdi } from '../js/compile.js';

function tl(over = {}) {
  return {
    id: 'a', no: 10, ad: 'ALEV ÇUKURU', nextSira: 2,
    entries: [
      { id: 'e0', sira: 0, ad: 'ÖLÇÜLER', metin: 'Çukurun çapı 80 cm olacak.' },
      { id: 'e1', sira: 1, ad: 'AYAKLAR', metin: 'Üç ayak olsun, dört değil.' }
    ],
    ...over
  };
}

describe('timelineMetni', () => {
  it('başlıkta Roma rakamı ve adı birlikte verir', () => {
    expect(timelineMetni(tl())).toContain('TIMELINE X — ALEV ÇUKURU');
  });

  it('entry sayısını tekil/çoğul doğru yazar', () => {
    expect(timelineMetni(tl())).toContain('2 ENTRIES');
    const tek = tl({ entries: [{ id: 'e0', sira: 0, ad: 'A', metin: 'x' }] });
    expect(timelineMetni(tek)).toContain('1 ENTRY');
    expect(timelineMetni(tek)).not.toContain('1 ENTRIES');
  });

  it('her entry\'yi sırası ve adıyla yazar', () => {
    const m = timelineMetni(tl());
    expect(m).toContain('ENTRY 0 — ÖLÇÜLER');
    expect(m).toContain('ENTRY 1 — AYAKLAR');
  });

  it('metinleri olduğu gibi taşır', () => {
    const m = timelineMetni(tl());
    expect(m).toContain('Çukurun çapı 80 cm olacak.');
    expect(m).toContain('Üç ayak olsun, dört değil.');
  });

  it('adsız timeline ve adsız entry\'de tire bırakmaz', () => {
    const m = timelineMetni(tl({
      ad: '',
      entries: [{ id: 'e0', sira: 0, ad: '', metin: 'not' }]
    }));
    expect(m).toContain('TIMELINE X\n');
    expect(m).toContain('ENTRY 0\n');
    expect(m).not.toContain('— \n');
  });

  it('boş metni "(boş)" diye işaretler, sessizce yutmaz', () => {
    const m = timelineMetni(tl({
      entries: [{ id: 'e0', sira: 0, ad: 'A', metin: '   ' }]
    }));
    expect(m).toContain('(boş)');
  });

  it('hiç entry yoksa bunu açıkça söyler', () => {
    const m = timelineMetni(tl({ entries: [] }));
    expect(m).toContain('0 ENTRIES');
    expect(m).toContain('(bu timeline boş)');
  });

  it('bozuk numarada patlamaz, sayıyı olduğu gibi yazar', () => {
    expect(timelineMetni(tl({ no: 0 }))).toContain('TIMELINE 0');
  });
});

describe('dosyaAdi', () => {
  it('rakamı ve adı içerir, .txt ile biter', () => {
    expect(dosyaAdi(tl())).toBe('OVERWRITE X - ALEV ÇUKURU.txt');
  });

  it('dosya adında yasak karakterleri atar', () => {
    expect(dosyaAdi(tl({ ad: 'A/B:C*D?E"F<G>H|I' }))).toBe('OVERWRITE X - ABCDEFGHI.txt');
  });

  it('çok uzun adı kırpar', () => {
    const uzun = dosyaAdi(tl({ ad: 'A'.repeat(100) }));
    expect(uzun.length).toBeLessThan(60);
    expect(uzun.endsWith('.txt')).toBe(true);
  });

  it('adsız timeline\'da sondaki tireyi bırakmaz', () => {
    expect(dosyaAdi(tl({ ad: '' }))).toBe('OVERWRITE X.txt');
    expect(dosyaAdi(tl({ ad: '   ' }))).toBe('OVERWRITE X.txt');
  });
});
