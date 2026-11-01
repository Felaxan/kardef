import type { CollectionConfig } from 'payload'
import { authorsCannotPublish, contentAccess, setCreatedBy } from '../access'
import { createdByField, kurumField, publishedAtField, slugField } from '../fields'

const dt = { pickerAppearance: 'dayAndTime' as const, displayFormat: 'd MMMM yyyy HH:mm' }
const d = { pickerAppearance: 'dayOnly' as const, displayFormat: 'd MMMM yyyy' }

export const Announcements: CollectionConfig = {
  slug: 'announcements',
  labels: { singular: 'Duyuru', plural: 'Duyurular' },
  admin: {
    useAsTitle: 'title',
    group: 'İçerik',
    defaultColumns: ['title', 'type', '_status', 'publishedAt'],
    description: 'Vefat, burs, toplantı, yardım ve üyelik duyuruları. Türünü seçince ilgili alanlar açılır.',
  },
  defaultSort: '-publishedAt',
  access: contentAccess,
  versions: { drafts: { autosave: { interval: 3000 } }, maxPerDoc: 20 },
  hooks: { beforeChange: [setCreatedBy, authorsCannotPublish] },
  fields: [
    {
      name: 'type',
      label: 'Duyuru türü',
      type: 'select',
      required: true,
      defaultValue: 'genel',
      options: [
        { label: 'Vefat', value: 'vefat' },
        { label: 'Burs', value: 'burs' },
        { label: 'Toplantı', value: 'toplanti' },
        { label: 'Yardım', value: 'yardim' },
        { label: 'Üyelik', value: 'uyelik' },
        { label: 'Genel', value: 'genel' },
      ],
    },
    { name: 'title', label: 'Başlık', type: 'text', required: true, localized: true },

    // Vefat
    {
      name: 'vefat',
      label: 'Vefat bilgileri',
      type: 'group',
      admin: { condition: (_, s) => s?.type === 'vefat' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', label: 'Vefat edenin adı soyadı', type: 'text', admin: { width: '50%' } },
            { name: 'village', label: 'Köyü', type: 'relationship', relationTo: 'villages', admin: { width: '50%' } },
          ],
        },
        { name: 'photo', label: 'Fotoğraf (isteğe bağlı)', type: 'upload', relationTo: 'media' },
        {
          type: 'row',
          fields: [
            { name: 'date', label: 'Vefat tarihi', type: 'date', admin: { width: '50%', date: d } },
            { name: 'funeralTime', label: 'Cenaze namazı', type: 'date', admin: { width: '50%', date: dt } },
          ],
        },
        { name: 'funeralPlace', label: 'Cenaze yeri / defin', type: 'text' },
        { name: 'condolence', label: 'Taziye yeri ve tarihleri', type: 'textarea' },
      ],
    },

    // Burs
    {
      name: 'burs',
      label: 'Burs bilgileri',
      type: 'group',
      admin: { condition: (_, s) => s?.type === 'burs' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'deadline', label: 'Son başvuru', type: 'date', admin: { width: '50%', date: d } },
            { name: 'applyLink', label: 'Başvuru bağlantısı', type: 'text', admin: { width: '50%' } },
          ],
        },
      ],
    },

    // Toplantı
    {
      name: 'toplanti',
      label: 'Toplantı bilgileri',
      type: 'group',
      admin: { condition: (_, s) => s?.type === 'toplanti' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'date', label: 'Tarih ve saat', type: 'date', admin: { width: '50%', date: dt } },
            { name: 'place', label: 'Yer', type: 'text', admin: { width: '50%' } },
          ],
        },
      ],
    },

    { name: 'content', label: 'Duyuru metni', type: 'richText', localized: true },
    {
      name: 'attachments',
      label: 'Ekler (PDF, form vb.)',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
    },

    slugField(),
    publishedAtField,
    {
      name: 'pinned',
      label: 'Sitenin üstündeki duyuru bandında göster',
      type: 'checkbox',
      admin: { position: 'sidebar' },
    },
    kurumField,
    createdByField,
  ],
}
