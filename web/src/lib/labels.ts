import type { Archive as ArchiveItem, Category, Post } from '@/payload-types'
import { decadeLabel, t, type Lang } from '@/i18n/ui'

export const kurumLabel = (k?: string | null) => (k === 'avkardep' ? 'AV-KARDEP' : k === 'ortak' ? 'KAR-DEF · AV-KARDEP' : 'KAR-DEF')

export const categoryName = (c: Post['category']) => (c && typeof c === 'object' ? (c as Category).name : undefined)

export const archiveTypeLabel = (lang: Lang, type: ArchiveItem['type']) =>
  t(lang, { photo: 'type.photo', document: 'type.doc', clipping: 'type.clip', audio: 'type.audio', video: 'type.video', oral: 'type.oral' }[type])

export const archiveYear = (lang: Lang, a: Pick<ArchiveItem, 'year' | 'approximate' | 'decade'>) =>
  a.approximate ? decadeLabel(lang, a.decade ?? Math.floor(a.year / 10) * 10) : String(a.year)

export const announcementTypeLabel = (lang: Lang, type?: string | null) =>
  !type || type === 'genel' ? t(lang, 'not.title') : t(lang, `cat.${type}`)

/** Türkçe alfabe sırası (köy rehberi) */
export const ALPHABET = ['A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'H', 'I', 'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P', 'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z']
export const firstLetter = (name: string) => name.trim().charAt(0).toLocaleUpperCase('tr')
