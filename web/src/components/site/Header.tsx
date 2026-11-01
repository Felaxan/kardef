import Link from 'next/link'
import React from 'react'
import { fmt, t, type Lang } from '@/i18n/ui'
import { Ico } from './Icons'
import { NavBar, type NavItem } from './NavBar'
import { TopTools } from './TopTools'

export const navItems = (lang: Lang): NavItem[] => [
  { href: `/${lang}`, label: t(lang, 'nav.gundem') },
  { href: `/${lang}#gundem`, label: t(lang, 'nav.haberler'), section: 'gundem' },
  { href: `/${lang}#etkinlikler`, label: t(lang, 'nav.etkinlikler'), section: 'etkinlikler' },
  { href: `/${lang}#duyurular`, label: t(lang, 'nav.duyurular'), section: 'duyurular' },
  { href: `/${lang}#arsiv`, label: t(lang, 'nav.arsiv'), section: 'arsiv' },
  { href: `/${lang}#arsiv`, label: t(lang, 'nav.sozlu'), section: 'arsiv-sozlu' },
  { href: `/${lang}/koyler`, label: t(lang, 'nav.koyler') },
  { href: `/${lang}#kurumlar`, label: t(lang, 'nav.kurumlar'), section: 'kurumlar' },
]

export type TickerItem = { text: string; href?: string; time?: string }

export function Header({
  lang, siteName, tagline, ticker, notice,
}: {
  lang: Lang; siteName: string; tagline: string; ticker: TickerItem[]
  notice?: { text: string; link?: string | null } | null
}) {
  const items = navItems(lang)
  const tickerList = (hidden?: boolean) => (
    <ul className="ticker-list" aria-hidden={hidden || undefined}>
      {ticker.map((it, i) => (
        <li key={i}>
          {it.time && <time>{it.time}</time>}
          {it.href ? <Link href={it.href} tabIndex={hidden ? -1 : undefined}>{it.text}</Link> : <span>{it.text}</span>}
        </li>
      ))}
    </ul>
  )

  return (
    <>
      <a className="skip" href="#main">{t(lang, 'skip')}</a>

      <div className="topbar">
        <div className="wrap topbar-in">
          <span id="today">{fmt(lang, new Date(), 'full')}</span>
          <span className="topbar-place">{t(lang, 'top.place')}</span>
          <TopTools lang={lang} labels={{ fs: t(lang, 'top.fs'), theme: t(lang, 'top.theme') }} />
        </div>
      </div>

      <header className="head">
        <div className="wrap head-in">
          <Link href={`/${lang}`} className="brand">
            <span className="seals">
              <img src="/brand/kar-def-logo.png" alt="KAR-DEF" width={60} height={60} />
              <img src="/brand/av-kardep-logo.png" alt="AV-KARDEP" width={60} height={60} />
            </span>
            <span className="brand-text intro" style={{ '--d': 1 } as React.CSSProperties}>
              <span className="brand-name">{siteName}</span>
              <span className="brand-tag">{tagline}</span>
            </span>
          </Link>
          <div className="head-actions intro" style={{ '--d': 2 } as React.CSSProperties}>
            <form className="search" role="search" action={`/${lang}/ara`}>
              <Ico name="search" />
              <label htmlFor="q" className="sr">{t(lang, 'search.btn')}</label>
              <input id="q" name="q" type="search" placeholder={t(lang, 'search.ph')} />
              <button type="submit">{t(lang, 'search.btn')}</button>
            </form>
            <Link href={`/${lang}#katki`} className="btn btn-brand"><span>{t(lang, 'cta.katki')}</span><Ico name="arrow" /></Link>
          </div>
        </div>
        <nav className="nav intro" style={{ '--d': 3 } as React.CSSProperties} aria-label="Menü">
          <NavBar items={items} lang={lang} />
        </nav>
      </header>

      {ticker.length > 0 && (
        <div className="ticker intro" style={{ '--d': 4 } as React.CSSProperties}>
          <div className="wrap ticker-in">
            <span className="ticker-label"><span className="pulse" /><span>{t(lang, 'ticker')}</span></span>
            <div className="ticker-view">
              <div className="ticker-track" style={{ '--ticker-dur': `${Math.max(ticker.length * 9, 24)}s` } as React.CSSProperties}>
                {tickerList()}
                {tickerList(true)}
              </div>
            </div>
          </div>
        </div>
      )}

      {notice?.text && (
        <div className="notice-band">
          <div className="wrap">
            <strong>{t(lang, 'not.title')}</strong>
            <p>{notice.text}</p>
            {notice.link && <Link href={notice.link}>→</Link>}
          </div>
        </div>
      )}
    </>
  )
}
