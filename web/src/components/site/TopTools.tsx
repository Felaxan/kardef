'use client'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { LANG_NAMES, LOCALES, swapLang, type Lang } from '@/i18n/ui'
import { Ico } from './Icons'

type VT = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void>; skipTransition: () => void }
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Sayfa değişikliğini (tema, dil) yumuşak bir solmayla yapar */
export function withTransition(fn: () => void | Promise<void>) {
  const doc = document as Document & { startViewTransition?: (cb: () => void | Promise<void>) => VT }
  if (!doc.startViewTransition || reduceMotion()) return void fn()
  const vt = doc.startViewTransition(fn)
  const noop = () => {}
  vt.ready.catch(noop); vt.finished.catch(noop); vt.updateCallbackDone.catch(noop)
  setTimeout(() => { try { vt.skipTransition() } catch {} }, 2500) // takılırsa bitir
}

const store = {
  get: (k: string) => { try { return localStorage.getItem(k) } catch { return null } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v) } catch {} },
}

export function TopTools({ lang, labels }: { lang: Lang; labels: { fs: string; theme: string } }) {
  const router = useRouter()
  const pathname = usePathname()
  const [fs, setFs] = useState(0)
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  // Yazı boyutu: kayıtlı tercihi yükle; sistem teması değişirse simgeyi güncelle
  useEffect(() => {
    const v = Math.min(Math.max(parseInt(store.get('k-fs') || '0', 10) || 0, 0), 2)
    setFs(v)
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => {
      const t = document.documentElement.getAttribute('data-theme')
      document.documentElement.classList.toggle('is-dark', t ? t === 'dark' : mq.matches)
    }
    mq.addEventListener?.('change', sync)
    return () => mq.removeEventListener?.('change', sync)
  }, [])
  const applyFs = (i: number) => {
    const root = document.documentElement
    root.classList.remove('fs-1', 'fs-2')
    if (i > 0) root.classList.add(`fs-${i}`)
    setFs(i)
    store.set('k-fs', String(i))
    window.dispatchEvent(new Event('resize'))
  }

  // Tema
  const toggleTheme = () => {
    const root = document.documentElement
    const cur = root.getAttribute('data-theme')
    const dark = cur ? cur === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    const next = dark ? 'light' : 'dark'
    store.set('k-theme', next)
    withTransition(() => {
      root.setAttribute('data-theme', next)
      root.classList.toggle('is-dark', next === 'dark')
    })
  }

  // Dil menüsü: dışarı tıklayınca / Esc ile kapanır
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('click', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  const goLang = (l: Lang) => {
    setOpen(false)
    if (l === lang) return
    store.set('k-lang', l)
    document.cookie = `k-lang=${l};path=/;max-age=31536000;samesite=lax`
    const url = swapLang(pathname, l) + window.location.hash
    withTransition(() => new Promise<void>((resolve) => { router.push(url, { scroll: false }); setTimeout(resolve, 350) }))
  }

  return (
    <div className="tools">
      <div className="fs" role="group" aria-label={labels.fs}>
        <span className="fs-label">{labels.fs}</span>
        {[0, 1, 2].map((i) => (
          <button key={i} type="button" aria-pressed={fs === i} onClick={() => applyFs(i)}>A</button>
        ))}
      </div>
      <button type="button" className="theme-btn" aria-label={labels.theme} title={labels.theme} onClick={toggleTheme}>
        <Ico name="moon" className="i-moon" />
        <Ico name="sun" className="i-sun" />
      </button>
      <div className={`lang${open ? ' open' : ''}`} ref={box}>
        <button type="button" className="lang-btn" aria-haspopup="listbox" aria-expanded={open} onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}>
          <span className="lang-cur">{lang.toUpperCase()}</span>
          <Ico name="down" />
        </button>
        <ul className="lang-list" role="listbox">
          {LOCALES.map((l) => (
            <li key={l}>
              <button type="button" role="option" aria-selected={l === lang} onClick={() => goLang(l)}>
                <b>{l.toUpperCase()}</b>{LANG_NAMES[l]}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
