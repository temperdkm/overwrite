import { roman } from './roman.js';
import { bindEditable, setText } from './editable.js';
import { makeGlitchButton, idleGlitch } from './glitch.js';
import { dissolveCard, dissolveAll } from './dissolve.js';
import { makeInk, inkKonusuyor } from './ink.js';

/* KAPININ ARKASI — bir hedefin notları.
   Timeline ekranının Doodle Sphere'deki karşılığı ve mekanik olarak onun
   birebir aynısı: aynı butonlar, aynı otomatik kayıt, aynı konumsal
   numaralandırma, aynı pençe→glitch→piksel silme animasyonu. Değişen
   yalnızca sahne — burada Ink!Sans var ve notlar onun konuşma balonları.

   Evrenin adı INK'İN KAFASININ ÜSTÜNDE duruyor; ada çemberindeki etiket de
   oradan besleniyor.

   Yazarken Ink'in ağzı oynuyor. Konuşma hâli yazının kendisinden değil,
   yazmanın DURMASINDAN kapanıyor: her tuş vuruşunda sayaç sıfırlanıyor,
   700 ms sessizlikten sonra ağız kapanıyor. Aksi halde ağız her karakterde
   bir açılıp kapanır, konuşmaz. */

const SUSMA_MS = 700;

export function createUniverseScreen({ root, evrenler, onBack }) {
  root.innerHTML =
    '<div class="topbar"><span id="uvBack"></span><span id="uvErase"></span></div>' +
    '<div class="uhead">' +
      '<div class="ukicker" id="uvKicker">UNIVERSE</div>' +
      '<div class="uname" id="uvName" contenteditable="true" spellcheck="false" data-ph="isim ver..."></div>' +
      '<div class="urow"><span id="uvInk"></span><span class="umeta" id="uvMeta">0 ENTRIES</span></div>' +
    '</div>' +
    '<div class="note-scroll" id="uvScroll"></div>' +
    '<div class="saved" id="uvSaved">&#9622; KAYDEDİLDİ</div>' +
    '<div class="fab" id="uvAdd"></div>';

  const kicker  = root.querySelector('#uvKicker');
  const nameEl  = root.querySelector('#uvName');
  const metaEl  = root.querySelector('#uvMeta');
  const scroll  = root.querySelector('#uvScroll');
  const savedEl = root.querySelector('#uvSaved');

  const ink = makeInk();
  root.querySelector('#uvInk').appendChild(ink);

  let openId = null;
  let susmaTimer = null;

  /** Her tuş vuruşunda çağrılır: ağzı açar, sessizlik sayacını sıfırlar. */
  function konusmayaBasla() {
    inkKonusuyor(ink, true);
    clearTimeout(susmaTimer);
    susmaTimer = setTimeout(() => inkKonusuyor(ink, false), SUSMA_MS);
  }

  const backBtn  = makeGlitchButton({ label: '◄ GERI', onClick: () => { openId = null; onBack(); } });
  const eraseBtn = makeGlitchButton({ label: 'ERASE', variant: 'danger', onClick: () => eraseUniverse() });
  const addBtn   = makeGlitchButton({ label: '+', onClick: () => addNote() });
  root.querySelector('#uvBack').appendChild(backBtn);
  root.querySelector('#uvErase').appendChild(eraseBtn);
  root.querySelector('#uvAdd').appendChild(addBtn);

  const idleTimer = idleGlitch(
    () => (root.hasAttribute('hidden') ? [] : [backBtn, eraseBtn, addBtn]),
    3000
  );

  bindEditable(nameEl, {
    onChange: (text) => {
      konusmayaBasla();
      if (openId) evrenler.update(openId, (u) => { u.ad = text.trim(); });
    }
  });

  /* onSaved başarıda argümansız, HATADA Error ile çağrılır (bkz. store.js).
     Parametre okunmazsa başarısız bir yazma da "KAYDEDİLDİ" gösterir —
     verinin tek kopyası olan bir uygulamada sessiz hatadan beter, aktif
     yanlış güvence. Hata tehlike renginde ve SÖNMEZ. */
  evrenler.onSaved((err) => {
    savedEl.classList.remove('show', 'fail');
    void savedEl.offsetWidth;
    if (err) {
      console.error('kaydedilemedi:', err);
      savedEl.textContent = '▖ KAYDEDİLEMEDİ';
      savedEl.classList.add('fail');
    } else {
      savedEl.textContent = '▖ KAYDEDİLDİ';
      savedEl.classList.add('show');
    }
  });

  function meta() {
    const u = evrenler.get(openId);
    if (!u) return;
    const n = u.entries.length;
    metaEl.textContent = n + (n === 1 ? ' ENTRY' : ' ENTRIES');
  }

  /**
   * Numaralar konumsal olduğu için bir not silinince kalanların sırası kayar.
   * Kartlar yeniden çizilmediğinden ekrandaki etiketler eski kalırdı; her
   * kart kendi not id'sini taşıyor ve etiket güncel sıradan yeniden yazılıyor.
   */
  function etiketleriTazele() {
    const u = evrenler.get(openId);
    if (!u) return;
    scroll.querySelectorAll('.slot[data-note-id]').forEach(slot => {
      const not = u.entries.find(e => e.id === slot.dataset.noteId);
      if (!not) return;
      const etiket = slot.querySelector('.bnum');
      if (etiket) etiket.textContent = 'ENTRY ' + not.sira;
    });
  }

  function noteCard(u, not) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.noteId = not.id;
    const card = document.createElement('div');
    card.className = 'bubble';
    card.innerHTML =
      '<div class="btail" aria-hidden="true"></div>' +
      '<div class="brow">' +
        '<div class="bnum"></div><div class="bsep">-</div>' +
        '<div class="bname" contenteditable="true" spellcheck="false" data-ph="isim ver..."></div>' +
        '<div class="bdel" role="button" aria-label="sil">&#10005;</div>' +
      '</div>' +
      '<div class="btxt" contenteditable="true" spellcheck="false" data-ph="buraya yaz..."></div>';
    slot.appendChild(card);

    card.querySelector('.bnum').textContent = 'ENTRY ' + not.sira;
    const nameField = card.querySelector('.bname');
    const textField = card.querySelector('.btxt');
    setText(nameField, not.ad);      // güvenli
    setText(textField, not.metin);   // güvenli

    bindEditable(nameField, {
      onChange: (t) => { konusmayaBasla(); evrenler.update(u.id, () => { not.ad = t.trim(); }); }
    });
    bindEditable(textField, {
      onChange: (t) => { konusmayaBasla(); evrenler.update(u.id, () => { not.metin = t; }); }
    });

    card.querySelector('.bdel').addEventListener('click', () => {
      evrenler.deleteNote(u.id, not.id);
      // Etiketler hemen tazelenir: dağılma animasyonu ~1 sn sürüyor, o süre
      // boyunca kalan kartlar yanlış numara göstermemeli.
      etiketleriTazele();
      dissolveCard({ slot, card, onDone: () => { meta(); etiketleriTazele(); } });
    });

    return slot;
  }

  function renderNotes() {
    const u = evrenler.get(openId);
    scroll.innerHTML = '';
    if (!u) return;
    u.entries.forEach(not => scroll.appendChild(noteCard(u, not)));
    meta();
  }

  function addNote() {
    const u = evrenler.get(openId);
    if (!u) return;
    const not = evrenler.addNote(u.id);
    const slot = noteCard(u, not);
    slot.querySelector('.bubble').classList.add('born');
    scroll.appendChild(slot);
    meta();
    setTimeout(() => {
      slot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      slot.querySelector('.bname').focus();
    }, 140);
  }

  function eraseUniverse() {
    const u = evrenler.get(openId);
    if (!u) return;
    // Veri hemen silinir; animasyon yalnızca kozmetiktir ve tamamlanmasını
    // beklemek, uygulama arka planda kapatılırsa silmeyi iptal edebilirdi.
    evrenler.deleteUniverse(u.id);
    openId = null;
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      onBack();
    };
    dissolveAll({ scroll, kartSecici: '.bubble', onDone: close });
  }

  return {
    open(id) {
      openId = id;
      const u = evrenler.get(id);
      if (!u) return;
      kicker.textContent = 'UNIVERSE ' + roman(u.no);
      setText(nameEl, u.ad || '');   // güvenli
      nameEl.classList.toggle('ph', !(u.ad || '').trim());
      inkKonusuyor(ink, false);
      renderNotes();
    },
    destroy() {
      clearInterval(idleTimer);
      clearTimeout(susmaTimer);
    }
  };
}
