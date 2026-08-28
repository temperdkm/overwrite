# OVERWRITE — Tasarım Belgesi

Tarih: 27 Ağustos 2026
Durum: onaylandı, uygulamaya hazır
Çalışan prototip: `.superpowers/brainstorm/5405-1787840413/content/proto-v7.html`

---

## 1. Ne yapıyoruz

Fikirlerin **timeline**'lara ayrıldığı, her timeline'ın içinde **entry**'ler olan kişisel bir not uygulaması. Tema Underverse'teki X!Gaster'ın OVERWRITE yeteneğinden geliyor: mor, karanlık, glitch'li, ışıldayan kağıtlar.

Tek kullanıcı. Paylaşım yok, hesap yok, sunucu yok.

Hedef cihaz: **iPhone, iOS 17 veya üzeri** (teyit edildi). Safari'den ana ekrana eklenen bir PWA. iOS 17 eşiği önemli: `navigator.storage.persist()` ve `navigator.share` ile dosya paylaşımı bu sürümden itibaren destekleniyor, ikisi de tasarımın dayandığı özellikler.

**Uygulama sırası:** her şey cilalanıp sona telefon bırakılmayacak. İlk adımda telefona **ince ama gerçek bir dikey dilim** kurulacak — çember, bir timeline, IndexedDB, ana ekrana kurulum, sade animasyonlar. Riskli bilinmeyenler (Safari tuhaflıkları, gerçek akıcılık, fontun düzgün gelmesi, kurulumun sorunsuz olması) böylece en başta ortaya çıkar. Animasyon ayarı ve yedek akışı bunun üstüne gelir.

## 2. Neden bu yapı

Kaynak materyalin kendi yapısı zaten aradığımız yapı:

- XGaster'ın notları resmî olarak `Timeline I → Entry 0, Entry 1, ...` diye numaralanıyor
- X!Alphys'in tek yaratılış amacı bu entry'leri kağıt föylerde derlemek
- OVERWRITE başlangıçta renksiz bir kalem olarak tasarlanmış; Alphys'in kağıt kullanmasının sebebi bu

## 3. Kapsam

### v1'de var

Timeline oluşturma / isimlendirme / silme · Entry ekleme / isimlendirme / yazma / silme · Sonsuz çember ana ekran · Tam ekran timeline ekranı · Otomatik kaydetme · Yedek alma ve geri yükleme · Kalıcı depolama izni ve durum göstergesi · Bütün glitch, pençe, piksel ve süzülme animasyonları

### v1'de yok (bilerek)

| Ne | Neden |
|---|---|
| **FORMER ENTRIES / geri alma** | Kullanıcı istemedi. Silme kalıcıdır. |
| Arama | Timeline sayısı azken gereksiz. 20'yi geçince eklenecek. |
| Entry'ler arası çapraz bağ | Yapıyı karmaşıklaştırır |
| Bulut senkron | Hesap bağlama işi, v1'i belirgin uzatır |
| Etiket / kategori | Timeline zaten kategorinin kendisi |
| Entry içinde görsel | Depolama ve yedek boyutunu şişirir |
| Aydınlık tema | Temaya aykırı |

## 4. Veri modeli

```
Timeline
  id          benzersiz kimlik
  no          1, 2, 3...   → arayüzde Roma rakamı (I, II, III)
  ad          kullanıcının verdiği isim (boş olabilir)
  entries     Entry listesi
  nextSira    bir sonraki entry'nin alacağı sıra numarası
  olusturma / guncelleme

Entry
  id          benzersiz kimlik
  sira        0, 1, 2...   → arayüzde "ENTRY 0"
  ad          kullanıcının verdiği isim (boş olabilir)
  metin       notun kendisi
  olusturma / guncelleme
```

### Numaralandırma kuralı (28 Ağustos 2026'da değiştirildi)

**Numara konumdur, kimlik değil.** Aradan biri silinince kalanlar kayar ve boşluk kalmaz.

