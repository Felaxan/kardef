/*
  Örnek içerik yükleyici
  Kullanım: npm run seed
  Boş bir veritabanına deneme hesaplarını ve prototipteki örnek içerikleri ekler.
  Veritabanında haber varsa hiçbir şey yapmaz.
*/
import 'dotenv/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { getPayload } from 'payload'
import config from '../payload.config'
import { enrich } from './enrich'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const photos = path.resolve(dirname, '../../../assets/photos')
const brand = path.resolve(dirname, '../../public/brand')

/** Düz paragraflardan Lexical zengin metin oluşturur. */
const rich = (...paragraphs: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      textStyle: '',
      children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    })),
  },
})

const daysAgo = (n: number, h = 10) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(h, 0, 0, 0)
  return d.toISOString()
}
const at = (iso: string) => new Date(iso).toISOString()

const payload = await getPayload({ config })

const existing = await payload.count({ collection: 'posts' })
if (existing.totalDocs > 0) {
  payload.logger.info('Veritabanında zaten içerik var, örnek içerik yüklenmedi.')
  process.exit(0)
}

/* ---------- Kullanıcılar ---------- */
const env = (k: string) => {
  const v = process.env[k]
  if (!v) throw new Error(`.env dosyasında ${k} yok`)
  return v
}
const admin = await payload.create({
  collection: 'users',
  data: { name: 'Deneme Yönetici', email: env('SEED_ADMIN_EMAIL'), password: env('SEED_ADMIN_PASSWORD'), role: 'admin', kurum: 'kardef' },
})
await payload.create({
  collection: 'users',
  data: { name: 'Deneme Editör', email: env('SEED_EDITOR_EMAIL'), password: env('SEED_EDITOR_PASSWORD'), role: 'editor', kurum: 'avkardep' },
})
const author = await payload.create({
  collection: 'users',
  data: { name: 'Deneme Yazar', email: env('SEED_AUTHOR_EMAIL'), password: env('SEED_AUTHOR_PASSWORD'), role: 'author', kurum: 'kardef' },
})
payload.logger.info('3 deneme hesabı oluşturuldu')

/* ---------- Medya ---------- */
type MediaInput = { file: string; dir?: string; alt: string; credit?: string; license?: 'izinli' | 'kurum' | 'cc-by' | 'cc-by-sa' | 'cc0' }
const upload = async (m: MediaInput) =>
  (
    await payload.create({
      collection: 'media',
      data: { alt: m.alt, credit: m.credit, license: m.license ?? 'izinli' },
      filePath: path.join(m.dir ?? photos, m.file),
    })
  ).id

const img = {
  saatKulesi: await upload({ file: 'karakocan-genel.jpg', alt: 'Karakoçan ilçe merkezindeki saat kulesi', credit: 'LoqaT, Wikimedia Commons', license: 'cc-by-sa' }),
  yesilbelen: await upload({ file: 'yesilbelen.jpg', alt: 'Yeşilbelen köyüne giden asfalt yol', credit: 'Sabri Zurel, Wikimedia Commons', license: 'cc0' }),
  alikan: await upload({ file: 'alikan.jpg', alt: 'Karla kaplı tepelerden köye inen yol', credit: 'Veyis Polat, Wikimedia Commons', license: 'cc-by' }),
  otogar: await upload({ file: 'otogar.jpg', alt: 'Karakoçan otogarı ve yolcu otobüsleri', credit: 'KureCewlik81, Wikimedia Commons', license: 'cc-by-sa' }),
  yol: await upload({ file: 'uzun-ince-yol.jpg', alt: 'Karla kaplı, kıvrılarak uzanan köy yolu', credit: 'Veyis Polat, Wikimedia Commons', license: 'cc-by' }),
  kule2: await upload({ file: 'saat-kulesi.jpg', alt: 'Karakoçan saat kulesi', credit: 'KureCewlik81, Wikimedia Commons', license: 'cc-by-sa' }),
  bahar: await upload({ file: 'bahar.jpg', alt: 'Karlı, ormanlık tepeler', credit: 'Veyis Polat, Wikimedia Commons', license: 'cc-by' }),
  delikan: await upload({ file: 'delikan.jpg', alt: 'Karla kaplı tarlalar ve eski çitler', credit: 'Veyis Polat, Wikimedia Commons', license: 'cc-by' }),
  logoKardef: await upload({ file: 'kar-def-logo.png', dir: brand, alt: 'KAR-DEF logosu', license: 'kurum' }),
  logoAv: await upload({ file: 'av-kardep-logo.png', dir: brand, alt: 'AV-KARDEP logosu', license: 'kurum' }),
}
payload.logger.info('Fotoğraflar yüklendi')

