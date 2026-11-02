import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Where } from 'payload'
import React from 'react'
import { FilterTabs, ListHead, Pager, qs } from '@/components/site/List'
import { fmt, isLang, t, type Lang } from '@/i18n/ui'
import { cms, isMedia, loc, mediaUrl } from '@/lib/cms'
import { categoryName, kurumLabel } from '@/lib/labels'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string }>; searchParams: Promise<{ kategori?: string; sayfa?: string }> }

export async function generateMetadata({ params }: P) {
  const { lang } = await params
  return isLang(lang) ? { title: t(lang, 'nav.haberler') } : {}
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties
const PER = 12

export default async function NewsList({ params, searchParams }: P) {
  const { lang: raw } = await params
  if (!isLang(raw)) notFound()
  const lang: Lang = raw
  const L = (k: string) => t(lang, k)
  const { kategori, sayfa } = await searchParams
  const page = Math.max(1, Number(sayfa) || 1)
  const payload = await cms()
  const locale = loc(lang)

  const cats = await payload.find({ collection: 'categories', sort: 'name', limit: 100, depth: 0, locale })
  const cat = cats.docs.find((c) => c.slug === kategori)
  const where: Where | undefined = cat ? { category: { equals: cat.id } } : undefined
  const [res, total] = await Promise.all([
    payload.find({ collection: 'posts', where, sort: '-publishedAt', limit: PER, page, depth: 1, locale, overrideAccess: false }),
    payload.count({ collection: 'posts', overrideAccess: false }),
  ])
  // Her kategoride kaç haber var (boş kategoriler gösterilmez)
  const counts = await Promise.all(cats.docs.map((c) => payload.count({ collection: 'posts', where: { category: { equals: c.id } }, overrideAccess: false })))
  const base = `/${lang}/haberler`
  // İlk sayfada: büyük manşet + yanında 4 başlık; geri kalanı ızgara
  const lead = page === 1 ? res.docs[0] : undefined
  const side = page === 1 ? res.docs.slice(1, 5) : []
  const rest = page === 1 ? res.docs.slice(5) : res.docs

  const card = (p: (typeof res.docs)[number], i: number) => {
    const src = mediaUrl(p.heroImage, 'card')
    return (
      <article key={p.id} className={`card${src ? '' : ' card-noimg'}`} data-reveal={src ? 'img' : ''} style={css({ '--i': i % 6 })}>
        {src && <Link href={`/${lang}/haber/${p.slug}`} className="card-img"><img src={src} alt={isMedia(p.heroImage) ? p.heroImage.alt || '' : ''} loading="lazy" /></Link>}
        {categoryName(p.category) && <span className="kicker">{categoryName(p.category)}</span>}
        <h3><Link href={`/${lang}/haber/${p.slug}`}><span className="ul">{p.title}</span></Link></h3>
        {p.excerpt && <p className="dek">{p.excerpt}</p>}
        <p className="meta"><b>{kurumLabel(p.kurum)}</b> · {fmt(lang, p.publishedAt, 'dm')}</p>
      </article>
    )
  }

  return (
    <div className="story list-page">
      <div className="wrap story-top">
        <ListHead lang={lang} kicker={L('sec.gundem')} title={L('nav.haberler')} lede={L('news.lede')} count={total.totalDocs} />
        <FilterTabs
          label={L('nav.haberler')}
          tabs={[
            { href: base, label: L('search.all'), count: total.totalDocs, active: !cat },
            ...cats.docs.map((c, i) => ({ href: qs(base, { kategori: c.slug }), label: c.name, count: counts[i].totalDocs, active: cat?.id === c.id }))
              .filter((tb) => tb.count > 0),
          ]}
        />

        {res.docs.length === 0 && <p className="empty">{L('search.none')}</p>}

        {lead && <div className={`lead-row${side.length ? '' : ' lead-row--solo'}`}>{(() => {
          const src = mediaUrl(lead.heroImage, 'hero')
          return (
            <article className={`lead${src ? '' : ' lead--noimg'}`} data-reveal="">
              {src && <Link href={`/${lang}/haber/${lead.slug}`} className="lead-img"><img src={src} alt={isMedia(lead.heroImage) ? lead.heroImage.alt || '' : ''} /></Link>}
              <div className="lead-body">
                {categoryName(lead.category) && <span className="kicker">{categoryName(lead.category)}</span>}
                <h2><Link href={`/${lang}/haber/${lead.slug}`}><span className="ul">{lead.title}</span></Link></h2>
                {lead.excerpt && <p className="dek">{lead.excerpt}</p>}
                <p className="meta"><b>{kurumLabel(lead.kurum)}</b> · {fmt(lang, lead.publishedAt, 'datetime')}</p>
              </div>
            </article>
          )
        })()}
          {side.length > 0 && (
            <ol className="lead-side story-latest" data-reveal="" style={css({ '--i': 1 })}>
              {side.map((r, i) => (
                <li key={r.id}>
                  <span className="n">{String(i + 2).padStart(2, '0')}</span>
                  <div>
                    {categoryName(r.category) && <span className="kicker">{categoryName(r.category)}</span>}
                    <Link href={`/${lang}/haber/${r.slug}`}><span className="ul">{r.title}</span></Link>
                    <time>{fmt(lang, r.publishedAt, 'dm')}</time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>}

        {rest.length > 0 && <div className="cards cards--3 list-cards">{rest.map((p, i) => card(p, i))}</div>}

        <Pager lang={lang} page={page} pages={res.totalPages} href={(p) => qs(base, { kategori: cat?.slug, sayfa: p })} />
      </div>
    </div>
  )
}
