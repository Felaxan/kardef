import Link from 'next/link'
import React from 'react'
import { AutoNote, Crumbs, DateTile, daysUntil, Files, KurumSeal, Prose, WordTitle } from '@/components/site/Article'
import { Ico } from '@/components/site/Icons'
import { Share } from '@/components/site/Share'
import { fmt, t } from '@/i18n/ui'
import { hasRichText, loc, mediaUrl } from '@/lib/cms'
import { bySlug } from '@/lib/detail'
import { announcementTypeLabel, kurumLabel } from '@/lib/labels'
import type { Announcement, Village } from '@/payload-types'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: P) {
  const { lang, slug } = await params
  const { doc } = await bySlug<Announcement>('announcements', lang, slug, 0)
  return { title: doc.title }
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toLocaleUpperCase('tr')

export default async function AnnouncementPage({ params }: P) {
  const { lang: raw, slug } = await params
  const { doc: a, lang, payload } = await bySlug<Announcement>('announcements', raw, slug)
  const L = (k: string) => t(lang, k)
  const type = a.type ?? 'genel'
  const v = type === 'vefat' ? a.vefat : null
  const village = v?.village && typeof v.village === 'object' ? (v.village as Village) : null
  const photo = mediaUrl(v?.photo, 'thumbnail')
  const files = (a.attachments ?? []) as never[]
  const hasBody = hasRichText(a.content) || files.length > 0
  const shareLabels = { share: L('share'), copy: L('copy'), copied: L('copied') }

  const others = await payload.find({
    collection: 'announcements', where: { id: { not_equals: a.id } },
    sort: '-publishedAt', limit: 4, depth: 0, locale: loc(lang), overrideAccess: false,
  })

  /* Türüne göre öne çıkan bilgi kartı */
  let panel: React.ReactNode = null
  if (type === 'vefat' && v?.name) {
    panel = (
      <section className="memorial intro" style={css({ '--d': 4 })}>
        <div className="m-person">
          {photo ? <img className="m-photo" src={photo} alt={v.name} /> : <span className="m-photo m-mono" aria-hidden="true">{initials(v.name)}</span>}
          <div>
            <p className="m-name">{v.name}</p>
            <p className="m-sub">
              {village && <Link href={`/${lang}/koy/${village.slug}`}>{village.name}</Link>}
              {village && v.date && ' · '}
              {v.date && <time>{fmt(lang, v.date)}</time>}
            </p>
          </div>
        </div>
        {(v.funeralTime || v.funeralPlace || v.condolence) && (
          <dl className="m-info">
            {(v.funeralTime || v.funeralPlace) && (
              <div><dt>{L('not.funeral')}</dt><dd>{v.funeralTime && <b>{fmt(lang, v.funeralTime, 'datetime')}</b>}{v.funeralPlace}</dd></div>
            )}
            {v.condolence && <div><dt>{L('not.condolence')}</dt><dd>{v.condolence}</dd></div>}
          </dl>
        )}
      </section>
    )
  } else if (type === 'burs' && a.burs?.deadline) {
    const left = daysUntil(a.burs.deadline)
    const open = left >= 0
    panel = (
      <section className={`deadline intro${open ? '' : ' is-closed'}`} style={css({ '--d': 4 })}>
        <div className="dl-count">
          {open ? <><b data-count={left}>{left}</b><span>{L('days.left')}</span></> : <b className="dl-closed">{L('not.closed')}</b>}
        </div>
        <div className="dl-info">
          <span>{L('not.deadline')}</span>
          <strong>{fmt(lang, a.burs.deadline, 'full')}</strong>
          {open && a.burs.applyLink && (
            <a className="btn btn-brand" href={a.burs.applyLink} target="_blank" rel="noreferrer"><span>{L('not.apply')}</span><Ico name="arrow" /></a>
          )}
        </div>
        {open && <span className="dl-bar" aria-hidden="true" style={css({ '--p': Math.max(0.04, Math.min(1, 1 - left / 60)) })} />}
      </section>
    )
  } else if (type === 'toplanti' && (a.toplanti?.date || a.toplanti?.place)) {
    panel = (
      <section className="meeting intro" style={css({ '--d': 4 })}>
        {a.toplanti?.date && <DateTile lang={lang} date={a.toplanti.date} />}
        <dl>
          {a.toplanti?.date && <div><dt>{L('ev.when')}</dt><dd>{fmt(lang, a.toplanti.date, 'full')}<small>{fmt(lang, a.toplanti.date, 'time')}</small></dd></div>}
          {a.toplanti?.place && <div><dt>{L('ev.where')}</dt><dd>{a.toplanti.place}</dd></div>}
        </dl>
      </section>
    )
  }

  return (
    <article className={`story an-page an--${type}`}>
      <div className="wrap story-grid story-top">
        <div className="story-col">
          <Crumbs lang={lang} href={`/${lang}/duyurular`} label={L('not.title')} />
          <header className="story-head">
            <div className="story-tags intro" style={css({ '--d': 0 })}>
              <span className="kicker">{announcementTypeLabel(lang, type)}</span>
            </div>
            <WordTitle text={a.title} />
            <div className="story-byline intro" style={css({ '--d': 3 })}>
              <KurumSeal kurum={a.kurum} />
              <div className="who"><b>{kurumLabel(a.kurum)}</b><span>{L('not.by')}</span></div>
              <div className="when">
                <time dateTime={a.publishedAt ?? undefined}>{fmt(lang, a.publishedAt, 'datetime')}</time>
              </div>
            </div>
            <AutoNote lang={lang} autoTr={a.autoTr} trHref={`/tr/duyuru/${a.slug}`} />
          </header>
          {panel}
        </div>
      </div>

      <div className={`wrap story-grid story-body${hasBody ? "" : " story-body--short"}`}>
        {hasBody && <aside className="story-rail"><Share title={a.title} labels={shareLabels} /></aside>}
        <div className="story-col">
          {hasBody && (
            <div className="story-text prose-reveal">
              <Prose data={a.content} />
              <Files files={files} lang={lang} />
            </div>
          )}
          <div className="story-foot">
            <div className="story-chips">
              <span>{announcementTypeLabel(lang, type)}</span>
              {village && <Link href={`/${lang}/koy/${village.slug}`}>{village.name}</Link>}
              <span>{kurumLabel(a.kurum)}</span>
            </div>
            <Share title={a.title} labels={shareLabels} compact />
          </div>
        </div>
      </div>

      {others.docs.length > 0 && (
        <section className="wrap related related--narrow">
          <header className="sec-head" data-reveal="">
            <h2>{L('not.more')}</h2>
            <Link href={`/${lang}/duyurular`} className="more"><span>{L('not.all')}</span><Ico name="arrow" /></Link>
          </header>
          <ul className="notices">
            {others.docs.map((n, i) => (
              <li key={n.id} data-reveal="" style={css({ '--i': i })}>
                <span className={`cat ${n.type}`}>{announcementTypeLabel(lang, n.type)}</span>
                <Link href={`/${lang}/duyuru/${n.slug}`}><span className="ul">{n.title}</span></Link>
                <time>{fmt(lang, n.publishedAt, 'dm')}</time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
