import Link from 'next/link'
import React from 'react'
import { Crumbs, KurumSeal, Prose, WordTitle } from '@/components/site/Article'
import { ArchiveAudio } from '@/components/site/ArchiveAudio'
import { ArcVis } from '@/components/site/ArcVis'
import { Ico } from '@/components/site/Icons'
import { Share } from '@/components/site/Share'
import { TimelineCenter } from '@/components/site/TimelineCenter'
import { decadeLabel, fmt, t } from '@/i18n/ui'
import { hasRichText, isMedia, loc, mediaUrl, waveBars, youTubeId } from '@/lib/cms'
import { bySlug } from '@/lib/detail'
import { archiveTypeLabel, archiveYear, kurumLabel } from '@/lib/labels'
import type { Archive as ArchiveItem, Media, Village } from '@/payload-types'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: P) {
  const { lang, slug } = await params
  const { doc } = await bySlug<ArchiveItem>('archive', lang, slug, 1)
  const img = (doc.files ?? []).find((f) => isMedia(f) && f.mimeType?.startsWith('image'))
  return { title: doc.title, openGraph: { images: mediaUrl(img as Media | undefined, 'hero') ?? undefined } }
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties
const catalogNo = (id: number | string) => `KD-${String(id).padStart(4, '0')}`

export default async function ArchivePage({ params }: P) {
  const { lang: raw, slug } = await params
  const { doc: a, lang, payload } = await bySlug<ArchiveItem>('archive', raw, slug)
  const L = (k: string) => t(lang, k)
  const locale = loc(lang)
  const village = a.village && typeof a.village === 'object' ? (a.village as Village) : null
  const yt = youTubeId(a.videoUrl)
  const decade = a.decade ?? Math.floor(a.year / 10) * 10

  const files = (a.files ?? []).filter(isMedia)
  const images = files.filter((m) => m.mimeType?.startsWith('image'))
  const audio = files.filter((m) => m.mimeType?.startsWith('audio'))
  const other = files.filter((m) => !m.mimeType?.startsWith('image') && !m.mimeType?.startsWith('audio'))

  // Tarih: gün+ay+yıl biliniyorsa tam tarih, yoksa yıl (yaklaşıksa dönem)
  const date =
    a.day && a.month
      ? fmt(lang, new Date(Date.UTC(a.year, Number(a.month) - 1, a.day, 12)))
      : a.approximate ? `${L('arc.approx')} ${a.year}` : String(a.year)

  // Zaman çizelgesi için tüm kayıtlar (yalnızca yayımlananlar)
  const all = await payload.find({
    collection: 'archive', sort: 'year', limit: 500, pagination: false, depth: 0, locale, overrideAccess: false,
    select: { title: true, slug: true, year: true, type: true, approximate: true, decade: true },
  })
  const nearIds = all.docs
    .filter((d) => d.id !== a.id)
    .sort((x, y) => Math.abs(x.year - a.year) - Math.abs(y.year - a.year))
    .slice(0, 3)
    .map((d) => d.id)
  const near = nearIds.length
    ? (await payload.find({ collection: 'archive', where: { id: { in: nearIds } }, depth: 1, locale, overrideAccess: false })).docs
        .sort((x, y) => nearIds.indexOf(x.id) - nearIds.indexOf(y.id))
    : []

  const years = all.docs.map((d) => d.year)
  const minY = Math.floor(Math.min(...years, a.year) / 10) * 10
  const maxY = Math.ceil((Math.max(...years, a.year) + 1) / 10) * 10
  const pos = (y: number) => ((y - minY) / Math.max(1, maxY - minY)) * 100
  const ticks = Array.from({ length: (maxY - minY) / 10 + 1 }, (_, i) => minY + i * 10)

  const shareLabels = { share: L('share'), copy: L('copy'), copied: L('copied') }
  const hasText = hasRichText(a.description) || hasRichText(a.transcript)

  /* Sergilenen nesne */
  let object: React.ReactNode
  if (images.length) {
    object = (
      <div className="arc-object is-photo">
        <a className="arc-mat" href={images[0].url || '#'} target="_blank" rel="noreferrer">
          <img src={mediaUrl(images[0], 'hero') || ''} alt={images[0].alt || a.title} />
        </a>
        {(images[0].caption || images[0].credit) && <p className="arc-cap">{[images[0].caption, images[0].credit].filter(Boolean).join(' · ')}</p>}
        {images.length > 1 && (
          <div className="arc-thumbs">
            {images.slice(1).map((m) => (
              <a key={m.id} href={m.url || '#'} target="_blank" rel="noreferrer"><img src={mediaUrl(m, 'thumbnail') || ''} alt={m.alt || ''} loading="lazy" /></a>
            ))}
          </div>
        )}
      </div>
    )
  } else if (audio.length) {
    object = (
      <div className="arc-object is-audio">
        {audio.map((m) => (
          <ArchiveAudio key={m.id} src={m.url || ''} bars={waveBars(Number(a.id), 64)} labels={{ play: L('arc.play'), pause: L('arc.pause') }} />
        ))}
      </div>
    )
  } else if (yt) {
    object = (
      <div className="arc-object is-video">
        <a className="arc-yt" href={`https://www.youtube.com/watch?v=${yt}`} target="_blank" rel="noreferrer">
          <img src={`https://i.ytimg.com/vi/${yt}/hqdefault.jpg`} alt={a.title} />
          <span className="arc-yt-play"><Ico name="play" /></span>
          <span className="arc-yt-label">{L('arc.watch')}</span>
        </a>
      </div>
    )
  } else {
    object = (
      <div className="arc-object is-empty">
        <span className={`arc-vis arc-vis--big${a.type === 'audio' || a.type === 'oral' ? ' audio' : ''}`} data-reveal=""><ArcVis a={a} /></span>
        <p className="arc-nofile">{L('arc.nofile')}</p>
      </div>
    )
  }

  return (
    <article className="arc-page">
      <section className="band arc-stage-band">
        <div className="wrap">
          <Crumbs lang={lang} href={`/${lang}#arsiv`} label={L('arc.kicker')} />
          <div className="arc-top">
            <div className="arc-title-col">
              <div className="story-tags intro" style={css({ '--d': 0 })}>
                <span className="kicker">{archiveTypeLabel(lang, a.type)}</span>
                <span className="arc-no">{L('arc.no')} {catalogNo(a.id)}</span>
              </div>
              <WordTitle text={a.title} className="story-title arc-title" />
            </div>
            <p className="arc-year intro" style={css({ '--d': 2 })} aria-label={date}>
              <b>{a.year}</b>
              <span>{a.approximate ? `${L('arc.approx')} · ${decadeLabel(lang, decade)}` : decadeLabel(lang, decade)}</span>
            </p>
          </div>

          <div className="arc-stage">
            <div className="arc-stage-main intro" style={css({ '--d': 3 })}>{object}</div>
            <aside className="arc-card intro" style={css({ '--d': 4 })}>
              <h2>{L('arc.details')}</h2>
              <dl>
                <div><dt>{L('arc.bytype')}</dt><dd>{archiveTypeLabel(lang, a.type)}</dd></div>
                <div><dt>{L('ev.when')}</dt><dd>{date}</dd></div>
                {(village || a.location) && (
                  <div>
                    <dt>{L('ev.where')}</dt>
                    <dd>{village ? <Link href={`/${lang}/koy/${village.slug}`}>{village.name}</Link> : null}{village && a.location ? ', ' : ''}{a.location}</dd>
                  </div>
                )}
                {a.donor && <div><dt>{L('arc.donor')}</dt><dd>{a.donor}</dd></div>}
                {a.people && a.people.length > 0 && (
                  <div><dt>{L('arc.people')}</dt><dd className="tags">{a.people.map((p) => <span key={p}>{p}</span>)}</dd></div>
                )}
                <div><dt>{L('ev.org')}</dt><dd className="arc-org"><KurumSeal kurum={a.kurum} />{kurumLabel(a.kurum)}</dd></div>
              </dl>
              {other.length > 0 && (
                <ul className="attach">
                  {other.map((m) => <li key={m.id}><a href={m.url || '#'} target="_blank" rel="noreferrer"><Ico name="file" />{m.filename}</a></li>)}
                </ul>
              )}
              <Link className="btn btn-brand" href={`/${lang}#katki`}><span>{L('cta.katki')}</span><Ico name="arrow" /></Link>
            </aside>
          </div>
        </div>
      </section>

      <div className={`wrap story-grid story-body arc-body${hasText ? "" : " story-body--short"}`}>
        {hasText && <aside className="story-rail"><Share title={a.title} labels={shareLabels} /></aside>}
        <div className="story-col">
          {hasRichText(a.description) && <div className="story-text prose-reveal"><Prose data={a.description} /></div>}
          {hasRichText(a.transcript) && (
            <section className="transcript" data-reveal="">
              <h2 className="sec-label">{L('arc.transcript')}</h2>
              <div className="prose-reveal"><Prose data={a.transcript} /></div>
            </section>
          )}
          <div className="story-foot">
            <div className="story-chips">
              <span>{archiveTypeLabel(lang, a.type)}</span>
              <span>{decadeLabel(lang, decade)}</span>
              {village && <Link href={`/${lang}/koy/${village.slug}`}>{village.name}</Link>}
            </div>
            <Share title={a.title} labels={shareLabels} compact />
          </div>
        </div>
      </div>

      <section className="band arc-more">
        <div className="wrap">
          <h2 className="sec-label" data-reveal="">{L('arc.timeline')}</h2>
          <div className="tl" data-reveal="">
            <div className="tl-track">
              {all.docs.map((d, i) => (
                <Link
                  key={d.id}
                  href={`/${lang}/arsiv/${d.slug}`}
                  className={`tl-dot${d.id === a.id ? ' is-cur' : ''}${pos(d.year) < 14 ? ' tip-l' : pos(d.year) > 86 ? ' tip-r' : ''}`}
                  style={css({ '--x': `${pos(d.year)}%`, '--i': i })}
                  aria-current={d.id === a.id ? 'page' : undefined}
                >
                  <span className="tl-tip"><b>{archiveYear(lang, d as ArchiveItem)}</b>{d.title}</span>
                </Link>
              ))}
            </div>
            <TimelineCenter />
            <div className="tl-scale" aria-hidden="true">
              {ticks.map((y) => <span key={y} style={css({ '--x': `${pos(y)}%` })}>{y}</span>)}
            </div>
          </div>

          {near.length > 0 && (
            <>
              <h2 className="sec-label arc-near-h" data-reveal="">{L('arc.near')}</h2>
              <div className="arc-grid">
                {near.map((d, i) => (
                  <Link key={d.id} href={`/${lang}/arsiv/${d.slug}`} className="arc-item" data-reveal="" style={css({ '--i': i })}>
                    <span className={`arc-vis${d.type === 'audio' || d.type === 'oral' ? ' audio' : ''}`}><ArcVis a={d} /></span>
                    <p className="arc-meta"><span className="type">{archiveTypeLabel(lang, d.type)}</span><span>{archiveYear(lang, d)}</span></p>
                    <h3><span className="ul">{d.title}</span></h3>
                    {d.donor && <p className="arc-src">{d.donor}</p>}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </article>
  )
}
