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

/** Son iyi veriyi hatırlayan önbellek: kaynak hata verirse son iyi veri, hiç yoksa null */
export function createRatesCache(load: () => Promise<unknown>) {
  let last: RatesData | null = null
  return {
    async get(): Promise<RatesData | null> {
      try {
        const json = await load()
        const rates = parseRates(json)
        if (rates.length) {
          const raw = (json as { Update_Date?: string }).Update_Date
          last = { rates, updatedAt: raw ? raw.replace(' ', 'T') + '+03:00' : new Date().toISOString() }
        }
      } catch {
        // kaynak çöktü: son iyi veri kalır
      }
      return last
    },
  }
}
