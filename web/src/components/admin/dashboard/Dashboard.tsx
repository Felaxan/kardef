import Link from 'next/link'
import type { CollectionSlug, GlobalSlug, Payload, SanitizedPermissions } from 'payload'
import React from 'react'
import { globalShield } from '@/lib/security'
import { CountUp } from './CountUp'
import { KdIcon, type IconName } from './icons'

/*
  KAR-DEF yönetim paneli ana sayfası (Payload'un varsayılan panosunun yerine).
  Rol ne izin veriyorsa o görünür: yazar kendi taslaklarını, editör onay bekleyenleri,
  yönetici her şeyi (reklam, güvenlik ve ayarlar dahil) görür.
*/

type User = { id: number | string; name?: string; role?: 'admin' | 'editor' | 'author' }
type Props = { payload: Payload; user?: User; permissions?: SanitizedPermissions }

type Entry = { slug: string; label: string; hint: string; icon: IconName; kind: 'collection' | 'global'; create?: boolean }
type Group = { title: string; tone?: 'red' | 'purple' | 'ink'; items: Entry[] }

const GROUPS: Group[] = [
  {
    title: 'İçerik',
    tone: 'red',
    items: [
      { slug: 'posts', label: 'Haberler', hint: 'Gündem, köyler, gurbet', icon: 'news', kind: 'collection', create: true },
      { slug: 'announcements', label: 'Duyurular', hint: 'Vefat, düğün, burs, toplantı', icon: 'bell', kind: 'collection', create: true },
      { slug: 'events', label: 'Etkinlikler', hint: 'Karakoçan, Avrupa, çevrim içi', icon: 'calendar', kind: 'collection', create: true },
      { slug: 'live', label: 'Canlı yayın', hint: 'YouTube yayınını aç / kapat', icon: 'live', kind: 'global' },
      { slug: 'media', label: 'Medya', hint: 'Fotoğraf, belge, ses', icon: 'image', kind: 'collection', create: true },
      { slug: 'categories', label: 'Kategoriler', hint: 'Haber başlıkları', icon: 'tag', kind: 'collection', create: true },
    ],
  },
  {
    title: 'Arşiv ve köyler',
    tone: 'purple',
    items: [
      { slug: 'archive', label: 'Arşiv', hint: 'Fotoğraf, belge, sözlü tarih', icon: 'archive', kind: 'collection', create: true },
      { slug: 'submissions', label: 'Gelen katkılar', hint: 'Ziyaretçilerin gönderdikleri', icon: 'inbox', kind: 'collection' },
      { slug: 'villages', label: 'Köyler', hint: 'Köy ve mahalle sayfaları', icon: 'village', kind: 'collection', create: true },
    ],
  },
  {
    title: 'Reklam',
    tone: 'ink',
    items: [
      { slug: 'ad-slots', label: 'Reklam yerleri', hint: 'Üst bant, haber arası, yan alan', icon: 'ad', kind: 'collection' },
      { slug: 'ad-images', label: 'Reklam görselleri', hint: 'Banner dosyaları', icon: 'image', kind: 'collection', create: true },
    ],
  },
  {
    title: 'Yönetim ve güvenlik',
    tone: 'ink',
    items: [
      { slug: 'users', label: 'Kullanıcılar', hint: 'Yönetici, editör, yazar', icon: 'users', kind: 'collection', create: true },
      { slug: 'organizations', label: 'Kurumlar', hint: 'KAR-DEF, AV-KARDEP', icon: 'org', kind: 'collection' },
      { slug: 'homepage', label: 'Ana sayfa', hint: 'Duyuru bandı, son dakika', icon: 'home', kind: 'global' },
      { slug: 'site-settings', label: 'Site ayarları', hint: 'İletişim, sosyal medya, kur şeridi', icon: 'settings', kind: 'global' },
      { slug: 'security-logs', label: 'Güvenlik merkezi', hint: 'Denetim izi, IP engeli, oturumlar', icon: 'shield', kind: 'collection' },
      { slug: 'security-settings', label: 'Güvenlik ayarları', hint: 'Acil koruma modu ve alarmlar', icon: 'lock', kind: 'global' },
    ],
  },
]

