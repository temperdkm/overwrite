import { makeGlitchButton, fireGlitch, idleGlitch } from './glitch.js';

const host = document.getElementById('screen-ring');
host.style.cssText = 'display:flex;flex-direction:column;gap:22px;align-items:center;justify-content:center';

const ow    = makeGlitchButton({ label: 'OVERWRITE', variant: 'big',    onClick: () => {} });
const erase = makeGlitchButton({ label: 'ERASE',     variant: 'danger', onClick: () => {} });
const back  = makeGlitchButton({ label: '◄ GERI',                        onClick: () => {} });
host.append(ow, erase, back);

idleGlitch(() => [ow, erase, back], 1500);
