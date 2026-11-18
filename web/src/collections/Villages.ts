import type { CollectionConfig } from 'payload'
import { anyone, hiddenFromAuthors, isAdminOrEditor } from '../access'
import { slugField } from '../fields'
import { auditCollectionChange, auditCollectionDelete } from '../lib/security-server'

export const Villages: CollectionConfig = {
  slug: 'villages',
  labels: { singular: 'Köy', plural: 'Köyler' },
  admin: {
    useAsTitle: 'name',
    group: 'Arşiv ve köyler',
    hidden: hiddenFromAuthors,
    defaultColumns: ['name', 'type', 'updatedAt'],
    description: 'Her köyün ve mahallenin kendi sayfası. Haberler, arşiv kayıtları ve vefat duyuruları köye bağlanabilir.',
  },
  defaultSort: 'name',
  versions: { maxPerDoc: 20 },
  access: { read: anyone, create: isAdminOrEditor, update: isAdminOrEditor, delete: isAdminOrEditor },
  hooks: {
    afterChange: [auditCollectionChange('villages')],
    afterDelete: [auditCollectionDelete('villages')],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Köy / mahalle adı', type: 'text', required: true, admin: { width: '50%' } },
        {
          name: 'type',
          label: 'Türü',
          type: 'select',
          defaultValue: 'koy',
          options: [
            { label: 'Köy', value: 'koy' },
            { label: 'Mahalle', value: 'mahalle' },
            { label: 'Mezra', value: 'mezra' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'otherNames',
      label: 'Diğer adları',
      type: 'text',
      hasMany: true,
      admin: { description: 'Eski adı, Kurmancî veya Zazaca adı. Aramada da bulunur.' },
    },
    { name: 'coverImage', label: 'Kapak fotoğrafı', type: 'upload', relationTo: 'media' },
    { name: 'history', label: 'Köyün tarihçesi', type: 'richText', localized: true },
    { name: 'gallery', label: 'Fotoğraf galerisi', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'location',
      label: 'Konum',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'lat', label: 'Enlem', type: 'number', admin: { width: '50%' } },
            { name: 'lng', label: 'Boylam', type: 'number', admin: { width: '50%' } },
          ],
        },
      ],
    },
    slugField('name'),
  ],
}
