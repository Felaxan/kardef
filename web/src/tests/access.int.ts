/*
  Erişim testleri (gerçek veritabanı ile). Kullanım: npm run test:int
  Geliştirme sunucusu kapalıyken çalıştırın (aynı SQLite dosyası).
*/
import 'dotenv/config'
import assert from 'node:assert/strict'
import { getPayload, type Payload } from 'payload'
import config from '../payload.config'

const payload: Payload = await getPayload({ config })
const results: [string, boolean, string?][] = []
async function check(name: string, fn: () => Promise<void>) {
  try { await fn(); results.push([name, true]) } catch (e) { results.push([name, false, (e as Error).message]) }
}
const userOf = async (role: 'admin' | 'editor' | 'author') => {
  const r = await payload.find({ collection: 'users', where: { role: { equals: role } }, limit: 1, depth: 0 })
  assert.ok(r.docs[0], `${role} rolünde kullanıcı yok (npm run seed)`)
  return { ...r.docs[0], collection: 'users' as const }
}
const forbidden = async (p: Promise<unknown>) => {
  await assert.rejects(p, (e: Error & { status?: number }) => e.status === 403 || /forbidden|not allowed|izin/i.test(e.message))
}

// --- Reklamlar yalnızca yöneticiye açık ---
for (const role of ['editor', 'author'] as const) {
  await check(`${role} reklam yerlerini okuyamaz`, async () => {
    await forbidden(payload.find({ collection: 'ad-slots', overrideAccess: false, user: await userOf(role) }))
  })
  await check(`${role} reklam yeri oluşturamaz`, async () => {
    await forbidden(payload.create({ collection: 'ad-slots', overrideAccess: false, user: await userOf(role), data: { name: 'x', key: 'top' } as never }))
  })
}
await check('ziyaretçi reklam yerlerini API ile okuyamaz', async () => {
  await forbidden(payload.find({ collection: 'ad-slots', overrideAccess: false }))
})
await check('yönetici reklam yerlerini okuyabilir', async () => {
  await payload.find({ collection: 'ad-slots', overrideAccess: false, user: await userOf('admin') })
})

for (const [name, ok, msg] of results) console.log(`${ok ? '✔' : '✖'} ${name}${msg ? ` — ${msg}` : ''}`)
const failed = results.filter((r) => !r[1]).length
console.log(`int: ${results.length - failed} geçti, ${failed} kaldı`)
process.exit(failed ? 1 : 0)
