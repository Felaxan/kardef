import { createRatesCache, createSwr, SOURCE, type RatesData } from './rates'

/*
  Sunucuda 30 dakikalık bellek önbelleği. Layout her istekte çizildiği için (force-dynamic)
  Next'in fetch önbelleği burada işlemez; kaynağa en fazla 30 dakikada bir, arka planda gidilir.
*/
const TTL = 30 * 60 * 1000
const TIMEOUT = 5000

async function load(attempt = 0): Promise<unknown> {
  try {
    const res = await fetch(SOURCE, { cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT), headers: { accept: 'application/json' } })
    if (!res.ok || !res.body) throw new Error(`kur kaynağı ${res.status}`)
    // Kaynak bazen bağlantıyı yanıtın ortasında kesiyor: o ana kadar geleni sakla, ayrıştırıcı kurtarsın
    const reader = res.body.getReader()
    const chunks: Uint8Array[] = []
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }
    } catch {
      if (!chunks.length) throw new Error('kur kaynağı boş yanıt')
    }
    return Buffer.concat(chunks).toString('utf8')
  } catch (e) {
    // Bağlantı koptuysa (ör. UND_ERR_SOCKET) bir kez daha dene
    if (attempt === 0 && e instanceof TypeError) {
      await new Promise((r) => setTimeout(r, 400))
      return load(1)
    }
    throw e
  }
}

const cache = createRatesCache(() => load(), (e) => {
  const err = e as Error & { cause?: { code?: string; message?: string } }
  console.warn('[kur şeridi] kaynak okunamadı:', err?.message, err?.cause?.code || err?.cause?.message || '')
})

// Sayfa kaynağı hiç beklemez: eldeki veri hemen döner, yenileme arka planda yapılır
const swr = createSwr<RatesData>(() => cache.get(), TTL)

export async function getRates(): Promise<RatesData | null> {
  return swr.get()
}
