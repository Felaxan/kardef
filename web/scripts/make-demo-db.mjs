// Yerel veritabanından maket kopyası üretir: demo/kardef-demo.db + demo/media
// Kullanıcıların e-posta ve şifre bilgileri ile ziyaretçi gönderileri kopyada silinir.
// Çalıştırma (web klasöründe): node scripts/make-demo-db.mjs
import { createClient } from '@libsql/client'
import fs from 'fs'
import path from 'path'

const root = process.cwd()
const src = path.join(root, 'kardef.db')
const outDir = path.join(root, 'demo')
const out = path.join(outDir, 'kardef-demo.db')

if (!fs.existsSync(src)) {
  console.error('kardef.db bulunamadı. Önce npm run seed çalıştırın.')
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })
fs.copyFileSync(src, out)

const db = createClient({ url: `file:${out}` })
await db.batch([
  `UPDATE users SET email = 'kullanici' || id || '@example.invalid', phone = NULL,
     salt = NULL, hash = NULL, reset_password_token = NULL, reset_password_expiration = NULL,
     reset_password_requested_at = NULL, login_attempts = 0, lock_until = NULL`,
  'DELETE FROM users_sessions',
  'DELETE FROM payload_preferences_rels',
  'DELETE FROM payload_preferences',
  'DELETE FROM payload_locked_documents_rels',
  'DELETE FROM payload_locked_documents',
  // Ziyaretçi gönderileri ve güvenlik kayıtları kişisel/hassas veri içerir: makete girmez
  'DELETE FROM submissions_rels',
  'DELETE FROM submissions',
  'DELETE FROM submission_files',
  'DELETE FROM security_logs',
])
await db.execute('VACUUM')
db.close()

// Medya ve reklam görselleri (ziyaretçi gönderileri klasörü kopyalanmaz)
for (const dir of ['media', 'ad-images']) {
  const from = path.join(root, dir)
  const to = path.join(outDir, dir)
  fs.rmSync(to, { recursive: true, force: true })
  if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true })
}

console.log('Maket hazır:', path.relative(root, out), '+ demo/media + demo/ad-images')
