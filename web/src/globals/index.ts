import type { GlobalConfig } from 'payload'
import { anyone, hiddenFromAuthors, isAdmin, isAdminOrEditor, onlyAdminSees } from '../access'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  label: 'Ana sayfa',
  admin: {
    group: 'Ayarlar',
    hidden: hiddenFromAuthors,
    description: 'Manşet haberleri her haberin "Manşette göster" kutusundan seçilir. Burada üst duyuru bandı ve ek son dakika satırları var.',
  },
  access: { read: anyone, update: isAdminOrEditor },
  fields: [
    {
      name: 'notice',
      label: 'Üst duyuru bandı',
      type: 'group',
      fields: [
        { name: 'enabled', label: 'Bandı göster', type: 'checkbox', defaultValue: true },
        { name: 'text', label: 'Metin', type: 'text', localized: true },
        { name: 'link', label: 'Bağlantı (isteğe bağlı)', type: 'text' },
      ],
    },
    {
      name: 'tickerExtra',
      label: 'Son dakika şeridine ek satırlar',
      type: 'array',
      labels: { singular: 'Satır', plural: 'Satırlar' },
      admin: { description: '"Son dakika" işaretli haberlere ek olarak kısa notlar (ör. "Yollar açıldı").' },
      fields: [
        { name: 'text', label: 'Metin', type: 'text', required: true, localized: true },
        { name: 'link', label: 'Bağlantı', type: 'text' },
      ],
    },
    {
      name: 'heroSeconds',
      label: 'Manşet slaytı süresi (saniye)',
      type: 'number',
      defaultValue: 7,
      min: 4,
      max: 15,
    },
  ],
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site ayarları',
  admin: { group: 'Yönetim', hidden: onlyAdminSees },
  access: { read: anyone, update: isAdmin },
  fields: [
    { name: 'siteName', label: 'Site adı', type: 'text', defaultValue: 'KAR-DEF', required: true },
    { name: 'tagline', label: 'Alt başlık', type: 'text', localized: true, defaultValue: 'Haber ve Arşiv Platformu' },
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
        { name: 'whatsapp', label: 'WhatsApp kanal bağlantısı', type: 'text' },
      ],
    },
    {
      name: 'social',
      label: 'Sosyal medya',
      type: 'array',
      labels: { singular: 'Hesap', plural: 'Hesaplar' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'platform',
              label: 'Platform',
              type: 'select',
              required: true,
              options: ['Facebook', 'Instagram', 'YouTube', 'X', 'TikTok'].map((p) => ({ label: p, value: p.toLowerCase() })),
              admin: { width: '30%' },
            },
            { name: 'url', label: 'Adres', type: 'text', required: true, admin: { width: '70%' } },
          ],
        },
      ],
    },
    { name: 'footerNote', label: 'Alt bilgi notu', type: 'textarea', localized: true },
  ],
}
