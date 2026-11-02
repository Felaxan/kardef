import { Libre_Franklin, Source_Serif_4 } from 'next/font/google'
import { notFound } from 'next/navigation'
import React from 'react'
import { Footer } from '@/components/site/Footer'
import { Header, navItems, type TickerItem } from '@/components/site/Header'
import { IconSprite } from '@/components/site/Icons'
import { Motion } from '@/components/site/Motion'
import { PrePaint } from '@/components/site/PrePaint'
import { ScrollChrome } from '@/components/site/ScrollChrome'
import { SmoothScroll } from '@/components/site/SmoothScroll'
import { fmt, isLang, LOCALES, t, type Lang } from '@/i18n/ui'
import { cms, loc } from '@/lib/cms'
import './site.css'
import './pages.css'
import './details.css'

const franklin = Libre_Franklin({ subsets: ['latin', 'latin-ext'], variable: '--font-franklin', display: 'swap' })
const serif = Source_Serif_4({ subsets: ['latin', 'latin-ext'], variable: '--font-sourceserif', display: 'swap', style: ['normal', 'italic'] })

export const dynamic = 'force-dynamic'

// Tema, yazı boyutu ve "js" sınıfı sayfa çizilmeden uygulanır (yanıp sönme olmasın)
const PRE_PAINT = `(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('k-theme');if(t==='light'||t==='dark')d.setAttribute('data-theme',t);var k=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;if(k)d.classList.add('is-dark');var f=parseInt(localStorage.getItem('k-fs')||'0',10);if(f>0)d.classList.add('fs-'+f)}catch(e){}})()`

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLang(lang)) return {}
  const payload = await cms()
  const s = await payload.findGlobal({ slug: 'site-settings', locale: loc(lang), fallbackLocale: false })
  return {
    title: { default: `${s.siteName} · ${s.tagline || t(lang, 'brand.tag')}`, template: `%s · ${s.siteName}` },
    description: t(lang, 'foot.about'),
    icons: { icon: '/brand/kar-def-logo.png' },
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])) },
  }
}

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params
  if (!isLang(raw)) notFound()
  const lang: Lang = raw
  const payload = await cms()

  const [settings, home, breaking, media] = await Promise.all([
    // Çevrilmemiş alanlar boş gelsin; yerine arayüz metni kullanılır
    payload.findGlobal({ slug: 'site-settings', locale: loc(lang), fallbackLocale: false }),
    payload.findGlobal({ slug: 'homepage', locale: loc(lang) }),
    payload.find({ collection: 'posts', where: { breaking: { equals: true } }, sort: '-publishedAt', limit: 6, depth: 0, locale: loc(lang), overrideAccess: false }),
    payload.find({ collection: 'media', where: { credit: { exists: true } }, limit: 50, depth: 0, pagination: false }),
  ])

  const ticker: TickerItem[] = [
    ...breaking.docs.map((p) => ({ text: p.title, href: `/${lang}/haber/${p.slug}`, time: fmt(lang, p.publishedAt, 'dm') })),
    ...(home.tickerExtra ?? []).map((x) => ({ text: x.text, href: x.link || undefined })),
  ]
  const credits = [...new Set(media.docs.map((m) => m.credit).filter((c): c is string => !!c).map((c) => c.replace(/, Wikimedia Commons$/, '')))]
  const siteName = settings.siteName || 'KAR-DEF'

  return (
    <html lang={lang} className={`${franklin.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        <PrePaint code={PRE_PAINT} />
      </head>
      <body>
        <IconSprite />
        <Header
          lang={lang}
          siteName={siteName}
          tagline={settings.tagline || t(lang, 'brand.tag')}
          ticker={ticker}
          notice={home.notice?.enabled ? { text: home.notice.text || '', link: home.notice.link } : null}
        />
        <ScrollChrome lang={lang} items={navItems(lang)} cta={t(lang, 'cta.katki')} totop={t(lang, 'totop')} siteName={siteName} />
        <main id="main">{children}</main>
        <Footer lang={lang} siteName={siteName} note={settings.footerNote || t(lang, 'foot.about')} credits={credits.length ? [`Wikimedia Commons — ${credits.join(', ')}`] : []} />
        <SmoothScroll />
        <Motion />
      </body>
    </html>
  )
}
