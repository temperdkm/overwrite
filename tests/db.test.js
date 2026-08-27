import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { openDb, allTimelines, putTimeline, deleteTimeline, getMeta, setMeta } from '../js/db.js';

function tl(id, no) {
  return { id, no, ad: 'T' + no, entries: [], nextSira: 0, olusturma: 1, guncelleme: 1 };
}

describe('db', () => {
  beforeEach(async () => {
    // NOT: indexedDB.deleteDatabase('overwrite') beklendiği gibi çalışmıyor —
    // db.js aynı bağlantıyı (dbPromise) test dosyası boyunca modül seviyesinde
    // önbelleğe alıyor ve o bağlantı hiç kapatılmadığı için silme isteği
    // sonsuza dek "blocked" kalıyor (bkz. fake-indexeddb FDBFactory.deleteDatabase
    // → waitForOthersClosedDelete). Bunun yerine mevcut bağlantı üzerinden
    // (sadece db.js'in kendi genel arayüzünü kullanarak) satırları temizliyoruz.
    await openDb();
    for (const t of await allTimelines()) await deleteTimeline(t.id);
  });

  it('yazdığını geri okur', async () => {
    await openDb();
    await putTimeline(tl('a', 1));
    const all = await allTimelines();
    expect(all).toHaveLength(1);
    expect(all[0].ad).toBe('T1');
  });

  it('timeline listesini no sırasına göre verir', async () => {
    await openDb();
    await putTimeline(tl('c', 3));
    await putTimeline(tl('a', 1));
    await putTimeline(tl('b', 2));
    const all = await allTimelines();
    expect(all.map(t => t.no)).toEqual([1, 2, 3]);
  });

  it('siler', async () => {
    await openDb();
    await putTimeline(tl('a', 1));
    await deleteTimeline('a');
    expect(await allTimelines()).toHaveLength(0);
  });

  it('meta değerlerini saklar', async () => {
    await openDb();
    expect(await getMeta('sonYedek')).toBeUndefined();
    await setMeta('sonYedek', 12345);
    expect(await getMeta('sonYedek')).toBe(12345);
  });
});
