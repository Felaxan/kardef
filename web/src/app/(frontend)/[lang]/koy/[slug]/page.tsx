import Link from 'next/link'
import React from 'react'
import { AutoNote, Crumbs, Files, Prose, WordTitle } from '@/components/site/Article'
import { Ico } from '@/components/site/Icons'
import { ParallaxImage } from '@/components/site/ParallaxImage'
import { Share } from '@/components/site/Share'
import { fmt, t } from '@/i18n/ui'
import { hasRichText, isMedia, loc, mediaUrl } from '@/lib/cms'
import { bySlug } from '@/lib/detail'
import { archiveTypeLabel, archiveYear, categoryName, kurumLabel } from '@/lib/labels'
import type { Village } from '@/payload-types'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: P) {
  const { lang, slug } = await params
  const { doc } = await bySlug<Village>('villages', lang, slug, 1)
  return { title: doc.name, openGraph: { images: mediaUrl(doc.coverImage, 'hero') ?? undefined } }
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties

export default async function VillagePage({ params }: P) {
  const { lang: raw, slug } = await params
  const { doc: v, lang, payload } = await bySlug<Village>('villages', raw, slug)
  const L = (k: string) => t(lang, k)
  const locale = loc(lang)
  const [posts, archive] = await Promise.all([
    payload.find({ collection: 'posts', where: { village: { equals: v.id } }, sort: '-publishedAt', limit: 6, depth: 1, locale, overrideAccess: false }),
    payload.find({ collection: 'archive', where: { village: { equals: v.id } }, sort: 'year', limit: 50, depth: 0, locale, overrideAccess: false }),
  ])

  const cover = mediaUrl(v.coverImage, 'hero')
  const coverMedia = isMedia(v.coverImage) ? v.coverImage : null
  const credit = coverMedia?.credit?.replace(/, Wikimedia Commons$/, '')
  const gallery = (v.gallery ?? []) as never[]
  const loc2 = v.location?.lat != null && v.location?.lng != null ? `${v.location.lat},${v.location.lng}` : null
  const shareLabels = { share: L('share'), copy: L('copy'), copied: L('copied') }

  return (
    <article className={`vil-page${cover ? '' : ' vil--nocover'}`}>
      <header className="vil-cover">
        {cover && <div className="vil-cover-img"><ParallaxImage src={cover} alt={coverMedia?.alt || v.name} /></div>}
        <div className="wrap vil-cover-in">
          <Crumbs lang={lang} href={`/${lang}/koyler`} label={L('vil.all')} />
          <div className="vil-head">
            <span className="kicker intro" style={css({ '--d': 0 })}>{L('vil.title')}</span>
            <WordTitle text={v.name} className="story-title vil-title" delay={1} />
            {v.otherNames?.length ? <p className="vil-aka intro" style={css({ '--d': 3 })}>{v.otherNames.join(' · ')}</p> : null}
            <AutoNote lang={lang} autoTr={v.autoTr} trHref={`/tr/koy/${v.slug}`} />
          </div>
          <div className="vil-stats intro" style={css({ '--d': 4 })}>
            <a href="#koy-haberleri"><b data-count={posts.totalDocs}>{posts.totalDocs}</b><span>{L('vil.news')}</span></a>
            <a href="#koy-arsivi"><b data-count={archive.totalDocs}>{archive.totalDocs}</b><span>{L('vil.archive')}</span></a>
            {loc2 && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${loc2}`} target="_blank" rel="noreferrer" className="vil-map">
                <Ico name="pin" /><span>{L('ev.map')}</span>
              </a>
            )}
          </div>
        </div>
        {credit && <p className="vil-credit">{L('foot.photos')}: {credit}</p>}
      </header>

      <div className="wrap story-grid story-body vil-body">
        <aside className="story-rail"><Share title={v.name} labels={shareLabels} /></aside>
        <div className="story-col">
          {hasRichText(v.history)
            ? <div className="story-text prose-reveal"><Prose data={v.history} /></div>
            : <p className="empty">{L('vil.nohistory')}</p>}
          <Files files={gallery} lang={lang} />
        </div>
        <aside className="story-side" id="koy-arsivi">
          <h2 className="sec-label">{L('vil.archive')}</h2>
          {archive.docs.length ? (
            <ol className="vil-tl">
              {archive.docs.map((a, i) => (
                <li key={a.id} data-reveal="" style={css({ '--i': i })}>
                  <span className="y">{archiveYear(lang, a)}</span>
                  <Link href={`/${lang}/arsiv/${a.slug}`}>
                    <small>{archiveTypeLabel(lang, a.type)}</small>
                    <span className="ul">{a.title}</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <p className="vil-empty">—</p>
          )}
        </aside>
      </div>

      {posts.docs.length > 0 && (
        <section className="wrap related" id="koy-haberleri">
          <header className="sec-head" data-reveal=""><h2>{L('vil.news')}</h2></header>
          <div className="cards cards--3">
            {posts.docs.slice(0, 3).map((r, i) => {
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

      <section className="wrap" data-reveal=""><div className="vil-send">
        <p>{L('vil.send')}</p>
        <Link className="btn btn-brand" href={`/${lang}#katki`}><span>{L('cta.katki')}</span><Ico name="arrow" /></Link>
      </div></section>
    </article>
  )
}
