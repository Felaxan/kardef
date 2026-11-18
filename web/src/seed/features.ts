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

export async function seedFeatures(payload: Payload) {
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
