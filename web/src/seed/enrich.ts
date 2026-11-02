/*
  Örnek içeriği tamamlar: etkinlik, duyuru ve arşiv kayıtlarının boş kalan
  açıklamalarını doldurur. Yalnızca BOŞ alanlara yazar; elle girilmiş içeriğe dokunmaz.
  Kullanım: npm run seed:enrich  (npm run seed de sonunda bunu çalıştırır)
*/
import type { Payload } from 'payload'

const rich = (...paragraphs: string[]) => ({
  root: {
    type: 'root', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const,
    children: paragraphs.map((text) => ({
      type: 'paragraph', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const, textFormat: 0, textStyle: '',
      children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    })),
  },
})
const empty = (v: unknown) => !(v as { root?: { children?: { children?: { text?: string }[] }[] } } | null)?.root?.children
  ?.some((c) => (c.children ?? []).some((t) => (t.text ?? '').trim()))

type Patch = { slug: string; data: Record<string, unknown>; richFields: string[] }

const EVENTS: Patch[] = [
  {
    slug: 'kis-yardimi-kampanyasi-basliyor', richFields: ['description'],
    data: { description: rich(
      'Kampanyanın ilk gününde yakacak ve gıda kolileri köy muhtarlarıyla birlikte hazırlanan listeye göre dağıtıma çıkarılacak.',
      'Gönüllü olarak katılmak isteyenler sabah 10.00\'da Karakoçan merkezdeki federasyon binasında buluşabilir. Araç desteği verebilecek hemşehrilerimizin önceden haber vermesi rica olunur.',
    ) },
  },
  {
    slug: 'memleket-aksami-muzik-yemek-sohbet', richFields: ['description'],
    data: { description: rich(
      'AV-KARDEP\'e bağlı derneklerin birlikte düzenlediği memleket akşamında yöresel yemekler, canlı müzik ve sohbet olacak.',
      'Gecenin geliri kış yardımı kampanyasına aktarılacak. Salon kapasitesi sınırlı olduğu için katılmak isteyenlerin telefonla kayıt yaptırması gerekiyor.',
    ) },
  },
  {
    slug: 'federasyon-olagan-genel-kurulu', richFields: ['description'],
    data: { description: rich(
      'Gündemde yönetim ve denetim kurulu seçimleri, faaliyet raporu ile burs ve kış yardımı programlarının bütçesi yer alıyor.',
      'Delegelerin kimlik belgeleriyle birlikte saat 10.00\'dan itibaren kayıt masasına uğraması gerekiyor. Genel kurul üyelere açıktır; delege olmayan hemşehrilerimiz de izleyici olarak katılabilir.',
    ) },
  },
  {
    slug: 'atolye-aile-fotograflarini-dijitale-aktarma', richFields: ['description'],
    data: { description: rich(
      'Evdeki eski fotoğrafları telefonla ya da tarayıcıyla nasıl dijitale aktaracağınızı adım adım anlatacağız: ışık, kadraj, dosya adı ve fotoğrafın arkasındaki notların kaydı.',
      'Atölye sonunda arşive katkı formunun nasıl doldurulacağı da gösterilecek. Katılmak için bağlantıya tıklamanız yeterli.',
    ) },
  },
]

const NOTICES: Patch[] = [
  {
    slug: 'burs-basvurulari-30-kasim-a-kadar-acik', richFields: ['content'],
    data: { content: rich(
      'Karakoçan\'da ya da gurbette yaşayan, lise ve üniversitede okuyan öğrencilerimiz 2026–2027 dönemi burslarına başvurabilir.',
      'Başvuru için öğrenci belgesi, son dönem not dökümü ve kısa bir tanıtım yazısı gerekiyor. Sonuçlar aralık ayının son haftasında açıklanacak.',
    ) },
  },
  {
    slug: 'yonetim-kurulu-kararlari-yayimlandi', richFields: ['content'],
    data: {
      toplanti: { date: '2026-10-26T19:00:00+03:00', place: 'Federasyon merkezi, Karakoçan' },
      content: rich(
        'Yönetim kurulu ekim ayı toplantısında genel kurul tarihini, kış yardımı takvimini ve burs komisyonunu belirledi.',
        'Kararların tam metni üyelerimize e-posta ile gönderildi; derneklerimizde de incelenebilir.',
      ),
    },
  },
  {
    slug: 'kis-yardimi-icin-bagis-hesaplari', richFields: ['content'],
    data: { content: rich(
      'Kış yardımı kampanyasına destek olmak isteyenler bağışlarını derneklerimizin resmi hesaplarına yapabilir. Açıklama kısmına "Kış yardımı" yazmanız yeterli.',
      'Toplanan bağışlar ve dağıtım listesi kampanya bitiminde bu sayfada paylaşılacak.',
    ) },
  },
  {
    slug: 'uyelik-bilgilerinin-guncellenmesi-hakkinda', richFields: ['content'],
    data: { content: rich(
      'Üye kayıtlarımızı yeni sisteme taşıyoruz. Adres, telefon ya da e-posta bilginiz değiştiyse derneğinize bildirmenizi rica ederiz.',
      'Güncel bilgiler yalnızca duyuru ve genel kurul çağrıları için kullanılır, üçüncü kişilerle paylaşılmaz.',
    ) },
  },
]

