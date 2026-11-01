import type { CollectionConfig } from 'payload'
import { isAdmin, onlyAdminSees } from '../access'
import { kurumOptions } from '../fields'

const selfOrAdmin = ({ req: { user } }: { req: { user: unknown } }) => {
  const u = user as { id: number | string; role?: string } | null
  if (!u) return false
  if (u.role === 'admin') return true
  return { id: { equals: u.id } }
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Kullanıcı', plural: 'Kullanıcılar' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'kurum'],
    group: 'Yönetim',
    hidden: onlyAdminSees,
    description: 'Panele girebilen kişiler. Yeni kişiyi yalnızca yönetici ekleyebilir.',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 gün oturum açık kalsın
    maxLoginAttempts: 8,
    lockTime: 15 * 60 * 1000,
  },
  access: {
    read: selfOrAdmin,
    update: selfOrAdmin,
    create: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [
      // İlk kullanıcı her zaman yönetici olur
      async ({ req, operation, data }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) data.role = 'admin'
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', label: 'Ad soyad', type: 'text', required: true },
    {
      name: 'role',
      label: 'Rol',
      type: 'select',
      required: true,
      defaultValue: 'author',
      saveToJWT: true,
      options: [
        { label: 'Yönetici', value: 'admin' },
        { label: 'Editör', value: 'editor' },
        { label: 'Yazar', value: 'author' },
      ],
      access: {
        create: ({ req: { user } }) => (user as { role?: string } | null)?.role === 'admin',
        update: ({ req: { user } }) => (user as { role?: string } | null)?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        description:
          'Yönetici: her şey. Editör: tüm içerikleri düzenler ve yayınlar. Yazar: taslak yazar, editör yayınlar.',
      },
    },
    {
      name: 'kurum',
      label: 'Kurum',
      type: 'select',
      options: kurumOptions,
      defaultValue: 'kardef',
      saveToJWT: true,
      admin: { position: 'sidebar', description: 'Bu kişinin eklediği içerikler varsayılan olarak bu kuruma bağlanır.' },
    },
    { name: 'phone', label: 'Telefon', type: 'text' },
  ],
}
