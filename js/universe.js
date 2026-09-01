import { roman } from './roman.js';
import { bindEditable, setText } from './editable.js';
import { makeGlitchButton, idleGlitch } from './glitch.js';
import { dissolveCard, dissolveAll } from './dissolve.js';

/* KAĞIDIN İÇİ — bir hedefin notları.
   Timeline ekranının Doodle Sphere'deki karşılığı ve mekanik olarak onun
   birebir aynısı: aynı butonlar, aynı otomatik kayıt, aynı konumsal
   numaralandırma, aynı pençe→glitch→piksel silme animasyonu.

   Burada önce Ink!Sans duruyor ve notlar onun konuşma balonlarıydı. Ink
   kaldırıldı; konuşan kimse kalmayınca balonun kuyruğu da anlamsızlaştı, o
   yüzden kartlar düz panel oldu. Evrenin adı da artık başlıkta — kimsenin
   kafasının üstünde değil. Ada çemberindeki etiket yine buradan besleniyor. */

export function createUniverseScreen({ root, evrenler, onBack }) {
  root.innerHTML =
    '<div class="topbar"><span id="uvBack"></span><span id="uvErase"></span></div>' +
    '<div class="uhead">' +
      '<div class="ukicker" id="uvKicker">UNIVERSE</div>' +
      '<div class="uname" id="uvName" contenteditable="true" spellcheck="false" data-ph="isim ver..."></div>' +
      '<div class="umeta" id="uvMeta">0 ENTRIES</div>' +
      '<div class="urule"></div>' +
    '</div>' +
    '<div class="note-scroll" id="uvScroll"></div>' +
    '<div class="saved" id="uvSaved">&#9622; KAYDEDİLDİ</div>' +
    '<div class="fab" id="uvAdd"></div>';

  const kicker  = root.querySelector('#uvKicker');
  const nameEl  = root.querySelector('#uvName');
  const metaEl  = root.querySelector('#uvMeta');
  const scroll  = root.querySelector('#uvScroll');
  const savedEl = root.querySelector('#uvSaved');

  let openId = null;

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
      const etiket = slot.querySelector('.nnum');
      if (etiket) etiket.textContent = 'ENTRY ' + not.sira;
    });
  }

  function noteCard(u, not) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.dataset.noteId = not.id;
    const card = document.createElement('div');
    card.className = 'ncard';
    card.innerHTML =
      '<div class="nrow">' +
        '<div class="nnum"></div><div class="nsep">-</div>' +
        '<div class="nname" contenteditable="true" spellcheck="false" data-ph="isim ver..."></div>' +
        '<div class="ndel" role="button" aria-label="sil">&#10005;</div>' +
      '</div>' +
      '<div class="ntxt" contenteditable="true" spellcheck="false" data-ph="buraya yaz..."></div>';
    slot.appendChild(card);

    card.querySelector('.nnum').textContent = 'ENTRY ' + not.sira;
    const nameField = card.querySelector('.nname');
    const textField = card.querySelector('.ntxt');
    setText(nameField, not.ad);      // güvenli
    setText(textField, not.metin);   // güvenli

    bindEditable(nameField, {
      onChange: (t) => evrenler.update(u.id, () => { not.ad = t.trim(); })
    });
    bindEditable(textField, {
      onChange: (t) => evrenler.update(u.id, () => { not.metin = t; })
    });

    card.querySelector('.ndel').addEventListener('click', () => {
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
    slot.querySelector('.ncard').classList.add('born');
    scroll.appendChild(slot);
    meta();
    setTimeout(() => {
      slot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      slot.querySelector('.nname').focus();
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
    dissolveAll({ scroll, kartSecici: '.ncard', onDone: close });
  }

  return {
    open(id) {
      openId = id;
      const u = evrenler.get(id);
      if (!u) return;
      kicker.textContent = 'UNIVERSE ' + roman(u.no);
      setText(nameEl, u.ad || '');   // güvenli
      nameEl.classList.toggle('ph', !(u.ad || '').trim());
      renderNotes();
    },
    destroy() { clearInterval(idleTimer); }
  };
}