/* ---------- Kurumlar ---------- */
await payload.create({
  collection: 'organizations',
  data: {
    abbr: 'KAR-DEF', name: 'Elazığ Karakoçan Dernekleri Federasyonu', logo: img.logoKardef, founded: 2010, base: 'Elazığ', color: 'kirmizi',
    description: "Karakoçan'ın derneklerini tek çatı altında buluşturan federasyon. Dayanışma, eğitim ve kültürel mirasın korunması için çalışıyor.",
  },
})
await payload.create({
  collection: 'organizations',
  data: {
    abbr: 'AV-KARDEP', name: 'Avrupa Karakoçan DEP Dayanışma Platformu', logo: img.logoAv, founded: 2023, base: 'Avrupa', color: 'mor',
    description: "Avrupa'da yaşayan Karakoçanlıları bir araya getiren dayanışma platformu. Gurbetle memleket arasındaki bağı güçlendiriyor.",
  },
})

/* ---------- Kategoriler ---------- */
const cat: Record<string, number> = {}
for (const [name, color] of [
  ['Federasyon', 'kirmizi'], ['Köyler', 'kirmizi'], ['Dayanışma', 'mor'], ['Sözlü Tarih', 'kirmizi'],
  ['Gurbet', 'mor'], ['Eğitim', 'kirmizi'], ['Karakoçan', 'kirmizi'], ['Doğa', 'gri'],
] as const) {
  cat[name] = (await payload.create({ collection: 'categories', data: { name, color } })).id
}

/* ---------- Köyler ---------- */
const yesilbelen = await payload.create({
  collection: 'villages',
  data: {
    name: 'Yeşilbelen', type: 'koy', coverImage: img.yesilbelen,
    history: rich('Köyün tarihçesi henüz eklenmedi. Köyden hemşehrilerimizin bildikleri ve fotoğrafları ile bu sayfa büyüyecek.'),
  },
})
await payload.create({
  collection: 'villages',
  data: { name: 'Alabalık', type: 'koy', history: rich('Köyün tarihçesi henüz eklenmedi.') },
})

/* ---------- Haberler ---------- */
// Örnek veriler serbest biçimli olduğu için tür denetimi burada gevşek tutuldu.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loose = (o: unknown) => o as any
const post = async (d: Record<string, unknown>, status: 'published' | 'draft' = 'published') =>
  payload.create(loose({ collection: 'posts', data: { ...d, _status: status, createdBy: admin.id }, draft: status === 'draft' }))

