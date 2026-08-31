import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { timelineBackend, universeBackend } from '../js/db.js';
import { createUniverseStore } from '../js/universes.js';

/* Adalar timeline'larla AYNI kayıt biçimini ve AYNI store.js mantığını
   kullanıyor. Buradaki asıl risk mantık değil, KARIŞMA: iki koleksiyon
   yanlışlıkla tek object store'a yazarsa timeline'lar Doodle Sphere'de,
   adalar OVERWRITE ekranında görünür — ve kullanıcı birini silerken
   diğerini kaybeder. Testler bunu ve alan dilinin doğru bağlandığını
   kontrol eder. */

async function bosalt() {
  for (const t of await timelineBackend.allTimelines()) {
    await timelineBackend.deleteTimeline(t.id);
  }
  for (const u of await universeBackend.allTimelines()) {
    await universeBackend.deleteTimeline(u.id);
  }
}

describe('adalar (universes)', () => {
  beforeEach(bosalt);

  it('timeline deposuna DEĞİL, kendi deposuna yazar', async () => {
    const evrenler = createUniverseStore();
    await evrenler.load();
    evrenler.createUniverse();
    await evrenler.flush();

    expect(await universeBackend.allTimelines()).toHaveLength(1);
    expect(await timelineBackend.allTimelines()).toHaveLength(0);
  });

  it('timeline yazmak ada listesini etkilemez', async () => {
    await timelineBackend.putTimeline({
      id: 'tl1', no: 1, ad: 'TIMELINE', entries: [], nextSira: 0,
      olusturma: 1, guncelleme: 1
    });
    const evrenler = createUniverseStore();
    await evrenler.load();
    expect(evrenler.list()).toHaveLength(0);
  });

  it('ada oluşturur, adlandırır ve diskten geri okur', async () => {
    const a = createUniverseStore();
    await a.load();
    const u = a.createUniverse();
    a.update(u.id, (kayit) => { kayit.ad = 'ŞİŞLİ GEZİSİ'; });
    await a.flush();

    const b = createUniverseStore();
    await b.load();
    expect(b.list()).toHaveLength(1);
    expect(b.list()[0].ad).toBe('ŞİŞLİ GEZİSİ');
    expect(b.list()[0].no).toBe(1);
  });

  it('not ekler ve siler; notlar konumsal olarak yeniden numaralanır', async () => {
    const evrenler = createUniverseStore();
    await evrenler.load();
    const u = evrenler.createUniverse();
    const n1 = evrenler.addNote(u.id);
    const n2 = evrenler.addNote(u.id);
    const n3 = evrenler.addNote(u.id);
    expect([n1.sira, n2.sira, n3.sira]).toEqual([0, 1, 2]);

    evrenler.deleteNote(u.id, n2.id);
    expect(evrenler.get(u.id).entries.map(n => n.sira)).toEqual([0, 1]);
    expect(evrenler.get(u.id).entries.map(n => n.id)).toEqual([n1.id, n3.id]);
  });

  it('ada silinince kalanlar kayar — aradan silmek boşluk bırakmaz', async () => {
    const evrenler = createUniverseStore();
    await evrenler.load();
    const a = evrenler.createUniverse();
    const b = evrenler.createUniverse();
    const c = evrenler.createUniverse();
    expect([a.no, b.no, c.no]).toEqual([1, 2, 3]);

    evrenler.deleteUniverse(b.id);
    await evrenler.flush();
    expect(evrenler.list().map(u => u.no)).toEqual([1, 2]);

    const yeniden = createUniverseStore();
    await yeniden.load();
    expect(yeniden.list().map(u => u.no)).toEqual([1, 2]);
    expect(yeniden.list().map(u => u.id)).toEqual([a.id, c.id]);
  });

  it('silinen ada diske de yazılmaz', async () => {
    const evrenler = createUniverseStore();
    await evrenler.load();
    const u = evrenler.createUniverse();
    evrenler.deleteUniverse(u.id);
    await evrenler.flush();
    expect(await universeBackend.allTimelines()).toHaveLength(0);
  });
});
