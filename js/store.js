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

  function touch(tl) {
    tl.guncelleme = now();
    dirty.add(tl.id);
    schedule();
  }

  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; flush(); }, debounceMs);
  }

  async function flush() {
    if (timer) { clearTimeout(timer); timer = null; }
    const ids = [...dirty];
    dirty.clear();
    for (const id of ids) {
      const tl = timelines.find(t => t.id === id);
      if (tl) await backend.putTimeline(tl);
    }
    if (ids.length) savedCallbacks.forEach(cb => cb());
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
      backend.setMeta('nextNo', nextNo);
      dirty.add(tl.id);
      schedule();
      return tl;
    },

    deleteTimeline(id) {
      timelines = timelines.filter(t => t.id !== id);
      dirty.delete(id);
      backend.deleteTimeline(id);
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
    onSaved(cb) { savedCallbacks.push(cb); }
  };
}
