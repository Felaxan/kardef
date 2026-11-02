import path from 'path'
import type { CollectionConfig } from 'payload'
import { anyone, isAdminOrEditor, isLoggedIn } from '../access'
import { DEMO } from '../demo'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Dosya', plural: 'Medya' },
  admin: {
    group: 'İçerik',
    description: 'Fotoğraflar, belgeler (PDF), ses ve video dosyaları.',
    defaultColumns: ['filename', 'alt', 'credit', 'updatedAt'],
  },
  access: {
    read: anyone,
    create: isLoggedIn,
    update: isLoggedIn,
    delete: isAdminOrEditor,
  },
  upload: {
    staticDir: DEMO ? path.join(process.cwd(), 'demo', 'media') : 'media',
    mimeTypes: ['image/*', 'audio/*', 'video/*', 'application/pdf'],
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 800, height: 533, position: 'centre' },
      { name: 'hero', width: 1800 },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Görselde ne var?',
      type: 'text',
      localized: true,
      admin: { description: 'Görme engelliler ve Google için kısa açıklama. Örn: "Saat kulesi ve ilçe meydanı".' },
    },
    { name: 'caption', label: 'Alt yazı', type: 'textarea', localized: true },
    { name: 'credit', label: 'Fotoğrafçı / kaynak', type: 'text' },
    {
      name: 'license',
      label: 'Kullanım izni',
      type: 'select',
      defaultValue: 'izinli',
      options: [
        { label: 'Sahibinin izniyle', value: 'izinli' },
        { label: 'Kurumun kendi çekimi', value: 'kurum' },
        { label: 'CC BY', value: 'cc-by' },
        { label: 'CC BY-SA', value: 'cc-by-sa' },
        { label: 'CC0 / Kamu malı', value: 'cc0' },
      ],
    },
  ],
}
