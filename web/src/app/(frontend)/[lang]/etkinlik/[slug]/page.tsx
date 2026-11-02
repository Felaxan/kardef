import Link from 'next/link'
import React from 'react'
import { countdownLabel, Crumbs, DateTile, daysUntil, KurumSeal, Prose, WordTitle } from '@/components/site/Article'
import { Ico } from '@/components/site/Icons'
import { ParallaxImage } from '@/components/site/ParallaxImage'
import { Share } from '@/components/site/Share'
import { fmt, t, type Lang } from '@/i18n/ui'
import { hasRichText, isMedia, loc, mediaUrl } from '@/lib/cms'
import { bySlug } from '@/lib/detail'
import { kurumLabel } from '@/lib/labels'
import type { Event } from '@/payload-types'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: P) {
  const { lang, slug } = await params
  const { doc } = await bySlug<Event>('events', lang, slug, 1)
  return { title: doc.title, openGraph: { images: mediaUrl(doc.image, 'hero') ?? undefined } }
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties
const tzOf = (e: Pick<Event, 'region'>) => (e.region === 'avrupa' ? 'Europe/Berlin' : 'Europe/Istanbul')
const regionLabel = (lang: Lang, e: Pick<Event, 'region'>) =>
  e.region === 'avrupa' ? t(lang, 'ev.eu') : e.region === 'online' ? t(lang, 'ev.online') : t(lang, 'ev.tr')
const isUrl = (s?: string | null) => !!s && /^https?:\/\//.test(s)
const isPhone = (s?: string | null) => !!s && /^\+?[\d\s()/-]{6,}$/.test(s.trim())

export default async function EventPage({ params }: P) {
  const { lang: raw, slug } = await params
  const { doc: e, lang, payload } = await bySlug<Event>('events', raw, slug)
  const L = (k: string) => t(lang, k)
  const tz = tzOf(e)
  const av = e.region === 'avrupa' || e.kurum === 'avkardep'
  const days = daysUntil(e.startDate, tz)
  const sameDay = e.endDate && fmt(lang, e.endDate, 'date', tz) === fmt(lang, e.startDate, 'date', tz)
  const time = fmt(lang, e.startDate, 'time', tz) + (e.endDate ? ` – ${fmt(lang, e.endDate, sameDay ? 'time' : 'datetime', tz)}` : '')
  const mapQuery = [e.place, e.address].filter(Boolean).join(', ')
  const reg = e.registration?.required ? e.registration.link : null

  const upcoming = await payload.find({
    collection: 'events',
    where: { and: [{ id: { not_equals: e.id } }, { startDate: { greater_than_equal: new Date().toISOString() } }] },
    sort: 'startDate', limit: 3, depth: 0, locale: loc(lang), overrideAccess: false,
  })

  const hero = mediaUrl(e.image, 'hero')
  const heroMedia = isMedia(e.image) ? e.image : null
  const caption = heroMedia && [heroMedia.caption, heroMedia.credit && `${L('foot.photos')}: ${heroMedia.credit.replace(/, Wikimedia Commons$/, '')}`].filter(Boolean).join(' · ')
  const shareLabels = { share: L('share'), copy: L('copy'), copied: L('copied') }

  return (
    <article className={`story ev-page${av ? ' is-av' : ''}${hero ? '' : ' story--noimg'}`}>
      <div className="wrap story-grid story-top">
        <div className="story-col">
          <Crumbs lang={lang} href={`/${lang}#etkinlikler`} label={L('ev.title')} />
          <header className="story-head">
            <div className="story-tags intro" style={css({ '--d': 0 })}>
              <span className="kicker">{regionLabel(lang, e)}</span>
              <span className={`countdown${days < 0 ? ' is-past' : days <= 1 ? ' is-soon' : ''}`}><i aria-hidden="true" />{countdownLabel(lang, days)}</span>
            </div>
            <div className="ev-headline">
              <div className="intro" style={css({ '--d': 1 })}><DateTile lang={lang} date={e.startDate} tz={tz} accent={av ? 'av' : undefined} /></div>
              <WordTitle text={e.title} delay={2} />
            </div>

            <dl className="ev-strip intro" style={css({ '--d': 4 })}>
              <div>
                <dt>{L('ev.when')}</dt>
                <dd>{fmt(lang, e.startDate, 'full', tz)}<small>{time}{e.region === 'avrupa' ? ` · ${L('ev.local')}` : ''}</small></dd>
              </div>
              <div>
                <dt>{L('ev.where')}</dt>
                <dd>
                  {e.place || regionLabel(lang, e)}
                  {e.address && <small>{e.address}</small>}
                  {e.region !== 'online' && mapQuery && (
                    <a className="ev-map" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer">
                      <Ico name="pin" />{L('ev.map')}
                    </a>
                  )}
                </dd>
              </div>
              <div>
                <dt>{L('ev.org')}</dt>
                <dd className="ev-org"><KurumSeal kurum={e.kurum} />{kurumLabel(e.kurum)}</dd>
              </div>
              {reg && !isUrl(reg) && (
                <div>
                  <dt>{L('ev.register')}</dt>
                  <dd>{isPhone(reg) ? <a href={`tel:${reg.replace(/[^\d+]/g, '')}`}>{reg}</a> : reg}</dd>
                </div>
              )}
            </dl>

            <div className="ev-actions intro" style={css({ '--d': 5 })}>
              {e.region === 'online' && e.onlineLink && days >= 0 && (
                <a className="btn btn-brand" href={e.onlineLink} target="_blank" rel="noreferrer"><span>{L('ev.join')}</span><Ico name="arrow" /></a>
              )}
              {isUrl(reg) && days >= 0 && (
                <a className="btn btn-brand" href={reg!} target="_blank" rel="noreferrer"><span>{L('ev.register')}</span><Ico name="arrow" /></a>
              )}
              {days >= 0 && (
                <a className="btn btn-line" href={`/${lang}/etkinlik/${e.slug}/takvim`} download={`${e.slug}.ics`}>
                  <Ico name="cal" /><span>{L('ev.cal')}</span>
                </a>
              )}
              <Share title={e.title} labels={shareLabels} compact />
            </div>
          </header>
        </div>
      </div>

      {hero && (
        <figure className="wrap story-hero">
          <div className="frame"><ParallaxImage src={hero} alt={heroMedia?.alt || ''} /></div>
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      )}

      {hasRichText(e.description) && (
        <div className="wrap story-grid story-body">
          <div className="story-col">
            <div className="story-text prose-reveal"><Prose data={e.description} /></div>
          </div>
        </div>
      )}

      {upcoming.docs.length > 0 && (
        <section className="wrap related">
          <header className="sec-head" data-reveal="">
            <h2>{L('ev.upcoming')}</h2>
            <Link href={`/${lang}#etkinlikler`} className="more"><span>{L('ev.more')}</span><Ico name="arrow" /></Link>
          </header>
          <ol className="ev-next">
            {upcoming.docs.map((u, i) => {
              const utz = tzOf(u)
              const d = daysUntil(u.startDate, utz)
              return (
                <li key={u.id} data-reveal="" style={css({ '--i': i })} className={u.region === 'avrupa' ? 'is-av' : ''}>
                  <Link href={`/${lang}/etkinlik/${u.slug}`}>
                    <span className="n-date">
                      <b>{new Intl.DateTimeFormat('en-GB', { timeZone: utz, day: 'numeric' }).format(new Date(u.startDate))}</b>
                      <span>{fmt(lang, u.startDate, 'month', utz)}</span>
                    </span>
                    <span className="n-body">
                      <span className="n-tag">{regionLabel(lang, u)}</span>
                      <span className="n-title"><span className="ul">{u.title}</span></span>
                      <span className="n-place"><Ico name="pin" />{u.place || regionLabel(lang, u)} · {fmt(lang, u.startDate, 'time', utz)}</span>
                    </span>
                    <span className="n-left">{countdownLabel(lang, d)}</span>
                    <Ico name="arrow" />
                  </Link>
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </article>
  )
}
