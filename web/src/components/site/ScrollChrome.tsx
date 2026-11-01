'use client'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { Ico } from './Icons'
import type { NavItem } from './NavBar'

/** Kaydırınca beliren küçük başlık, okuma ilerleme çizgisi ve başa dön düğmesi */
export function ScrollChrome({
  lang, items, cta, totop, siteName,
}: { lang: string; items: NavItem[]; cta: string; totop: string; siteName: string }) {
  const [show, setShow] = useState(false)
  const [top, setTop] = useState(false)
  const prog = useRef<HTMLSpanElement>(null)
  const ring = useRef<SVGCircleElement>(null)

  useEffect(() => {
    let headEnd = 300
    const measure = () => {
      const n = document.querySelector('.nav')
      headEnd = n ? n.getBoundingClientRect().bottom + window.scrollY : 300
    }
    const onScroll = () => {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(y / max, 1) : 0
      setShow(y > headEnd + 40)
      setTop(y > window.innerHeight * 0.9)
      if (prog.current) prog.current.style.transform = `scaleX(${p})`
      if (ring.current) ring.current.style.strokeDashoffset = (150.8 * (1 - p)).toFixed(1)
    }
    measure(); onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', measure) }
  }, [])

  const toTop = () => {
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.6 })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <div className={`minibar${show ? ' show' : ''}`} inert={!show}>
        <div className="wrap minibar-in">
          <Link href={`/${lang}`} className="mini-brand">
            <img src="/brand/kar-def-logo.png" alt="" />
            <img src="/brand/av-kardep-logo.png" alt="" />
            <span>{siteName}</span>
          </Link>
          <nav className="mini-nav" aria-label="Kısa menü">
            {items.map((it) => <Link key={it.href + it.label} href={it.href} scroll={!it.section}>{it.label}</Link>)}
          </nav>
          <Link href={`/${lang}#katki`} className="btn btn-brand btn-sm"><span>{cta}</span><Ico name="arrow" /></Link>
        </div>
        <span className="progress" ref={prog} />
      </div>
      <button type="button" className={`totop${top ? ' show' : ''}`} aria-label={totop} onClick={toTop}>
        <svg className="ring" viewBox="0 0 52 52" aria-hidden="true">
          <circle className="bg" cx="26" cy="26" r="24" />
          <circle className="fg" cx="26" cy="26" r="24" ref={ring} />
        </svg>
        <Ico name="up" />
      </button>
    </>
  )
}
