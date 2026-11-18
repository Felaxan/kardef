import assert from 'node:assert/strict'
import { test } from 'node:test'
import { activeAds, clampSeconds, type Ad } from './ads'

const now = new Date('2026-12-10T12:00:00Z')
const ad = (o: Partial<Ad>): Ad => ({ image: '/a.jpg', advertiser: 'X', active: true, ...o })

test('kapalı, başlamamış ve süresi dolmuş reklamlar gösterilmez', () => {
  const list = [
    ad({ advertiser: 'kapalı', active: false }),
    ad({ advertiser: 'gelecek', startsAt: '2026-12-11T00:00:00Z' }),
    ad({ advertiser: 'bitmiş', endsAt: '2026-12-09T23:59:00Z' }),
    ad({ advertiser: 'aralıkta', startsAt: '2026-12-01T00:00:00Z', endsAt: '2026-12-31T00:00:00Z' }),
    ad({ advertiser: 'süresiz' }),
  ]
  assert.deepEqual(activeAds(list, now).map((a) => a.advertiser), ['aralıkta', 'süresiz'])
})

test('bitiş günü boyunca reklam yayında kalır', () => {
  assert.equal(activeAds([ad({ endsAt: '2026-12-10T00:00:00Z' })], now).length, 1)
})

test('görseli olmayan reklam gösterilmez', () => {
  assert.equal(activeAds([ad({ image: '' })], now).length, 0)
})

test('dönme süresi 3–60 saniye, varsayılan 8', () => {
  assert.equal(clampSeconds(1), 3)
  assert.equal(clampSeconds(99), 60)
  assert.equal(clampSeconds(undefined), 8)
  assert.equal(clampSeconds(12), 12)
})

test('reklam bağlantısında javascript: ve zararlı şemalar temizlenir', () => {
  const res = activeAds(
    [
      ad({ advertiser: 'zararlı', link: 'javascript:alert(1)' }),
      ad({ advertiser: 'protokol-göreli', link: '//evil.example.com' }),
      ad({ advertiser: 'güvenli-dış', link: 'https://karakocan.net' }),
      ad({ advertiser: 'güvenli-iç', link: '/tr/kurumlar' }),
    ],
    now,
  )
  assert.equal(res[0].link, null)
  assert.equal(res[1].link, null)
  assert.equal(res[2].link, 'https://karakocan.net')
  assert.equal(res[3].link, '/tr/kurumlar')
})

