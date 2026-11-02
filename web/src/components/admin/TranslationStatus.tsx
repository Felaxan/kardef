'use client'
import { useFormFields } from '@payloadcms/ui'
import React from 'react'

type LangState = { hash?: string; at?: string; manual?: boolean }
type Meta = { at?: string; langs?: Record<string, LangState> }

const LANGS: [string, string][] = [['ku', 'Kurdî'], ['en', 'English'], ['de', 'Deutsch'], ['nl', 'Nederlands'], ['fr', 'Français']]
const when = (iso?: string) =>
  iso ? new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : ''

/** Kenar çubuğunda: hangi dil otomatik çevrildi, hangisi elle düzeltildi */
export const TranslationStatus = ({ enabled }: { enabled?: boolean }) => {
  const meta = useFormFields(([f]) => f.autoTr?.value) as Meta | undefined

  return (
    <div className="kd-tr">
      <p className="kd-tr-title">Otomatik çeviri</p>
      {!enabled ? (
        <p className="kd-tr-note">Kapalı. Çeviri anahtarı tanımlanınca Türkçe içerik yayınlanınca diğer dillere kendiliğinden çevrilir.</p>
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
        </>
      )}
    </div>
  )
}
