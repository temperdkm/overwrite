import { createStore } from './store.js';
import { universeBackend } from './db.js';

/* ADALAR — Doodle Sphere'deki hedefler.
   Bir ada bir evrendir; üstündeki kapıdan girilince o hedefin notları çıkar.
   Yapı olarak timeline'ın birebir aynısı (numara + ad + sıralı kayıtlar), bu
   yüzden store.js'in denenmiş mantığı — gecikmeli yazma, kirli küme, konumsal
   yeniden numaralandırma, hata bildirimi — ikinci kez yazılmıyor, olduğu gibi
   kullanılıyor. Değişen tek şey diskteki depo.

   Burada yalnızca isimler alan diline çevriliyor: timeline -> universe,
   entry -> note. Yöntemler tek tek sarmalanıyor (spread ile değil), çünkü
   alttaki store bazı yöntemlerinde `this` üzerinden kendi get()'ini çağırıyor;
   açıkça yazmak o bağın kazara kopmasını imkânsız kılıyor. */
export function createUniverseStore(backend = universeBackend) {
  const s = createStore(backend);
  return {
    load:   ()          => s.load(),
    list:   ()          => s.list(),
    get:    (id)        => s.get(id),

    createUniverse: ()  => s.createTimeline(),
    deleteUniverse: (id) => s.deleteTimeline(id),

    addNote:    (evrenId)          => s.addEntry(evrenId),
    deleteNote: (evrenId, notId)   => s.deleteEntry(evrenId, notId),

    update: (id, mutator) => s.update(id, mutator),

    flush:       ()   => s.flush(),
    reportError: (e)  => s.reportError(e),
    onSaved:     (cb) => s.onSaved(cb)
  };
}
