import type { GlobalConfig } from 'payload'
import { anyone, hiddenFromAuthors, isAdminOrEditor } from '../access'

/** Canlı yayın: YouTube yayını sitedeki "Canlı" sayfasında gösterilir. Yönetici ve editör açar. */
export const Live: GlobalConfig = {
  slug: 'live',
  label: 'Canlı yayın',
  admin: {
    group: 'İçerik',
    hidden: hiddenFromAuthors,
    description:
      'YouTube\'da yayını başlatın, bağlantısını buraya yapıştırıp "Şu an yayında" kutusunu işaretleyin. Menüde kırmızı CANLI işareti yanar ve ana sayfada yayın kutusu çıkar. Yayın bitince kutuyu kaldırın.',
  },
  access: { read: anyone, update: isAdminOrEditor },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'isLive', label: 'Şu an yayında', type: 'checkbox', defaultValue: false, admin: { width: '30%' } },
        {
          name: 'url',
          label: 'YouTube yayın bağlantısı',
          type: 'text',
          admin: { width: '70%', description: 'Ör. https://www.youtube.com/live/… ya da https://youtu.be/…' },
          validate: (v: unknown, { siblingData }: { siblingData: { isLive?: boolean } }) =>
            siblingData?.isLive && !v ? 'Yayındayken bağlantı gerekli' : true,
        },
      ],
    },
    { name: 'title', label: 'Yayın başlığı', type: 'text', localized: true },
    { name: 'description', label: 'Kısa açıklama', type: 'textarea', localized: true },
    {
      name: 'next',
      label: 'Sıradaki yayın',
      type: 'group',
      admin: { description: 'Yayın yokken sayfada gösterilir.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'date', label: 'Tarih ve saat', type: 'date', admin: { width: '40%', date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMMM yyyy HH:mm' } } },
            { name: 'title', label: 'Başlık', type: 'text', localized: true, admin: { width: '60%' } },
          ],
        },
      ],
    },
    {
      name: 'past',
      label: 'Geçmiş yayınlar',
      type: 'array',
      labels: { singular: 'Yayın', plural: 'Yayınlar' },
      admin: { description: 'Yayın bitince kaydını buraya ekleyin; sayfada izlenebilir.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'title', label: 'Başlık', type: 'text', required: true, localized: true, admin: { width: '45%' } },
            { name: 'url', label: 'YouTube bağlantısı', type: 'text', required: true, admin: { width: '35%' } },
            { name: 'date', label: 'Tarih', type: 'date', admin: { width: '20%', date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' } } },
          ],
        },
      ],
    },
  ],
}
