'use client'
import { useEffect } from 'react'

/** Dar ekranda zaman çizelgesini açılışta mevcut kaydın üstüne kaydırır */
export function TimelineCenter() {
  useEffect(() => {
    const tl = document.querySelector<HTMLElement>('.tl')
    const cur = tl?.querySelector<HTMLElement>('.tl-dot.is-cur')
    if (!tl || !cur || tl.scrollWidth <= tl.clientWidth) return
    tl.scrollLeft = cur.offsetLeft - tl.clientWidth / 2
  }, [])
  return null
}
