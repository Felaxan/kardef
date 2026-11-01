import React from 'react'
import { ArticleHead, Crumbs, HeroFigure, Prose } from '@/components/site/Article'
import { Ico } from '@/components/site/Icons'
import { fmt, t } from '@/i18n/ui'
import { bySlug } from '@/lib/detail'
import { kurumLabel } from '@/lib/labels'
import type { Event } from '@/payload-types'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: P) {
  const { lang, slug } = await params
  const { doc } = await bySlug<Event>('events', lang, slug, 0)
  return { title: doc.title }
}

export default async function EventPage({ params }: P) {
  const { lang: raw, slug } = await params
  const { doc: e, lang } = await bySlug<Event>('events', raw, slug)
  const L = (k: string) => t(lang, k)
  const region = e.region === 'avrupa' ? L('ev.eu') : e.region === 'online' ? L('ev.online') : L('ev.tr')
  const tz = e.region === 'avrupa' ? 'Europe/Berlin' : 'Europe/Istanbul'
  const when = fmt(lang, e.startDate, 'datetime', tz) + (e.endDate ? ` – ${fmt(lang, e.endDate, 'datetime', tz)}` : '')
  const where = [e.place, e.address].filter(Boolean).join('\n') || region
  const isLink = (s?: string | null) => !!s && /^https?:\/\//.test(s)

  return (
    <article className="wrap article page-enter">
      <Crumbs lang={lang} href={`/${lang}#etkinlikler`} label={L('ev.title')} />
      <ArticleHead kicker={region} title={e.title} meta={<><time>{when}</time><span>{kurumLabel(e.kurum)}</span></>} />
      <HeroFigure media={e.image} lang={lang} />
      <div className="art-body">
        <Prose data={e.description} />
        <aside className={`facts${e.region === 'avrupa' || e.kurum === 'avkardep' ? ' av' : ''}`}>
          <dl>
            <div><dt>{L('ev.when')}</dt><dd>{when}</dd></div>
            <div><dt>{L('ev.where')}</dt><dd>{where}</dd></div>
            {e.registration?.required && e.registration.link && !isLink(e.registration.link) && (
              <div><dt>{L('ev.register')}</dt><dd>{e.registration.link}</dd></div>
            )}
            <div><dt>{L('org.title')}</dt><dd>{kurumLabel(e.kurum)}</dd></div>
          </dl>
          {e.region === 'online' && e.onlineLink && (
            <a className="btn btn-brand" href={e.onlineLink} target="_blank" rel="noreferrer"><span>{L('ev.join')}</span><Ico name="arrow" /></a>
          )}
          {e.registration?.required && isLink(e.registration.link) && (
            <a className="btn btn-brand" href={e.registration.link!} target="_blank" rel="noreferrer"><span>{L('ev.register')}</span><Ico name="arrow" /></a>
          )}
        </aside>
      </div>
    </article>
  )
}
