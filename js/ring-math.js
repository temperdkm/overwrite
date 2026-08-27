export const RING = {
  STEP_DEG: 50,   // iki komşu föy arasındaki açı
  VISIBLE: 3,     // merkezden kaç adım öteye kadar görünür
  SHEET_W: 82,
  SHEET_H: 114
};

/**
 * Bir föyün merkezdekine göre sarmalı sıra farkı.
 * Sonuç -n/2 .. +n/2 aralığına kırpılır; bu sayede az sayıda
 * timeline'da hiçbir föy aynı anda iki konumda görünmez.
 */
export function relIndex(i, cur, n) {
  let d = i - cur;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

/** Sıra farkından çemberdeki konum, ölçek, saydamlık ve katman. */
export function placement(d, center, radii) {
  const ad = Math.abs(d);
  const th = (90 + d * RING.STEP_DEG) * Math.PI / 180;
  const visible = ad <= RING.VISIBLE;
  return {
    x: center.x + radii.rx * Math.cos(th),
    y: center.y + radii.ry * Math.sin(th),
    scale: Math.max(0.18, 1 - ad * 0.17),
    opacity: visible ? Number((1 - ad * 0.24).toFixed(2)) : 0,
    visible,
    z: 14 - ad
  };
}

/**
 * İpin föye bağlanacağı nokta: merkezden föy merkezine giden doğrunun
 * föyün sınır kutusunu kestiği yer. Kendiliğinden butona BAKAN kenarı
 * bulur, bu yüzden ip hiçbir zaman yazının üstünden geçmez.
 */
export function edgePoint(sheet, center) {
  const dx = sheet.x - center.x;
  const dy = sheet.y - center.y;
  const t = Math.min(
    sheet.halfW / (Math.abs(dx) || 1e-4),
    sheet.halfH / (Math.abs(dy) || 1e-4)
  );
  return { x: sheet.x - dx * t, y: sheet.y - dy * t };
}
