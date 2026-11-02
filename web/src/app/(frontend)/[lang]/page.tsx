import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'
import { ArchiveExplorer, type ArcCard, type DecadeBar } from '@/components/site/ArchiveExplorer'
import { EventsBlock, type EventCard } from '@/components/site/EventsBlock'
import { HeroSlider, type Slide } from '@/components/site/HeroSlider'
import { Ico } from '@/components/site/Icons'
import { NewsletterForm } from '@/components/site/NewsletterForm'
import { decadeLabel, fmt, isLang, t, type Lang } from '@/i18n/ui'
import { cms, isMedia, loc, mediaUrl, waveBars, youTubeId } from '@/lib/cms'
import { ALPHABET, announcementTypeLabel, archiveTypeLabel, archiveYear, categoryName, firstLetter, kurumLabel } from '@/lib/labels'
import type { Archive as ArchiveItem, Post } from '@/payload-types'

export const dynamic = 'force-dynamic'

const css = (v: Record<string, string | number>) => v as React.CSSProperties

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  if (!isLang(raw)) notFound()
  const lang: Lang = raw
  const L = (k: string) => t(lang, k)
  const locale = loc(lang)
  const payload = await cms()
  const now = new Date()

  const [featured, latest, events, notices, archive, villages, orgs, home, settings] = await Promise.all([
    payload.find({ collection: 'posts', where: { featured: { equals: true } }, sort: '-publishedAt', limit: 4, depth: 1, locale, overrideAccess: false }),
    payload.find({ collection: 'posts', sort: '-publishedAt', limit: 12, depth: 1, locale, overrideAccess: false }),
    payload.find({ collection: 'events', where: { startDate: { greater_than_equal: new Date(now.getTime() - 864e5).toISOString() } }, sort: 'startDate', limit: 4, depth: 0, locale, overrideAccess: false }),
    payload.find({ collection: 'announcements', sort: '-publishedAt', limit: 5, depth: 0, locale, overrideAccess: false }),
    payload.find({ collection: 'archive', sort: 'year', limit: 300, depth: 1, locale, overrideAccess: false }),
    payload.find({ collection: 'villages', sort: 'name', limit: 500, depth: 0, pagination: false, select: { name: true, slug: true } }),
    payload.find({ collection: 'organizations', sort: 'founded', limit: 10, depth: 1, locale }),
    payload.findGlobal({ slug: 'homepage', locale }),
    payload.findGlobal({ slug: 'site-settings', locale }),
  ])

  /* ---------- Manşet ---------- */
  const heroPosts: Post[] = [...featured.docs]
  for (const p of latest.docs) if (heroPosts.length < 4 && !heroPosts.some((h) => h.id === p.id) && p.heroImage) heroPosts.push(p)
  const slides: Slide[] = heroPosts.map((p) => ({
    href: `/${lang}/haber/${p.slug}`,
    img: mediaUrl(p.heroImage, 'hero'),
    alt: isMedia(p.heroImage) ? p.heroImage.alt || '' : '',
    kicker: categoryName(p.category),
    title: p.title,
    excerpt: p.excerpt || undefined,
    metaBy: kurumLabel(p.kurum),
    metaDate: fmt(lang, p.publishedAt),
    credit: isMedia(p.heroImage) && p.heroImage.credit ? `${L('foot.photos')}: ${p.heroImage.credit.replace(/, Wikimedia Commons$/, '')}` : undefined,
    short: p.title.length > 34 ? `${p.title.slice(0, 32).trim()}…` : p.title,
  }))

  /* ---------- Gündem ---------- */
  const heroIds = new Set(heroPosts.map((p) => p.id))
  const cards = latest.docs.filter((p) => !heroIds.has(p.id)).slice(0, 4)
  const side = latest.docs.slice(0, 4)

  /* ---------- Etkinlikler ---------- */
  // Avrupa etkinlikleri Orta Avrupa saatiyle, diğerleri Türkiye saatiyle
  const evTz = (r: string) => (r === 'avrupa' ? 'Europe/Berlin' : 'Europe/Istanbul')
  const evCards: EventCard[] = events.docs.map((e) => ({
    href: `/${lang}/etkinlik/${e.slug}`,
    region: e.region,
    day: fmt(lang, e.startDate, 'dm', evTz(e.region)).match(/\d+/)?.[0] ?? '',
    month: fmt(lang, e.startDate, 'month', evTz(e.region)),
    weekday: fmt(lang, e.startDate, 'weekday', evTz(e.region)),
    title: e.title,
    place: e.place || (e.region === 'online' ? L('ev.online') : ''),
    time: fmt(lang, e.startDate, 'time', evTz(e.region)),
    tag: e.kurum === 'ortak' ? L('ev.joint') : kurumLabel(e.kurum),
    eu: e.region === 'avrupa' || e.kurum === 'avkardep',
  }))

  /* ---------- Arşiv ---------- */
  const items = archive.docs as ArchiveItem[]
  const decadeOf = (a: ArchiveItem) => a.decade ?? Math.floor(a.year / 10) * 10
  const minD = Math.min(1950, ...items.map(decadeOf))
  const maxD = Math.max(2020, ...items.map(decadeOf))
  const counts = new Map<number, number>()
  items.forEach((a) => counts.set(decadeOf(a), (counts.get(decadeOf(a)) ?? 0) + 1))
  const maxCount = Math.max(1, ...counts.values())
  const decades: DecadeBar[] = []
  for (let y = minD; y <= maxD; y += 10) {
    const c = counts.get(y) ?? 0
    decades.push({ y, label: decadeLabel(lang, y), count: c, h: c ? Math.max(0.08, c / maxCount) : 0.03 })
  }
  const arcCards: ArcCard[] = items.map((a) => {
    const img = (a.files ?? []).find((f) => isMedia(f) && f.mimeType?.startsWith('image'))
    const yt = youTubeId(a.videoUrl)
    const vis: ArcCard['vis'] =
      img && isMedia(img) ? { kind: 'img', src: mediaUrl(img, 'card')!, alt: img.alt || a.title }
      : yt ? { kind: 'img', src: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`, alt: a.title }
      : a.type === 'clipping' ? { kind: 'clip' }
      : a.type === 'audio' || a.type === 'oral' ? { kind: 'wave', bars: waveBars(Number(a.id)) }
      : { kind: Number(a.id) % 2 ? 'doc2' : 'doc' }
    return {
      id: a.id, href: `/${lang}/arsiv/${a.slug}`, decade: decadeOf(a), title: a.title,
      typeLabel: archiveTypeLabel(lang, a.type), yearLabel: archiveYear(lang, a),
      source: a.donor || undefined, featured: !!a.featuredOnHome, vis,
    }
  })
  const istParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', day: 'numeric', month: 'numeric' }).formatToParts(now)
  const today = { d: +(istParts.find((p) => p.type === 'day')?.value ?? 0), m: istParts.find((p) => p.type === 'month')?.value ?? '' }
  const onThisDay = items.filter((a) => a.day === today.d && a.month === today.m)
  const typeCounts = [
    ['type.photo', ['photo']], ['type.doc', ['document']], ['type.clip', ['clipping']],
    ['type.audio', ['audio']], ['type.oral', ['oral']], ['type.video', ['video']],
  ].map(([k, types]) => [k as string, items.filter((a) => (types as string[]).includes(a.type)).length] as const)

  /* ---------- Köyler ---------- */
  const letters = new Set(villages.docs.map((v) => firstLetter(v.name)))

  const arcSide = (
    <aside className="arc-side">
      <div className="otd" data-reveal="">
        <h3 className="sec-label">{L('arc.otd')}</h3>
        <p className="otd-date">{fmt(lang, now, 'dm')}</p>
        <p className="otd-note">{onThisDay.length ? L('arc.otdnote').replace(/\d+/, String(onThisDay.length)) : '—'}</p>
        <ul>
          {onThisDay.slice(0, 4).map((a) => (
            <li key={a.id}><span>{a.year}</span><Link href={`/${lang}/arsiv/${a.slug}`}><span className="ul">{a.title}</span></Link></li>
          ))}
        </ul>
      </div>
      <div data-reveal="" style={css({ '--i': 1 })}>
        <h3 className="sec-label">{L('arc.bytype')}</h3>
        <ul className="types">
          {typeCounts.map(([k, c]) => (
            <li key={k}><a href="#arsiv"><b>{L(k)}</b><span data-count={c}>{c}</span></a></li>
          ))}
        </ul>
      </div>
    </aside>
  )

  return (
    <>
      <h1 className="sr">{settings.siteName} — {settings.tagline}</h1>

      {/* Manşet + son eklenenler */}
      <section className="wrap hero" aria-label={L('nav.gundem')}>
        <HeroSlider slides={slides} seconds={home.heroSeconds || 7} labels={{ prev: '‹', next: '›' }} />
        <aside className="side intro" style={css({ '--d': 5 })}>
          <div>
            <h2 className="sec-label"><span>{L('side.latest')}</span><Link href={`/${lang}/haberler`}>{L('more.all')}</Link></h2>
            <ol className="latest">
              {side.map((p) => (
                <li key={p.id}>
                  <time>{fmt(lang, p.publishedAt, 'dm').replace(/\s.*/, '')}</time>
                  <Link href={`/${lang}/haber/${p.slug}`}><span className="ul">{p.title}</span></Link>
                  <span className="loc">{categoryName(p.category) ?? kurumLabel(p.kurum)}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="sec-label"><span>{L('not.title')}</span><Link href={`/${lang}/duyurular`}>{L('more.all')}</Link></h2>
            <ul className="side-notices">
              {notices.docs.slice(0, 3).map((n) => (
                <li key={n.id}>
                  <span className={`cat ${n.type}`}>{announcementTypeLabel(lang, n.type)}</span>
                  <Link href={`/${lang}/duyuru/${n.slug}`}><span className="ul">{n.title}</span></Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      {/* Gündem */}
      <section className="wrap sec" id="gundem">
        <header className="sec-head" data-reveal="">
          <h2>{L('sec.gundem')}</h2>
          <Link href={`/${lang}/haberler`} className="more"><span>{L('more.all')}</span><Ico name="arrow" /></Link>
        </header>
        <div className="cards">
          {cards.map((p, i) => {
            const src = mediaUrl(p.heroImage, 'card')
            return (
              <article key={p.id} className={`card${src ? '' : ' card-noimg'}`} data-reveal={src ? 'img' : ''} style={css({ '--i': i })}>
                {src && (
                  <Link href={`/${lang}/haber/${p.slug}`} className="card-img">
                    <img src={src} alt={isMedia(p.heroImage) ? p.heroImage.alt || '' : ''} loading="lazy" />
                  </Link>
                )}
                {categoryName(p.category) && <span className="kicker">{categoryName(p.category)}</span>}
                <h3><Link href={`/${lang}/haber/${p.slug}`}><span className="ul">{p.title}</span></Link></h3>
                {p.excerpt && <p className="dek">{p.excerpt}</p>}
                <p className="meta"><b>{kurumLabel(p.kurum)}</b> · {fmt(lang, p.publishedAt, 'dm')}</p>
              </article>
            )
          })}
        </div>
      </section>

      {/* Etkinlikler */}
      <section className="wrap sec" id="etkinlikler">
        <EventsBlock
          events={evCards}
          moreHref={`/${lang}/etkinlikler`}
          labels={{ title: L('ev.title'), all: L('ev.all'), tr: L('ev.tr'), eu: L('ev.eu'), more: L('ev.more'), none: L('ev.none') }}
        />
      </section>

      {/* Arşiv */}
      <section className="band" id="arsiv" aria-labelledby="arsiv-baslik">
        <div className="wrap">
          <header className="arc-head">
            <div data-reveal="">
              <span className="kicker">{L('arc.kicker')}</span>
              <h2 id="arsiv-baslik">{L('arc.title')}</h2>
            </div>
            <p className="arc-intro" data-reveal="" style={css({ '--i': 1 })}>{L('arc.intro')}</p>
          </header>
          <ArchiveExplorer
            decades={decades}
            total={items.length}
            cards={arcCards}
            side={arcSide}
            contributeHref={`/${lang}#katki`}
            openAllHref={`/${lang}/arsiv`}
            labels={{
              alldec: L('arc.alldec'), records: L('arc.records'), openall: L('arc.openall'),
              wantedT: L('arc.wanted.t'), wantedP: L('arc.wanted.p'), wantedBtn: L('arc.wanted.btn'), photo: L('type.photo'),
            }}
          />
        </div>
      </section>

      {/* Duyurular + köy rehberi */}
      <div className="wrap split">
        <section id="duyurular">
          <header className="sec-head" data-reveal="">
            <h2>{L('not.title')}</h2>
            <Link href={`/${lang}/duyurular`} className="more"><span>{L('not.all')}</span><Ico name="arrow" /></Link>
          </header>
          <ul className="notices">
            {notices.docs.map((n, i) => (
              <li key={n.id} data-reveal="" style={css({ '--i': i })}>
                <span className={`cat ${n.type}`}>{announcementTypeLabel(lang, n.type)}</span>
                <Link href={`/${lang}/duyuru/${n.slug}`}><span className="ul">{n.title}</span></Link>
                <time>{fmt(lang, n.publishedAt, 'dm')}</time>
              </li>
            ))}
          </ul>
        </section>

        <section className="villages" id="koyler">
          <header className="sec-head" data-reveal=""><h2>{L('vil.title')}</h2></header>
          <p className="lede" data-reveal="">{L('vil.lede')}</p>
          <nav className="alpha" aria-label={L('vil.title')} data-reveal="" style={css({ '--i': 1 })}>
            {ALPHABET.map((ch) =>
              letters.has(ch)
                ? <Link key={ch} href={`/${lang}/koyler#harf-${ch}`}>{ch}</Link>
                : <span key={ch} className="off">{ch}</span>,
            )}
          </nav>
          <form className="vsearch" role="search" action={`/${lang}/ara`} data-reveal="" style={css({ '--i': 2 })}>
            <input type="hidden" name="tur" value="koy" />
            <label htmlFor="vq" className="sr">{L('vil.ph')}</label>
            <input id="vq" name="q" type="search" placeholder={L('vil.ph')} />
            <button type="submit">{L('vil.btn')}</button>
          </form>
        </section>
      </div>

      {/* Kurumlar */}
      <section className="wrap sec" id="kurumlar">
        <header className="sec-head" data-reveal=""><h2>{L('org.title')}</h2></header>
        <div className="org-grid">
          {orgs.docs.map((o, i) => (
            <article key={o.id} className={`org${o.color === 'mor' ? ' av' : ''}`} data-reveal="" style={css({ '--i': i })}>
              {mediaUrl(o.logo) && <img className="org-seal" src={mediaUrl(o.logo)!} alt={`${o.abbr}`} loading="lazy" />}
              <div>
                <p className="org-abbr">{o.abbr}</p>
                <h3>{o.name}</h3>
                {o.description && <p className="desc">{o.description}</p>}
                <dl>
                  {o.founded && <div><dt>{L('org.since')}</dt><dd>{o.founded}</dd></div>}
                  {o.base && <div><dt>{L('org.base')}</dt><dd>{o.base}</dd></div>}
                </dl>
                {o.contact?.email && <a href={`mailto:${o.contact.email}`} className="more"><span>{o.contact.email}</span><Ico name="arrow" /></a>}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Katkı + bülten */}
      <div className="wrap">
        <div className="joins" id="katki">
          <section className="join join-a" data-reveal="">
            <img className="seal-bg" src="/brand/kar-def-logo.png" alt="" />
            <span className="kicker">{L('join.k1')}</span>
            <h2>{L('join.h1')}</h2>
            <p>{L('join.p1')}</p>
            <a href={settings.contact?.email ? `mailto:${settings.contact.email}` : `/${lang}/kurumlar`} className="btn">
              <span>{L('join.b1')}</span><Ico name="arrow" />
            </a>
          </section>
          <section className="join join-b" data-reveal="" style={css({ '--i': 1 })}>
            <span className="kicker">{L('join.k2')}</span>
            <h2>{L('join.h2')}</h2>
            <p>{L('join.p2')}</p>
            <NewsletterForm labels={{ ph: L('join.ph'), btn: L('join.b2'), soon: L('join.soon') }} />
            {settings.contact?.whatsapp && (
              <a href={settings.contact.whatsapp} className="alt" target="_blank" rel="noreferrer"><Ico name="chat" /><span className="ul">{L('join.wa')}</span></a>
            )}
          </section>
        </div>
      </div>
    </>
  )
}
