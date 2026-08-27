import { describe, it, expect } from 'vitest';
import { RING, relIndex, placement, edgePoint } from '../js/ring-math.js';

const CENTER = { x: 145, y: 278 };
const RADII = { rx: 110, ry: 152 };

describe('relIndex', () => {
  it('merkezdeki öğe için 0 verir', () => {
    expect(relIndex(3, 3, 10)).toBe(0);
  });

  it('kısa yoldan sarmalar', () => {
    // 14 öğede 13. öğe, 0. öğeden bir geride sayılmalı
    expect(relIndex(13, 0, 14)).toBe(-1);
    expect(relIndex(0, 13, 14)).toBe(1);
  });

  it('az öğede hiçbir öğeyi iki yerde göstermez', () => {
    const n = 3;
    const ds = [0, 1, 2].map(i => relIndex(i, 0, n));
    expect(new Set(ds).size).toBe(n);
    ds.forEach(d => expect(Math.abs(d)).toBeLessThanOrEqual(1));
  });

  it('tek öğede daima 0 verir', () => {
    expect(relIndex(0, 0, 1)).toBe(0);
  });
});

describe('placement', () => {
  it('öndeki föyü merkezin altına, tam boyutta koyar', () => {
    const p = placement(0, CENTER, RADII);
    expect(p.x).toBeCloseTo(CENTER.x, 5);
    expect(p.y).toBeCloseTo(CENTER.y + RADII.ry, 5);
    expect(p.scale).toBe(1);
    expect(p.opacity).toBe(1);
    expect(p.visible).toBe(true);
  });

  it('uzaklaştıkça küçültüp soldurur', () => {
    const a = placement(1, CENTER, RADII);
    const b = placement(2, CENTER, RADII);
    expect(a.scale).toBeGreaterThan(b.scale);
    expect(a.opacity).toBeGreaterThan(b.opacity);
    expect(a.z).toBeGreaterThan(b.z);
  });

  it('görünürlük sınırının dışını gizler', () => {
    expect(placement(RING.VISIBLE, CENTER, RADII).visible).toBe(true);
    const out = placement(RING.VISIBLE + 1, CENTER, RADII);
    expect(out.visible).toBe(false);
    expect(out.opacity).toBe(0);
  });

  it('ölçeği asla sıfırın altına indirmez', () => {
    expect(placement(20, CENTER, RADII).scale).toBeGreaterThan(0);
  });
});

describe('edgePoint', () => {
  const half = { halfW: RING.SHEET_W / 2, halfH: RING.SHEET_H / 2 };

  it('alttaki föyde ÜST kenarın ortasına bağlanır', () => {
    const sheet = { x: CENTER.x, y: CENTER.y + 200, ...half };
    const e = edgePoint(sheet, CENTER);
    expect(e.x).toBeCloseTo(CENTER.x, 5);
    expect(e.y).toBeCloseTo(sheet.y - half.halfH, 5);
  });

  it('üstteki föyde ALT kenara bağlanır', () => {
    const sheet = { x: CENTER.x, y: CENTER.y - 200, ...half };
    const e = edgePoint(sheet, CENTER);
    expect(e.y).toBeCloseTo(sheet.y + half.halfH, 5);
  });

  it('yandaki föyde İÇ YAN kenara bağlanır', () => {
    const sheet = { x: CENTER.x + 200, y: CENTER.y, ...half };
    const e = edgePoint(sheet, CENTER);
    expect(e.x).toBeCloseTo(sheet.x - half.halfW, 5);
    expect(e.y).toBeCloseTo(CENTER.y, 5);
  });

  it('bağlanma noktası her zaman föyün sınırı üstünde kalır', () => {
    const sheet = { x: CENTER.x + 90, y: CENTER.y + 120, ...half };
    const e = edgePoint(sheet, CENTER);
    const dx = Math.abs(e.x - sheet.x), dy = Math.abs(e.y - sheet.y);
    // en az bir eksende tam kenarda, hiçbir eksende dışarıda olmamalı
    expect(dx).toBeLessThanOrEqual(half.halfW + 1e-6);
    expect(dy).toBeLessThanOrEqual(half.halfH + 1e-6);
    const onEdge = Math.abs(dx - half.halfW) < 1e-6 || Math.abs(dy - half.halfH) < 1e-6;
    expect(onEdge).toBe(true);
  });

  it('merkezle aynı noktadaysa patlamaz', () => {
    const e = edgePoint({ x: CENTER.x, y: CENTER.y, ...half }, CENTER);
    expect(Number.isFinite(e.x)).toBe(true);
    expect(Number.isFinite(e.y)).toBe(true);
  });
});
