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
