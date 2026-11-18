'use client'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'
import React, { useEffect, useState } from 'react'

type LangState = { hash?: string; at?: string; manual?: boolean }
type Meta = { at?: string; langs?: Record<string, LangState> }

const LANGS: [string, string][] = [['ku', 'Kurdî'], ['en', 'English'], ['de', 'Deutsch'], ['nl', 'Nederlands'], ['fr', 'Français']]
const when = (iso?: string) =>
  iso ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : ''

function hasRichText(v: unknown): boolean {
  if (!v || typeof v !== 'object') return false
  const s = JSON.stringify(v)
  return /"text"\s*:\s*"[^"]+"/.test(s)
}

function hasZazacaValue(slug: string | undefined, d: Record<string, unknown>): boolean {
  if (slug === 'villages') return hasRichText(d.history)
  if (slug === 'media') return Boolean((typeof d.alt === 'string' && d.alt.trim()) || (typeof d.caption === 'string' && d.caption.trim()))
  if (slug === 'homepage') {
    const notice = d.notice as { text?: string } | undefined
    return Boolean(typeof notice?.text === 'string' && notice.text.trim())
  }
  if (slug === 'site-settings') {
    return Boolean((typeof d.tagline === 'string' && d.tagline.trim()) || (typeof d.footerNote === 'string' && d.footerNote.trim()))
  }
  if (slug === 'categories' || slug === 'organizations') {
    return Boolean(typeof d.name === 'string' && d.name.trim())
  }
  const v = d.title ?? d.name ?? d.tagline
  return Boolean((typeof v === 'string' && v.trim()) || hasRichText(d.content) || hasRichText(d.description))
}

/** Zazaca otomatik çevrilmez: kayıtta Zazaca metin girilmiş mi? (ilgili bölümün çevrilebilir alanına bakar) */
function useZazaca(refreshKey?: string): 'yes' | 'no' | 'unknown' {
  const { id, collectionSlug, globalSlug } = useDocumentInfo()
  const [state, setState] = useState<'yes' | 'no' | 'unknown'>('unknown')
  useEffect(() => {
    const slug = collectionSlug || globalSlug
    const url = collectionSlug && id ? `/api/${collectionSlug}/${id}` : globalSlug ? `/api/globals/${globalSlug}` : null
    if (!url) return
    let alive = true
    fetch(`${url}?locale=zza&fallback-locale=none&depth=0&draft=true`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Record<string, unknown> | null) => {
        if (!alive || !d) return
        setState(hasZazacaValue(slug, d) ? 'yes' : 'no')
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [id, collectionSlug, globalSlug, refreshKey])
  return state
}

/** Kenar çubuğunda: hangi dil otomatik çevrildi, hangisi elle düzeltildi */
export const TranslationStatus = ({ enabled }: { enabled?: boolean }) => {
  const meta = useFormFields(([f]) => f.autoTr?.value) as Meta | undefined
  const updatedAt = useFormFields(([f]) => f.updatedAt?.value) as string | undefined
  const zza = useZazaca(updatedAt || meta?.at)
  const zazaca = (
    <div className={`kd-tr-zza is-${zza}`}>
      <span>Kirmanckî (Zazaca)</span>
      <small>{zza === 'yes' ? 'elle girildi' : zza === 'no' ? 'eksik · elle girilecek' : 'elle girilir'}</small>
      <p className="kd-tr-note">Zazaca otomatik çevrilmez. Sağ üstteki dil seçiciden Kirmanckî’yi seçip metni elle girin; girilmezse sitede Türkçesi görünür.</p>
    </div>
  )

  return (
    <div className="kd-tr">
      <p className="kd-tr-title">Otomatik çeviri</p>
      {!enabled ? (
        <>
          <p className="kd-tr-note">Kapalı. Çeviri anahtarı tanımlanınca Türkçe içerik yayınlanınca diğer dillere kendiliğinden çevrilir.</p>
          {zazaca}
        </>
      ) : (
        <>
          <ul className="kd-tr-list">
            {LANGS.map(([code, name]) => {
              const s = meta?.langs?.[code]
              const state = s?.manual ? 'manual' : s?.hash ? 'auto' : 'wait'
              return (
                <li key={code} className={`is-${state}`}>
                  <span>{name}</span>
                  <small>{state === 'manual' ? 'elle düzenlendi' : state === 'auto' ? `otomatik · ${when(s?.at)}` : 'yayınlanınca çevrilecek'}</small>
                </li>
              )
            })}
          </ul>
          <p className="kd-tr-note">
            Türkçe metin yayınlanınca diğer diller birkaç saniye içinde çevrilir. Bir dili elle düzeltirseniz o dil bir daha ezilmez.
            Kurmancî çevirilerin bir bilen tarafından kontrol edilmesi önerilir.
          </p>
          {zazaca}
        </>
      )}
    </div>
  )
}
