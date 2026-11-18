import React from 'react'
import { t, type Lang } from '@/i18n/ui'
import type { AdSlotKey } from '@/lib/ads'
import { getSlot } from '@/lib/ads-server'
import { AdSlot } from './AdSlot'

/** Sunucuda reklam yerini okur; yayında reklam yoksa hiçbir şey çizmez */
export async function AdPlacement({ slot, lang, className }: { slot: AdSlotKey; lang: Lang; className?: string }) {
  const data = await getSlot(slot)
  if (!data) return null
  return (
    <div className={className}>
      <AdSlot slot={slot} seconds={data.seconds} ads={data.ads} label={t(lang, 'ad.label')} />
    </div>
  )
}