- TIMELINE II silinirse III, II olur; liste her zaman I, II, III diye gider
- ENTRY 1 silinirse ENTRY 2, ENTRY 1 olur; liste her zaman 0, 1, 2 diye gider
- Yeni gelen her zaman listenin uzunluğunun bir fazlasını alır

**Önceki karar bunun tersiydi** — "numara kimliktir, silinen numara asla geri gelmez", boşluklar beklenen davranıştı. Kullanıcı kullandıktan sonra boşlukların rahatsız edici olduğunu gördü ve kararı değiştirdi. Bunun bedeli: bir entry'ye "3 numaralı not" diye dışarıdan referans verilemez, çünkü numara zamanla değişebilir. Uygulamada böyle bir referans yok.

Numaralandırma her silmede ve **her açılışta** yeniden hesaplanır. Açılışta da hesaplanmasının sebebi: eski şemayla yazılmış, boşluklu kayıtlar diskte durabilir (kullanıcının telefonunda vardı); `load()` bunları sessizce düzeltip geri yazar.

Roma rakamı ve entry sırası sistemindir, kullanıcı değiştiremez. Ad kullanıcınındır, boş bırakılabilir. Arayüzde ikisi her zaman birlikte görünür: `TIMELINE X` + `ALEV ÇUKURU`, `ENTRY 0` + `ÖLÇÜLER`.

## 5. Ekranlar

İki ekran var, ayarlar dışında üçüncüsü yok.

### 5.1 Ana ekran — sonsuz çember

- Siyah zemin (`#08060C`), merkeze doğru hafif mor ışıma
- Merkezde **OVERWRITE butonu**
- Föyler butonun etrafında **eliptik bir çember** üzerinde, aynı anda **7 tanesi görünür**
- Öndeki föy tam boyutta ve tam opak; uzaklaştıkça küçülür ve solar
- Föyler **hiç yatmaz**, her zaman dik durur
- Her föy **butona bakan kenarından** mor bir iple butona bağlı
- Kaydırma çemberi döndürür, sonu yoktur, başa döner

**Çember matematiği**

```
merkez        = OVERWRITE butonunun merkezi
açı(d)        = 90° + d × 50°        (d = merkeze göre sıra farkı, -3..3)
konum         = merkez + (Rx·cos(açı), Ry·sin(açı))
ölçek(d)      = 1 - |d| × 0.17       (en az 0.18)
saydamlık(d)  = 1 - |d| × 0.24       (|d| > 3 ise 0)
katman(d)     = 14 - |d|             (buton 30, arkadakiler altında kalır)
```

`d` hesabı `-N/2 .. +N/2` aralığına kırpılır; bu sayede az sayıda timeline'da hiçbir föy iki yerde görünmez, ayrı bir kod yolu gerekmez.

290 px genişlikte Rx = 110, Ry = 152.

### 5.2 Föyün üç katmanı — kritik yapı

Föy **tek eleman değil, iç içe üç eleman** olmalı. Aksi halde konum, süzülme ve doğuş animasyonları aynı `transform` özelliği için kavga eder ve biri diğerini siler. Prototipte bu hata bir kez yapıldı ve geçiş animasyonu kayboldu.

| Katman | Sorumluluğu |
|---|---|
| `.pos` (dış) | Çemberdeki konum. `transform` + `transition: .46s` |
| `.float` (orta) | Idle süzülme. `animation: floaty 4–5s sonsuz` |
| `.gsheet` (iç) | Görünüm + doğuş glitch'i (`scaleX`, konum içermez) |

Föyler **asla yok edilip yeniden yaratılmaz**. Çember dönerken aynı elemanların sadece `transform` değeri güncellenir; eleman yeniden yaratılırsa "önceki konum" olmadığı için CSS geçişi tetiklenmez ve föy varış noktasında aniden belirir. Silinen timeline'ın elemanı kaldırılır, yeni timeline'ın elemanı **geçiş kapalıyken** yerine konur, sonra geçiş açılır.

