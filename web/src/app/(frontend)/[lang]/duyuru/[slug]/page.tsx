import Link from 'next/link'
import React from 'react'
import { ArticleHead, Crumbs, Files, Prose } from '@/components/site/Article'
import { Ico } from '@/components/site/Icons'
import { fmt, t } from '@/i18n/ui'
import { mediaUrl } from '@/lib/cms'
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

export default async function AnnouncementPage({ params }: P) {
  const { lang: raw, slug } = await params
  const { doc: a, lang } = await bySlug<Announcement>('announcements', raw, slug)
  const L = (k: string) => t(lang, k)
  const v = a.type === 'vefat' ? a.vefat : null
  const village = v?.village && typeof v.village === 'object' ? (v.village as Village) : null
  const photo = mediaUrl(v?.photo, 'thumbnail')

  const facts: [string, React.ReactNode][] = []
  facts.push([L('not.title'), announcementTypeLabel(lang, a.type)])
  if (a.type === 'vefat' && v) {
    if (v.funeralTime) facts.push([L('not.funeral'), `${fmt(lang, v.funeralTime, 'datetime')}${v.funeralPlace ? `\n${v.funeralPlace}` : ''}`])
    else if (v.funeralPlace) facts.push([L('not.funeral'), v.funeralPlace])
    if (v.condolence) facts.push([L('not.condolence'), v.condolence])
  }
  if (a.type === 'burs' && a.burs?.deadline) facts.push([L('not.deadline'), fmt(lang, a.burs.deadline)])
  if (a.type === 'toplanti' && a.toplanti?.date) facts.push([L('ev.when'), fmt(lang, a.toplanti.date, 'datetime')])
  if (a.type === 'toplanti' && a.toplanti?.place) facts.push([L('ev.where'), a.toplanti.place])
  facts.push([L('org.title'), kurumLabel(a.kurum)])

  return (
    <article className="wrap article page-enter">
      <Crumbs lang={lang} href={`/${lang}#duyurular`} label={L('not.title')} />
      <ArticleHead kicker={announcementTypeLabel(lang, a.type)} title={a.title} meta={<time>{fmt(lang, a.publishedAt, 'datetime')}</time>} />

      {v?.name && (
        <div className="obit" data-reveal="">
          {photo ? <img src={photo} alt={v.name} /> : <span className="no-photo" />}
          <div>
            <b>{v.name}</b>
            <span>{[village?.name, v.date && fmt(lang, v.date)].filter(Boolean).join(' · ')}</span>
          </div>
        </div>
      )}

      <div className="art-body">
        <div>
          <Prose data={a.content} />
          <Files files={a.attachments as never} lang={lang} />
        </div>
        <aside className={`facts${a.kurum === 'avkardep' ? ' av' : ''}`}>
          <dl>{facts.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val}</dd></div>)}</dl>
          {a.type === 'burs' && a.burs?.applyLink && (
            <a className="btn btn-brand" href={a.burs.applyLink} target="_blank" rel="noreferrer"><span>{L('not.apply')}</span><Ico name="arrow" /></a>
          )}
          {village && <Link className="more" style={{ marginTop: 14 }} href={`/${lang}/koy/${village.slug}`}><span>{village.name}</span><Ico name="arrow" /></Link>}
        </aside>
      </div>
    </article>
  )
}
