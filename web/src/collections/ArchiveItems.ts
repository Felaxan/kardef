import type { CollectionConfig } from 'payload'
import { authorsCannotPublish, contentAccess, setCreatedBy } from '../access'
import { createdByField, kurumField, slugField } from '../fields'

export const archiveTypes = [
  { label: 'Fotoğraf', value: 'photo' },
  { label: 'Belge / mektup', value: 'document' },
  { label: 'Gazete kupürü', value: 'clipping' },
  { label: 'Ses kaydı', value: 'audio' },
  { label: 'Video', value: 'video' },
  { label: 'Sözlü tarih görüşmesi', value: 'oral' },
]

const aylar = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

export const ArchiveItems: CollectionConfig = {
  slug: 'archive',
  labels: { singular: 'Arşiv kaydı', plural: 'Arşiv' },
  admin: {
    useAsTitle: 'title',
    group: 'Arşiv ve köyler',
    defaultColumns: ['title', 'type', 'year', 'village', '_status'],
    listSearchableFields: ['title', 'donor', 'people'],
    description:
      'Fotoğraf, belge, gazete kupürü, ses ve sözlü tarih kayıtları. Yayınlamadan önce sahibinden izin alındığını işaretleyin.',
  },
  defaultSort: 'year',
  access: contentAccess,
  versions: { drafts: { autosave: { interval: 3000 } }, maxPerDoc: 20 },
  hooks: {
    beforeChange: [
      setCreatedBy,
      authorsCannotPublish,
      ({ data }) => {
        // Dönem (1950'ler, 1960'lar...) yıldan otomatik hesaplanır
        if (typeof data.year === 'number') data.decade = Math.floor(data.year / 10) * 10
        return data
      },
    ],
  },
  fields: [
    { name: 'title', label: 'Başlık', type: 'text', required: true, localized: true },
    {
      name: 'type',
      label: 'Kayıt türü',
      type: 'select',
      required: true,
      defaultValue: 'photo',
      options: archiveTypes,
    },
    {
      type: 'collapsible',
      label: 'Tarih',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'year',
              label: 'Yıl',
              type: 'number',
              required: true,
              min: 1850,
              max: 2100,
              admin: { width: '25%' },
            },
            {
              name: 'month',
              label: 'Ay (biliniyorsa)',
              type: 'select',
              options: aylar.map((a, i) => ({ label: a, value: String(i + 1) })),
              admin: { width: '25%' },
            },
            {
              name: 'day',
              label: 'Gün (biliniyorsa)',
              type: 'number',
              min: 1,
              max: 31,
              admin: { width: '25%', description: 'Gün ve ay girilirse "Bu gün geçmişte" bölümünde çıkar.' },
            },
            {
              name: 'approximate',
              label: 'Tarih yaklaşık',
              type: 'checkbox',
              admin: { width: '25%', style: { alignSelf: 'center' } },
            },
          ],
        },
        {
          name: 'decade',
          label: 'Dönem',
          type: 'number',
          index: true,
          admin: { readOnly: true, description: 'Yıldan otomatik hesaplanır.' },
        },
      ],
    },
    {
      name: 'files',
      label: 'Dosyalar',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: { description: 'Fotoğraf, taranmış belge veya ses dosyası. Birden fazla seçebilirsiniz.' },
    },
    {
      name: 'videoUrl',
      label: 'YouTube bağlantısı',
      type: 'text',
      admin: { condition: (_, s) => s?.type === 'video' || s?.type === 'oral' },
    },
    { name: 'description', label: 'Açıklama', type: 'richText', localized: true },
    {
      name: 'transcript',
      label: 'Deşifre (konuşmanın yazıya dökülmüş hali)',
      type: 'richText',
      localized: true,
      admin: { condition: (_, s) => s?.type === 'audio' || s?.type === 'oral' },
    },
    {
      type: 'collapsible',
      label: 'Kişiler ve yer',
      fields: [
        { name: 'village', label: 'Köy', type: 'relationship', relationTo: 'villages' },
        { name: 'location', label: 'Çekildiği / yazıldığı yer', type: 'text' },
        {
          name: 'people',
          label: 'Kayıtta geçen kişiler',
          type: 'text',
          hasMany: true,
          admin: { description: 'İsimleri tek tek yazıp Enter\'a basın. Aramada bulunur.' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Kaynak ve izin',
      fields: [
        { name: 'donor', label: 'Bağışlayan / sahibi', type: 'text' },
        {
          name: 'permission',
          label: 'Sahibinden yayın izni alındı',
          type: 'checkbox',
          validate: (val: boolean | null | undefined, { data }: { data: Record<string, unknown> }) =>
            data?._status === 'published' && !val
              ? 'Yayınlamadan önce sahibinden izin alındığını işaretleyin.'
              : true,
        },
        { name: 'originalKept', label: 'Aslı sahibine iade edildi', type: 'checkbox' },
      ],
    },
    slugField(),
    {
      name: 'featuredOnHome',
      label: 'Ana sayfa arşiv bölümünde göster',
      type: 'checkbox',
      admin: { position: 'sidebar' },
    },
    kurumField,
    createdByField,
  ],
}
