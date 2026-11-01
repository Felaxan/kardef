'use client'
import Lenis from 'lenis'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

declare global {
  interface Window { __lenis?: Lenis }
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Lenis ile akıcı kaydırma; aynı sayfadaki #bağlantılara yumuşak geçiş */
export function SmoothScroll() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.95 })
    window.__lenis = lenis
    let raf = 0
    const loop = (time: number) => { lenis.raf(time); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href*="#"]') as HTMLAnchorElement | null
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return
      const url = new URL(a.href, location.href)
      if (url.pathname !== location.pathname || !url.hash) return
      const el = document.getElementById(decodeURIComponent(url.hash.slice(1)))
      if (!el) return
      e.preventDefault()
      lenis.scrollTo(el, { offset: -76, duration: 1.4, easing: ease })
      history.replaceState(null, '', url.hash)
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(raf)
      lenis.destroy()
      delete window.__lenis
    }
  }, [])

  // Sayfa değişince: adreste # varsa oraya kay, yoksa en üste
  useEffect(() => {
    const lenis = window.__lenis
    const hash = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null
    if (hash) setTimeout(() => (lenis ? lenis.scrollTo(hash, { offset: -76, duration: 1.2, easing: ease }) : hash.scrollIntoView()), 120)
    else if (lenis) lenis.scrollTo(0, { immediate: true })
  }, [pathname])

  return null
}