Idle süzülme süreleri (4.0–5.1 sn) ve başlangıç gecikmeleri föyden föye farklı olmalı ki hepsi aynı anda hareket etmesin.

### 5.3 İpler

İp föyün ortasına değil, **butona bakan kenarına** bağlanır ve asla yazının üstünden geçmez. Bağlanma noktası, merkezden föy merkezine giden doğrunun föyün sınır kutusunu kestiği yerdir:

```
t = min(yarıGenişlik / |dx|, yarıYükseklik / |dy|)
nokta = föyMerkezi - (dx, dy) × t
```

Bu formül kendiliğinden doğru kenarı bulur: alttaki föylerde üst kenar, yanlardakilerde iç yan kenar, üsttekilerde alt kenar. İp yuvarlak uçla biter, **ucunda düğüm veya nokta yoktur**.

İpler her karede yeniden hesaplanır (`requestAnimationFrame`) ve föylerin gerçek ekran konumu okunur — böylece hem çember dönerken hem idle süzülme sırasında ipin ucu föye yapışık kalır. **Çember ekranı görünmüyorken bu döngü çalışmamalıdır**, aksi halde boşuna pil harcar.

### 5.4 Timeline ekranı

Tam ekran açılır.

- **Üst bar:** solda `◄ GERI`, sağda `ERASE` (kırmızımsı pembe, tehlike rengi)
- **Başlık:** `TIMELINE X`, altında düzenlenebilir ad, altında `N ENTRIES`, altında ince mor ayraç
- **Kaydırılabilir liste:** entry kartları
- **Altta ortada:** `+` butonu

Entry kartı ışıldayan mor föy. Üst satırda `ENTRY 0` — `AD` — `✕`, altında ayraç, altında metin. Ad da metin de doğrudan kartın üstünde düzenlenir; ayrı düzenleme ekranı yoktur.

### 5.5 İlk açılış — hiç timeline yokken

Ekranda sadece OVERWRITE butonu durur, ip yok föy yok. Altında sönük bir satır: `HENÜZ HİÇBİR ŞEY YOK. BAŞLAMAK İÇİN BAS.` İlk timeline oluşunca kaybolur.

Bu ekran uygulamanın ilk izlenimi olduğu için buton burada daha sık glitch'ler (2 saniyede bir).

## 6. Görsel sistem

### Renkler

| Rol | Değer |
|---|---|
| Zemin | `#08060C` |
| Buton çerçevesi ve ipler | `#A855F7` |
| Buton yazısı | `#C77DFF` |
| Bevel gölgesi | `#5B21B6` |
| Buton iç zemini | `#000000` (saf siyah) |
| Föy gövdesi | `#C480FC` civarı, aşağı doğru `#F3E5FF`'e açılan geçiş |
| Föy kenarlığı | `#F0E0FF` |
| Föy üstündeki yazı | `#2E1065` / `#3B1D7A` |
| ERASE | `#F0509A` çerçeve, `#FF9AC6` yazı |

**Kural:** föyün moru butonun morundan bir tık **açık**. Buton ekrandaki en parlak nesnedir; föyler ona göre kısıktır ki buton kaybolmasın.

### Tipografi

- **Press Start 2P** — buton yazıları, Roma rakamları, `ENTRY N`, başlıklar
- **Monospace (Courier)** — gövde metinleri, etiketler, sayaçlar

Press Start 2P 8 px altında okunmaz, uzun metinde kullanılmaz.

### ⚠ Font paketleme — atlanırsa telefonda ortaya çıkar

Press Start 2P, Google Fonts'ta **beş ayrı dosyaya bölünmüş** durumda ve Türkçe harflerimiz ikiye ayrılıyor:

| Harf | Alt küme |
|---|---|
| Ç Ö Ü ı | `latin` |
| **Ğ Ş İ** | **`latin-ext`** |

