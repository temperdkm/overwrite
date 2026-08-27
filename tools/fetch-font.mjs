// Press Start 2P'nin latin VE latin-ext alt kümelerini indirir.
// latin-ext olmadan Ğ, Ş, İ harfleri sistem fontuna düşer.
import { writeFile, mkdir } from 'node:fs/promises';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const cssUrl = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
const css = await fetch(cssUrl, { headers: { 'User-Agent': UA } }).then(r => r.text());

// Her @font-face bloğunun üstünde /* latin */ gibi bir yorum var.
const blocks = css.split('/*').slice(1);
const wanted = { latin: null, 'latin-ext': null };

for (const block of blocks) {
  const name = block.slice(0, block.indexOf('*/')).trim();
  if (!(name in wanted)) continue;
  const m = block.match(/url\((https:[^)]+\.woff2)\)/);
  if (m) wanted[name] = m[1];
}

for (const [name, url] of Object.entries(wanted)) {
  if (!url) throw new Error('Alt küme bulunamadı: ' + name);
  const buf = Buffer.from(await fetch(url, { headers: { 'User-Agent': UA } })
    .then(r => r.arrayBuffer()));
  await mkdir('fonts', { recursive: true });
  const file = `fonts/PressStart2P-${name}.woff2`;
  await writeFile(file, buf);
  console.log('indirildi:', file, buf.length, 'bayt');
}
