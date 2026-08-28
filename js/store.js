function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/**
 * Bellekteki model + gecikmeli kalıcı yazma.
 * backend, db.js ile aynı arayüzü sunan herhangi bir nesne olabilir
 * (testlerde sahte bir nesne veriliyor).
 */
export function createStore(backend, { debounceMs = 300, now = () => Date.now() } = {}) {
  let timelines = [];
  let nextNo = 1;
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
      // Numara kimliktir: en büyük numaradan devam edilir, boşluklar doldurulmaz.
      nextNo = timelines.reduce((max, t) => Math.max(max, t.no), 0) + 1;
      const saved = await backend.getMeta('nextNo');
      if (typeof saved === 'number' && saved > nextNo) nextNo = saved;
    },

    list() { return timelines; },
    get(id) { return timelines.find(t => t.id === id); },

    createTimeline() {
      const tl = {
        id: uid(), no: nextNo++, ad: '', entries: [], nextSira: 0,
        olusturma: now(), guncelleme: now()
      };
      timelines.push(tl);
      // createTimeline() eşzamanlı kalıp Timeline nesnesini hemen döndürmeli
      // (çağıranlar sonucu beklemeden kullanıyor), bu yüzden burada await
      // edilemez — ama hatası artık sessizce yutulmuyor, reportError ile
      // onSaved dinleyicilerine bildiriliyor.
      backend.setMeta('nextNo', nextNo).catch(reportError);
      dirty.add(tl.id);
      schedule();
      return tl;
    },

    deleteTimeline(id) {
      timelines = timelines.filter(t => t.id !== id);
      dirty.delete(id);
      // Arayüz void döndürür (eşzamanlı), bu yüzden burada da await edilemez —
      // hata reportError ile bildiriliyor.
      backend.deleteTimeline(id).catch(reportError);
    },

    addEntry(timelineId) {
      const tl = this.get(timelineId);
      if (!tl) throw new Error('addEntry: timeline yok: ' + timelineId);
      const en = {
        id: uid(), sira: tl.nextSira++, ad: '', metin: '',
        olusturma: now(), guncelleme: now()
      };
      tl.entries.push(en);
      touch(tl);
      return en;
    },

    deleteEntry(timelineId, entryId) {
      const tl = this.get(timelineId);
      if (!tl) return;
      tl.entries = tl.entries.filter(e => e.id !== entryId);
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
