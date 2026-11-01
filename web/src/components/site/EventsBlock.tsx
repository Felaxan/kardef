'use client'
import Link from 'next/link'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Ico } from './Icons'
import { animateIn, animateOut } from './swap'

export type EventCard = {
  href: string; region: 'karakocan' | 'avrupa' | 'online'; day: string; month: string; weekday: string
  title: string; place: string; time: string; tag: string; eu: boolean
}
type Filter = 'all' | 'tr' | 'eu'

const matches = (e: EventCard, f: Filter) =>
  f === 'all' || (f === 'tr' && e.region !== 'avrupa') || (f === 'eu' && e.region !== 'karakocan')

/** Etkinlik takvimi: kayan seçim göstergeli süzgeç ve yumuşak geçişli liste */
export function EventsBlock({
  events, labels, moreHref,
}: { events: EventCard[]; labels: { title: string; all: string; tr: string; eu: string; more: string; none: string }; moreHref: string }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [shown, setShown] = useState<Filter>('all')
  const list = useRef<HTMLOListElement>(null)
  const seg = useRef<HTMLDivElement>(null)
  const ind = useRef<HTMLSpanElement>(null)
  const first = useRef(true)

  const place = () => {
    const b = seg.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')
    if (!b || !ind.current) return
    ind.current.style.width = `${b.offsetWidth}px`
    ind.current.style.transform = `translateX(${b.offsetLeft}px)`
  }
  useLayoutEffect(place, [filter])
  useEffect(() => {
    window.addEventListener('resize', place)
    document.fonts?.ready.then(place)
    return () => window.removeEventListener('resize', place)
  }, [])

  const choose = async (f: Filter) => {
    if (f === filter) return
    setFilter(f)
    await animateOut(Array.from(list.current?.children ?? []) as HTMLElement[])
    setShown(f)
  }
  useEffect(() => {
    if (first.current) { first.current = false; return }
    animateIn(Array.from(list.current?.children ?? []) as HTMLElement[])
  }, [shown])

  const visible = events.filter((e) => matches(e, shown))

  return (
    <>
      <header className="sec-head" data-reveal="">
        <h2>{labels.title}</h2>
        <div className="seg" role="group" ref={seg}>
          <span className="seg-ind" aria-hidden="true" ref={ind} />
          {(['all', 'tr', 'eu'] as Filter[]).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => choose(f)}>
              {labels[f]}
            </button>
          ))}
        </div>
        <Link href={moreHref} className="more"><span>{labels.more}</span><Ico name="arrow" /></Link>
      </header>
      {events.length === 0 ? (
        <p className="empty">{labels.none}</p>
      ) : (
        <ol className="events" ref={list}>
          {visible.map((e, i) => (
            <li
              key={e.href}
              className={`event${e.eu ? ' eu' : ''}${first.current ? '' : ' in'}`}
              data-reveal=""
              style={{ '--i': i } as React.CSSProperties}
            >
              <div className="ev-date"><span className="d">{e.day}</span><span className="m"><b>{e.month}</b>{e.weekday}</span></div>
              <h3><Link href={e.href}>{e.title}</Link></h3>
              <p className="ev-place"><Ico name="pin" />{e.place}{e.time ? ` · ${e.time}` : ''}</p>
              <span className="tag">{e.tag}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}
