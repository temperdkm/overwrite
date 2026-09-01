import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { disaAktar, iceAktar, ozet, dosyaAdi, BICIM_SURUMU } from '../js/backup.js';
import { timelineBackend, universeBackend, replaceAll } from '../js/db.js';

/* Yedek, notların TEK KOPYASININ kurtarma yolu. Buradaki riskler:
   - dışa aktarılan dosyanın geri okunduğunda aynı veriyi vermemesi,
   - yanlış/bozuk bir dosyanın uygulamayı çökertmesi ya da sessizce yarım
     veri yüklemesi,
   - geri yüklemenin eski veriyi silip yenisini yazamaması.
   Testler üçünü de tutuyor. */

function tl(id, no, ad, entries) {
  return {
    id, no, ad, entries: entries || [], nextSira: (entries || []).length,
    olusturma: 1, guncelleme: 2
  };
}
function en(id, sira, ad, metin) {
  return { id, sira, ad, metin, olusturma: 1, guncelleme: 2 };
}

describe('yedek biçimi', () => {
  it('dışa aktarıp geri okuyunca aynı veri çıkar', () => {
    const veri = {
      timelines: [tl('t1', 1, 'ŞİŞLİ GEZİSİ', [en('e1', 0, 'BÜTÇE', '12.000 ₺')])],
      universes: [tl('u1', 1, 'ALEV ÇUKURU', [en('n1', 0, 'ISI', '1450 °C')])]
    };
    const geri = iceAktar(disaAktar(veri));
    expect(geri.timelines).toEqual(veri.timelines);
    expect(geri.universes).toEqual(veri.universes);
  });

  it('dosya adı tarihi taşır', () => {
    expect(dosyaAdi(new Date(2026, 8, 1, 1, 43))).toBe('overwrite-yedek-2026-09-01-0143.json');
  });

  it('özet bütün entry\'leri iki koleksiyondan toplar', () => {
    expect(ozet({
      timelines: [tl('t1', 1, '', [en('a', 0), en('b', 1)])],
      universes: [tl('u1', 1, '', [en('c', 0)])]
    })).toEqual({ timeline: 1, universe: 1, entry: 3 });
  });
});

describe('yedek doğrulama', () => {
  it('JSON olmayan dosyayı anlaşılır bir mesajla reddeder', () => {
    expect(() => iceAktar('bu bir yedek değil')).toThrow(/OVERWRITE yedek dosyası değil/);
  });

  it('başka bir uygulamanın JSON\'unu reddeder', () => {
    expect(() => iceAktar('{"uygulama":"baska","timelines":[]}'))
      .toThrow(/OVERWRITE yedeği değil/);
  });

  it('daha yeni bir biçim sürümünü reddeder', () => {
    const ileri = JSON.stringify({ uygulama: 'overwrite', surum: BICIM_SURUMU + 1, timelines: [], universes: [] });
    expect(() => iceAktar(ileri)).toThrow(/daha yeni bir sürümünden/);
  });

  /* Bozuk alanlar ATILMAZ, TİPİNE ZORLANIR. Kullanıcının elindeki tek kopya
     bu dosya olabilir; tek bir bozuk alan yüzünden yüklemeyi tümden reddetmek
     kurtarılabilir notları da çöpe atmak demek. */
  it('bozuk alanları düzelterek okur, çökmez', () => {
    const bozuk = JSON.stringify({
      uygulama: 'overwrite',
      surum: 1,
      timelines: [{ id: 't1', no: 'üç', ad: 42, entries: 'dizi değil' }],
      universes: [{ id: 'u1', entries: [{ ad: null, metin: undefined, sira: 'x' }] }]
    });
    const geri = iceAktar(bozuk);
    expect(geri.timelines[0].no).toBe(1);            // konumdan üretildi
    expect(geri.timelines[0].ad).toBe('42');         // metne çevrildi
    expect(geri.timelines[0].entries).toEqual([]);   // dizi değilse boş
    const not = geri.universes[0].entries[0];
    expect(not.ad).toBe('');
    expect(not.metin).toBe('');
    expect(not.sira).toBe(0);
    expect(not.id).toBeTruthy();                     // eksik id üretildi
  });

  it('eksik koleksiyonu boş sayar', () => {
    const geri = iceAktar('{"uygulama":"overwrite","surum":1,"timelines":[{"id":"t","no":1,"ad":"","entries":[]}]}');
    expect(geri.timelines).toHaveLength(1);
    expect(geri.universes).toEqual([]);
  });

  it('kayıt yerine sayı gelirse net bir hata verir', () => {
    expect(() => iceAktar('{"uygulama":"overwrite","surum":1,"timelines":[5],"universes":[]}'))
      .toThrow(/Yedek bozuk/);
  });
});

describe('geri yükleme', () => {
  beforeEach(async () => {
    for (const t of await timelineBackend.allTimelines()) await timelineBackend.deleteTimeline(t.id);
    for (const u of await universeBackend.allTimelines()) await universeBackend.deleteTimeline(u.id);
  });

  it('iki deponun da üstüne yazar — eski kayıtlar KALMAZ', async () => {
    await timelineBackend.putTimeline(tl('eski-t', 1, 'ESKİ'));
    await universeBackend.putTimeline(tl('eski-u', 1, 'ESKİ EVREN'));

    await replaceAll({
      timelines: [tl('yeni-t', 1, 'YENİ')],
      universes: [tl('yeni-u1', 1, 'A'), tl('yeni-u2', 2, 'B')]
    });

    const t = await timelineBackend.allTimelines();
    const u = await universeBackend.allTimelines();
    expect(t.map(k => k.id)).toEqual(['yeni-t']);
    expect(u.map(k => k.id)).toEqual(['yeni-u1', 'yeni-u2']);
  });

  it('boş yedek her şeyi siler', async () => {
    await timelineBackend.putTimeline(tl('t', 1, 'X'));
    await replaceAll({ timelines: [], universes: [] });
    expect(await timelineBackend.allTimelines()).toEqual([]);
    expect(await universeBackend.allTimelines()).toEqual([]);
  });
});
