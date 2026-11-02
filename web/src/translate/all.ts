/*
  Var olan bütün yayınlanmış içeriği diğer dillere çevirir (ilk kurulumda bir kez).
  Kullanım: npm run translate:all
  Daha önce çevrilmiş ve Türkçesi değişmemiş kayıtlar atlanır; elle düzeltilmiş diller ezilmez.
*/
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { COLLECTION_FIELDS, GLOBAL_FIELDS, translatorEnabled } from './config'
import { translateTarget } from './run'

const payload = await getPayload({ config })
if (!translatorEnabled()) {
  payload.logger.error('Çeviri kapalı: .env dosyasında AZURE_TRANSLATOR_KEY tanımlı değil.')
  process.exit(1)
}

let done = 0, failed = 0
for (const slug of Object.keys(COLLECTION_FIELDS)) {
  const coll = payload.collections[slug as 'posts']?.config
  if (!coll) continue
  const { docs } = await payload.find({
    collection: slug as 'posts', limit: 5000, pagination: false, depth: 0, locale: 'tr', overrideAccess: true,
    where: coll.versions ? { _status: { equals: 'published' } } : undefined,
  })
  for (const d of docs) {
    try {
      const r = await translateTarget(payload, { collection: slug, id: d.id })
      if (r.translated.length) { done++; payload.logger.info(`${slug} #${d.id} → ${r.translated.join(', ')}`) }
    } catch (e) {
      failed++
      payload.logger.error(`${slug} #${d.id}: ${e instanceof Error ? e.message : e}`)
    }
  }
}
for (const slug of Object.keys(GLOBAL_FIELDS)) {
  try {
    const r = await translateTarget(payload, { global: slug })
    if (r.translated.length) { done++; payload.logger.info(`${slug} → ${r.translated.join(', ')}`) }
  } catch (e) {
    failed++
    payload.logger.error(`${slug}: ${e instanceof Error ? e.message : e}`)
  }
}
payload.logger.info(`Toplu çeviri bitti: ${done} kayıt çevrildi${failed ? `, ${failed} hata` : ''}.`)
process.exit(failed ? 1 : 0)
