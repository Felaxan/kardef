import type { Field, FieldHook } from 'payload'

/* ---------- Adres (slug) ---------- */
const harf: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u', ê: 'e', ß: 'ss',
}

/** "Köy yollarında kış" -> "koy-yollarinda-kis" */
export const slugify = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/['’`]/g, '') // "Kasım'da" -> "kasimda"
    .replace(/[çğıöşüâîûêß]/g, (c) => harf[c] || c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const formatSlug =
  (from: string): FieldHook =>
  ({ value, data, originalDoc }) => {
    if (typeof value === 'string' && value.trim()) return slugify(value)
    const src = data?.[from] ?? originalDoc?.[from]
    return typeof src === 'string' ? slugify(src) : value
  }

export const slugField = (from = 'title'): Field => ({
  name: 'slug',
  label: 'Adres',
  type: 'text',
  index: true,
  unique: true,
  admin: {
    position: 'sidebar',
    description: 'Sayfanın internet adresi. Boş bırakırsanız başlıktan otomatik oluşur.',
  },
  hooks: { beforeValidate: [formatSlug(from)] },
})

/* ---------- Kurum ---------- */
export const kurumOptions = [
  { label: 'KAR-DEF', value: 'kardef' },
  { label: 'AV-KARDEP', value: 'avkardep' },
  { label: 'Ortak', value: 'ortak' },
]

export const kurumField: Field = {
  name: 'kurum',
  label: 'Kurum',
  type: 'select',
  options: kurumOptions,
  defaultValue: ({ user }) => (user as { kurum?: string } | null)?.kurum || 'kardef',
  admin: { position: 'sidebar' },
}

/* ---------- Ekleyen ---------- */
export const createdByField: Field = {
  name: 'createdBy',
  label: 'Ekleyen',
  type: 'relationship',
  relationTo: 'users',
  admin: { position: 'sidebar', readOnly: true },
  access: { update: () => false },
}

/* ---------- Yayın tarihi ---------- */
export const publishedAtField: Field = {
  name: 'publishedAt',
  label: 'Yayın tarihi',
  type: 'date',
  defaultValue: () => new Date().toISOString(),
  admin: {
    position: 'sidebar',
    date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy HH:mm' },
  },
}

/* ---------- Bölge ---------- */
export const bolgeOptions = [
  { label: 'Karakoçan', value: 'karakocan' },
  { label: 'Avrupa', value: 'avrupa' },
  { label: 'Genel', value: 'genel' },
]
