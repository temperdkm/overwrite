// Bağımlılıksız ikon üretimi: siyah zemin üstünde mor çerçeveli "OW".
// Basit bir PNG kodlayıcı yerine SVG'yi canvas'sız gömmek yerine,
// düz renkli PNG'yi elle kuruyoruz (zlib ile).
import { writeFile, mkdir } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';

function png(size, draw) {
  const bytesPerPixel = 4;
  const raw = Buffer.alloc((size * bytesPerPixel + 1) * size);
  const px = (x, y, r, g, b, a) => {
    const row = y * (size * bytesPerPixel + 1);
    const off = row + 1 + x * bytesPerPixel;
    raw[off] = r; raw[off + 1] = g; raw[off + 2] = b; raw[off + 3] = a;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) draw(px, x, y, size);

  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crcTable = png.crcTable || (png.crcTable = (() => {
      const t = [];
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
      }
      return t;
    })());
    let crc = 0xFFFFFFFF;
    for (const b of td) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE((crc ^ 0xFFFFFFFF) >>> 0);
    return Buffer.concat([len, td, crcBuf]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const draw = (px, x, y, size) => {
  const u = size / 32;                 // 32x32'lik ızgara
  const gx = Math.floor(x / u), gy = Math.floor(y / u);
  const outer = gx >= 2 && gx <= 29 && gy >= 9 && gy <= 22;
  const outerEdge = outer && (gx <= 3 || gx >= 28 || gy <= 10 || gy >= 21);
  const inner = gx >= 6 && gx <= 25 && gy >= 13 && gy <= 18;
  const innerEdge = inner && (gx === 6 || gx === 25 || gy === 13 || gy === 18);
  if (outerEdge || innerEdge) px(x, y, 0xA8, 0x55, 0xF7, 255);
  else px(x, y, 0x08, 0x06, 0x0C, 255);
};

await mkdir('icons', { recursive: true });
for (const size of [192, 512]) {
  await writeFile(`icons/icon-${size}.png`, png(size, draw));
  console.log('yazıldı: icons/icon-' + size + '.png');
}