const ACTIONS: { href: string; label: string; hint: string; icon: IconName }[] = [
  { href: '/admin/collections/posts/create', label: 'Yeni haber', hint: 'Gündemi güncelle', icon: 'news' },
  { href: '/admin/collections/announcements/create', label: 'Yeni duyuru', hint: 'Vefat, düğün, burs', icon: 'bell' },
  { href: '/admin/collections/events/create', label: 'Yeni etkinlik', hint: 'Takvime ekle', icon: 'calendar' },
  { href: '/admin/collections/archive/create', label: 'Arşive kayıt', hint: 'Fotoğraf, belge, ses', icon: 'archive' },
]

const CONTENT = ['posts', 'announcements', 'events', 'archive'] as const
const TYPE_LABEL: Record<string, string> = { posts: 'Haber', announcements: 'Duyuru', events: 'Etkinlik', archive: 'Arşiv' }
const ROLE_LABEL: Record<string, string> = { admin: 'Yönetici', editor: 'Editör', author: 'Yazar' }

const canRead = (p: SanitizedPermissions | undefined, e: Entry) =>
  e.kind === 'collection' ? Boolean(p?.collections?.[e.slug]?.read) : Boolean(p?.globals?.[e.slug]?.read)
const canCreate = (p: SanitizedPermissions | undefined, slug: string) => Boolean(p?.collections?.[slug]?.create)
const href = (e: Entry) => (e.kind === 'collection' ? `/admin/collections/${e.slug}` : `/admin/globals/${e.slug}`)

