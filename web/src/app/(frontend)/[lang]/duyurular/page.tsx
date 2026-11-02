import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { FilterTabs, ListHead, Pager, qs } from '@/components/site/List'
import { fmt, isLang, t, type Lang } from '@/i18n/ui'
import { cms, loc } from '@/lib/cms'
import { announcementTypeLabel, kurumLabel } from '@/lib/labels'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string }>; searchParams: Promise<{ tur?: string; sayfa?: string }> }

export async function generateMetadata({ params }: P) {
  const { lang } = await params
  return isLang(lang) ? { title: t(lang, 'not.title') } : {}
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties
const TYPES = ['vefat', 'burs', 'toplanti', 'yardim', 'uyelik', 'genel'] as const
const PER = 20

export default async function NoticesList({ params, searchParams }: P) {
  const { lang: raw } = await params
  if (!isLang(raw)) notFound()
  const lang: Lang = raw
  const L = (k: string) => t(lang, k)
  const { tur, sayfa } = await searchParams
  const type = (TYPES as readonly string[]).includes(tur ?? '') ? tur : undefined
  const page = Math.max(1, Number(sayfa) || 1)
  const payload = await cms()

  const res = await payload.find({
    collection: 'announcements', where: type ? { type: { equals: type } } : undefined,
    sort: ['-pinned', '-publishedAt'], limit: PER, page, depth: 0, locale: loc(lang), overrideAccess: false,
  })
  const counts = await Promise.all([undefined, ...TYPES].map((ty) =>
    payload.count({ collection: 'announcements', where: ty ? { type: { equals: ty } } : undefined, overrideAccess: false })))
  const base = `/${lang}/duyurular`

  return (
    <div className="story list-page">
      <div className="wrap story-top">
        <ListHead lang={lang} kicker={L('nav.duyurular')} title={L('not.title')} lede={L('not.lede')} count={counts[0].totalDocs} />
        <FilterTabs
          label={L('not.title')}
          tabs={[undefined, ...TYPES].map((ty, i) => ({
            href: qs(base, { tur: ty }), label: ty ? announcementTypeLabel(lang, ty) : L('search.all'), count: counts[i].totalDocs, active: type === ty,
          })).filter((tb, i) => i === 0 || tb.count > 0)}
        />
        {res.docs.length === 0 ? (
          <p className="empty">{L('search.none')}</p>
        ) : (
          <ul className="notices notices--list">
            {res.docs.map((n, i) => (
              <li key={n.id} data-reveal="" style={css({ '--i': Math.min(i, 8) })} className={n.pinned ? 'is-pinned' : ''}>
                <span className={`cat ${n.type}`}>{announcementTypeLabel(lang, n.type)}</span>
                <div className="n-main">
                  <Link href={`/${lang}/duyuru/${n.slug}`}><span className="ul">{n.title}</span></Link>
                  <small>{kurumLabel(n.kurum)}</small>
                </div>
                <time>{fmt(lang, n.publishedAt, 'date')}</time>
              </li>
            ))}
          </ul>
        )}
        <Pager lang={lang} page={page} pages={res.totalPages} href={(p) => qs(base, { tur: type, sayfa: p })} />
      </div>
    </div>
  )
}
