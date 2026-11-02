'use client'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { Ico } from './Icons'

export type VillageRow = { id: number | string; name: string; slug: string; note: string; letter: string }

const norm = (s: string) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')

/** Köy rehberi: yazdıkça süzülen liste ve harf dizini */
export function VillageDirectory({ rows, alphabet, lang, labels }: {
  rows: VillageRow[]; alphabet: string[]; lang: string
  labels: { filter: string; none: string }
}) {
  const [q, setQ] = useState('')
  const shown = useMemo(() => {
    const n = norm(q.trim())
    return n ? rows.filter((r) => norm(`${r.name} ${r.note}`).includes(n)) : rows
  }, [q, rows])
  const groups = useMemo(() => {
    const m = new Map<string, VillageRow[]>()
    for (const r of shown) m.set(r.letter, [...(m.get(r.letter) ?? []), r])
    return m
  }, [shown])

  const go = (ch: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById(`harf-${ch}`)
    if (!el) return
    const lenis = (window as unknown as { __lenis?: { scrollTo: (t: HTMLElement, o: object) => void } }).__lenis
    if (lenis) lenis.scrollTo(el, { offset: -110 })
    else el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <div className="vd-tools">
        <label className="vd-search">
          <Ico name="search" />
          <span className="sr">{labels.filter}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={labels.filter} autoComplete="off" />
        </label>
        <nav className="letters" aria-label={labels.filter}>
          {alphabet.map((ch) =>
            groups.has(ch)
              ? <a key={ch} href={`#harf-${ch}`} onClick={go(ch)}>{ch}</a>
              : <span key={ch} className="off" aria-hidden="true">{ch}</span>,
          )}
        </nav>
      </div>
      {shown.length === 0 ? (
        <p className="empty vd-empty">{labels.none}</p>
      ) : (
        <div className="village-groups">
          {[...groups.entries()].map(([ch, list], i) => (
            <section key={ch} id={`harf-${ch}`} className="village-group vd-in" style={{ '--i': i % 6 } as React.CSSProperties}>
              <h2>{ch}</h2>
              <ul>
                {list.map((v) => (
                  <li key={v.id}>
                    <Link href={`/${lang}/koy/${v.slug}`}>
                      <span>{v.name}</span>
                      <small>{v.note}</small>
                      <Ico name="arrow" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
