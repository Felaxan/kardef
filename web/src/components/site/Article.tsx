import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import Link from 'next/link'
import React from 'react'
import { fmt, t, type Lang } from '@/i18n/ui'
import { hasRichText, isMedia, mediaUrl } from '@/lib/cms'
import type { Media } from '@/payload-types'
import { Ico } from './Icons'

/** Sayfanın başındaki "Ana sayfaya dön" bağlantısı */
export function Crumbs({ lang, href, label }: { lang: Lang; href?: string; label?: string }) {
  return (
    <nav className="crumbs" aria-label="breadcrumb">
      <Link href={href ?? `/${lang}`}><Ico name="back" /> {label ?? t(lang, 'back.home')}</Link>
    </nav>
  )
}

/** Başlık bloğu: etiket, başlık, özet ve künye satırı */
export function ArticleHead({ kicker, title, dek, meta }: { kicker?: string; title: string; dek?: string | null; meta?: React.ReactNode }) {
  return (
    <header className="art-head">
      {kicker && <span className="kicker intro" style={{ '--d': 0 } as React.CSSProperties}>{kicker}</span>}
      <h1 className="intro" style={{ '--d': 1 } as React.CSSProperties}>{title}</h1>
      {dek && <p className="dek intro" style={{ '--d': 2 } as React.CSSProperties}>{dek}</p>}
      {meta && <div className="art-meta intro" style={{ '--d': 3 } as React.CSSProperties}>{meta}</div>}
    </header>
  )
}

/** Büyük kapak fotoğrafı (ekrana girince yavaşça netleşir) */
export function HeroFigure({ media, lang }: { media: number | Media | null | undefined; lang: Lang }) {
  const src = mediaUrl(media, 'hero')
  if (!src || !isMedia(media)) return null
  const cap = [media.caption, media.credit && `${t(lang, 'foot.photos')}: ${media.credit.replace(/, Wikimedia Commons$/, '')}`].filter(Boolean).join(' · ')
  return (
    <figure className="art-hero">
      <div className="frame"><img src={src} alt={media.alt || ''} /></div>
      {cap && <figcaption>{cap}</figcaption>}
    </figure>
  )
}

/** Zengin metin (panelde yazılan haber metni) */
export function Prose({ data }: { data: unknown }) {
  if (!hasRichText(data)) return null
  return (
    <div className="prose">
      <RichText data={data as SerializedEditorState} />
    </div>
  )
}

