import { roman } from './roman.js';
import { bindEditable, setText } from './editable.js';
import { makeGlitchButton, idleGlitch } from './glitch.js';
import { dissolveCard, dissolveAll } from './dissolve.js';

export function createTimelineScreen({ root, store, onBack }) {
  root.innerHTML =
    '<div class="topbar"><span id="tlBack"></span><span id="tlErase"></span></div>' +
    '<div class="thead">' +
      '<div class="tkicker" id="tlKicker">TIMELINE</div>' +
      '<div class="tname" id="tlName" contenteditable="true" spellcheck="false" data-ph="isim ver..."></div>' +
      '<div class="tmeta" id="tlMeta">0 ENTRIES</div>' +
      '<div class="trule"></div>' +
    '</div>' +
    '<div class="entry-scroll" id="tlScroll"></div>' +
    '<div class="saved" id="tlSaved">&#9622; KAYDEDİLDİ</div>' +
    '<div class="fab" id="tlAdd"></div>';

  const kicker = root.querySelector('#tlKicker');
  const nameEl = root.querySelector('#tlName');
  const metaEl = root.querySelector('#tlMeta');
  const scroll = root.querySelector('#tlScroll');
  const savedEl = root.querySelector('#tlSaved');

  let openId = null;

  const backBtn  = makeGlitchButton({ label: '◄ GERI', onClick: () => { openId = null; onBack(); } });
  const eraseBtn = makeGlitchButton({ label: 'ERASE', variant: 'danger', onClick: () => eraseTimeline() });
  const addBtn   = makeGlitchButton({ label: '+', onClick: () => addEntry() });
  root.querySelector('#tlBack').appendChild(backBtn);
  root.querySelector('#tlErase').appendChild(eraseBtn);
  root.querySelector('#tlAdd').appendChild(addBtn);

  // Butonlar kendiliğinden, sırayla bozulur. Ekran gizliyken durur.
  const idleTimer = idleGlitch(
    () => (root.hasAttribute('hidden') ? [] : [backBtn, eraseBtn, addBtn]),
    3000
  );

  bindEditable(nameEl, {
    onChange: (text) => {
      if (openId) store.update(openId, (tl) => { tl.ad = text.trim(); });
    }
  });

  store.onSaved(() => {
    savedEl.classList.remove('show');
    void savedEl.offsetWidth;
    savedEl.classList.add('show');
  });

  function meta() {
    const tl = store.get(openId);
    if (!tl) return;
    const n = tl.entries.length;
    metaEl.textContent = n + (n === 1 ? ' ENTRY' : ' ENTRIES');
  }

  function entryCard(tl, en) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    const card = document.createElement('div');
    card.className = 'ecard';
    card.innerHTML =
      '<div class="erow">' +
        '<div class="enum"></div><div class="esep">-</div>' +
        '<div class="ename" contenteditable="true" spellcheck="false" data-ph="isim ver..."></div>' +
        '<div class="edel" role="button" aria-label="sil">&#10005;</div>' +
      '</div>' +
      '<div class="etxt" contenteditable="true" spellcheck="false" data-ph="buraya yaz..."></div>';
    slot.appendChild(card);

    card.querySelector('.enum').textContent = 'ENTRY ' + en.sira;
    const nameField = card.querySelector('.ename');
    const textField = card.querySelector('.etxt');
    setText(nameField, en.ad);      // güvenli
    setText(textField, en.metin);   // güvenli

    bindEditable(nameField, {
      onChange: (t) => store.update(tl.id, () => { en.ad = t.trim(); })
    });
    bindEditable(textField, {
      onChange: (t) => store.update(tl.id, () => { en.metin = t; })
    });

    card.querySelector('.edel').addEventListener('click', () => {
      store.deleteEntry(tl.id, en.id);
      dissolveCard({ slot, card, onDone: meta });
    });

    return slot;
  }

  function renderEntries() {
    const tl = store.get(openId);
    scroll.innerHTML = '';
    if (!tl) return;
    tl.entries.forEach(en => scroll.appendChild(entryCard(tl, en)));
    meta();
  }

  function addEntry() {
    const tl = store.get(openId);
    if (!tl) return;
    const en = store.addEntry(tl.id);
    const slot = entryCard(tl, en);
    slot.querySelector('.ecard').classList.add('born');
    scroll.appendChild(slot);
    meta();
    setTimeout(() => {
      slot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      slot.querySelector('.ename').focus();
    }, 140);
  }

  function eraseTimeline() {
    const tl = store.get(openId);
    if (!tl) return;
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      store.deleteTimeline(tl.id);
      openId = null;
      onBack();
    };
    dissolveAll({ scroll, onDone: close });
  }

  return {
    open(id) {
      openId = id;
      const tl = store.get(id);
      if (!tl) return;
      kicker.textContent = 'TIMELINE ' + roman(tl.no);
      setText(nameEl, tl.ad || '');   // güvenli
      nameEl.classList.toggle('ph', !(tl.ad || '').trim());
      renderEntries();
    },
    destroy() { clearInterval(idleTimer); }
  };
}
