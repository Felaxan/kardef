import type { CollectionConfig } from 'payload'
import { anyone, hiddenFromAuthors, isAdminOrEditor } from '../access'
import { slugField } from '../fields'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Kategori', plural: 'Kategoriler' },
  admin: {
    useAsTitle: 'name',
    group: 'İçerik',
    hidden: hiddenFromAuthors,
    defaultColumns: ['name', 'color'],
    description: 'Haberlerin üstündeki kırmızı etiket: Gündem, Köyler, Eğitim...',
  },
  access: { read: anyone, create: isAdminOrEditor, update: isAdminOrEditor, delete: isAdminOrEditor },
  fields: [
    { name: 'name', label: 'Ad', type: 'text', required: true, localized: true },
    slugField('name'),
    {
      name: 'color',
      label: 'Renk',
      type: 'select',
      defaultValue: 'kirmizi',
      options: [
        { label: 'Kırmızı (KAR-DEF)', value: 'kirmizi' },
        { label: 'Mor (AV-KARDEP)', value: 'mor' },
        { label: 'Gri', value: 'gri' },
      ],
    },
  ],
}
