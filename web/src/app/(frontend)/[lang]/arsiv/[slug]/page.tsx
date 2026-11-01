import Link from 'next/link'
import React from 'react'
import { ArticleHead, Crumbs, Files, Prose } from '@/components/site/Article'
import { Ico } from '@/components/site/Icons'
import { decadeLabel, fmt, t } from '@/i18n/ui'
import { hasRichText, youTubeId } from '@/lib/cms'
import { bySlug } from '@/lib/detail'
import { archiveTypeLabel, kurumLabel } from '@/lib/labels'
import type { Archive as ArchiveItem, Village } from '@/payload-types'

export const dynamic = 'force-dynamic'
type P = { params: Promise<{ lang: string; slug: string }> }

export async function generateMetadata({ params }: P) {
  const { lang, slug } = await params
  const { doc } = await bySlug<ArchiveItem>('archive', lang, slug, 0)
  return { title: doc.title }
}

export default async function ArchivePage({ params }: P) {
  const { lang: raw, slug } = await params
  const { doc: a, lang } = await bySlug<ArchiveItem>('archive', raw, slug)
  const L = (k: string) => t(lang, k)
  const village = a.village && typeof a.village === 'object' ? (a.village as Village) : null
  const yt = youTubeId(a.videoUrl)

  // Tarih: gün+ay+yıl biliniyorsa tam tarih, yoksa yıl (yaklaşıksa dönem)
  const date =
    a.day && a.month
      ? fmt(lang, new Date(Date.UTC(a.year, Number(a.month) - 1, a.day, 12)))
      : a.approximate
        ? `${L('arc.approx')} ${a.year} · ${decadeLabel(lang, a.decade ?? Math.floor(a.year / 10) * 10)}`
        : String(a.year)

  return (
    <article className="wrap article page-enter">
      <Crumbs lang={lang} href={`/${lang}#arsiv`} label={L('arc.kicker')} />
      <ArticleHead kicker={archiveTypeLabel(lang, a.type)} title={a.title} meta={<><span><b>{date}</b></span>{village && <Link href={`/${lang}/koy/${village.slug}`}>{village.name}</Link>}</>} />
      <div className="art-body">
        <div>
          <Files files={a.files as never} lang={lang} />
          {yt && (
            <p style={{ marginTop: 20 }}>
              <a className="btn btn-brand" href={`https://www.youtube.com/watch?v=${yt}`} target="_blank" rel="noreferrer"><span>{L('arc.watch')}</span><Ico name="arrow" /></a>
            </p>
          )}
          <div style={{ marginTop: 28 }}><Prose data={a.description} /></div>
          {hasRichText(a.transcript) && (
            <>
              <h2 className="sec-label" style={{ marginTop: 36, marginBottom: 16 }}>{L('arc.transcript')}</h2>
              <Prose data={a.transcript} />
            </>
          )}
        </div>
        <aside className="facts">
          <dl>
            <div><dt>{L('arc.bytype')}</dt><dd>{archiveTypeLabel(lang, a.type)}</dd></div>
            <div><dt>{L('ev.when')}</dt><dd>{date}</dd></div>
            {(village || a.location) && <div><dt>{L('ev.where')}</dt><dd>{[village?.name, a.location].filter(Boolean).join(', ')}</dd></div>}
            {a.donor && <div><dt>{L('arc.donor')}</dt><dd>{a.donor}</dd></div>}
            {a.people && a.people.length > 0 && (
              <div><dt>{L('arc.people')}</dt><dd className="tags">{a.people.map((p) => <span key={p}>{p}</span>)}</dd></div>
            )}
            <div><dt>{L('org.title')}</dt><dd>{kurumLabel(a.kurum)}</dd></div>
          </dl>
          <Link className="btn btn-brand" href={`/${lang}#katki`}><span>{L('cta.katki')}</span><Ico name="arrow" /></Link>
        </aside>
      </div>
    </article>
  )
}
