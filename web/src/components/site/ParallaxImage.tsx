'use client'
import React, { useEffect, useRef } from 'react'

/** Kaydırdıkça hafifçe kayan kapak fotoğrafı */
export function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const img = useRef<HTMLImageElement>(null)
  useEffect(() => {
    const el = img.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.parentElement!.getBoundingClientRect()
      const vh = window.innerHeight
      if (r.bottom < 0 || r.top > vh) return
      const p = (r.top + r.height / 2 - vh / 2) / vh // -1 … 1
      el.style.setProperty('--py', `${(p * -60).toFixed(1)}px`)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])
  return <img ref={img} src={src} alt={alt} className="parallax" />
}
