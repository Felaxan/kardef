import Link from 'next/link'
import React from 'react'
import { ArticleHead, Crumbs, Files, HeroFigure, Prose } from '@/components/site/Article'
import { fmt, t } from '@/i18n/ui'
import { hasRichText, loc } from '@/lib/cms'
import { bySlug } from '@/lib/detail'
import { archiveTypeLabel, archiveYear, kurumLabel } from '@/lib/labels'
import type { Village } from '@/payload-types'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: P) {
  const { lang, slug } = await params
  const { doc } = await bySlug<Village>('villages', lang, slug, 0)
  return { title: doc.name }
}

export default async function VillagePage({ params }: P) {
  const { lang: raw, slug } = await params
  const { doc: v, lang, payload } = await bySlug<Village>('villages', raw, slug)
  const L = (k: string) => t(lang, k)
  const [posts, archive] = await Promise.all([
    payload.find({ collection: 'posts', where: { village: { equals: v.id } }, sort: '-publishedAt', limit: 8, depth: 0, locale: loc(lang), overrideAccess: false }),
    payload.find({ collection: 'archive', where: { village: { equals: v.id } }, sort: 'year', limit: 20, depth: 0, locale: loc(lang), overrideAccess: false }),
  ])

  return (
    <article className="wrap article page-enter">
      <Crumbs lang={lang} href={`/${lang}/koyler`} label={L('vil.all')} />
      <ArticleHead kicker={L('vil.title')} title={v.name} dek={v.otherNames?.length ? v.otherNames.join(' · ') : null} />
      <HeroFigure media={v.coverImage} lang={lang} />
      <div className="art-body">
        <div>
          {hasRichText(v.history) ? <Prose data={v.history} /> : <p className="empty">{L('vil.nohistory')}</p>}
          <Files files={v.gallery as never} lang={lang} />
        </div>
        <aside className="facts">
          <h2>{L('vil.news')}</h2>
          {posts.docs.length ? (
            <ul className="side-notices">
              {posts.docs.map((p) => (
                <li key={p.id}><span className="cat">{fmt(lang, p.publishedAt, 'dm')} · {kurumLabel(p.kurum)}</span><Link href={`/${lang}/haber/${p.slug}`}><span className="ul">{p.title}</span></Link></li>
              ))}
            </ul>
          ) : <p className="otd-note">—</p>}
          <h2 style={{ marginTop: 24 }}>{L('vil.archive')}</h2>
          {archive.docs.length ? (
            <ul className="side-notices">
              {archive.docs.map((a) => (
                <li key={a.id}><span className="cat">{archiveTypeLabel(lang, a.type)} · {archiveYear(lang, a)}</span><Link href={`/${lang}/arsiv/${a.slug}`}><span className="ul">{a.title}</span></Link></li>
              ))}
            </ul>
          ) : <p className="otd-note">—</p>}
        </aside>
      </div>
    </article>
  )
}
