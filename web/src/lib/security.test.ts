import assert from 'node:assert/strict'
import path from 'path'
import { test } from 'node:test'
import {
  clampApiQueryLimits,
  createSecurityShield,
  redactSensitive,
  resolvePayloadSecret,
  safeRandomFilename,
  safeResolveUnder,
  SECURITY_HEADERS,
  verifyCsrfOrigin,
} from './security'

test('canlı ortamda zayıf veya boş PAYLOAD_SECRET reddedilir', () => {
  assert.throws(() => resolvePayloadSecret({ NODE_ENV: 'production', PAYLOAD_SECRET: '' }, false))
  assert.throws(() => resolvePayloadSecret({ NODE_ENV: 'production', PAYLOAD_SECRET: 'uzun-rastgele-bir-anahtar' }, false))
  assert.throws(() => resolvePayloadSecret({ NODE_ENV: 'production', PAYLOAD_SECRET: 'kisa-anahtar' }, false))
  const strong = 'c9f8e7d6b5a40123456789abcdef0123456789abcdef'
  assert.equal(resolvePayloadSecret({ NODE_ENV: 'production', PAYLOAD_SECRET: strong }, false), strong)
})

test('yüklenen dosya adları rastgeleleştirilir ve çift uzantı/Path Traversal temizlenir', () => {
  const n1 = safeRandomFilename('../../etc/passwd.jpg')
  assert.match(n1, /^[a-f0-9]{12}-passwd\.jpg$/)
  const n2 = safeRandomFilename('zararli.exe.php.png')
  assert.ok(!n2.includes('.exe'))
  assert.ok(!n2.includes('.php'))
  assert.ok(n2.endsWith('.png'))
  assert.notEqual(safeRandomFilename('foto.jpg'), safeRandomFilename('foto.jpg'))
})

test('Path Traversal koruması (safeResolveUnder) üst dizinlere çıkışı engeller', () => {
  const base = path.resolve('/var/app/submissions')
  assert.equal(safeResolveUnder(base, '../kardef.db'), null)
  assert.equal(safeResolveUnder(base, '..\\kardef.db'), null)
  assert.equal(safeResolveUnder(base, 'alt/dosya.jpg'), null)
  assert.equal(safeResolveUnder(base, 'dosya.jpg\0.exe'), null)
  assert.equal(safeResolveUnder(base, '123456abcdef-foto.jpg'), path.join(base, '123456abcdef-foto.jpg'))
})

test('CSRF Origin ve Referer doğrulaması yabancı sitelerden gelen POST/DELETE isteklerini engeller', () => {
  assert.equal(verifyCsrfOrigin('GET', new Headers({ origin: 'https://evil.example.com' })), true)
  assert.equal(
    verifyCsrfOrigin('POST', new Headers({ host: 'karakocan.net', origin: 'https://karakocan.net' })),
    true,
  )
  assert.equal(
    verifyCsrfOrigin('POST', new Headers({ host: 'karakocan.net', origin: 'https://saldiri.com' })),
    false,
  )
  assert.equal(
    verifyCsrfOrigin('DELETE', new Headers({ host: 'karakocan.net', origin: 'null' })),
    false,
  )
  assert.equal(
    verifyCsrfOrigin('POST', new Headers({ host: 'karakocan.net', referer: 'https://evil.com/form' })),
    false,
  )
  assert.equal(
    verifyCsrfOrigin('POST', new Headers({ host: 'karakocan.net', 'sec-fetch-site': 'cross-site' })),
    false,
  )
})

test('hassas veriler (şifre, token, çerez) güvenlik loglarından maskelenir', () => {
  const raw = {
    email: 'ali@karakocan.net',
    password: 'GizliSifre123!',
    resetPasswordToken: 'tok_999',
    headers: {
      cookie: 'payload-token=eyJhbGciOiJIUzI1NiJ9.secret; k-lang=tr',
      authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.secret',
    },
  }
  const clean = redactSensitive(raw) as Record<string, unknown>
  assert.equal(clean.email, 'ali@karakocan.net')
  assert.equal(clean.password, '[MASKELENDİ]')
  assert.equal(clean.resetPasswordToken, '[MASKELENDİ]')
  const h = clean.headers as Record<string, string>
  assert.equal(h.cookie, '[MASKELENDİ]')
  assert.equal(h.authorization, '[MASKELENDİ]')
})

test('toplu veri çekme (scraping) koruması aşırı limit ve depth değerlerini sınırlar', () => {
  const sp1 = new URLSearchParams('limit=99999&depth=10')
  assert.deepEqual(clampApiQueryLimits(sp1, 100, 2), { clamped: true, limit: 100, depth: 2 })
  const sp2 = new URLSearchParams('limit=20&depth=1')
  assert.deepEqual(clampApiQueryLimits(sp2, 100, 2), { clamped: false, limit: 20, depth: 1 })
})

test('güvenlik kalkanı: kaba kuvvet (Brute-Force) tespiti, kademeli gecikme ve otomatik IP engelleme', () => {
  const shield = createSecurityShield({
    authMaxPer10Min: 10,
    apiMaxPerMin: 5,
    failedLoginAutoBanThreshold: 4,
    autoBanDurationMs: 60_000,
  })
  const ip = '203.0.113.99'
  const t0 = 1_000_000

  const r1 = shield.recordFailedLogin(ip, t0)
  assert.equal(r1.attempts, 1)
  assert.equal(r1.autoBanned, false)
  assert.equal(r1.delayMs, 250)

  const r2 = shield.recordFailedLogin(ip, t0 + 100)
  assert.equal(r2.delayMs, 500)
  shield.recordFailedLogin(ip, t0 + 200)
  const r4 = shield.recordFailedLogin(ip, t0 + 300)
  assert.equal(r4.autoBanned, true)
  assert.ok(shield.isIpBlocked(ip, t0 + 400))
  assert.equal(shield.checkAuthRate(ip, t0 + 400), false)
  assert.equal(shield.checkApiRate(ip, t0 + 400), false)

  // Süre dolunca engel kalkar
  assert.equal(shield.isIpBlocked(ip, t0 + 61_000), null)
})

test('güvenlik başlıkları CSP, HSTS, X-Frame-Options ve X-Content-Type-Options içerir', () => {
  assert.equal(SECURITY_HEADERS['X-Content-Type-Options'], 'nosniff')
  assert.equal(SECURITY_HEADERS['X-Frame-Options'], 'SAMEORIGIN')
  assert.ok(SECURITY_HEADERS['Strict-Transport-Security'].includes('max-age='))
  assert.ok(SECURITY_HEADERS['Content-Security-Policy'].includes("frame-ancestors 'self'"))
  assert.ok(SECURITY_HEADERS['Content-Security-Policy'].includes("object-src 'none'"))
})
