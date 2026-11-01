import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import Link from 'next/link'
import React from 'react'
import { t, type Lang } from '@/i18n/ui'
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
