# KAR-DEF sitesi: yayına hazırlık özellikleri — tasarım

Tarih: 18 Kasım 2026 · Proje: `web/` (Next.js 16 + Payload 3.91, geliştirmede SQLite)

## Amaç ve neden

KAR-DEF / AV-KARDEP haber ve arşiv sitesi yayına çıkmadan önce grubun istediği eksik özellikler tamamlanacak:
Zazaca dil desteği, reklam alanları, kur şeridi, canlı yayın ekranı, yeni duyuru türleri ve ziyaretçilerin
arşive katkı gönderebileceği form. Site dernek üyelerine (çoğu yaşlı, Türkiye ve Avrupa'da) sunulacak; kolay
kullanım, iki temada okunurluk ve akıcı animasyon önceliklidir (bkz. mevcut tasarım tercihleri).

Bu turda **yalnızca kod** yazılır. Sunucu kurulumu, PostgreSQL'e geçiş, alan adı ve yayına alma sonraki işler.

## Hedefler

1. **Zazaca (Kirmanckî) yedinci içerik dili** olur; site ve panelde tam yer alır.
2. **Reklam alanları**: sabit reklam yerleri, her yerde 1–20 reklam, sırayla dönme süresi ayarlanır,
   yalnızca yönetici rolü görür.
3. **Kur şeridi**: gram, çeyrek, yarım, tam altın + euro, dolar, sterlin (TL karşılığı), 30 dakikada bir güncel.
4. **Canlı yayın**: YouTube yayınını gösteren "Canlı" sayfası; yönetici veya editör yayını açar.
5. **Duyuru türleri**: Düğün ve Özel gün eklenir.
6. **Arşive katkı formu**: ziyaretçi dosya ve bilgi gönderir; editör onaylamadan hiçbir şey yayınlanmaz.

## Hedef dışı

- Sohbet / chat sayfası (kullanıcı açıkça istemedi).
- Sunucu, Docker/Coolify, PostgreSQL geçişi, alan adı, e-posta (SMTP) kurulumu.
- Zazaca için otomatik çeviri (Microsoft Translator Zazacayı desteklemiyor).
- Reklam satışı / ödeme, tıklama ücreti hesabı.

## Başarısızlık sayılacaklar (anti-hedefler)

- Ziyaretçi formundan gelen herhangi bir şeyin editör onayı olmadan sitede görünmesi.
- Reklam bölümünün editör veya yazar menüsünde, panel ana sayfasında ya da API'de onlara açık olması.
- Kur kaynağı çöktüğünde şeridin hata vermesi ya da sayfanın yavaşlaması.
- Zazaca içeriği olmayan sayfaların boş görünmesi (Türkçeye düşmeli).
- Mevcut maket modunun (Vercel, `DEMO`) bozulması.
- "Yapay zeka yapmış" görünen tasarım; mevcut site diliyle uyumsuz yeni ekranlar.

## Kısıtlar

- Mevcut yapı korunur: roller (`admin`, `editor`, `author`), `contentAccess`, `authorsCannotPublish`,
  `versions.drafts`, `src/translate` (Microsoft Translator), `DEMO` maket modu.
- Next.js 16'nın sürüme özgü kuralları: kod yazmadan önce `web/node_modules/next/dist/docs/` okunur (web/AGENTS.md).
- Veritabanı şimdilik SQLite. Şema değişiklikleri PostgreSQL'e taşınabilir kalmalı (adaptöre özel SQL yok).
- Ek ücretli servis yok. Kur verisi ücretsiz kaynaktan.
- Her yeni ekran açık/koyu temada kontrast kontrolünden geçer, geçiş/hover animasyonu olur.

## Yaklaşımlar

Altyapı için üç yol konuşuldu: (1) Hetzner + Coolify + PostgreSQL, (2) aynı sunucuda SQLite, (3) Vercel + Neon
+ Blob. Kullanıcı kararı: **şimdilik yalnızca kod; yayın kısmı sonra.** Bu yüzden kod mevcut SQLite ile çalışacak,
altyapıya bağımlı olmayacak (önerilen 1. yol sonradan uygulanabilir). 3. yol ticari kullanım (reklam) nedeniyle
Vercel Pro gerektirdiği ve bütçeyi aştığı için elendi.

Özellikler mevcut Next.js + Payload uygulamasının içinde, Payload koleksiyonları/globalleri olarak yapılır.
Ayrı servis ya da ayrı uygulama kurulmaz.

## Ayrıntılar

### 1. Zazaca

- Dil kodu: `zza`, etiketi "Kirmanckî (Zazaki)". `LOCALES`, `payload.config.ts` `localization.locales`,
  `proxy.ts` `LANGS`, dil seçici ve `ui-dict.json`'a eklenir. Fallback Türkçe.
- Panel arayüzü Zazaca değil (Payload'da çeviri yok); yalnızca içerik dili.
- Otomatik çeviri `zza`'yı atlar (`TARGETS`'a eklenmez). Editör Zazaca metni elle girer.
- Panelde Zazaca eksikliği görünür: mevcut `TranslationStatus` bileşeni Zazaca için "elle girilecek / girildi"
  durumunu gösterir. İçerik listelerinde filtrelenebilir "Zazaca eksik" bilgisi (builder'a bırakılan biçim).
- Menü/düğme metinlerinin Zazaca taslağı yazılır ve dosyada "Zazaca bilen biri kontrol etmeli" notu bırakılır.
- Tarih biçimi: Zazaca ay adları elle tanımlanır (Kurmancî için yapılan gibi).

### 2. Reklam alanları

- Yeni koleksiyon `ad-slots` (Reklam yerleri). Sabit yerler (seed ile oluşur): **üst bant** (header altı,
  geniş), **haberlerin arası** (ana sayfa ve liste sayfalarında), **haber sayfası yanı** (detay sayfası kenar).
- Her reklam yeri: ad, konum anahtarı (değişmez), açık/kapalı, dönme süresi (saniye, 3–60, varsayılan 8),
  reklamlar dizisi (`maxRows: 20`).
- Her reklam: görsel (masaüstü, isteğe bağlı mobil), bağlantı, reklam veren adı, başlangıç ve bitiş tarihi
  (isteğe bağlı), etkin kutusu. Tarihi dışındaki reklam gösterilmez.
- Tek reklam varsa sabit durur; birden fazlaysa sırayla, yumuşak geçişle döner. Fare üstündeyken durur.
  Görsel "Reklam" etiketi taşır. Bağlantılar `rel="sponsored noopener"`, yeni sekmede.
- Erişim: `ad-slots` okuma/yazma **yalnızca `admin`** (API dahil). Site reklamları sunucu tarafında
  `overrideAccess` ile okur ve yalnızca yayındaki reklamları sayfaya koyar. Panel menüsünde
  `admin.hidden: onlyAdminSees`. *(Builder check sonrası karar.)*
- Reklam görselleri `media`'ya değil, ayrı `ad-images` yükleme koleksiyonuna gider: dosyalar herkese açık
  (sitede görünmeleri için), koleksiyon paneli yalnızca yöneticiye görünür, yazma yalnızca `admin`.
- Hiç etkin reklam yoksa yer görünmez (boş kutu kalmaz).

### 3. Kur şeridi

- Kalemler: gram altın, çeyrek, yarım, tam altın; EUR, USD, GBP — hepsi TL karşılığı. Değişim oku (↑/↓).
- Güncelleme: 30 dakikada bir. Sunucu tarafında önbellek (Next.js cache / revalidate 1800 sn); ziyaretçi
  isteği kaynağa doğrudan gitmez.
- Kaynak: ücretsiz piyasa verisi (resmî değil). Kaynağa bağlanan kod tek bir dosyada adaptör olarak durur;
  kaynak değişirse yalnızca o dosya değişir. (Kaynak seçimi builder'ın; öneri: Truncgil Finans JSON.)
- Kaynak hata verirse son başarılı veri "son güncelleme saati" ile gösterilir; hiç veri yoksa şerit gizlenir.
- Konum: mevcut "Son dakika" şeridinin üstünde ayrı ince şerit, yatay kayan; hareket azaltma tercihinde durur.
- Panelde (yönetici, `site-settings` ya da yeni global): şeridi aç/kapat, hangi kalemlerin görüneceği.

### 4. Canlı yayın

- Yeni global `live` (Canlı yayın): yayında mı (aç/kapat), YouTube bağlantısı, başlık (yerelleştirilmiş),
  kısa açıklama, sıradaki yayın tarihi ve başlığı.
- Düzenleme yetkisi: `admin` ve `editor`. Yazar göremez.
- Site: `/[lang]/canli` sayfası. Yayındayken YouTube gömülü oynatıcı; değilken sıradaki yayın + geçmiş yayın
  kayıtları (arşivdeki video türündeki kayıtlar ya da globale eklenen bağlantı listesi — builder'ın kararı).
- Yayındayken menüde kırmızı yanıp sönen "CANLI" işareti ve ana sayfanın üstünde yayın kutusu.
- YouTube bağlantısı her biçimden (watch, youtu.be, live/) kimliğe çevrilir (`youTubeId` zaten var).

### 5. Duyuru türleri

- `Announcements.type`'a eklenir: **Düğün** (`dugun`), **Özel gün** (`ozel-gun`).
- Düğün grubu: gelin ve damat adları, aileler, köy (ilişki), tarih-saat, yer, davet metni.
- Özel gün grubu: tür (nişan, kına, sünnet, doğum, mezuniyet, diğer), kişi adı, tarih-saat, yer.
- Duyuru listesi ve detay sayfası yeni türleri kendi rozet rengi ve bilgi kartıyla gösterir; etiketler 7 dilde.

### 6. Arşive katkı formu

- Site: `/[lang]/arsive-katki` sayfası; mevcut "Arşive katkı ver" bağlantıları buraya gider (`#katki` değişir).
- Alanlar: ad soyad (zorunlu), telefon veya e-posta (en az biri zorunlu), köy (listeden, isteğe bağlı),
  içerik türü (fotoğraf, ses, video, belge, diğer), yaklaşık yıl, açıklama (zorunlu), dosyalar, video/drive
  bağlantısı, yayın izni onay kutusu (zorunlu).
- Dosyalar: en fazla 10 dosya, her biri en fazla 50 MB; izinli türler resim, ses, video, PDF.
- Koruma: Cloudflare Turnstile (anahtar yoksa geliştirmede atlanır) + gizli bal tuzağı alanı + IP başına
  hız sınırı (ör. saatte 5 gönderim). Sunucu tarafında tür ve boyut tekrar denetlenir.
- Kayıt: yeni koleksiyon `submissions` (Gelen katkılar). Ziyaretçi dosyaları ayrı ve **herkese kapalı**
  bir yükleme koleksiyonuna (`submission-files`) gider; `media` ile karışmaz, onaysız dosya URL'si dışarı açılmaz.
- Panel: "Gelen katkılar" bölümü editör ve yöneticiye görünür (yazara görünmez). Durum: yeni / inceleniyor /
  arşive aktarıldı / reddedildi; editör notu. Menüde yeni gönderi sayacı.
- "Arşive aktar" düğmesi: gönderiden **tek bir taslak** arşiv kaydı oluşturur (tür = gönderenin seçtiği
  tür; "diğer" ise belge; tüm dosyalar o kayda), dosyaları `media`'ya kopyalar,
  bağışlayan ve yayın izni alanlarını doldurur. Yayınlamak yine editörün işidir.
- Gönderen başarılı gönderimde teşekkür ekranı görür; e-posta bildirimi bu turda yok.
- Kişisel veri: gönderen bilgileri yalnızca panelde görünür, sitede asla yayınlanmaz.

## Genel

- Tüm yeni site metinleri 7 dilde `ui-dict.json`'a eklenir (Zazaca taslak).
- `DEMO` maket modunda form ve yazma işlemleri kapalıdır; form sayfası "maket sürümünde kapalı" der.
- Menüde "Canlı" sekmesi her zaman görünür; yayındayken kırmızı işaret yanar.
- Maket veritabanı bu turda yeniden üretilir; `make-demo-db.mjs` gönderileri ve gönderi dosyalarını kopyadan
  siler. Makette örnek reklam, canlı yayın sayfası (yayında değil) ve kur şeridi görünür.
- Seed: reklam yerleri, örnek reklam, canlı yayın globali ve yeni duyuru türleri için örnek veri.
- `npm run build` ve lint temiz geçer; yeni Payload şeması için tipler (`generate:types`) ve importMap yenilenir.

## Builder'a bırakılanlar

Kod dosyalarının yerleşimi, bileşen yapısı, animasyon ayrıntıları, kur kaynağının kesin seçimi, geçmiş yayınların
nereden listeleneceği, "Zazaca eksik" bilgisinin paneldeki biçimi, hız sınırı uygulaması.
