import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Where } from 'payload'
import React from 'react'
import { countdownLabel, daysUntil } from '@/components/site/Article'
import { Ico } from '@/components/site/Icons'
import { FilterTabs, ListHead, qs } from '@/components/site/List'
import { fmt, isLang, t, type Lang } from '@/i18n/ui'
import { cms, loc } from '@/lib/cms'
import { kurumLabel } from '@/lib/labels'
import type { Event } from '@/payload-types'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string }>; searchParams: Promise<{ bolge?: string; gecmis?: string }> }

export async function generateMetadata({ params }: P) {
  const { lang } = await params
  return isLang(lang) ? { title: t(lang, 'nav.etkinlikler') } : {}
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties
const tzOf = (e: Pick<Event, 'region'>) => (e.region === 'avrupa' ? 'Europe/Berlin' : 'Europe/Istanbul')
const REGIONS = ['karakocan', 'avrupa', 'online'] as const

export default async function EventsList({ params, searchParams }: P) {
  const { lang: raw } = await params
  if (!isLang(raw)) notFound()
  const lang: Lang = raw
  const L = (k: string) => t(lang, k)
  const { bolge, gecmis } = await searchParams
  const past = gecmis === '1'
  const region = (REGIONS as readonly string[]).includes(bolge ?? '') ? bolge : undefined
  const payload = await cms()
  const now = new Date(Date.now() - 6 * 3600_000).toISOString() // bugün başlayanlar "yaklaşan"da kalsın

  const time: Where = past ? { startDate: { less_than: now } } : { startDate: { greater_than_equal: now } }
  const res = await payload.find({
    collection: 'events', where: region ? { and: [time, { region: { equals: region } }] } : time,
    sort: past ? '-startDate' : 'startDate', limit: 200, depth: 0, locale: loc(lang), overrideAccess: false,
  })
  const counts = await Promise.all([undefined, ...REGIONS].map((r) =>
    payload.count({ collection: 'events', where: r ? { and: [time, { region: { equals: r } }] } : time, overrideAccess: false })))
  const regionLabel = (r?: string) => (r === 'avrupa' ? L('ev.eu') : r === 'online' ? L('ev.online') : r === 'karakocan' ? L('ev.tr') : L('ev.all'))

  // Aylara göre grupla
  const months = new Map<string, Event[]>()
  for (const e of res.docs) {
    const key = `${fmt(lang, e.startDate, 'month', tzOf(e))} ${new Intl.DateTimeFormat('en-GB', { timeZone: tzOf(e), year: 'numeric' }).format(new Date(e.startDate))}`
    months.set(key, [...(months.get(key) ?? []), e])
  }
  const base = `/${lang}/etkinlikler`

  return (
    <div className="story list-page">
      <div className="wrap story-top">
        <ListHead lang={lang} kicker={L('nav.etkinlikler')} title={L('ev.title')} lede={L('ev.lede')} count={counts[0].totalDocs} countLabel={past ? L('ev.tabPast') : L('ev.tabUp')} />
        <div className="list-tools">
          <div className="seg seg--static" role="group">
            <Link href={qs(base, { bolge: region })} aria-pressed={!past} scroll={false}>{L('ev.tabUp')}</Link>
            <Link href={qs(base, { bolge: region, gecmis: '1' })} aria-pressed={past} scroll={false}>{L('ev.tabPast')}</Link>
          </div>
          <FilterTabs
            label={L('ev.title')}
            tabs={[undefined, ...REGIONS].map((r, i) => ({
              href: qs(base, { bolge: r, gecmis: past ? '1' : undefined }), label: regionLabel(r), count: counts[i].totalDocs, active: region === r,
            }))}
          />
        </div>

        {res.docs.length === 0 ? (
          <p className="empty">{L('ev.none')}</p>
        ) : (
          [...months.entries()].map(([m, list], gi) => (
            <section key={m} className="ev-month">
              <h2 className="ev-month-h" data-reveal="" style={css({ '--i': gi })}>{m}</h2>
              <ol className="ev-next">
                {list.map((u, i) => {
                  const tz = tzOf(u)
                  return (
                    <li key={u.id} data-reveal="" style={css({ '--i': i })} className={u.region === 'avrupa' ? 'is-av' : ''}>
                      <Link href={`/${lang}/etkinlik/${u.slug}`}>
                        <span className="n-date">
                          <b>{new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: 'numeric' }).format(new Date(u.startDate))}</b>
                          <span>{fmt(lang, u.startDate, 'weekday', tz)}</span>
                        </span>
                        <span className="n-body">
                          <span className="n-tag">{regionLabel(u.region)} · {kurumLabel(u.kurum)}</span>
                          <span className="n-title"><span className="ul">{u.title}</span></span>
                          <span className="n-place"><Ico name="pin" />{u.place || regionLabel(u.region)} · {fmt(lang, u.startDate, 'time', tz)}</span>
                        </span>
                        <span className="n-left">{countdownLabel(lang, daysUntil(u.startDate, tz))}</span>
                        <Ico name="arrow" />
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
