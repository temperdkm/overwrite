/* Kimlik üretimi tek yerde: yedekten dönen kayıtların id'si eksikse
   backup.js de buradan üretiyor, iki farklı biçim oluşmasın diye. */
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/**
 * Bellekteki model + gecikmeli kalıcı yazma.
 * backend, db.js ile aynı arayüzü sunan herhangi bir nesne olabilir
 * (testlerde sahte bir nesne veriliyor).
 *
 * NUMARALANDIRMA KONUMSALDIR: timeline numarası her zaman listedeki sırasıdır
 * (1, 2, 3...), entry sırası da öyle (0, 1, 2...). Aradan biri silinince
 * kalanlar kayar — TIMELINE II silinirse III yerine II olur. Boşluk kalmaz.
 */
export function createStore(backend, { debounceMs = 300, now = () => Date.now() } = {}) {
  let timelines = [];
  let timer = null;
  const dirty = new Set();
  const savedCallbacks = [];

  // Arka uca giden, sonucu beklenmeyen (fire-and-forget) yazmaların hatasını
  // sessizce yutmamak için: onSaved dinleyicileri başarıda argümansız,
  // hatada Error ile çağrılır. Yeni bir hata-bildirme API'si eklemek yerine
  // var olan onSaved mekanizması hem başarı hem hata için kullanılıyor.
  function reportError(err) {
    savedCallbacks.forEach(cb => cb(err));
  }

  function touch(tl) {
    tl.guncelleme = now();
    dirty.add(tl.id);
    schedule();
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; flush().catch(reportError); }, debounceMs);
  }

  /**
   * Bütün numaraları konuma göre yeniden yazar ve değişen kayıtların
   * id'lerini döndürür. Silmelerden sonra çağrılır; ayrıca load()'da da
   * çağrılır çünkü diskte numaraların kalıcı kimlik olduğu eski şemadan
   * kalma boşluklu kayıtlar bulunabilir (ör. I ve III).
   */
  function renumber() {
    const degisen = [];
    timelines.forEach((tl, i) => {
      let farkli = false;
      if (tl.no !== i + 1) { tl.no = i + 1; farkli = true; }
      tl.entries.forEach((en, j) => {
        if (en.sira !== j) { en.sira = j; farkli = true; }
      });
      // nextSira artık numarayı üretmiyor (konum üretiyor) ama kayıt
      // biçiminin bir parçası; tutarlı kalsın diye güncel tutuluyor.
      if (tl.nextSira !== tl.entries.length) { tl.nextSira = tl.entries.length; farkli = true; }
      if (farkli) { tl.guncelleme = now(); degisen.push(tl.id); }
    });
    return degisen;
  }

  function renumberVeYaz() {
    const degisen = renumber();
    if (degisen.length) {
      degisen.forEach(id => dirty.add(id));
      schedule();
    }
  }

  /**
   * Bekleyen değişiklikleri diske yazar.
   * Bir yazma başarısız olursa o id dirty'ye GERİ KONUR ve döngü kalan
   * id'lerle devam eder: eskiden ids kopyalanıp dirty baştan temizlendiği
   * için ikinci yazmanın hatası hem üçüncüyü hiç denemiyor hem de her iki
   * değişikliği kalıcı olarak kaybediyordu.
   * Başarı yalnızca gerçekten yazılan id varsa bildirilir; hata çağırana
   * fırlatılır (çağıranlar reportError'a yönlendirir) — böylece aynı hata
   * iki kez bildirilmez.
   */
  async function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    const ids = [...dirty];
    dirty.clear();
    const yazilan = [];
    let ilkHata = null;
    for (const id of ids) {
      const tl = timelines.find(t => t.id === id);
      // Akış sırasında silinen timeline diriltilmez: atlanır, dirty'ye dönmez.
      if (!tl) continue;
      try {
        await backend.putTimeline(tl);
        yazilan.push(id);
      } catch (err) {
        dirty.add(id);                 // sonraki flush'ta yeniden denenir
        if (!ilkHata) ilkHata = err;
      }
    }
    if (yazilan.length) savedCallbacks.forEach(cb => cb());
    if (ilkHata) throw ilkHata;
  }

  return {
    async load() {
      timelines = await backend.allTimelines();
      // Diskteki sıra numaraya göre; boşluk varsa burada kapanır ve
      // düzeltilmiş kayıtlar geri yazılır.
      renumberVeYaz();
    },

    list() { return timelines; },
    get(id) { return timelines.find(t => t.id === id); },

    createTimeline() {
      const tl = {
        id: uid(), no: timelines.length + 1, ad: '', entries: [], nextSira: 0,
        olusturma: now(), guncelleme: now()
      };
      timelines.push(tl);
      dirty.add(tl.id);
      schedule();
      return tl;
    },

    deleteTimeline(id) {
      timelines = timelines.filter(t => t.id !== id);
      dirty.delete(id);
      // Arayüz void döndürür (eşzamanlı), bu yüzden burada await edilemez —
      // hata reportError ile bildiriliyor.
      backend.deleteTimeline(id).catch(reportError);
      renumberVeYaz();
    },

    addEntry(timelineId) {
      const tl = this.get(timelineId);
      if (!tl) throw new Error('addEntry: timeline yok: ' + timelineId);
      const en = {
        id: uid(), sira: tl.entries.length, ad: '', metin: '',
        olusturma: now(), guncelleme: now()
      };
      tl.entries.push(en);
      tl.nextSira = tl.entries.length;
      touch(tl);
      return en;
    },

    deleteEntry(timelineId, entryId) {
      const tl = this.get(timelineId);
      if (!tl) return;
      tl.entries = tl.entries.filter(e => e.id !== entryId);
      tl.entries.forEach((en, j) => { en.sira = j; });
      tl.nextSira = tl.entries.length;
      touch(tl);
    },

    update(timelineId, mutator) {
      const tl = this.get(timelineId);
      if (!tl) return;
      mutator(tl);
      touch(tl);
    },

    flush,
    // flush()'ı bekleyen çağıranlar hatayı buraya yönlendirir
    // (`store.flush().catch(store.reportError)`), böylece sessizce yutulmaz.
    reportError,
    // cb() başarılı yazmada, cb(err) bir yazma başarısız olduğunda çağrılır.
    onSaved(cb) { savedCallbacks.push(cb); }
  };
}
