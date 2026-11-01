import type { CollectionConfig } from 'payload'
import { authorsCannotPublish, contentAccess, setCreatedBy } from '../access'
import { bolgeOptions, createdByField, kurumField, publishedAtField, slugField } from '../fields'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Haber', plural: 'Haberler' },
  admin: {
    useAsTitle: 'title',
    group: 'İçerik',
    defaultColumns: ['title', 'category', 'kurum', '_status', 'publishedAt'],
    listSearchableFields: ['title', 'excerpt'],
    description: 'Önce Türkçe yazıp kaydedin; diğer dillere sağ üstteki dil seçiciden geçebilirsiniz.',
  },
  defaultSort: '-publishedAt',
  access: contentAccess,
  versions: { drafts: { autosave: { interval: 3000 } }, maxPerDoc: 30 },
  hooks: { beforeChange: [setCreatedBy, authorsCannotPublish] },
  fields: [
    {
      name: 'title',
      label: 'Başlık',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 140,
    },
    {
      name: 'excerpt',
      label: 'Özet',
      type: 'textarea',
      localized: true,
      maxLength: 320,
      admin: { description: 'Ana sayfada ve paylaşımlarda başlığın altında görünen 1–2 cümle.' },
    },
    {
      name: 'heroImage',
      label: 'Kapak fotoğrafı',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { contains: 'image' } },
    },
    { name: 'content', label: 'Haber metni', type: 'richText', localized: true },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          label: 'Kategori',
          type: 'relationship',
          relationTo: 'categories',
          admin: { width: '50%', components: { Cell: '/components/admin/CategoryCell#CategoryCell' } },
        },
        { name: 'bolge', label: 'Bölge', type: 'select', options: bolgeOptions, defaultValue: 'karakocan', admin: { width: '50%' } },
      ],
    },
    {
      name: 'village',
      label: 'İlgili köy',
      type: 'relationship',
      relationTo: 'villages',
      admin: { description: 'Seçerseniz haber o köyün sayfasında da görünür.' },
    },

    // Kenar çubuğu
    slugField(),
    publishedAtField,
    {
      name: 'featured',
      label: 'Manşette göster',
      type: 'checkbox',
      admin: { position: 'sidebar', description: 'Ana sayfadaki büyük kayan bölümde yer alır (en yeni 4 haber).' },
    },
    {
      name: 'breaking',
      label: 'Son dakika şeridinde göster',
      type: 'checkbox',
      admin: { position: 'sidebar' },
    },
    { name: 'authorName', label: 'Haberi hazırlayan', type: 'text', admin: { position: 'sidebar', description: 'Boşsa "Haber Merkezi" yazar.' } },
    kurumField,
    createdByField,
  ],
}
