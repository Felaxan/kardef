import Link from 'next/link'
import React from 'react'
import { t, type Lang } from '@/i18n/ui'
import { Crumbs, WordTitle } from './Article'
import { Ico } from './Icons'

const css = (v: Record<string, string | number>) => v as React.CSSProperties

/** Liste sayfalarının başlığı: etiket, büyük başlık, kısa açıklama ve sağda sayı */
export function ListHead({ lang, kicker, title, lede, count, countLabel, dark }: {
  lang: Lang; kicker: string; title: string; lede?: string; count?: number; countLabel?: string; dark?: boolean
}) {
  return (
    <>
      <Crumbs lang={lang} />
      <header className={`vd-head list-head${dark ? ' is-dark' : ''}`}>
        <div>
          <span className="kicker intro" style={css({ '--d': 0 })}>{kicker}</span>
          <WordTitle text={title} delay={1} />
          {lede && <p className="story-dek intro" style={css({ '--d': 3 })}>{lede}</p>}
        </div>
        {count != null && (
          <p className="vd-count intro" style={css({ '--d': 4 })}>
            <b data-count={count}>{count}</b>
            {countLabel && <span>{countLabel}</span>}
          </p>
        )}
      </header>
    </>
  )
}

/** Süzgeç sekmeleri (adres parametresiyle çalışır, sayfa yenilenmeden geçer) */
export function FilterTabs({ tabs, label }: { tabs: { href: string; label: string; count?: number; active: boolean }[]; label: string }) {
  return (
    <nav className="sp-tabs list-tabs intro" aria-label={label} style={css({ '--d': 5 })}>
      {tabs.map((tb) => (
        <Link key={tb.href} href={tb.href} scroll={false} aria-current={tb.active ? 'page' : undefined} className={tb.count === 0 ? 'is-zero' : ''}>
          {tb.label}{tb.count != null && <span>{tb.count}</span>}
        </Link>
      ))}
    </nav>
  )
}

/** Sayfa numaraları */
export function Pager({ lang, page, pages, href }: { lang: Lang; page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null
  return (
    <nav className="pager" aria-label="pagination">
      {page > 1 ? <Link href={href(page - 1)} className="pg-step"><Ico name="back" />{t(lang, 'page.prev')}</Link> : <span className="pg-step is-off"><Ico name="back" />{t(lang, 'page.prev')}</span>}
      <span className="pg-nums">
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) =>
          p === page ? <b key={p} aria-current="page">{p}</b> : <Link key={p} href={href(p)}>{p}</Link>,
        )}
      </span>
      {page < pages ? <Link href={href(page + 1)} className="pg-step">{t(lang, 'page.next')}<Ico name="arrow" /></Link> : <span className="pg-step is-off">{t(lang, 'page.next')}<Ico name="arrow" /></span>}
    </nav>
  )
}

/** Adres parametrelerini birleştirir (boş olanları atar) */
export function qs(base: string, params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v != null && v !== '' && v !== 1) sp.set(k, String(v))
  const s = sp.toString()
  return s ? `${base}?${s}` : base
}
