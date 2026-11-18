import { APIError, type CollectionConfig } from 'payload'
import { isAdmin, onlyAdminSees } from '../access'
import { kurumOptions } from '../fields'
import { globalShield } from '../lib/security'
import { auditCollectionChange, auditCollectionDelete, ipFromReq, logSecurityEvent } from '../lib/security-server'

const selfOrAdmin = ({ req: { user } }: { req: { user: unknown } }) => {
  const u = user as { id: number | string; role?: string; suspended?: boolean } | null
  if (!u || u.suspended) return false
  if (u.role === 'admin') return true
  return { id: { equals: u.id } }
}

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Kullanıcı', plural: 'Kullanıcılar' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'kurum', 'suspended'],
    group: 'Yönetim',
    hidden: onlyAdminSees,
    description: 'Panele girebilen kişiler. Yeni kişiyi yalnızca yönetici ekleyebilir.',
  },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 gün oturum açık kalsın
    maxLoginAttempts: 8,
    lockTime: 15 * 60 * 1000,
    cookies: {
      sameSite: 'Lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  access: {
    read: selfOrAdmin,
    update: selfOrAdmin,
    create: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    beforeLogin: [
      async ({ req, user }) => {
        const ip = ipFromReq(req)
        const ban = globalShield.isIpBlocked(ip)
        if (ban) {
          throw new APIError('Güvenlik koruması: IP adresinizden çok fazla başarısız deneme yapıldığı için erişiminiz geçici olarak kısıtlandı.', 429, null, true)
        }
        const u = user as { id: number | string; email?: string; suspended?: boolean | null }
        if (u?.suspended) {
          await logSecurityEvent(req.payload, {
            event: 'unauthorized',
            severity: 'high',
            ip,
            userEmail: u.email,
            target: `users #${u.id}`,
            summary: `Askıya alınmış hesapla giriş denemesi engellendi: ${u.email}`,
          })
          throw new APIError('Hesabınız güvenlik nedeniyle geçici olarak askıya alınmıştır. Yöneticiyle iletişime geçin.', 403, null, true)
        }
        return user
      },
    ],
    afterLogin: [
      async ({ req, user }) => {
        const ip = ipFromReq(req)
        globalShield.clearFailedLogins(ip)
        const u = user as { id: number | string; email?: string; role?: string }
        void logSecurityEvent(req.payload, {
          event: 'login_success',
          severity: 'low',
          ip,
          userEmail: u.email,
          target: `users #${u.id}`,
          summary: `${u.email} (${u.role || 'üye'}) yönetim paneline giriş yaptı.`,
        })
        return user
      },
    ],
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
    afterChange: [auditCollectionChange('users')],
    afterDelete: [auditCollectionDelete('users')],
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
    {
      name: 'suspended',
      label: 'Hesap askıya alındı (giriş yapamaz)',
      type: 'checkbox',
      defaultValue: false,
      saveToJWT: true,
      access: {
        create: ({ req: { user } }) => (user as { role?: string } | null)?.role === 'admin',
        update: ({ req: { user } }) => (user as { role?: string } | null)?.role === 'admin',
      },
      admin: {
        position: 'sidebar',
        description: 'İşaretlenirse bu kullanıcı panele giriş yapamaz ve mevcut oturumu geçersiz olur.',
      },
    },
  ],
}
