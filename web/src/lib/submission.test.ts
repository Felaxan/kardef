import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRateLimiter, MAX_FILE_BYTES, MAX_FILES, validateSubmission } from './submission'

const ok = { name: 'Ali Veli', phone: '05551112233', email: '', description: '1972 düğününden fotoğraf', consent: 'on' }
const photo = { name: 'foto.jpg', type: 'image/jpeg', size: 2_000_000 }

test('geçerli gönderim kabul edilir', () => {
  assert.deepEqual(validateSubmission(ok, [photo]), { ok: true })
})

test('dosyasız ama bağlantılı gönderim kabul edilir', () => {
  assert.deepEqual(validateSubmission({ ...ok, link: 'https://youtu.be/x' }, []), { ok: true })
})

test('zorunlu alanlar eksikse hangi alan olduğu söylenir', () => {
  const r = validateSubmission({ ...ok, name: ' ', description: '', consent: '' }, [photo])
  assert.equal(r.ok, false)
  assert.deepEqual(!r.ok && [...r.errors].sort(), ['consent', 'description', 'name'])
})

test('telefon ve e-posta ikisi de boşsa iletişim hatası', () => {
  const r = validateSubmission({ ...ok, phone: '', email: '' }, [photo])
  assert.deepEqual(!r.ok && r.errors, ['contact'])
})

test('geçersiz e-posta iletişim hatası', () => {
  const r = validateSubmission({ ...ok, phone: '', email: 'ali@' }, [photo])
  assert.deepEqual(!r.ok && r.errors, ['contact'])
})

test('ne dosya ne bağlantı varsa hata', () => {
  const r = validateSubmission(ok, [])
  assert.deepEqual(!r.ok && r.errors, ['files.none'])
})

test('dosya sayısı, boyutu ve türü denetlenir', () => {
  const many = Array.from({ length: MAX_FILES + 1 }, () => photo)
  assert.deepEqual(!validateSubmission(ok, many).ok && (validateSubmission(ok, many) as { errors: string[] }).errors, ['files.count'])
  const big = [{ ...photo, size: MAX_FILE_BYTES + 1 }]
  assert.deepEqual((validateSubmission(ok, big) as { errors: string[] }).errors, ['files.size'])
  const exe = [{ name: 'kurulum.exe', type: 'application/x-msdownload', size: 1000 }]
  assert.deepEqual((validateSubmission(ok, exe) as { errors: string[] }).errors, ['files.type'])
  const fakeJpg = [{ name: 'virus.exe', type: 'image/jpeg', size: 1000 }]
  assert.deepEqual((validateSubmission(ok, fakeJpg) as { errors: string[] }).errors, ['files.type'])
})

test('sınırlar: 10 dosya, her biri 50 MB', () => {
  assert.equal(MAX_FILES, 10)
  assert.equal(MAX_FILE_BYTES, 50 * 1024 * 1024)
  assert.deepEqual(validateSubmission(ok, Array.from({ length: 10 }, () => ({ ...photo, size: MAX_FILE_BYTES }))), { ok: true })
})

test('aynı adresten saatte en fazla 5 gönderim', () => {
  const limit = createRateLimiter(5, 60 * 60 * 1000)
  const t0 = 1_000_000
  for (let i = 0; i < 5; i++) assert.equal(limit('1.2.3.4', t0 + i), true)
  assert.equal(limit('1.2.3.4', t0 + 10), false)
  assert.equal(limit('5.6.7.8', t0 + 10), true)
  assert.equal(limit('1.2.3.4', t0 + 60 * 60 * 1000 + 1), true)
})