`latin-ext` dosyası, o harflerden biri ekranda görünene kadar indirilmiyor. Uygulama çevrimdışı çalışacağı için font yerel olarak paketlenecek — ve **sadece `latin` dosyası alınırsa Ğ, Ş ve İ sessizce sistem fontuna düşer.** "ŞİŞLİ GEZİSİ" gibi bir isim üç harfi uyumsuz görünür ve bu ancak telefonda, çevrimdışıyken, yayına aldıktan sonra fark edilir.

**Her iki woff2 dosyası da paketlenecek.** Örnek verilerdeki `ŞİŞLİ GEZİSİ` timeline'ı kalıcı kanarya olarak duruyor: telefonda ilk açılışta o üç harf diğerlerinden farklı görünüyorsa font eksik yüklenmiştir.

### OVERWRITE butonunun yapısı

Dıştan içe: 4 px mor çerçeve → 8 px siyah boşluk → 3 px mor çerçeve → siyah iç alan → yazı. Yazının gölgesi sağ-alta 3 px kayık ve `#5B21B6`; harfler bu yüzden kabartma görünür. Etrafında çok katmanlı mor ışıma var.

## 7. Animasyonlar

### 7.1 Glitch — bütün butonlarda

**Renk değişmez.** Efekt tamamen yatay yer değiştirmedir.

Buton, biri asıl olmak üzere 6 kopya halinde üst üste durur. 5 kopyanın her biri `clip-path` ile farklı bir yatay şeridi gösterir:

```
şerit 1: %2–%16   şerit 2: %18–%36   şerit 3: %37–%54
şerit 4: %55–%73  şerit 5: %74–%92
```

Bozulma anında asıl buton görünmez olur, şeritler görünür olur ve her biri kendi ritminde ±20 px yatay kayar. Şeritlerin arasındaki ince boşluklar siyah kalır — **çerçevedeki kopuk görüntü buradan çıkar.** Geçişler `steps` ile ani, süre 0.32 s.

Butonlar kendiliğinden 3–4 saniyede bir sırayla tetiklenir; basıldığında da tetiklenir.

### 7.2 Föy idle süzülmesi

Her föy yavaşça 6 px yukarı-aşağı süzülür. Süreler 4–5 sn, her föyde farklı, gecikmeler de farklı.

### 7.3 Yeni öğe doğuşu

Yeni timeline föyü: yatay ezilme (`scaleX`) + parlaklık patlaması, `steps`, 0.48 s. Konum içermez, çünkü konum dış katmanın işidir.
Yeni entry kartı: yatay kayma + dikey ezilme + parlaklık, `steps`, 0.42 s.

### 7.4 Silme — pençe, glitch, piksel

Üç aşamalı, toplam ~1 saniye.

**1 · Pençe (0–270 ms).** Kartı soldan sağa kesen **dört yatay iz**. İzler neredeyse düz, genişlik boyunca %8 eğimli, sapma %0.5'in altında — kesik değil pençe görünsün diye çok hafif kırılmalı. Kart bu izlerle **beş yatay şeride** ayrılır. İzler boyunca beyaz ışık çakıp söner.

**2 · Glitch (0–340 ms).** Beş şerit, butonun glitch'iyle aynı geometride yatay sıçrar; her şerit farklı yön ve şiddette, arada bir kare boyunca tamamen kaybolur. Pençenin yatay olması bilinçlidir: şeritler yatay olunca hareket yönü ile kesik yönü çakışır ve efekt butonun kimliğiyle aynı dili konuşur.

**3 · Piksel (340 ms–1 sn).** Kart **8 px'lik karelere** bölünür. Kareler **alt sıradan başlayıp yukarı doğru** tek tek yok olur: önce bir an parlayıp büyür, sonra küçülüp yükselerek silinir. Kağıt yırtılıp atılmış gibi değil, veri silinmiş gibi.

Izgara kurulurken kalan piksel **eşit dağıtılır** (`sütun = round(genişlik / 8)`, `hücre = genişlik / sütun`). Sabit 8 px'e bölmek kenarlarda 4×2 gibi çirkin şeritler bırakıyor.

