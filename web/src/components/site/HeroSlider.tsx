'use client'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { Ico } from './Icons'

export type Slide = {
  href: string; img: string | null; alt: string; kicker?: string; title: string
  excerpt?: string; metaBy: string; metaDate: string; credit?: string; short: string
}

/** Manşet: fotoğraflar yakınlaşarak geçer, alttaki çubuklar süreyi gösterir. */
export function HeroSlider({ slides, seconds, labels }: { slides: Slide[]; seconds: number; labels: { prev: string; next: string } }) {
  const [cur, setCur] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduce, setReduce] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const sx = useRef<{ x: number; y: number } | null>(null)
  const n = slides.length

  useEffect(() => { setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches) }, [])

  // Ekranda değilken dursun
  useEffect(() => {
    const el = root.current
    if (!el || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver((es) => setPaused(!es[0].isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const go = (i: number) => setCur(((i % n) + n) % n)
  if (!n) return null

  return (
    <div
      className={`slider intro${paused ? ' paused' : ''}`}
      style={{ '--d': 3, '--slide-dur': `${seconds}s` } as React.CSSProperties}
      ref={root}
      onKeyDown={(e) => { if (e.key === 'ArrowLeft') go(cur - 1); if (e.key === 'ArrowRight') go(cur + 1) }}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="slides"
        onTouchStart={(e) => { sx.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
        onTouchEnd={(e) => {
          if (!sx.current) return
          const dx = e.changedTouches[0].clientX - sx.current.x, dy = e.changedTouches[0].clientY - sx.current.y
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1))
          sx.current = null
        }}
      >
        {slides.map((s, i) => (
          <article key={s.href} className={`slide${i === cur ? ' is-active' : ''}`} aria-hidden={i !== cur}>
            {s.img ? <img src={s.img} alt={s.alt} /> : <span className="slide-blank" />}
            <div className="slide-cap">
              {s.kicker ? <span className="kicker">{s.kicker}</span> : <span />}
              <h2><Link href={s.href} tabIndex={i === cur ? 0 : -1}>{s.title}</Link></h2>
              {s.excerpt ? <p>{s.excerpt}</p> : <span />}
              <p className="meta"><b>{s.metaBy}</b> · {s.metaDate}</p>
            </div>
            {s.credit && <span className="credit">{s.credit}</span>}
          </article>
        ))}
        {n > 1 && (
          <div className="slider-arrows">
            <button type="button" aria-label={labels.prev} onClick={() => go(cur - 1)}><Ico name="left" /></button>
            <button type="button" aria-label={labels.next} onClick={() => go(cur + 1)}><Ico name="right" /></button>
          </div>
        )}
      </div>
      {n > 1 && (
        <div className="tabs" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {slides.map((s, i) => (
            <button
              key={s.href}
              type="button"
              className={`tab${i === cur ? ' is-active' : ''}${i < cur ? ' is-done' : ''}`}
              onClick={() => go(i)}
            >
              <span
                className="tab-bar"
                key={i === cur ? `a${cur}` : `i${i}`}
                onAnimationEnd={() => { if (!reduce && i === cur) go(cur + 1) }}
              />
              <span className="tab-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="tab-t">{s.short}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
