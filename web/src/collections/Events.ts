import type { CollectionConfig } from 'payload'
import { authorsCannotPublish, contentAccess, setCreatedBy } from '../access'
import { createdByField, kurumField, slugField } from '../fields'

export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Etkinlik', plural: 'Etkinlikler' },
  admin: {
    useAsTitle: 'title',
    group: 'İçerik',
    defaultColumns: ['title', 'startDate', 'region', 'place', '_status'],
  },
  defaultSort: 'startDate',
  access: contentAccess,
  versions: { drafts: { autosave: { interval: 3000 } }, maxPerDoc: 20 },
  hooks: { beforeChange: [setCreatedBy, authorsCannotPublish] },
  fields: [
    { name: 'title', label: 'Etkinlik adı', type: 'text', required: true, localized: true },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          label: 'Başlangıç',
          type: 'date',
          required: true,
          admin: { width: '50%', date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy HH:mm' } },
        },
        {
          name: 'endDate',
          label: 'Bitiş (isteğe bağlı)',
          type: 'date',
          admin: { width: '50%', date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy HH:mm' } },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'region',
          label: 'Nerede?',
          type: 'select',
          required: true,
          defaultValue: 'karakocan',
          options: [
            { label: 'Karakoçan / Türkiye', value: 'karakocan' },
            { label: 'Avrupa', value: 'avrupa' },
            { label: 'Çevrim içi', value: 'online' },
          ],
          admin: { width: '50%' },
        },
        {
          name: 'place',
          label: 'Şehir / yer',
          type: 'text',
          localized: true,
          admin: { width: '50%', placeholder: 'Örn: Köln, Karakoçan merkez' },
        },
      ],
    },
    {
      name: 'address',
      label: 'Açık adres',
      type: 'textarea',
      admin: { condition: (_, s) => s?.region !== 'online' },
    },
    {
      name: 'onlineLink',
      label: 'Katılım bağlantısı (Zoom, YouTube...)',
      type: 'text',
      admin: { condition: (_, s) => s?.region === 'online' },
    },
    { name: 'image', label: 'Görsel', type: 'upload', relationTo: 'media' },
    { name: 'description', label: 'Açıklama', type: 'richText', localized: true },
    {
      name: 'registration',
      label: 'Kayıt',
      type: 'group',
      fields: [
        { name: 'required', label: 'Katılım için kayıt gerekiyor', type: 'checkbox' },
        { name: 'link', label: 'Kayıt bağlantısı veya telefon', type: 'text', admin: { condition: (_, s) => Boolean(s?.required) } },
      ],
    },
    slugField(),
    kurumField,
    createdByField,
  ],
}