const p1 = await post({
  title: "Federasyon genel kurulu 22 Kasım'da Karakoçan'da toplanıyor",
  excerpt: 'Yeni dönem yönetimi seçilecek, burs ve kış yardımı programları oylanacak. Delege kayıtları 15 Kasım\'da kapanıyor.',
  heroImage: img.saatKulesi, category: cat['Federasyon'], bolge: 'karakocan', kurum: 'kardef',
  featured: true, breaking: true, publishedAt: daysAgo(1, 14),
  content: rich(
    'Elazığ Karakoçan Dernekleri Federasyonu olağan genel kurulu 22 Kasım Pazar günü saat 10.30\'da Karakoçan\'da yapılacak.',
    'Genel kurulda yeni dönem yönetim kurulu seçilecek; burs ve kış yardımı programlarının bütçesi oylanacak.',
    'Delegelerin kayıt için belgelerini 15 Kasım\'a kadar federasyona iletmesi gerekiyor.',
  ),
})
await post({
  title: 'Köy rehberi yayında: her köyün kendi sayfası olacak',
  excerpt: 'Tarihçe, fotoğraflar ve gurbetteki aileler tek sayfada. İlk sayfa Yeşilbelen için açıldı.',
  heroImage: img.yesilbelen, category: cat['Köyler'], bolge: 'karakocan', kurum: 'kardef', village: yesilbelen.id,
  featured: true, publishedAt: daysAgo(2),
  content: rich('Sitenin köy rehberinde her köy ve mahalle için ayrı bir sayfa açılıyor.', 'Köyünüzle ilgili bilgi ve fotoğrafları federasyona iletebilirsiniz.'),
})
await post({
  title: "Kış yardımı kampanyası başlıyor: Avrupa'dan ortak destek",
  excerpt: "AV-KARDEP'e bağlı dernekler, yakacak ve gıda yardımının köylere aralık başında ulaştırılması için birlikte çalışıyor.",
  heroImage: img.alikan, category: cat['Dayanışma'], bolge: 'avrupa', kurum: 'avkardep',
  featured: true, publishedAt: daysAgo(3),
  content: rich('Kampanyaya katılmak isteyenler bağış hesaplarını duyurular bölümünde bulabilir.'),
})
await post({
  title: 'Gurbete ilk gidenler anlatıyor: 40 görüşme arşivde',
  excerpt: 'Gönüllü ekip yaz boyunca köylerde büyüklerimizle göç yıllarını, düğün geleneklerini ve eski köy hayatını konuştu.',
  heroImage: img.otogar, category: cat['Sözlü Tarih'], bolge: 'genel', kurum: 'ortak',
  featured: true, publishedAt: daysAgo(4),
  content: rich('Kayıtlar deşifre edilerek arşivin sözlü tarih bölümüne ekleniyor.'),
})
await post({
  title: 'Köy yollarında kış hazırlığı için ortak çağrı',
  excerpt: 'Muhtarlar ve dernekler, karla kapanan yolların hızlı açılması için birlikte başvuru yapıyor.',
  heroImage: img.yol, category: cat['Köyler'], bolge: 'karakocan', kurum: 'kardef', breaking: true, publishedAt: daysAgo(2, 9),
  content: rich('Başvuru metni muhtarlıklara iletildi.'),
})
await post({
  title: 'İlçe merkezinde hemşehri buluşması yapıldı',
  excerpt: 'Yaz boyunca memlekete gelen gurbetçi aileler saat kulesi meydanında bir araya geldi.',
  heroImage: img.kule2, category: cat['Karakoçan'], bolge: 'karakocan', kurum: 'ortak', publishedAt: daysAgo(5),
  content: rich('Buluşmaya yüzlerce hemşehrimiz katıldı.'),
})
await post({
  title: 'Karakoçan dağlarında kış yürüyüşü rotaları',
  excerpt: 'Gençlik kolunun hazırladığı rehber, köyler arası eski patikaları yeniden tanıtıyor.',
  heroImage: img.bahar, category: cat['Doğa'], bolge: 'karakocan', kurum: 'kardef', publishedAt: daysAgo(7),
  content: rich('Rehber yakında PDF olarak paylaşılacak.'),
})
await post({
  title: '2026–2027 dönemi burs başvuruları açıldı; son gün 30 Kasım',
  excerpt: 'Üniversite ve lise öğrencileri başvurularını çevrim içi yapabilecek. Sonuçlar aralık sonunda açıklanacak.',
  category: cat['Eğitim'], bolge: 'genel', kurum: 'kardef', breaking: true, publishedAt: daysAgo(3, 9),
  content: rich('Başvuru koşulları ve gerekli belgeler duyurular bölümünde yer alıyor.'),
})
// Yazarın taslağı: editörün onayını bekliyor
await payload.create({
  collection: 'posts',
  draft: true,
  data: {
    title: 'Köln memleket akşamı için kayıtlar başladı', excerpt: 'Müzik, yemek ve sohbetle dolu bir akşam.',
    category: cat['Gurbet'], bolge: 'avrupa', kurum: 'avkardep', authorName: 'Deneme Yazar', createdBy: author.id, _status: 'draft',
  },
})

// Çeviri örneği: ilk haberin İngilizce ve Almanca başlığı
await payload.update({
  collection: 'posts', id: p1.id, locale: 'en',
  data: { title: 'Federation general assembly meets in Karakoçan on 22 November', excerpt: 'A new board will be elected and the scholarship and winter aid programmes will be voted on.' },
})
await payload.update({
  collection: 'posts', id: p1.id, locale: 'de',
  data: { title: 'Mitgliederversammlung des Verbands am 22. November in Karakoçan', excerpt: 'Ein neuer Vorstand wird gewählt; über Stipendien und Winterhilfe wird abgestimmt.' },
})
payload.logger.info('Haberler eklendi')

/* ---------- Etkinlikler ---------- */
const ev = (d: Record<string, unknown>) => payload.create(loose({ collection: 'events', data: { ...d, _status: 'published', createdBy: admin.id } }))
await ev({ title: 'Kış yardımı kampanyası başlıyor', startDate: at('2026-11-07T10:00:00+03:00'), region: 'karakocan', place: 'Karakoçan merkez', kurum: 'kardef' })
await ev({ title: 'Memleket akşamı: müzik, yemek, sohbet', startDate: at('2026-11-14T18:30:00+01:00'), region: 'avrupa', place: 'Köln', kurum: 'avkardep', registration: { required: true, link: '+49 000 000 00 00' } })
await ev({ title: 'Federasyon olağan genel kurulu', startDate: at('2026-11-22T10:30:00+03:00'), region: 'karakocan', place: 'Karakoçan', kurum: 'kardef' })
await ev({ title: 'Atölye: aile fotoğraflarını dijitale aktarma', startDate: at('2026-12-05T20:00:00+03:00'), region: 'online', place: 'Çevrim içi', onlineLink: 'https://example.org/atolye', kurum: 'ortak' })

