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

type Kind = 'haber' | 'duyuru' | 'etkinlik' | 'arsiv' | 'koy'
type Hit = { key: string; kind: Kind; label: string; title: string; href: string; note?: string }
const KINDS: Kind[] = ['haber', 'duyuru', 'etkinlik', 'arsiv', 'koy']
const css = (v: Record<string, string | number>) => v as React.CSSProperties

/** Aranan kelimeyi metin içinde vurgular (Türkçe büyük/küçük harf duyarsız) */
function Mark({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>
  const lower = text.toLocaleLowerCase('tr'), needle = q.toLocaleLowerCase('tr')
  const out: React.ReactNode[] = []
  let i = 0, j = lower.indexOf(needle)
  while (j !== -1 && needle) {
    out.push(text.slice(i, j), <mark key={j}>{text.slice(j, j + needle.length)}</mark>)
    i = j + needle.length
    j = lower.indexOf(needle, i)
  }
  out.push(text.slice(i))
  return <>{out}</>
}

export default async function SearchPage({ params, searchParams }: P) {
  const { lang: raw } = await params
  if (!isLang(raw)) notFound()
  const lang: Lang = raw
  const L = (k: string) => t(lang, k)
  const { q = '', tur } = await searchParams
  const query = q.trim().slice(0, 80)
  const active = (KINDS as string[]).includes(tur ?? '') ? (tur as Kind) : null
  const payload = await cms()
  const locale = loc(lang)
  const like = (...fields: string[]): Where | undefined =>
    query ? { or: fields.map((f) => ({ [f]: { like: query } })) } : undefined
  const opts = { limit: 30, depth: 0, locale, overrideAccess: false } as const

  const [posts, notices, events, archive, villages] = await Promise.all([
    payload.find({ collection: 'posts', where: like('title', 'excerpt'), sort: '-publishedAt', ...opts }),
    payload.find({ collection: 'announcements', where: like('title'), sort: '-publishedAt', ...opts }),
    payload.find({ collection: 'events', where: like('title', 'place'), sort: '-startDate', ...opts }),
    payload.find({ collection: 'archive', where: like('title', 'donor', 'people'), sort: 'year', ...opts }),
    payload.find({ collection: 'villages', where: like('name', 'otherNames'), sort: 'name', ...opts }),
  ])

  const all: Hit[] = [
    ...posts.docs.map((p) => ({ key: `p${p.id}`, kind: 'haber' as const, label: L('nav.haberler'), title: p.title, href: `/${lang}/haber/${p.slug}`, note: [fmt(lang, p.publishedAt), p.excerpt].filter(Boolean).join(' · ') })),
    ...notices.docs.map((n) => ({ key: `n${n.id}`, kind: 'duyuru' as const, label: announcementTypeLabel(lang, n.type), title: n.title, href: `/${lang}/duyuru/${n.slug}`, note: fmt(lang, n.publishedAt) })),
    ...events.docs.map((e) => ({ key: `e${e.id}`, kind: 'etkinlik' as const, label: L('nav.etkinlikler'), title: e.title, href: `/${lang}/etkinlik/${e.slug}`, note: [fmt(lang, e.startDate, 'date', e.region === 'avrupa' ? 'Europe/Berlin' : undefined), e.place].filter(Boolean).join(' · ') })),
    ...archive.docs.map((a) => ({ key: `a${a.id}`, kind: 'arsiv' as const, label: archiveTypeLabel(lang, a.type), title: a.title, href: `/${lang}/arsiv/${a.slug}`, note: [archiveYear(lang, a), a.donor].filter(Boolean).join(' · ') })),
    ...villages.docs.map((v) => ({ key: `v${v.id}`, kind: 'koy' as const, label: L('nav.koyler'), title: v.name, href: `/${lang}/koy/${v.slug}`, note: (v.otherNames ?? []).join(' · ') })),
  ]
  const count = (k: Kind) => all.filter((h) => h.kind === k).length
  const hits = active ? all.filter((h) => h.kind === active) : all
  const tabName: Record<Kind, string> = { haber: L('nav.haberler'), duyuru: L('nav.duyurular'), etkinlik: L('nav.etkinlikler'), arsiv: L('nav.arsiv'), koy: L('nav.koyler') }
  const href = (k: Kind | null) => {
    const sp = new URLSearchParams()
    if (query) sp.set('q', query)
    if (k) sp.set('tur', k)
    const s = sp.toString()
    return `/${lang}/ara${s ? `?${s}` : ''}`
  }

  return (
    <div className="story search-page">
      <div className="wrap story-top">
        <Crumbs lang={lang} />
        <header className="sp-head">
          <span className="kicker intro" style={css({ '--d': 0 })}>{L('search.btn')}</span>
          <h1 className="sp-title intro" style={css({ '--d': 1 })}>
            {query ? <>“{query}”</> : L('search.results')}
          </h1>
          <p className="story-dek intro" style={css({ '--d': 2 })}>
            {query ? <><b>{all.length}</b> {L('search.n')}</> : L('search.lede')}
          </p>
        </header>

        <form className="sp-form intro" role="search" action={`/${lang}/ara`} style={css({ '--d': 3 })}>
          <Ico name="search" />
          {active && <input type="hidden" name="tur" value={active} />}
          <label htmlFor="q2" className="sr">{L('search.btn')}</label>
          <input id="q2" name="q" type="search" defaultValue={query} placeholder={L('search.ph')} autoFocus={!query} />
          <button type="submit"><span>{L('search.btn')}</span><Ico name="arrow" /></button>
        </form>

        <nav className="sp-tabs intro" aria-label={L('search.results')} style={css({ '--d': 4 })}>
          <Link href={href(null)} aria-current={!active ? 'page' : undefined} scroll={false}>{L('search.all')} <span>{all.length}</span></Link>
          {KINDS.map((k) => (
            <Link key={k} href={href(k)} aria-current={active === k ? 'page' : undefined} className={count(k) ? '' : 'is-zero'} scroll={false}>
              {tabName[k]} <span>{count(k)}</span>
            </Link>
          ))}
        </nav>

        {hits.length === 0 ? (
          <div className="sp-empty">
            <p>{L('search.none')}</p>
            <Link className="btn btn-line" href={`/${lang}/koyler`}><span>{L('vil.title')}</span><Ico name="arrow" /></Link>
          </div>
        ) : (
          <ol className="sp-results" key={`${query}|${active ?? ''}`}>
            {hits.map((h, i) => (
              <li key={h.key} className={`k-${h.kind}`} style={css({ '--i': Math.min(i, 10) })}>
                <span className="sp-kind">{h.label}</span>
                <Link href={h.href} className="sp-link">
                  <span className="ul"><Mark text={h.title} q={query} /></span>
                  <Ico name="arrow" />
                </Link>
                {h.note && <p><Mark text={h.note} q={query} /></p>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
