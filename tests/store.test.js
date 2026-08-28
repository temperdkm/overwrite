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

  it('SİLİNCE KALANLAR YENİDEN NUMARALANIR', () => {
    const a = store.createTimeline();  // 1
    const b = store.createTimeline();  // 2
    const c = store.createTimeline();  // 3
    expect([a.no, b.no, c.no]).toEqual([1, 2, 3]);
    store.deleteTimeline(b.id);
    expect(store.list().map(t => t.no)).toEqual([1, 2]);  // III -> II oldu
    expect(c.no).toBe(2);
    expect(store.createTimeline().no).toBe(3);            // boşluk kalmaz
  });

  it('entry silinince kalanlar yeniden numaralanır', () => {
    const tl = store.createTimeline();
    const e0 = store.addEntry(tl.id);
    const e1 = store.addEntry(tl.id);
    const e2 = store.addEntry(tl.id);
    expect([e0.sira, e1.sira, e2.sira]).toEqual([0, 1, 2]);
    store.deleteEntry(tl.id, e1.id);
    expect(store.get(tl.id).entries.map(e => e.sira)).toEqual([0, 1]);
    expect(e2.sira).toBe(1);                              // ENTRY 2 -> ENTRY 1
    expect(store.addEntry(tl.id).sira).toBe(2);
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

  it('yazma başarısız olunca onSaved Error alır ve değişiklik KAYBOLMAZ', async () => {
    const spy = vi.fn();
    store.onSaved(spy);
    const gercekYazma = backend.putTimeline.bind(backend);
    const hata = new Error('depolama dolu');

    const tl = store.createTimeline();
    store.update(tl.id, t => { t.ad = 'ÖNEMLİ'; });
    backend.putTimeline = () => Promise.reject(hata);
    await vi.advanceTimersByTimeAsync(320);

    // Başarı bildirilmez, hata Error ile bildirilir (KAYDEDİLDİ yazmasın diye)
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(hata);
    expect(backend.rows.has(tl.id)).toBe(false);

    // id dirty'de kaldı: arka uç düzelince aynı değişiklik yeniden denenir
    backend.putTimeline = gercekYazma;
    await store.flush();
    expect(backend.rows.get(tl.id).ad).toBe('ÖNEMLİ');
  });

  it('bir yazma patlasa da sıradaki timeline yazılır', async () => {
    // Eski flush() dirty'yi baştan temizliyordu: ikinci yazma reddedince
    // üçüncü hiç denenmiyor ve ikisinin değişikliği de kalıcı olarak
    // kayboluyordu — üstelik kullanıcıya "KAYDEDİLDİ" gösterilerek.
    const gercekYazma = backend.putTimeline.bind(backend);
    const a = store.createTimeline();
    const b = store.createTimeline();
    await store.flush();

    store.update(a.id, t => { t.ad = 'A2'; });
    store.update(b.id, t => { t.ad = 'B2'; });
    backend.putTimeline = (tl) =>
      tl.id === a.id ? Promise.reject(new Error('a yazılamadı')) : gercekYazma(tl);

    await expect(store.flush()).rejects.toThrow('a yazılamadı');
    expect(backend.rows.get(b.id).ad).toBe('B2');   // sıradaki yine de denendi

    backend.putTimeline = gercekYazma;
    await store.flush();
    expect(backend.rows.get(a.id).ad).toBe('A2');   // başarısız olan geri geldi
  });

  it('kaydedilmiş veriyi geri yükler', async () => {
    const tl = store.createTimeline();
    store.addEntry(tl.id);
    await store.flush();

    const store2 = createStore(backend, { debounceMs: 300, now: () => 2000 });
    await store2.load();
    expect(store2.list()).toHaveLength(1);
    expect(store2.createTimeline().no).toBe(2);   // konumsal: 1 dolu, sıradaki 2
  });

  it('ESKİ ŞEMADAN KALAN BOŞLUKLARI yüklemede kapatır', async () => {
    // Numaraların kalıcı kimlik olduğu önceki sürümde diskte I ve III gibi
    // boşluklu kayıtlar oluşabiliyordu ve kullanıcının telefonunda böyle veri
    // var. load() bunları sessizce düzeltip geri yazmalı.
    backend.rows.set('x', { id: 'x', no: 1, ad: 'A', nextSira: 2, olusturma: 1, guncelleme: 1,
      entries: [{ id: 'e1', sira: 0, ad: '', metin: '' },
                { id: 'e2', sira: 2, ad: '', metin: '' }] });
    backend.rows.set('y', { id: 'y', no: 3, ad: 'B', nextSira: 1, olusturma: 1, guncelleme: 1,
      entries: [{ id: 'e3', sira: 5, ad: '', metin: '' }] });

    const store2 = createStore(backend, { debounceMs: 300, now: () => 4000 });
    await store2.load();
    expect(store2.list().map(t => t.no)).toEqual([1, 2]);              // III -> II
    expect(store2.get('x').entries.map(e => e.sira)).toEqual([0, 1]);  // 2 -> 1
    expect(store2.get('y').entries.map(e => e.sira)).toEqual([0]);     // 5 -> 0

    // Düzeltme diske de yazılır; bir sonraki açılışta tekrar düzeltmeye gerek kalmaz
    await store2.flush();
    expect(backend.rows.get('y').no).toBe(2);
  });
});
