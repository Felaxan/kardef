# KAR-DEF Haber ve Arşiv Platformu

Next.js 16 + Payload CMS 3.91. Site ve yönetim paneli aynı uygulamada.

## Çalıştırma

```bash
npm install
cp .env.example .env      # PAYLOAD_SECRET ve deneme şifrelerini doldurun
npm run seed              # boş veritabanına örnek içerik + 3 deneme hesabı
npm run dev               # http://localhost:3000  ·  panel: /admin
```

Deneme hesaplarının e-posta ve şifreleri `.env` dosyasındadır (`SEED_*`).
Örnek kayıtların boş açıklamalarını doldurmak için: `npm run seed:enrich` (dolu alanlara dokunmaz).

## Site sayfaları

Her sayfa 6 dilde (`/tr`, `/ku`, `/en`, `/de`, `/nl`, `/fr`), açık/koyu temada ve telefonda çalışır.

| Adres | Ne gösterir |
|---|---|
| `/{dil}` | Ana sayfa: manşet, gündem, etkinlik takvimi, arşiv, duyurular, köyler, kurumlar |
| `/{dil}/haber/{adres}` | Haber: kelime kelime açılan başlık, kapak, okuma süresi, paylaş, ilgili haberler |
| `/{dil}/etkinlik/{adres}` | Etkinlik: takvim yaprağı, geri sayım, harita bağlantısı, kayıt, **takvime ekle (.ics)**, yaklaşan etkinlikler |
| `/{dil}/duyuru/{adres}` | Duyuru: türüne göre kart (vefat kartı, burs için son başvuru sayacı, toplantı tarihi), diğer duyurular |
| `/{dil}/arsiv/{adres}` | Arşiv kaydı: sergi alanı (fotoğraf, ses oynatıcı, video), künye, arşiv zaman çizelgesi, yakın dönem kayıtları |
| `/{dil}/koy/{adres}` | Köy: tam ekran kapak, sayaçlar, tarihçe, köyün arşiv şeridi, köyden haberler |
| `/{dil}/koyler` | Köy rehberi: yazdıkça süzülen liste, harf dizini |
| `/{dil}/ara?q=…` | Arama: türe göre sekmeler ve sayıları, aranan kelime vurgulu |

Bulunamayan adresler, adresteki dile göre çevrilmiş bir 404 sayfası gösterir.
Ziyaretçiler yalnızca **yayınlanmış** içerikleri görür; taslaklar sitede çıkmaz.

## Roller

| Rol | Ne yapabilir |
|---|---|
| Yönetici | Her şey: kullanıcılar, kurumlar, site ayarları |
| Editör | Tüm içerikleri düzenler, yayınlar, siler; ana sayfa ayarı ve kategoriler |
| Yazar | İçerik ekler, yalnızca kendi içeriğini düzenler; yayınlayamaz (editör onaylar) |

Editör ve yazar panele girdiğinde yönetim bölümlerini görmez.

## İçerik bölümleri

- **Haberler**: manşet ve son dakika işaretleri, kategori, bölge, köy bağlantısı
- **Etkinlikler**: Karakoçan / Avrupa / çevrim içi, kayıt bilgisi
- **Duyurular**: türüne göre açılan alanlar (vefat, burs, toplantı)
- **Arşiv**: yıl → dönem otomatik, "Bu gün geçmişte" için gün/ay, yayın izni zorunlu
- **Köyler**, **Medya**, **Kategoriler**, **Kurumlar**
- **Ayarlar**: Ana sayfa (duyuru bandı, ek son dakika satırları), Site ayarları

İçerik dilleri: Türkçe (varsayılan), Kurdî, English, Deutsch, Nederlands, Français.
Çevrilmeyen dil Türkçe gösterilir.

## Otomatik çeviri (Microsoft Translator, ücretsiz)

Türkçe içerik **yayınlanınca** başlık, özet ve metin birkaç saniye içinde Kurdî (Kurmancî), English,
Deutsch, Nederlands ve Français'ye çevrilip kaydedilir. Kod: `src/translate/`.

- **Ücretsiz paket (F0):** ayda 2 milyon karakter (yaklaşık 150 haberin 5 dile çevrisi). Kota dolunca
  çeviri o ay durur, ücret çıkmaz.
- **Elle düzeltme korunur:** bir dilde metni elle değiştirirseniz o dil bir daha ezilmez. Kenar çubuğundaki
  "Çevirileri yenile" kutusu işaretlenip kaydedilirse bütün diller yeniden çevrilir.
- **Karakter harcamaz:** Türkçe metin değişmediyse tekrar çevrilmez. Taslaklar çevrilmez.
- **Çevrilmeyen adlar:** KAR-DEF, AV-KARDEP, Karakoçan, Elazığ ve bütün köy adları (`src/translate/config.ts`).
- **Sitede not:** otomatik çevrilen sayfalarda "Bu metin Türkçeden otomatik olarak çevrildi · Türkçe aslı" yazar;
  elle düzeltilen dilde bu not kalkar.
- **Kurmancî:** makine çevirisi bu dilde zayıftır; önemli içerikleri bir bilen kontrol etmelidir.

### Anahtarı almak (bir kez, derneğin hesabıyla)

1. [portal.azure.com](https://portal.azure.com) adresinde ücretsiz hesap açın (kimlik doğrulaması için kart
   istenir; F0 paketinde ücret alınmaz).
2. **Create a resource → Translator** seçin. *Region*: **West Europe**, *Pricing tier*: **Free F0**.
3. Oluşan kaynakta **Keys and Endpoint** sayfasından **KEY 1** ve **Location/Region** değerini kopyalayın.
4. `.env` dosyasına yazın ve sunucuyu yeniden başlatın:
   ```
   AZURE_TRANSLATOR_KEY=…
   AZURE_TRANSLATOR_REGION=westeurope
   ```
5. Var olan içeriği bir kez topluca çevirin: `npm run translate:all`

Anahtar yoksa çeviri kapalıdır; site ve panel normal çalışır. Maket modunda (Vercel) çeviri her zaman kapalıdır.

## Vercel maketi

Vercel'de site kendiliğinden **maket modunda** açılır: içerik `demo/` klasöründeki salt okunur
kopyadan gelir, yönetim paneli ve içerik yazma kapalıdır. Ortam değişkeni gerekmez.

- Vercel projesinde **Root Directory**: `web`
- Maket içeriğini yenilemek: yerelde içeriği düzenleyin, sonra `node scripts/make-demo-db.mjs`
  (kullanıcı e-posta ve şifreleri kopyada silinir), commit + push.
- Yerelde maketi denemek: `DEMO_MODE=1 npm run build` ve `DEMO_MODE=1 npm start`
- Vercel'de maketi kapatmak (gerçek veritabanına geçince): `DEMO_MODE=0`

## Sunucuya geçerken

- Veritabanı: `@payloadcms/db-sqlite` yerine `@payloadcms/db-postgres` (payload.config.ts'te tek satır).
- Medya: `media/` klasörü yedeklenmeli ya da S3/R2 depolama eklentisi kullanılmalı.
- E-posta: şifre sıfırlama için bir e-posta bağdaştırıcısı (ör. SMTP / Brevo) eklenmeli.
- Node.js 24.22+ kurulursa Payload 3.92'ye güncellenebilir.
