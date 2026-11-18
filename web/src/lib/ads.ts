/* Reklam seçme kuralları (sunucu ve istemci ortak, saf fonksiyonlar) */

export type AdSlotKey = 'top' | 'feed' | 'side'

export type Ad = {
  image: string
  mobileImage?: string | null
  link?: string | null
  advertiser: string
  startsAt?: string | null
  endsAt?: string | null
  active: boolean
}

const DAY = 24 * 60 * 60 * 1000

/** Yalnızca güvenli (http/https veya site içi /) bağlantılara izin verir */
export function safeAdLink(link?: string | null): string | null {
  if (!link || typeof link !== 'string') return null
  const s = link.trim()
  return /^(https?:\/\/|\/(?!\/))/i.test(s) ? s : null
}

/** Yayındaki reklamlar: etkin, görseli var, başlangıcı geçmiş, bitiş gününün sonu gelmemiş */
export function activeAds(ads: Ad[], now: Date): Ad[] {
  const t = now.getTime()
  return ads
    .filter((a) => {
      if (!a.active || !a.image) return false
      if (a.startsAt && new Date(a.startsAt).getTime() > t) return false
      if (a.endsAt) {
        // Bitiş bir gündür: o günün sonuna kadar yayında kalır
        const end = new Date(a.endsAt)
        const dayEnd = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) + DAY
        if (dayEnd <= t) return false
      }
      return true
    })
    .map((a) => ({ ...a, link: safeAdLink(a.link) }))
}

/** Dönme süresi: 3–60 saniye, geçersizse 8 */
export function clampSeconds(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 8
  return Math.min(60, Math.max(3, Math.round(v)))
}
