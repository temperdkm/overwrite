# OVERWRITE PWA — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** X!Gaster temalı, iPhone'da ana ekrandan açılan, çevrimdışı çalışan bir not uygulamasını düz HTML/CSS/JS ile yazıp GitHub Pages'te yayınlamak.

**Architecture:** Derleme adımı yok. Tarayıcının kendi ES modülleri kullanılıyor, aynı kaynak dosyalar hem tarayıcıda hem testlerde doğrudan `import` ediliyor. Saf mantık (Roma rakamı, çember matematiği, veri katmanı, metin güvenliği, yedek biçimi) Vitest ile test ediliyor; DOM ve animasyon işi telefonda gözle doğrulanıyor. Veri tamamen cihazda, IndexedDB'de.

**Tech Stack:** Vanilla HTML/CSS/JS (ES modules) · IndexedDB · Service Worker · Vitest + fake-indexeddb + jsdom (yalnızca geliştirme) · Python `http.server` (yerel sunucu) · GitHub Pages

## Global Constraints

Bu kurallar **her görev için geçerlidir**, tekrar yazılmasa da uygulanır. Değerler tasarım belgesinden birebir alınmıştır.

- **Hedef:** iPhone, **iOS 17 veya üzeri**. Safari.
- **Derleme adımı yok.** Bundler, transpiler, framework kullanılmayacak. `node_modules` yalnızca test içindir, yayına gitmez.
- **Kullanıcı metni asla `innerHTML` ile yazılmaz.** Her zaman `textContent`. Bu kural ihlal edilirse nota `<b>x</b>` yazınca etiket kaybolur ve `<img src=x onerror=...>` yazınca gerçek eleman oluşur.
- **Yapıştırma düz metne çevrilir.**
- **Yer tutucu `:empty` ile yapılmaz** — alan silinince tarayıcı `<br>` bırakır, `:empty` tutmaz. Alan programatik temizlenip sınıf ile yer tutucu gösterilir.
- **Font iki alt küme halinde paketlenir:** `latin` **ve** `latin-ext`. Ğ, Ş, İ harfleri `latin-ext` içindedir. Sadece `latin` alınırsa bu üç harf sessizce sistem fontuna düşer.
- **Föy üç katmanlıdır:** `.pos` (konum + geçiş) → `.float` (idle süzülme) → `.gsheet` (görünüm + doğuş). Tek elemanda birleştirilirse animasyonlar aynı `transform` için kavga eder ve biri diğerini siler.
- **Föyler asla yok edilip yeniden yaratılmaz.** Çember dönerken aynı elemanların `transform` değeri güncellenir.
- **İpler föyün butona bakan kenarına bağlanır**, ucunda düğüm veya nokta yoktur, `requestAnimationFrame` ile takip edilir ve **çember görünmüyorken döngü durur.**
- **Glitch renk değiştirmez.** Yalnızca yatay şerit kaymasıdır.
- **Silme kalıcıdır.** Geri alma, FORMER ENTRIES yoktur.
- **Numara kimliktir.** Silinen numara yeniden kullanılmaz, boşluklar beklenen davranıştır.
- **Kaydet tuşu yoktur.** Yazma durduktan 300 ms sonra IndexedDB'ye yazılır.
- **Piksel karelerine `will-change` verilmez.** ERASE'de aynı anda en fazla 3 kart dağılır ve yalnızca ekranda görünen kartlar efekti oynatır.
- **Yorumlar ve arayüz metni Türkçe, kod tanımlayıcıları İngilizce.**

**Yerel sunucu:** ES modülleri ve service worker `file://` üzerinden çalışmaz. Her elle testte proje kökünde şunu çalıştır:

```bash
python -m http.server 8080
```

Sonra `http://localhost:8080` adresini aç.

---

### Task 1: Proje iskeleti ve test düzeni

**Files:**
- Create: `overwrite/package.json`
- Create: `overwrite/.gitignore`
- Create: `overwrite/vitest.config.js`
- Create: `overwrite/js/.gitkeep`
- Create: `overwrite/css/.gitkeep`
- Create: `overwrite/tests/.gitkeep`

**Interfaces:**
- Consumes: yok (ilk görev)
- Produces: `npm test` komutu çalışır durumda; `js/`, `css/`, `tests/`, `fonts/`, `icons/` klasörleri mevcut

- [ ] **Step 1: Git deposunu başlat**

```bash
cd "C:/Users/Güngörünce/Desktop/Cladue Code/overwrite"
git init -b main
```

- [ ] **Step 2: `.gitignore` yaz**

`overwrite/.gitignore`:

```gitignore
node_modules/
.superpowers/
.DS_Store
Thumbs.db

# Yedek dosyaları asla depoya girmesin — notların herkese açık olurdu
overwrite-yedek*.json
*-yedek*.json
backup*.json
```

- [ ] **Step 3: `package.json` yaz**

`overwrite/package.json`:

```json
{
  "name": "overwrite",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "serve": "python -m http.server 8080"
  },
  "devDependencies": {
    "vitest": "^2.1.8",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^25.0.1"
  }
}
```

- [ ] **Step 4: `vitest.config.js` yaz**

`overwrite/vitest.config.js`:

```js
import { defineConfig } from 'vitest/config';

// Varsayılan node. DOM gereken tek dosya olan editable.test.js
// kendi başına `// @vitest-environment jsdom` satırıyla belirtiyor.
// db.test.js için jsdom gerekmiyor: fake-indexeddb node'da da çalışıyor.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js']
  }
});
```

- [ ] **Step 5: Bağımlılıkları kur ve klasörleri oluştur**

```bash
cd "C:/Users/Güngörünce/Desktop/Cladue Code/overwrite"
npm install
mkdir -p js css tests fonts icons
touch js/.gitkeep css/.gitkeep tests/.gitkeep fonts/.gitkeep icons/.gitkeep
```

- [ ] **Step 6: Test koşucusunun çalıştığını doğrula**

```bash
npm test
```

Beklenen: `No test files found` benzeri bir mesajla **hatasız** çıkış. Vitest kurulmadıysa veya config bozuksa burada anlaşılır.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: proje iskeleti ve vitest düzeni"
```

---

### Task 2: Roma rakamı çevirici

**Files:**
- Create: `overwrite/js/roman.js`
- Test: `overwrite/tests/roman.test.js`

**Interfaces:**
- Consumes: yok
- Produces: `roman(n: number) => string` — 1 ve üzeri tam sayıyı Roma rakamına çevirir, geçersiz girdide `RangeError` fırlatır

- [ ] **Step 1: Başarısız testi yaz**

`overwrite/tests/roman.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { roman } from '../js/roman.js';

describe('roman', () => {
  it('tek harfli temel değerleri çevirir', () => {
    expect(roman(1)).toBe('I');
    expect(roman(5)).toBe('V');
    expect(roman(10)).toBe('X');
    expect(roman(50)).toBe('L');
    expect(roman(100)).toBe('C');
  });

  it('çıkarma kurallarını uygular', () => {
    expect(roman(4)).toBe('IV');
    expect(roman(9)).toBe('IX');
    expect(roman(40)).toBe('XL');
    expect(roman(90)).toBe('XC');
    expect(roman(400)).toBe('CD');
    expect(roman(900)).toBe('CM');
  });

  it('uygulamada geçecek sayıları çevirir', () => {
    expect(roman(3)).toBe('III');
    expect(roman(7)).toBe('VII');
    expect(roman(14)).toBe('XIV');
    expect(roman(20)).toBe('XX');
    expect(roman(48)).toBe('XLVIII');
    expect(roman(1987)).toBe('MCMLXXXVII');
  });

  it('geçersiz girdide RangeError fırlatır', () => {
    expect(() => roman(0)).toThrow(RangeError);
    expect(() => roman(-3)).toThrow(RangeError);
    expect(() => roman(2.5)).toThrow(RangeError);
    expect(() => roman('X')).toThrow(RangeError);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test
```

Beklenen: FAIL — `Failed to resolve import "../js/roman.js"`

- [ ] **Step 3: En küçük uygulamayı yaz**

`overwrite/js/roman.js`:

```js
const TABLE = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
];

/** Pozitif tam sayıyı Roma rakamına çevirir. */
export function roman(n) {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError('roman: 1 veya daha büyük tam sayı gerekli, gelen: ' + n);
  }
  let rest = n;
  let out = '';
  for (const [value, letters] of TABLE) {
    while (rest >= value) {
      out += letters;
      rest -= value;
    }
  }
  return out;
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

```bash
npm test
```

Beklenen: PASS — 4 test

- [ ] **Step 5: Commit**

```bash
git add js/roman.js tests/roman.test.js
git commit -m "feat: Roma rakamı çevirici"
```

---

### Task 3: Çember matematiği

**Files:**
- Create: `overwrite/js/ring-math.js`
- Test: `overwrite/tests/ring-math.test.js`

**Interfaces:**
- Consumes: yok
- Produces:
  - `RING` sabiti: `{ STEP_DEG: 50, VISIBLE: 3, SHEET_W: 82, SHEET_H: 114 }`
  - `relIndex(i: number, cur: number, n: number) => number` — merkeze göre sarmalı sıra farkı
  - `placement(d: number, center: {x,y}, radii: {rx,ry}) => { x, y, scale, opacity, visible, z }`
  - `edgePoint(sheet: {x,y,halfW,halfH}, center: {x,y}) => { x, y }`

- [ ] **Step 1: Başarısız testi yaz**

`overwrite/tests/ring-math.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { RING, relIndex, placement, edgePoint } from '../js/ring-math.js';

const CENTER = { x: 145, y: 278 };
const RADII = { rx: 110, ry: 152 };

describe('relIndex', () => {
  it('merkezdeki öğe için 0 verir', () => {
    expect(relIndex(3, 3, 10)).toBe(0);
  });

  it('kısa yoldan sarmalar', () => {
    // 14 öğede 13. öğe, 0. öğeden bir geride sayılmalı
    expect(relIndex(13, 0, 14)).toBe(-1);
    expect(relIndex(0, 13, 14)).toBe(1);
  });

  it('az öğede hiçbir öğeyi iki yerde göstermez', () => {
    const n = 3;
    const ds = [0, 1, 2].map(i => relIndex(i, 0, n));
    expect(new Set(ds).size).toBe(n);
    ds.forEach(d => expect(Math.abs(d)).toBeLessThanOrEqual(1));
  });

  it('tek öğede daima 0 verir', () => {
    expect(relIndex(0, 0, 1)).toBe(0);
  });
});

describe('placement', () => {
  it('öndeki föyü merkezin altına, tam boyutta koyar', () => {
    const p = placement(0, CENTER, RADII);
    expect(p.x).toBeCloseTo(CENTER.x, 5);
    expect(p.y).toBeCloseTo(CENTER.y + RADII.ry, 5);
    expect(p.scale).toBe(1);
    expect(p.opacity).toBe(1);
    expect(p.visible).toBe(true);
  });

  it('uzaklaştıkça küçültüp soldurur', () => {
    const a = placement(1, CENTER, RADII);
    const b = placement(2, CENTER, RADII);
    expect(a.scale).toBeGreaterThan(b.scale);
    expect(a.opacity).toBeGreaterThan(b.opacity);
    expect(a.z).toBeGreaterThan(b.z);
  });

  it('görünürlük sınırının dışını gizler', () => {
    expect(placement(RING.VISIBLE, CENTER, RADII).visible).toBe(true);
    const out = placement(RING.VISIBLE + 1, CENTER, RADII);
    expect(out.visible).toBe(false);
    expect(out.opacity).toBe(0);
  });

  it('ölçeği asla sıfırın altına indirmez', () => {
    expect(placement(20, CENTER, RADII).scale).toBeGreaterThan(0);
  });
});

