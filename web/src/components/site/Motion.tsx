'use client'
import { useEffect } from 'react'

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function countUp(el: HTMLElement) {
  const to = Number(el.dataset.count)
  if (!to || reduce()) { el.textContent = String(to); return }
  let start: number | null = null
  const step = (ts: number) => {
    if (start === null) start = ts
    const p = Math.min((ts - start) / 1400, 1)
    el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))))
    if (p < 1) requestAnimationFrame(step)
  }
  el.textContent = '0'
  requestAnimationFrame(step)
}

// Ekrana girince "in" sınıfı alacak öğeler
const SEL = [
  '.prose-reveal .payload-richtext > *',
  '[data-reveal]',
  '.sec-head',
  '.decades',
  '.arc-vis',
  '.art-hero',
  '[data-count]',
].join(', ')

/*
  Sayfa açılış animasyonu ve "ekrana girince belir" davranışı.
  Sayfaya sonradan eklenen öğeleri de (sayfa geçişi, süzgeç, akışla gelen içerik)
  MutationObserver ile yakalar; böylece hiçbir öğe gizli kalmaz.
*/
export function Motion() {
  useEffect(() => {
    const root = document.documentElement
    const ready = () => root.classList.add('ready')
    requestAnimationFrame(() => requestAnimationFrame(ready))
    const readyT = setTimeout(ready, 300) // sekme arka plandaysa bile sayfa boş kalmasın

    const show = (el: HTMLElement) => {
      el.classList.add('in')
      if (el.dataset.count && !el.classList.contains('counted')) { el.classList.add('counted'); countUp(el) }
    }

    if (!('IntersectionObserver' in window) || reduce()) {
      const all = () => document.querySelectorAll<HTMLElement>(SEL).forEach(show)
      all()
      const mo = new MutationObserver(all)
      mo.observe(document.body, { childList: true, subtree: true })
      return () => { clearTimeout(readyT); mo.disconnect() }
    }

    const tracked = new WeakSet<Element>()
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (!e.isIntersecting) return
        show(e.target as HTMLElement)
        io.unobserve(e.target)
      }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    const scan = () => {
      document.querySelectorAll<HTMLElement>(SEL).forEach((el) => {
        if (tracked.has(el) || el.classList.contains('in')) return
        tracked.add(el)
        io.observe(el)
      })
    }
    let pending = 0
    const schedule = () => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; scan() }) }
    scan()
    const mo = new MutationObserver(schedule)
    mo.observe(document.body, { childList: true, subtree: true })

    // Güvenlik ağı: ekranın içinde olup hâlâ görünmeyen öğe kalırsa göster
    const safety = setInterval(() => {
      const vh = window.innerHeight
      document.querySelectorAll<HTMLElement>(SEL).forEach((el) => {
        if (el.classList.contains('in')) return
        const r = el.getBoundingClientRect()
        if (r.top < vh && r.bottom > 0) show(el)
      })
    }, 2500)

    return () => { clearTimeout(readyT); clearInterval(safety); cancelAnimationFrame(pending); mo.disconnect(); io.disconnect() }
  }, [])

  return null
}
