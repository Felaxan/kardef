import { notFound } from 'next/navigation'
import React from 'react'
import { Prose } from '@/components/site/Article'
import { Ico } from '@/components/site/Icons'
import { ListHead } from '@/components/site/List'
import { isLang, t, type Lang } from '@/i18n/ui'
import { cms, hasRichText, loc, mediaUrl } from '@/lib/cms'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: P) {
  const { lang } = await params
  return isLang(lang) ? { title: t(lang, 'org.title') } : {}
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties

export default async function OrganizationsPage({ params }: P) {
  const { lang: raw } = await params
  if (!isLang(raw)) notFound()
  const lang: Lang = raw
  const L = (k: string) => t(lang, k)
  const payload = await cms()
  const orgs = await payload.find({ collection: 'organizations', sort: 'founded', limit: 20, depth: 1, locale: loc(lang) })

  return (
    <div className="story list-page">
      <div className="wrap story-top">
        <ListHead lang={lang} kicker={L('nav.kurumlar')} title={L('org.title')} lede={L('org.lede')} />
        <div className="org-pages">
          {orgs.docs.map((o, i) => {
            const av = o.color === 'mor'
            const desc = av ? L('org.av.desc') : L('org.kardef.desc')
            return (
              <article key={o.id} id={o.abbr?.toLowerCase()} className={`org-page${av ? ' av' : ''}`} data-reveal="" style={css({ '--i': i })}>
                <div className="org-page-side">
                  {mediaUrl(o.logo) && <img className="org-page-seal" src={mediaUrl(o.logo)!} alt={o.abbr} loading="lazy" />}
                  <dl>
                    {o.founded && <div><dt>{L('org.since')}</dt><dd>{o.founded}</dd></div>}
                    {o.base && <div><dt>{L('org.base')}</dt><dd>{o.base}</dd></div>}
                  </dl>
                </div>
                <div className="org-page-main">
                  <p className="org-abbr">{o.abbr}</p>
                  <h2>{o.name}</h2>
                  <p className="org-lead">{lang === 'tr' && o.description ? o.description : o.description || desc}</p>
                  {hasRichText(o.about) && <div className="story-text"><Prose data={o.about} /></div>}
                  {(o.contact?.email || o.contact?.phone || o.contact?.address) && (
                    <div className="org-contact">
                      <h3>{L('org.contact')}</h3>
                      {o.contact?.email && <a href={`mailto:${o.contact.email}`} className="more"><span>{o.contact.email}</span><Ico name="arrow" /></a>}
                      {o.contact?.phone && <a href={`tel:${o.contact.phone.replace(/[^\d+]/g, '')}`} className="more"><span>{o.contact.phone}</span><Ico name="arrow" /></a>}
                      {o.contact?.address && <p>{o.contact.address}</p>}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
