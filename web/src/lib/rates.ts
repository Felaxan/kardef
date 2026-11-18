/*
  Kur şeridi verisi: altın ve döviz (TL karşılığı)
  Kaynak: Truncgil Finans (ücretsiz, resmî değil). Kaynak değişirse yalnızca SOURCE ve KEY_MAP değişir.
*/

export const RATE_KEYS = ['gram', 'ceyrek', 'yarim', 'tam', 'eur', 'usd', 'gbp'] as const
export type RateKey = (typeof RATE_KEYS)[number]
export type Rate = { key: RateKey; sell: number; change: number }
export type RatesData = { rates: Rate[]; updatedAt: string }

export const SOURCE = 'https://finans.truncgil.com/v4/today.json'
const KEY_MAP: Record<RateKey, string> = {
  gram: 'GRA', ceyrek: 'CEYREKALTIN', yarim: 'YARIMALTIN', tam: 'TAMALTIN', eur: 'EUR', usd: 'USD', gbp: 'GBP',
}

/** Sayı ya da Türkçe yazım ("6.123,45", "%-1,5") → sayı */
export function num(v: unknown): number {
  if (typeof v === 'number') return v
  if (typeof v !== 'string') return NaN
  const s = v.replace(/[%\s]/g, '')
  if (!/^-?[\d.,]+$/.test(s)) return NaN
  return Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s)
}

/** Kaynak JSON'unu kalemlere çevirir; eksik ya da bozuk veri varsa boş liste */
export function parseRates(json: unknown): Rate[] {
  if (!json || typeof json !== 'object') return []
  const d = json as Record<string, { Selling?: unknown; Change?: unknown } | undefined>
  const out: Rate[] = []
  for (const key of RATE_KEYS) {
    const item = d[KEY_MAP[key]]
    const sell = num(item?.Selling)
    if (!Number.isFinite(sell) || sell <= 0) return []
    const change = num(item?.Change)
    out.push({ key, sell, change: Number.isFinite(change) ? change : 0 })
  }
  return out
}

/**
  Metin yanıtı çözer. Kaynak bazen yanıtı yarıda kesiyor (geçersiz JSON);
  o zaman gereken kalemler metinden tek tek çıkarılır. Biri bile eksikse boş liste.
*/
export function parseRatesText(text: string): { rates: Rate[]; updatedAt?: string } {
  const stamp = (raw?: string) => (raw ? raw.replace(' ', 'T') + '+03:00' : undefined)
  try {
    const json = JSON.parse(text) as { Update_Date?: string }
    return { rates: parseRates(json), updatedAt: stamp(json?.Update_Date) }
  } catch {
    const picked: Record<string, unknown> = {}
    for (const src of Object.values(KEY_MAP)) {
      const m = text.match(new RegExp(String.raw`"${src}"\s*:\s*(\{[^{}]*\})`))
      if (!m) return { rates: [] }
      try { picked[src] = JSON.parse(m[1]) } catch { return { rates: [] } }
    }
    const date = text.match(/"Update_Date"\s*:\s*"([^"]+)"/)?.[1]
    return { rates: parseRates(picked), updatedAt: stamp(date) }
  }
}

/** Son iyi veriyi hatırlayan önbellek: kaynak hata verirse son iyi veri, hiç yoksa null */
export function createRatesCache(load: () => Promise<unknown>, onError?: (e: unknown) => void) {
  let last: RatesData | null = null
  return {
    async get(): Promise<RatesData | null> {
      try {
        const body = await load()
        const parsed = typeof body === 'string' ? parseRatesText(body) : parseRatesText(JSON.stringify(body))
        if (parsed.rates.length) last = { rates: parsed.rates, updatedAt: parsed.updatedAt ?? new Date().toISOString() }
      } catch (e) {
        // kaynak çöktü: son iyi veri kalır
        onError?.(e)
      }
      return last
    },
  }
}
