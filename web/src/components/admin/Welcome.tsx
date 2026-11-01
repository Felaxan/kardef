import Link from 'next/link'
import type { CollectionSlug, ServerProps } from 'payload'
import React from 'react'

const actions: { href: string; label: string; hint: string }[] = [
  { href: '/admin/collections/posts/create', label: 'Yeni haber', hint: 'Gündem, köyler, gurbet' },
  { href: '/admin/collections/announcements/create', label: 'Yeni duyuru', hint: 'Vefat, burs, toplantı' },
  { href: '/admin/collections/events/create', label: 'Yeni etkinlik', hint: 'Karakoçan, Avrupa, çevrim içi' },
  { href: '/admin/collections/archive/create', label: 'Arşive kayıt ekle', hint: 'Fotoğraf, belge, ses' },
]

const draftCollections: { slug: CollectionSlug; label: string }[] = [
  { slug: 'posts', label: 'Haber' },
  { slug: 'announcements', label: 'Duyuru' },
  { slug: 'events', label: 'Etkinlik' },
  { slug: 'archive', label: 'Arşiv kaydı' },
]

const roleLabel: Record<string, string> = { admin: 'Yönetici paneli', editor: 'Editör paneli', author: 'Yazar paneli' }

const adminLinks = [
  { href: '/admin/collections/users/create', label: 'Kişi ekle' },
  { href: '/admin/collections/users', label: 'Kullanıcılar' },
  { href: '/admin/collections/organizations', label: 'Kurumlar' },
  { href: '/admin/globals/site-settings', label: 'Site ayarları' },
]

export async function Welcome({ payload, user }: ServerProps) {
  const u = user as { name?: string; role?: string } | undefined
  const canPublish = u?.role === 'admin' || u?.role === 'editor'

  let waiting: { slug: string; label: string; count: number }[] = []
  if (canPublish && payload) {
    waiting = await Promise.all(
      draftCollections.map(async (c) => {
        const { totalDocs } = await payload.count({
          collection: c.slug,
          where: { _status: { equals: 'draft' } },
          overrideAccess: true,
        })
        return { slug: c.slug, label: c.label, count: totalDocs }
      }),
    )
    waiting = waiting.filter((w) => w.count > 0)
  }

  return (
    <section className="kd-welcome">
      <div className="kd-welcome-head">
        <div>
          <p className="kd-eyebrow">{u?.role ? roleLabel[u.role] : ''}</p>
          <h2>Hoş geldin{u?.name ? `, ${u.name.split(' ')[0]}` : ''}</h2>
          <p className="kd-sub">Ne eklemek istersin?</p>
        </div>
        <a className="kd-site" href="/" target="_blank" rel="noreferrer">Siteyi aç ↗</a>
      </div>

      <div className="kd-actions">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className="kd-action">
            <b>{a.label}</b>
            <span>{a.hint}</span>
          </Link>
        ))}
      </div>

      {canPublish && waiting.length > 0 && (
        <div className="kd-waiting">
          <b>Yayın bekleyen taslaklar:</b>
          {waiting.map((w) => (
            <Link key={w.slug} href={`/admin/collections/${w.slug}?where[_status][equals]=draft`}>
              {w.count} {w.label.toLocaleLowerCase('tr')}
            </Link>
          ))}
        </div>
      )}

      {u?.role === 'admin' && (
        <div className="kd-adminbar">
          <b>Yönetim:</b>
          {adminLinks.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </div>
      )}

      <details className="kd-tips">
        <summary>Kısa kullanım rehberi</summary>
        <ul>
          <li>Haberi önce <b>Türkçe</b> yazın. Diğer dillere sağ üstteki <b>dil seçiciden</b> geçip aynı haberi çevirebilirsiniz; çevrilmeyen diller Türkçe görünür.</li>
          <li>Yazdıklarınız birkaç saniyede bir <b>otomatik kaydedilir</b>. Hazır olunca <b>Yayınla</b>'ya basın.</li>
          <li><b>Yazar</b> rolündeyseniz yayınlayamazsınız; taslak kaydedin, editör kontrol edip yayınlar.</li>
          <li>Fotoğraf eklerken "Görselde ne var?" ve "Fotoğrafçı / kaynak" alanlarını doldurun.</li>
          <li>Arşive kayıt eklerken sahibinden <b>yayın izni</b> alındığını işaretlemeden yayınlanamaz.</li>
        </ul>
      </details>
    </section>
  )
}