### 7.5 ERASE — teker teker, ama telefonu boğmadan

ERASE bütün entry'leri **teker teker** dağıtır. Ancak ölçüldü: 20 entry'lik bir timeline'da naif uygulama aynı anda **4325 DOM elemanı** üretiyor (normal 333) ve her kare ayrı grafik katmanı istiyor — eski iPhone'da kasar.

Üç kural zorunlu:

1. **Sadece ekranda görünen kartlar** dağılma efektini oynar. Görünmeyenler kimse izlemediği için sessizce kaldırılır.
2. Aynı anda **en fazla 3 kart** dağılır, gerisi sıraya girer. Kartlar arası gecikme 150 ms.
3. Piksel karelerinde **`will-change` kullanılmaz.** Binlerce elemana katman ayırtmak asıl yükün kaynağı.

Bu üçüyle zirve **1363 elemana** düşüyor — dörtte biri. Görüntü değişmiyor.

Bir de emniyet kemeri: bir dağılma takılırsa ekran yine de kapanmalı (`gorunen × 150 ms + 2200 ms` sonra zorla).

## 8. Metin girişi — düzenlenebilir alanlar

Ad ve metin alanları doğrudan kart üstünde düzenlenir. Üç kural zorunlu, üçü de prototipte hata olarak ortaya çıktı:

1. **Kullanıcı metni asla `innerHTML` ile yazılmaz, `textContent` ile yazılır.** Aksi halde nota `<b>kalın</b>` yazınca etiket kaybolup gerçek biçim uygulanıyor, `<img src=x onerror=...>` yazınca sayfada gerçek eleman oluşuyor ve tarayıcı onu yüklemeye çalışıyor. Yedek dosyası geri yüklenirken bu ciddi bir açık.
2. **Yer tutucu `:empty` ile yapılmaz.** Alan tamamen silinince tarayıcı görünmez bir `<br>` bırakıyor, `:empty` tutmuyor ve ipucu bir daha gelmiyor. Bunun yerine alan boşalınca içerik programatik olarak temizlenir ve bir sınıf ile yer tutucu gösterilir.
3. **Yapıştırma düz metne çevrilir.** Aksi halde kopyalanan yazının rengi, boyutu, bağlantıları da gelip kartı dağıtıyor.

Ayrıca uzun ve boşluksuz metinler için satır kırma (`overflow-wrap: anywhere`), föydeki isimde iki satır sınırı, alt göstergede üç nokta ile kırpma gerekir.

## 9. Kaydetme

Kaydet tuşu **yoktur**. Her değişiklik yazma durduktan **300 ms** sonra IndexedDB'ye yazılır. Yazma küçük ve sık tutulur; Safari'nin çökme anında yazılmamış işlemi kaybetme ihtimaline karşı en iyi savunma budur.

Yazma tamamlanınca ekranın altında `KAYDEDİLDİ` göstergesi bir kez glitch'leyip söner.

## 10. Silme davranışı

Entry silme **kalıcıdır**, geri alma yoktur. Timeline ERASE etmek de kalıcıdır. ERASE bu yüzden ayrı renkte ve ayrı köşededir.

## 11. Depolama, yedek, riskler

Veriler telefonun IndexedDB'sinde durur, hiçbir sunucuya gitmez.

Uygulama ilk açılışta `navigator.storage.persist()` çağırır. iOS 17'den itibaren destekleniyor ve WebKit izni verirken baktığı kriterlerden biri açıkça "ana ekran uygulaması olarak açılmış mı". Ayarlarda `navigator.storage.persisted()` okunup durum gösterilir.

| Risk | Durum |
|---|---|
| Safari'nin 7 gün kuralı | **Vurmuyor.** Ana ekrana eklenen web uygulamaları bu kuralın dışında |
| Depolama baskısında silinme | Kalıcı depolama izni verilirse silme mekanizmasının dışında kalınır |
| Ana ekrandaki ikonun silinmesi | **Veri gider.** Tek çare yedek |
| Telefon kaybı / yenisine geçiş | iCloud yedeğine dahil olduğu belgelenmemiş, dahil değil varsayılıyor |
| Tarayıcı çökmesi | Küçük ve sık yazma ile en aza indiriliyor |

