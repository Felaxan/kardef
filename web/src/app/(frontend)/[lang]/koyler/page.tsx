import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { Crumbs } from '@/components/site/Article'
import { isLang, t, type Lang } from '@/i18n/ui'
import { cms } from '@/lib/cms'
import { ALPHABET, firstLetter } from '@/lib/labels'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: P) {
  const { lang } = await params
  return isLang(lang) ? { title: t(lang, 'vil.title') } : {}
}

export default async function VillagesPage({ params }: P) {
  const { lang: raw } = await params
  if (!isLang(raw)) notFound()
  const lang: Lang = raw
  const payload = await cms()
  const { docs } = await payload.find({ collection: 'villages', sort: 'name', limit: 1000, pagination: false, depth: 0, select: { name: true, slug: true, type: true, otherNames: true } })

  const groups = new Map<string, typeof docs>()
  for (const v of [...docs].sort((a, b) => a.name.localeCompare(b.name, 'tr'))) {
    const ch = firstLetter(v.name)
    groups.set(ch, [...(groups.get(ch) ?? []), v])
  }
  const typeLabel = { koy: '', mahalle: 'mahalle', mezra: 'mezra' } as Record<string, string>

  return (
    <div className="wrap article page-enter">
      <Crumbs lang={lang} />
      <header className="art-head">
        <span className="kicker intro">{t(lang, 'nav.koyler')}</span>
        <h1 className="intro" style={{ '--d': 1 } as React.CSSProperties}>{t(lang, 'vil.title')}</h1>
        <p className="dek intro" style={{ '--d': 2 } as React.CSSProperties}>{t(lang, 'vil.lede')}</p>
      </header>
      <nav className="letters" aria-label={t(lang, 'vil.title')}>
        {ALPHABET.filter((ch) => groups.has(ch)).map((ch) => <a key={ch} href={`#harf-${ch}`}>{ch}</a>)}
      </nav>
      <div className="village-groups">
        {[...groups.entries()].map(([ch, list], i) => (
          <section key={ch} id={`harf-${ch}`} className="village-group" data-reveal="" style={{ '--i': i % 6 } as React.CSSProperties}>
            <h2>{ch}</h2>
            <ul>
              {list.map((v) => (
                <li key={v.id}>
                  <Link href={`/${lang}/koy/${v.slug}`}>
                    {v.name}
                    <small>{[typeLabel[v.type ?? 'koy'], ...(v.otherNames ?? [])].filter(Boolean).join(' · ')}</small>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {docs.length === 0 && <p className="empty">—</p>}
      </div>
    </div>
  )
}