/** Fotoğraf galerisi ve dosya ekleri */
export function Files({ files, lang }: { files?: (number | Media)[] | null; lang: Lang }) {
  const list = (files ?? []).filter(isMedia)
  const images = list.filter((m) => m.mimeType?.startsWith('image'))
  const audio = list.filter((m) => m.mimeType?.startsWith('audio'))
  const other = list.filter((m) => !m.mimeType?.startsWith('image') && !m.mimeType?.startsWith('audio'))
  return (
    <>
      {audio.map((m) => <audio key={m.id} className="audio-player" controls preload="none" src={m.url || undefined} />)}
      {images.length > 0 && (
        <div className="gallery">
          {images.map((m) => (
            <figure key={m.id} data-reveal="">
              <a className="frame" href={m.url || '#'} target="_blank" rel="noreferrer"><img src={mediaUrl(m, 'card') || ''} alt={m.alt || ''} loading="lazy" /></a>
              {(m.caption || m.credit) && <figcaption>{m.caption || m.credit}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      {other.length > 0 && (
        <>
          <h2 className="sec-label" style={{ marginTop: 32 }}>{t(lang, 'not.attachments')}</h2>
          <ul className="attach">
            {other.map((m) => (
              <li key={m.id}><a href={m.url || '#'} target="_blank" rel="noreferrer"><Ico name="file" />{m.filename}</a></li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

const cssVars = (v: Record<string, string | number>) => v as React.CSSProperties

/** Kelimeleri sırayla aşağıdan yukarı kayan büyük başlık (haber sayfasıyla aynı) */
export function WordTitle({ text, className = 'story-title', delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <h1 className={className} aria-label={text}>
      {text.split(/\s+/).filter(Boolean).map((w, i) => (
        <React.Fragment key={i}>
          <span className="w" aria-hidden="true"><span style={cssVars({ '--w': i + delay })}>{w}</span></span>{' '}
        </React.Fragment>
      ))}
    </h1>
  )
}

/** Kurum mührü: içeriği yayımlayan kurumun logosu (ortaksa ikisi) */
export function KurumSeal({ kurum }: { kurum?: string | null }) {
  const logos = kurum === 'avkardep' ? ['av-kardep'] : kurum === 'ortak' ? ['kar-def', 'av-kardep'] : ['kar-def']
  return (
    <span className={`seal${logos.length > 1 ? ' seal--two' : ''}`} aria-hidden="true">
      {logos.map((l) => <img key={l} src={`/brand/${l}-logo.png`} alt="" />)}
    </span>
  )
}

/** Bir tarihin, verilen saat dilimine göre bugünden kaç takvim günü sonra olduğu */
export function daysUntil(input: string | Date, tz = 'Europe/Istanbul'): number {
  const day = (d: Date) => {
    const [y, m, dd] = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d).split('-').map(Number)
    return Date.UTC(y, m - 1, dd)
  }
  return Math.round((day(new Date(input)) - day(new Date())) / 86400000)
}

/** "12 gün kaldı", "Yarın", "Bugün", "Sona erdi" */
export function countdownLabel(lang: Lang, days: number): string {
  if (days < 0) return t(lang, 'ev.past')
  if (days === 0) return t(lang, 'ev.today')
  if (days === 1) return t(lang, 'ev.tomorrow')
  return `${days} ${t(lang, 'days.left')}`
}

/** Takvim yaprağı: gün adı, büyük gün sayısı, ay ve saat */
export function DateTile({ lang, date, tz, accent }: { lang: Lang; date: string; tz?: string; accent?: 'av' }) {
  const d = new Date(date)
  const dayNum = new Intl.DateTimeFormat('en-GB', { timeZone: tz ?? 'Europe/Istanbul', day: 'numeric' }).format(d)
  const year = new Intl.DateTimeFormat('en-GB', { timeZone: tz ?? 'Europe/Istanbul', year: 'numeric' }).format(d)
  return (
    <div className={`date-tile${accent ? ` date-tile--${accent}` : ''}`}>
      <span className="dt-wd">{fmt(lang, d, 'weekday', tz)}</span>
      <span className="dt-d">{dayNum}</span>
      <span className="dt-m">{fmt(lang, d, 'month', tz)} {year}</span>
      <span className="dt-t">{fmt(lang, d, 'time', tz)}</span>
    </div>
  )
}

/** Bu dildeki metin otomatik çeviri mi? (elle düzeltildiyse not gösterilmez) */
export function isAutoTranslated(autoTr: unknown, lang: Lang): boolean {
  if (lang === 'tr') return false
  const s = (autoTr as { langs?: Record<string, { hash?: string; manual?: boolean }> } | null)?.langs?.[lang]
  return Boolean(s?.hash && !s.manual)
}

/** "Bu metin Türkçeden otomatik olarak çevrildi · Türkçe aslı" */
export function AutoNote({ lang, autoTr, trHref }: { lang: Lang; autoTr: unknown; trHref: string }) {
  if (!isAutoTranslated(autoTr, lang)) return null
  return (
    <p className="auto-note intro" style={{ '--d': 4 } as React.CSSProperties}>
      <Ico name="globe" />
      <span>{t(lang, 'auto.note')}</span>
      <Link href={trHref} hrefLang="tr">{t(lang, 'auto.orig')}</Link>
    </p>
  )
}
