import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Where } from 'payload'
import React from 'react'
import { Crumbs } from '@/components/site/Article'
import { Ico } from '@/components/site/Icons'
import { fmt, isLang, t, type Lang } from '@/i18n/ui'
import { cms, loc } from '@/lib/cms'
import { announcementTypeLabel, archiveTypeLabel, archiveYear } from '@/lib/labels'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string }>; searchParams: Promise<{ q?: string; tur?: string }> }

export async function generateMetadata({ params }: P) {
  const { lang } = await params
  return isLang(lang) ? { title: t(lang, 'search.results') } : {}
}

type Hit = { key: string; kind: string; title: string; href: string; note?: string }

export default async function SearchPage({ params, searchParams }: P) {
  const { lang: raw } = await params
  if (!isLang(raw)) notFound()
  const lang: Lang = raw
  const { q = '', tur } = await searchParams
  const query = q.trim().slice(0, 80)
  const payload = await cms()
  const locale = loc(lang)
  const like = (...fields: string[]): Where | undefined =>
    query ? { or: fields.map((f) => ({ [f]: { like: query } })) } : undefined
  const want = (k: string) => !tur || tur === k
  const opts = { limit: 30, depth: 0, locale, overrideAccess: false } as const

  const [posts, notices, events, archive, villages] = await Promise.all([
    want('haber') ? payload.find({ collection: 'posts', where: like('title', 'excerpt'), sort: '-publishedAt', ...opts }) : null,
    want('duyuru') ? payload.find({ collection: 'announcements', where: like('title'), sort: '-publishedAt', ...opts }) : null,
    want('etkinlik') ? payload.find({ collection: 'events', where: like('title', 'place'), sort: '-startDate', ...opts }) : null,
    want('arsiv') ? payload.find({ collection: 'archive', where: like('title', 'donor', 'people'), sort: 'year', ...opts }) : null,
    want('koy') ? payload.find({ collection: 'villages', where: like('name', 'otherNames'), sort: 'name', ...opts }) : null,
  ])

  const hits: Hit[] = [
    ...(posts?.docs ?? []).map((p) => ({ key: `p${p.id}`, kind: t(lang, 'nav.haberler'), title: p.title, href: `/${lang}/haber/${p.slug}`, note: [fmt(lang, p.publishedAt), p.excerpt].filter(Boolean).join(' · ') })),
    ...(notices?.docs ?? []).map((n) => ({ key: `n${n.id}`, kind: announcementTypeLabel(lang, n.type), title: n.title, href: `/${lang}/duyuru/${n.slug}`, note: fmt(lang, n.publishedAt) })),
    ...(events?.docs ?? []).map((e) => ({ key: `e${e.id}`, kind: t(lang, 'nav.etkinlikler'), title: e.title, href: `/${lang}/etkinlik/${e.slug}`, note: [fmt(lang, e.startDate), e.place].filter(Boolean).join(' · ') })),
    ...(archive?.docs ?? []).map((a) => ({ key: `a${a.id}`, kind: archiveTypeLabel(lang, a.type), title: a.title, href: `/${lang}/arsiv/${a.slug}`, note: [archiveYear(lang, a), a.donor].filter(Boolean).join(' · ') })),
    ...(villages?.docs ?? []).map((v) => ({ key: `v${v.id}`, kind: t(lang, 'nav.koyler'), title: v.name, href: `/${lang}/koy/${v.slug}`, note: (v.otherNames ?? []).join(' · ') })),
  ]

  return (
    <div className="wrap article search-page page-enter">
      <Crumbs lang={lang} />
      <header className="art-head">
        <h1 className="intro">{t(lang, 'search.results')}</h1>
      </header>
      <form className="search" role="search" action={`/${lang}/ara`}>
        <Ico name="search" />
        {tur && <input type="hidden" name="tur" value={tur} />}
        <label htmlFor="q2" className="sr">{t(lang, 'search.btn')}</label>
        <input id="q2" name="q" type="search" defaultValue={query} placeholder={t(lang, 'search.ph')} autoFocus />
        <button type="submit">{t(lang, 'search.btn')}</button>
      </form>
      {hits.length === 0 ? (
        <p className="empty">{t(lang, 'search.none')}</p>
      ) : (
        <ul className="results">
          {hits.map((h, i) => (
            <li key={h.key} data-reveal="" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
              <span className="kind">{h.kind}</span>
              <Link href={h.href}><span className="ul">{h.title}</span></Link>
              {h.note && <p>{h.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
