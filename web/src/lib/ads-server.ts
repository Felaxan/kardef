import type { AdImage } from '@/payload-types'
import { activeAds, clampSeconds, type Ad, type AdSlotKey } from './ads'
import { cms } from './cms'

const url = (m: unknown) => (m && typeof m === 'object' ? ((m as AdImage).url ?? null) : null)

/** Sitedeki bir reklam yeri: yalnızca yayındaki reklamlar. Hiç yoksa null. */
export async function getSlot(key: AdSlotKey): Promise<{ seconds: number; ads: Ad[] } | null> {
  const payload = await cms()
  const r = await payload.find({ collection: 'ad-slots', where: { key: { equals: key } }, limit: 1, depth: 1, overrideAccess: true })
  const slot = r.docs[0]
  if (!slot || !slot.enabled) return null
  const ads: Ad[] = (slot.ads ?? []).map((a) => ({
    image: url(a.image) ?? '',
    mobileImage: url(a.mobileImage),
    link: a.link ?? null,
    advertiser: a.advertiser,
    startsAt: a.startsAt ?? null,
    endsAt: a.endsAt ?? null,
    active: a.active !== false,
  }))
  const live = activeAds(ads, new Date())
  return live.length ? { seconds: clampSeconds(slot.seconds), ads: live } : null
}