function ago(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'az önce'
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} gün önce`
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(iso))
}

const css = (v: Record<string, string | number>) => v as React.CSSProperties

export async function Dashboard({ payload, user, permissions }: Props) {
  const role = user?.role ?? 'author'
  const editor = role === 'admin' || role === 'editor'
  const mine = role === 'author' ? { createdBy: { equals: user?.id } } : undefined
  const count = (collection: CollectionSlug, where?: Record<string, unknown>) =>
    payload.count({ collection, where: where as never, overrideAccess: true }).then((r) => r.totalDocs).catch(() => 0)

  // Özet sayılar
  const nowIso = new Date().toISOString()
  const [posts, notices, upcoming, archive, draftCounts, newSubs, live] = await Promise.all([
    count('posts', { _status: { equals: 'published' } }),
    count('announcements', { _status: { equals: 'published' } }),
    count('events', { and: [{ _status: { equals: 'published' } }, { startDate: { greater_than_equal: nowIso } }] }),
    count('archive', { _status: { equals: 'published' } }),
    Promise.all(CONTENT.map(async (c) => ({ slug: c, label: TYPE_LABEL[c], count: await count(c, { and: [{ _status: { equals: 'draft' } }, ...(mine ? [mine] : [])] }) }))),
    editor ? count('submissions', { status: { equals: 'new' } }) : Promise.resolve(0),
    payload.findGlobal({ slug: 'live' as GlobalSlug, depth: 0 }).catch(() => null) as Promise<{ isLive?: boolean; title?: string } | null>,
  ])
  const drafts = draftCounts.reduce((sum, x) => sum + x.count, 0)
  const waitingDrafts = draftCounts.filter((x) => x.count > 0)
  const firstDraftSlug = waitingDrafts[0]?.slug ?? 'posts'
  const isLockdown = globalShield.isLockdown()

  // Son değişenler (yazar yalnızca kendi kayıtlarını görür)
  const recentLists = await Promise.all(
    CONTENT.map((c) =>
      payload
        .find({ collection: c, sort: '-updatedAt', limit: 6, depth: 0, draft: true, overrideAccess: true, where: mine as never, select: { title: true, _status: true, updatedAt: true } as never })
        .then((r) => r.docs.map((d) => ({ ...(d as unknown as { id: number; title?: string; _status?: string; updatedAt: string }), c })))
        .catch(() => []),
    ),
  )
  const recent = recentLists.flat().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 7)

  // Bölüm kartlarındaki sayılar
  const groups = GROUPS.map((g) => ({ ...g, items: g.items.filter((e) => canRead(permissions, e)) })).filter((g) => g.items.length)
  const counts = Object.fromEntries(
    await Promise.all(
      groups.flatMap((g) => g.items).filter((e) => e.kind === 'collection').map(async (e) => [e.slug, await count(e.slug as CollectionSlug, mine && CONTENT.includes(e.slug as never) ? mine : undefined)] as const),
    ),
  )

  const stats: { label: string; value: number; icon: IconName; href: string; accent?: boolean; show: boolean }[] = [
    { label: 'Yayındaki haber', value: posts, icon: 'news', href: '/admin/collections/posts', show: true },
    { label: 'Duyuru', value: notices, icon: 'bell', href: '/admin/collections/announcements', show: true },
    { label: 'Yaklaşan etkinlik', value: upcoming, icon: 'calendar', href: '/admin/collections/events', show: true },
    { label: 'Arşiv kaydı', value: archive, icon: 'archive', href: '/admin/collections/archive', show: true },
    { label: editor ? 'Onay bekleyen taslak' : 'Taslağım', value: drafts, icon: 'draft', href: `/admin/collections/${firstDraftSlug}?where[_status][equals]=draft`, accent: drafts > 0, show: true },
    { label: 'Yeni katkı', value: newSubs, icon: 'inbox', href: '/admin/collections/submissions?where[status][equals]=new', accent: newSubs > 0, show: editor },
  ]

  const first = user?.name?.split(' ')[0]
  const today = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())
  const hour = Number(new Intl.DateTimeFormat('tr-TR', { hour: 'numeric', hour12: false, timeZone: 'Europe/Istanbul' }).format(new Date()))
  const greet = hour < 6 ? 'İyi geceler' : hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar'

  return (
    <div className="kd-dash">
      {/* Karşılama */}
      <section className="kd-hero">
        <div className="kd-hero-kilim" aria-hidden="true" />
        <div className="kd-hero-in">
          <div className="kd-hero-text">
            <p className="kd-hero-eyebrow"><span>{ROLE_LABEL[role]} paneli</span> · {today}</p>
            <h1 className="kd-hero-title">
              {greet}{first ? <>, <em>{first}</em></> : ''}
            </h1>
            <p className="kd-hero-sub">
              {editor && (drafts > 0 || newSubs > 0)
                ? `Bugün ${[drafts > 0 && `${drafts} taslak onayını`, newSubs > 0 && `${newSubs} yeni katkı incelemeni`].filter(Boolean).join(', ')} bekliyor.`
                : 'Memleketin haberleri ve hafızası, senin elinden geçiyor.'}
            </p>
            {waitingDrafts.length > 0 && (
              <div className="kd-hero-drafts">
                {waitingDrafts.map((w) => (
                  <Link key={w.slug} href={`/admin/collections/${w.slug}?where[_status][equals]=draft`} className="kd-hero-chip">
                    <b>{w.count}</b> {w.label.toLocaleLowerCase('tr')} taslağı →
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="kd-hero-side">
            {isLockdown && role === 'admin' && (
              <Link href="/admin/collections/security-logs" className="kd-live is-on">
                <KdIcon name="lock" size={16} />Acil koruma modu AÇIK
              </Link>
            )}
            {live?.isLive ? (
              <Link href="/admin/globals/live" className="kd-live is-on"><span className="kd-live-dot" />Şu an CANLI yayındasınız</Link>
            ) : editor ? (
              <Link href="/admin/globals/live" className="kd-live"><KdIcon name="live" size={18} />Canlı yayın kapalı</Link>
            ) : null}
            <a className="kd-hero-site" href="/" target="_blank" rel="noreferrer">Siteyi aç <KdIcon name="external" size={16} /></a>
          </div>
        </div>
      </section>

      {/* Özet sayılar */}
      <section className="kd-stats" aria-label="Özet">
        {stats.filter((s) => s.show).map((s, i) => (
          <Link key={s.label} href={s.href} className={`kd-stat${s.accent ? ' is-accent' : ''}`} style={css({ '--i': i })}>
            <span className="kd-stat-ico"><KdIcon name={s.icon} /></span>
            <b className="kd-stat-n"><CountUp value={s.value} delay={150 + i * 90} /></b>
            <span className="kd-stat-l">{s.label}</span>
          </Link>
        ))}
      </section>

      <div className="kd-dash-grid">
        {/* Hızlı işlemler */}
        <section className="kd-panel kd-quick">
          <h2 className="kd-panel-title">Hızlı ekle</h2>
          <div className="kd-quick-grid">
            {ACTIONS.filter((a) => canCreate(permissions, a.href.split('/')[3])).map((a, i) => (
              <Link key={a.href} href={a.href} className="kd-q" style={css({ '--i': i })}>
                <span className="kd-q-ico"><KdIcon name={a.icon} /><span className="kd-q-plus"><KdIcon name="plus" size={14} /></span></span>
                <b>{a.label}</b>
                <small>{a.hint}</small>
              </Link>
            ))}
          </div>
        </section>

        {/* Son değişenler */}
        <section className="kd-panel kd-recent">
          <h2 className="kd-panel-title">{role === 'author' ? 'Son yazdıkların' : 'Son değişenler'}</h2>
          {recent.length === 0 ? (
            <p className="kd-empty">Henüz bir şey yok. Yukarıdan ilk içeriği ekleyebilirsin.</p>
          ) : (
            <ol className="kd-recent-list">
              {recent.map((r, i) => (
                <li key={`${r.c}-${r.id}`} style={css({ '--i': i })}>
                  <Link href={`/admin/collections/${r.c}/${r.id}`}>
                    <span className={`kd-type t-${r.c}`}>{TYPE_LABEL[r.c]}</span>
                    <span className="kd-recent-title">{r.title || 'Başlıksız'}</span>
                    <span className={`kd-status ${r._status === 'published' ? 'is-pub' : 'is-draft'}`}>{r._status === 'published' ? 'Yayında' : 'Taslak'}</span>
                    <time>{ago(r.updatedAt)}</time>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Bölümler */}
      {groups.map((g, gi) => (
        <section key={g.title} className={`kd-group tone-${g.tone ?? 'red'}`} style={css({ '--g': gi })}>
          <h2 className="kd-group-title"><span>{g.title}</span></h2>
          <div className="kd-cards">
            {g.items.map((e, i) => (
              <div key={e.slug} className="kd-card" style={css({ '--i': i })}>
                <Link href={href(e)} className="kd-card-link">
                  <span className="kd-card-ico"><KdIcon name={e.icon} /></span>
                  <span className="kd-card-body">
                    <b>{e.label}</b>
                    <small>{e.hint}</small>
                  </span>
                  {e.kind === 'collection' && <span className="kd-card-n">{(counts[e.slug] ?? 0).toLocaleString('tr-TR')}</span>}
                  <span className="kd-card-arrow"><KdIcon name="arrow" size={18} /></span>
                </Link>
                {e.create && e.kind === 'collection' && canCreate(permissions, e.slug) && (
                  <Link href={`/admin/collections/${e.slug}/create`} className="kd-card-add" aria-label={`${e.label}: yeni ekle`} title="Yeni ekle">
                    <KdIcon name="plus" size={16} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Kısa kullanım rehberi */}
      <details className="kd-guide">
        <summary>
          <span className="kd-guide-ico"><KdIcon name="help" size={18} /></span>
          <span>Kısa kullanım rehberi ve ipuçları</span>
        </summary>
        <ul className="kd-guide-list">
          <li>İçeriği önce <b>Türkçe</b> yazın. Sağ üstteki <b>dil seçiciden</b> diğer 6 dile (Kurdî, Kirmanckî/Zazakî, English, Deutsch, Nederlands, Français) geçebilirsiniz; çevrilmeyen diller sitede Türkçe görünür.</li>
          <li><b>Kirmanckî (Zazaca)</b> otomatik çevrilmez; sağ üstten <i>Kirmanckî (Zazakî)</i> dilini seçip elle girebilirsiniz.</li>
          <li>Yazdıklarınız her <b>3 saniyede bir</b> otomatik taslak olarak kaydedilir. Hazır olduğunda <b>Yayınla</b> düğmesine basın.</li>
          <li><b>Yazar</b> rolündeyseniz içeriklerinizi taslak olarak kaydedersiniz; bir <b>Editör</b> veya <b>Yönetici</b> kontrol edip yayınlar.</li>
          <li><b>Arşiv</b> kayıtlarında sahibinden <b>yayın izni</b> alındığı kutusu işaretlenmeden kayıt yayınlanamaz.</li>
          <li>Ziyaretçilerin gönderdiği arşiv materyallerini <b>Gelen katkılar</b> bölümünde inceleyip tek tıkla <b>Arşive aktar</b> diyerek taslağa dönüştürebilirsiniz.</li>
        </ul>
      </details>
    </div>
  )
}
