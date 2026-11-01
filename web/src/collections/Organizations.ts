import type { CollectionConfig } from 'payload'
import { anyone, isAdmin, isAdminOrEditor, onlyAdminSees } from '../access'
import { slugField } from '../fields'

export const Organizations: CollectionConfig = {
  slug: 'organizations',
  labels: { singular: 'Kurum', plural: 'Kurumlar' },
  admin: {
    useAsTitle: 'abbr',
    group: 'Yönetim',
    hidden: onlyAdminSees,
    defaultColumns: ['abbr', 'name', 'founded'],
    description: 'Sitenin "Kurumlarımız" bölümünde görünen federasyon ve platform bilgileri.',
  },
  access: { read: anyone, create: isAdmin, update: isAdminOrEditor, delete: isAdmin },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'abbr', label: 'Kısa adı', type: 'text', required: true, admin: { width: '30%', placeholder: 'KAR-DEF' } },
        { name: 'name', label: 'Tam adı', type: 'text', required: true, localized: true, admin: { width: '70%' } },
      ],
    },
    { name: 'logo', label: 'Logo', type: 'upload', relationTo: 'media' },
    {
      type: 'row',
      fields: [
        { name: 'founded', label: 'Kuruluş yılı', type: 'number', admin: { width: '33%' } },
        { name: 'base', label: 'Merkez', type: 'text', localized: true, admin: { width: '33%' } },
        {
          name: 'color',
          label: 'Renk',
          type: 'select',
          defaultValue: 'kirmizi',
          options: [
            { label: 'Kırmızı', value: 'kirmizi' },
            { label: 'Mor', value: 'mor' },
          ],
          admin: { width: '34%' },
        },
      ],
    },
    { name: 'description', label: 'Kısa tanıtım', type: 'textarea', localized: true },
    { name: 'about', label: 'Hakkında sayfası', type: 'richText', localized: true },
    {
      name: 'contact',
      label: 'İletişim',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'email', label: 'E-posta', type: 'email', admin: { width: '50%' } },
            { name: 'phone', label: 'Telefon', type: 'text', admin: { width: '50%' } },
          ],
        },
        { name: 'address', label: 'Adres', type: 'textarea' },
      ],
    },
    slugField('abbr'),
  ],
}
