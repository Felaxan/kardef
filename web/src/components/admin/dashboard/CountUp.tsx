'use client'
import React, { useEffect, useRef } from 'react'

const fmt = (n: number) => n.toLocaleString('tr-TR')

/**
  Sayı sıfırdan hedefe yumuşakça yükselir.
  Sunucudan doğru değerle gelir; animasyon yalnızca sayfa görünürken oynar, metni doğrudan
  günceller ve süre sonunda her durumda kesin değere oturur (arka plan sekmesinde 0'da takılmaz).
*/
export function CountUp({ value, delay = 0 }: { value: number; delay?: number }) {
  const el = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = el.current
    if (!node || value === 0 || document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    node.textContent = fmt(0)
    let raf = 0
    const dur = Math.min(1400, 500 + value * 40)
    const start = performance.now() + delay
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / dur))
      node.textContent = fmt(Math.round(value * (1 - Math.pow(1 - p, 4))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const done = window.setTimeout(() => { node.textContent = fmt(value) }, delay + dur + 150)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(done)
      node.textContent = fmt(value)
    }
  }, [value, delay])

  return <span ref={el}>{fmt(value)}</span>
}
