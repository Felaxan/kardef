import { createRatesCache, SOURCE, type RatesData } from './rates'

/*
  Sunucuda 30 dakikalık bellek önbelleği. Layout her istekte çizildiği için (force-dynamic)
  Next'in fetch önbelleği burada işlemez; kaynağa en fazla 30 dakikada bir gidilir.
*/
const TTL = 30 * 60 * 1000
const TIMEOUT = 5000

const cache = createRatesCache(async () => {
  const res = await fetch(SOURCE, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT), headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`kur kaynağı ${res.status}`)
  return res.json()
})

let at = 0
let current: RatesData | null = null
let pending: Promise<RatesData | null> | null = null

export async function getRates(): Promise<RatesData | null> {
  if (Date.now() - at < TTL) return current
  if (!pending) {
    pending = cache.get().then((d) => {
      current = d
      // Başarısızsa 2 dakika sonra yeniden dene, başarılıysa 30 dakika bekle
      at = d ? Date.now() : Date.now() - TTL + 2 * 60 * 1000
      pending = null
      return d
    })
  }
  return pending
}
