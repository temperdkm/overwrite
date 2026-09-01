import { makeGlitchButton, idleGlitch } from './glitch.js';
import { disaAktar, iceAktar, ozet, dosyaAdi } from './backup.js';
import { replaceAll } from './db.js';

/* YEDEK EKRANI — dışa aktar / içe aktar.
   OVERWRITE ekranındaki DATA COMPILATION başlığına dokununca açılıyor;
   X!Alphys'in işi zaten veriyi derleyip kağıda dökmek.

   İki tehlike var ve ikisi de burada karşılanıyor:
   1. Veri kaybı — uygulama notların tek kopyası, iCloud'a girmiyor.
   2. Yanlış geri yükleme — içe aktarma MEVCUT HER ŞEYİN üstüne yazar. Bu
      yüzden tek dokunuşla olmuyor: önce dosya okunuyor, içinde ne olduğu
      sayılarla gösteriliyor, onay ayrı bir butonda ve tehlike renginde. */

export function createBackupScreen({ root, store, evrenler, onBack, onRestored }) {
  root.innerHTML =
    '<div class="topbar"><span id="bkBack"></span></div>' +
    '<div class="bk-wrap">' +
      '<div class="bk-title">DATA COMPILATION</div>' +
      '<div class="bk-count" id="bkCount">—</div>' +

      '<div class="bk-block">' +
        '<div class="bk-lead">Bütün timeline ve evrenler tek dosyaya yazılır. ' +
          'Telefonda paylaş menüsü açılır — dosyayı Dosyalar\'a, e-postaya ' +
          'ya da nereye istersen oraya kaydet.</div>' +
        '<div id="bkOut"></div>' +
      '</div>' +

      '<div class="bk-block">' +
        '<div class="bk-lead">Bir yedek dosyası seç. Önce içinde ne olduğunu ' +
          'göstereceğim, üstüne yazmadan önce ayrıca onaylayacaksın.</div>' +
        '<div id="bkIn"></div>' +
        '<input type="file" id="bkFile" accept="application/json,.json" hidden>' +
      '</div>' +

      '<div class="bk-confirm" id="bkConfirm" hidden>' +
        '<div class="bk-found" id="bkFound"></div>' +
        '<div class="bk-warn">Bu, şu an uygulamadaki HER ŞEYİN üstüne yazar. ' +
          'Geri alınamaz.</div>' +
        '<div id="bkGo"></div>' +
      '</div>' +

      '<div class="bk-status" id="bkStatus"></div>' +
    '</div>';

  const countEl   = root.querySelector('#bkCount');
  const confirmEl = root.querySelector('#bkConfirm');
  const foundEl   = root.querySelector('#bkFound');
  const statusEl  = root.querySelector('#bkStatus');
  const fileEl    = root.querySelector('#bkFile');

  let bekleyen = null;   // okunmuş ama henüz yazılmamış yedek

  function durum(mesaj, hataMi) {
    statusEl.textContent = mesaj;                 // kullanıcı metni: textContent
    statusEl.classList.toggle('bk-err', !!hataMi);
  }

  function onayiKapat() {
    bekleyen = null;
    confirmEl.hidden = true;
    fileEl.value = '';     // aynı dosya tekrar seçilebilsin diye sıfırlanmalı
  }

  const backBtn = makeGlitchButton({ label: '◄ GERI', onClick: () => { onayiKapat(); onBack(); } });
  root.querySelector('#bkBack').appendChild(backBtn);

  /* DIŞA AKTAR.
     navigator.share ÖNCE ve await'siz çağrılıyor: Safari paylaşmayı yalnızca
     dokunuşun doğrudan devamında kabul ediyor, araya bir await girerse jest
     bağı kopuyor ve menü hiç açılmıyor. */
  const outBtn = makeGlitchButton({ label: '▤ DIŞA AKTAR', onClick: () => {
    try {
      const metin = disaAktar({ timelines: store.list(), universes: evrenler.list() });
      const ad = dosyaAdi();
      const dosya = new File([metin], ad, { type: 'application/json' });

      if (navigator.canShare && navigator.canShare({ files: [dosya] })) {
        navigator.share({ files: [dosya], title: 'OVERWRITE yedeği' })
          .then(() => durum('Paylaş menüsü açıldı. Dosyayı kaydettiğinden emin ol.'))
          .catch((err) => {
            // Kullanıcı menüyü kapattıysa hata değil, sessizce geçilir.
            if (err && err.name === 'AbortError') return;
            durum('Paylaşılamadı: ' + (err && err.message ? err.message : 'bilinmeyen hata'), true);
          });
        return;
      }

      /* Masaüstü yedeği: iPhone'da indirme sorunlu ama bilgisayarda paylaş
         menüsü yok, o yüzden ikisi de gerekiyor. */
      const url = URL.createObjectURL(new Blob([metin], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = ad;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      durum('Dosya indirildi: ' + ad);
    } catch (err) {
      durum('Yedek alınamadı: ' + (err && err.message ? err.message : 'bilinmeyen hata'), true);
    }
  }});
  root.querySelector('#bkOut').appendChild(outBtn);

  const inBtn = makeGlitchButton({ label: '▤ İÇE AKTAR', onClick: () => {
    onayiKapat();
    durum('');
    fileEl.click();
  }});
  root.querySelector('#bkIn').appendChild(inBtn);

  fileEl.addEventListener('change', async () => {
    const dosya = fileEl.files && fileEl.files[0];
    if (!dosya) return;
    try {
      const metin = await dosya.text();
      bekleyen = iceAktar(metin);
      const o = ozet(bekleyen);
      const tarih = bekleyen.tarih ? new Date(bekleyen.tarih) : null;
      foundEl.textContent =
        o.timeline + ' TIMELINE · ' + o.universe + ' UNIVERSE · ' + o.entry + ' ENTRY' +
        (tarih && !isNaN(tarih) ? '\nYedek tarihi: ' + tarih.toLocaleString('tr-TR') : '');
      confirmEl.hidden = false;
      durum('');
    } catch (err) {
      onayiKapat();
      durum(err && err.message ? err.message : 'Dosya okunamadı.', true);
    }
  });

  const goBtn = makeGlitchButton({ label: 'ÜSTÜNE YAZ', variant: 'danger', onClick: async () => {
    if (!bekleyen) return;
    const yedek = bekleyen;
    onayiKapat();
    durum('Yazılıyor...');
    try {
      /* Bekleyen yazmalar önce diske gitsin: aksi halde geri yüklemeden
         hemen sonra gecikmeli bir yazma tetiklenip yeni veriyi bozabilirdi. */
      await store.flush();
      await evrenler.flush();
      await replaceAll(yedek);       // iki depo TEK işlemde değişir
      await Promise.all([store.load(), evrenler.load()]);
      const o = ozet(yedek);
      durum('Geri yüklendi: ' + o.timeline + ' timeline, ' + o.universe + ' evren.');
      onRestored();
    } catch (err) {
      durum('Geri yüklenemedi, veri değişmedi: ' +
            (err && err.message ? err.message : 'bilinmeyen hata'), true);
    }
  }});
  root.querySelector('#bkGo').appendChild(goBtn);

  const idleTimer = idleGlitch(
    () => (root.hasAttribute('hidden') ? [] : [backBtn, outBtn, inBtn]),
    3200
  );

  return {
    open() {
      onayiKapat();
      durum('');
      const say = (liste) => liste.reduce((t, k) => t + k.entries.length, 0);
      const t = store.list(), u = evrenler.list();
      countEl.textContent =
        t.length + ' TIMELINE · ' + u.length + ' UNIVERSE · ' + (say(t) + say(u)) + ' ENTRY';
    },
    destroy() { clearInterval(idleTimer); }
  };
}
