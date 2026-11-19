'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { MoreMenu, useNavFit } from './useNavFit'

export type NavItem = { href: string; label: string; section?: string; live?: boolean }

/** Ana menü: fareyi takip eden kırmızı çizgi + ana sayfada bulunulan bölümü işaretleme */
export function NavBar({ items, lang, moreLabel }: { items: NavItem[]; lang: string; moreLabel: string }) {
  const pathname = usePathname()
  const home = pathname === `/${lang}`
  const routeIdx = items.findIndex((it) => !it.section && it.href !== `/${lang}` && pathname.startsWith(it.href))
  const [scrollIdx, setScrollIdx] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)
  const active = home && scrollIdx !== null ? scrollIdx : routeIdx >= 0 ? routeIdx : 0
  const ind = useRef<HTMLSpanElement>(null)
  const { box, items: refs, more, fit, fitting } = useNavFit(items.length, [lang])

  const place = useCallback((i: number) => {
    const a = i < fit ? refs.current[i] : more.current?.parentElement
    if (!a || !ind.current) return
    ind.current.style.width = `${a.offsetWidth}px`
    ind.current.style.transform = `translateX(${a.offsetLeft}px)`
  }, [fit, refs, more])

  useEffect(() => { place(hover ?? active) }, [hover, active, place])
  useEffect(() => {
    const re = () => place(hover ?? active)
    window.addEventListener('resize', re)
    document.fonts?.ready.then(re)
    return () => window.removeEventListener('resize', re)
  }, [hover, active, place])

  // Ana sayfada kaydırırken bulunulan bölüm
  useEffect(() => {
    if (!home || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (!e.isIntersecting) return
        const i = items.findIndex((it) => it.section === e.target.id)
        if (i >= 0) setScrollIdx(i)
      }),
      { rootMargin: '-40% 0px -55% 0px' },
    )
    items.forEach((it) => { const el = it.section && document.getElementById(it.section); if (el) io.observe(el) })
    const onScroll = () => { if (window.scrollY < 200) setScrollIdx(0) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [home, items])

  return (
    <div ref={box} className={`wrap nav-in${fitting ? ' is-fit' : ''}`} onMouseLeave={() => setHover(null)}>
      {items.map((it, i) => (
        <Link
          key={it.href + it.label}
          href={it.href}
          ref={(el) => { refs.current[i] = el }}
          className={[i === active ? 'is-active' : '', it.live ? 'is-live' : '', i >= fit ? 'is-over' : ''].filter(Boolean).join(' ') || undefined}
          aria-hidden={i >= fit || undefined}
          tabIndex={i >= fit ? -1 : undefined}
          onMouseEnter={() => setHover(i)}
          onFocus={() => setHover(i)}
          scroll={!it.section}
        >
          {it.live && <span className="live-dot" aria-hidden="true" />}
          {it.label}
        </Link>
      ))}
      <MoreMenu
        label={moreLabel}
        items={items}
        activeIndex={active}
        offset={fit}
        hidden={fit >= items.length}
        btnRef={(el) => { more.current = el }}
        onHover={() => setHover(items.length)}
      />
      <span className="nav-ind" ref={ind} aria-hidden="true" />
    </div>
  )
}