const ARCHIVE: Patch[] = [
  {
    slug: 'almanya-dan-koye-gonderilen-ilk-mektuplar', richFields: ['description'],
    data: { location: 'Köln – Karakoçan', description: rich(
      'Altmışlı yılların ortasında Almanya\'ya çalışmaya giden ilk kuşağın köydeki ailelerine yazdığı mektuplar.',
      'Mektuplarda iş, yurt hayatı, gönderilen para ve köydeki işlerle ilgili sorular var. Aile, mektupların asıllarını korumak şartıyla taranmış kopyalarının yayımlanmasına izin verdi.',
    ) },
  },
  {
    slug: 'koy-ilkokulundan-bir-karne-ve-diploma', richFields: ['description'],
    data: { description: rich(
      'Köy ilkokulundan kalma bir karne ve ilkokul diploması. Belgelerdeki öğretmen imzaları ve okul mührü dönemin köy okullarına dair küçük bir iz bırakıyor.',
    ) },
  },
  {
    slug: 'bolge-gazetesinde-karakocan-haberi', richFields: ['description'],
    data: { description: rich(
      'Bölge gazetesinin seksenli yıllarda Karakoçan\'a ayırdığı bir haber kupürü. Kupür, bir okurun kitap arasında sakladığı nüshadan tarandı.',
    ) },
  },
  {
    slug: 'kasetten-aktarilan-ninniler-ve-agitlar', richFields: ['description'],
    data: { description: rich(
      'Bir ailenin evde kayda aldığı kasetten aktarılan ninniler ve ağıtlar. Kaydın bir bölümü bant yıpranması nedeniyle eksik.',
      'Ses dosyası temizlenip dijitale aktarıldıktan sonra bu sayfaya eklenecek. Kayıtta sesi geçen kişileri tanıyorsanız bize yazın.',
    ) },
  },
  {
    slug: 'kisin-koy-tarlalari-ve-eski-citler', richFields: ['description'],
    data: { description: rich(
      'Karla örtülü tarlalar ve köylerde hâlâ görülebilen eski ağaç çitler. Fotoğrafın çekildiği yıl kesin bilinmiyor; 2010\'ların başına ait olduğu düşünülüyor.',
    ) },
  },
  {
    slug: 'saat-kulesi-ve-ilce-meydani', richFields: ['description'],
    data: { location: 'Karakoçan merkez', description: rich(
      'İlçe meydanındaki saat kulesi ve çevresi. Meydanın bugünkü hâlini kayda geçirmek için arşive eklendi; eski fotoğraflarla karşılaştırmak isteyenler için iyi bir başlangıç.',
    ) },
  },
  {
    slug: 'gurbetten-koye-gonderilen-bir-mektup', richFields: ['description'],
    data: { description: rich(
      'Gurbetteki bir hemşehrimizin köydeki ailesine yazdığı mektup. Zarfın üzerindeki damga tarihi sayesinde mektubun hangi gün postalandığı biliniyor.',
    ) },
  },
  {
    slug: 'gurbete-ilk-gidenler-anlatiyor', richFields: ['description'],
    data: { description: rich(
      'Gönüllü ekibimizin yaz boyunca köylerde yaptığı sözlü tarih görüşmelerinden derlenen bir seçki: ilk gidişler, tren yolculukları, ilk mektuplar ve dönüşler.',
    ) },
  },
]

export async function enrich(payload: Payload) {
  let n = 0
  const apply = async (collection: 'events' | 'announcements' | 'archive', list: Patch[]) => {
    for (const p of list) {
      const { docs } = await payload.find({ collection, where: { slug: { equals: p.slug } }, limit: 1, depth: 0, locale: 'tr' })
      const doc = docs[0] as unknown as Record<string, unknown> | undefined
      if (!doc) continue
      const data: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(p.data)) {
        const cur = doc[k]
        const isEmpty = p.richFields.includes(k) ? empty(cur)
          : cur == null || cur === '' || (typeof cur === 'object' && Object.values(cur as object).every((x) => x == null || x === ''))
        if (isEmpty) data[k] = v
      }
      if (!Object.keys(data).length) continue
      // Adres değişmesin diye mevcut slug'ı açıkça gönder
      await payload.update({ collection, id: doc.id as number, data: { ...data, slug: p.slug } as never, locale: 'tr' })
      n++
    }
  }
  await apply('events', EVENTS)
  await apply('announcements', NOTICES)
  await apply('archive', ARCHIVE)
  payload.logger.info(`Örnek içerik tamamlandı: ${n} kayıt güncellendi`)
}
