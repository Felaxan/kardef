import { notFound } from 'next/navigation'
import React from 'react'
import { ListHead } from '@/components/site/List'
import { LEGAL, LEGAL_UPDATED } from '@/i18n/legal'
import { fmt, isLang, type Lang } from '@/i18n/ui'
import { cms, loc } from '@/lib/cms'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: P) {
  const { lang } = await params
  return isLang(lang) ? { title: LEGAL[lang].title } : {}
}

const AND: Record<Lang, string> = { tr: ' ve ', ku: ' ve ', zza: ' ve ', en: ' and ', de: ' und ', nl: ' en ', fr: ' et ' }
const css = (v: Record<string, string | number>) => v as React.CSSProperties

/** {org} ve {mail} yer tutucularını kurum kayıtlarından doldurur */
function Fill({ text, org, mails, noMail, orgHref }: { text: string; org: string; mails: string[]; noMail: string; orgHref: string }) {
  return (
    <>
      {text.split(/(\{org\}|\{mail\})/).map((part, i) => {
        if (part === '{org}') return <b key={i}>{org}</b>
        if (part === '{mail}') {
          if (!mails.length) return <a key={i} href={orgHref}>{noMail}</a>
          return (
            <React.Fragment key={i}>
              {mails.map((m, j) => (
                <React.Fragment key={m}>{j > 0 && ' / '}<a href={`mailto:${m}`}>{m}</a></React.Fragment>
              ))}
            </React.Fragment>
          )
        }
        return <React.Fragment key={i}>{part}</React.Fragment>
      })}
    </>
  )
}

export default async function PrivacyPage({ params }: P) {
  const { lang: raw } = await params
  if (!isLang(raw)) notFound()
  const lang: Lang = raw
  const T = LEGAL[lang]
  const textLang: Lang = T === LEGAL.tr ? 'tr' : lang
  const payload = await cms()
  const orgs = await payload.find({ collection: 'organizations', sort: 'founded', limit: 10, depth: 0, locale: loc(lang) })
  const org = orgs.docs.map((o) => (o.name && o.abbr ? `${o.name} (${o.abbr})` : o.name || o.abbr)).filter(Boolean).join(AND[lang]) || 'KAR-DEF'
  const mails = [...new Set(orgs.docs.map((o) => o.contact?.email).filter((m): m is string => Boolean(m)))]
  const fill = (text: string) => <Fill text={text} org={org} mails={mails} noMail={T.noMail} orgHref={`/${lang}/kurumlar`} />

  return (
    <div className="story list-page legal-page">
      <div className="wrap story-top">
        <ListHead lang={lang} kicker={T.kvkk} title={T.title} lede={T.lede} />
        <nav className="legal-toc intro" style={css({ '--d': 4 })} aria-label={T.title}>
          <a href="#kvkk">{T.kvkk}</a>
          <a href="#cerez">{T.cookies}</a>
          <span>{T.updated}: {fmt(lang, LEGAL_UPDATED)}</span>
        </nav>

        <div className="legal-body" lang={textLang}>
          <section id="kvkk" className="legal-part" data-reveal="">
            <h2>{T.kvkk}</h2>
            {T.kvkkSections.map((s, i) => (
              <div key={i} id={s.id} className="legal-sec">
                <h3>{s.h}</h3>
                {s.p?.map((p, j) => <p key={j}>{fill(p)}</p>)}
                {s.list && <ul>{s.list.map((li, j) => <li key={j}>{fill(li)}</li>)}</ul>}
              </div>
            ))}
          </section>

          <section id="cerez" className="legal-part" data-reveal="">
            <h2>{T.cookies}</h2>
            {T.cookieIntro.map((p, j) => <p key={j}>{p}</p>)}
            <div className="legal-table">
              <table>
                <thead><tr>{T.cookieHead.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
                <tbody>
                  {T.cookieRows.map((r) => (
                    <tr key={r[0]}><th scope="row"><code>{r[0]}</code></th><td>{r[1]}</td><td>{r[2]}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            {T.cookieOutro.map((p, j) => <p key={j}>{p}</p>)}
          </section>
        </div>
      </div>
    </div>
  )
}