describe('edgePoint', () => {
  const half = { halfW: RING.SHEET_W / 2, halfH: RING.SHEET_H / 2 };

  it('alttaki föyde ÜST kenarın ortasına bağlanır', () => {
    const sheet = { x: CENTER.x, y: CENTER.y + 200, ...half };
    const e = edgePoint(sheet, CENTER);
    expect(e.x).toBeCloseTo(CENTER.x, 5);
    expect(e.y).toBeCloseTo(sheet.y - half.halfH, 5);
  });

  it('üstteki föyde ALT kenara bağlanır', () => {
    const sheet = { x: CENTER.x, y: CENTER.y - 200, ...half };
    const e = edgePoint(sheet, CENTER);
    expect(e.y).toBeCloseTo(sheet.y + half.halfH, 5);
  });

  it('yandaki föyde İÇ YAN kenara bağlanır', () => {
    const sheet = { x: CENTER.x + 200, y: CENTER.y, ...half };
    const e = edgePoint(sheet, CENTER);
    expect(e.x).toBeCloseTo(sheet.x - half.halfW, 5);
    expect(e.y).toBeCloseTo(CENTER.y, 5);
  });

  it('bağlanma noktası her zaman föyün sınırı üstünde kalır', () => {
    const sheet = { x: CENTER.x + 90, y: CENTER.y + 120, ...half };
    const e = edgePoint(sheet, CENTER);
    const dx = Math.abs(e.x - sheet.x), dy = Math.abs(e.y - sheet.y);
    // en az bir eksende tam kenarda, hiçbir eksende dışarıda olmamalı
    expect(dx).toBeLessThanOrEqual(half.halfW + 1e-6);
    expect(dy).toBeLessThanOrEqual(half.halfH + 1e-6);
    const onEdge = Math.abs(dx - half.halfW) < 1e-6 || Math.abs(dy - half.halfH) < 1e-6;
    expect(onEdge).toBe(true);
  });

  it('merkezle aynı noktadaysa patlamaz', () => {
    const e = edgePoint({ x: CENTER.x, y: CENTER.y, ...half }, CENTER);
    expect(Number.isFinite(e.x)).toBe(true);
    expect(Number.isFinite(e.y)).toBe(true);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test
```

Beklenen: FAIL — `Failed to resolve import "../js/ring-math.js"`

- [ ] **Step 3: En küçük uygulamayı yaz**

`overwrite/js/ring-math.js`:

```js
export const RING = {
  STEP_DEG: 50,   // iki komşu föy arasındaki açı
  VISIBLE: 3,     // merkezden kaç adım öteye kadar görünür
  SHEET_W: 82,
  SHEET_H: 114
};

/**
 * Bir föyün merkezdekine göre sarmalı sıra farkı.
 * Sonuç -n/2 .. +n/2 aralığına kırpılır; bu sayede az sayıda
 * timeline'da hiçbir föy aynı anda iki konumda görünmez.
 */
export function relIndex(i, cur, n) {
  let d = i - cur;
  if (d > n / 2) d -= n;
  if (d < -n / 2) d += n;
  return d;
}

/** Sıra farkından çemberdeki konum, ölçek, saydamlık ve katman. */
export function placement(d, center, radii) {
  const ad = Math.abs(d);
  const th = (90 + d * RING.STEP_DEG) * Math.PI / 180;
  const visible = ad <= RING.VISIBLE;
  return {
    x: center.x + radii.rx * Math.cos(th),
    y: center.y + radii.ry * Math.sin(th),
    scale: Math.max(0.18, 1 - ad * 0.17),
    opacity: visible ? Number((1 - ad * 0.24).toFixed(2)) : 0,
    visible,
    z: 14 - ad
  };
}

/**
 * İpin föye bağlanacağı nokta: merkezden föy merkezine giden doğrunun
 * föyün sınır kutusunu kestiği yer. Kendiliğinden butona BAKAN kenarı
 * bulur, bu yüzden ip hiçbir zaman yazının üstünden geçmez.
 */
export function edgePoint(sheet, center) {
  const dx = sheet.x - center.x;
  const dy = sheet.y - center.y;
  const t = Math.min(
    sheet.halfW / (Math.abs(dx) || 1e-4),
    sheet.halfH / (Math.abs(dy) || 1e-4)
  );
  return { x: sheet.x - dx * t, y: sheet.y - dy * t };
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

```bash
npm test
```

Beklenen: PASS — roman testleri dahil toplam 14 test

- [ ] **Step 5: Commit**

```bash
git add js/ring-math.js tests/ring-math.test.js
git commit -m "feat: çember konumlandırma ve ip bağlanma matematiği"
```

---

### Task 4: Veri katmanı — IndexedDB ve mağaza

**Files:**
- Create: `overwrite/js/db.js`
- Create: `overwrite/js/store.js`
- Test: `overwrite/tests/db.test.js`
- Test: `overwrite/tests/store.test.js`

**Interfaces:**
- Consumes: yok
- Produces:
  - `db.js`: `openDb() => Promise<IDBDatabase>`, `allTimelines() => Promise<Timeline[]>`, `putTimeline(tl) => Promise<void>`, `deleteTimeline(id) => Promise<void>`, `getMeta(key) => Promise<any>`, `setMeta(key, value) => Promise<void>`
  - `store.js`: `createStore(backend, opts) => Store`
    - `Store.load() => Promise<void>`
    - `Store.list() => Timeline[]`
    - `Store.get(id) => Timeline | undefined`
    - `Store.createTimeline() => Timeline`
    - `Store.deleteTimeline(id) => void`
    - `Store.addEntry(timelineId) => Entry`
    - `Store.deleteEntry(timelineId, entryId) => void`
    - `Store.update(timelineId, mutator) => void`
    - `Store.flush() => Promise<void>`
    - `Store.onSaved(cb)` — yazma bitince çağrılır
  - Timeline: `{ id, no, ad, entries, nextSira, olusturma, guncelleme }`
  - Entry: `{ id, sira, ad, metin, olusturma, guncelleme }`

- [ ] **Step 1: db için başarısız testi yaz**

`overwrite/tests/db.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { openDb, allTimelines, putTimeline, deleteTimeline, getMeta, setMeta } from '../js/db.js';

function tl(id, no) {
  return { id, no, ad: 'T' + no, entries: [], nextSira: 0, olusturma: 1, guncelleme: 1 };
}

describe('db', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase('overwrite');
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
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test tests/db.test.js
```

Beklenen: FAIL — `Failed to resolve import "../js/db.js"`

- [ ] **Step 3: db.js'i yaz**

`overwrite/js/db.js`:

```js
const DB_NAME = 'overwrite';
const DB_VERSION = 1;
const STORE_TIMELINES = 'timelines';
const STORE_META = 'meta';

let dbPromise = null;

/** Veritabanını açar (bir kez), sonraki çağrılarda aynı bağlantıyı verir. */
export function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_TIMELINES)) {
        db.createObjectStore(STORE_TIMELINES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(db, store, mode) {
  return db.transaction(store, mode).objectStore(store);
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Bütün timeline'lar, no sırasına göre. */
export async function allTimelines() {
  const db = await openDb();
  const rows = await wrap(tx(db, STORE_TIMELINES, 'readonly').getAll());
  return rows.sort((a, b) => a.no - b.no);
}

export async function putTimeline(timeline) {
  const db = await openDb();
  await wrap(tx(db, STORE_TIMELINES, 'readwrite').put(timeline));
}

export async function deleteTimeline(id) {
  const db = await openDb();
  await wrap(tx(db, STORE_TIMELINES, 'readwrite').delete(id));
}

export async function getMeta(key) {
  const db = await openDb();
  return wrap(tx(db, STORE_META, 'readonly').get(key));
}

export async function setMeta(key, value) {
  const db = await openDb();
  await wrap(tx(db, STORE_META, 'readwrite').put(value, key));
}
```

- [ ] **Step 4: db testini çalıştır, geçtiğini gör**

```bash
npm test tests/db.test.js
```

Beklenen: PASS — 4 test

- [ ] **Step 5: store için başarısız testi yaz**

`overwrite/tests/store.test.js`:

```js
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
});
```

- [ ] **Step 6: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test tests/store.test.js
```

Beklenen: FAIL — `Failed to resolve import "../js/store.js"`

- [ ] **Step 7: store.js'i yaz**

`overwrite/js/store.js`:

```js
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
```

- [ ] **Step 8: Bütün testleri çalıştır**

```bash
npm test
```

Beklenen: PASS — toplam 25 test

- [ ] **Step 9: Commit**

```bash
git add js/db.js js/store.js tests/db.test.js tests/store.test.js
git commit -m "feat: IndexedDB katmanı ve gecikmeli kaydeden veri mağazası"
```

---

### Task 5: Güvenli metin girişi

**Files:**
- Create: `overwrite/js/editable.js`
- Test: `overwrite/tests/editable.test.js`

**Interfaces:**
- Consumes: yok
- Produces:
  - `setText(el: Element, text: string) => void` — metni güvenle yazar
  - `bindEditable(el: HTMLElement, { onChange: (text:string)=>void }) => void` — düz yapıştırma, boşalınca temizleme, `ph` sınıfı ile yer tutucu

- [ ] **Step 1: Başarısız testi yaz**

`overwrite/tests/editable.test.js`:

```js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setText, bindEditable } from '../js/editable.js';

function makeEl(ph = 'yaz...') {
  const el = document.createElement('div');
  el.setAttribute('contenteditable', 'true');
  el.dataset.ph = ph;
  document.body.appendChild(el);
  return el;
}

beforeEach(() => { document.body.innerHTML = ''; });

describe('setText', () => {
  it('HTML etiketini metin olarak yazar, eleman OLUŞTURMAZ', () => {
    const el = makeEl();
    setText(el, '<img src=x onerror=alert(1)>');
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('kalın etiketini metin olarak korur', () => {
    const el = makeEl();
    setText(el, '<b>KALIN</b> ve 5 < 8');
    expect(el.querySelector('b')).toBeNull();
    expect(el.textContent).toBe('<b>KALIN</b> ve 5 < 8');
  });

  it('null ve undefined için boş yazar', () => {
    const el = makeEl();
    setText(el, null);
    expect(el.textContent).toBe('');
    setText(el, undefined);
    expect(el.textContent).toBe('');
  });
});

describe('bindEditable', () => {
  it('boşken yer tutucu sınıfını koyar', () => {
    const el = makeEl();
    bindEditable(el, { onChange: () => {} });
    expect(el.classList.contains('ph')).toBe(true);
  });

  it('yazınca yer tutucuyu kaldırır ve onChange çağırır', () => {
    const el = makeEl();
    const spy = vi.fn();
    bindEditable(el, { onChange: spy });
    el.textContent = 'merhaba';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.classList.contains('ph')).toBe(false);
    expect(spy).toHaveBeenCalledWith('merhaba');
  });

  it('SİLİNCE KALAN <br> temizlenir ve yer tutucu geri gelir', () => {
    const el = makeEl();
    bindEditable(el, { onChange: () => {} });
    el.textContent = 'x';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    // tarayıcının içerik silinince bıraktığı artık
    el.innerHTML = '<br>';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.innerHTML).toBe('');
    expect(el.classList.contains('ph')).toBe(true);
  });

  it('yalnızca boşluk da boş sayılır', () => {
    const el = makeEl();
    bindEditable(el, { onChange: () => {} });
    el.textContent = '   ';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    expect(el.classList.contains('ph')).toBe(true);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test tests/editable.test.js
```

Beklenen: FAIL — `Failed to resolve import "../js/editable.js"`

- [ ] **Step 3: editable.js'i yaz**

`overwrite/js/editable.js`:

```js
/**
 * Kullanıcı metnini güvenle yazar.
 * innerHTML KULLANILMAZ: aksi halde nota <b>x</b> yazınca etiket kaybolur
 * ve <img src=x onerror=...> yazınca sayfada gerçek eleman oluşur.
 */
export function setText(el, text) {
  el.textContent = text == null ? '' : String(text);
}

function isEmpty(el) {
  return el.textContent.trim() === '';
}

/**
 * Boş alanı gerçekten boşaltır.
 * Tarayıcı içerik silinince görünmez bir <br> bırakıyor; bu yüzden
 * :empty CSS kuralı tutmuyor ve yer tutucu bir daha görünmüyor.
 */
function normalize(el) {
  if (isEmpty(el)) el.innerHTML = '';
  el.classList.toggle('ph', isEmpty(el));
}

/** Düzenlenebilir alanı bağlar: düz yapıştırma + güvenli yer tutucu. */
export function bindEditable(el, { onChange }) {
  el.addEventListener('input', () => {
    normalize(el);
    onChange(el.textContent);
  });

  el.addEventListener('blur', () => normalize(el));

  el.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain') || '';
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(text);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    normalize(el);
    onChange(el.textContent);
  });

  normalize(el);
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

```bash
npm test
```

Beklenen: PASS — toplam 33 test

- [ ] **Step 5: Commit**

```bash
git add js/editable.js tests/editable.test.js
git commit -m "feat: güvenli düzenlenebilir alan (düz metin, düz yapıştırma, yer tutucu)"
```

---

### Task 6: Uygulama kabuğu — HTML, tema, font, kurulabilirlik

**Files:**
- Create: `overwrite/index.html`
- Create: `overwrite/css/tokens.css`
- Create: `overwrite/css/base.css`
- Create: `overwrite/manifest.webmanifest`
- Create: `overwrite/fonts/PressStart2P-latin.woff2`
- Create: `overwrite/fonts/PressStart2P-latin-ext.woff2`
- Create: `overwrite/icons/icon-192.png`
- Create: `overwrite/icons/icon-512.png`
- Create: `overwrite/tools/fetch-font.mjs`

**Interfaces:**
- Consumes: yok
- Produces: Tarayıcıda açılan, tema renkleri ve fontu yüklü, ana ekrana eklenebilir boş kabuk. CSS değişkenleri: `--void`, `--vio`, `--vio-br`, `--bevel`, `--cardbg`, `--ink`, `--danger`

- [ ] **Step 1: Font indirme betiğini yaz**

`overwrite/tools/fetch-font.mjs`:

```js
// Press Start 2P'nin latin VE latin-ext alt kümelerini indirir.
// latin-ext olmadan Ğ, Ş, İ harfleri sistem fontuna düşer.
import { writeFile, mkdir } from 'node:fs/promises';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const cssUrl = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
const css = await fetch(cssUrl, { headers: { 'User-Agent': UA } }).then(r => r.text());

// Her @font-face bloğunun üstünde /* latin */ gibi bir yorum var.
const blocks = css.split('/*').slice(1);
const wanted = { latin: null, 'latin-ext': null };

for (const block of blocks) {
  const name = block.slice(0, block.indexOf('*/')).trim();
  if (!(name in wanted)) continue;
  const m = block.match(/url\((https:[^)]+\.woff2)\)/);
  if (m) wanted[name] = m[1];
}

for (const [name, url] of Object.entries(wanted)) {
  if (!url) throw new Error('Alt küme bulunamadı: ' + name);
  const buf = Buffer.from(await fetch(url, { headers: { 'User-Agent': UA } })
    .then(r => r.arrayBuffer()));
  await mkdir('fonts', { recursive: true });
  const file = `fonts/PressStart2P-${name}.woff2`;
  await writeFile(file, buf);
  console.log('indirildi:', file, buf.length, 'bayt');
}
```

- [ ] **Step 2: Fontları indir ve ikisinin de geldiğini doğrula**

```bash
cd "C:/Users/Güngörünce/Desktop/Cladue Code/overwrite"
node tools/fetch-font.mjs
ls -la fonts/
```

Beklenen: iki dosya da mevcut ve boyutları sıfırdan büyük. Yalnızca biri indiyse **devam etme** — betiği düzelt.

- [ ] **Step 3: `tokens.css` yaz**

`overwrite/css/tokens.css`:

```css
/* Press Start 2P — İKİ alt küme de zorunlu.
   Ğ, Ş, İ harfleri latin-ext içindedir; sadece latin alınırsa
   bu üç harf sessizce sistem fontuna düşer. */
@font-face {
  font-family: 'Press Start 2P';
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url('../fonts/PressStart2P-latin-ext.woff2') format('woff2');
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF,
                 U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF,
                 U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}
@font-face {
  font-family: 'Press Start 2P';
  font-style: normal;
  font-weight: 400;
  font-display: block;
  src: url('../fonts/PressStart2P-latin.woff2') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
                 U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122,
                 U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

:root {
  --void:     #08060C;
  --vio:      #A855F7;
  --vio-br:   #C77DFF;
  --bevel:    #5B21B6;
  --ink:      #2E1065;
  --ink-soft: #3B1D7A;
  --danger:       #F0509A;
  --danger-text:  #FF9AC6;

  --cardbg: linear-gradient(178deg,
    rgba(205,145,255,.80)  0%,
    rgba(196,128,252,.86) 40%,
    rgba(224,183,255,.93) 76%,
    rgba(243,229,255,.97) 100%);
  --card-border: rgba(240,224,255,.9);

  --sheet-w: 82px;
  --sheet-h: 114px;

  --font-pixel: 'Press Start 2P', monospace;
  --font-mono: 'Courier New', Courier, monospace;
}
```

- [ ] **Step 4: `base.css` yaz**

`overwrite/css/base.css`:

```css
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: var(--void);
  color: var(--vio-br);
  font-family: var(--font-mono);
  overscroll-behavior: none;
}

/* iOS'ta ana ekran uygulamasında güvenli alanı boyar */
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
           env(safe-area-inset-bottom) env(safe-area-inset-left);
}

#app {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: radial-gradient(130% 62% at 50% 42%, #1a1030 0%, var(--void) 70%);
}

.screen { position: absolute; inset: 0; transition: opacity .18s; }
.screen[hidden] { display: block; opacity: 0; pointer-events: none; }

/* Yer tutucu — :empty KULLANILMAZ, silince kalan <br> yüzünden tutmuyor */
.ph:before {
  content: attr(data-ph);
  color: rgba(59,29,122,.42);
  font-style: italic;
  pointer-events: none;
}
```

- [ ] **Step 5: `manifest.webmanifest` yaz**

`overwrite/manifest.webmanifest`:

```json
{
  "name": "OVERWRITE",
  "short_name": "OVERWRITE",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#08060C",
  "theme_color": "#08060C",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" }
  ]
}
```

- [ ] **Step 6: İkonları üret**

`overwrite/tools/make-icons.mjs`:

```js
// Bağımlılıksız ikon üretimi: siyah zemin üstünde mor çerçeveli "OW".
// Basit bir PNG kodlayıcı yerine SVG'yi canvas'sız gömmek yerine,
// düz renkli PNG'yi elle kuruyoruz (zlib ile).
import { writeFile, mkdir } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';

function png(size, draw) {
  const bytesPerPixel = 4;
  const raw = Buffer.alloc((size * bytesPerPixel + 1) * size);
  const px = (x, y, r, g, b, a) => {
    const row = y * (size * bytesPerPixel + 1);
    const off = row + 1 + x * bytesPerPixel;
    raw[off] = r; raw[off + 1] = g; raw[off + 2] = b; raw[off + 3] = a;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) draw(px, x, y, size);

  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crcTable = png.crcTable || (png.crcTable = (() => {
      const t = [];
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
        t[n] = c >>> 0;
      }
      return t;
    })());
    let crc = 0xFFFFFFFF;
    for (const b of td) crc = crcTable[(crc ^ b) & 0xFF] ^ (crc >>> 8);
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE((crc ^ 0xFFFFFFFF) >>> 0);
    return Buffer.concat([len, td, crcBuf]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const draw = (px, x, y, size) => {
  const u = size / 32;                 // 32x32'lik ızgara
  const gx = Math.floor(x / u), gy = Math.floor(y / u);
  const outer = gx >= 2 && gx <= 29 && gy >= 9 && gy <= 22;
  const outerEdge = outer && (gx <= 3 || gx >= 28 || gy <= 10 || gy >= 21);
  const inner = gx >= 6 && gx <= 25 && gy >= 13 && gy <= 18;
  const innerEdge = inner && (gx === 6 || gx === 25 || gy === 13 || gy === 18);
  if (outerEdge || innerEdge) px(x, y, 0xA8, 0x55, 0xF7, 255);
  else px(x, y, 0x08, 0x06, 0x0C, 255);
};

await mkdir('icons', { recursive: true });
for (const size of [192, 512]) {
  await writeFile(`icons/icon-${size}.png`, png(size, draw));
  console.log('yazıldı: icons/icon-' + size + '.png');
}
```

```bash
node tools/make-icons.mjs
ls -la icons/
```

Beklenen: iki PNG de mevcut, boyutları sıfırdan büyük.

- [ ] **Step 7: `index.html` yaz**

`overwrite/index.html`:

```html
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <meta name="theme-color" content="#08060C">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="OVERWRITE">
  <link rel="apple-touch-icon" href="icons/icon-192.png">
  <link rel="manifest" href="manifest.webmanifest">
  <title>OVERWRITE</title>
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/base.css">
</head>
<body>
  <div id="app">
    <section class="screen" id="screen-ring"></section>
    <section class="screen" id="screen-timeline" hidden></section>
  </div>
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 8: Geçici `app.js` ile fontu doğrula**

`overwrite/js/app.js`:

```js
import { roman } from './roman.js';

// Geçici kanarya: font alt kümeleri doğru yüklendi mi?
// Ş, Ğ, İ harfleri latin-ext içindedir. Diğerlerinden farklı
// görünüyorlarsa latin-ext dosyası eksiktir.
document.getElementById('screen-ring').innerHTML =
  '<div style="font-family:var(--font-pixel);font-size:14px;line-height:2;padding:24px">' +
  'OVERWRITE<br>' + roman(14) + '<br>ŞİŞLİ GEZİSİ<br>ÇÖĞÜI ı</div>';
```

- [ ] **Step 9: Tarayıcıda aç ve gözle doğrula**

```bash
python -m http.server 8080
```

`http://localhost:8080` adresini aç. Beklenen: siyah zemin, mor piksel yazı, **`ŞİŞLİ GEZİSİ` satırındaki Ş, İ ve Ğ harfleri diğer harflerle aynı piksel fontta.** Farklı görünüyorlarsa Step 2'ye dön.

- [ ] **Step 10: Commit**

```bash
git add index.html manifest.webmanifest css/ fonts/ icons/ tools/ js/app.js
git commit -m "feat: uygulama kabuğu, tema, iki alt kümeli font, kurulabilirlik"
```

---

### Task 7: Glitch buton bileşeni

**Files:**
- Create: `overwrite/js/glitch.js`
- Create: `overwrite/css/glitch.css`
- Modify: `overwrite/index.html` (glitch.css bağlantısı)

**Interfaces:**
- Consumes: yok
- Produces:
  - `makeGlitchButton({ label: string, variant?: 'normal'|'big'|'danger', onClick?: () => void }) => HTMLElement`
  - `fireGlitch(el: HTMLElement) => void` — bozulmayı bir kez oynatır

- [ ] **Step 1: `glitch.css` yaz**

`overwrite/css/glitch.css`:

```css
/* Glitch RENK DEĞİŞTİRMEZ. Yalnızca yatay şerit kaymasıdır.
   Buton 6 kopya halinde üst üste durur; bozulma anında asıl kopya
   görünmez olur, 5 şerit farklı yönlerde kayar ve aralarındaki
   ince boşluklar siyah kalır — çerçevedeki kopukluk buradan çıkar. */
.gb { position: relative; display: inline-block; cursor: pointer; }
.gb .slice { position: absolute; left: 0; top: 0; opacity: 0; pointer-events: none; }
.gb .slice.s1 { clip-path: inset(2%  0 84% 0); }
.gb .slice.s2 { clip-path: inset(18% 0 64% 0); }
.gb .slice.s3 { clip-path: inset(37% 0 46% 0); }
.gb .slice.s4 { clip-path: inset(55% 0 27% 0); }
.gb .slice.s5 { clip-path: inset(74% 0  8% 0); }

@keyframes gb-base { 0%, 96% { opacity: 0 } 100% { opacity: 1 } }
@keyframes gb-s1 { 0%{opacity:1;transform:translateX(-9px)}18%{transform:translateX(5px)}36%{transform:translateX(-3px)}54%{transform:translateX(11px)}72%{transform:translateX(-6px)}88%{transform:translateX(2px)}100%{opacity:0;transform:translateX(0)} }
@keyframes gb-s2 { 0%{opacity:1;transform:translateX(7px)}18%{transform:translateX(-11px)}36%{transform:translateX(4px)}54%{transform:translateX(-2px)}72%{transform:translateX(8px)}88%{transform:translateX(-4px)}100%{opacity:0;transform:translateX(0)} }
@keyframes gb-s3 { 0%{opacity:1;transform:translateX(-4px)}18%{transform:translateX(13px)}36%{transform:translateX(-8px)}54%{transform:translateX(3px)}72%{transform:translateX(-12px)}88%{transform:translateX(5px)}100%{opacity:0;transform:translateX(0)} }
@keyframes gb-s4 { 0%{opacity:1;transform:translateX(6px)}18%{transform:translateX(-3px)}36%{transform:translateX(10px)}54%{transform:translateX(-8px)}72%{transform:translateX(1px)}88%{transform:translateX(-7px)}100%{opacity:0;transform:translateX(0)} }
@keyframes gb-s5 { 0%{opacity:1;transform:translateX(-7px)}18%{transform:translateX(8px)}36%{transform:translateX(-2px)}54%{transform:translateX(5px)}72%{transform:translateX(-10px)}88%{transform:translateX(3px)}100%{opacity:0;transform:translateX(0)} }

.gb.fire .base  { animation: gb-base .32s steps(1,end) 1 }
.gb.fire .s1 { animation: gb-s1 .32s steps(1,end) 1 }
.gb.fire .s2 { animation: gb-s2 .32s steps(1,end) 1 }
.gb.fire .s3 { animation: gb-s3 .32s steps(1,end) 1 }
.gb.fire .s4 { animation: gb-s4 .32s steps(1,end) 1 }
.gb.fire .s5 { animation: gb-s5 .32s steps(1,end) 1 }

/* Buton yüzeyi: çift mor çerçeve, arada siyah boşluk, saf siyah iç */
.chip {
  border: 2px solid var(--vio);
  background: #000;
  padding: 2px;
  box-shadow: 0 0 2px #fff, 0 0 9px var(--vio), 0 0 22px rgba(168,85,247,.6);
}
.chip .in {
  border: 1px solid var(--vio);
  padding: 6px 9px;
  font-family: var(--font-pixel);
  font-size: 9px;
  letter-spacing: 1px;
  color: var(--vio-br);
  text-shadow: 1px 1px 0 var(--bevel), 0 0 8px rgba(228,196,255,.9), 0 0 18px rgba(168,85,247,.8);
  white-space: nowrap;
}
.chip.big { border-width: 3px; padding: 4px; }
.chip.big .in { border-width: 2px; padding: 11px 4px; font-size: 13px; text-align: center; }
.chip.danger { border-color: var(--danger); box-shadow: 0 0 2px #fff, 0 0 9px var(--danger), 0 0 22px rgba(240,80,154,.6); }
.chip.danger .in { border-color: var(--danger); color: var(--danger-text); text-shadow: 1px 1px 0 #7A1140, 0 0 8px rgba(255,180,210,.9); }
```

- [ ] **Step 2: `glitch.js` yaz**

`overwrite/js/glitch.js`:

```js
const SLICE_COUNT = 5;

function chip(label, variant) {
  const wrap = document.createElement('div');
  wrap.className = 'chip' + (variant && variant !== 'normal' ? ' ' + variant : '');
  const inner = document.createElement('div');
  inner.className = 'in';
  inner.textContent = label;
  wrap.appendChild(inner);
  return wrap;
}

/** Glitch'li buton üretir: 1 asıl + 5 şerit kopya. */
export function makeGlitchButton({ label, variant = 'normal', onClick }) {
  const el = document.createElement('div');
  el.className = 'gb';
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', label);

  const base = chip(label, variant);
  base.classList.add('base');
  el.appendChild(base);

  for (let i = 1; i <= SLICE_COUNT; i++) {
    const s = chip(label, variant);
    s.classList.add('slice', 's' + i);
    el.appendChild(s);
  }

  if (onClick) {
    const handler = (e) => { e.preventDefault(); fireGlitch(el); onClick(); };
    el.addEventListener('click', handler);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') handler(e);
    });
  }
  return el;
}

/** Bozulmayı bir kez oynatır. */
export function fireGlitch(el) {
  el.classList.remove('fire');
  void el.offsetWidth;            // sınıfı yeniden uygulamak için akışı zorla
  el.classList.add('fire');
  setTimeout(() => el.classList.remove('fire'), 360);
}

/** Verilen butonları rastgele sırayla, aralıklarla tetikler. */
export function idleGlitch(getButtons, intervalMs = 3000) {
  return setInterval(() => {
    const list = getButtons().filter(Boolean);
    if (!list.length) return;
    fireGlitch(list[Math.floor(Math.random() * list.length)]);
  }, intervalMs);
}
```

- [ ] **Step 3: `index.html`'e glitch.css bağlantısını ekle**

`overwrite/index.html` içinde `base.css` satırının altına:

```html
  <link rel="stylesheet" href="css/glitch.css">
```

- [ ] **Step 4: Geçici olarak `app.js` ile gözle doğrula**

`overwrite/js/app.js` içeriğini şununla değiştir:

```js
import { makeGlitchButton, fireGlitch, idleGlitch } from './glitch.js';

const host = document.getElementById('screen-ring');
host.style.cssText = 'display:flex;flex-direction:column;gap:22px;align-items:center;justify-content:center';

const ow    = makeGlitchButton({ label: 'OVERWRITE', variant: 'big',    onClick: () => {} });
const erase = makeGlitchButton({ label: 'ERASE',     variant: 'danger', onClick: () => {} });
const back  = makeGlitchButton({ label: '◄ GERI',                        onClick: () => {} });
host.append(ow, erase, back);

idleGlitch(() => [ow, erase, back], 1500);
```

```bash
python -m http.server 8080
```

`http://localhost:8080` — beklenen: üç buton görünüyor, 1.5 saniyede bir sırayla bozuluyor, **bozulma sırasında renk değişmiyor** (cyan/kırmızı görünmüyor), şeritler yatay kayıyor ve aralarda siyah boşluklar oluşuyor. Butonlara basınca da bozuluyorlar.

- [ ] **Step 5: Commit**

```bash
git add js/glitch.js css/glitch.css index.html js/app.js
git commit -m "feat: glitch buton bileşeni"
```

---

### Task 8: Çember ekranı

**Files:**
- Create: `overwrite/js/ring.js`
- Create: `overwrite/css/sheets.css`
- Modify: `overwrite/index.html` (sheets.css bağlantısı)
- Modify: `overwrite/js/app.js`

**Interfaces:**
- Consumes: `roman()`, `RING`, `relIndex`, `placement`, `edgePoint`, `makeGlitchButton`, `fireGlitch`, `Store`
- Produces: `createRingScreen({ root, store, onOpen }) => { render(bornId?), step(dir), destroy() }`

- [ ] **Step 1: `sheets.css` yaz**

`overwrite/css/sheets.css`:

```css
/* ÜÇ KATMAN ZORUNLU.
   Tek elemanda birleştirilirse konum, süzülme ve doğuş animasyonları
   aynı transform özelliği için kavga eder ve biri diğerini siler. */
.pos {
  position: absolute; left: 0; top: 0;
  width: var(--sheet-w); height: var(--sheet-h);
  transition: transform .46s cubic-bezier(.22,.7,.28,1), opacity .46s ease;
}
.float {
  width: 100%; height: 100%;
  animation: floaty var(--fd, 4.4s) ease-in-out infinite var(--fdl, 0s);
}
@keyframes floaty { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }

.sheet {
  width: 100%; height: 100%;
  background: var(--cardbg);
  border: 1px solid var(--card-border);
  padding: 7px 6px 6px;
  display: flex; flex-direction: column;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(199,125,255,.9), 0 0 46px rgba(168,85,247,.6),
              inset 0 0 18px rgba(255,255,255,.45);
}
.sheet .kicker { font: 700 5.5px var(--font-mono); letter-spacing: 1.4px; color: #4C1D95; opacity: .9 }
.sheet .no { font-family: var(--font-pixel); font-size: 13px; line-height: 1; margin: 4px 0 5px; color: var(--ink) }
.sheet .name {
  font: 700 6.5px var(--font-mono); color: var(--ink-soft); line-height: 1.3;
  margin-bottom: 6px; border-bottom: 1px solid rgba(59,29,122,.25);
  padding-bottom: 5px; min-height: 9px;
  overflow: hidden; overflow-wrap: anywhere; max-height: 18px;
}
.sheet .line { height: 2.2px; background: rgba(59,29,122,.34); border-radius: 2px; margin: 3.5px 0 }
.sheet .count { font: 700 5.5px var(--font-mono); letter-spacing: 1px; color: #4C1D95; opacity: .85; margin-top: auto }

/* Doğuş: yalnızca yatay ezilme. Konum içermez — konum dış katmanın işi. */
@keyframes sheet-born {
  0%   { opacity: 0; transform: scaleX(.08); filter: brightness(2.6) }
  18%  { opacity: 1; transform: scaleX(1.24) }
  34%  { transform: scaleX(.84); filter: brightness(2) }
  50%  { transform: scaleX(1.12) }
  66%  { transform: scaleX(.94); filter: brightness(1.4) }
  82%  { transform: scaleX(1.04) }
  100% { opacity: 1; transform: scaleX(1); filter: none }
}
.sheet.born { animation: sheet-born .48s steps(1,end) 1 }

#wires { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5 }
.ring-head {
  position: absolute; top: 14px; left: 0; right: 0; text-align: center;
  font: 700 8px var(--font-mono); letter-spacing: 3px; color: var(--vio); opacity: .5; z-index: 40;
}
.ring-empty {
  position: absolute; left: 0; right: 0; top: 58%; text-align: center; z-index: 20;
  font: 700 8px var(--font-mono); letter-spacing: 2px; color: #8B5CF6; opacity: .75; line-height: 1.9;
}
.ring-ow { position: absolute; left: 28px; right: 28px; top: 46%; z-index: 30 }
.ring-nav {
  position: absolute; bottom: 12px; left: 0; right: 0; z-index: 60;
  display: flex; align-items: center; justify-content: center; gap: 12px;
}
.ring-nav button {
  background: rgba(168,85,247,.16); border: 1px solid rgba(168,85,247,.6);
  color: #E9D5FF; font: 700 13px var(--font-mono); border-radius: 4px; padding: 3px 12px; cursor: pointer;
}
.ring-ind {
  font: 700 8px var(--font-mono); letter-spacing: 1px; color: #C084FC;
  min-width: 130px; max-width: 190px; text-align: center;
  overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
}
```

- [ ] **Step 2: `ring.js` yaz**

`overwrite/js/ring.js`:

```js
import { roman } from './roman.js';
import { RING, relIndex, placement, edgePoint } from './ring-math.js';
import { makeGlitchButton, fireGlitch, idleGlitch } from './glitch.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function createRingScreen({ root, store, onOpen }) {
  root.innerHTML =
    '<div class="ring-head" id="ringHead">DATA COMPILATION</div>' +
    '<svg id="wires" preserveAspectRatio="none"></svg>' +
    '<div id="ringSheets"></div>' +
    '<div class="ring-empty" id="ringEmpty">HENÜZ HİÇBİR ŞEY YOK.<br>BAŞLAMAK İÇİN BAS.</div>' +
    '<div class="ring-ow" id="ringOw"></div>' +
    '<div class="ring-nav" id="ringNav">' +
      '<button type="button" id="ringPrev" aria-label="önceki">&#9668;</button>' +
      '<div class="ring-ind" id="ringInd">—</div>' +
      '<button type="button" id="ringNext" aria-label="sonraki">&#9658;</button>' +
    '</div>';

  const head   = root.querySelector('#ringHead');
  const wires  = root.querySelector('#wires');
  const host   = root.querySelector('#ringSheets');
  const empty  = root.querySelector('#ringEmpty');
  const nav    = root.querySelector('#ringNav');
  const ind    = root.querySelector('#ringInd');

  const owBtn = makeGlitchButton({ label: 'OVERWRITE', variant: 'big', onClick: () => {
    const tl = store.createTimeline();
    cur = store.list().length - 1;
    render(tl.id);
  }});
  root.querySelector('#ringOw').appendChild(owBtn);

  root.querySelector('#ringPrev').addEventListener('click', () => step(-1));
  root.querySelector('#ringNext').addEventListener('click', () => step(1));

  let cur = 0;
  let rafId = null;
  const nodes = new Map();   // timeline id -> { pos, float, sheet }
  const paths = new Map();   // timeline id -> <path>

  function geometry() {
    const w = root.clientWidth || 290;
    const h = root.clientHeight || 560;
    wires.setAttribute('viewBox', `0 0 ${w} ${h}`);
    return {
      center: { x: w / 2, y: h * 0.4964 },
      radii: { rx: w * 0.379, ry: h * 0.2714 }
    };
  }

  function fillSheet(sheet, tl) {
    sheet.innerHTML =
      '<div class="kicker">TIMELINE</div><div class="no"></div><div class="name"></div>' +
      '<div class="line" style="width:72%"></div><div class="line" style="width:56%"></div>' +
      '<div class="count"></div>';
    sheet.querySelector('.no').textContent = roman(tl.no);
    sheet.querySelector('.name').textContent = tl.ad || '';   // güvenli
    const n = tl.entries.length;
    sheet.querySelector('.count').textContent = n + (n === 1 ? ' ENTRY' : ' ENTRIES');
  }

  function makeNode(tl, i) {
    const pos = document.createElement('div');
    pos.className = 'pos';
    const flo = document.createElement('div');
    flo.className = 'float';
    flo.style.setProperty('--fd', (4 + (i % 5) * 0.28).toFixed(2) + 's');
    flo.style.setProperty('--fdl', ((i * 370) % 2100) + 'ms');
    const sheet = document.createElement('div');
    sheet.className = 'sheet';
    flo.appendChild(sheet); pos.appendChild(flo); host.appendChild(pos);

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('stroke', '#A855F7');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    wires.appendChild(path);

    const rec = { pos, float: flo, sheet };
    nodes.set(tl.id, rec);
    paths.set(tl.id, path);
    return rec;
  }

  function render(bornId) {
    const list = store.list();
    const n = list.length;
    const { center, radii } = geometry();

    head.textContent = n ? `DATA COMPILATION · ${n} TIMELINE${n === 1 ? '' : 'S'}` : 'DATA COMPILATION';
    empty.style.display = n ? 'none' : 'block';
    nav.style.display = n ? 'flex' : 'none';

    const live = new Set(list.map(t => t.id));
    for (const [id, rec] of nodes) if (!live.has(id)) { rec.pos.remove(); nodes.delete(id); }
    for (const [id, p]  of paths) if (!live.has(id)) { p.remove(); paths.delete(id); }

    if (!n) { ind.textContent = '—'; return; }
    if (cur >= n) cur = n - 1;

    list.forEach((tl, i) => {
      let rec = nodes.get(tl.id);
      const fresh = !rec;
      if (fresh) rec = makeNode(tl, i);
      fillSheet(rec.sheet, tl);

      const d = relIndex(i, cur, n);
      const p = placement(d, center, radii);
      const tr = `translate(${(p.x - RING.SHEET_W / 2).toFixed(1)}px,` +
                 `${(p.y - RING.SHEET_H / 2).toFixed(1)}px) scale(${p.scale.toFixed(3)})`;

      // Yeni föy geçişsiz olarak yerine konur, sonra geçiş açılır;
      // aksi halde ekranın köşesinden süzülerek gelir.
      if (fresh) {
        rec.pos.style.transition = 'none';
        rec.pos.style.transform = tr;
        rec.pos.style.opacity = p.opacity;
        void rec.pos.offsetWidth;
        rec.pos.style.transition = '';
      } else {
        rec.pos.style.transform = tr;
        rec.pos.style.opacity = p.opacity;
      }
      rec.pos.style.zIndex = p.z;
      rec.pos.style.pointerEvents = p.visible ? 'auto' : 'none';

      rec.sheet.onclick = () => {
        const dd = relIndex(i, cur, store.list().length);
        if (dd === 0) onOpen(tl.id);
        else { cur = i; render(); }
      };

      const path = paths.get(tl.id);
      path.style.display = p.visible ? '' : 'none';
      path.setAttribute('stroke-width', (1.4 - Math.abs(d) * 0.25).toFixed(2));
      path.setAttribute('opacity', (p.opacity * 0.75).toFixed(2));

      if (tl.id === bornId) {
        rec.sheet.classList.add('born');
        setTimeout(() => rec.sheet.classList.remove('born'), 500);
      }
    });

    const c = store.list()[cur];
    ind.textContent = 'TIMELINE ' + roman(c.no) + (c.ad ? ' · ' + c.ad : '');
  }

  /* İpler föylerin GERÇEK ekran konumunu takip eder; böylece idle
     süzülme sırasında bile uç föye yapışık kalır. Ekran gizliyken
     döngü çalışmaz — görünmeyen bir şey için pil harcanmaz. */
  function syncWires() {
    if (!root.hasAttribute('hidden')) {
      const { center } = geometry();
      const rootRect = root.getBoundingClientRect();
      for (const tl of store.list()) {
        const rec = nodes.get(tl.id), path = paths.get(tl.id);
        if (!rec || !path || path.style.display === 'none') continue;
        const r = rec.sheet.getBoundingClientRect();
        if (!r.width) continue;
        const sheet = {
          x: r.left - rootRect.left + r.width / 2,
          y: r.top - rootRect.top + r.height / 2,
          halfW: r.width / 2,
          halfH: r.height / 2
        };
        const e = edgePoint(sheet, center);
        const dx = sheet.x - center.x, dy = sheet.y - center.y;
        const len = Math.hypot(dx, dy) || 1;
        const mx = (center.x + e.x) / 2, my = (center.y + e.y) / 2, off = 11;
        path.setAttribute('d',
          `M${center.x} ${center.y} Q ${(mx - dy / len * off).toFixed(1)} ` +
          `${(my + dx / len * off).toFixed(1)} ${e.x.toFixed(1)} ${e.y.toFixed(1)}`);
      }
    }
    rafId = requestAnimationFrame(syncWires);
  }
  rafId = requestAnimationFrame(syncWires);

  function step(dir) {
    const n = store.list().length;
    if (!n) return;
    cur = (cur + dir + n) % n;
    render();
  }

  window.addEventListener('resize', () => render());

  // Buton kendiliğinden bozulsun. Çember ekranındayken tek buton var,
  // o yüzden aralık 3 sn; ilk açılışta (hiç timeline yokken) 2 sn —
  // kullanıcı ilk bakışta butonun ne olduğunu anlasın diye.
  const idleTimer = idleGlitch(
    () => (root.hasAttribute('hidden') ? [] : [owBtn]),
    3000
  );
  const firstRunTimer = setInterval(() => {
    if (!root.hasAttribute('hidden') && store.list().length === 0) fireGlitch(owBtn);
  }, 2000);

  return {
    render,
    step,
    owButton: owBtn,
    destroy() {
      if (rafId) cancelAnimationFrame(rafId);
      clearInterval(idleTimer);
      clearInterval(firstRunTimer);
    }
  };
}
```

- [ ] **Step 3: `index.html`'e sheets.css bağlantısını ekle**

`glitch.css` satırının altına:

```html
  <link rel="stylesheet" href="css/sheets.css">
```

- [ ] **Step 4: `app.js`'i çember ekranını kuracak şekilde yaz**

`overwrite/js/app.js`:

```js
import * as backend from './db.js';
import { createStore } from './store.js';
import { createRingScreen } from './ring.js';

const store = createStore(backend);

async function boot() {
  await store.load();
  createRingScreen({
    root: document.getElementById('screen-ring'),
    store,
    onOpen: (id) => { console.log('timeline açılacak:', id); }
  }).render();
}

boot();
```

- [ ] **Step 5: Tarayıcıda gözle doğrula**

```bash
python -m http.server 8080
```

`http://localhost:8080` — beklenen sırayla:
1. İlk açılışta boş: sadece OVERWRITE ve altında ipucu yazısı
2. OVERWRITE'a bas → föy glitch'leyerek doğuyor, `TIMELINE I` yazıyor
3. Beş kez daha bas → çemberde diziliyorlar, mor ipler butondan föylere gidiyor
4. Oklara bas → föyler **süzülerek** yer değiştiriyor, ipler onlarla birlikte esniyor
5. Föyler hafifçe yukarı aşağı süzülüyor, hepsi aynı anda değil
6. Sayfayı yenile → föyler **duruyor** (IndexedDB çalışıyor), numaralar kaldığı yerden devam ediyor
7. Yandaki föye bas → öne geliyor. Öndekine bas → konsolda `timeline açılacak: ...` yazıyor

- [ ] **Step 6: Commit**

```bash
git add js/ring.js css/sheets.css index.html js/app.js
git commit -m "feat: çember ekranı, üç katmanlı föyler, ipleri takip eden döngü"
```

---

### Task 9: Timeline ekranı

**Files:**
- Create: `overwrite/js/timeline.js`
- Create: `overwrite/css/screens.css`
- Modify: `overwrite/index.html` (screens.css bağlantısı)
- Modify: `overwrite/js/app.js` (ekranlar arası geçiş)

**Interfaces:**
- Consumes: `roman()`, `bindEditable`, `setText`, `makeGlitchButton`, `Store`
- Produces: `createTimelineScreen({ root, store, onBack }) => { open(timelineId), destroy() }`

- [ ] **Step 1: `screens.css` yaz**

`overwrite/css/screens.css`:

```css
.topbar {
  position: absolute; top: 0; left: 0; right: 0; height: 46px; z-index: 50;
  display: flex; align-items: center; justify-content: space-between; padding: 0 10px;
  background: linear-gradient(to bottom, #0b0714 62%, transparent);
}
.thead { padding: 54px 16px 12px; position: relative; z-index: 2 }
.tkicker { font-family: var(--font-pixel); font-size: 10px; color: var(--vio); text-shadow: 0 0 10px rgba(168,85,247,.8) }
.tname {
  font-family: var(--font-pixel); font-size: 14px; line-height: 1.45; color: #D9BBFA;
  margin-top: 8px; outline: none; min-height: 16px; overflow-wrap: anywhere;
  text-shadow: 2px 2px 0 var(--bevel), 0 0 14px rgba(196,140,250,.7);
}
.tname:focus { box-shadow: inset 0 -2px 0 rgba(168,85,247,.7) }
.tname.ph:before { color: rgba(217,187,250,.35); font-style: normal }
.tmeta { font: 700 7px var(--font-mono); letter-spacing: 2px; color: #8B5CF6; opacity: .8; margin-top: 9px }
.trule { height: 1px; margin: 12px 0 0; opacity: .55;
  background: linear-gradient(to right, transparent, var(--vio), transparent) }

.entry-scroll {
  position: absolute; top: 160px; bottom: 0; left: 0; right: 0;
  overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 6px 14px 96px; z-index: 2;
}
.entry-scroll::-webkit-scrollbar { width: 3px }
.entry-scroll::-webkit-scrollbar-thumb { background: rgba(168,85,247,.45); border-radius: 3px }

.slot { margin-bottom: 12px; position: relative }
.ecard {
  position: relative; padding: 9px 10px; background: var(--cardbg);
  border: 1px solid var(--card-border); color: var(--ink);
  box-shadow: 0 0 16px rgba(199,125,255,.75), 0 0 38px rgba(168,85,247,.45),
              inset 0 0 16px rgba(255,255,255,.4);
}
.erow { display: flex; align-items: baseline; gap: 6px }
.enum { font-family: var(--font-pixel); font-size: 8px; color: var(--ink); white-space: nowrap; flex: none }
.esep { color: rgba(46,16,101,.5); font: 700 9px var(--font-mono); flex: none }
.ename {
  flex: 1 1 auto; min-width: 0; font: 700 9px var(--font-mono); letter-spacing: .5px;
  color: var(--ink-soft); outline: none; overflow-wrap: anywhere;
}
.ename:focus { box-shadow: inset 0 -1px 0 rgba(59,29,122,.6) }
.edel { font: 700 11px var(--font-mono); color: #5B1668; cursor: pointer; opacity: .6;
  padding: 2px 6px; user-select: none; flex: none }
.etxt {
  font: 12px/1.5 var(--font-mono); color: var(--ink-soft); margin-top: 7px; outline: none;
  min-height: 16px; border-top: 1px solid rgba(59,29,122,.22); padding-top: 6px;
  overflow-wrap: anywhere;
}

@keyframes entry-born {
  0%{opacity:0;transform:translateX(-14px) scaleY(.2);filter:brightness(2.4)}
  15%{opacity:1;transform:translateX(11px) scaleY(.45)}
  30%{transform:translateX(-8px) scaleY(1.14);filter:brightness(1.8)}
  45%{transform:translateX(6px) scaleY(.9)}
  60%{transform:translateX(-4px) scaleY(1.05);filter:brightness(1.3)}
  78%{transform:translateX(2px) scaleY(.98)}
  100%{opacity:1;transform:translateX(0) scaleY(1);filter:none}
}
.ecard.born { animation: entry-born .42s steps(1,end) 1 }

.fab { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 60 }
.fab .chip .in { font-size: 12px; padding: 7px 12px }

.saved {
  position: absolute; bottom: 72px; left: 50%; transform: translateX(-50%); z-index: 55;
  font: 700 8px var(--font-mono); letter-spacing: 2px; color: var(--vio-br); opacity: 0;
  text-shadow: 0 0 10px rgba(168,85,247,.9); pointer-events: none; white-space: nowrap;
}
@keyframes saved-in {
  0%{opacity:0;transform:translate(-50%,6px)}12%{opacity:1;transform:translate(-52%,0)}
  16%{transform:translate(-48%,0)}20%{transform:translate(-50%,0)}70%{opacity:1}100%{opacity:0}
}
.saved.show { animation: saved-in 1.9s steps(1,end) 1 }
```

- [ ] **Step 2: `timeline.js` yaz**

`overwrite/js/timeline.js`:

```js
import { roman } from './roman.js';
import { bindEditable, setText } from './editable.js';
import { makeGlitchButton, idleGlitch } from './glitch.js';

export function createTimelineScreen({ root, store, onBack }) {
  root.innerHTML =
    '<div class="topbar"><span id="tlBack"></span><span id="tlErase"></span></div>' +
    '<div class="thead">' +
      '<div class="tkicker" id="tlKicker">TIMELINE</div>' +
      '<div class="tname" id="tlName" contenteditable="true" spellcheck="false" data-ph="isim ver..."></div>' +
      '<div class="tmeta" id="tlMeta">0 ENTRIES</div>' +
      '<div class="trule"></div>' +
    '</div>' +
    '<div class="entry-scroll" id="tlScroll"></div>' +
    '<div class="saved" id="tlSaved">&#9622; KAYDEDİLDİ</div>' +
    '<div class="fab" id="tlAdd"></div>';

  const kicker = root.querySelector('#tlKicker');
  const nameEl = root.querySelector('#tlName');
  const metaEl = root.querySelector('#tlMeta');
  const scroll = root.querySelector('#tlScroll');
  const savedEl = root.querySelector('#tlSaved');

  let openId = null;

  const backBtn  = makeGlitchButton({ label: '◄ GERI', onClick: () => { openId = null; onBack(); } });
  const eraseBtn = makeGlitchButton({ label: 'ERASE', variant: 'danger', onClick: () => eraseTimeline() });
  const addBtn   = makeGlitchButton({ label: '+', onClick: () => addEntry() });
  root.querySelector('#tlBack').appendChild(backBtn);
  root.querySelector('#tlErase').appendChild(eraseBtn);
  root.querySelector('#tlAdd').appendChild(addBtn);

  // Butonlar kendiliğinden, sırayla bozulur. Ekran gizliyken durur.
  const idleTimer = idleGlitch(
    () => (root.hasAttribute('hidden') ? [] : [backBtn, eraseBtn, addBtn]),
    3000
  );

  bindEditable(nameEl, {
    onChange: (text) => {
      if (openId) store.update(openId, (tl) => { tl.ad = text.trim(); });
    }
  });

  store.onSaved(() => {
    savedEl.classList.remove('show');
    void savedEl.offsetWidth;
    savedEl.classList.add('show');
  });

  function meta() {
    const tl = store.get(openId);
    if (!tl) return;
    const n = tl.entries.length;
    metaEl.textContent = n + (n === 1 ? ' ENTRY' : ' ENTRIES');
  }

  function entryCard(tl, en) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    const card = document.createElement('div');
    card.className = 'ecard';
    card.innerHTML =
      '<div class="erow">' +
        '<div class="enum"></div><div class="esep">-</div>' +
        '<div class="ename" contenteditable="true" spellcheck="false" data-ph="isim ver..."></div>' +
        '<div class="edel" role="button" aria-label="sil">&#10005;</div>' +
      '</div>' +
      '<div class="etxt" contenteditable="true" spellcheck="false" data-ph="buraya yaz..."></div>';
    slot.appendChild(card);

    card.querySelector('.enum').textContent = 'ENTRY ' + en.sira;
    const nameField = card.querySelector('.ename');
    const textField = card.querySelector('.etxt');
    setText(nameField, en.ad);      // güvenli
    setText(textField, en.metin);   // güvenli

    bindEditable(nameField, {
      onChange: (t) => store.update(tl.id, () => { en.ad = t.trim(); })
    });
    bindEditable(textField, {
      onChange: (t) => store.update(tl.id, () => { en.metin = t; })
    });

    card.querySelector('.edel').addEventListener('click', () => {
      store.deleteEntry(tl.id, en.id);
      slot.remove();
      meta();
    });

    return slot;
  }

  function renderEntries() {
    const tl = store.get(openId);
    scroll.innerHTML = '';
    if (!tl) return;
    tl.entries.forEach(en => scroll.appendChild(entryCard(tl, en)));
    meta();
  }

  function addEntry() {
    const tl = store.get(openId);
    if (!tl) return;
    const en = store.addEntry(tl.id);
    const slot = entryCard(tl, en);
    slot.querySelector('.ecard').classList.add('born');
    scroll.appendChild(slot);
    meta();
    setTimeout(() => {
      slot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      slot.querySelector('.ename').focus();
    }, 140);
  }

  function eraseTimeline() {
    const tl = store.get(openId);
    if (!tl) return;
    store.deleteTimeline(tl.id);
    openId = null;
    onBack();
  }

  return {
    open(id) {
      openId = id;
      const tl = store.get(id);
      if (!tl) return;
      kicker.textContent = 'TIMELINE ' + roman(tl.no);
      setText(nameEl, tl.ad || '');   // güvenli
      nameEl.classList.toggle('ph', !(tl.ad || '').trim());
      renderEntries();
    },
    destroy() { clearInterval(idleTimer); }
  };
}
```

- [ ] **Step 3: `index.html`'e screens.css bağlantısını ekle**

`sheets.css` satırının altına:

```html
  <link rel="stylesheet" href="css/screens.css">
```

- [ ] **Step 4: `app.js`'i ekran geçişiyle tamamla**

`overwrite/js/app.js`:

```js
import * as backend from './db.js';
import { createStore } from './store.js';
import { createRingScreen } from './ring.js';
import { createTimelineScreen } from './timeline.js';

const store = createStore(backend);
const ringRoot = document.getElementById('screen-ring');
const tlRoot   = document.getElementById('screen-timeline');

let ring, timeline;

function showRing() {
  tlRoot.setAttribute('hidden', '');
  ringRoot.removeAttribute('hidden');
  ring.render();
}

function showTimeline(id) {
  ringRoot.setAttribute('hidden', '');
  tlRoot.removeAttribute('hidden');
  timeline.open(id);
}

async function boot() {
  await store.load();
  ring = createRingScreen({ root: ringRoot, store, onOpen: showTimeline });
  timeline = createTimelineScreen({ root: tlRoot, store, onBack: showRing });
  ring.render();

  // Sayfa gizlenirken bekleyen yazma varsa hemen diske yaz
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') store.flush();
  });
  window.addEventListener('pagehide', () => store.flush());
}

boot();
```

- [ ] **Step 5: Elle doğrula**

```bash
python -m http.server 8080
```

Sırayla dene:
1. OVERWRITE ile timeline oluştur, öndekine bas → timeline ekranı açılıyor
2. Başlığa tıkla, `ŞİŞLİ GEZİSİ` yaz → yer tutucu kayboluyor
3. `+` ile entry ekle, ad ve metin yaz → alt tarafta `KAYDEDİLDİ` bir kez glitch'leyip geçiyor
4. Metne `<b>KALIN</b> ve 5 < 8` yaz, geri dön, tekrar aç → **yazdığın aynen duruyor**, kalın yazı olmuyor
5. Metni tamamen sil → `buraya yaz...` ipucu **geri geliyor**
6. Başka bir yerden biçimli metin kopyalayıp yapıştır → düz metin olarak giriyor
7. `✕` ile entry sil → kart gidiyor, sayaç düşüyor
8. Geri dön → föyde isim ve entry sayısı güncel
9. Sayfayı yenile → **her şey duruyor**
10. ERASE → timeline siliniyor, çembere dönülüyor

- [ ] **Step 6: Commit**

```bash
git add js/timeline.js css/screens.css index.html js/app.js
git commit -m "feat: timeline ekranı, entry düzenleme, otomatik kaydetme"
```

---

### Task 10: Çevrimdışı çalışma ve kalıcı depolama

**Files:**
- Create: `overwrite/sw.js`
- Create: `overwrite/js/platform.js`
- Modify: `overwrite/js/app.js`

**Interfaces:**
- Consumes: yok
- Produces:
  - `platform.js`: `requestPersistence() => Promise<{ supported: boolean, granted: boolean }>`, `isStandalone() => boolean`
  - `sw.js`: uygulama kabuğunu önbelleğe alan service worker

- [ ] **Step 1: `sw.js` yaz**

`overwrite/sw.js`:

```js
const CACHE = 'overwrite-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/tokens.css',
  './css/base.css',
  './css/glitch.css',
  './css/sheets.css',
  './css/screens.css',
  './css/dissolve.css',
  './js/app.js',
  './js/roman.js',
  './js/ring-math.js',
  './js/db.js',
  './js/store.js',
  './js/editable.js',
  './js/glitch.js',
  './js/ring.js',
  './js/timeline.js',
  './js/dissolve.js',
  './js/backup.js',
  './js/platform.js',
  './fonts/PressStart2P-latin.woff2',
  './fonts/PressStart2P-latin-ext.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* addAll KULLANILMAZ: listedeki tek bir dosya bile 404 verirse
   kurulumun tamamı başarısız olur ve çevrimdışı çalışma hiç kurulmaz.
   Bu liste henüz yazılmamış dosyaları da içeriyor (dissolve.js Task 12'de,
   backup.js Task 13'te geliyor), o yüzden her dosya tek tek ve
   hatası yutularak önbelleğe alınır. */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(
        ASSETS.map(url => c.add(url).catch(err => {
          console.warn('önbelleğe alınamadı (atlandı):', url, err.message);
        }))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
```

- [ ] **Step 2: `platform.js` yaz**

`overwrite/js/platform.js`:

```js
/**
 * Kalıcı depolama ister. iOS 17+ destekliyor ve WebKit izni verirken
 * "ana ekran uygulaması olarak açılmış mı" kriterine bakıyor.
 * İzin verilirse tarayıcı depolama baskısında bu veriyi silmez.
 */
export async function requestPersistence() {
  if (!navigator.storage || !navigator.storage.persist) {
    return { supported: false, granted: false };
  }
  try {
    const already = await navigator.storage.persisted();
    if (already) return { supported: true, granted: true };
    const granted = await navigator.storage.persist();
    return { supported: true, granted };
  } catch {
    return { supported: true, granted: false };
  }
}

/** Ana ekrandan mı açıldı (adres çubuğu yok)? */
export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}
```

- [ ] **Step 3: `app.js`'e service worker kaydı ve kalıcılık isteği ekle**

`overwrite/js/app.js` içindeki `boot()` fonksiyonunun sonuna ekle:

```js
  const { supported, granted } = await requestPersistence();
  console.log('kalıcı depolama:', { supported, granted, standalone: isStandalone() });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err =>
      console.warn('service worker kaydedilemedi:', err));
  }
```

Dosyanın başına da:

```js
import { requestPersistence, isStandalone } from './platform.js';
```

- [ ] **Step 4: Çevrimdışı çalışmayı doğrula**

```bash
python -m http.server 8080
```

1. `http://localhost:8080` aç, birkaç timeline oluştur
2. Tarayıcı geliştirici araçlarında Application → Service Workers → kayıtlı olduğunu gör
3. Konsolda "önbelleğe alınamadı (atlandı)" uyarıları çıkabilir — `dissolve.js`, `backup.js`
   ve `dissolve.css` henüz yazılmadığı için **bu beklenen durumdur**, kurulum yine de başarılı
4. Sunucuyu durdur (`Ctrl+C`)
5. Sayfayı yenile → **uygulama yine açılıyor ve veriler duruyor**

- [ ] **Step 5: Commit**

```bash
git add sw.js js/platform.js js/app.js
git commit -m "feat: çevrimdışı önbellek ve kalıcı depolama isteği"
```

---

### Task 11: İLK TELEFON TESTİ — yayına al ve iPhone'a kur

Bu görev kod yazmaz, **riskleri erken ortaya çıkarır.** Animasyon cilası bundan sonra gelir.

**Files:** yok (yayın ve elle doğrulama)

**Interfaces:**
- Consumes: Task 1–10 çıktıları
- Produces: iPhone ana ekranında çalışan, çevrimdışı açılan uygulama

- [ ] **Step 1: GitHub'da depo aç**

`gh` komut satırı aracı kurulu değil, bu yüzden web sitesinden:

1. https://github.com/new adresine git
2. Depo adı: `overwrite`
3. **Public** seç (ücretsiz planda Pages yalnızca açık depolarda çalışır)
4. README, .gitignore, lisans **ekleme** — hepsi zaten var
5. "Create repository" tıkla

- [ ] **Step 2: Uzak depoyu bağla ve gönder**

`KULLANICI-ADIN` yerine kendi GitHub kullanıcı adını yaz:

```bash
cd "C:/Users/Güngörünce/Desktop/Cladue Code/overwrite"
git remote add origin https://github.com/KULLANICI-ADIN/overwrite.git
git push -u origin main
```

- [ ] **Step 3: `node_modules` ve yedeklerin gitmediğini doğrula**

```bash
git ls-files | grep -E "node_modules|yedek" | head
```

Beklenen: **boş çıktı.** Bir şey listeleniyorsa `.gitignore`'u düzelt ve `git rm -r --cached` ile çıkar.

- [ ] **Step 4: GitHub Pages'i aç**

1. Depoda Settings → Pages
2. Source: `Deploy from a branch`
3. Branch: `main`, klasör: `/ (root)`
4. Save
5. 1–2 dakika bekle, sayfanın verdiği adresi not et: `https://KULLANICI-ADIN.github.io/overwrite/`

- [ ] **Step 5: iPhone'a kur**

1. iPhone'da **Safari** ile adresi aç (Chrome değil — ana ekrana ekleme Safari'de düzgün çalışır)
2. Paylaş düğmesi → **Ana Ekrana Ekle**
3. Ana ekrandaki OVERWRITE ikonundan aç

- [ ] **Step 6: Telefonda kontrol listesi**

Her maddeyi tek tek doğrula, **takılan olursa not al ve devam etmeden önce çöz**:

- [ ] Adres çubuğu **görünmüyor**, uygulama tam ekran açılıyor
- [ ] Bir timeline oluştur ve adına `ŞİŞLİ GEZİSİ` yaz → **Ş, İ, Ğ harfleri diğerleriyle aynı piksel fontta** (farklıysa `latin-ext` dosyası yüklenmiyor)
- [ ] Çember dönüşü akıcı, takılma yok
- [ ] Föylerin idle süzülmesi akıcı, ipler föylere yapışık
- [ ] Entry ekle, yaz → klavye açılınca yazdığın alan klavyenin altında kalmıyor
- [ ] Uygulamayı tamamen kapat, yeniden aç → **veriler duruyor**
- [ ] Uçak moduna al, uygulamayı aç → **açılıyor ve çalışıyor**
- [ ] Safari'de `chrome://` yerine geliştirici konsolu yoksa: bilgisayara USB ile bağlayıp Safari → Geliştirme menüsünden konsolu aç, `kalıcı depolama:` satırında `granted: true` yazdığını doğrula

- [ ] **Step 7: Bulguları not et**

Takılan, yavaş kalan veya yanlış görünen her şeyi bir listeye yaz. Sonraki görevlerde animasyon eklerken bu liste yön verecek — özellikle akıcılık sorunu varsa piksel boyutu ve eşzamanlılık sınırı buna göre ayarlanacak.

---

### Task 12: Silme efekti — pençe, glitch, piksel

**Files:**
- Create: `overwrite/js/dissolve.js`
- Create: `overwrite/css/dissolve.css`
- Modify: `overwrite/index.html` (dissolve.css bağlantısı)
- Modify: `overwrite/js/timeline.js` (silmede efekti çağır)

**Interfaces:**
- Consumes: yok
- Produces: `dissolveCard({ slot, card, onDone }) => void` — pençe + glitch + piksel dağılması oynatır, sonunda `slot`'u kaldırır

- [ ] **Step 1: `dissolve.css` yaz**

`overwrite/css/dissolve.css`:

```css
.piece-wrap { position: absolute; left: 0; top: 0; right: 0; pointer-events: none; will-change: transform, opacity }
.piece { position: relative; will-change: transform, opacity }

/* Şeritler OVERWRITE butonundaki glitch'le aynı geometride kayar. */
@keyframes claw-glitch {
  0%   { transform: translate(0,0) rotate(0deg); opacity: 1 }
  10%  { transform: translate(var(--nx), var(--ny)) rotate(var(--nr)); opacity: 1 }
  22%  { transform: translate(calc(var(--nx) - 19px * var(--jf)), var(--ny)) rotate(var(--nr)); opacity: 1 }
  32%  { transform: translate(calc(var(--nx) + 24px * var(--jf)), var(--ny)) rotate(var(--nr)); opacity: .12 }
  42%  { transform: translate(calc(var(--nx) - 11px * var(--jf)), var(--ny)) rotate(var(--nr)); opacity: 1 }
  54%  { transform: translate(calc(var(--nx) + 17px * var(--jf)), var(--ny)) rotate(var(--nr)); opacity: 1 }
  66%  { transform: translate(calc(var(--nx) - 25px * var(--jf)), var(--ny)) rotate(var(--nr)); opacity: .08 }
  78%  { transform: translate(calc(var(--nx) + 9px  * var(--jf)), var(--ny)) rotate(var(--nr)); opacity: 1 }
  90%  { transform: translate(calc(var(--nx) - 14px * var(--jf)), var(--ny)) rotate(var(--nr)); opacity: 1 }
  100% { transform: translate(var(--nx), var(--ny)) rotate(var(--nr)); opacity: 1 }
}
.dissolving .piece { animation: claw-glitch .34s steps(1,end) forwards }

.claw-streaks { position: absolute; inset: 0; pointer-events: none; z-index: 9; overflow: visible }
.claw-streaks path {
  stroke: #fff; fill: none; vector-effect: non-scaling-stroke; opacity: 0;
  filter: drop-shadow(0 0 4px #fff) drop-shadow(0 0 11px #E9C4FF);
}
@keyframes claw-flash {
  0% { opacity: 0; stroke-width: .4 } 16% { opacity: 1; stroke-width: 3.6 }
  48% { opacity: .85; stroke-width: 1.4 } 100% { opacity: 0; stroke-width: .3 }
}
.dissolving .claw-streaks path { animation: claw-flash .27s ease-out forwards }

.px-grid { position: absolute; left: 0; top: 0; pointer-events: none; z-index: 12; display: none }
.px-grid.on { display: block }

/* will-change YOK: binlerce kareye ayrı grafik katmanı ayırtmak
   telefonu kasan asıl sebep. Ölçüldü: 4325 elemandan 1363'e düşüş. */
.px {
  position: absolute; background-image: var(--cardbg); background-repeat: no-repeat;
  box-shadow: 0 0 4px rgba(199,125,255,.6);
}
@keyframes px-pop {
  0%   { opacity: 1;   transform: translateY(0) scale(1);      filter: brightness(1) }
  30%  { opacity: 1;   transform: translateY(-3px) scale(1.22); filter: brightness(1.9) }
  60%  { opacity: .75; transform: translateY(-11px) scale(.92); filter: brightness(1.3) }
  100% { opacity: 0;   transform: translateY(-30px) scale(.35); filter: brightness(1) }
}
.px.go { animation: px-pop .26s cubic-bezier(.3,.1,.6,1) forwards }
```

- [ ] **Step 2: `dissolve.js` yaz**

`overwrite/js/dissolve.js`:

```js
const SVG_NS = 'http://www.w3.org/2000/svg';

/* Dört YATAY pençe izi. Neredeyse düz: genişlik boyunca %8 eğim,
   sapma %0.5'in altında — kesik değil pençe görünsün diye. */
const SLASHES = [
  { left: 21, right: 13, jitter: [ .5, -.4] },
  { left: 42, right: 34, jitter: [-.4,  .5] },
  { left: 63, right: 55, jitter: [ .4, -.5] },
  { left: 84, right: 76, jitter: [-.5,  .4] }
];
const STEPS = 3;
const TOP_EDGE = [[0, 0], [100, 0]];
const BOTTOM_EDGE = [[0, 100], [100, 100]];

/* Şeritlerin ilk açılma yönü ve glitch şiddeti */
const NEAR = [[0, -5, -.5], [0, -2, .3], [0, 0, 0], [0, 2, -.3], [0, 5, .5]];
const JITTER_FACTOR = [1, -0.85, 1.35, -1.1, 0.75];

export const PIXEL_SIZE = 8;

const LINES = SLASHES.map(s => {
  const pts = [];
  for (let k = 0; k <= STEPS; k++) {
    const x = k * 100 / STEPS;
    let y = s.left + (s.right - s.left) * (k / STEPS);
    if (k > 0 && k < STEPS) y += s.jitter[k - 1];
    pts.push([x, y]);
  }
  return pts;
});

function bandPolygon(upper, lower) {
  const pts = [...upper, ...[...lower].reverse()];
  return 'polygon(' + pts.map(p => p[0].toFixed(1) + '% ' + p[1].toFixed(1) + '%').join(',') + ')';
}

/** Kartı pençe → glitch → piksel dağılması ile yok eder. */
export function dissolveCard({ slot, card, onDone }) {
  if (slot.dataset.dissolving) return;
  slot.dataset.dissolving = '1';

  const w = card.offsetWidth;
  const h = card.offsetHeight;
  slot.style.height = h + 'px';

  // 1) Beş yatay şerit
  for (let i = 0; i < 5; i++) {
    const upper = i === 0 ? TOP_EDGE : LINES[i - 1];
    const lower = i === 4 ? BOTTOM_EDGE : LINES[i];
    const wrap = document.createElement('div');
    wrap.className = 'piece-wrap';
    const piece = card.cloneNode(true);
    piece.classList.add('piece');
    piece.querySelectorAll('[contenteditable]').forEach(e => e.removeAttribute('contenteditable'));
    piece.style.clipPath = bandPolygon(upper, lower);
    piece.style.setProperty('--nx', NEAR[i][0] + 'px');
    piece.style.setProperty('--ny', NEAR[i][1] + 'px');
    piece.style.setProperty('--nr', NEAR[i][2] + 'deg');
    piece.style.setProperty('--jf', JITTER_FACTOR[i]);
    piece.style.animationDelay = (i * 9) + 'ms';
    wrap.appendChild(piece);
    slot.appendChild(wrap);
  }

  // 2) Pençe ışıkları
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'claw-streaks');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('preserveAspectRatio', 'none');
  LINES.forEach((line, i) => {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', 'M' + line.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L '));
    p.style.animationDelay = (i * 16) + 'ms';
    svg.appendChild(p);
  });
  slot.appendChild(svg);

  // 3) Piksel ızgarası — kalan eşit dağıtılır, kenarda ince şerit kalmaz
  const cols = Math.max(1, Math.round(w / PIXEL_SIZE));
  const rows = Math.max(1, Math.round(h / PIXEL_SIZE));
  const cw = w / cols, ch = h / rows;
  const grid = document.createElement('div');
  grid.className = 'px-grid';
  grid.style.width = w + 'px';
  grid.style.height = h + 'px';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = document.createElement('div');
      d.className = 'px';
      d.style.left = (c * cw).toFixed(2) + 'px';
      d.style.top = (r * ch).toFixed(2) + 'px';
      d.style.width = cw.toFixed(2) + 'px';
      d.style.height = ch.toFixed(2) + 'px';
      d.style.backgroundSize = w + 'px ' + h + 'px';
      d.style.backgroundPosition = (-c * cw).toFixed(2) + 'px ' + (-r * ch).toFixed(2) + 'px';
      // alt sıra önce gider: kart aşağıdan yukarı erir
      d.dataset.delay = ((rows - 1 - r) * 11 + Math.random() * 120).toFixed(0);
      grid.appendChild(d);
    }
  }
  slot.appendChild(grid);

  card.style.visibility = 'hidden';
  void slot.offsetWidth;
  slot.classList.add('dissolving');

  setTimeout(() => {
    slot.querySelectorAll('.piece-wrap').forEach(el => { el.style.display = 'none'; });
    grid.classList.add('on');
    grid.querySelectorAll('.px').forEach(px => {
      px.style.animationDelay = px.dataset.delay + 'ms';
      px.classList.add('go');
    });
  }, 340);

  setTimeout(() => {
    slot.style.transition = 'height .24s ease, margin .24s';
    slot.style.height = '0';
    slot.style.marginBottom = '0';
  }, 740);

  setTimeout(() => { slot.remove(); if (onDone) onDone(); }, 1000);
}

/**
 * ERASE: teker teker siler ama telefonu boğmaz.
 * - yalnızca EKRANDA GÖRÜNEN kartlar efekti oynatır
 * - aynı anda en fazla 3 kart dağılır
 * Ölçüldü: bu iki kural olmadan 20 entry'de zirve 4325 eleman,
 * kurallarla 1363.
 */
export function dissolveAll({ scroll, onEach, onDone }) {
  const all = [...scroll.querySelectorAll('.slot:not([data-dissolving])')];
  const box = scroll.getBoundingClientRect();
  const visible = all.filter(s => {
    const r = s.getBoundingClientRect();
    return r.bottom > box.top + 2 && r.top < box.bottom - 2;
  });

  if (!visible.length) { setTimeout(onDone, 320); return; }

  const MAX_CONCURRENT = 3, GAP = 150;
  let index = 0, active = 0, finished = 0;

  (function next() {
    if (index >= visible.length) return;
    if (active >= MAX_CONCURRENT) { setTimeout(next, 70); return; }
    const slot = visible[index++];
    active++;
    dissolveCard({
      slot,
      card: slot.querySelector('.ecard'),
      onDone: () => {
        active--; finished++;
        if (onEach) onEach(slot);
        if (finished === visible.length) setTimeout(onDone, 140);
      }
    });
    setTimeout(next, GAP);
  })();

  // emniyet kemeri: bir dağılma takılırsa ekran yine de kapansın
  setTimeout(onDone, visible.length * GAP + 2200);
}
```

- [ ] **Step 3: `index.html`'e dissolve.css bağlantısını ekle**

`screens.css` satırının altına:

```html
  <link rel="stylesheet" href="css/dissolve.css">
```

- [ ] **Step 4: `timeline.js`'i efekti kullanacak şekilde değiştir**

Dosyanın başına ekle:

```js
import { dissolveCard, dissolveAll } from './dissolve.js';
```

`card.querySelector('.edel').addEventListener(...)` bloğunu şununla değiştir:

```js
    card.querySelector('.edel').addEventListener('click', () => {
      store.deleteEntry(tl.id, en.id);
      dissolveCard({ slot, card, onDone: meta });
    });
```

`eraseTimeline()` fonksiyonunu şununla değiştir:

```js
  function eraseTimeline() {
    const tl = store.get(openId);
    if (!tl) return;
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      store.deleteTimeline(tl.id);
      openId = null;
      onBack();
    };
    dissolveAll({ scroll, onDone: close });
  }
```

- [ ] **Step 5: Elle doğrula**

```bash
python -m http.server 8080
```

1. Bir entry sil → dört pençe izi çakıyor, kart beş yatay şeride bölünüp yatay kayıyor, sonra **8 piksellik karelere** bölünüp **alttan yukarı** buharlaşıyor
2. 20 entry ekle, ERASE'e bas → kartlar **teker teker** dağılıyor, ekran takılmıyor, sonunda çembere dönülüyor
3. Silme sırasında geri dönmeye çalış → ekran kilitlenmiyor

- [ ] **Step 6: Commit**

```bash
git add js/dissolve.js css/dissolve.css index.html js/timeline.js
git commit -m "feat: pençe + glitch + piksel silme efekti, eşzamanlılık sınırlı ERASE"
```

---

### Task 13: Yedek alma ve geri yükleme

**Files:**
- Create: `overwrite/js/backup.js`
- Test: `overwrite/tests/backup.test.js`
- Modify: `overwrite/js/app.js` (ayar düğmesi)
- Modify: `overwrite/css/screens.css` (ayar paneli)

**Interfaces:**
- Consumes: `Store`, `getMeta`, `setMeta`
- Produces:
  - `serializeBackup(timelines: Timeline[], now: number) => string`
  - `parseBackup(text: string) => Timeline[]` — geçersizse `Error` fırlatır
  - `shareBackup(json: string) => Promise<'shared'|'downloaded'>`
  - `needsBackupReminder(lastBackupAt: number|undefined, now: number) => boolean`

- [ ] **Step 1: Başarısız testi yaz**

`overwrite/tests/backup.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { serializeBackup, parseBackup, needsBackupReminder } from '../js/backup.js';

const SAMPLE = [{
  id: 'a', no: 1, ad: 'ŞİŞLİ GEZİSİ', nextSira: 2,
  olusturma: 100, guncelleme: 200,
  entries: [
    { id: 'e1', sira: 0, ad: 'ÖLÇÜLER', metin: '<b>80 cm</b> ve 5 < 8', olusturma: 100, guncelleme: 150 },
    { id: 'e2', sira: 1, ad: '', metin: '', olusturma: 160, guncelleme: 160 }
  ]
}];

describe('serializeBackup / parseBackup', () => {
  it('gidip geldiğinde veri aynen korunur', () => {
    const json = serializeBackup(SAMPLE, 999);
    const back = parseBackup(json);
    expect(back).toEqual(SAMPLE);
  });

  it('Türkçe karakterler ve HTML benzeri metin bozulmaz', () => {
    const back = parseBackup(serializeBackup(SAMPLE, 1));
    expect(back[0].ad).toBe('ŞİŞLİ GEZİSİ');
    expect(back[0].entries[0].metin).toBe('<b>80 cm</b> ve 5 < 8');
  });

  it('sürüm ve tarih bilgisi yazar', () => {
    const obj = JSON.parse(serializeBackup(SAMPLE, 4242));
    expect(obj.v).toBe(1);
    expect(obj.exportedAt).toBe(4242);
  });

  it('bozuk JSON reddedilir', () => {
    expect(() => parseBackup('{ bu json değil')).toThrow(/okunamadı/i);
  });

  it('yanlış biçim reddedilir', () => {
    expect(() => parseBackup('{"v":1}')).toThrow(/biçim/i);
    expect(() => parseBackup('{"v":1,"timelines":"x"}')).toThrow(/biçim/i);
  });

  it('bilinmeyen sürüm reddedilir', () => {
    expect(() => parseBackup('{"v":99,"timelines":[]}')).toThrow(/sürüm/i);
  });

  it('eksik alanlı timeline reddedilir', () => {
    expect(() => parseBackup('{"v":1,"timelines":[{"id":"a"}]}')).toThrow(/biçim/i);
  });

  it('boş yedek kabul edilir', () => {
    expect(parseBackup('{"v":1,"timelines":[]}')).toEqual([]);
  });
});

describe('needsBackupReminder', () => {
  const GUN = 24 * 60 * 60 * 1000;
  it('hiç yedek alınmadıysa hatırlatır', () => {
    expect(needsBackupReminder(undefined, 1000)).toBe(true);
  });
  it('14 günden yeniyse hatırlatmaz', () => {
    expect(needsBackupReminder(1000, 1000 + 13 * GUN)).toBe(false);
  });
  it('14 günü geçtiyse hatırlatır', () => {
    expect(needsBackupReminder(1000, 1000 + 15 * GUN)).toBe(true);
  });
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu gör**

```bash
npm test tests/backup.test.js
```

Beklenen: FAIL — `Failed to resolve import "../js/backup.js"`

- [ ] **Step 3: `backup.js` yaz**

`overwrite/js/backup.js`:

```js
const VERSION = 1;
const REMINDER_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export function serializeBackup(timelines, now = Date.now()) {
  return JSON.stringify({ v: VERSION, exportedAt: now, timelines }, null, 2);
}

function validTimeline(t) {
  return t && typeof t === 'object' &&
    typeof t.id === 'string' && typeof t.no === 'number' &&
    typeof t.ad === 'string' && Array.isArray(t.entries) &&
    typeof t.nextSira === 'number';
}

export function parseBackup(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error('Yedek dosyası okunamadı: geçerli bir JSON değil.');
  }
  if (!obj || typeof obj !== 'object' || !('v' in obj)) {
    throw new Error('Yedek dosyasının biçimi tanınmadı.');
  }
  if (obj.v !== VERSION) {
    throw new Error('Yedek dosyasının sürümü desteklenmiyor: ' + obj.v);
  }
  if (!Array.isArray(obj.timelines)) {
    throw new Error('Yedek dosyasının biçimi tanınmadı: timelines listesi yok.');
  }
  if (!obj.timelines.every(validTimeline)) {
    throw new Error('Yedek dosyasının biçimi tanınmadı: eksik alanlı kayıt var.');
  }
  return obj.timelines;
}

export function needsBackupReminder(lastBackupAt, now = Date.now()) {
  if (typeof lastBackupAt !== 'number') return true;
  return now - lastBackupAt > REMINDER_DAYS * DAY_MS;
}

/**
 * iPhone'da tarayıcıdan dosya indirmek sorunlu, paylaş menüsü sorunsuz.
 * Bu yüzden önce navigator.share denenir, desteklenmiyorsa indirmeye düşülür.
 */
export async function shareBackup(json, filename = 'overwrite-yedek.json') {
  const file = new File([json], filename, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: 'OVERWRITE yedeği' });
    return 'shared';
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini gör**

```bash
npm test
```

Beklenen: PASS — toplam 44 test

- [ ] **Step 5: Ayar paneli stilini ekle**

`overwrite/css/screens.css` sonuna:

```css
.settings-btn {
  position: absolute; top: 12px; right: 12px; z-index: 70;
  background: none; border: 1px solid rgba(168,85,247,.5); color: var(--vio-br);
  font: 700 11px var(--font-mono); border-radius: 4px; padding: 4px 8px; cursor: pointer;
}
.settings-panel {
  position: absolute; inset: 0; z-index: 90; background: rgba(8,6,12,.96);
  display: flex; flex-direction: column; gap: 14px; align-items: center; justify-content: center;
  padding: 24px; text-align: center;
}
.settings-panel[hidden] { display: none }
.settings-panel h2 { font: 700 12px var(--font-pixel); color: var(--vio-br); margin: 0 0 4px }
.settings-panel button {
  background: rgba(168,85,247,.14); border: 1px solid rgba(168,85,247,.6); color: #E9D5FF;
  font: 700 11px var(--font-mono); letter-spacing: 1px; border-radius: 4px;
  padding: 9px 16px; cursor: pointer; min-width: 200px;
}
.settings-line { font: 700 9px var(--font-mono); letter-spacing: 1px; color: #8B5CF6; line-height: 1.8 }
.backup-nudge {
  position: absolute; bottom: 40px; right: 12px; z-index: 65;
  font: 700 7px var(--font-mono); letter-spacing: 1px; color: #8B5CF6; opacity: .8;
}
```

- [ ] **Step 6: Ayar panelini `app.js`'e ekle**

`overwrite/js/app.js` dosyasının importlarına ekle:

```js
import { serializeBackup, parseBackup, shareBackup, needsBackupReminder } from './backup.js';
```

`boot()` sonuna ekle:

```js
  // ---- Ayarlar ve yedek ----
  const panel = document.createElement('div');
  panel.className = 'settings-panel';
  panel.hidden = true;
  panel.innerHTML =
    '<h2>AYARLAR</h2>' +
    '<div class="settings-line" id="setStorage">KALICI DEPOLAMA: ?</div>' +
    '<div class="settings-line" id="setLast">SON YEDEK: —</div>' +
    '<button type="button" id="setExport">YEDEK AL</button>' +
    '<button type="button" id="setImport">YEDEKTEN GERİ YÜKLE</button>' +
    '<button type="button" id="setClose">KAPAT</button>' +
    '<input type="file" id="setFile" accept="application/json,.json" hidden>';
  document.getElementById('app').appendChild(panel);

  const settingsBtn = document.createElement('button');
  settingsBtn.className = 'settings-btn';
  settingsBtn.type = 'button';
  settingsBtn.textContent = '⚙';
  settingsBtn.addEventListener('click', () => { panel.hidden = false; refreshSettings(); });
  document.getElementById('app').appendChild(settingsBtn);

  panel.querySelector('#setClose').addEventListener('click', () => { panel.hidden = true; });

  async function refreshSettings() {
    panel.querySelector('#setStorage').textContent =
      'KALICI DEPOLAMA: ' + (granted ? 'AKTİF' : supported ? 'VERİLMEDİ' : 'DESTEKLENMİYOR');
    const last = await backend.getMeta('sonYedek');
    panel.querySelector('#setLast').textContent = 'SON YEDEK: ' +
      (typeof last === 'number' ? new Date(last).toLocaleDateString('tr-TR') : 'HİÇ');
  }

  // Hatırlatma rozetini yedek düğmesinden ÖNCE tanımla; düğmenin
  // işleyicisi bunu gizliyor.
  const nudge = document.createElement('div');
  nudge.className = 'backup-nudge';
  nudge.textContent = '▚ YEDEK ALMAYALI 14 GÜN OLDU';
  nudge.hidden = !needsBackupReminder(await backend.getMeta('sonYedek'), Date.now())
                 || store.list().length === 0;
  document.getElementById('app').appendChild(nudge);

  panel.querySelector('#setExport').addEventListener('click', async () => {
    await store.flush();
    const json = serializeBackup(store.list(), Date.now());
    try {
      await shareBackup(json);
      await backend.setMeta('sonYedek', Date.now());
      nudge.hidden = true;
      refreshSettings();
    } catch (err) {
      alert('Yedek gönderilemedi: ' + err.message);
    }
  });

  const fileInput = panel.querySelector('#setFile');
  panel.querySelector('#setImport').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      const timelines = parseBackup(await file.text());
      if (!confirm('Şu anki bütün notların silinip yedektekilerle değiştirilecek. Devam edilsin mi?')) return;
      for (const tl of store.list()) store.deleteTimeline(tl.id);
      for (const tl of timelines) await backend.putTimeline(tl);
      await store.load();
      panel.hidden = true;
      showRing();
    } catch (err) {
      alert(err.message);
    } finally {
      fileInput.value = '';
    }
  });
```

- [ ] **Step 7: Elle doğrula**

```bash
python -m http.server 8080
```

1. ⚙ düğmesi → panel açılıyor, kalıcı depolama durumu görünüyor
2. YEDEK AL → masaüstünde dosya iniyor (paylaş menüsü yalnızca telefonda çıkar)
3. Bir timeline sil, YEDEKTEN GERİ YÜKLE → onay soruyor, kabul edince silinmiş timeline geri geliyor
4. Bozuk bir JSON dosyası seç → anlaşılır bir hata mesajı çıkıyor, uygulama çökmüyor

- [ ] **Step 8: Commit**

```bash
git add js/backup.js tests/backup.test.js js/app.js css/screens.css
git commit -m "feat: yedek alma, geri yükleme ve hatırlatma"
```

---

### Task 14: Son telefon geçişi ve yayın

**Files:** yok (yayın ve elle doğrulama)

**Interfaces:**
- Consumes: Task 1–13 çıktıları
- Produces: iPhone'da tam çalışan, yayınlanmış uygulama

- [ ] **Step 1: Bütün testleri çalıştır**

```bash
cd "C:/Users/Güngörünce/Desktop/Cladue Code/overwrite"
npm test
```

Beklenen: **hepsi geçer.** Geçmeyen varsa yayına alma.

- [ ] **Step 2: Service worker sürümünü artır**

`overwrite/sw.js` içinde:

```js
const CACHE = 'overwrite-v2';
```

Bu adım atlanırsa telefondaki eski sürüm önbellekte kalır ve güncelleme görünmez.

- [ ] **Step 3: Yayına gönder**

```bash
git add -A
git commit -m "chore: yayın için service worker sürümü artırıldı"
git push
```

1–2 dakika bekle.

- [ ] **Step 4: Telefonda eski sürümü temizle ve yeniden kur**

1. Ana ekrandaki OVERWRITE ikonunu **sil**
2. Safari → Ayarlar → Geçmişi ve Web Sitesi Verilerini Sil (yalnızca bu site için mümkünse onu seç)
3. Adresi tekrar aç → Paylaş → Ana Ekrana Ekle

- [ ] **Step 5: Telefonda tam kontrol listesi**

- [ ] Adres çubuğu yok, tam ekran
- [ ] `ŞİŞLİ GEZİSİ` yaz → Ş, İ, Ğ diğer harflerle **aynı fontta**
- [ ] Çember dönüşü akıcı, ipler föylere yapışık
- [ ] Entry ekle, yaz, klavye alanı kapatmıyor
- [ ] Entry sil → pençe, glitch ve piksel dağılması akıcı
- [ ] 20 entry ekle, ERASE → **takılma yok**
- [ ] Uygulamayı kapat/aç → veriler duruyor
- [ ] Uçak modunda açılıyor
- [ ] ⚙ → KALICI DEPOLAMA: **AKTİF**
- [ ] ⚙ → YEDEK AL → **iOS paylaş menüsü açılıyor**, dosyayı Dosyalar'a kaydet
- [ ] Yedeği geri yükle → notlar geri geliyor

- [ ] **Step 6: Takılan bir şey varsa**

Akıcılık sorunu varsa sırayla dene ve her değişiklikten sonra telefonda ölç:
1. `dissolve.js` içinde `PIXEL_SIZE` değerini 8'den 12'ye çıkar (kare sayısı yarıya iner)
2. `dissolveAll` içinde `MAX_CONCURRENT` değerini 3'ten 2'ye indir
3. `sheets.css` içinde `floaty` animasyonunu yalnızca öndeki üç föye uygula

- [ ] **Step 7: Son commit**

```bash
git add -A
git commit -m "chore: telefon doğrulaması sonrası ayarlar"
git push
```

---

## Öz-Denetim Notları

Bu plan tasarım belgesinin şu bölümlerini karşılıyor:

| Belge bölümü | Karşılayan görev |
|---|---|
| 4 · Veri modeli, numara kimliği | Task 4 (testlerle) |
| 5.1 · Çember matematiği | Task 3 (testlerle) |
| 5.2 · Üç katmanlı föy | Task 8 |
| 5.3 · İpler ve kenar bağlanması | Task 3 + Task 8 |
| 5.4 · Timeline ekranı | Task 9 |
| 5.5 · İlk açılış boş durumu | Task 8 |
| 6 · Renkler, tipografi, font alt kümeleri | Task 6 |
| 7.1 · Glitch | Task 7 |
| 7.2 · Idle süzülme | Task 8 |
| 7.3 · Doğuş animasyonları | Task 8, Task 9 |
| 7.4 · Pençe + glitch + piksel | Task 12 |
| 7.5 · ERASE performans kuralları | Task 12 |
| 8 · Güvenli metin girişi | Task 5 (testlerle) |
| 9 · Otomatik kaydetme | Task 4 (testlerle) |
| 10 · Kalıcı silme | Task 4 (testle doğrulandı: arşiv yok) |
| 11 · Depolama, kalıcılık, yedek | Task 10, Task 13 |
| 12 · Yayın ve kurulum | Task 11, Task 14 |
| 13 · Dosya yapısı | Tüm görevler |

**Erken telefon testi:** Task 11, animasyon cilasından önce geliyor. Böylece Safari tuhaflıkları, font eksiği, kurulum sorunları ve gerçek akıcılık en başta ortaya çıkıyor.

### Belgeden sapılan tek nokta

Tasarım belgesinin 12. bölümünde açılış ekranı için "siyah zemin üstünde **glitch'leyen** OVERWRITE" yazıyor. Bu **teknik olarak mümkün değil**: iOS'ta ana ekran uygulamasının açılış ekranı hareketsiz bir görseldir, animasyon içeremez.

Planın verdiği sonuç: manifest'teki `background_color` sayesinde açılış ekranı **siyah zemin üstünde OVERWRITE ikonu** olarak çıkıyor — sabit ama temaya uygun. Gerçekten glitch'leyen bir açılış istenirse bu, uygulamanın kendi ilk karesinde oynatılan bir animasyon olarak sonradan eklenebilir; v1'e dahil edilmedi.
