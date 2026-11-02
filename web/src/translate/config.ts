/*
  Otomatik çeviri ayarları
  Türkçe içerik yayınlanınca aşağıdaki alanlar diğer dillere çevrilir.
*/
import { DEMO } from '../demo'

/** Site dili → Microsoft Translator dil kodu ("ku" Microsoft'ta Sorani'dir; Kurmancî "kmr") */
export const TARGETS = { ku: 'kmr', en: 'en', de: 'de', nl: 'nl', fr: 'fr' } as const
export type TargetLang = keyof typeof TARGETS
export const TARGET_LANGS = Object.keys(TARGETS) as TargetLang[]

export type FieldSpec = { path: string; kind: 'text' | 'rich' }
const text = (path: string): FieldSpec => ({ path, kind: 'text' })
const rich = (path: string): FieldSpec => ({ path, kind: 'rich' })

/** Hangi bölümde hangi alanlar çevrilir */
export const COLLECTION_FIELDS: Record<string, FieldSpec[]> = {
  posts: [text('title'), text('excerpt'), rich('content')],
  events: [text('title'), text('place'), rich('description')],
  announcements: [text('title'), rich('content')],
  archive: [text('title'), rich('description'), rich('transcript')],
  villages: [rich('history')],
  categories: [text('name')],
  media: [text('alt'), text('caption')],
  organizations: [text('name'), text('base'), text('description'), rich('about')],
}
export const GLOBAL_FIELDS: Record<string, FieldSpec[]> = {
  homepage: [text('notice.text')],
  'site-settings': [text('tagline'), text('footerNote')],
}

/** Hiç çevrilmeyecek özel adlar (köy adları veritabanından ayrıca eklenir) */
export const GLOSSARY = ['KAR-DEF', 'AV-KARDEP', 'Karakoçan', 'Elazığ']

/** Çeviri açık mı? Anahtar tanımlıysa (ya da deneme modunda) ve maket modunda değilse */
export const translatorEnabled = () =>
  !DEMO && (Boolean(process.env.AZURE_TRANSLATOR_KEY) || process.env.TRANSLATOR_MOCK === '1')
