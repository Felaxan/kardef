import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  bodyTooLarge,
  clientIp,
  createRateLimiter,
  hasValidFileSignature,
  MAX_BODY_BYTES,
  MAX_FILE_BYTES,
  MAX_FILES,
  parseSubmissionYear,
  turnstileMode,
  validateSubmission,
} from './submission'

const ok = { name: 'Ali Veli', phone: '05551112233', email: '', description: '1972 düğününden fotoğraf', consent: 'on', privacy: 'on' }
const photo = { name: 'foto.jpg', type: 'image/jpeg', size: 2_000_000 }

test('geçerli gönderim kabul edilir', () => {
  assert.deepEqual(validateSubmission(ok, [photo]), { ok: true })
})

test('dosyasız ama bağlantılı gönderim kabul edilir', () => {
  assert.deepEqual(validateSubmission({ ...ok, link: 'https://youtu.be/x' }, []), { ok: true })
})

test('zorunlu alanlar eksikse hangi alan olduğu söylenir', () => {
  const r = validateSubmission({ ...ok, name: ' ', description: '', consent: '', privacy: '' }, [photo])
  assert.equal(r.ok, false)
  assert.deepEqual(!r.ok && [...r.errors].sort(), ['consent', 'description', 'name', 'privacy'])
})

test('telefon ve e-posta ikisi de boşsa iletişim hatası', () => {
  const r = validateSubmission({ ...ok, phone: '', email: '' }, [photo])
  assert.deepEqual(!r.ok && r.errors, ['contact'])
})

test('geçersiz e-posta iletişim hatası', () => {
  const r = validateSubmission({ ...ok, phone: '', email: 'ali@' }, [photo])
  assert.deepEqual(!r.ok && r.errors, ['contact'])
})

test('dosyasız, yalnızca yazılı anı da kabul edilir', () => {
  assert.deepEqual(validateSubmission(ok, []), { ok: true })
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

test('istek gövdesi sınırı: 10 × 50 MB + pay', () => {
  assert.ok(MAX_BODY_BYTES >= MAX_FILES * MAX_FILE_BYTES)
  assert.equal(bodyTooLarge(String(MAX_BODY_BYTES + 1)), true)
  assert.equal(bodyTooLarge(String(1000)), false)
  assert.equal(bodyTooLarge(null), false)
  assert.equal(bodyTooLarge('abc'), false)
})

test('IP yalnızca güvenilen başlıktan okunur', () => {
  const h = new Headers({ 'cf-connecting-ip': '6.6.6.6', 'x-forwarded-for': '7.7.7.7, 10.0.0.1', 'x-real-ip': '8.8.8.8' })
  assert.equal(clientIp(h, undefined), '8.8.8.8')
  assert.equal(clientIp(h, 'cf-connecting-ip'), '6.6.6.6')
  assert.equal(clientIp(new Headers({ 'cf-connecting-ip': '6.6.6.6' }), undefined), 'bilinmiyor')
})

test('Turnstile modu', () => {
  assert.equal(turnstileMode({}), 'off')
  assert.equal(turnstileMode({ TURNSTILE_SECRET: 's', NEXT_PUBLIC_TURNSTILE_SITEKEY: 'k' }), 'on')
  assert.equal(turnstileMode({ TURNSTILE_SECRET: 's' }), 'misconfigured')
  assert.equal(turnstileMode({ NEXT_PUBLIC_TURNSTILE_SITEKEY: 'k' }), 'misconfigured')
})

test('katkı yılı çözümleme: tam yıl, yaklaşık yıl ve boş/geçersiz değer', () => {
  assert.deepEqual(parseSubmissionYear('1978', 2026), { year: 1978, approximate: false })
  assert.deepEqual(parseSubmissionYear("1970'ler", 2026), { year: 1970, approximate: true })
  assert.deepEqual(parseSubmissionYear('~1985 civarı', 2026), { year: 1985, approximate: true })
  assert.deepEqual(parseSubmissionYear('', 2026), { year: 2026, approximate: true })
  assert.deepEqual(parseSubmissionYear('1820', 2026), { year: 2026, approximate: true })
})

test('dosya imzası (magic bytes) sahte .exe, .svg ve .html dosyalarını reddeder', () => {
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a])
  const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])
  const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00])
  const svg = new Uint8Array(Buffer.from('<svg onload="alert(1)"></svg>'))
  const html = new Uint8Array(Buffer.from('<!DOCTYPE html><html><script>alert(1)</script></html>'))

  assert.equal(hasValidFileSignature(jpg, 'image/jpeg'), true)
  assert.equal(hasValidFileSignature(png, 'image/png'), true)
  assert.equal(hasValidFileSignature(pdf, 'application/pdf'), true)
  assert.equal(hasValidFileSignature(exe, 'image/jpeg'), false)
  assert.equal(hasValidFileSignature(svg, 'image/png'), false)
  assert.equal(hasValidFileSignature(html, 'application/pdf'), false)
  assert.equal(hasValidFileSignature(png, 'image/jpeg'), false)
})

