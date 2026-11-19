'use client'
import Link from 'next/link'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { NavItem } from './NavBar'

/** Telefonda menü yana kaydırılır; daha geniş ekranlarda sığmayanlar "Daha fazla"ya taşınır */
const MOBILE = 760
const useIso = typeof window === 'undefined' ? useEffect : useLayoutEffect

const outer = (el: HTMLElement | null | undefined) => {
  if (!el) return 0
  const s = getComputedStyle(el)
  return el.offsetWidth + parseFloat(s.marginLeft) + parseFloat(s.marginRight)
}

/**
  Menüde kaç öğenin sığdığını ölçer. Sığmayan öğeler görünmez ama ölçülebilir kalır
  (`is-over`), böylece pencere büyüyünce geri gelirler.
*/
export function useNavFit<T extends HTMLElement = HTMLDivElement>(count: number, deps: unknown[] = []) {
  const box = useRef<T | null>(null)
  const items = useRef<(HTMLElement | null)[]>([])
  const more = useRef<HTMLElement | null>(null)
  const [fit, setFit] = useState(count)
  const [active, setActive] = useState(false)

  useIso(() => {
    const el = box.current
    if (!el) return
    const calc = () => {
      if (window.innerWidth < MOBILE) { setActive(false); setFit(count); return }
      setActive(true)
      const s = getComputedStyle(el)
      const gap = parseFloat(s.columnGap) || 0
      const avail = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight)
      const ws = items.current.slice(0, count).map((a) => outer(a) + gap)
      const total = ws.reduce((a, b) => a + b, 0) - gap
      if (total <= avail) { setFit(count); return }
      const room = avail - outer(more.current)
      let used = 0
      let n = 0
      while (n < count && used + ws[n] <= room) { used += ws[n]; n++ }
      setFit(Math.max(1, n))
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    document.fonts?.ready.then(calc)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, ...deps])

  return { box, items, more, fit: active ? fit : count, fitting: active }
}

/** "Daha fazla" düğmesi ve açılır listesi */
export function MoreMenu({
  label, items, activeIndex = -1, offset, btnRef, hidden, onHover,
}: {
  label: string; items: NavItem[]; activeIndex?: number; offset: number
  btnRef: (el: HTMLButtonElement | null) => void; hidden: boolean; onHover?: () => void
}) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const out = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', out)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', esc) }
  }, [open])
  useEffect(() => { if (hidden) setOpen(false) }, [hidden])

  return (
    <div ref={wrap} className={`nav-more${hidden ? ' is-over' : ''}${open ? ' is-open' : ''}`} aria-hidden={hidden || undefined}>
      <button
        ref={btnRef}
        type="button"
        className={activeIndex >= offset ? 'is-active' : undefined}
        aria-expanded={open}
        aria-haspopup="true"
        tabIndex={hidden ? -1 : undefined}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={onHover}
        onFocus={onHover}
      >
        {label}
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5L6 8l3.5-3.5" /></svg>
      </button>
      <ul className="nav-more-list">
        {items.slice(offset).map((it, j) => (
          <li key={it.href + it.label} style={{ '--i': j } as React.CSSProperties}>
            <Link
              href={it.href}
              scroll={!it.section}
              className={[offset + j === activeIndex ? 'is-active' : '', it.live ? 'is-live' : ''].filter(Boolean).join(' ') || undefined}
              tabIndex={open ? undefined : -1}
              onClick={() => setOpen(false)}
            >
              {it.live && <span className="live-dot" aria-hidden="true" />}
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
