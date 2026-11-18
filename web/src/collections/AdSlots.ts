import path from 'path'
import type { CollectionConfig } from 'payload'
import { anyone, isAdmin, onlyAdminSees } from '../access'
import { DEMO } from '../demo'

/*
  Reklamlar yalnızca yöneticiye açıktır (panel menüsü ve API dahil).
  Site reklamları sunucuda okur (lib/ads-server.ts), yalnızca yayındakileri gösterir.
*/

/** Reklam görselleri: sitede görünsün diye dosyalar herkese açık, bölüm yalnızca yöneticide */
export const AdImages: CollectionConfig = {
  slug: 'ad-images',
  labels: { singular: 'Reklam görseli', plural: 'Reklam görselleri' },
  admin: { group: 'Reklam', hidden: onlyAdminSees, description: 'Reklam yerlerinde kullanılan görseller.' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  upload: {
    staticDir: DEMO ? path.join(process.cwd(), 'demo', 'ad-images') : 'ad-images',
    mimeTypes: ['image/*'],
    imageSizes: [{ name: 'thumbnail', width: 400, height: 200, position: 'centre' }],
    adminThumbnail: 'thumbnail',
  },
  fields: [{ name: 'alt', label: 'Görselde ne yazıyor?', type: 'text' }],
}

export const AdSlots: CollectionConfig = {
  slug: 'ad-slots',
  labels: { singular: 'Reklam yeri', plural: 'Reklam yerleri' },
  admin: {
    useAsTitle: 'name',
    group: 'Reklam',
    hidden: onlyAdminSees,
    defaultColumns: ['name', 'key', 'enabled', 'seconds'],
    description:
      'Sitedeki sabit reklam yerleri. Bir yere tek reklam ya da 20\'ye kadar reklam koyabilirsiniz; birden fazlaysa seçtiğiniz sürede sırayla döner.',
  },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'name', label: 'Ad', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'key',
          label: 'Sitedeki yeri',
          type: 'select',
          required: true,
          unique: true,
          admin: { width: '50%' },
          options: [
            { label: 'Üst bant (menünün altı)', value: 'top' },
            { label: 'Haberlerin arası', value: 'feed' },
            { label: 'Haber sayfasının yanı', value: 'side' },
          ],
        },
        {
          name: 'seconds',
          label: 'Değişme süresi (saniye)',
          type: 'number',
          defaultValue: 8,
          min: 3,
          max: 60,
          admin: { width: '25%', description: 'Birden fazla reklam varsa' },
        },
        { name: 'enabled', label: 'Bu yer açık', type: 'checkbox', defaultValue: true, admin: { width: '25%' } },
      ],
    },
    {
      name: 'ads',
      label: 'Reklamlar',
      type: 'array',
      maxRows: 20,
      labels: { singular: 'Reklam', plural: 'Reklamlar' },
      admin: { initCollapsed: false, components: { RowLabel: '/components/admin/AdRowLabel#AdRowLabel' } },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'advertiser', label: 'Reklam veren', type: 'text', required: true, admin: { width: '50%' } },
            { name: 'link', label: 'Tıklayınca açılacak adres', type: 'text', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'image', label: 'Görsel', type: 'upload', relationTo: 'ad-images', required: true, admin: { width: '50%' } },
            {
              name: 'mobileImage',
              label: 'Telefon görseli (isteğe bağlı)',
              type: 'upload',
              relationTo: 'ad-images',
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'startsAt', label: 'Başlangıç', type: 'date', admin: { width: '33%', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' } } },
            { name: 'endsAt', label: 'Bitiş (o gün dahil)', type: 'date', admin: { width: '33%', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' } } },
            { name: 'active', label: 'Yayında', type: 'checkbox', defaultValue: true, admin: { width: '33%' } },
          ],
        },
      ],
    },
  ],
}
