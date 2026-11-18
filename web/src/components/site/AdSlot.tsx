'use client'
import React, { useEffect, useRef, useState } from 'react'
import type { Ad, AdSlotKey } from '@/lib/ads'

/** Reklam yeri: tek reklam sabit durur, birden fazlaysa sırayla döner (üstüne gelince durur). */
export function AdSlot({ slot, seconds, ads, label }: { slot: AdSlotKey; seconds: number; ads: Ad[]; label: string }) {
  const [i, setI] = useState(0)
  const paused = useRef(false)

  useEffect(() => {
    if (ads.length < 2) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const id = window.setInterval(() => {
      if (!paused.current && !document.hidden) setI((n) => (n + 1) % ads.length)
    }, seconds * 1000 * (reduce ? 1.5 : 1))
    return () => window.clearInterval(id)
  }, [ads.length, seconds])

  if (!ads.length) return null

  return (
    <aside
      className={`ad ad--${slot}`}
      aria-label={label}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
    >
      <span className="ad-label">{label}</span>
      <div className="ad-stage">
        {ads.map((a, n) => {
          const img = (
            <picture>
              {a.mobileImage && <source media="(max-width: 640px)" srcSet={a.mobileImage} />}
              <img src={a.image} alt={a.advertiser} loading={n === 0 ? 'eager' : 'lazy'} />
            </picture>
          )
          return (
            <div key={n} className={`ad-item${n === i ? ' is-on' : ''}`} aria-hidden={n !== i || undefined}>
              {a.link ? (
                <a href={a.link} target="_blank" rel="sponsored noopener" tabIndex={n === i ? 0 : -1}>{img}</a>
              ) : img}
            </div>
          )
        })}
      </div>
      {ads.length > 1 && (
        <div className="ad-dots" aria-hidden="true">
          {ads.map((_, n) => (
            <button key={n} type="button" tabIndex={-1} className={n === i ? 'is-on' : ''} onClick={() => setI(n)}>
              <span style={{ animationDuration: `${seconds}s` }} />
            </button>
          ))}
        </div>
      )}
    </aside>
  )
}