/* ---------- Duyurular ---------- */
const an = (d: Record<string, unknown>) => payload.create(loose({ collection: 'announcements', data: { ...d, _status: 'published', createdBy: admin.id } }))
await an({
  type: 'vefat', title: 'Hemşehrimizin vefatı: cenaze ve taziye bilgileri', publishedAt: daysAgo(1),
  vefat: { name: 'Örnek Ad Soyad', village: yesilbelen.id, date: daysAgo(1), funeralPlace: 'Köy mezarlığı', condolence: 'Taziyeler köy evinde üç gün kabul edilecektir.' },
  content: rich('Merhuma Allah\'tan rahmet, ailesine ve yakınlarına başsağlığı dileriz.'), kurum: 'kardef',
})
await an({ type: 'burs', title: "Burs başvuruları 30 Kasım'a kadar açık", publishedAt: daysAgo(3), burs: { deadline: at('2026-11-30T23:59:00+03:00'), applyLink: 'https://example.org/burs' }, pinned: true, kurum: 'kardef' })
await an({ type: 'toplanti', title: 'Yönetim kurulu kararları yayımlandı', publishedAt: daysAgo(5), kurum: 'kardef' })
await an({ type: 'yardim', title: 'Kış yardımı için bağış hesapları', publishedAt: daysAgo(7), kurum: 'avkardep' })
await an({ type: 'uyelik', title: 'Üyelik bilgilerinin güncellenmesi hakkında', publishedAt: daysAgo(12), kurum: 'ortak' })

/* ---------- Arşiv ---------- */
const ar = (d: Record<string, unknown>) => payload.create(loose({ collection: 'archive', data: { permission: true, ...d, _status: 'published', createdBy: admin.id } }))
await ar({ title: "Almanya'dan köye gönderilen ilk mektuplar", type: 'document', year: 1964, donor: 'Aile arşivi', featuredOnHome: true })
await ar({ title: 'Köy ilkokulundan bir karne ve diploma', type: 'document', year: 1972, donor: 'Bir hemşehrimiz', featuredOnHome: true })
await ar({ title: 'Bölge gazetesinde Karakoçan haberi', type: 'clipping', year: 1986, donor: 'Gazete arşivi', featuredOnHome: true })
await ar({ title: 'Kasetten aktarılan ninniler ve ağıtlar', type: 'audio', year: 1994, donor: 'Kaset kaydı', featuredOnHome: true })
await ar({ title: 'Kışın köy tarlaları ve eski çitler', type: 'photo', year: 2012, approximate: true, files: [img.delikan], donor: 'Veyis Polat', featuredOnHome: true })
await ar({ title: 'Saat kulesi ve ilçe meydanı', type: 'photo', year: 2024, files: [img.saatKulesi], donor: 'LoqaT' })
await ar({ title: 'Gurbetten köye gönderilen bir mektup', type: 'document', year: 1971, month: '11', day: 1, donor: 'Aile arşivi' })
await ar({ title: 'Gurbete ilk gidenler anlatıyor', type: 'oral', year: 2026, videoUrl: '', transcript: rich('Deşifre çalışması sürüyor.') })

/* ---------- Ayarlar ---------- */
await payload.updateGlobal({
  slug: 'homepage',
  data: {
    notice: { enabled: true, text: 'Federasyon olağan genel kurulu 22 Kasım Pazar günü yapılacak. Delege kayıtları 15 Kasım\'a kadar açık.' },
    tickerExtra: [{ text: 'Arşive bu hafta 26 yeni fotoğraf eklendi' }],
    heroSeconds: 7,
  },
})
await payload.updateGlobal({
  slug: 'site-settings',
  data: { siteName: 'KAR-DEF', tagline: 'Haber ve Arşiv Platformu', footerNote: "KAR-DEF ve AV-KARDEP'in ortak dijital yayınıdır. Gönüllüler tarafından hazırlanır." },
})

await enrich(payload)
payload.logger.info('Örnek içerikler yüklendi. Panel: http://localhost:3000/admin')
process.exit(0)
