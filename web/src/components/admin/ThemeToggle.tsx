'use client'
import { useTheme } from '@payloadcms/ui'
import React from 'react'

/*
  Üst çubuktaki açık / koyu tema düğmesi.
  Etiket temadan bağımsızdır; böylece sunucu ve tarayıcı aynı HTML'i üretir
  (hidrasyon uyuşmazlığı olmaz). Hangi simgenin görüneceğini CSS seçer.
*/
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    const apply = () => setTheme(next)
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> }
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (doc.startViewTransition && !reduce) {
      const vt = doc.startViewTransition(apply)
      const noop = () => {}
      vt.ready.catch(noop)
      vt.finished.catch(noop)
      vt.updateCallbackDone.catch(noop)
    } else apply()
  }

  return (
    <button type="button" className="kd-theme" onClick={toggle} aria-label="Açık / koyu tema" title="Açık / koyu tema">
      <svg className="kd-theme__sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg className="kd-theme__moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
      </svg>
    </button>
  )
}
