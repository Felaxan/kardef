import Link from 'next/link'
import React from 'react'
import { AutoNote, Crumbs, Prose } from '@/components/site/Article'
import { Ico } from '@/components/site/Icons'
import { ParallaxImage } from '@/components/site/ParallaxImage'
import { Share } from '@/components/site/Share'
import { fmt, t } from '@/i18n/ui'
import { isMedia, loc, mediaUrl, richTextPlain } from '@/lib/cms'
import { bySlug } from '@/lib/detail'
import { categoryName, kurumLabel } from '@/lib/labels'
import type { Post, Village } from '@/payload-types'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: P) {
  const { lang, slug } = await params
  const { doc } = await bySlug<Post>('posts', lang, slug, 1)
  return { title: doc.title, description: doc.excerpt ?? undefined, openGraph: { images: mediaUrl(doc.heroImage, 'hero') ?? undefined } }
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toLocaleUpperCase('tr')

export default async function NewsPage({ params }: P) {
  const { lang: raw, slug } = await params
  const { doc: p, lang, payload } = await bySlug<Post>('posts', raw, slug)
  const L = (k: string) => t(lang, k)
  const locale = loc(lang)
  const catId = p.category && typeof p.category === 'object' ? p.category.id : p.category

  const [related, latest] = await Promise.all([
    payload.find({
      collection: 'posts',
      where: { and: [{ id: { not_equals: p.id } }, ...(catId ? [{ category: { equals: catId } }] : [])] },
      sort: '-publishedAt', limit: 3, depth: 1, locale, overrideAccess: false,
    }),
    payload.find({ collection: 'posts', where: { id: { not_equals: p.id } }, sort: '-publishedAt', limit: 5, depth: 1, locale, overrideAccess: false }),
  ])
  const more = related.docs.length >= 2 ? related.docs : latest.docs.slice(0, 3)

  const village = p.village && typeof p.village === 'object' ? (p.village as Village) : null
  const author = p.authorName || L('news.desk')
  const words = `${p.excerpt ?? ''} ${richTextPlain(p.content)}`.trim().split(/\s+/).length
  const minutes = Math.max(1, Math.round(words / 200))
  const hero = mediaUrl(p.heroImage, 'hero')
  const heroMedia = isMedia(p.heroImage) ? p.heroImage : null
  const caption = heroMedia && [heroMedia.caption, heroMedia.credit && `${L('foot.photos')}: ${heroMedia.credit.replace(/, Wikimedia Commons$/, '')}`].filter(Boolean).join(' · ')
  const shareLabels = { share: L('share'), copy: L('copy'), copied: L('copied') }
  const titleWords = p.title.split(/\s+/)

  return (
    <article className={`story${hero ? '' : ' story--noimg'}`}>
      <div className="wrap story-grid story-top">
        <div className="story-col">
          <Crumbs lang={lang} href={`/${lang}/haberler`} label={L('nav.haberler')} />
          <header className="story-head">
            <div className="story-tags intro" style={css({ '--d': 0 })}>
              {categoryName(p.category) && <span className="kicker">{categoryName(p.category)}</span>}
              {village && <Link href={`/${lang}/koy/${village.slug}`} className="story-place"><Ico name="pin" />{village.name}</Link>}
            </div>
            <h1 className="story-title" aria-label={p.title}>
              {titleWords.map((w, i) => (
                <React.Fragment key={i}>
                  <span className="w" aria-hidden="true"><span style={css({ '--w': i })}>{w}</span></span>{' '}
                </React.Fragment>
              ))}
            </h1>
            {p.excerpt && <p className="story-dek intro" style={css({ '--d': 3 })}>{p.excerpt}</p>}
            <div className="story-byline intro" style={css({ '--d': 4 })}>
              <span className="avatar" aria-hidden="true">{initials(author)}</span>
              <div className="who"><b>{author}</b><span>{kurumLabel(p.kurum)}</span></div>
              <div className="when">
                <time dateTime={p.publishedAt ?? undefined}>{fmt(lang, p.publishedAt, 'datetime')}</time>
                <span>{minutes} {L('readmin')}</span>
              </div>
            </div>
            <AutoNote lang={lang} autoTr={p.autoTr} trHref={`/tr/haber/${p.slug}`} />
          </header>
        </div>
      </div>

      {hero && (
        <figure className="wrap story-hero">
          <div className="frame"><ParallaxImage src={hero} alt={heroMedia?.alt || ''} /></div>
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      )}

      <div className="wrap story-grid story-body">
        <aside className="story-rail"><Share title={p.title} labels={shareLabels} /></aside>
        <div className="story-col">
          <div className="story-text prose-reveal">
            <Prose data={p.content} />
          </div>
          <div className="story-foot">
            <div className="story-chips">
              {categoryName(p.category) && <span>{categoryName(p.category)}</span>}
              {village && <Link href={`/${lang}/koy/${village.slug}`}>{village.name}</Link>}
              <span>{kurumLabel(p.kurum)}</span>
            </div>
            <Share title={p.title} labels={shareLabels} compact />
          </div>
        </div>
        <aside className="story-side">
          <h2 className="sec-label">{L('side.latest')}</h2>
          <ol className="story-latest">
            {latest.docs.map((r, i) => (
              <li key={r.id}>
                <span className="n">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <Link href={`/${lang}/haber/${r.slug}`}><span className="ul">{r.title}</span></Link>
                  <time>{fmt(lang, r.publishedAt, 'dm')}</time>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      {more.length > 0 && (
        <section className="wrap related">
          <header className="sec-head" data-reveal=""><h2>{L('related')}</h2></header>
          <div className="cards cards--3">
            {more.map((r, i) => {
              const src = mediaUrl(r.heroImage, 'card')
              return (
                <article key={r.id} className={`card${src ? '' : ' card-noimg'}`} data-reveal={src ? 'img' : ''} style={css({ '--i': i })}>
                  {src && <Link href={`/${lang}/haber/${r.slug}`} className="card-img"><img src={src} alt={isMedia(r.heroImage) ? r.heroImage.alt || '' : ''} loading="lazy" /></Link>}
                  {categoryName(r.category) && <span className="kicker">{categoryName(r.category)}</span>}
                  <h3><Link href={`/${lang}/haber/${r.slug}`}><span className="ul">{r.title}</span></Link></h3>
                  {r.excerpt && <p className="dek">{r.excerpt}</p>}
                  <p className="meta"><b>{kurumLabel(r.kurum)}</b> · {fmt(lang, r.publishedAt, 'dm')}</p>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </article>
  )
}
