import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * sw.js çalışma zamanında HİÇ denenemiyor: service worker kaydı bu ortamda
 * (ve `python -m http.server` altında bile ancak kısmen) çalışıyor. Oysa
 * fetch handler'ının hata biçimi telefonda BOŞ EKRAN. Bu yüzden dosya,
 * DEĞİŞTİRİLMEDEN, self/caches/fetch parametre olarak verilerek yüklenir ve
 * kaydettiği olay dinleyicileri yakalanır.
 */
const SW_SRC = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

/** Response taklidi: gerçek Response'a gerek yok, sw.js sadece ok + clone kullanıyor. */
function yanit(govde, { ok = true, status = 200 } = {}) {
  const res = { govde, ok, status };
  res.clone = () => ({ govde, ok, status, clone: res.clone });
  return res;
}

function istek(url, { method = 'GET', mode = 'cors' } = {}) {
  return { url, method, mode };
}

function harness({ cached = null, network } = {}) {
  const handlers = {};
  const put = vi.fn(async () => {});
  const add = vi.fn(async () => {});
  const match = vi.fn(async () => cached);
  /* match GERÇEK Cache nesnesinin üstünde — caches.match'in kendisi bilerek
     tanımsız bırakıldı. Üst düzey caches.match() BÜTÜN önbelleklerde arar;
     silinmemiş eski bir sürüm kalırsa oradan yanıt dönebilir. sw.js ona geri
     dönerse bu testler TypeError ile patlar, sessizce geçmez. */
  const cache = { put, add, match };
  const caches = {
    open: vi.fn(async () => cache),
    keys: vi.fn(async () => []),
    delete: vi.fn(async () => true)
  };
  const fetchStub = vi.fn(network || (async () => yanit('ağdan')));
  const self = {
    addEventListener: (tur, fn) => { handlers[tur] = fn; },
    skipWaiting: () => {},
    clients: { claim: () => {} }
  };
  // eslint-disable-next-line no-new-func
  new Function('self', 'caches', 'fetch', 'console', SW_SRC)(
    self, caches, fetchStub, { log() {}, warn() {}, error() {} }
  );
  return { handlers, put, add, match, fetch: fetchStub, caches };
}

/** fetch handler'ını çağırır ve respondWith'e verilen sözü döndürür. */
function fetchEt(h, request) {
  let sonuc;
  h.handlers.fetch({ request, respondWith: (p) => { sonuc = p; } });
  return sonuc;
}

/** respondWith çözüldükten SONRA çalışan (beklenmeyen) yazmaları bekletir. */
const mikroGorevler = () => new Promise(r => setTimeout(r, 0));

describe('service worker fetch handler', () => {
  it('önbellekte varsa oradan verir, ağa hiç çıkmaz', async () => {
    const onbellekteki = yanit('önbellekten');
    const h = harness({ cached: onbellekteki });

    const res = await fetchEt(h, istek('https://x/js/app.js'));

    expect(res).toBe(onbellekteki);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('ağdan gelen 200 önbelleğe alınır, 404 ALINMAZ', async () => {
    const iyi = yanit('yeni dosya');
    const h1 = harness({ cached: null, network: async () => iyi });
    const res1 = await fetchEt(h1, istek('https://x/js/app.js'));
    await mikroGorevler();
    expect(res1).toBe(iyi);
    expect(h1.put).toHaveBeenCalledTimes(1);

    // 404 önbelleğe alınsaydı hata sayfası CACHE sürümü değişene kadar
    // sonsuza dek servis edilirdi.
    const kotu = yanit('bulunamadı', { ok: false, status: 404 });
    const h2 = harness({ cached: null, network: async () => kotu });
    const res2 = await fetchEt(h2, istek('https://x/js/yok.js'));
    await mikroGorevler();
    expect(res2).toBe(kotu);
    expect(h2.put).not.toHaveBeenCalled();
  });

  it('navigasyon OLMAYAN istekte ağ hatası reddeder, index.html DÖNDÜRMEZ', async () => {
    // Bu, modül isteğinin HTML ile çözülmesini engelleyen düzeltme:
    // import edilen bir js dosyasına index.html dönerse modül değerlendirmesi
    // bütünüyle bozulur ve telefonda boş ekran görünür.
    const hata = new Error('ağ yok');
    const h = harness({ cached: null, network: async () => { throw hata; } });

    await expect(fetchEt(h, istek('https://x/js/app.js', { mode: 'cors' })))
      .rejects.toBe(hata);

    // Yalnızca ilk arama yapıldı; './index.html' hiç aranmadı.
    expect(h.match).toHaveBeenCalledTimes(1);
  });
});

/* Sayfa hangi sürümün kendisine hizmet ettiğini sorabiliyor. iOS'ta ana ekran
   uygulaması askıya alınıp geri geldiği için kullanıcı farkında olmadan eski
   sürümde kalabiliyor; bu mesaj o soruyu tahmine bırakmayan tek yol. */
describe('service worker sürüm mesajı', () => {
  it('sürüm sorulunca CACHE adını geri yollar', () => {
    const h = harness();
    const gelen = [];
    h.handlers.message({ data: 'surum', source: { postMessage: (m) => gelen.push(m) } });
    expect(gelen).toHaveLength(1);
    expect(gelen[0].surum).toMatch(/^overwrite-v\d+$/);
  });

  it('başka bir mesaja cevap vermez', () => {
    const h = harness();
    const gelen = [];
    h.handlers.message({ data: 'baska', source: { postMessage: (m) => gelen.push(m) } });
    expect(gelen).toHaveLength(0);
  });
});
