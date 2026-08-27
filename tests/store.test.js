import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStore } from '../js/store.js';

/** Belleğe yazan sahte veri katmanı — gerçek IndexedDB'ye gerek yok. */
function fakeBackend() {
  const rows = new Map();
  const meta = new Map();
  return {
    rows, meta,
    yazmaSayisi: 0,
    async allTimelines() { return [...rows.values()].sort((a, b) => a.no - b.no); },
    async putTimeline(tl) { this.yazmaSayisi++; rows.set(tl.id, JSON.parse(JSON.stringify(tl))); },
    async deleteTimeline(id) { rows.delete(id); },
    async getMeta(k) { return meta.get(k); },
    async setMeta(k, v) { meta.set(k, v); }
  };
}

describe('store', () => {
  let backend, store;

  beforeEach(async () => {
    vi.useFakeTimers();
    backend = fakeBackend();
    store = createStore(backend, { debounceMs: 300, now: () => 1000 });
    await store.load();
  });

  it('boş başlar', () => {
    expect(store.list()).toEqual([]);
  });

  it('timeline oluşturur ve numarayı 1\'den başlatır', () => {
    const tl = store.createTimeline();
    expect(tl.no).toBe(1);
    expect(tl.ad).toBe('');
    expect(tl.entries).toEqual([]);
    expect(store.list()).toHaveLength(1);
  });

  it('SİLİNEN NUMARAYI YENİDEN KULLANMAZ', () => {
    const a = store.createTimeline();  // 1
    const b = store.createTimeline();  // 2
    store.deleteTimeline(a.id);
    store.deleteTimeline(b.id);
    expect(store.list()).toHaveLength(0);
    const c = store.createTimeline();
    expect(c.no).toBe(3);              // 1'e DÖNMEZ
  });

  it('entry sırasını da yeniden kullanmaz', () => {
    const tl = store.createTimeline();
    const e0 = store.addEntry(tl.id);
    const e1 = store.addEntry(tl.id);
    expect([e0.sira, e1.sira]).toEqual([0, 1]);
    store.deleteEntry(tl.id, e0.id);
    const e2 = store.addEntry(tl.id);
    expect(e2.sira).toBe(2);
    expect(store.get(tl.id).entries.map(e => e.sira)).toEqual([1, 2]);
  });

  it('yazmayı geciktirir ve tek seferde yapar', async () => {
    const tl = store.createTimeline();
    store.update(tl.id, t => { t.ad = 'A'; });
    store.update(tl.id, t => { t.ad = 'AB'; });
    store.update(tl.id, t => { t.ad = 'ABC'; });
    expect(backend.yazmaSayisi).toBe(0);        // henüz yazılmadı
    await vi.advanceTimersByTimeAsync(320);
    expect(backend.yazmaSayisi).toBe(1);        // üç değişiklik tek yazma
    expect(backend.rows.get(tl.id).ad).toBe('ABC');
  });

  it('yazma bitince onSaved çağırır', async () => {
    const spy = vi.fn();
    store.onSaved(spy);
    const tl = store.createTimeline();
    store.update(tl.id, t => { t.ad = 'X'; });
    await vi.advanceTimersByTimeAsync(320);
    expect(spy).toHaveBeenCalled();
  });

  it('silme kalıcıdır, arşiv yoktur', async () => {
    const tl = store.createTimeline();
    const e = store.addEntry(tl.id);
    store.deleteEntry(tl.id, e.id);
    await vi.advanceTimersByTimeAsync(320);
    const saved = backend.rows.get(tl.id);
    expect(saved.entries).toHaveLength(0);
    expect(saved.eskiEntryler).toBeUndefined();
  });

  it('kaydedilmiş veriyi geri yükler ve sayaçları sürdürür', async () => {
    const tl = store.createTimeline();
    store.addEntry(tl.id);
    await store.flush();

    const store2 = createStore(backend, { debounceMs: 300, now: () => 2000 });
    await store2.load();
    expect(store2.list()).toHaveLength(1);
    expect(store2.createTimeline().no).toBe(2);   // 1'i tekrar vermez
  });

  it('tüm timeline\'lar silinince nextNo meta değerinden devam eder', async () => {
    // max-taramadan (0) değil, kalıcı nextNo meta değerinden (3) devam eder —
    // load()'daki `saved > nextNo` dalını gerçekten çalıştıran tek senaryo.
    const a = store.createTimeline();  // no 1, nextNo -> 2
    const b = store.createTimeline();  // no 2, nextNo -> 3
    await store.flush();
    store.deleteTimeline(a.id);
    store.deleteTimeline(b.id);
    await store.flush();

    const store2 = createStore(backend, { debounceMs: 300, now: () => 3000 });
    await store2.load();
    expect(store2.list()).toHaveLength(0);
    expect(store2.createTimeline().no).toBe(3);   // 1'e DÖNMEZ
  });
});
