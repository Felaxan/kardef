import Link from 'next/link'
import type { Where } from 'payload'
import React from 'react'
import { decadeLabel, t, type Lang } from '@/i18n/ui'
import { cms, loc } from '@/lib/cms'
import { archiveTypeLabel, archiveYear } from '@/lib/labels'
import type { Archive as ArchiveItem } from '@/payload-types'
import { ArcVis } from './ArcVis'
import { FilterTabs, ListHead, Pager, qs } from './List'

const css = (v: Record<string, string | number>) => v as React.CSSProperties
const ALL_TYPES: ArchiveItem['type'][] = ['photo', 'document', 'clipping', 'audio', 'video', 'oral']
const ORAL_TYPES: ArchiveItem['type'][] = ['oral', 'audio', 'video']
const PER = 24

/** Arşiv listesi (Sözlü Tarih sayfası da bunu, yalnızca ses ve görüşme kayıtlarıyla kullanır) */
export async function ArchiveList({ lang, base, oral, donem, tur, sayfa }: {
  lang: Lang; base: string; oral?: boolean; donem?: string; tur?: string; sayfa?: string
}) {
  const L = (k: string) => t(lang, k)
  const types = oral ? ORAL_TYPES : ALL_TYPES
  const type = (types as string[]).includes(tur ?? '') ? (tur as ArchiveItem['type']) : undefined
  const decade = Number(donem) || undefined
  const page = Math.max(1, Number(sayfa) || 1)
  const payload = await cms()
  const locale = loc(lang)

  const scope: Where = { type: { in: types } }
  // Süzgeç sayıları için bütün kayıtların yalnızca yıl ve türü
  const all = await payload.find({
    collection: 'archive', where: scope, limit: 5000, pagination: false, depth: 0, locale, overrideAccess: false,
    select: { year: true, decade: true, type: true },
  })
  const decOf = (a: { decade?: number | null; year: number }) => a.decade ?? Math.floor(a.year / 10) * 10
  const decades = [...new Set(all.docs.map(decOf))].sort((a, b) => a - b)

  const conds: Where[] = [scope]
  if (type) conds.push({ type: { equals: type } })
  if (decade) conds.push({ decade: { equals: decade } })
  const res = await payload.find({
    collection: 'archive', where: { and: conds }, sort: 'year', limit: PER, page, depth: 1, locale, overrideAccess: false,
  })
  const inDecade = (d?: number) => all.docs.filter((a) => !d || decOf(a) === d)
  const maxDec = Math.max(1, ...decades.map((d) => inDecade(d).length))

  // Süzgeç yokken: öne çıkan kayıt (fotoğraflı olan tercih edilir)
  const plain = !type && !decade && page === 1
  const featured = plain
    ? (await payload.find({ collection: 'archive', where: { and: [scope, { featuredOnHome: { equals: true } }] }, sort: '-year', limit: 12, depth: 1, locale, overrideAccess: false })).docs
        .sort((a, b) => Number((b.files ?? []).some((f) => typeof f === 'object')) - Number((a.files ?? []).some((f) => typeof f === 'object')))[0]
    : undefined

  return (
    <div className="list-page arc-list">
      <section className="band arc-list-band">
        <div className="wrap">
          <ListHead
            lang={lang} dark
            kicker={L('arc.kicker')}
            title={oral ? L('nav.sozlu') : L('arc.title')}
            lede={oral ? L('oral.lede') : L('arc.intro')}
            count={all.docs.length} countLabel={L('arc.records')}
          />
          <nav className="dec-bars intro" aria-label={L('arc.alldec')} style={css({ '--d': 5 })}>
            <Link href={qs(base, { tur: type })} scroll={false} aria-current={!decade ? 'page' : undefined} className="dec-all">
              <b>{all.docs.filter((a) => !type || a.type === type).length}</b><span>{L('arc.alldec')}</span>
            </Link>
            {decades.map((d, i) => {
              const n = inDecade(d).filter((a) => !type || a.type === type).length
              return (
                <Link key={d} href={qs(base, { donem: d, tur: type })} scroll={false} aria-current={decade === d ? 'page' : undefined} className={n ? '' : 'is-zero'} style={css({ '--h': n / maxDec, '--i': i })}>
                  <span className="bar" aria-hidden="true" />
                  <b>{decadeLabel(lang, d)}</b><span>{n} {L('arc.records')}</span>
                </Link>
              )
            })}
          </nav>
          <FilterTabs
            label={L('arc.bytype')}
            tabs={[undefined, ...types].map((ty) => ({
              href: qs(base, { donem: decade, tur: ty }), label: ty ? archiveTypeLabel(lang, ty) : L('search.all'),
              count: inDecade(decade).filter((a) => !ty || a.type === ty).length, active: type === ty,
            })).filter((tb, i) => i === 0 || tb.count > 0)}
          />

          {featured && (
            <Link href={`/${lang}/arsiv/${featured.slug}`} className="arc-spot" data-reveal="">
              <span className={`arc-vis arc-spot-vis${featured.type === 'audio' || featured.type === 'oral' ? ' audio' : ''}`}><ArcVis a={featured} size="hero" /></span>
              <span className="arc-spot-body">
                <span className="arc-spot-year">{featured.year}</span>
                <span className="arc-meta"><span className="type">{archiveTypeLabel(lang, featured.type)}</span><span>{archiveYear(lang, featured)}</span></span>
                <span className="arc-spot-title"><span className="ul">{featured.title}</span></span>
                {featured.donor && <span className="arc-src">{featured.donor}</span>}
              </span>
            </Link>
          )}

          {res.docs.length === 0 ? (
            <p className="empty arc-empty">{L('search.none')}</p>
          ) : (
            <div className="arc-grid arc-grid--list">
              {res.docs.map((d, i) => (
                <Link key={d.id} href={`/${lang}/arsiv/${d.slug}`} className="arc-item" data-reveal="" style={css({ '--i': i % 6 })}>
                  <span className={`arc-vis${d.type === 'audio' || d.type === 'oral' ? ' audio' : ''}`}><ArcVis a={d} /></span>
                  <p className="arc-meta"><span className="type">{archiveTypeLabel(lang, d.type)}</span><span>{archiveYear(lang, d)}</span></p>
                  <h3><span className="ul">{d.title}</span></h3>
                  {d.donor && <p className="arc-src">{d.donor}</p>}
                </Link>
              ))}
            </div>
          )}
          <Pager lang={lang} page={page} pages={res.totalPages} href={(p) => qs(base, { donem: decade, tur: type, sayfa: p })} />
          <div className="arc-list-cta" data-reveal="">
            <p>{L('arc.wanted.p')}</p>
            <Link className="btn btn-brand" href={`/${lang}#katki`}><span>{L('cta.katki')}</span></Link>
          </div>
        </div>
      </section>
    </div>
  )
}
