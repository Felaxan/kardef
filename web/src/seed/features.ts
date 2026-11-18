/*
  Yayına hazırlık özelliklerinin örnek verileri: düğün ve özel gün duyuruları,
  reklam yerleri, canlı yayın. Var olanlara dokunmaz (slug/anahtar ile kontrol eder).
  Kullanım: npm run seed:features  (npm run seed de sonunda bunu çalıştırır)
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

const inDays = (n: number, hour = 18) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

async function exists(payload: Payload, collection: 'announcements', slug: string) {
  const r = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })
  return r.totalDocs > 0
}

/** Örnek reklam görseli: "Reklamınız burada" banner'ı (sharp ile üretilir) */
async function bannerPng(w: number, h: number, bg: string, line1: string, line2: string): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="${bg}"/>
    <g fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2">
      ${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 90 - 40} ${h} l${h / 2} -${h / 2} l${h / 2} ${h / 2}"/>`).join('')}
    </g>
    <text x="50%" y="${h / 2 - 6}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="800" font-size="${Math.round(Math.min(h / 4.2, w / 12))}" fill="#fff">${line1}</text>
    <text x="50%" y="${h / 2 + h / 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(Math.min(h / 9, w / 26))}" fill="rgba(255,255,255,.85)">${line2}</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function seedAds(payload: Payload) {
  const have = await payload.find({ collection: 'ad-slots', limit: 10, depth: 0, overrideAccess: true })
  if (have.totalDocs > 0) return
  const img = async (name: string, w: number, h: number, bg: string, l1: string, l2: string) =>
    payload.create({
      collection: 'ad-images',
      data: { alt: `${l1} — ${l2}` },
      file: { data: await bannerPng(w, h, bg, l1, l2), mimetype: 'image/png', name, size: 0 },
      overrideAccess: true,
    })
  const a = await img('ornek-reklam-1.png', 1600, 200, '#C8161D', 'Reklamınız burada', 'KAR-DEF sitesinde reklam için bize ulaşın')
  const b = await img('ornek-reklam-2.png', 1600, 200, '#5E2B8C', 'Avrupa\'daki hemşehrilerimize ulaşın', 'AV-KARDEP · reklam alanı')
  const side = await img('ornek-reklam-yan.png', 800, 1000, '#1f1f22', 'Reklam alanı', 'Haber sayfalarının yanında')
  await payload.create({
    collection: 'ad-slots', overrideAccess: true,
    data: {
      name: 'Üst bant', key: 'top', seconds: 6, enabled: true,
      ads: [
        { advertiser: 'Örnek reklam 1', image: a.id, link: '/tr/kurumlar', active: true },
        { advertiser: 'Örnek reklam 2', image: b.id, link: '/tr/kurumlar', active: true },
      ],
    },
  })
  await payload.create({ collection: 'ad-slots', overrideAccess: true, data: { name: 'Haberlerin arası', key: 'feed', seconds: 8, enabled: true, ads: [] } })
  await payload.create({
    collection: 'ad-slots', overrideAccess: true,
    data: { name: 'Haber sayfasının yanı', key: 'side', seconds: 8, enabled: true, ads: [{ advertiser: 'Örnek yan reklam', image: side.id, active: true }] },
  })
  payload.logger.info('Örnek reklam yerleri eklendi')
}

async function seedLive(payload: Payload) {
  const live = await payload.findGlobal({ slug: 'live', depth: 0 })
  if (live.next?.date || live.url) return
  await payload.updateGlobal({
    slug: 'live',
    data: { isLive: false, next: { date: inDays(4, 20), title: 'Federasyon genel kurulu canlı yayını' } },
  })
  payload.logger.info('Canlı yayın örneği eklendi')
}

export async function seedFeatures(payload: Payload) {
  await seedAds(payload)
  await seedLive(payload)

  const village = (await payload.find({ collection: 'villages', limit: 1, depth: 0 })).docs[0]

  if (!(await exists(payload, 'announcements', 'ayse-ile-mehmet-evleniyor'))) {
    await payload.create({
      collection: 'announcements',
      data: {
        type: 'dugun', title: 'Ayşe ile Mehmet evleniyor', slug: 'ayse-ile-mehmet-evleniyor', _status: 'published',
        publishedAt: new Date().toISOString(),
        dugun: {
          bride: 'Ayşe Yıldız', groom: 'Mehmet Demir', families: 'Yıldız ve Demir aileleri',
          date: inDays(12, 17), place: 'Karakoçan Kültür Merkezi düğün salonu', village: village?.id,
        },
        content: rich('Tüm hemşehrilerimiz davetlidir. Düğün yemeği saat 17.00\'de, halay 19.00\'da başlayacak.'),
      },
    })
    payload.logger.info('Örnek düğün duyurusu eklendi')
  }

  if (!(await exists(payload, 'announcements', 'yusufun-sunnet-dugunu'))) {
    await payload.create({
      collection: 'announcements',
      data: {
        type: 'ozel-gun', title: 'Yusuf\'un sünnet düğünü', slug: 'yusufun-sunnet-dugunu', _status: 'published',
        publishedAt: new Date().toISOString(),
        ozelGun: { kind: 'sunnet', person: 'Yusuf Kaya', date: inDays(20, 14), place: 'Köln, Merkez Camii salonu' },
        content: rich('Kaya ailesi, oğulları Yusuf\'un sünnet düğününe tüm dostlarını bekliyor.'),
      },
    })
    payload.logger.info('Örnek özel gün duyurusu eklendi')
  }
}
