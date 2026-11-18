import Link from 'next/link'
import React from 'react'
import { t, type Lang } from '@/i18n/ui'
import { Ico } from './Icons'

/** Ana sayfanın üstünde: yayın sürerken görünen canlı yayın kutusu */
export function LiveBox({ lang, id, title }: { lang: Lang; id: string; title?: string | null }) {
  return (
    <section className="wrap live-box intro" style={{ '--d': 1 } as React.CSSProperties} aria-label={t(lang, 'live.title')}>
      <Link href={`/${lang}/canli`} className="live-box-in">
        <span className="live-thumb">
          <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" />
          <span className="live-play" aria-hidden="true"><Ico name="arrow" /></span>
        </span>
        <span className="live-box-text">
          <span className="live-badge"><span className="live-dot" aria-hidden="true" />{t(lang, 'live.badge')}</span>
          <b>{title || t(lang, 'live.title')}</b>
          <span className="live-box-cta">{t(lang, 'live.watch')} <Ico name="arrow" /></span>
        </span>
      </Link>
    </section>
  )
}
