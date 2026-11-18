import type { GlobalConfig } from 'payload'
import { isAdmin, onlyAdminSees } from '../access'
import { validateSafeUrl } from '../fields'
import { auditGlobalChange, syncShieldFromSettings } from '../lib/security-server'

/*
  Yönetici Güvenlik ve Müdahale Ayarları
  - Yalnızca yöneticiler (admin) okuyabilir ve değiştirebilir.
  - Acil koruma modu (Lockdown), kalıcı/geçici IP engelleme listesi ve alarm bildirim adresini tutar.
*/

export const SecuritySettings: GlobalConfig = {
  slug: 'security-settings',
  label: 'Güvenlik ayarları',
  admin: {
    group: 'Güvenlik',
    hidden: onlyAdminSees,
    description:
      'Acil koruma modu, engellenen IP adresleri ve kritik güvenlik olaylarında bildirim gönderilecek adres.',
  },
  access: {
    read: isAdmin,
    update: isAdmin,
  },
  hooks: {
    afterChange: [
      auditGlobalChange('security-settings'),
      async ({ req }) => {
        await syncShieldFromSettings(req.payload)
      },
    ],
  },
  fields: [
    {
      name: 'lockdownMode',
      label: 'Acil korumaya alma modu (Sistemi salt okunur koru)',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Açıldığında ziyaretçi form gönderimleri ve yönetici dışındaki tüm yazma/değiştirme işlemleri geçici olarak durdurulur. Sitenin okunması normal devam eder.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'autoBanThreshold',
          label: 'Otomatik IP engelleme eşiği (başarısız giriş)',
          type: 'number',
          defaultValue: 6,
          min: 3,
          max: 25,
          admin: {
            width: '40%',
            description: '15 dakika içinde bu sayıya ulaşan IP adresi 30 dakika otomatik engellenir.',
          },
        },
        {
          name: 'alertWebhookUrl',
          label: 'Kritik alarm bildirim adresi (Webhook URL)',
          type: 'text',
          validate: validateSafeUrl,
          admin: {
            width: '60%',
            placeholder: 'https://...',
            description: 'Yüksek ve kritik güvenlik olaylarında JSON bildirim gönderilecek HTTPS adresi (isteğe bağlı).',
          },
        },
      ],
    },
    {
      name: 'blockedIps',
      label: 'Engellenen IP adresleri',
      type: 'array',
      labels: { singular: 'Engelli IP', plural: 'Engelli IP adresleri' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'ip', label: 'IP adresi', type: 'text', required: true, admin: { width: '35%' } },
            { name: 'reason', label: 'Engelleme nedeni', type: 'text', admin: { width: '45%' } },
            { name: 'active', label: 'Etkin', type: 'checkbox', defaultValue: true, admin: { width: '20%' } },
          ],
        },
      ],
    },
  ],
}
