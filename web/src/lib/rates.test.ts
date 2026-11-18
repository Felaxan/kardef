import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRatesCache, createSwr, num, parseRates, parseRatesText, RATE_KEYS } from './rates'

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

test('yarıda kesilmiş yanıttan kalemler kurtarılır', () => {
  const full = JSON.stringify({ ...FIXTURE, XPD: { Buying: 1555.2, Type: 'Palladium', Name: 'GRAMPALADYUM', Selling: 1559.21, Change: 0.4 } })
  const cut = full.slice(0, full.length - 14)
  assert.throws(() => JSON.parse(cut))
  const r = parseRatesText(cut)
  assert.equal(r.rates.length, 7)
  assert.equal(r.rates.find((x) => x.key === 'eur')?.sell, 55.3965)
  assert.equal(r.updatedAt, '2026-11-18T16:45:03+03:00')
})

test('boşluklu ve kesik yanıt da çözülür', () => {
  const spaced = JSON.stringify({ ...FIXTURE, XAG: { Selling: 70 } }, null, 2)
  assert.equal(parseRatesText(spaced.slice(0, -8)).rates.length, 7)
})

test('kesik yanıtta bir kalem eksikse hiç gösterilmez', () => {
  const full = JSON.stringify(FIXTURE)
  const cut = full.slice(0, full.indexOf('"GBP"') + 8)
  assert.equal(parseRatesText(cut).rates.length, 0)
})

test('önbellek metin yanıtını da işler', async () => {
  const cache = createRatesCache(async () => JSON.stringify({ ...FIXTURE, XAG: { Selling: 70, Change: 1 } }).slice(0, -6))
  assert.equal((await cache.get())?.rates.length, 7)
})

test('kur verisi beklemeden döner, yenileme arka planda yapılır', async () => {
  let t = 0
  let calls = 0
  let release: (v: number) => void = () => {}
  const swr = createSwr<number>(() => { calls++; return new Promise((r) => { release = r }) }, 1000, () => t)

  assert.equal(swr.get(), null) // ilk istek: veri yok, beklemez
  assert.equal(calls, 1)
  release(5)
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(swr.get(), 5)

  t = 2000 // süre doldu
  assert.equal(swr.get(), 5) // eski veri hemen döner
  assert.equal(calls, 2)
  assert.equal(swr.get(), 5) // yenileme sürerken ikinci istek kaynağa gitmez
  assert.equal(calls, 2)
  release(7)
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(swr.get(), 7)
})

test('yenileme hata verirse eski veri kalır', async () => {
  let t = 0
  let fail = false
  const swr = createSwr<number>(async () => { if (fail) throw new Error('x'); return 3 }, 1000, () => t)
  swr.get(); await new Promise((r) => setTimeout(r, 0))
  fail = true; t = 5000
  assert.equal(swr.get(), 3)
  await new Promise((r) => setTimeout(r, 0))
  assert.equal(swr.get(), 3)
})
