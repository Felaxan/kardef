import { notFound } from 'next/navigation'
import React from 'react'
import { Crumbs, WordTitle } from '@/components/site/Article'
import { VillageDirectory } from '@/components/site/VillageDirectory'
import { isLang, t, type Lang } from '@/i18n/ui'
import { cms } from '@/lib/cms'
import { ALPHABET, firstLetter } from '@/lib/labels'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string }> }

export async function generateMetadata({ params }: P) {
  const { lang } = await params
  return isLang(lang) ? { title: t(lang, 'vil.title') } : {}
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties

export default async function VillagesPage({ params }: P) {
  const { lang: raw } = await params
  if (!isLang(raw)) notFound()
  const lang: Lang = raw
  const L = (k: string) => t(lang, k)
  const payload = await cms()
  const { docs } = await payload.find({
    collection: 'villages', sort: 'name', limit: 1000, pagination: false, depth: 0,
    select: { name: true, slug: true, type: true, otherNames: true },
  })
  const typeLabel: Record<string, string> = { koy: '', mahalle: 'mahalle', mezra: 'mezra' }
  const rows = [...docs]
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    .map((v) => ({
      id: v.id, name: v.name, slug: v.slug ?? '', letter: firstLetter(v.name),
      note: [typeLabel[v.type ?? 'koy'], ...(v.otherNames ?? [])].filter(Boolean).join(' · '),
    }))

  return (
    <div className="story vd-page">
      <div className="wrap story-top">
        <Crumbs lang={lang} />
        <header className="vd-head">
          <div>
            <span className="kicker intro" style={css({ '--d': 0 })}>{L('nav.koyler')}</span>
            <WordTitle text={L('vil.title')} delay={1} />
            <p className="story-dek intro" style={css({ '--d': 3 })}>{L('vil.lede')}</p>
          </div>
          <p className="vd-count intro" style={css({ '--d': 4 })}>
            <b data-count={rows.length}>{rows.length}</b>
            <span>{L('vil.count')}</span>
          </p>
        </header>
        <VillageDirectory rows={rows} alphabet={ALPHABET} lang={lang} labels={{ filter: L('vil.filter'), none: L('search.none') }} />
      </div>
    </div>
  )
}
