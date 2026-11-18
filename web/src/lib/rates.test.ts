import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRatesCache, num, parseRates, RATE_KEYS } from './rates'

const FIXTURE = {
  Update_Date: '2026-11-18 16:45:03',
  GRA: { Selling: 6139.16, Change: -1.57, Buying: 6138.25 },
  CEYREKALTIN: { Selling: 10195, Change: -1.34 },
  YARIMALTIN: { Selling: 20384, Change: -1.33 },
  TAMALTIN: { Selling: 40617, Change: 0 },
  EUR: { Selling: 55.3965, Change: -0.25 },
  USD: { Selling: 50.4448, Change: 0.05 },
  GBP: { Selling: '66,4878', Change: '%0,12' },
}

test('kaynak verisi yedi kaleme çevrilir', () => {
  const r = parseRates(FIXTURE)
  assert.deepEqual(r.map((x) => x.key), [...RATE_KEYS])
  assert.equal(r.find((x) => x.key === 'gram')?.sell, 6139.16)
  assert.equal(r.find((x) => x.key === 'usd')?.change, 0.05)
  assert.equal(r.find((x) => x.key === 'gbp')?.sell, 66.4878)
  assert.equal(r.find((x) => x.key === 'gbp')?.change, 0.12)
})

test('bozuk veri boş liste döner', () => {
  assert.deepEqual(parseRates(null), [])
  assert.deepEqual(parseRates({ foo: 1 }), [])
  assert.deepEqual(parseRates('html hata sayfası'), [])
})

test('Türkçe sayı yazımı çözülür', () => {
  assert.equal(num('6.123,45'), 6123.45)
  assert.equal(num('%-1,5'), -1.5)
  assert.equal(num('abc'), NaN)
})

test('kaynak çökerse son iyi veri kullanılır, hiç yoksa null', async () => {
  let fail = false
  const cache = createRatesCache(async () => {
    if (fail) throw new Error('zaman aşımı')
    return FIXTURE
  })
  const first = await cache.get()
  assert.equal(first?.rates.length, 7)
  fail = true
  const second = await cache.get()
  assert.equal(second?.rates.length, 7)
  assert.equal(second?.updatedAt, first?.updatedAt)

  const empty = createRatesCache(async () => { throw new Error('yok') })
  assert.equal(await empty.get(), null)
})
