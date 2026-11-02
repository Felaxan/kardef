// Yerel veritabanından maket kopyası üretir: demo/kardef-demo.db + demo/media
// Kullanıcıların e-posta ve şifre bilgileri kopyada silinir.
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
])
await db.execute('VACUUM')
db.close()

const mediaSrc = path.join(root, 'media')
const mediaOut = path.join(outDir, 'media')
fs.rmSync(mediaOut, { recursive: true, force: true })
if (fs.existsSync(mediaSrc)) fs.cpSync(mediaSrc, mediaOut, { recursive: true })

console.log('Maket hazır:', path.relative(root, out), '+', path.relative(root, mediaOut))
