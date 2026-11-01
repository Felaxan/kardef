'use client'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { Ico } from './Icons'
import { animateIn, animateOut } from './swap'

export type DecadeBar = { y: number; label: string; count: number; h: number }
export type ArcCard = {
  id: number | string; href: string; decade: number; title: string; typeLabel: string; yearLabel: string
  source?: string; featured: boolean
  vis: { kind: 'img'; src: string; alt: string } | { kind: 'doc' | 'doc2' | 'clip' } | { kind: 'wave'; bars: number[]; dur?: string }
}

type Labels = {
  alldec: string; records: string; openall: string; wantedT: string; wantedP: string; wantedBtn: string; photo: string
}

/** Arşiv: dönem çubukları + o döneme ait kayıtlar. Kayıt yoksa "fotoğraf arıyoruz" kartı çıkar. */
export function ArchiveExplorer({
  decades, total, cards, labels, contributeHref, openAllHref, side,
}: {
  decades: DecadeBar[]; total: number; cards: ArcCard[]; labels: Labels
  contributeHref: string; openAllHref: string; side: React.ReactNode
}) {
  const [sel, setSel] = useState<number | 'all'>('all')
  const [shown, setShown] = useState<number | 'all'>('all')
  const grid = useRef<HTMLDivElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const first = useRef(true)

  const defaults = (() => {
    const f = cards.filter((c) => c.featured)
    return (f.length ? f : cards).slice(0, 6)
  })()
  const list = shown === 'all' ? defaults : cards.filter((c) => c.decade === shown).slice(0, 9)

  const choose = async (d: number | 'all', btn: HTMLButtonElement) => {
    if (d === sel) return
    setSel(d)
    const r = rail.current
    if (r && r.scrollWidth > r.clientWidth) r.scrollTo({ left: btn.offsetLeft - r.clientWidth / 2 + btn.offsetWidth / 2, behavior: 'smooth' })
    await animateOut(Array.from(grid.current?.children ?? []) as HTMLElement[])
    setShown(d)
  }
  useEffect(() => {
    if (first.current) { first.current = false; return }
    animateIn(Array.from(grid.current?.children ?? []) as HTMLElement[])
  }, [shown])

  const current = sel === 'all' ? null : decades.find((d) => d.y === sel)
  const status = current ? `${current.label} · ${current.count} ${labels.records}` : `${labels.alldec} · ${total} ${labels.records}`

  return (
    <>
      <div className="decades" role="group" aria-label={labels.alldec} ref={rail}>
        <button type="button" aria-pressed={sel === 'all'} onClick={(e) => choose('all', e.currentTarget)}>
          <span className="total" data-count={total}>{total}</span>
          <span className="lbl">{labels.alldec}</span>
          <span className="n">{total} {labels.records}</span>
        </button>
        {decades.map((d, i) => (
          <button
            key={d.y}
            type="button"
            aria-pressed={sel === d.y}
            style={{ '--i': i + 1 } as React.CSSProperties}
            onClick={(e) => choose(d.y, e.currentTarget)}
          >
            <span className="bar" style={{ '--h': d.h } as React.CSSProperties} />
            <span className="lbl">{d.label}</span>
            <span className="n">{d.count}</span>
          </button>
        ))}
      </div>

      <div className="arc-wrap">
      <div>
        <p className="arc-status">
          <span>{status}</span>
          <Link href={openAllHref}><span className="ul">{labels.openall}</span><Ico name="arrow" /></Link>
        </p>
        <div className="arc-grid" ref={grid}>
          {list.length === 0 && current && (
            <Link href={contributeHref} className="arc-item" key={`w${current.y}`}>
              <span className="arc-vis"><span className="wanted"><span className="plus">+</span><span>{labels.wantedBtn}</span></span></span>
              <p className="arc-meta"><span className="type">{labels.photo}</span><span>{current.label}</span></p>
              <h3><span className="ul">{labels.wantedT}</span></h3>
              <p className="arc-src">{labels.wantedP}</p>
            </Link>
          )}
          {list.map((c) => (
            <Link href={c.href} className="arc-item" key={c.id}>
              <span className={`arc-vis${c.vis.kind === 'wave' ? ' audio' : ''}`}>
                {c.vis.kind === 'img' && <img src={c.vis.src} alt={c.vis.alt} loading="lazy" />}
                {c.vis.kind === 'doc' && <span className="doc" />}
                {c.vis.kind === 'doc2' && <><span className="doc two" /><span className="doc" /></>}
                {c.vis.kind === 'clip' && <span className="clip" />}
                {c.vis.kind === 'wave' && (
                  <>
                    <span className="wave">
                      {c.vis.bars.map((h, j) => (
                        <i key={j} style={{ height: `${h}%`, '--j': j, transitionDelay: `${j * 12}ms` } as React.CSSProperties} />
                      ))}
                    </span>
                    <span className="play"><Ico name="play" /></span>
                    {c.vis.dur && <span className="dur">{c.vis.dur}</span>}
                  </>
                )}
              </span>
              <p className="arc-meta"><span className="type">{c.typeLabel}</span><span>{c.yearLabel}</span></p>
              <h3><span className="ul">{c.title}</span></h3>
              {c.source && <p className="arc-src">{c.source}</p>}
            </Link>
          ))}
        </div>
      </div>
      {side}
      </div>
    </>
  )
}