### Yedek

Ayarlarda tek tuş. Bütün veri tek JSON dosyasına yazılır ve `navigator.share` ile iOS'un paylaş ekranına verilir — Dosyalar'a, iCloud Drive'a, Notlar'a veya mail'e gönderilir. iPhone'da tarayıcıdan dosya indirmek sorunlu olduğu için paylaş menüsü seçildi; desteklenmiyorsa klasik indirmeye düşülür.

Geri yükleme dosya seçerek yapılır, üzerine yazmadan önce onay sorar. Son yedek tarihi saklanır; 14 günü geçerse ana ekranın köşesinde sessiz bir hatırlatma çıkar.

## 12. Yayın

GitHub Pages, ücretsiz plan. Depo herkese açık olmak zorunda, yani **kod görünür**. Sakıncası yok: uygulamada gizli bir şey yok ve **notlar depoda değil, telefonda** durur. Adresi açan biri bomboş bir uygulama görür.

Tek gerçek risk yedek dosyasının yanlışlıkla depoya gönderilmesidir. `.gitignore` yedek dosya desenlerini baştan engelleyecek.

Kurulum: telefonda Safari ile adrese girilir, Paylaş → Ana Ekrana Ekle. Sonrasında kendi ikonuyla, adres çubuğu olmadan açılır. Açılış ekranı siyah zemin üstünde glitch'leyen OVERWRITE.

## 13. Dosya yapısı

Çerçeve kullanılmayacak. Düz HTML, CSS, JavaScript. Bütün görsel iş zaten bu teknolojilerle prototiplendi ve doğrudan taşınabiliyor; ayrıca çerçevesiz uygulama küçük ve hızlı kalıyor.

```
overwrite/
  index.html
  manifest.json
  service-worker.js
  css/
    tokens.css          renkler, ölçüler, fontlar
    glitch.css          glitch şeritleri
    sheets.css          föyler ve entry kartları
    dissolve.css        pençe + piksel dağılması
    screens.css         ekran yerleşimleri
  js/
    db.js               IndexedDB sarmalayıcı
    store.js            veri işlemleri, otomatik kaydetme
    ring.js             çember matematiği, üç katman, ip takibi
    timeline.js         timeline ekranı
    editable.js         güvenli metin girişi (textContent, düz yapıştırma, yer tutucu)
    glitch.js           glitch tetikleme
    dissolve.js         silme efekti ve eşzamanlılık sınırı
    backup.js           yedek al / geri yükle
    app.js              başlangıç, yönlendirme
  fonts/
    PressStart2P-latin.woff2
    PressStart2P-latin-ext.woff2      ← ikisi de zorunlu
  icons/
```

## 14. Prototipte doğrulananlar

Aşağıdakiler tarayıcıda test edilerek doğrulandı, uygulamada da aynı davranış beklenir:

- OVERWRITE yeni timeline üretiyor, rakamlar doğru sırayla ilerliyor
- Öndeki föye basınca timeline açılıyor, yandakine basınca öne geliyor
- Entry ekleme, isimlendirme, yazma, silme çalışıyor
- Bütün timeline'lar silinince boş durum doğru görünüyor, artık eleman kalmıyor
- Çember dönüşünde föyler yok edilmiyor, geçiş animasyonu tetikleniyor
- Metin girişinde etiket bozulması ve eleman oluşumu yok
- Boşalan alanda yer tutucu geri geliyor
- ERASE zirvesi 4325 → 1363 elemana düştü

**Doğrulanamayan:** animasyonların görünüşü ve hızı. Test ortamında tarayıcı gizli çalıştığı için CSS animasyonları ilerlemiyor. Yapı, matematik ve veri akışı doğrulandı; hız ve şiddet telefonda gözle onaylanmalı.
