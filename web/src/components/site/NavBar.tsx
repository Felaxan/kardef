'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'

export type NavItem = { href: string; label: string; section?: string }

/** Ana menü: fareyi takip eden kırmızı çizgi + ana sayfada bulunulan bölümü işaretleme */
export function NavBar({ items, lang }: { items: NavItem[]; lang: string }) {
  const pathname = usePathname()
  const home = pathname === `/${lang}`
  const routeActive = () => {
    const i = items.findIndex((it) => !it.section && it.href !== `/${lang}` && pathname.startsWith(it.href))
    return i >= 0 ? i : 0
  }
  const [active, setActive] = useState(routeActive)
  const [hover, setHover] = useState<number | null>(null)
  const refs = useRef<(HTMLAnchorElement | null)[]>([])
  const ind = useRef<HTMLSpanElement>(null)

  const place = useCallback((i: number) => {
    const a = refs.current[i]
    if (!a || !ind.current) return
    ind.current.style.width = `${a.offsetWidth}px`
    ind.current.style.transform = `translateX(${a.offsetLeft}px)`
  }, [])

  useEffect(() => { setActive(routeActive()) }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps
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
        if (i >= 0) setActive(i)
      }),
      { rootMargin: '-40% 0px -55% 0px' },
    )
    items.forEach((it) => { const el = it.section && document.getElementById(it.section); if (el) io.observe(el) })
    const onScroll = () => { if (window.scrollY < 200) setActive(0) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [home, items])

  return (
    <div className="wrap nav-in" onMouseLeave={() => setHover(null)}>
      {items.map((it, i) => (
        <Link
          key={it.href + it.label}
          href={it.href}
          ref={(el) => { refs.current[i] = el }}
          className={i === active ? 'is-active' : undefined}
          onMouseEnter={() => setHover(i)}
          onFocus={() => setHover(i)}
          scroll={!it.section}
        >
          {it.label}
        </Link>
      ))}
      <span className="nav-ind" ref={ind} aria-hidden="true" />
    </div>
  )
}
